const { check } = require("express-validator");

const MIN_LEN = 8;

const passwordValidator = (field = "password") =>
  check(field)
    .isString()
    .withMessage("Password is required")
    .isLength({ min: MIN_LEN })
    .withMessage(`Password must be at least ${MIN_LEN} characters long`)
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number");

module.exports = {
  MIN_LEN,
  passwordValidator,
};
