const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /dashboard/summary  — admin summary in a single round-trip.
 */
router.get("/summary", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      totalEquipment,
      activeToday,
      pending,
      thisWeek,
      utilization,
    ] = await Promise.all([
      prisma.equipment.count({ where: { isActive: true } }),
      prisma.booking.count({
        where: {
          status: { in: ["approved", "in_use"] },
          startTime: { lt: endOfDay },
          endTime: { gt: startOfDay },
        },
      }),
      prisma.booking.count({ where: { status: "requested" } }),
      prisma.booking.count({
        where: { status: { in: ["approved", "in_use", "returned"] }, startTime: { gte: startOfWeek } },
      }),
      // Utilization: total booked hours per equipment over last 30 days
      prisma.booking.findMany({
        where: {
          status: { in: ["approved", "in_use", "returned"] },
          startTime: { gte: thirtyDaysAgo },
        },
        select: {
          equipmentId: true,
          startTime: true,
          endTime: true,
          equipment: { select: { id: true, name: true, category: true } },
        },
      }),
    ]);

    const utilByEquipment = new Map();
    for (const b of utilization) {
      const hours = (b.endTime - b.startTime) / 1000 / 60 / 60;
      const key = b.equipmentId;
      if (!utilByEquipment.has(key)) {
        utilByEquipment.set(key, {
          id: b.equipment.id,
          name: b.equipment.name,
          category: b.equipment.category,
          hours: 0,
        });
      }
      utilByEquipment.get(key).hours += hours;
    }
    const utilizationList = Array.from(utilByEquipment.values())
      .map((u) => ({ ...u, hours: Math.round(u.hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours);

    res.json({
      data: {
        totalEquipment,
        activeToday,
        pending,
        thisWeek,
        utilization: utilizationList,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
