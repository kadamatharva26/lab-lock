const express = require("express");
const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { HttpError } = require("../middleware/errorHandler");
const { findConflicts } = require("../lib/conflict");
const { canTransition } = require("../lib/stateMachine");

const router = express.Router();

const MAX_BOOKING_HOURS = 4;
const MAX_BOOKING_DAYS_AHEAD = 30;

const CreateBookingSchema = z.object({
  equipmentId: z.string().uuid(),
  startTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid startTime"),
  endTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid endTime"),
  purpose: z.string().min(3).max(240),
});

const TransitionSchema = z.object({
  status: z.enum(["approved", "rejected", "in_use", "returned", "cancelled"]),
  rejectReason: z.string().max(500).optional(),
  returnedCondition: z.enum(["good", "needs_service", "broken"]).optional(),
  note: z.string().max(500).optional(),
});

/**
 * GET /bookings — listing with filters
 *   ?status=requested|approved|...
 *   ?mine=1                  → only the caller's bookings
 *   ?equipmentId=...
 *   ?from=ISO&to=ISO
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.equipmentId) where.equipmentId = req.query.equipmentId;
    if (req.query.mine === "1" || req.user.role === "student") {
      where.requesterId = req.user.userId;
    }
    if (req.query.from) where.endTime = { gt: new Date(req.query.from) };
    if (req.query.to)
      where.startTime = { ...(where.startTime || {}), lt: new Date(req.query.to) };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startTime: "desc" },
      take: 100,
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            category: true,
            labRoom: { select: { name: true } },
          },
        },
        requester: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ data: bookings });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /bookings/:id  — detail with full status history
 */
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        equipment: {
          include: {
            labRoom: true,
            supervisor: { select: { id: true, name: true } },
          },
        },
        requester: { select: { id: true, name: true, email: true } },
        history: {
          orderBy: { createdAt: "asc" },
          include: { actor: { select: { id: true, name: true, role: true } } },
        },
      },
    });
    if (!booking) throw new HttpError(404, "not_found", "Booking not found");
    if (
      req.user.role === "student" &&
      booking.requesterId !== req.user.userId
    ) {
      throw new HttpError(403, "forbidden", "Not your booking");
    }
    res.json({ data: booking });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /bookings — create with three-way conflict check.
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const data = CreateBookingSchema.parse(req.body);
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const now = new Date();

    if (endTime <= startTime) {
      throw new HttpError(400, "invalid_range", "endTime must be after startTime");
    }
    if (startTime < now) {
      throw new HttpError(400, "past_time", "Cannot book in the past");
    }
    const hours = (endTime - startTime) / 1000 / 60 / 60;
    if (hours > MAX_BOOKING_HOURS) {
      throw new HttpError(
        400,
        "too_long",
        `Bookings cannot exceed ${MAX_BOOKING_HOURS} hours`
      );
    }
    const daysAhead = (startTime - now) / 1000 / 60 / 60 / 24;
    if (daysAhead > MAX_BOOKING_DAYS_AHEAD) {
      throw new HttpError(
        400,
        "too_far_ahead",
        `Cannot book more than ${MAX_BOOKING_DAYS_AHEAD} days ahead`
      );
    }

    // Three-way conflict check
    const conflicts = await findConflicts(prisma, {
      equipmentId: data.equipmentId,
      startTime,
      endTime,
    });
    if (conflicts.length) {
      return res.status(409).json({
        error: {
          code: "conflict",
          message: "Booking conflicts detected",
          details: conflicts,
        },
      });
    }

    // Create booking + initial history row in one transaction
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          equipmentId: data.equipmentId,
          requesterId: req.user.userId,
          startTime,
          endTime,
          purpose: data.purpose,
          status: "requested",
        },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: created.id,
          actorId: req.user.userId,
          fromStatus: null,
          toStatus: "requested",
          note: "Booking submitted",
        },
      });
      return created;
    });

    res.status(201).json({ data: booking });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /bookings/:id/status — drive the state machine.
 */
router.patch("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const data = TransitionSchema.parse(req.body);

    const existing = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { equipment: { select: { supervisorId: true } } },
    });
    if (!existing) throw new HttpError(404, "not_found", "Booking not found");

    const isOwner = existing.requesterId === req.user.userId;
    // For supervisor role: only allow if they are the equipment's supervisor
    let effectiveRole = req.user.role;
    if (
      req.user.role === "supervisor" &&
      existing.equipment.supervisorId !== req.user.userId
    ) {
      effectiveRole = "student"; // demote — they have no special powers here
    }

    const check = canTransition(existing.status, data.status, {
      role: effectiveRole,
      isOwner,
    });
    if (!check.ok) {
      throw new HttpError(422, "invalid_transition", check.reason, {
        allowed: check.allowed,
      });
    }

    if (data.status === "rejected" && !data.rejectReason) {
      throw new HttpError(400, "missing_reason", "rejectReason required when rejecting");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.booking.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          rejectReason: data.status === "rejected" ? data.rejectReason : existing.rejectReason,
          returnedCondition:
            data.status === "returned" ? data.returnedCondition || null : existing.returnedCondition,
        },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: existing.id,
          actorId: req.user.userId,
          fromStatus: existing.status,
          toStatus: data.status,
          note: data.note || null,
        },
      });
      return u;
    });

    res.json({ data: updated });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
