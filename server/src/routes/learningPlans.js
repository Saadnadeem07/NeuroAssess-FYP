const express = require("express");
const path = require("path");
const multer = require("multer");

const router = express.Router();

const { protectPatient } = require("../middleware/auth");
const learningPlanController = require("../controllers/learningPlanController");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/jpg"]);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(
        new AppError(
          "Only JPG/PNG/GIF images are allowed",
          400,
          ERROR_CODES.UPLOAD_INVALID
        )
      );
    }
    cb(null, true);
  },
});

router.get("/", protectPatient, learningPlanController.getUserLearningPlans);
router.get(
  "/module/:moduleNumber",
  protectPatient,
  learningPlanController.getLearningPlanByModule
);
router.post(
  "/module",
  protectPatient,
  upload.single("image"),
  learningPlanController.createOrUpdateLearningPlanModule
);
router.post("/reset", protectPatient, learningPlanController.resetLearningPlans);

module.exports = router;
