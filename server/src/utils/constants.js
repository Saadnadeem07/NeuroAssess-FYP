const MS = Object.freeze({
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
});

module.exports = {
  MS,
  OTP_TTL_MS: 15 * MS.MINUTE,
  OTP_MAX_ATTEMPTS: 5,
  RESET_TOKEN_TTL_MS: 1 * MS.HOUR,
  ACCESS_TOKEN_TTL: process.env.JWT_ACCESS_EXPIRE || "15m",
  REFRESH_TOKEN_TTL: process.env.JWT_REFRESH_EXPIRE || "7d",
  ACCESS_COOKIE_NAME: "accessToken",
  REFRESH_COOKIE_NAME: "refreshToken",
  CLEANUP_INTERVAL_MS: 5 * MS.MINUTE,
  BCRYPT_COST: 12,
};
