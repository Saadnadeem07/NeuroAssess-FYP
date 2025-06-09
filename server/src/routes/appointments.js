const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const { protectPatient, protectPsychiatrist } = require("../middleware/auth");
const Patient = require("../models/Patient");
const Psychiatrist = require("../models/Psychiatrist");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to send appointment confirmation emails
const sendAppointmentEmail = async (appointment) => {
  try {
    // Format date consistently, ensuring we use UTC to avoid timezone issues
    const appointmentDate = new Date(appointment.date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC' // Ensure we interpret the date in UTC
    });

    // Email to patient
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: appointment.patientEmail,
      subject: "Your Appointment Confirmation",
      html: `
        <h1>Appointment Confirmation</h1>
        <p>Dear ${appointment.patientName},</p>
        <p>Your appointment with Dr. ${
          appointment.psychiatristName
        } has been scheduled for:</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${appointment.timeSlot}</p>
        <p>Thank you for using our service.</p>
        <p>Best regards,<br>Mental Health Support Team</p>
      `,
    });

    // Email to psychiatrist
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: appointment.psychiatristEmail,
      subject: "New Appointment Scheduled",
      html: `
        <h1>New Appointment</h1>
        <p>Dear Dr. ${appointment.psychiatristName},</p>
        <p>A new appointment has been scheduled with patient ${
          appointment.patientName
        }:</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${appointment.timeSlot}</p>
        <p>Thank you for your service.</p>
        <p>Best regards,<br>Mental Health Support Team</p>
      `,
    });

    console.log("Appointment confirmation emails sent successfully");
  } catch (error) {
    console.error("Error sending appointment emails:", error);
  }
};

// Helper function to send appointment cancellation emails
const sendCancellationEmail = async (appointment, cancelledBy) => {
  try {
    // Format date consistently, ensuring we use UTC to avoid timezone issues
    const appointmentDate = new Date(appointment.date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC' // Ensure we interpret the date in UTC
    });

    // Email to patient
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: appointment.patientEmail,
      subject: "Appointment Cancellation Notice",
      html: `
        <h1>Appointment Cancellation</h1>
        <p>Dear ${appointment.patientName},</p>
        <p>Your appointment with Dr. ${
          appointment.psychiatristName
        } scheduled for:</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${appointment.timeSlot}</p>
        <p>has been cancelled ${
          cancelledBy === "psychiatrist"
            ? "by the psychiatrist"
            : "at your request"
        }.</p>
        <p>If you did not request this cancellation or have any questions, please contact our support team.</p>
        <p>Best regards,<br>Mental Health Support Team</p>
      `,
    });

    // Email to psychiatrist
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: appointment.psychiatristEmail,
      subject: "Appointment Cancellation Notice",
      html: `
        <h1>Appointment Cancellation</h1>
        <p>Dear Dr. ${appointment.psychiatristName},</p>
        <p>The appointment with patient ${
          appointment.patientName
        } scheduled for:</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${appointment.timeSlot}</p>
        <p>has been cancelled ${
          cancelledBy === "patient" ? "by the patient" : "at your request"
        }.</p>
        <p>This time slot is now available for other appointments.</p>
        <p>Best regards,<br>Mental Health Support Team</p>
      `,
    });

    console.log("Appointment cancellation emails sent successfully");
  } catch (error) {
    console.error("Error sending cancellation emails:", error);
  }
};

// Middleware to check if the user is either a patient or a psychiatrist
const protectPatientOrPsychiatrist = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Get token from cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to get patient from token
      const patient = await Patient.findById(decoded.id).select("-password");
      if (patient) {
        req.patient = patient;
        return next();
      }

      // If not a patient, try to get psychiatrist from token
      const psychiatrist = await Psychiatrist.findById(decoded.id).select(
        "-password"
      );
      if (psychiatrist) {
        req.psychiatrist = psychiatrist;
        return next();
      }

      // If neither patient nor psychiatrist
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
  } catch (error) {
    next(error);
  }
};

