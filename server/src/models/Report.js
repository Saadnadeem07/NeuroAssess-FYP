/**
 * This file defines the Report model for the application.
 * It uses Mongoose to create a schema and model for storing report-related data in MongoDB.
 * The Report model includes fields for storing report information such as name, type, user ID,
 * and the actual report data in JSON format.
 */

const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    report_name: {
      type: String,
      required: [true, "Report name is required"],
      trim: true,
    },
    report_type: {
      type: String,
      enum: ["testing", "learning-plan", "learning-plan-completed"],
      required: [true, "Report type is required"],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "User ID is required"],
    },
    report_data: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Report data is required"],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Create a compound index on user_id and report_name to ensure uniqueness per user
reportSchema.index({ user_id: 1, report_name: 1 }, { unique: true });

// Static method to find reports by user ID
reportSchema.statics.findByUserId = function (userId) {
  return this.find({ user_id: userId }).sort({ created_at: -1 });
};

// Static method to find reports by user ID and type
reportSchema.statics.findByUserIdAndType = function (userId, type) {
  return this.find({ user_id: userId, report_type: type }).sort({
    created_at: -1,
  });
};

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
