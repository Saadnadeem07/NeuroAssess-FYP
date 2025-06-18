const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options are no longer needed in newer versions of Mongoose
      // but keeping them for compatibility
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log("--------------------------------------------");
    console.log("MongoDB Connection Details:");
    console.log("✅ MongoDB Connected Successfully!");
    console.log("--------------------------------------------");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
