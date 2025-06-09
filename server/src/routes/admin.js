const express = require("express");
const router = express.Router();
const { protectAdmin } = require("../middleware/auth");
const Psychiatrist = require("../models/Psychiatrist");
const User = require("../models/User");
const Patient = require("../models/Patient");
const {
  sendApprovalEmail,
  sendRejectionEmail,
} = require("../services/emailService");
const mongoose = require("mongoose");

// Get all psychiatrists (admin only)
router.get("/psychiatrists", protectAdmin, async (req, res) => {
  try {
    // Find all psychiatrist profiles
    const psychiatrists = await Psychiatrist.find();

    res.json({
      success: true,
      data: psychiatrists,
    });
  } catch (error) {
    console.error("Get psychiatrists error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get pending psychiatrist approvals (admin only)
router.get("/psychiatrists/pending", protectAdmin, async (req, res) => {
  try {
    // Find all psychiatrist profiles that are not approved
    const pendingPsychiatrists = await Psychiatrist.find({
      isApproved: false,
      emailVerified: true,
    });

    res.json({
      success: true,
      data: pendingPsychiatrists,
    });
  } catch (error) {
    console.error("Get pending psychiatrists error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Approve psychiatrist (admin only)
router.patch("/psychiatrists/:id/approve", protectAdmin, async (req, res) => {
  try {
    console.log(`Attempting to approve psychiatrist with ID: ${req.params.id}`);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error(`Invalid psychiatrist ID: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: "Invalid psychiatrist ID",
      });
    }

    // First, check if the psychiatrist exists
    const psychiatristExists = await Psychiatrist.findById(req.params.id);
    if (!psychiatristExists) {
      console.error(`Psychiatrist not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: "Psychiatrist not found",
      });
    }

    // Check if psychiatrist is already approved
    if (psychiatristExists.isApproved) {
      console.log(
        `Psychiatrist ${psychiatristExists.name} is already approved`
      );
      return res.status(400).json({
        success: false,
        message: "Psychiatrist is already approved",
      });
    }

    // Update psychiatrist profile with proper error handling
    try {
      const psychiatrist = await Psychiatrist.findByIdAndUpdate(
        req.params.id,
        {
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: req.admin.name || req.admin.email,
          // Ensure any additional fields from the updated schema are properly handled
          specializations: psychiatristExists.specializations || [],
          education: psychiatristExists.education || [],
          availability: psychiatristExists.availability || {},
        },
        { new: true, runValidators: true }
      );

      if (!psychiatrist) {
        console.error(
          `Failed to update psychiatrist with ID: ${req.params.id}`
        );
        return res.status(500).json({
          success: false,
          message: "Failed to update psychiatrist",
        });
      }

      console.log(
        `Successfully approved psychiatrist: ${psychiatrist.name} (${psychiatrist.email})`
      );

      // Send approval email
      try {
        await sendApprovalEmail(psychiatrist.email, psychiatrist.name);
        console.log(`Approval email sent to: ${psychiatrist.email}`);
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
        // Continue with the response even if email fails
      }

      return res.status(200).json({
        success: true,
        message: "Psychiatrist approved successfully",
        data: psychiatrist,
      });
    } catch (updateError) {
      console.error(`Error updating psychiatrist: ${updateError.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to update psychiatrist",
      });
    }
  } catch (error) {
    console.error("Approve psychiatrist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve psychiatrist",
    });
  }
});

// Reject psychiatrist (admin only)
router.patch("/psychiatrists/:id/reject", protectAdmin, async (req, res) => {
  try {
    console.log(`Attempting to reject psychiatrist with ID: ${req.params.id}`);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error(`Invalid psychiatrist ID: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: "Invalid psychiatrist ID",
      });
    }

    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    // Find the psychiatrist
    const psychiatrist = await Psychiatrist.findById(req.params.id);

    if (!psychiatrist) {
      console.error(`Psychiatrist not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: "Psychiatrist not found",
      });
    }

    console.log(
      `Found psychiatrist to reject: ${psychiatrist.name} (${psychiatrist.email})`
    );

    // Send rejection email with reason
    try {
      await sendRejectionEmail(psychiatrist.email, psychiatrist.name, reason);
      console.log(`Rejection email sent to: ${psychiatrist.email}`);
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
      // Continue with the deletion even if email fails
    }

    // Delete the psychiatrist
    try {
      await Psychiatrist.findByIdAndDelete(req.params.id);
      console.log(
        `Successfully deleted psychiatrist with ID: ${req.params.id}`
      );
    } catch (deleteError) {
      console.error(`Error deleting psychiatrist: ${deleteError.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to delete psychiatrist",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Psychiatrist application rejected",
    });
  } catch (error) {
    console.error("Reject psychiatrist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject psychiatrist",
    });
  }
});

// Get all users (admin only)
router.get("/users", protectAdmin, async (req, res) => {
  try {
    // Find all users
    const users = await User.find().select("-password");

    // Format the response
    const formattedUsers = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));

    res.json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get all patients (admin only)
router.get("/patients", protectAdmin, async (req, res) => {
  try {
    // Find all patients
    const patients = await Patient.find().select("-password");

    // Format the response
    const formattedPatients = patients.map((patient) => ({
      _id: patient._id,
      name: patient.name,
      email: patient.email,
      createdAt: patient.createdAt,
      lastLogin: patient.lastLogin || null,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      membershipStatus: patient.membershipStatus,
    }));

    res.json({
      success: true,
      data: formattedPatients,
    });
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get system settings (admin only)
router.get("/settings", protectAdmin, async (req, res) => {
  try {
    // In a real application, you would fetch settings from a database
    // For now, we'll return some default settings
    const settings = {
      emailNotifications: true,
      systemAlerts: true,
      dataRetention: "90",
      securityLevel: "high",
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update system settings (admin only)
router.put("/settings", protectAdmin, async (req, res) => {
  try {
    const { emailNotifications, systemAlerts, dataRetention, securityLevel } =
      req.body;

    // In a real application, you would update settings in a database
    // For now, we'll just return the updated settings
    const settings = {
      emailNotifications,
      systemAlerts,
      dataRetention,
      securityLevel,
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
