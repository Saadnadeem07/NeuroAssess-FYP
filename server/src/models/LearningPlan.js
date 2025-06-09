/**
 * This file defines the LearningPlan model for the application.
 * It uses Mongoose to create a schema and model for storing learning plan data in MongoDB.
 * The LearningPlan model includes fields for storing user ID, module number, learning plan paragraph,
 * and a reference to the associated report.
 */

const mongoose = require("mongoose");

const learningPlanSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "User ID is required"],
    },
    module_number: {
      type: Number,
      enum: [1, 2],
      required: [true, "Module number is required"],
    },
    learning_plan_paragraph: {
      type: String,
      required: [true, "Learning plan paragraph is required"],
    },
    report_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: [true, "Report ID is required"],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Create a compound index on user_id and module_number to ensure uniqueness per user and module
learningPlanSchema.index({ user_id: 1, module_number: 1 }, { unique: true });

// Static method to find learning plans by user ID
learningPlanSchema.statics.findByUserId = function (userId) {
  return this.find({ user_id: userId }).sort({ module_number: 1 });
};

// Static method to find learning plan by user ID and module number
learningPlanSchema.statics.findByUserIdAndModule = function (userId, moduleNumber) {
  return this.findOne({ user_id: userId, module_number: moduleNumber });
};

const LearningPlan = mongoose.model("LearningPlan", learningPlanSchema);

module.exports = LearningPlan;
