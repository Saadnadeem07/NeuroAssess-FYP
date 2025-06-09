const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const psychiatristSchema = new mongoose.Schema(
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
    phone_number: {
      type: String,
      required: [true, "Please provide your phone number"],
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: false,
    },
    date_of_birth: {
      type: Date,
      required: [true, "Please provide your date of birth"],
    },
    country_of_nationality: {
      type: String,
      required: [true, "Please provide your country of nationality"],
      trim: true,
    },
    country_of_graduation: {
      type: String,
      required: [true, "Please provide your country of graduation"],
      trim: true,
    },
    date_of_graduation: {
      type: Date,
      required: [true, "Please provide your date of graduation"],
    },
    institute_name: {
      type: String,
      required: [true, "Please provide your institute name"],
      trim: true,
    },
    license_number: {
      type: String,
      required: [true, "Please provide your license number"],
      trim: true,
    },
    degrees: {
      type: String,
      required: [true, "Please provide your degrees"],
      trim: true,
    },
    years_of_experience: {
      type: Number,
      required: [true, "Please provide your years of experience"],
    },
    expertise: {
      type: String,
      required: [true, "Please provide your area of expertise"],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, "Please provide a bio"],
      trim: true,
    },
    certificateUrl: {
      type: String,
      required: [true, "Please provide your certificate URL"],
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    specializations: {
      type: [String],
      default: [],
    },
    education: {
      type: [String],
      default: [],
    },
    availability: {
      type: {
        startTime: {
          type: String,
          default: "09:00",
        },
        endTime: {
          type: String,
          default: "17:00",
        },
        workingDays: {
          type: [String],
          default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        },
      },
      default: {
        startTime: "09:00",
        endTime: "17:00",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isTemporary: {
      type: Boolean,
      default: false,
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
psychiatristSchema.pre("save", async function (next) {
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
psychiatristSchema.methods.comparePassword = async function (
  candidatePassword
) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Generate OTP
psychiatristSchema.methods.generateOTP = function () {
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
psychiatristSchema.methods.verifyOTP = function (candidateOTP) {
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
psychiatristSchema.methods.generateLoginOTP = function () {
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
psychiatristSchema.methods.verifyLoginOTP = function (candidateOTP) {
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

const Psychiatrist = mongoose.model("Psychiatrist", psychiatristSchema);

module.exports = Psychiatrist;
