const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

const isProd = () => process.env.NODE_ENV === "production";

// Express recognizes a 4-arg function as the error handler.
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";
  let details = err.details;

  // Mongoose validation
  if (err.name === "ValidationError") {
    statusCode = 422;
    code = ERROR_CODES.VALIDATION_FAILED;
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = "Validation failed";
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    code = ERROR_CODES.RESOURCE_CONFLICT;
    message = "Duplicate value for a unique field";
    details = err.keyValue;
  }

  // jwt errors not already wrapped
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    code = ERROR_CODES.AUTH_TOKEN_INVALID;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    code = ERROR_CODES.AUTH_TOKEN_EXPIRED;
    message = "Token expired";
  }

  // express-rate-limit attaches statusCode 429 already; nothing else needed.

  const isOperational = err instanceof AppError || statusCode < 500;

  // Always log server-side with the request id for correlation.
  const logPayload = {
    requestId: req?.id,
    method: req?.method,
    url: req?.originalUrl,
    statusCode,
    code,
    message: err.message,
  };

  if (statusCode >= 500) {
    console.error("[error]", logPayload, "\n", err.stack);
  } else {
    console.warn("[warn]", logPayload);
  }

  // For unknown 5xx in production, never leak the raw message.
  if (isProd() && !isOperational) {
    message = "Internal server error";
    details = undefined;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    statusCode,
    requestId: req?.id,
    ...(details ? { details } : {}),
    ...(!isProd() && err.stack ? { stack: err.stack } : {}),
  });
};
