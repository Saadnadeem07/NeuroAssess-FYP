const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  protectPatient,
  protectPsychiatrist,
  protectAdmin,
} = require("../middleware/auth");
const learningPlanController = require("../controllers/learningPlanController");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed (JPG, JPEG, PNG, GIF)"), false);
    }
    cb(null, true);
  },
});

// Get all learning plans for the current user
router.get("/", protectPatient, learningPlanController.getUserLearningPlans);

// Get a specific learning plan by module number
router.get(
  "/module/:moduleNumber",
  protectPatient,
  learningPlanController.getLearningPlanByModule
);

// Create or update a learning plan module
router.post(
  "/module",
  protectPatient,
  upload.single("image"),
  learningPlanController.createOrUpdateLearningPlanModule
);

// Reset all learning plans for a user
router.post(
  "/reset",
  protectPatient,
  learningPlanController.resetLearningPlans
);

module.exports = router;
