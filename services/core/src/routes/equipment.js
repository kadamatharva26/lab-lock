const express = require("express");
const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { HttpError } = require("../middleware/errorHandler");
const { ACTIVE_STATUSES } = require("../lib/conflict");

const router = express.Router();

const EquipmentCreate = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(50),
  condition: z.enum(["good", "needs_service", "broken"]).default("good"),
  quantity: z.number().int().positive().max(1000),
  labRoomId: z.string().uuid(),
  supervisorId: z.string().uuid().nullable().optional(),
});
const EquipmentUpdate = EquipmentCreate.partial();

/**
 * GET /equipment
 * Query params: page, pageSize, category, search, available
 *   available=YYYY-MM-DD → flag equipment as booked-on-date for the list view
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || "20", 10)));
    const where = { isActive: true };
    if (req.query.category) where.category = req.query.category;
    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search, mode: "insensitive" } },
        { category: { contains: req.query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
        include: {
          labRoom: { select: { id: true, name: true, building: true } },
          supervisor: { select: { id: true, name: true } },
        },
      }),
      prisma.equipment.count({ where }),
    ]);

    let availabilityMap = {};
    if (req.query.available) {
      const day = new Date(req.query.available);
      if (!Number.isNaN(day.getTime())) {
        const dayStart = new Date(day);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
        const busy = await prisma.booking.findMany({
          where: {
            equipmentId: { in: items.map((i) => i.id) },
            status: { in: ACTIVE_STATUSES },
            startTime: { lt: dayEnd },
            endTime: { gt: dayStart },
          },
          select: { equipmentId: true },
        });
        availabilityMap = busy.reduce((acc, b) => ((acc[b.equipmentId] = true), acc), {});
      }
    }

    res.json({
      data: items.map((i) => ({ ...i, busyOnDate: !!availabilityMap[i.id] })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /equipment/:id  — detail + upcoming bookings
 */
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const item = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: {
        labRoom: { select: { id: true, name: true, building: true } },
        supervisor: { select: { id: true, name: true, email: true } },
      },
    });
    if (!item) throw new HttpError(404, "not_found", "Equipment not found");

    const upcoming = await prisma.booking.findMany({
      where: {
        equipmentId: item.id,
        status: { in: ACTIVE_STATUSES },
        endTime: { gt: new Date() },
      },
      orderBy: { startTime: "asc" },
      take: 20,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        // hide requester name for non-admins (privacy)
        requester:
          req.user.role === "admin" || req.user.role === "supervisor"
            ? { select: { id: true, name: true } }
            : false,
      },
    });

    res.json({ data: { ...item, upcoming } });
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const data = EquipmentCreate.parse(req.body);
    const item = await prisma.equipment.create({ data });
    res.status(201).json({ data: item });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const data = EquipmentUpdate.parse(req.body);
    const item = await prisma.equipment.update({ where: { id: req.params.id }, data });
    res.json({ data: item });
  } catch (e) {
    next(e);
  }
});

/** Soft delete */
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    await prisma.equipment.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
