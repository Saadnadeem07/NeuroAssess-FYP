const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Account = require("../models/Account");
const Patient = require("../models/Patient");
const Psychiatrist = require("../models/Psychiatrist");
const Admin = require("../models/Admin");
const authModel = require("../models/authModel");
const {
  sendOTPEmail,
  sendResetPasswordEmail,
} = require("../services/emailService");
const crypto = require("crypto");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      email,
      password,
      name,
      role,
      expertise,
      bio,
      certificateUrl,
      dateOfBirth,
      gender,
    } = req.body;

    // Check if account exists
    const accountExists = await Account.findOne({ email });
    if (accountExists) {
      return res.status(400).json({
        success: false,
        message: "Account already exists with this email",
      });
    }

    // Register account
    const { account, otp, error } = await authModel.registerUser({
      email,
      password,
      name,
      role,
      expertise,
      bio,
      certificateUrl,
      dateOfBirth,
      gender,
    });

    if (error) {
      throw error;
    }

    // Generate token
    const token = generateToken(account._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your account using the OTP.",
      data: {
        _id: account._id,
        name: account.name,
        email: account.email,
        roles: account.roles,
        token,
        otp, // Send OTP in response (only for development)
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { accountId, otp } = req.body;

    if (!accountId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide account ID and OTP",
      });
    }

    const { account, error } = await authModel.verifyOTP(accountId, otp);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Generate token
    const token = generateToken(account._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    // Get role-specific data
    let roleData = null;

    // Check for psychiatrist role
    if (account.roles.includes("psychiatrist")) {
      const psychiatristData = await Psychiatrist.findOne({
        accountId: account._id,
      });
      if (psychiatristData) {
        roleData = psychiatristData;
      }
    }

    // Check for patient role
    else if (account.roles.includes("patient")) {
      const patientData = await Patient.findOne({
        accountId: account._id,
      });
      if (patientData) {
        roleData = patientData;
      }
    }

    // Check for admin role
    else if (account.roles.includes("admin")) {
      const adminData = await Admin.findOne({
        accountId: account._id,
      });
      if (adminData) {
        roleData = adminData;
      }
    }

    res.status(200).json({
      success: true,
      message: "OTP verification successful",
      data: {
        _id: account._id,
        name: account.name,
        email: account.email,
        roles: account.roles,
        roleData,
        token,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Please provide account ID",
      });
    }

    const { otp, error } = await authModel.resendOTP(accountId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "OTP resent successfully",
      data: {
        otp, // Only for development
      },
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Check if account exists
    const account = await Account.findOne({ email }).select("+password");
    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if email is verified
    if (!account.emailVerified) {
      // Generate new OTP for email verification
      const otp = account.generateOTP();
      await account.save();

      // Send OTP email
      await sendOTPEmail(email, otp);

      return res.status(200).json({
        success: false,
        requiresEmailVerification: true,
        accountId: account._id,
        message: "Email not verified. Verification code sent to your email.",
      });
    }

    // Check if password matches
    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(account._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    // Get role-specific data
    let roleData = null;

    // Check for psychiatrist role
    if (account.roles.includes("psychiatrist")) {
      const psychiatristData = await Psychiatrist.findOne({
        accountId: account._id,
      });
      if (psychiatristData) {
        roleData = psychiatristData;
      }
    }

    // Check for patient role
    else if (account.roles.includes("patient")) {
      const patientData = await Patient.findOne({
        accountId: account._id,
      });
      if (patientData) {
        roleData = patientData;
      }
    }

    // Check for admin role
    else if (account.roles.includes("admin")) {
      const adminData = await Admin.findOne({
        accountId: account._id,
      });
      if (adminData) {
        roleData = adminData;
      }
    }

    res.json({
      success: true,
      data: {
        _id: account._id,
        name: account.name,
        email: account.email,
        roles: account.roles,
        token,
        roleData,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Verify Login OTP
// @route   POST /api/auth/verify-login-otp
// @access  Public
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { accountId, otp } = req.body;

    if (!accountId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide account ID and OTP",
      });
    }

    // Find account by ID
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Verify login OTP
    if (!account.verifyLoginOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Clear login OTP
    account.loginOtp = undefined;
    await account.save();

    // Generate token
    const token = generateToken(account._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    // Get role-specific data
    let roleData = null;

    // Check for psychiatrist role
    if (account.roles.includes("psychiatrist")) {
      const psychiatristData = await Psychiatrist.findOne({
        accountId: account._id,
      });
      if (psychiatristData) {
        roleData = psychiatristData;
      }
    }

    // Check for patient role
    else if (account.roles.includes("patient")) {
      const patientData = await Patient.findOne({
        accountId: account._id,
      });
      if (patientData) {
        roleData = patientData;
      }
    }

    // Check for admin role
    else if (account.roles.includes("admin")) {
      const adminData = await Admin.findOne({
        accountId: account._id,
      });
      if (adminData) {
        roleData = adminData;
      }
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        _id: account._id,
        name: account.name,
        email: account.email,
        roles: account.roles,
        roleData,
        token,
      },
    });
  } catch (error) {
    console.error("Login OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

// @desc    Resend Login OTP
// @route   POST /api/auth/resend-login-otp
// @access  Public
exports.resendLoginOTP = async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Please provide account ID",
      });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Generate new login OTP
    const loginOtp = account.generateLoginOTP();
    await account.save();

    // Send new login OTP email
    await sendOTPEmail(account.email, loginOtp, "Login Verification");

    res.json({
      success: true,
      message: "New login OTP sent successfully",
      data: {
        otp: loginOtp, // Only for development
      },
    });
  } catch (error) {
    console.error("Resend login OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const account = await Account.findById(req.account._id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Get role-specific data
    let roleData = null;

    // Check for psychiatrist role
    if (account.roles.includes("psychiatrist")) {
      const psychiatristData = await Psychiatrist.findOne({
        accountId: account._id,
      });
      if (psychiatristData) {
        roleData = psychiatristData;
      }
    }

    // Check for patient role
    else if (account.roles.includes("patient")) {
      const patientData = await Patient.findOne({
        accountId: account._id,
      });
      if (patientData) {
        roleData = patientData;
      }
    }

    // Check for admin role
    else if (account.roles.includes("admin")) {
      const adminData = await Admin.findOne({
        accountId: account._id,
      });
      if (adminData) {
        roleData = adminData;
      }
    }

    res.json({
      success: true,
      data: {
        _id: account._id,
        name: account.name,
        email: account.email,
        roles: account.roles,
        emailVerified: account.emailVerified,
        roleData,
      },
    });
  } catch (error) {
    console.error("Get account error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching account data",
    });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Find account by email
    const account = await Account.findOne({ email });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "No account found with that email",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    account.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire time (1 hour)
    account.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    await account.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email
    await sendResetPasswordEmail(email, resetUrl);

    res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing forgot password request",
    });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Hash token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find account with token and check if token is still valid
    const account = await Account.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!account) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Set new password
    account.password = newPassword;
    account.resetPasswordToken = undefined;
    account.resetPasswordExpires = undefined;

    await account.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
};

