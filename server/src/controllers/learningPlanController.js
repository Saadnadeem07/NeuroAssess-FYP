/**
 * This file contains the controller functions for handling learning plan operations.
 * It includes functions for creating and retrieving learning plans.
 */

const LearningPlan = require("../models/LearningPlan");
const Report = require("../models/Report");
const axios = require("axios");
const fs = require("fs");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);

// Helper function to generate a report name
const generateReportName = () => {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(":", "-");
  const date = now.toISOString().split("T")[0];
  return `${time}_${date}_learning-plan`;
};

// Helper function to send image to Hugging Face API
const sendToHuggingFaceAPI = async (imagePath, previousLearningPlan = null) => {
  try {
    console.log("Sending image to Hugging Face API:", imagePath);
    
    // Create a FormData-like object for the file upload
    const FormData = require('form-data');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    
    // If there's a previous learning plan, add it to the form data
    if (previousLearningPlan) {
      form.append('previousLearningPlan', previousLearningPlan);
    }
    
    // Send to Hugging Face API using the form data approach
    const response = await axios.post(
      process.env.HUGGING_FACE_API_URL || "https://theabdulbasit-fyp.hf.space/predict",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "Authorization": process.env.HUGGING_FACE_API_KEY ? `Bearer ${process.env.HUGGING_FACE_API_KEY}` : undefined
        },
        timeout: 30000 // 30 seconds timeout
      }
    );
    
    console.log("Hugging Face API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending image to Hugging Face API:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw new Error("Failed to process image with Hugging Face API: " + error.message);
  }
};

// Extract learning plan paragraph from API response
const extractLearningPlanParagraph = (apiResponse) => {
  console.log("Extracting learning plan from API response:", JSON.stringify(apiResponse).substring(0, 200) + "...");
  
  // Check for feedback.learning_plan field (highest priority)
  if (apiResponse && apiResponse.feedback && apiResponse.feedback.learning_plan) {
    console.log("Found learning plan in feedback.learning_plan");
    return apiResponse.feedback.learning_plan;
  }
  
  // Check for learning_plan field
  if (apiResponse && apiResponse.learning_plan) {
    console.log("Found learning plan in learning_plan");
    return apiResponse.learning_plan;
  }
  
  // Check for data array
  if (apiResponse && apiResponse.data && apiResponse.data.length > 0) {
    console.log("Found learning plan in data array");
    return apiResponse.data[0].toString();
  }
  
  // Check if the entire response is a string
  if (typeof apiResponse === 'string') {
    console.log("API response is a string");
    return apiResponse;
  }
  
  // Default fallback
  console.log("Using default learning plan text");
  return "A personalized learning plan will be generated based on your handwriting sample. Practice writing letters with consistent spacing and alignment. Focus on maintaining even pressure and proper letter formation.";
};

// Create or update a learning plan module
exports.createOrUpdateLearningPlanModule = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }
    
    console.log("File uploaded:", req.file.originalname, req.file.mimetype, req.file.size);
    
    // Get the user ID from the request body or patient object
    const userId = req.body.userId || (req.patient ? req.patient._id : null);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    
    // Get the module number from the request
    const moduleNumber = parseInt(req.body.moduleNumber || "1");
    
    if (![1, 2].includes(moduleNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module number. Must be 1 or 2.",
      });
    }
    
    // For module 2, check if module 1 exists
    if (moduleNumber === 2) {
      const module1Plan = await LearningPlan.findByUserIdAndModule(userId, 1);
      
      if (!module1Plan) {
        return res.status(400).json({
          success: false,
          message: "You must complete Module 1 before proceeding to Module 2.",
        });
      }
    }
    
    // Get the temporary file path
    const tempFilePath = req.file.path;
    
    // Get previous learning plan for module 2
    let previousLearningPlan = null;
    if (moduleNumber === 2 && req.body.previousLearningPlan) {
      previousLearningPlan = req.body.previousLearningPlan;
      console.log("Using previous learning plan for module 2:", previousLearningPlan.substring(0, 50) + "...");
    }
    
    // Send image to Hugging Face API
    const apiResponse = await sendToHuggingFaceAPI(tempFilePath, previousLearningPlan);
    
    // Generate report name
    const reportName = generateReportName();
    
    // Create a new report
    const report = new Report({
      report_name: reportName,
      report_type: "learning-plan",
      user_id: userId,
      report_data: apiResponse,
    });
    
    // Save the report
    await report.save();
    
    // Extract learning plan paragraph from API response
    const learningPlanParagraph = extractLearningPlanParagraph(apiResponse);
    
    // Check if a learning plan for this module already exists
    let learningPlan = await LearningPlan.findByUserIdAndModule(userId, moduleNumber);
    
    if (learningPlan) {
      // Update existing learning plan
      learningPlan.learning_plan_paragraph = learningPlanParagraph;
      learningPlan.report_id = report._id;
      await learningPlan.save();
    } else {
      // Create new learning plan
      learningPlan = new LearningPlan({
        user_id: userId,
        module_number: moduleNumber,
        learning_plan_paragraph: learningPlanParagraph,
        report_id: report._id,
      });
      
      await learningPlan.save();
    }
    
    // Clean up the temporary file
    await unlinkAsync(tempFilePath);
    
    return res.status(201).json({
      success: true,
      message: `Learning plan for Module ${moduleNumber} created/updated successfully`,
      results: apiResponse,
      learningPlan,
    });
  } catch (error) {
    console.error("Error creating/updating learning plan:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create/update learning plan",
    });
  }
};

