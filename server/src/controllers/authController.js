const crypto = require("crypto");
const Patient = require("../models/Patient");
const Psychiatrist = require("../models/Psychiatrist");
const Admin = require("../models/Admin");
const RefreshToken = require("../models/RefreshToken");
const authService = require("../services/authService");
const {
  sendOTPEmail,
  sendResetPasswordEmail,
} = require("../services/emailService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");
const {
  signAccess,
  signRefresh,
  verifyRefresh,
  newJti,
  hashToken,
} = require("../utils/tokens");
const { setAuthCookies, clearAuthCookies, REFRESH_COOKIE_NAME } = require("../utils/cookies");
const { RESET_TOKEN_TTL_MS, MS } = require("../utils/constants");
const {
  safePatient,
  safePsychiatrist,
  safeAdmin,
} = require("../utils/sanitize");

const ROLE_MODELS = {
  patient: Patient,
  psychiatrist: Psychiatrist,
  admin: Admin,
};

const REFRESH_EXPIRES_MS = 7 * MS.DAY;

const issueTokens = async (account, role, req, res) => {
  const accessToken = signAccess({ id: account._id, role });
  const jti = newJti();
  const refreshToken = signRefresh({ id: account._id, role, jti });

  await RefreshToken.create({
    accountId: account._id,
    role,
    tokenHash: hashToken(refreshToken),
    jti,
    expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
    userAgent: req.get("User-Agent") || null,
    ip: req.ip || null,
  });

  setAuthCookies(res, { accessToken, refreshToken });
  return { accessToken };
};

const success = (res, data, message, status = 200) =>
  res.status(status).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });

// ---------------------------------------------------------------------------
// Patient
// ---------------------------------------------------------------------------

exports.registerPatient = asyncHandler(async (req, res) => {
  const { email, password, name, dateOfBirth, gender } = req.body;
  const { patient } = await authService.registerPatient({
    email,
    password,
    name,
    dateOfBirth,
    gender,
  });

  return res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email using the OTP we just sent.",
    data: { id: patient._id, email: patient.email, name: patient.name },
  });
});

exports.verifyPatientOTP = asyncHandler(async (req, res) => {
  const { id, otp } = req.body;
  const patient = await authService.verifyPatientOTP(id, otp);
  await issueTokens(patient, "patient", req, res);
  return success(res, safePatient(patient), "OTP verification successful");
});

exports.resendPatientOTP = asyncHandler(async (req, res) => {
  await authService.resendPatientOTP(req.body.id);
  return success(res, null, "OTP resent successfully");
});

exports.loginPatient = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const patient = await Patient.findOne({ email }).select("+password");
  if (!patient) {
    throw AppError.unauthorized("Invalid credentials", ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }

  if (!patient.emailVerified) {
    const otp = patient.generateOTP();
    await patient.save();
    await sendOTPEmail(patient.email, otp);
    throw new AppError(
      "Email not verified. Verification code sent to your email.",
      403,
      ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED,
      { id: patient._id }
    );
  }

  const isMatch = await patient.comparePassword(password);
  if (!isMatch) {
    throw AppError.unauthorized("Invalid credentials", ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }

  await issueTokens(patient, "patient", req, res);
  return success(res, safePatient(patient));
});

exports.getPatientProfile = asyncHandler(async (req, res) => {
  return success(res, safePatient(req.patient));
});