// @desc    Register patient
// @route   POST /api/auth/patient/register
// @access  Public
exports.registerPatient = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password, name, dateOfBirth, gender } = req.body;

    // Register patient
    const { patient, otp, error } = await authModel.registerPatient({
      email,
      password,
      name,
      dateOfBirth,
      gender,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Generate token
    const token = generateToken(patient._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your account using the OTP.",
      data: {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        token,
        otp, // Send OTP in response (only for development)
      },
    });
  } catch (error) {
    console.error("Patient registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// @desc    Login patient
// @route   POST /api/auth/patient/login
// @access  Public
exports.loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Check if patient exists
    const patient = await Patient.findOne({ email }).select("+password");
    if (!patient) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if email is verified
    if (!patient.emailVerified) {
      // Generate new OTP for email verification
      const otp = patient.generateOTP();
      await patient.save();

      // Send OTP email
      await sendOTPEmail(email, otp);

      return res.status(200).json({
        success: false,
        requiresEmailVerification: true,
        id: patient._id,
        message: "Email not verified. Verification code sent to your email.",
      });
    }

    // Check if password matches
    const isMatch = await patient.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(patient._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    res.json({
      success: true,
      data: {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        token,
      },
    });
  } catch (error) {
    console.error("Patient login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Get patient profile
// @route   GET /api/auth/patient/me
// @access  Private
exports.getPatientProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.patient,
    });
  } catch (error) {
    console.error("Get patient profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching patient profile",
    });
  }
};

