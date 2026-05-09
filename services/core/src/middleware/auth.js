const jwt = require("jsonwebtoken");
const { HttpError } = require("./errorHandler");

const SECRET = process.env.JWT_SECRET || "dev-insecure-secret";

/**
 * Verifies the bearer token locally (same JWT_SECRET as auth-service).
 * Sets req.user = { userId, role }.
 */
function requireAuth(req, _res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) throw new HttpError(401, "missing_token", "Authorization header missing");
    const payload = jwt.verify(token, SECRET);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (e) {
    next(e);
  }
}

/**
 * Restrict a route to one or more roles.
 *   router.post(..., requireAuth, requireRole("admin"), handler)
 */
function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "missing_auth", "Auth required"));
    if (!allowed.includes(req.user.role)) {
      return next(new HttpError(403, "forbidden", `Requires role: ${allowed.join(" or ")}`));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
