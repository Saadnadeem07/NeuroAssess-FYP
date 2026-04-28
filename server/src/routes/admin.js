const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { protectAdmin } = require("../middleware/auth");
const Psychiatrist = require("../models/Psychiatrist");
const Patient = require("../models/Patient");
const Admin = require("../models/Admin");
const {
  sendApprovalEmail,
  sendRejectionEmail,
} = require("../services/emailService");

const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { safePsychiatrist, safePatient, safeAdmin } = require("../utils/sanitize");

router.get(
  "/psychiatrists",
  protectAdmin,
  asyncHandler(async (_req, res) => {
    const psychiatrists = await Psychiatrist.find().select("-password");
    return res.json({ success: true, data: psychiatrists.map(safePsychiatrist) });
  })
);

router.get(
  "/psychiatrists/pending",
  protectAdmin,
  asyncHandler(async (_req, res) => {
    const pending = await Psychiatrist.find({ isApproved: false, emailVerified: true }).select(
      "-password"
    );
    return res.json({ success: true, data: pending.map(safePsychiatrist) });
  })
);

router.patch(
  "/psychiatrists/:id/approve",
  protectAdmin,
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw AppError.badRequest("Invalid psychiatrist ID");
    }
    const existing = await Psychiatrist.findById(req.params.id);
    if (!existing) throw AppError.notFound("Psychiatrist not found");
    if (existing.isApproved) throw AppError.conflict("Psychiatrist is already approved");

    const psychiatrist = await Psychiatrist.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: req.admin._id,
      },
      { new: true, runValidators: true }
    );

    sendApprovalEmail(psychiatrist.email, psychiatrist.name).catch((err) =>
      console.warn("[admin] approval email failed", err.message)
    );

    return res.json({
      success: true,
      data: safePsychiatrist(psychiatrist),
      message: "Psychiatrist approved successfully",
    });
  })
);

router.patch(
  "/psychiatrists/:id/reject",
  protectAdmin,
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw AppError.badRequest("Invalid psychiatrist ID");
    }
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      throw AppError.badRequest("Rejection reason is required");
    }

    const psychiatrist = await Psychiatrist.findById(req.params.id);
    if (!psychiatrist) throw AppError.notFound("Psychiatrist not found");

    sendRejectionEmail(psychiatrist.email, psychiatrist.name, reason).catch((err) =>
      console.warn("[admin] rejection email failed", err.message)
    );

    await Psychiatrist.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Psychiatrist application rejected" });
  })
);

router.get(
  "/patients",
  protectAdmin,
  asyncHandler(async (_req, res) => {
    const patients = await Patient.find().select("-password");
    return res.json({
      success: true,
      data: patients.map((p) => ({
        _id: p._id,
        name: p.name,
        email: p.email,
        createdAt: p.createdAt,
        lastLogin: p.lastLogin || null,
        gender: p.gender,
        dateOfBirth: p.dateOfBirth,
        membershipStatus: p.membershipStatus,
      })),
    });
  })
);

router.get(
  "/admins",
  protectAdmin,
  asyncHandler(async (_req, res) => {
    const admins = await Admin.find().select("-password");
    return res.json({ success: true, data: admins.map(safeAdmin) });
  })
);

router.get(
  "/settings",
  protectAdmin,
  asyncHandler(async (_req, res) => {
    return res.json({
      success: true,
      data: {
        emailNotifications: true,
        systemAlerts: true,
        dataRetention: "90",
        securityLevel: "high",
      },
    });
  })
);

router.put(
  "/settings",
  protectAdmin,
  asyncHandler(async (req, res) => {
    const { emailNotifications, systemAlerts, dataRetention, securityLevel } = req.body;
    return res.json({
      success: true,
      data: { emailNotifications, systemAlerts, dataRetention, securityLevel },
    });
  })
);

module.exports = router;