// @desc    Verify patient OTP
// @route   POST /api/auth/patient/verify-otp
// @access  Public
exports.verifyPatientOTP = async (req, res) => {
  try {
    const { id, otp } = req.body;

    if (!id || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide patient ID and OTP",
      });
    }

    const { patient, error } = await authModel.verifyPatientOTP(id, otp);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Generate token
    const token = generateToken(patient._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    res.status(200).json({
      success: true,
      message: "OTP verification successful",
      data: {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        token,
      },
    });
  } catch (error) {
    console.error("Patient OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

// @desc    Resend patient OTP
// @route   POST /api/auth/patient/resend-otp
// @access  Public
exports.resendPatientOTP = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Please provide patient ID",
      });
    }

    const { otp, error } = await authModel.resendPatientOTP(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "OTP resent successfully",
      data: {
        otp, // Only for development
      },
    });
  } catch (error) {
    console.error("Resend patient OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};

// @desc    Forgot patient password
// @route   POST /api/auth/patient/forgot-password
// @access  Public
exports.forgotPatientPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Find patient by email
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "No patient found with that email",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    patient.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire time (1 hour)
    patient.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    await patient.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/patient/reset-password?token=${resetToken}`;

    // Send email
    await sendResetPasswordEmail(email, resetUrl);

    res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Forgot patient password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing forgot password request",
    });
  }
};

// @desc    Reset patient password
// @route   POST /api/auth/patient/reset-password
// @access  Public
exports.resetPatientPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Hash token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find patient with token and check if token is still valid
    const patient = await Patient.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Set new password
    patient.password = newPassword;
    patient.resetPasswordToken = undefined;
    patient.resetPasswordExpires = undefined;

    await patient.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset patient password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
};

// @desc    Register psychiatrist
// @route   POST /api/auth/psychiatrist/register
// @access  Public
exports.registerPsychiatrist = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      email,
      password,
      name,
      phone_number,
      gender,
      date_of_birth,
      country_of_nationality,
      country_of_graduation,
      date_of_graduation,
      institute_name,
      license_number,
      degrees,
      years_of_experience,
      expertise,
      bio,
      certificateUrl,
    } = req.body;

    // Register psychiatrist
    const { psychiatrist, otp, error } = await authModel.registerPsychiatrist({
      email,
      password,
      name,
      phone_number,
      gender,
      date_of_birth,
      country_of_nationality,
      country_of_graduation,
      date_of_graduation,
      institute_name,
      license_number,
      degrees,
      years_of_experience,
      expertise,
      bio,
      certificateUrl,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Generate token
    const token = generateToken(psychiatrist._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your account using the OTP.",
      data: {
        _id: psychiatrist._id,
        name: psychiatrist.name,
        email: psychiatrist.email,
        token,
        otp, // Send OTP in response (only for development)
      },
    });
  } catch (error) {
    console.error("Psychiatrist registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// @desc    Login psychiatrist
// @route   POST /api/auth/psychiatrist/login
// @access  Public
exports.loginPsychiatrist = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check if psychiatrist exists
    const psychiatrist = await Psychiatrist.findOne({ email }).select(
      "+password"
    );

    if (!psychiatrist) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if email is verified
    if (!psychiatrist.emailVerified) {
      // Generate new OTP and send it
      const otp = psychiatrist.generateOTP();
      await psychiatrist.save();

      return res.status(403).json({
        success: false,
        message: "Email not verified. A new OTP has been sent.",
        id: psychiatrist._id,
        emailVerified: false,
      });
    }

    // Check if psychiatrist is approved
    if (!psychiatrist.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval",
      });
    }

    // Check if password matches
    const isMatch = await psychiatrist.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Create token
    const token = generateToken(psychiatrist._id);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(200).json({
      success: true,
      token,
      data: {
        _id: psychiatrist._id,
        name: psychiatrist.name,
        email: psychiatrist.email,
        expertise: psychiatrist.expertise,
        isApproved: psychiatrist.isApproved,
        phone_number: psychiatrist.phone_number,
        gender: psychiatrist.gender,
        date_of_birth: psychiatrist.date_of_birth,
        country_of_nationality: psychiatrist.country_of_nationality,
        country_of_graduation: psychiatrist.country_of_graduation,
        date_of_graduation: psychiatrist.date_of_graduation,
        institute_name: psychiatrist.institute_name,
        license_number: psychiatrist.license_number,
        degrees: psychiatrist.degrees,
        years_of_experience: psychiatrist.years_of_experience,
        bio: psychiatrist.bio,
        specializations: psychiatrist.specializations,
        education: psychiatrist.education,
        availability: psychiatrist.availability,
      },
    });
  } catch (error) {
    console.error("Psychiatrist login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Get psychiatrist profile
// @route   GET /api/auth/psychiatrist/me
// @access  Private (Psychiatrist only)
exports.getPsychiatristProfile = async (req, res) => {
  try {
    // The psychiatrist is already attached to req by the protectPsychiatrist middleware
    // Fetch the complete psychiatrist profile with all fields
    const psychiatrist = await Psychiatrist.findById(req.psychiatrist._id);

    return res.status(200).json({
      success: true,
      data: {
        _id: psychiatrist._id,
        name: psychiatrist.name,
        email: psychiatrist.email,
        phone_number: psychiatrist.phone_number,
        gender: psychiatrist.gender,
        date_of_birth: psychiatrist.date_of_birth,
        country_of_nationality: psychiatrist.country_of_nationality,
        country_of_graduation: psychiatrist.country_of_graduation,
        date_of_graduation: psychiatrist.date_of_graduation,
        institute_name: psychiatrist.institute_name,
        license_number: psychiatrist.license_number,
        degrees: psychiatrist.degrees,
        years_of_experience: psychiatrist.years_of_experience,
        expertise: psychiatrist.expertise,
        bio: psychiatrist.bio,
        certificateUrl: psychiatrist.certificateUrl,
        isApproved: psychiatrist.isApproved,
        approvedAt: psychiatrist.approvedAt,
        approvedBy: psychiatrist.approvedBy,
        specializations: psychiatrist.specializations,
        education: psychiatrist.education,
        availability: psychiatrist.availability,
        emailVerified: psychiatrist.emailVerified,
        createdAt: psychiatrist.createdAt,
        updatedAt: psychiatrist.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get psychiatrist profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching psychiatrist profile",
    });
  }
};

// @desc    Verify psychiatrist OTP
// @route   POST /api/auth/psychiatrist/verify-otp
// @access  Public
exports.verifyPsychiatristOTP = async (req, res) => {
  try {
    const { id, otp } = req.body;

    if (!id || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide psychiatrist ID and OTP",
      });
    }

    const { psychiatrist, error } = await authModel.verifyPsychiatristOTP(
      id,
      otp
    );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Generate token
    const token = generateToken(psychiatrist._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    res.status(200).json({
      success: true,
      message: "OTP verification successful",
      data: {
        _id: psychiatrist._id,
        name: psychiatrist.name,
        email: psychiatrist.email,
        expertise: psychiatrist.expertise,
        isApproved: psychiatrist.isApproved,
        token,
      },
    });
  } catch (error) {
    console.error("Psychiatrist OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

// @desc    Resend psychiatrist OTP
// @route   POST /api/auth/psychiatrist/resend-otp
// @access  Public
exports.resendPsychiatristOTP = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Please provide psychiatrist ID",
      });
    }

    const { otp, error } = await authModel.resendPsychiatristOTP(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "OTP resent successfully",
      data: {
        otp, // Only for development
      },
    });
  } catch (error) {
    console.error("Resend psychiatrist OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};

// @desc    Forgot psychiatrist password
// @route   POST /api/auth/psychiatrist/forgot-password
// @access  Public
exports.forgotPsychiatristPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Find psychiatrist by email
    const psychiatrist = await Psychiatrist.findOne({ email });
    if (!psychiatrist) {
      return res.status(404).json({
        success: false,
        message: "No psychiatrist found with that email",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    psychiatrist.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire time (1 hour)
    psychiatrist.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    await psychiatrist.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/psychiatrist/reset-password?token=${resetToken}`;

    // Send email
    await sendResetPasswordEmail(email, resetUrl);

    res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Forgot psychiatrist password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing forgot password request",
    });
  }
};

