const fs = require("fs");
const { promisify } = require("util");
const FormData = require("form-data");
const axios = require("axios");

const Report = require("../models/Report");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

const unlinkAsync = promisify(fs.unlink);

const generateReportName = (type) => {
  const now = new Date();
  const time = now
    .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    .replace(":", "-");
  const date = now.toISOString().split("T")[0];
  return `${time}_${date}_${type}`;
};

const sendToHuggingFaceAPI = async (imagePath) => {
  const url = process.env.HUGGING_FACE_API_URL;
  if (!url) {
    throw new AppError("HUGGING_FACE_API_URL is not configured", 503);
  }
  const form = new FormData();
  form.append("file", fs.createReadStream(imagePath));
  const response = await axios.post(url, form, {
    headers: {
      ...form.getHeaders(),
      ...(process.env.HUGGING_FACE_API_KEY
        ? { Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` }
        : {}),
    },
    timeout: 30000,
  });
  return response.data;
};

const cleanupTempFile = async (path) => {
  try {
    await unlinkAsync(path);
  } catch (err) {
    console.warn("[reports] failed to remove temp file", path, err.message);
  }
};

exports.createInitialTestReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw AppError.badRequest("No image file provided", ERROR_CODES.UPLOAD_INVALID);
  }
  const userId = req.patient._id;
  const tempFilePath = req.file.path;

  let apiResponse;
  try {
    const imageBuffer = fs.readFileSync(tempFilePath);
    const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString("base64")}`;
    apiResponse = await sendToHuggingFaceAPI(tempFilePath);

    const responseToClient = {
      success: true,
      message: "Image processed successfully",
      results: apiResponse,
    };

    if (
      apiResponse.classification &&
      apiResponse.classification.class === "Potential Dysgraphia"
    ) {
      const relevantData = {
        classification: apiResponse.classification,
        feedback: apiResponse.feedback
          ? { summary: apiResponse.feedback.summary || null }
          : null,
        dysgraphic_words: apiResponse.dysgraphic_words || [],
        spelling_errors: apiResponse.spelling_errors || [],
        alignment_issues: apiResponse.alignment_issues || [],
        spacing_issues: apiResponse.spacing_issues || [],
        image: base64Image,
      };

      const report = await Report.create({
        report_name: generateReportName("testing"),
        report_type: "testing",
        user_id: userId,
        report_data: relevantData,
      });

      responseToClient.report = {
        _id: report._id,
        report_name: report.report_name,
        report_type: report.report_type,
        created_at: report.created_at,
      };
      responseToClient.message = "Initial test report created successfully";
    } else {
      responseToClient.message =
        "Image processed successfully. No dysgraphia detected, so no report was saved.";
    }

    return res.status(200).json(responseToClient);
  } finally {
    await cleanupTempFile(tempFilePath);
  }
});

exports.getUserReports = asyncHandler(async (req, res) => {
  const reports = await Report.findByUserId(req.patient._id);
  return res.json({ success: true, data: reports });
});

exports.getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw AppError.notFound("Report not found");
  if (report.user_id.toString() !== req.patient._id.toString()) {
    throw AppError.forbidden("You are not authorized to access this report");
  }
  return res.json({ success: true, data: report });
});

exports.getReportsByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (!["testing", "learning-plan", "learning-plan-completed"].includes(type)) {
    throw AppError.badRequest("Invalid report type");
  }
  const reports = await Report.findByUserIdAndType(req.patient._id, type);
  return res.json({ success: true, data: reports });
});
