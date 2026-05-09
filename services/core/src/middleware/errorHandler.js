function errorHandler(err, req, res, _next) {
  if (err.name === "ZodError") {
    return res.status(400).json({
      error: { code: "validation_error", message: "Invalid input", details: err.errors },
    });
  }
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: { code: "invalid_token", message: err.message },
    });
  }
  if (err.code === "P2002") {
    return res.status(409).json({
      error: { code: "conflict", message: "Resource already exists", details: err.meta },
    });
  }
  if (err.code === "P2025") {
    return res.status(404).json({
      error: { code: "not_found", message: "Resource not found" },
    });
  }
  if (err.status) {
    return res.status(err.status).json({
      error: { code: err.code || "error", message: err.message, details: err.details },
    });
  }
  console.error("[core] unhandled:", err);
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