// @desc    Reset psychiatrist password
// @route   POST /api/auth/psychiatrist/reset-password
// @access  Public
exports.resetPsychiatristPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Hash token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find psychiatrist with token and check if token is still valid
    const psychiatrist = await Psychiatrist.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!psychiatrist) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Set new password
    psychiatrist.password = newPassword;
    psychiatrist.resetPasswordToken = undefined;
    psychiatrist.resetPasswordExpires = undefined;

    await psychiatrist.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset psychiatrist password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
};

// @desc    Register admin
// @route   POST /api/auth/admin/register
// @access  Public
exports.registerAdmin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password, name, permissions, adminLevel, secretKey } =
      req.body;

    // Register admin
    const { admin, otp, error } = await authModel.registerAdmin({
      email,
      password,
      name,
      permissions,
      adminLevel,
      secretKey,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Generate token
    const token = generateToken(admin._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your account using the OTP.",
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        token,
        otp, // Send OTP in response (only for development)
      },
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// @desc    Login admin
// @route   POST /api/auth/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if email is verified
    if (!admin.emailVerified) {
      // Generate new OTP for email verification
      const otp = admin.generateOTP();
      await admin.save();

      // Send OTP email
      await sendOTPEmail(email, otp);

      return res.status(200).json({
        success: false,
        requiresEmailVerification: true,
        id: admin._id,
        message: "Email not verified. Verification code sent to your email.",
      });
    }

    // Check if password matches
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(admin._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    res.json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        permissions: admin.permissions,
        adminLevel: admin.adminLevel,
        token,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/auth/admin/me
// @access  Private
exports.getAdminProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.admin,
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching admin profile",
    });
  }
};

