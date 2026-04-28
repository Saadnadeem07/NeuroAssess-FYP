const ERROR_CODES = require("./errorCodes");

class AppError extends Error {
  constructor(message, statusCode = 500, code = ERROR_CODES.INTERNAL_SERVER_ERROR, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message, code = ERROR_CODES.VALIDATION_FAILED, details) {
    return new AppError(message, 400, code, details);
  }
  static unauthorized(message = "Not authenticated", code = ERROR_CODES.AUTH_TOKEN_INVALID) {
    return new AppError(message, 401, code);
  }
  static forbidden(message = "Forbidden", code = ERROR_CODES.AUTH_FORBIDDEN) {
    return new AppError(message, 403, code);
  }
  static notFound(message = "Resource not found", code = ERROR_CODES.RESOURCE_NOT_FOUND) {
    return new AppError(message, 404, code);
  }
  static conflict(message, code = ERROR_CODES.RESOURCE_CONFLICT) {
    return new AppError(message, 409, code);
  }
  static unprocessable(message, code = ERROR_CODES.VALIDATION_FAILED, details) {
    return new AppError(message, 422, code, details);
  }
}

module.exports = AppError;
