const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

if (!SECRET) {
  console.warn("[auth] WARNING: JWT_SECRET not set — using insecure default");
}

function sign(payload) {
  return jwt.sign(payload, SECRET || "dev-insecure-secret", { expiresIn: EXPIRES_IN });
}

function verify(token) {
  return jwt.verify(token, SECRET || "dev-insecure-secret");
}

module.exports = { sign, verify };
