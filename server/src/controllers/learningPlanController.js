const fs = require("fs");
const { promisify } = require("util");
const FormData = require("form-data");
const axios = require("axios");

const LearningPlan = require("../models/LearningPlan");
const Report = require("../models/Report");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

const unlinkAsync = promisify(fs.unlink);

const generateReportName = () => {
  const now = new Date();
  const time = now
    .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    .replace(":", "-");
  const date = now.toISOString().split("T")[0];
  return `${time}_${date}_learning-plan`;
};

const sendToHuggingFaceAPI = async (imagePath, previousLearningPlan = null) => {
  const url = process.env.HUGGING_FACE_API_URL;
  if (!url) {
    throw new AppError("HUGGING_FACE_API_URL is not configured", 503);
  }
  const form = new FormData();
  form.append("file", fs.createReadStream(imagePath));
  if (previousLearningPlan) {
    form.append("previousLearningPlan", previousLearningPlan);
  }
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

const extractLearningPlanParagraph = (apiResponse) => {
  if (apiResponse?.feedback?.learning_plan) return apiResponse.feedback.learning_plan;
  if (apiResponse?.learning_plan) return apiResponse.learning_plan;
  if (Array.isArray(apiResponse?.data) && apiResponse.data.length > 0) {
    return apiResponse.data[0].toString();
  }
  if (typeof apiResponse === "string") return apiResponse;
  return "A personalized learning plan will be generated based on your handwriting sample.";
};

const cleanupTempFile = async (path) => {
  try {
    await unlinkAsync(path);
  } catch (err) {
    console.warn("[learning-plan] failed to remove temp file", path, err.message);
  }
};

exports.createOrUpdateLearningPlanModule = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw AppError.badRequest("No image file provided", ERROR_CODES.UPLOAD_INVALID);
  }

  const userId = req.patient._id;
  const moduleNumber = parseInt(req.body.moduleNumber || "1", 10);
  if (![1, 2].includes(moduleNumber)) {
    throw AppError.badRequest("Invalid module number. Must be 1 or 2.");
  }

  if (moduleNumber === 2) {
    const module1Plan = await LearningPlan.findByUserIdAndModule(userId, 1);
    if (!module1Plan) {
      throw AppError.badRequest("You must complete Module 1 before proceeding to Module 2.");
    }
  }

  const tempFilePath = req.file.path;
  try {
    let previousLearningPlan = null;
    if (moduleNumber === 2 && req.body.previousLearningPlan) {
      previousLearningPlan = req.body.previousLearningPlan;
    }

    const apiResponse = await sendToHuggingFaceAPI(tempFilePath, previousLearningPlan);

    const report = await Report.create({
      report_name: generateReportName(),
      report_type: "learning-plan",
      user_id: userId,
      report_data: apiResponse,
    });

    const learningPlanParagraph = extractLearningPlanParagraph(apiResponse);

    let learningPlan = await LearningPlan.findByUserIdAndModule(userId, moduleNumber);
    if (learningPlan) {
      learningPlan.learning_plan_paragraph = learningPlanParagraph;
      learningPlan.report_id = report._id;
      await learningPlan.save();
    } else {
      learningPlan = await LearningPlan.create({
        user_id: userId,
        module_number: moduleNumber,
        learning_plan_paragraph: learningPlanParagraph,
        report_id: report._id,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Learning plan for Module ${moduleNumber} created/updated successfully`,
      results: apiResponse,
      learningPlan,
    });
  } finally {
    await cleanupTempFile(tempFilePath);
  }
});

exports.getUserLearningPlans = asyncHandler(async (req, res) => {
  const plans = await LearningPlan.findByUserId(req.patient._id);
  return res.json({ success: true, data: plans });
});

exports.getLearningPlanByModule = asyncHandler(async (req, res) => {
  const moduleNumber = parseInt(req.params.moduleNumber, 10);
  if (![1, 2].includes(moduleNumber)) {
    throw AppError.badRequest("Invalid module number. Must be 1 or 2.");
  }
  const learningPlan = await LearningPlan.findByUserIdAndModule(req.patient._id, moduleNumber);
  if (!learningPlan) {
    throw AppError.notFound(`Learning plan for Module ${moduleNumber} not found`);
  }
  return res.json({ success: true, data: learningPlan });
});

exports.resetLearningPlans = asyncHandler(async (req, res) => {
  const userId = req.patient._id;
  const module1Plan = await LearningPlan.findByUserIdAndModule(userId, 1);
  const module2Plan = await LearningPlan.findByUserIdAndModule(userId, 2);

  if (!module1Plan || !module2Plan) {
    throw AppError.badRequest(
      "Cannot reset learning plans. Both modules must be completed first."
    );
  }

  const report = await Report.create({
    report_name: generateReportName() + "-completed",
    report_type: "learning-plan-completed",
    user_id: userId,
    report_data: {
      module1: module1Plan.learning_plan_paragraph,
      module2: module2Plan.learning_plan_paragraph,
      completed_at: new Date().toISOString(),
    },
  });

  await LearningPlan.deleteMany({ user_id: userId });

  return res.json({
    success: true,
    message: "Learning plans have been reset successfully. A backup has been saved in reports.",
    report_id: report._id,
  });
});
