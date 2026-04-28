const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const AppError = require("./AppError");
const ERROR_CODES = require("./errorCodes");
const { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } = require("./constants");

const requireSecret = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

const signAccess = ({ id, role }) =>
  jwt.sign({ sub: String(id), role, type: "access" }, requireSecret("JWT_SECRET"), {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const signRefresh = ({ id, role, jti }) =>
  jwt.sign(
    { sub: String(id), role, type: "refresh", jti },
    requireSecret("JWT_REFRESH_SECRET"),
    { expiresIn: REFRESH_TOKEN_TTL }
  );

const verifyAccess = (token) => {
  try {
    const decoded = jwt.verify(token, requireSecret("JWT_SECRET"));
    if (decoded.type !== "access") {
      throw AppError.unauthorized("Invalid token type", ERROR_CODES.AUTH_TOKEN_INVALID);
    }
    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw AppError.unauthorized("Access token expired", ERROR_CODES.AUTH_TOKEN_EXPIRED);
    }
    if (error instanceof AppError) throw error;
    throw AppError.unauthorized("Invalid access token", ERROR_CODES.AUTH_TOKEN_INVALID);
  }
};

const verifyRefresh = (token) => {
  try {
    const decoded = jwt.verify(token, requireSecret("JWT_REFRESH_SECRET"));
    if (decoded.type !== "refresh") {
      throw AppError.unauthorized("Invalid token type", ERROR_CODES.AUTH_TOKEN_INVALID);
    }
    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw AppError.unauthorized("Refresh token expired", ERROR_CODES.AUTH_TOKEN_EXPIRED);
    }
    if (error instanceof AppError) throw error;
    throw AppError.unauthorized("Invalid refresh token", ERROR_CODES.AUTH_TOKEN_INVALID);
  }
};

const newJti = () => crypto.randomUUID();

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

module.exports = {
  signAccess,
  signRefresh,
  verifyAccess,
  verifyRefresh,
  newJti,
  hashToken,
};
