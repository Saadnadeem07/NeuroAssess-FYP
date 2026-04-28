const rateLimit = require("express-rate-limit");
const ERROR_CODES = require("../utils/errorCodes");
const { MS } = require("../utils/constants");

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, _next, options) => {
      res.status(options.statusCode || 429).json({
        success: false,
        error: message,
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        statusCode: options.statusCode || 429,
        requestId: req.id,
      });
    },
  });

const globalLimiter = buildLimiter({
  windowMs: 1 * MS.MINUTE,
  max: 200,
  message: "Too many requests, please slow down.",
});

const authLimiter = buildLimiter({
  windowMs: 15 * MS.MINUTE,
  max: 10,
  message: "Too many auth attempts, please try again in 15 minutes.",
});

const otpLimiter = buildLimiter({
  windowMs: 15 * MS.MINUTE,
  max: 5,
  message: "Too many OTP attempts, please try again later.",
});

const passwordResetLimiter = buildLimiter({
  windowMs: 1 * MS.HOUR,
  max: 5,
  message: "Too many password reset requests, please try again later.",
});

module.exports = {
  globalLimiter,
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
};
