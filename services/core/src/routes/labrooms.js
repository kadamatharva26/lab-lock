const express = require("express");
const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const LabRoomSchema = z.object({
  name: z.string().min(2).max(80),
  capacity: z.number().int().positive(),
  building: z.string().min(1).max(80),
});

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const rooms = await prisma.labRoom.findMany({ orderBy: { name: "asc" } });
    res.json({ data: rooms });
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const data = LabRoomSchema.parse(req.body);
    const room = await prisma.labRoom.create({ data });
    res.status(201).json({ data: room });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const data = LabRoomSchema.parse(req.body);
    const room = await prisma.labRoom.update({ where: { id: req.params.id }, data });
    res.json({ data: room });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    await prisma.labRoom.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
