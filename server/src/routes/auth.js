const express = require("express");
const { check } = require("express-validator");
const router = express.Router();

const Patient = require("../models/Patient");
const Psychiatrist = require("../models/Psychiatrist");
const Admin = require("../models/Admin");

const validate = require("../middleware/validate");
const { passwordValidator } = require("../utils/passwordPolicy");
const {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
} = require("../middleware/rateLimit");
const {
  protectPatient,
  protectPsychiatrist,
  protectAdmin,
} = require("../middleware/auth");

const auth = require("../controllers/authController");

// --- Validators -----------------------------------------------------------

const emailField = check("email", "Please include a valid email").isEmail().normalizeEmail();

const otpFields = [
  check("id", "ID is required").not().isEmpty(),
  check("otp", "OTP must be 6 digits").isLength({ min: 6, max: 6 }).isNumeric(),
];

const idOnly = [check("id", "ID is required").not().isEmpty()];

const loginFields = [emailField, check("password", "Password is required").notEmpty()];

const resetFields = [
  check("token", "Reset token is required").not().isEmpty(),
  passwordValidator("newPassword"),
];

const changePasswordFields = [
  check("currentPassword", "Current password is required").notEmpty(),
  passwordValidator("newPassword"),
];

const registerPatientFields = [
  check("name", "Name is required").trim().notEmpty(),
  emailField,
  passwordValidator(),
  check("dateOfBirth").optional().isISO8601().withMessage("Date of birth must be a valid date"),
  check("gender")
    .optional()
    .isIn(["male", "female", "other", "prefer not to say"])
    .withMessage("Invalid gender value"),
];

const registerPsychiatristFields = [
  check("name", "Name is required").trim().notEmpty(),
  emailField,
  passwordValidator(),
  check("phone_number", "Phone number is required").trim().notEmpty(),
  check("gender").optional().isIn(["Male", "Female", "Other"]).withMessage("Invalid gender value"),
  check("date_of_birth", "Date of birth is required").isISO8601(),
  check("country_of_nationality", "Country of nationality is required").trim().notEmpty(),
  check("country_of_graduation", "Country of graduation is required").trim().notEmpty(),
  check("date_of_graduation", "Date of graduation is required").isISO8601(),
  check("institute_name", "Institute name is required").trim().notEmpty(),
  check("license_number", "License number is required").trim().notEmpty(),
  check("degrees", "Degrees are required").trim().notEmpty(),
  check("years_of_experience", "Years of experience is required").isNumeric(),
  check("expertise", "Expertise is required").trim().notEmpty(),
  check("bio", "Bio is required").trim().notEmpty(),
  check("certificateUrl", "Certificate URL is required").isURL(),
];

// --- Patient --------------------------------------------------------------

router.post(
  "/patient/register",
  authLimiter,
  registerPatientFields,
  validate,
  auth.registerPatient
);
router.post("/patient/login", authLimiter, loginFields, validate, auth.loginPatient);
router.get("/patient/me", protectPatient, auth.getPatientProfile);
router.post("/patient/verify-otp", otpLimiter, otpFields, validate, auth.verifyPatientOTP);
router.post("/patient/resend-otp", otpLimiter, idOnly, validate, auth.resendPatientOTP);
router.post(
  "/patient/forgot-password",
  passwordResetLimiter,
  [emailField],
  validate,
  auth.forgotPatientPassword
);
router.post(
  "/patient/reset-password",
  passwordResetLimiter,
  resetFields,
  validate,
  auth.resetPatientPassword
);
router.post(
  "/patient/change-password",
  protectPatient,
  changePasswordFields,
  validate,
  auth.buildChangePasswordHandler(Patient, "patient")
);

// --- Psychiatrist ---------------------------------------------------------

router.post(
  "/psychiatrist/register",
  authLimiter,
  registerPsychiatristFields,
  validate,
  auth.registerPsychiatrist
);
router.post("/psychiatrist/login", authLimiter, loginFields, validate, auth.loginPsychiatrist);
router.get("/psychiatrist/me", protectPsychiatrist, auth.getPsychiatristProfile);
router.post(
  "/psychiatrist/verify-otp",
  otpLimiter,
  otpFields,
  validate,
  auth.verifyPsychiatristOTP
);
router.post(
  "/psychiatrist/resend-otp",
  otpLimiter,
  idOnly,
  validate,
  auth.resendPsychiatristOTP
);
router.post(
  "/psychiatrist/forgot-password",
  passwordResetLimiter,
  [emailField],
  validate,
  auth.forgotPsychiatristPassword
);
router.post(
  "/psychiatrist/reset-password",
  passwordResetLimiter,
  resetFields,
  validate,
  auth.resetPsychiatristPassword
);
router.post(
  "/psychiatrist/change-password",
  protectPsychiatrist,
  changePasswordFields,
  validate,
  auth.buildChangePasswordHandler(Psychiatrist, "psychiatrist")
);

// --- Admin (no public register; seeded via scripts/seed-admin.js) ----------

router.post("/admin/login", authLimiter, loginFields, validate, auth.loginAdmin);
router.get("/admin/me", protectAdmin, auth.getAdminProfile);
router.post("/admin/verify-otp", otpLimiter, otpFields, validate, auth.verifyAdminOTP);
router.post("/admin/resend-otp", otpLimiter, idOnly, validate, auth.resendAdminOTP);
router.post(
  "/admin/forgot-password",
  passwordResetLimiter,
  [emailField],
  validate,
  auth.forgotAdminPassword
);
router.post(
  "/admin/reset-password",
  passwordResetLimiter,
  resetFields,
  validate,
  auth.resetAdminPassword
);
router.post(
  "/admin/change-password",
  protectAdmin,
  changePasswordFields,
  validate,
  auth.buildChangePasswordHandler(Admin, "admin")
);

// --- Refresh + logout (shared across roles) -------------------------------

router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);

module.exports = router;
