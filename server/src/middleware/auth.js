const Patient = require("../models/Patient");
const Psychiatrist = require("../models/Psychiatrist");
const Admin = require("../models/Admin");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");
const { verifyAccess } = require("../utils/tokens");
const { ACCESS_COOKIE_NAME } = require("../utils/cookies");
const asyncHandler = require("../utils/asyncHandler");

const ROLE_MODELS = {
  patient: Patient,
  psychiatrist: Psychiatrist,
  admin: Admin,
};

const extractToken = (req) => {
  // Cookie-only auth — Authorization: Bearer is no longer accepted.
  return req.cookies?.[ACCESS_COOKIE_NAME] || null;
};

const loadPrincipal = async (decoded) => {
  const Model = ROLE_MODELS[decoded.role];
  if (!Model) return null;
  const principal = await Model.findById(decoded.sub).select("-password");
  return principal ? { principal, role: decoded.role } : null;
};

// Builds a middleware that requires the principal to match `expectedRole`.
const requireRole = (expectedRole) =>
  asyncHandler(async (req, _res, next) => {
    const token = extractToken(req);
    if (!token) {
      throw AppError.unauthorized("Not authenticated", ERROR_CODES.AUTH_TOKEN_INVALID);
    }
    const decoded = verifyAccess(token);
    if (decoded.role !== expectedRole) {
      throw AppError.forbidden(
        `Access denied. ${expectedRole} role required.`,
        ERROR_CODES.AUTH_FORBIDDEN
      );
    }
    const result = await loadPrincipal(decoded);
    if (!result) throw AppError.unauthorized("Account not found");
    req[expectedRole] = result.principal;
    req.principal = { id: result.principal._id, role: expectedRole };
    next();
  });

const protectPatient = requireRole("patient");
const protectPsychiatrist = requireRole("psychiatrist");
const protectAdmin = requireRole("admin");

const protectPatientOrPsychiatrist = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw AppError.unauthorized("Not authenticated", ERROR_CODES.AUTH_TOKEN_INVALID);
  }
  const decoded = verifyAccess(token);
  if (!["patient", "psychiatrist"].includes(decoded.role)) {
    throw AppError.forbidden("Patient or psychiatrist role required");
  }
  const result = await loadPrincipal(decoded);
  if (!result) throw AppError.unauthorized("Account not found");
  req[decoded.role] = result.principal;
  req.principal = { id: result.principal._id, role: decoded.role };
  next();
});

const isApprovedPsychiatrist = (req, _res, next) => {
  if (!req.psychiatrist) {
    return next(AppError.forbidden("Psychiatrist role required"));
  }
  if (!req.psychiatrist.isApproved) {
    return next(
      AppError.forbidden(
        "Your psychiatrist account is pending approval.",
        ERROR_CODES.AUTH_NOT_APPROVED
      )
    );
  }
  next();
};

module.exports = {
  protectPatient,
  protectPsychiatrist,
  protectAdmin,
  protectPatientOrPsychiatrist,
  isApprovedPsychiatrist,
};
