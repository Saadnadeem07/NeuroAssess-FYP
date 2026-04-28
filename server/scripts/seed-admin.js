/* eslint-disable no-console */
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../src/models/Admin");
const connectDB = require("../src/config/database");

const parseArgs = (argv) => {
  const out = {};
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
};

const main = async () => {
  const { email, name, password, level = "super" } = parseArgs(process.argv);
  if (!email || !name || !password) {
    console.error(
      "Usage: node scripts/seed-admin.js --email=admin@example.com --name='Admin Name' --password='S3cur3Pass!' [--level=junior|senior|super]"
    );
    process.exit(2);
  }

  await connectDB();

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.error(`Admin with email ${email} already exists.`);
    await mongoose.connection.close();
    process.exit(1);
  }

  const admin = await Admin.create({
    name,
    email,
    password,
    permissions:
      level === "super"
        ? ["super_admin", "manage_users", "manage_psychiatrists", "manage_content"]
        : ["manage_psychiatrists"],
    adminLevel: level,
    emailVerified: true,
    isTemporary: false,
  });

  console.log(`[seed-admin] created admin ${admin.email} (${admin._id})`);
  await mongoose.connection.close();
};

main().catch((err) => {
  console.error("[seed-admin] failed:", err);
  process.exit(1);
});
