const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  protectPatient,
  protectPsychiatrist,
  protectAdmin,
} = require("../middleware/auth");
const reportController = require("../controllers/reportController");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname || '.jpg'));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Accept images based on mimetype as well as extension
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    
    // Check mimetype first
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    
    // Then check extension as fallback
    if (file.originalname && file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(null, true);
    }
    
    console.log("File rejected:", file);
    console.log("Mimetype:", file.mimetype);
    console.log("Original name:", file.originalname);
    
    return cb(new Error("Only image files (JPG, JPEG, PNG, GIF) are allowed!"), false);
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    console.error("Multer error:", err);
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    // An unknown error occurred
    console.error("File upload error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
  
  // No error occurred, continue
  next();
};

// Create a new initial test
router.post(
  "/initial",
  protectPatient,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        console.error("File upload error:", err);
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  reportController.createInitialTestReport
);

// Get all reports for the current user
router.get("/reports", protectPatient, reportController.getUserReports);

// Get a specific report by ID
router.get("/reports/:id", protectPatient, reportController.getReportById);

// Get reports by type
router.get(
  "/reports/type/:type",
  protectPatient,
  reportController.getReportsByType
);

module.exports = router;
