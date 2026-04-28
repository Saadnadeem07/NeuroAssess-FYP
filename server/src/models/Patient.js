const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { BCRYPT_COST, OTP_TTL_MS, OTP_MAX_ATTEMPTS } = require("../utils/constants");

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
      attempts: { type: Number, default: 0 },
      lockedUntil: { type: Date, default: null },
    },
    loginOtp: {
      code: String,
      expiresAt: Date,
      attempts: { type: Number, default: 0 },
      lockedUntil: { type: Date, default: null },
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
    const salt = await bcrypt.genSalt(BCRYPT_COST);
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
  const otp = crypto.randomInt(100000, 1000000).toString();
  this.otp = {
    code: crypto.createHash("sha256").update(otp).digest("hex"),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
    lockedUntil: null,
  };
  return otp;
};

// Verify OTP — returns one of: { ok: true } | { ok: false, reason: "expired" | "invalid" | "locked" }
patientSchema.methods.verifyOTP = function (candidateOTP) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return { ok: false, reason: "invalid" };
  }
  if (this.otp.lockedUntil && this.otp.lockedUntil > new Date()) {
    return { ok: false, reason: "locked" };
  }
  if (this.otp.expiresAt < new Date()) {
    return { ok: false, reason: "expired" };
  }
  const hashedOTP = crypto.createHash("sha256").update(candidateOTP).digest("hex");
  if (this.otp.code !== hashedOTP) {
    this.otp.attempts = (this.otp.attempts || 0) + 1;
    if (this.otp.attempts >= OTP_MAX_ATTEMPTS) {
      this.otp.lockedUntil = new Date(Date.now() + OTP_TTL_MS);
    }
    return { ok: false, reason: "invalid" };
  }
  return { ok: true };
};

// Login OTP not currently used in the auth flow; helpers retained for future use.
patientSchema.methods.generateLoginOTP = function () {
  const otp = crypto.randomInt(100000, 1000000).toString();
  this.loginOtp = {
    code: crypto.createHash("sha256").update(otp).digest("hex"),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
    lockedUntil: null,
  };
  return otp;
};

patientSchema.methods.verifyLoginOTP = function (candidateOTP) {
  if (!this.loginOtp || !this.loginOtp.code || !this.loginOtp.expiresAt) return false;
  if (this.loginOtp.lockedUntil && this.loginOtp.lockedUntil > new Date()) return false;
  if (this.loginOtp.expiresAt < new Date()) return false;
  const hashedOTP = crypto.createHash("sha256").update(candidateOTP).digest("hex");
  return this.loginOtp.code === hashedOTP;
};

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
