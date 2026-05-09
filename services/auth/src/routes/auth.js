const express = require("express");
const bcrypt = require("bcrypt");
const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { sign, verify } = require("../lib/jwt");
const { HttpError } = require("../middleware/errorHandler");

const router = express.Router();

const SignupSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(80),
  // admin is created via seed only; users can self-register as student or supervisor
  role: z.enum(["student", "supervisor"]).default("student"),
});

const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

/**
 * POST /signup
 */
router.post("/signup", async (req, res, next) => {
  try {
    const data = SignupSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = sign({ userId: user.id, role: user.role });
    res.status(201).json({ user, token });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /login
 */
router.post("/login", async (req, res, next) => {
  try {
    const data = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.isActive) {
      throw new HttpError(401, "invalid_credentials", "Invalid email or password");
    }
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, "invalid_credentials", "Invalid email or password");
    }
    const token = sign({ userId: user.id, role: user.role });
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /verify  — used by gateway/core to validate a bearer token
 * Returns the decoded payload + fresh user record.
 */
router.get("/verify", async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) throw new HttpError(401, "missing_token", "Authorization header missing");

    const payload = verify(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new HttpError(401, "user_not_found", "User no longer valid");
    }
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /me — returns the calling user (frontend convenience)
 */
router.get("/me", async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) throw new HttpError(401, "missing_token", "Authorization header missing");
    const payload = verify(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) throw new HttpError(401, "user_not_found", "User no longer valid");
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