exports.forgotPatientPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const patient = await Patient.findOne({ email });
  // Respond identically whether or not the email exists, to avoid user enumeration.
  if (patient) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    patient.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    patient.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await patient.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&role=patient`;
    await sendResetPasswordEmail(email, resetUrl);
  }
  return success(res, null, "If an account exists for that email, a reset link has been sent.");
});

const buildResetPasswordHandler = (Model) =>
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const account = await Model.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password");

    if (!account) {
      throw AppError.unauthorized("Invalid or expired token", ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    account.password = newPassword;
    account.resetPasswordToken = undefined;
    account.resetPasswordExpires = undefined;
    await account.save();

    // Revoke all refresh tokens for this account.
    await RefreshToken.updateMany(
      { accountId: account._id, revokedAt: null },
      { revokedAt: new Date() }
    );

    return success(res, null, "Password reset successful. Please log in.");
  });

exports.resetPatientPassword = buildResetPasswordHandler(Patient);

// ---------------------------------------------------------------------------
// Psychiatrist
// ---------------------------------------------------------------------------

exports.registerPsychiatrist = asyncHandler(async (req, res) => {
  const { psychiatrist } = await authService.registerPsychiatrist(req.body);
  return res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email using the OTP we just sent.",
    data: { id: psychiatrist._id, email: psychiatrist.email, name: psychiatrist.name },
  });
});

exports.verifyPsychiatristOTP = asyncHandler(async (req, res) => {
  const { id, otp } = req.body;
  const psychiatrist = await authService.verifyPsychiatristOTP(id, otp);
  await issueTokens(psychiatrist, "psychiatrist", req, res);
  return success(res, safePsychiatrist(psychiatrist), "OTP verification successful");
});

exports.resendPsychiatristOTP = asyncHandler(async (req, res) => {
  await authService.resendPsychiatristOTP(req.body.id);
  return success(res, null, "OTP resent successfully");
});

exports.loginPsychiatrist = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const psychiatrist = await Psychiatrist.findOne({ email }).select("+password");
  if (!psychiatrist) {
    throw AppError.unauthorized("Invalid credentials", ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }

  if (!psychiatrist.emailVerified) {
    const otp = psychiatrist.generateOTP();
    await psychiatrist.save();
    await sendOTPEmail(psychiatrist.email, otp);
    throw new AppError(
      "Email not verified. Verification code sent to your email.",
      403,
      ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED,
      { id: psychiatrist._id }
    );
  }

  if (!psychiatrist.isApproved) {
    throw new AppError(
      "Your account is pending approval",
      403,
      ERROR_CODES.AUTH_NOT_APPROVED
    );
  }

  const isMatch = await psychiatrist.comparePassword(password);
  if (!isMatch) {
    throw AppError.unauthorized("Invalid credentials", ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }

  await issueTokens(psychiatrist, "psychiatrist", req, res);
  return success(res, safePsychiatrist(psychiatrist));
});

exports.getPsychiatristProfile = asyncHandler(async (req, res) => {
  return success(res, safePsychiatrist(req.psychiatrist));
});

exports.forgotPsychiatristPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const psychiatrist = await Psychiatrist.findOne({ email });
  if (psychiatrist) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    psychiatrist.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    psychiatrist.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await psychiatrist.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&role=psychiatrist`;
    await sendResetPasswordEmail(email, resetUrl);
  }
  return success(res, null, "If an account exists for that email, a reset link has been sent.");
});

exports.resetPsychiatristPassword = buildResetPasswordHandler(Psychiatrist);

// ---------------------------------------------------------------------------
// Admin (no public register; seed via scripts/seed-admin.js)
// ---------------------------------------------------------------------------

exports.loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) {
    throw AppError.unauthorized("Invalid credentials", ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }
  if (!admin.emailVerified) {
    const otp = admin.generateOTP();
    await admin.save();
    await sendOTPEmail(admin.email, otp);
    throw new AppError(
      "Email not verified. Verification code sent to your email.",
      403,
      ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED,
      { id: admin._id }
    );
  }
  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    throw AppError.unauthorized("Invalid credentials", ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }
  await issueTokens(admin, "admin", req, res);
  return success(res, safeAdmin(admin));
});

exports.verifyAdminOTP = asyncHandler(async (req, res) => {
  const { id, otp } = req.body;
  const admin = await authService.verifyAdminOTP(id, otp);
  await issueTokens(admin, "admin", req, res);
  return success(res, safeAdmin(admin), "OTP verification successful");
});

