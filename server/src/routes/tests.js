const express = require("express");
const path = require("path");
const multer = require("multer");

const router = express.Router();

const { protectPatient } = require("../middleware/auth");
const reportController = require("../controllers/reportController");
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

router.post("/initial", protectPatient, upload.single("image"), reportController.createInitialTestReport);
router.get("/reports", protectPatient, reportController.getUserReports);
router.get("/reports/:id", protectPatient, reportController.getReportById);
router.get("/reports/type/:type", protectPatient, reportController.getReportsByType);

module.exports = router;
