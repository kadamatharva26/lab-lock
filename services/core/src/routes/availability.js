const express = require("express");
const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { HttpError } = require("../middleware/errorHandler");

const router = express.Router();

const AvailabilitySchema = z.object({
  day: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date"),
  isAvailable: z.boolean(),
  reason: z.string().max(200).optional().nullable(),
});

/**
 * GET /availability?supervisorId=...
 * Lists upcoming availability entries for a supervisor.
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const supervisorId = req.query.supervisorId || req.user.userId;
    const entries = await prisma.supervisorAvailability.findMany({
      where: {
        supervisorId,
        day: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      orderBy: { day: "asc" },
    });
    res.json({ data: entries });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /availability
 * Supervisors can manage their own; admins can manage anyone's.
 */
router.post("/", requireAuth, requireRole("admin", "supervisor"), async (req, res, next) => {
  try {
    const data = AvailabilitySchema.parse(req.body);
    const supervisorId = req.body.supervisorId || req.user.userId;

    if (req.user.role === "supervisor" && supervisorId !== req.user.userId) {
      throw new HttpError(403, "forbidden", "Supervisors can only manage their own availability");
    }

    const day = new Date(data.day);
    day.setUTCHours(0, 0, 0, 0);

    const entry = await prisma.supervisorAvailability.upsert({
      where: { supervisorId_day: { supervisorId, day } },
      create: {
        supervisorId,
        day,
        isAvailable: data.isAvailable,
        reason: data.reason ?? null,
      },
      update: {
        isAvailable: data.isAvailable,
        reason: data.reason ?? null,
      },
    });
    res.status(201).json({ data: entry });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
