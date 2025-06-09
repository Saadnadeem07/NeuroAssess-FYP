const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const {
  registerPatient,
  registerPsychiatrist,
  registerAdmin,
  loginPatient,
  loginPsychiatrist,
  loginAdmin,
  getPatientProfile,
  getPsychiatristProfile,
  getAdminProfile,
  verifyPatientOTP,
  verifyPsychiatristOTP,
  verifyAdminOTP,
  resendPatientOTP,
  resendPsychiatristOTP,
  resendAdminOTP,
  forgotPatientPassword,
  forgotPsychiatristPassword,
  forgotAdminPassword,
  resetPatientPassword,
  resetPsychiatristPassword,
  resetAdminPassword,
  logout,
} = require("../controllers/authController");
const {
  protectPatient,
  protectPsychiatrist,
  protectAdmin,
  isApprovedPsychiatrist,
} = require("../middleware/auth");
const Patient = require("../models/Patient");
const Psychiatrist = require("../models/Psychiatrist");
const Admin = require("../models/Admin");

// Patient validation middleware
const registerPatientValidation = [
  check("name", "Name is required").not().isEmpty(),
  check("email", "Please include a valid email").isEmail(),
  check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  check("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),
  check("gender")
    .optional()
    .isIn(["male", "female", "other", "prefer not to say"])
    .withMessage("Invalid gender value"),
];

// Psychiatrist validation middleware
const registerPsychiatristValidation = [
  check("name", "Name is required").not().isEmpty(),
  check("email", "Please include a valid email").isEmail(),
  check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  check("phone_number", "Phone number is required").not().isEmpty(),
  check("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Invalid gender value"),
  check("date_of_birth", "Date of birth is required")
    .not()
    .isEmpty()
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),
  check("country_of_nationality", "Country of nationality is required")
    .not()
    .isEmpty(),
  check("country_of_graduation", "Country of graduation is required")
    .not()
    .isEmpty(),
  check("date_of_graduation", "Date of graduation is required")
    .not()
    .isEmpty()
    .isISO8601()
    .withMessage("Date of graduation must be a valid date"),
  check("institute_name", "Institute name is required").not().isEmpty(),
  check("license_number", "License number is required").not().isEmpty(),
  check("degrees", "Degrees are required").not().isEmpty(),
  check("years_of_experience", "Years of experience is required")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Years of experience must be a number"),
  check("expertise", "Expertise is required").not().isEmpty(),
  check("bio", "Bio is required").not().isEmpty(),
  check("certificateUrl", "Certificate URL is required").not().isEmpty(),
];

// Admin validation middleware
const registerAdminValidation = [
  check("name", "Name is required").not().isEmpty(),
  check("email", "Please include a valid email").isEmail(),
  check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  check("permissions")
    .optional()
    .isArray()
    .withMessage("Permissions must be an array"),
  check("adminLevel")
    .optional()
    .isIn(["junior", "senior", "super"])
    .withMessage("Invalid admin level"),
];

const loginValidation = [
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password is required").exists(),
];

const otpValidation = [
  check("id", "ID is required").not().isEmpty(),
  check("otp", "OTP is required").isLength({ min: 6, max: 6 }),
];

// Patient routes
router.post("/patient/register", registerPatientValidation, registerPatient);
router.post("/patient/login", loginValidation, loginPatient);
router.get("/patient/me", protectPatient, getPatientProfile);
router.post("/patient/verify-otp", otpValidation, verifyPatientOTP);
router.post(
  "/patient/resend-otp",
  [check("id", "ID is required").not().isEmpty()],
  resendPatientOTP
);
router.post(
  "/patient/forgot-password",
  [check("email", "Please include a valid email").isEmail()],
  forgotPatientPassword
);
router.post(
  "/patient/reset-password",
  [
    check("token", "Reset token is required").not().isEmpty(),
    check("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number"),
  ],
  resetPatientPassword
);

// Add the change-password route for patients
router.post("/patient/change-password", protectPatient, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Get the patient from the database with the password
    const patient = await Patient.findById(req.patient._id).select("+password");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check if the current password is correct
    const isMatch = await patient.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update the password
    patient.password = newPassword;
    await patient.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Psychiatrist routes
router.post(
  "/psychiatrist/register",
  registerPsychiatristValidation,
  registerPsychiatrist
);
router.post("/psychiatrist/login", loginValidation, loginPsychiatrist);
router.get("/psychiatrist/me", protectPsychiatrist, getPsychiatristProfile);
router.post("/psychiatrist/verify-otp", otpValidation, verifyPsychiatristOTP);
router.post(
  "/psychiatrist/resend-otp",
  [check("id", "ID is required").not().isEmpty()],
  resendPsychiatristOTP
);
router.post(
  "/psychiatrist/forgot-password",
  [check("email", "Please include a valid email").isEmail()],
  forgotPsychiatristPassword
);
router.post(
  "/psychiatrist/reset-password",
  [
    check("token", "Reset token is required").not().isEmpty(),
    check("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number"),
  ],
  resetPsychiatristPassword
);

// Add the change-password route for psychiatrists
router.post(
  "/psychiatrist/change-password",
  protectPsychiatrist,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      // Get the psychiatrist from the database with the password
      const psychiatrist = await Psychiatrist.findById(
        req.psychiatrist._id
      ).select("+password");

      if (!psychiatrist) {
        return res.status(404).json({
          success: false,
          message: "Psychiatrist not found",
        });
      }

      // Check if the current password is correct
      const isMatch = await psychiatrist.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update the password
      psychiatrist.password = newPassword;
      await psychiatrist.save();

      res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Admin routes
router.post("/admin/register", registerAdminValidation, registerAdmin);
router.post("/admin/login", loginValidation, loginAdmin);
router.get("/admin/me", protectAdmin, getAdminProfile);
router.post("/admin/verify-otp", otpValidation, verifyAdminOTP);
router.post(
  "/admin/resend-otp",
  [check("id", "ID is required").not().isEmpty()],
  resendAdminOTP
);
router.post(
  "/admin/forgot-password",
  [check("email", "Please include a valid email").isEmail()],
  forgotAdminPassword
);
router.post(
  "/admin/reset-password",
  [
    check("token", "Reset token is required").not().isEmpty(),
    check("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number"),
  ],
  resetAdminPassword
);

// Add the change-password route for admins
router.post("/admin/change-password", protectAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Get the admin from the database with the password
    const admin = await Admin.findById(req.admin._id).select("+password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Check if the current password is correct
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update the password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Logout route
router.get("/logout", logout);

module.exports = router;
