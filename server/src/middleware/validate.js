const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

// Use after express-validator chains:
//   router.post("/x", [chains], validate, controller)
module.exports = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));
  next(AppError.unprocessable("Validation failed", ERROR_CODES.VALIDATION_FAILED, details));
};
