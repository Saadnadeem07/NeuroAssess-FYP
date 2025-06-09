const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
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
    accountType: {
      type: String,
      enum: ["patient", "psychaterist"],
      default: "patient",
    },
    membershipStatus: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isTemporary: {
      type: Boolean,
      default: false,
    },
    tempPsychiatristData: {
      expertise: String,
      bio: String,
      certificateUrl: String,
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
userSchema.pre("save", async function (next) {
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
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Generate OTP
userSchema.methods.generateOTP = function () {
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
userSchema.methods.verifyOTP = function (candidateOTP) {
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
userSchema.methods.generateLoginOTP = function () {
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
userSchema.methods.verifyLoginOTP = function (candidateOTP) {
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

const User = mongoose.model("User", userSchema);

module.exports = User;
