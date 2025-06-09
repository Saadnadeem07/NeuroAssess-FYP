const jwt = require("jsonwebtoken");
const Patient = require("../models/Patient");
const Psychiatrist = require("../models/Psychiatrist");
const Admin = require("../models/Admin");

// Middleware to protect patient routes
const protectPatient = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Get token from cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get patient from token
      const patient = await Patient.findById(decoded.id).select("-password");

      if (!patient) {
        return res.status(401).json({
          success: false,
          message: "Not authorized to access this route",
        });
      }

      // Attach patient to request
      req.patient = patient;

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to protect psychiatrist routes
const protectPsychiatrist = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Get token from cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get psychiatrist from token
      const psychiatrist = await Psychiatrist.findById(decoded.id).select(
        "-password"
      );

      if (!psychiatrist) {
        return res.status(401).json({
          success: false,
          message: "Not authorized to access this route",
        });
      }

      // Attach psychiatrist to request
      req.psychiatrist = psychiatrist;

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to protect admin routes
const protectAdmin = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Get token from cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get admin from token
      const admin = await Admin.findById(decoded.id).select("-password");

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Not authorized to access this route",
        });
      }

      // Attach admin to request
      req.admin = admin;

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to check if psychiatrist is approved
const isApprovedPsychiatrist = async (req, res, next) => {
  try {
    if (!req.psychiatrist) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Psychiatrist role required.",
      });
    }

    if (!req.psychiatrist.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your psychiatrist account is pending approval.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to accept either patient or psychiatrist
const protectPatientOrPsychiatrist = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Get token from cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // First try to get patient
      const patient = await Patient.findById(decoded.id).select("-password");
      if (patient) {
        req.patient = patient;
        return next();
      }

      // If not a patient, try psychiatrist
      const psychiatrist = await Psychiatrist.findById(decoded.id).select("-password");
      if (psychiatrist) {
        req.psychiatrist = psychiatrist;
        return next();
      }

      // If neither, unauthorized
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protectPatient,
  protectPsychiatrist,
  protectAdmin,
  isApprovedPsychiatrist,
  protectPatientOrPsychiatrist,
};
