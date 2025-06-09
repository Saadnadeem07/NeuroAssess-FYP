const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer not to say"],
    },
    membershipStatus: {
      type: Boolean,
      default: false,
    },
    membershipExpiresAt: {
      type: Date,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isTemporary: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    loginOtp: {
      code: String,
      expiresAt: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
patientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
patientSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Generate OTP
patientSchema.methods.generateOTP = function () {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP before saving
  this.otp = {
    code: crypto.createHash("sha256").update(otp).digest("hex"),
    expiresAt: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
  };

  return otp; // Return plain OTP for sending to user
};

// Verify OTP
patientSchema.methods.verifyOTP = function (candidateOTP) {
  // Check if OTP exists and not expired
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }

  if (Date.now() > this.otp.expiresAt) {
    return false;
  }

  // Hash candidate OTP and compare
  const hashedOTP = crypto
    .createHash("sha256")
    .update(candidateOTP)
    .digest("hex");
  return this.otp.code === hashedOTP;
};

// Generate Login OTP
patientSchema.methods.generateLoginOTP = function () {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP before saving
  this.loginOtp = {
    code: crypto.createHash("sha256").update(otp).digest("hex"),
    expiresAt: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
  };

  return otp; // Return plain OTP for sending to user
};

// Verify Login OTP
patientSchema.methods.verifyLoginOTP = function (candidateOTP) {
  // Check if OTP exists and not expired
  if (!this.loginOtp || !this.loginOtp.code || !this.loginOtp.expiresAt) {
    return false;
  }

  if (Date.now() > this.loginOtp.expiresAt) {
    return false;
  }

  // Hash candidate OTP and compare
  const hashedOTP = crypto
    .createHash("sha256")
    .update(candidateOTP)
    .digest("hex");
  return this.loginOtp.code === hashedOTP;
};

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
