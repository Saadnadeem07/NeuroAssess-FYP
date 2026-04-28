const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Psychiatrist = require("../models/Psychiatrist");

const {
  protectPatient,
  protectPsychiatrist,
  protectPatientOrPsychiatrist,
} = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

const sendAppointmentEmail = async (appointment) => {
  const formattedDate = formatDate(appointment.date);
  await Promise.allSettled([
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: appointment.patientEmail,
      subject: "Your Appointment Confirmation",
      html: `<h1>Appointment Confirmation</h1>
        <p>Dear ${appointment.patientName},</p>
        <p>Your appointment with Dr. ${appointment.psychiatristName} has been scheduled for:</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${appointment.timeSlot}</p>`,
    }),
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: appointment.psychiatristEmail,
      subject: "New Appointment Scheduled",
      html: `<h1>New Appointment</h1>
        <p>Dear Dr. ${appointment.psychiatristName},</p>
        <p>A new appointment has been scheduled with patient ${appointment.patientName}:</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${appointment.timeSlot}</p>`,
    }),
  ]);
};

const sendCancellationEmail = async (appointment, cancelledBy) => {
  const formattedDate = formatDate(appointment.date);
  await Promise.allSettled([
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: appointment.patientEmail,
      subject: "Appointment Cancellation Notice",
      html: `<h1>Appointment Cancellation</h1>
        <p>Dear ${appointment.patientName},</p>
        <p>Your appointment with Dr. ${appointment.psychiatristName} on
           <strong>${formattedDate}</strong> at <strong>${appointment.timeSlot}</strong>
           has been cancelled ${
             cancelledBy === "psychiatrist" ? "by the psychiatrist" : "at your request"
           }.</p>`,
    }),
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: appointment.psychiatristEmail,
      subject: "Appointment Cancellation Notice",
      html: `<h1>Appointment Cancellation</h1>
        <p>Dear Dr. ${appointment.psychiatristName},</p>
        <p>Appointment with ${appointment.patientName} on <strong>${formattedDate}</strong>
           at <strong>${appointment.timeSlot}</strong> has been cancelled
           ${cancelledBy === "patient" ? "by the patient" : "at your request"}.</p>`,
    }),
  ]);
};

router.post(
  "/",
  protectPatient,
  asyncHandler(async (req, res) => {
    const { psychiatristId, date, timeSlot } = req.body;
    if (!psychiatristId || !date || !timeSlot) {
      throw AppError.badRequest("Psychiatrist ID, date, and time slot are required");
    }

    const patient = await Patient.findById(req.patient._id);
    const psychiatrist = await Psychiatrist.findById(psychiatristId);
    if (!patient || !psychiatrist) {
      throw AppError.notFound("Patient or psychiatrist not found");
    }

    const isoDate = new Date(date);
    const year = isoDate.getUTCFullYear();
    const month = isoDate.getUTCMonth();
    const day = isoDate.getUTCDate();
    const appointmentDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    const appointmentDay = new Date(Date.UTC(year, month, day, 0, 0, 0));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDay < today) {
      throw AppError.badRequest("Cannot book appointments for past dates");
    }

    if (appointmentDay.getTime() === today.getTime()) {
      const timeStart = timeSlot.split(" - ")[0];
      const [hourStr, minuteStr] = timeStart.split(":");
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr.split(" ")[0], 10);
      const isPM = timeStart.includes("PM");
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      const apptDateTime = new Date(appointmentDate);
      apptDateTime.setHours(hour, minute, 0, 0);
      if (apptDateTime < new Date()) {
        throw AppError.badRequest("Cannot book appointments for past time slots");
      }
    }

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayOfWeek = daysOfWeek[appointmentDay.getUTCDay()];
    if (!psychiatrist.availability?.workingDays?.length) {
      throw AppError.badRequest("Psychiatrist has not set their availability");
    }
    if (!psychiatrist.availability.workingDays.includes(dayOfWeek)) {
      throw AppError.badRequest("Psychiatrist is not available on this day");
    }

    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflict = await Appointment.findOne({
      psychiatrist: psychiatristId,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $ne: "cancelled" },
    });
    if (conflict) throw AppError.conflict("This time slot is already booked");

    const patientConflict = await Appointment.findOne({
      patient: patient._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $ne: "cancelled" },
    });
    if (patientConflict) {
      throw AppError.conflict("You already have an appointment at this time");
    }

    const appointment = await Appointment.create({
      patient: patient._id,
      psychiatrist: psychiatrist._id,
      date: appointmentDate,
      timeSlot,
      patientName: patient.name,
      psychiatristName: psychiatrist.name,
      patientEmail: patient.email,
      psychiatristEmail: psychiatrist.email,
    });

    sendAppointmentEmail(appointment).catch((err) =>
      console.warn("[appointments] confirmation email failed", err.message)
    );

    return res.status(201).json({
      success: true,
      data: appointment,
      message: "Appointment booked successfully",
    });
  })
);