// Get all learning plans for the current user
exports.getUserLearningPlans = async (req, res) => {
  try {
    // Get the user ID from the request query, body, or patient object
    const userId = req.query.userId || req.body.userId || (req.patient ? req.patient._id : null);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    
    console.log("Fetching learning plans for user:", userId);
    
    const learningPlans = await LearningPlan.findByUserId(userId);
    
    return res.status(200).json({
      success: true,
      learningPlans,
    });
  } catch (error) {
    console.error("Error fetching user learning plans:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user learning plans",
    });
  }
};

// Get a specific learning plan by module number
exports.getLearningPlanByModule = async (req, res) => {
  try {
    const moduleNumber = parseInt(req.params.moduleNumber);
    
    if (![1, 2].includes(moduleNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module number. Must be 1 or 2.",
      });
    }
    
    // Get the user ID from the request query, body, or patient object
    const userId = req.query.userId || req.body.userId || (req.patient ? req.patient._id : null);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    
    const learningPlan = await LearningPlan.findByUserIdAndModule(userId, moduleNumber);
    
    if (!learningPlan) {
      return res.status(404).json({
        success: false,
        message: `Learning plan for Module ${moduleNumber} not found`,
      });
    }
    
    return res.status(200).json({
      success: true,
      learningPlan,
    });
  } catch (error) {
    console.error("Error fetching learning plan by module:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch learning plan by module",
    });
  }
};

// Reset all learning plans for a user
exports.resetLearningPlans = async (req, res) => {
  try {
    // Get the user ID from the request body or patient object
    const userId = req.body.userId || (req.patient ? req.patient._id : null);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    
    console.log("Resetting learning plans for user:", userId);
    
    // Check if both modules exist
    const module1Plan = await LearningPlan.findByUserIdAndModule(userId, 1);
    const module2Plan = await LearningPlan.findByUserIdAndModule(userId, 2);
    
    if (!module1Plan || !module2Plan) {
      return res.status(400).json({
        success: false,
        message: "Cannot reset learning plans. Both modules must be completed first.",
      });
    }
    
    // Create a backup report with the completed learning plans
    const reportName = generateReportName() + "-completed";
    
    const report = new Report({
      report_name: reportName,
      report_type: "learning-plan-completed",
      user_id: userId,
      report_data: {
        module1: module1Plan.learning_plan_paragraph,
        module2: module2Plan.learning_plan_paragraph,
        completed_at: new Date().toISOString(),
      },
    });
    
    // Save the report
    await report.save();
    
    // Delete the learning plans
    await LearningPlan.deleteMany({ user_id: userId });
    
    return res.status(200).json({
      success: true,
      message: "Learning plans have been reset successfully. A backup has been saved in reports.",
      report_id: report._id,
    });
  } catch (error) {
    console.error("Error resetting learning plans:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset learning plans",
    });
  }
}; 