exports.resendAdminOTP = asyncHandler(async (req, res) => {
  await authService.resendAdminOTP(req.body.id);
  return success(res, null, "OTP resent successfully");
});

exports.getAdminProfile = asyncHandler(async (req, res) => {
  return success(res, safeAdmin(req.admin));
});

exports.forgotAdminPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });
  if (admin) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    admin.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    admin.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await admin.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&role=admin`;
    await sendResetPasswordEmail(email, resetUrl);
  }
  return success(res, null, "If an account exists for that email, a reset link has been sent.");
});

exports.resetAdminPassword = buildResetPasswordHandler(Admin);

// ---------------------------------------------------------------------------
// Refresh + Logout
// ---------------------------------------------------------------------------

exports.refresh = asyncHandler(async (req, res) => {
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!cookieToken) {
    throw AppError.unauthorized("Missing refresh token", ERROR_CODES.AUTH_TOKEN_INVALID);
  }
  const decoded = verifyRefresh(cookieToken);
  const tokenHash = hashToken(cookieToken);

  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored) {
    // Token reuse from outside our store — possible theft.
    await RefreshToken.updateMany(
      { accountId: decoded.sub, role: decoded.role, revokedAt: null },
      { revokedAt: new Date() }
    );
    clearAuthCookies(res);
    throw AppError.unauthorized("Refresh token reused", ERROR_CODES.AUTH_REFRESH_REUSED);
  }
  if (!stored.isActive()) {
    clearAuthCookies(res);
    throw AppError.unauthorized("Refresh token revoked or expired", ERROR_CODES.AUTH_TOKEN_EXPIRED);
  }

  const Model = ROLE_MODELS[decoded.role];
  if (!Model) throw AppError.unauthorized("Unknown role on refresh token");
  const principal = await Model.findById(decoded.sub).select("-password");
  if (!principal) {
    clearAuthCookies(res);
    throw AppError.unauthorized("Account not found");
  }

  // Rotate.
  const accessToken = signAccess({ id: principal._id, role: decoded.role });
  const newJtiValue = newJti();
  const newRefresh = signRefresh({ id: principal._id, role: decoded.role, jti: newJtiValue });

  await RefreshToken.create({
    accountId: principal._id,
    role: decoded.role,
    tokenHash: hashToken(newRefresh),
    jti: newJtiValue,
    expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
    userAgent: req.get("User-Agent") || null,
    ip: req.ip || null,
  });
  stored.revokedAt = new Date();
  stored.replacedBy = newJtiValue;
  await stored.save();

  setAuthCookies(res, { accessToken, refreshToken: newRefresh });
  return success(res, { role: decoded.role });
});

exports.logout = asyncHandler(async (req, res) => {
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (cookieToken) {
    const tokenHash = hashToken(cookieToken);
    await RefreshToken.findOneAndUpdate(
      { tokenHash, revokedAt: null },
      { revokedAt: new Date() }
    );
  }
  clearAuthCookies(res);
  return success(res, null, "Logged out successfully");
});

// ---------------------------------------------------------------------------
// Change password (authenticated)
// ---------------------------------------------------------------------------

exports.buildChangePasswordHandler = (Model, principalKey) =>
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const account = await Model.findById(req[principalKey]._id).select("+password");
    if (!account) throw AppError.notFound("Account not found");
    const matches = await account.comparePassword(currentPassword);
    if (!matches) {
      throw AppError.unauthorized(
        "Current password is incorrect",
        ERROR_CODES.AUTH_INVALID_CREDENTIALS
      );
    }
    account.password = newPassword;
    await account.save();
    await RefreshToken.updateMany(
      { accountId: account._id, revokedAt: null },
      { revokedAt: new Date() }
    );
    return success(res, null, "Password updated successfully. Please log in again.");
  });
