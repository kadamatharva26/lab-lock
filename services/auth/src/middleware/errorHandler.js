// Convert thrown errors into a consistent JSON envelope.
function errorHandler(err, req, res, _next) {
  // Zod validation error
  if (err.name === "ZodError") {
    return res.status(400).json({
      error: { code: "validation_error", message: "Invalid input", details: err.errors },
    });
  }
  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: { code: "invalid_token", message: err.message },
    });
  }
  // Prisma unique violation
  if (err.code === "P2002") {
    return res.status(409).json({
      error: { code: "conflict", message: "Resource already exists", details: err.meta },
    });
  }
  // Custom HttpError
  if (err.status) {
    return res.status(err.status).json({
      error: { code: err.code || "error", message: err.message, details: err.details },
    });
  }
  console.error("[auth] unhandled error:", err);
  return res.status(500).json({
    error: { code: "internal_error", message: "Something went wrong" },
  });
}

class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

module.exports = { errorHandler, HttpError };
