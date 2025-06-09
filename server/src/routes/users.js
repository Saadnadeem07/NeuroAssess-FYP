const express = require("express");
const router = express.Router();
const {
  protectPatient,
  protectPsychiatrist,
  protectAdmin,
} = require("../middleware/auth");
const User = require("../models/User");
const PsychiatristProfile = require("../models/PsychiatristProfile");
const Psychiatrist = require("../models/Psychiatrist");
const Patient = require("../models/Patient");
const Admin = require("../models/Admin");

// Get all users (admin only)
router.get("/", protectAdmin, async (req, res) => {
  try {
    // Get all users
    const users = await User.find().select("-password");
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user by ID
router.get("/:id", protectPatient, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user
router.put("/:id", protectPatient, async (req, res) => {
  try {
    // Check if user is updating their own profile or is an admin
    if (req.patient._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user",
      });
    }

    const { name, email } = req.body;

    console.log(
      `Updating user ${req.params.id} with name: ${name}, email: ${email}`
    );

    // Update the Patient model
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    console.log(`Updated patient: ${patient.name}`);

    res.json({
      success: true,
      data: patient,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (admin only)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    // Also delete psychiatrist profile if exists
    await PsychiatristProfile.findOneAndDelete({ userId: req.params.id });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Comment out the temporary routes that are now handled by the auth routes
/*
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Store user details temporarily (consider using Redis or a temp DB collection)
  await TempUser.create({ name, email, password, otp });

  // Send OTP via email (use nodemailer)
  await sendOtpEmail(email, otp);

  res.status(200).json({ message: "OTP sent. Please verify your email." });
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const tempUser = await TempUser.findOne({ email });

  if (!tempUser) {
      return res.status(400).json({ message: "Invalid request." });
  }

  if (tempUser.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP. Try again." });
  }

  // Register the user after OTP verification
  const newUser = await User.create({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password, // Hash password before saving
  });

  // Delete temp user record
  await TempUser.deleteOne({ email });

  res.status(200).json({ message: "OTP verified. Registration successful!" });
});
*/

// Get all approved psychiatrists (for patients/users)
router.get("/psychiatrists/approved", async (req, res) => {
  try {
    // Find all approved psychiatrist profiles
    const psychiatrists = await Psychiatrist.find({
      isApproved: true,
      emailVerified: true,
    });

    // Filter out psychiatrists with no working days
    const filteredPsychiatrists = psychiatrists.filter(
      (psychiatrist) =>
        psychiatrist.availability &&
        psychiatrist.availability.workingDays &&
        psychiatrist.availability.workingDays.length > 0
    );

    res.json({
      success: true,
      data: filteredPsychiatrists,
    });
  } catch (error) {
    console.error("Get approved psychiatrists error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get psychiatrist by ID (for patients/users)
router.get("/psychiatrists/:id", async (req, res) => {
  try {
    // Find the psychiatrist by ID
    const psychiatrist = await Psychiatrist.findOne({
      _id: req.params.id,
      isApproved: true,
      emailVerified: true,
    });

    if (!psychiatrist) {
      return res.status(404).json({
        success: false,
        message: "Psychiatrist not found",
      });
    }

    // Check if the psychiatrist has working days set
    if (
      !psychiatrist.availability ||
      !psychiatrist.availability.workingDays ||
      psychiatrist.availability.workingDays.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Psychiatrist is not currently available for appointments",
      });
    }

    res.json({
      success: true,
      data: psychiatrist,
    });
  } catch (error) {
    console.error("Get psychiatrist error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update psychiatrist
router.put("/psychiatrists/:id", protectPsychiatrist, async (req, res) => {
  try {
    // Check if psychiatrist is updating their own profile
    if (req.psychiatrist._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this profile",
      });
    }

    const { name, email } = req.body;

    console.log(
      `Updating psychiatrist ${req.params.id} with name: ${name}, email: ${email}`
    );

    // Update the Psychiatrist model
    const psychiatrist = await Psychiatrist.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    );

    if (!psychiatrist) {
      return res.status(404).json({
        success: false,
        message: "Psychiatrist not found",
      });
    }

    console.log(`Updated psychiatrist: ${psychiatrist.name}`);

    res.json({
      success: true,
      data: psychiatrist,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update psychiatrist error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update psychiatrist availability
router.put(
  "/psychiatrists/:id/availability",
  protectPsychiatrist,
  async (req, res) => {
    try {
      // Check if psychiatrist is updating their own profile
      if (req.psychiatrist._id.toString() !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this availability",
        });
      }

      const { startTime, endTime, workingDays } = req.body;

      if (!startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: "Start time and end time are required",
        });
      }

      // Remove the validation that requires at least one working day
      // This allows psychiatrists to save with no days selected
      // if (
      //   !workingDays ||
      //   !Array.isArray(workingDays) ||
      //   workingDays.length === 0
      // ) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "At least one working day is required",
      //   });
      // }

      // Ensure workingDays is an array even if empty
      const workingDaysArray = Array.isArray(workingDays) ? workingDays : [];

      console.log(
        `Updating psychiatrist ${
          req.params.id
        } availability with startTime: ${startTime}, endTime: ${endTime}, workingDays: ${workingDaysArray.join(
          ", "
        )}`
      );

      // Update the Psychiatrist model with availability
      const psychiatrist = await Psychiatrist.findByIdAndUpdate(
        req.params.id,
        {
          availability: {
            startTime,
            endTime,
            workingDays: workingDaysArray,
          },
        },
        { new: true }
      );

      if (!psychiatrist) {
        return res.status(404).json({
          success: false,
          message: "Psychiatrist not found",
        });
      }

      console.log(
        `Updated psychiatrist availability for: ${psychiatrist.name}`
      );

      res.json({
        success: true,
        data: psychiatrist,
        message: "Availability updated successfully",
      });
    } catch (error) {
      console.error("Update psychiatrist availability error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Update admin
router.put("/admins/:id", protectAdmin, async (req, res) => {
  try {
    // Check if admin is updating their own profile
    if (req.admin._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this profile",
      });
    }

    const { name, email } = req.body;

    console.log(
      `Updating admin ${req.params.id} with name: ${name}, email: ${email}`
    );

    // Update the Admin model
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    console.log(`Updated admin: ${admin.name}`);

    res.json({
      success: true,
      data: admin,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
