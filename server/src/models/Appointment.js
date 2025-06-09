const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    psychiatrist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Psychiatrist",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    notes: {
      type: String,
      default: "",
    },
    patientName: {
      type: String,
      required: true,
    },
    psychiatristName: {
      type: String,
      required: true,
    },
    // Store these for quick access without needing to populate references
    patientEmail: {
      type: String,
      required: true,
    },
    psychiatristEmail: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ psychiatrist: 1, date: 1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