// @desc    Verify admin OTP
// @route   POST /api/auth/admin/verify-otp
// @access  Public
exports.verifyAdminOTP = async (req, res) => {
  try {
    const { id, otp } = req.body;

    if (!id || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide admin ID and OTP",
      });
    }

    const { admin, error } = await authModel.verifyAdminOTP(id, otp);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Generate token
    const token = generateToken(admin._id);

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiry)
    });

    res.status(200).json({
      success: true,
      message: "OTP verification successful",
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        permissions: admin.permissions,
        adminLevel: admin.adminLevel,
        token,
      },
    });
  } catch (error) {
    console.error("Admin OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

// @desc    Resend admin OTP
// @route   POST /api/auth/admin/resend-otp
// @access  Public
exports.resendAdminOTP = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Please provide admin ID",
      });
    }

    const { otp, error } = await authModel.resendAdminOTP(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "OTP resent successfully",
      data: {
        otp, // Only for development
      },
    });
  } catch (error) {
    console.error("Resend admin OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};

// @desc    Forgot admin password
// @route   POST /api/auth/admin/forgot-password
// @access  Public
exports.forgotAdminPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "No admin found with that email",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    admin.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire time (1 hour)
    admin.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    await admin.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`;

    // Send email
    await sendResetPasswordEmail(email, resetUrl);

    res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Forgot admin password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing forgot password request",
    });
  }
};

// @desc    Reset admin password
// @route   POST /api/auth/admin/reset-password
// @access  Public
exports.resetAdminPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Hash token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find admin with token and check if token is still valid
    const admin = await Admin.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Set new password
    admin.password = newPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;

    await admin.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset admin password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};