router.get(
  "/patient",
  protectPatient,
  asyncHandler(async (req, res) => {
    const appointments = await Appointment.find({ patient: req.patient._id }).sort({ date: 1 });
    return res.json({ success: true, data: appointments });
  })
);

router.get(
  "/psychiatrist",
  protectPsychiatrist,
  asyncHandler(async (req, res) => {
    const appointments = await Appointment.find({ psychiatrist: req.psychiatrist._id }).sort({
      date: 1,
    });
    return res.json({ success: true, data: appointments });
  })
);

router.put(
  "/cancel/:id",
  protectPatientOrPsychiatrist,
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) throw AppError.notFound("Appointment not found");

    let cancelledBy = null;
    if (
      req.patient &&
      appointment.patient.toString() === req.patient._id.toString()
    ) {
      cancelledBy = "patient";
    } else if (
      req.psychiatrist &&
      appointment.psychiatrist.toString() === req.psychiatrist._id.toString()
    ) {
      cancelledBy = "psychiatrist";
    }
    if (!cancelledBy) throw AppError.forbidden("Not authorized to cancel this appointment");

    appointment.status = "cancelled";
    await appointment.save();

    sendCancellationEmail(appointment, cancelledBy).catch((err) =>
      console.warn("[appointments] cancellation email failed", err.message)
    );

    return res.json({
      success: true,
      data: appointment,
      message: "Appointment cancelled successfully",
    });
  })
);

router.get(
  "/booked-slots/:psychiatristId",
  protectPatientOrPsychiatrist,
  asyncHandler(async (req, res) => {
    const { psychiatristId } = req.params;
    const { date } = req.query;
    if (!psychiatristId || !date) {
      throw AppError.badRequest("Psychiatrist ID and date are required");
    }
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      psychiatrist: psychiatristId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "cancelled" },
    });
    return res.json({ success: true, data: appointments.map((a) => a.timeSlot) });
  })
);

router.get(
  "/psychiatrist/patients",
  protectPsychiatrist,
  asyncHandler(async (req, res) => {
    const appointments = await Appointment.find({
      psychiatrist: req.psychiatrist._id,
      status: { $ne: "cancelled" },
    })
      .sort({ date: 1 })
      .populate("patient", "name");

    const patientsByid = new Map();
    const now = new Date();
    for (const appt of appointments) {
      const id = appt.patient?._id?.toString() || appt.patient.toString();
      if (!patientsByid.has(id)) {
        patientsByid.set(id, {
          _id: id,
          name: appt.patientName,
          email: appt.patientEmail,
          appointmentCount: 0,
          lastAppointment: appt.date,
          nextAppointment: null,
          status: "Active",
        });
      }
      const entry = patientsByid.get(id);
      entry.appointmentCount += 1;
      if (new Date(appt.date) > new Date(entry.lastAppointment)) {
        entry.lastAppointment = appt.date;
      }
      if (
        appt.status === "scheduled" &&
        new Date(appt.date) > now &&
        (!entry.nextAppointment || new Date(appt.date) < new Date(entry.nextAppointment))
      ) {
        entry.nextAppointment = appt.date;
      }
    }
    const data = Array.from(patientsByid.values());
    return res.json({ success: true, count: data.length, data });
  })
);

router.get(
  "/my-psychiatrists",
  protectPatient,
  asyncHandler(async (req, res) => {
    const appointments = await Appointment.find({
      patient: req.patient._id,
      status: { $ne: "cancelled" },
    }).populate("psychiatrist", "name");

    const seen = new Set();
    const data = [];
    for (const a of appointments) {
      const id = a.psychiatrist?._id?.toString();
      if (id && !seen.has(id)) {
        seen.add(id);
        data.push({ _id: id, name: a.psychiatrist.name });
      }
    }
    return res.json({ success: true, data });
  })
);

module.exports = router;