// Create a new appointment (Patient books an appointment)
router.post("/", protectPatient, async (req, res) => {
  try {
    const { psychiatristId, date, timeSlot } = req.body;

    if (!psychiatristId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Psychiatrist ID, date, and time slot are required",
      });
    }

    // Get patient and psychiatrist details
    const patient = await Patient.findById(req.patient._id);
    const psychiatrist = await Psychiatrist.findById(psychiatristId);

    if (!patient || !psychiatrist) {
      return res.status(404).json({
        success: false,
        message: "Patient or psychiatrist not found",
      });
    }

    // Properly parse the appointment date to preserve the correct day
    // Parse the ISO string but ensure we keep the correct date regardless of timezone
    const isoDate = new Date(date);
    // Extract year, month, and day
    const year = isoDate.getUTCFullYear();
    const month = isoDate.getUTCMonth();
    const day = isoDate.getUTCDate();
    // Create new date object with the correct date at noon to avoid timezone issues
    const appointmentDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    
    const now = new Date();

    // Set both dates to the start of their respective days for date comparison
    const appointmentDay = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDay < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot book appointments for past dates",
      });
    }

    // If the appointment is for today, check if the time slot is in the past
    if (appointmentDay.getTime() === today.getTime()) {
      // Parse the time from the time slot (e.g., "2:00 PM - 2:30 PM" -> "2:00 PM")
      const timeStart = timeSlot.split(" - ")[0];
      const [hourStr, minuteStr] = timeStart.split(":");
      let [hour, minute] = [
        parseInt(hourStr),
        parseInt(minuteStr.split(" ")[0]),
      ];
      const isPM = timeStart.includes("PM");

      // Convert to 24-hour format
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;

      // Create a date object with the appointment time
      const appointmentDateTime = new Date(appointmentDate);
      appointmentDateTime.setHours(hour, minute, 0, 0);

      // Check if the appointment time is in the past
      if (appointmentDateTime < now) {
        return res.status(400).json({
          success: false,
          message: "Cannot book appointments for past time slots",
        });
      }
    }

    // Get the correct day of week based on the UTC date
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = daysOfWeek[appointmentDay.getUTCDay()];

    if (!psychiatrist.availability || !psychiatrist.availability.workingDays) {
      return res.status(400).json({
        success: false,
        message: "Psychiatrist has not set their availability",
      });
    }

    if (!psychiatrist.availability.workingDays.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: "Psychiatrist is not available on this day",
      });
    }

    // Check if the time slot is within the psychiatrist's working hours
    // This would require parsing the time slot string and comparing with availability
    // For simplicity, we'll skip this check for now

    // Create start and end of day for the appointment date
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if the psychiatrist already has an appointment at this time
    const existingAppointment = await Appointment.findOne({
      psychiatrist: psychiatristId,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $ne: "cancelled" },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    // Check if the patient already has an appointment at this time
    const existingPatientAppointment = await Appointment.findOne({
      patient: patient._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $ne: "cancelled" },
    });

    if (existingPatientAppointment) {
      return res.status(400).json({
        success: false,
        message: "You already have an appointment at this time",
      });
    }

    // Create the appointment
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

    // Send confirmation emails
    await sendAppointmentEmail(appointment);

    res.status(201).json({
      success: true,
      data: appointment,
      message: "Appointment booked successfully",
    });
  } catch (error) {
    console.error("Book appointment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all appointments for a patient
router.get("/patient", protectPatient, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.patient._id,
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Get patient appointments error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all appointments for a psychiatrist
router.get("/psychiatrist", protectPsychiatrist, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      psychiatrist: req.psychiatrist._id,
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Get psychiatrist appointments error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel an appointment (can be done by either patient or psychiatrist)
router.put("/cancel/:id", protectPatientOrPsychiatrist, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if the user is authorized to cancel this appointment
    let isAuthorized = false;
    let cancelledBy = "";

    if (
      req.patient &&
      appointment.patient.toString() === req.patient._id.toString()
    ) {
      isAuthorized = true;
      cancelledBy = "patient";
    } else if (
      req.psychiatrist &&
      appointment.psychiatrist.toString() === req.psychiatrist._id.toString()
    ) {
      isAuthorized = true;
      cancelledBy = "psychiatrist";
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this appointment",
      });
    }

    // Update the appointment status
    appointment.status = "cancelled";
    await appointment.save();

    // Send cancellation emails
    await sendCancellationEmail(appointment, cancelledBy);

    res.json({
      success: true,
      data: appointment,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get booked slots for a specific psychiatrist and date
router.get(
  "/booked-slots/:psychiatristId",
  protectPatientOrPsychiatrist,
  async (req, res) => {
    try {
      const { psychiatristId } = req.params;
      const { date } = req.query;

      if (!psychiatristId || !date) {
        return res.status(400).json({
          success: false,
          message: "Psychiatrist ID and date are required",
        });
      }

      // Parse the date and create start/end of day
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find all appointments for this psychiatrist on this date that are not cancelled
      const appointments = await Appointment.find({
        psychiatrist: psychiatristId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: "cancelled" },
      });

      // Extract the time slots
      const bookedSlots = appointments.map(
        (appointment) => appointment.timeSlot
      );

      res.json({
        success: true,
        data: bookedSlots,
      });
    } catch (error) {
      console.error("Get booked slots error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Get all unique patients for a psychiatrist
router.get("/psychiatrist/patients", protectPsychiatrist, async (req, res) => {
  try {
    // Find all unique patients who have appointments with this psychiatrist
    const appointments = await Appointment.find({
      psychiatrist: req.psychiatrist._id,
      status: { $ne: "cancelled" }, // Exclude cancelled appointments
    }).sort({ date: 1 });

    // Extract unique patient IDs
    const patientIds = [...new Set(appointments.map(app => app.patient.toString()))];
    
    // Create patient objects with relevant information
    const patients = appointments.reduce((result, appointment) => {
      const patientId = appointment.patient.toString();
      
      // If we haven't added this patient yet, add them to our result
      if (!result[patientId]) {
        result[patientId] = {
          _id: patientId,
          name: appointment.patientName,
          email: appointment.patientEmail,
          appointmentCount: 1,
          lastAppointment: appointment.date,
          nextAppointment: null,
          status: "Active"
        };
      } else {
        // Update appointment count
        result[patientId].appointmentCount++;
        
        // Update last appointment if this one is more recent
        if (new Date(appointment.date) > new Date(result[patientId].lastAppointment)) {
          result[patientId].lastAppointment = appointment.date;
        }
      }
      
      return result;
    }, {});
    
    // Calculate the next upcoming appointment for each patient
    const now = new Date();
    appointments.forEach(appointment => {
      const patientId = appointment.patient.toString();
      const appointmentDate = new Date(appointment.date);
      
      // If the appointment is in the future and is either the first future appointment
      // we've found for this patient or is sooner than the one we've already found
      if (
        appointmentDate > now && 
        appointment.status === "scheduled" &&
        (!patients[patientId].nextAppointment || 
         appointmentDate < new Date(patients[patientId].nextAppointment))
      ) {
        patients[patientId].nextAppointment = appointment.date;
      }
    });

    // Convert the patients object to an array
    const patientsList = Object.values(patients);

    res.json({
      success: true,
      count: patientsList.length,
      data: patientsList
    });
  } catch (error) {
    console.error("Get psychiatrist patients error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Simple endpoint to test if patients route is working
router.get("/psychiatrist/patients-test", protectPsychiatrist, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Test endpoint is working properly",
      data: []
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all psychiatrists that a patient has appointments with
router.get("/my-psychiatrists", protectPatient, async (req, res) => {
  try {
    const patientId = req.patient._id;

    // Find all active appointments for this patient
    const appointments = await Appointment.find({
      patient: patientId,
      status: { $ne: "cancelled" }
    }).populate("psychiatrist", "name");

    // Extract unique psychiatrists
    const psychiatrists = [];
    const psychiatristIds = new Set();

    appointments.forEach(appointment => {
      if (appointment.psychiatrist && !psychiatristIds.has(appointment.psychiatrist._id.toString())) {
        psychiatristIds.add(appointment.psychiatrist._id.toString());
        psychiatrists.push({
          _id: appointment.psychiatrist._id,
          name: appointment.psychiatrist.name
        });
      }
    });

    res.json({
      success: true,
      data: psychiatrists
    });
  } catch (error) {
    console.error("Error fetching psychiatrists:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all patients that have appointments with a psychiatrist
router.get("/psychiatrist/patients", protectPsychiatrist, async (req, res) => {
  try {
    const psychiatristId = req.psychiatrist._id;

    // Find all active appointments for this psychiatrist
    const appointments = await Appointment.find({
      psychiatrist: psychiatristId,
      status: { $ne: "cancelled" }
    }).populate("patient", "name");

    // Extract unique patients
    const patients = [];
    const patientIds = new Set();

    appointments.forEach(appointment => {
      if (appointment.patient && !patientIds.has(appointment.patient._id.toString())) {
        patientIds.add(appointment.patient._id.toString());
        patients.push({
          _id: appointment.patient._id,
          name: appointment.patient.name
        });
      }
    });

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
