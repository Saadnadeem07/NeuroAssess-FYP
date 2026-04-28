const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("[db] MONGODB_URI is not set");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("[db] Connected to MongoDB");
  } catch (error) {
    console.error("[db] Connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
