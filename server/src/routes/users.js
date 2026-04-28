const express = require("express");
const router = express.Router();

const {
  protectPatient,
  protectPsychiatrist,
  protectAdmin,
  protectPatientOrPsychiatrist,
} = require("../middleware/auth");
const Psychiatrist = require("../models/Psychiatrist");
const Patient = require("../models/Patient");
const Admin = require("../models/Admin");

const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const {
  publicPsychiatristFields,
  safePatient,
  safePsychiatrist,
  safeAdmin,
} = require("../utils/sanitize");

// --- Psychiatrist directory (auth required) ------------------------------

router.get(
  "/psychiatrists/approved",
  protectPatientOrPsychiatrist,
  asyncHandler(async (req, res) => {
    const psychiatrists = await Psychiatrist.find({
      isApproved: true,
      emailVerified: true,
      "availability.workingDays.0": { $exists: true },
    });
    return res.json({
      success: true,
      data: psychiatrists.map(publicPsychiatristFields),
    });
  })
);

router.get(
  "/psychiatrists/:id",
  protectPatientOrPsychiatrist,
  asyncHandler(async (req, res) => {
    const psychiatrist = await Psychiatrist.findOne({
      _id: req.params.id,
      isApproved: true,
      emailVerified: true,
    });
    if (
      !psychiatrist ||
      !psychiatrist.availability?.workingDays?.length
    ) {
      throw AppError.notFound("Psychiatrist not found or unavailable");
    }
    return res.json({ success: true, data: publicPsychiatristFields(psychiatrist) });
  })
);

router.put(
  "/psychiatrists/:id",
  protectPsychiatrist,
  asyncHandler(async (req, res) => {
    if (req.psychiatrist._id.toString() !== req.params.id) {
      throw AppError.forbidden("Not authorized to update this profile");
    }
    const allowed = ["name"]; // intentionally narrow; email change has its own flow
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
    const psychiatrist = await Psychiatrist.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!psychiatrist) throw AppError.notFound("Psychiatrist not found");
    return res.json({
      success: true,
      data: safePsychiatrist(psychiatrist),
      message: "Profile updated successfully",
    });
  })
);

router.put(
  "/psychiatrists/:id/availability",
  protectPsychiatrist,
  asyncHandler(async (req, res) => {
    if (req.psychiatrist._id.toString() !== req.params.id) {
      throw AppError.forbidden("Not authorized to update this availability");
    }
    const { startTime, endTime, workingDays } = req.body;
    if (!startTime || !endTime) {
      throw AppError.badRequest("Start time and end time are required");
    }
    const workingDaysArray = Array.isArray(workingDays) ? workingDays : [];
    const psychiatrist = await Psychiatrist.findByIdAndUpdate(
      req.params.id,
      { availability: { startTime, endTime, workingDays: workingDaysArray } },
      { new: true, runValidators: true }
    );
    if (!psychiatrist) throw AppError.notFound("Psychiatrist not found");
    return res.json({
      success: true,
      data: safePsychiatrist(psychiatrist),
      message: "Availability updated successfully",
    });
  })
);

// --- Self profile updates -------------------------------------------------

router.put(
  "/patients/:id",
  protectPatient,
  asyncHandler(async (req, res) => {
    if (req.patient._id.toString() !== req.params.id) {
      throw AppError.forbidden("Not authorized to update this user");
    }
    const allowed = ["name"];
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
    const patient = await Patient.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!patient) throw AppError.notFound("Patient not found");
    return res.json({
      success: true,
      data: safePatient(patient),
      message: "Profile updated successfully",
    });
  })
);

router.put(
  "/admins/:id",
  protectAdmin,
  asyncHandler(async (req, res) => {
    if (req.admin._id.toString() !== req.params.id) {
      throw AppError.forbidden("Not authorized to update this profile");
    }
    const allowed = ["name"];
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
    const admin = await Admin.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!admin) throw AppError.notFound("Admin not found");
    return res.json({
      success: true,
      data: safeAdmin(admin),
      message: "Profile updated successfully",
    });
  })
);

module.exports = router;
