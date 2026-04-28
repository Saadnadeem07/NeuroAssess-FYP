const Patient = require("../models/Patient");
const Psychiatrist = require("../models/Psychiatrist");
const Admin = require("../models/Admin");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");
const { sendOTPEmail } = require("./emailService");

// --- Registration ----------------------------------------------------------

exports.registerPatient = async ({ email, password, name, dateOfBirth, gender }) => {
  const existing = await Patient.findOne({ email });
  if (existing) {
    throw AppError.conflict("Patient already exists with this email");
  }

  const patient = await Patient.create({
    email,
    password,
    name,
    dateOfBirth,
    gender,
    isTemporary: true,
  });

  const otp = patient.generateOTP();
  await patient.save();

  const emailResult = await sendOTPEmail(email, otp);
  if (!emailResult.success) {
    throw new AppError("Failed to send verification email", 502);
  }

  return { patient };
};

exports.registerPsychiatrist = async (data) => {
  const existing = await Psychiatrist.findOne({ email: data.email });
  if (existing) {
    throw AppError.conflict("Psychiatrist already exists with this email");
  }

  const required = [
    "expertise",
    "bio",
    "certificateUrl",
    "phone_number",
    "date_of_birth",
    "country_of_nationality",
    "country_of_graduation",
    "date_of_graduation",
    "institute_name",
    "license_number",
    "degrees",
    "years_of_experience",
  ];
  const missing = required.filter((f) => data[f] === undefined || data[f] === "");
  if (missing.length) {
    throw AppError.unprocessable(
      "Missing required fields for psychiatrist registration",
      ERROR_CODES.VALIDATION_FAILED,
      missing.map((field) => ({ field, message: "required" }))
    );
  }

  const psychiatrist = await Psychiatrist.create({
    ...data,
    isApproved: false,
    isTemporary: true,
  });

  const otp = psychiatrist.generateOTP();
  await psychiatrist.save();

  const emailResult = await sendOTPEmail(data.email, otp);
  if (!emailResult.success) {
    throw new AppError("Failed to send verification email", 502);
  }

  return { psychiatrist };
};

// --- OTP verify / resend ---------------------------------------------------

const verifyForModel = (Model, label) => async (id, otp) => {
  const doc = await Model.findById(id);
  if (!doc) throw AppError.notFound(`${label} not found`);
  if (doc.emailVerified) throw AppError.conflict("Email already verified");

  const result = doc.verifyOTP(otp);
  if (!result.ok) {
    await doc.save();
    if (result.reason === "expired") {
      throw AppError.unauthorized("OTP has expired", ERROR_CODES.AUTH_OTP_EXPIRED);
    }
    if (result.reason === "locked") {
      throw AppError.unauthorized(
        "Too many incorrect attempts. Please request a new OTP.",
        ERROR_CODES.AUTH_OTP_LOCKED
      );
    }
    throw AppError.unauthorized("Invalid OTP", ERROR_CODES.AUTH_OTP_INVALID);
  }

  doc.emailVerified = true;
  doc.isTemporary = false;
  doc.otp = undefined;
  await doc.save();
  return doc;
};

const resendForModel = (Model, label) => async (id) => {
  const doc = await Model.findById(id);
  if (!doc) throw AppError.notFound(`${label} not found`);
  if (doc.emailVerified) throw AppError.conflict("Email already verified");

  const otp = doc.generateOTP();
  await doc.save();

  const emailResult = await sendOTPEmail(doc.email, otp);
  if (!emailResult.success) {
    throw new AppError("Failed to send verification email", 502);
  }
};

exports.verifyPatientOTP = verifyForModel(Patient, "Patient");
exports.verifyPsychiatristOTP = verifyForModel(Psychiatrist, "Psychiatrist");
exports.verifyAdminOTP = verifyForModel(Admin, "Admin");

exports.resendPatientOTP = resendForModel(Patient, "Patient");
exports.resendPsychiatristOTP = resendForModel(Psychiatrist, "Psychiatrist");
exports.resendAdminOTP = resendForModel(Admin, "Admin");

// --- Cleanup of unverified accounts ----------------------------------------
// Driven by OTP expiry instead of a fixed clock window.

const cleanupForModel = (Model, label) => async () => {
  const now = new Date();
  const result = await Model.deleteMany({
    isTemporary: true,
    "otp.expiresAt": { $lt: now },
  });
  if (result.deletedCount > 0) {
    console.log(`[cleanup] Removed ${result.deletedCount} temporary ${label}(s)`);
  }
  return result.deletedCount;
};

exports.cleanupTemporaryPatients = cleanupForModel(Patient, "patient");
exports.cleanupTemporaryPsychiatrists = cleanupForModel(Psychiatrist, "psychiatrist");
