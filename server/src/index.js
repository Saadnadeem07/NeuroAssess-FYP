require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");

const connectDB = require("./config/database");
const authService = require("./services/authService");

const requestId = require("./middleware/requestId");
const { globalLimiter } = require("./middleware/rateLimit");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const { CLEANUP_INTERVAL_MS } = require("./utils/constants");

const isProd = process.env.NODE_ENV === "production";

connectDB();

const app = express();
app.set("trust proxy", 1);

// --- CORS allowlist (same in dev + prod) ----------------------------------
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow same-origin / curl / server-to-server (no origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Requested-With", "X-Request-Id"],
  exposedHeaders: ["X-Request-Id"],
};

// --- Middleware pipeline (order matters) ----------------------------------
app.use(requestId);
app.use(morgan(isProd ? "combined" : "dev"));
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(globalLimiter);

// --- Health check ---------------------------------------------------------
app.get("/api/health", async (_req, res) => {
  const dbState = mongoose.connection.readyState; // 1 === connected
  res.json({
    status: dbState === 1 ? "ok" : "degraded",
    db: dbState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// --- Routes ---------------------------------------------------------------
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/tests", require("./routes/tests"));
app.use("/api/learning-plans", require("./routes/learningPlans"));
app.use("/api/messages", require("./routes/messages"));

// --- 404 + error handler (must be last) -----------------------------------
app.use(notFound);
app.use(errorHandler);

// --- Scheduled cleanup of unverified accounts -----------------------------
let cleanupHandle = null;
const startCleanupJob = () => {
  cleanupHandle = setInterval(async () => {
    if (mongoose.connection.readyState !== 1) return;
    try {
      await authService.cleanupTemporaryPatients();
      await authService.cleanupTemporaryPsychiatrists();
    } catch (err) {
      console.error("[cleanup] error:", err.message);
    }
  }, CLEANUP_INTERVAL_MS);
};

mongoose.connection.once("connected", startCleanupJob);

const shutdown = (signal) => {
  console.log(`[shutdown] received ${signal}`);
  if (cleanupHandle) clearInterval(cleanupHandle);
  mongoose.connection.close(false).finally(() => process.exit(0));
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (err) => {
  console.error("[unhandled-rejection]", err);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaught-exception]", err);
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`[server] listening on :${PORT} (${process.env.NODE_ENV || "development"})`);
});

module.exports = app;
