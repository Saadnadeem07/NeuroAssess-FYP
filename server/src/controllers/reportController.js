/**
 * This file contains the controller functions for handling report-related operations.
 * It includes functions for creating, retrieving, and managing reports.
 */

const Report = require("../models/Report");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Helper function to generate a report name
const generateReportName = (type) => {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(":", "-");
  const date = now.toISOString().split("T")[0];
  return `${time}_${date}_${type}`;
};

// Helper function to send image to Hugging Face API
const sendToHuggingFaceAPI = async (imagePath) => {
  try {
    console.log("Sending image to Hugging Face API:", imagePath);
    
    // Create a FormData-like object for the file upload
    const FormData = require('form-data');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    
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

// Create a new initial test report
exports.createInitialTestReport = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }
    
    // Get the user ID from the request body
    const userId = req.body.userId || (req.user ? req.user.id : null);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    
    // Get the temporary file path
    const tempFilePath = req.file.path;
    
    // Convert image to base64 for storage
    const imageBuffer = fs.readFileSync(tempFilePath);
    const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
    
    // Send image to Hugging Face API
    const apiResponse = await sendToHuggingFaceAPI(tempFilePath);
    
    // Clean up the temporary file
    await unlinkAsync(tempFilePath);
    
    // Return the API response to the client regardless of whether we save it
    const responseToClient = {
      success: true,
      message: "Image processed successfully",
      results: apiResponse,
    };
    
    // Only store the report if potential dysgraphia is detected
    if (apiResponse.classification && 
        apiResponse.classification.class === "Potential Dysgraphia") {
      
      // Extract only the relevant information to store
      const relevantData = {
        classification: apiResponse.classification,
        feedback: apiResponse.feedback ? {
          summary: apiResponse.feedback.summary || null,
        } : null,
        dysgraphic_words: apiResponse.dysgraphic_words || [],
        spelling_errors: apiResponse.spelling_errors || [],
        alignment_issues: apiResponse.alignment_issues || [],
        spacing_issues: apiResponse.spacing_issues || [],
        image: base64Image // Store the image in base64 format
      };
      
      // Generate report name
      const reportName = generateReportName("testing");
      
      // Create a new report
      const report = new Report({
        report_name: reportName,
        report_type: "testing",
        user_id: userId,
        report_data: relevantData,
      });
      
      // Save the report
      await report.save();
      
      // Add report info to the response
      responseToClient.report = {
        _id: report._id,
        report_name: report.report_name,
        report_type: report.report_type,
        created_at: report.created_at,
      };
      responseToClient.message = "Initial test report created successfully";
    } else {
      responseToClient.message = "Image processed successfully. No dysgraphia detected, so no report was saved.";
    }
    
    return res.status(200).json(responseToClient);
  } catch (error) {
    console.error("Error creating initial test report:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create initial test report",
    });
  }
};

// Get all reports for the current user
exports.getUserReports = async (req, res) => {
  try {
    // Get the user ID from the request query, body, or user object
    const userId = req.query.userId || req.body.userId || (req.user ? req.user.id : null);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    
    const reports = await Report.findByUserId(userId);
    
    return res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Error fetching user reports:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user reports",
    });
  }
};

// Get a specific report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }
    
    // Get the user ID from the request query, body, or user object
    const userId = req.query.userId || req.body.userId || (req.user ? req.user.id : null);
    
    // Check if the report belongs to the current user
    if (userId && report.user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this report",
      });
    }
    
    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch report",
    });
  }
};

// Get reports by type
exports.getReportsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!["testing", "learning-plan", "learning-plan-completed"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report type",
      });
    }
    
    // Get the user ID from the request query, body, or user object
    const userId = req.query.userId || req.body.userId || (req.user ? req.user.id : null);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    
    const reports = await Report.findByUserIdAndType(userId, type);
    
    return res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Error fetching reports by type:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch reports by type",
    });
  }
}; 