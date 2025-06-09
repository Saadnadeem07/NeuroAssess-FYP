const Account = require("./Account");
const Patient = require("./Patient");
const Psychiatrist = require("./Psychiatrist");
const Admin = require("./Admin");
const { sendOTPEmail } = require("../services/emailService");

exports.registerUser = async ({
  email,
  password,
  name,
  role,
  expertise,
  bio,
  certificateUrl,
  // Patient specific fields
  dateOfBirth,
  gender,
}) => {
  try {
    // Create account with temporary flag
    const account = await Account.create({
      email,
      password,
      name,
      roles: [role], // Store role in roles array
      isTemporary: true, // Add temporary flag
    });

    // Generate OTP
    const otp = account.generateOTP();
    await account.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      throw new Error("Failed to send verification email");
    }

    // Store role-specific data temporarily
    let roleData = null;

    // For psychiatrist role
    if (role === "psychiatrist") {
      // Validate required fields
      if (!expertise || !bio || !certificateUrl) {
        throw new Error(
          "Missing required fields for psychiatrist registration"
        );
      }

      // Store psychiatrist data temporarily
      roleData = {
        accountId: account._id,
        expertise,
        bio,
        certificateUrl,
        isApproved: false,
      };
    }

    // For patient role
    else if (role === "patient") {
      // Create patient profile
      roleData = {
        accountId: account._id,
        dateOfBirth,
        gender,
      };
    }

    // Store temporary role data
    account.tempRoleData = {
      role,
      data: roleData,
    };
    await account.save();

    return { account, otp };
  } catch (error) {
    console.error("Registration error:", error);
    return { error };
  }
};

exports.verifyOTP = async (accountId, otp) => {
  try {
    const account = await Account.findById(accountId);

    if (!account) {
      throw new Error("Account not found");
    }

    if (account.emailVerified) {
      throw new Error("Email already verified");
    }

    if (!account.verifyOTP(otp)) {
      throw new Error("Invalid or expired OTP");
    }

    // Update account - remove temporary flag and mark as verified
    account.emailVerified = true;
    account.isTemporary = false;
    account.otp = undefined;

    // Create role-specific profile if temporary data exists
    if (account.tempRoleData) {
      const { role, data } = account.tempRoleData;

      if (role === "psychiatrist") {
        await Psychiatrist.create({
          accountId: account._id,
          expertise: data.expertise,
          bio: data.bio,
          certificateUrl: data.certificateUrl,
          isApproved: false,
        });
      } else if (role === "patient") {
        await Patient.create({
          accountId: account._id,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
        });
      } else if (role === "admin") {
        await Admin.create({
          accountId: account._id,
          permissions: ["manage_psychiatrists"],
        });
      }

      // Clear temporary data
      account.tempRoleData = undefined;
    }

    await account.save();

    return { account };
  } catch (error) {
    console.error("OTP verification error:", error);
    return { error };
  }
};

exports.resendOTP = async (accountId) => {
  try {
    const account = await Account.findById(accountId);

    if (!account) {
      throw new Error("Account not found");
    }

    if (account.emailVerified) {
      throw new Error("Email already verified");
    }

    // Generate new OTP
    const otp = account.generateOTP();
    await account.save();

    // Send new OTP email
    const emailResult = await sendOTPEmail(account.email, otp);
    if (!emailResult.success) {
      throw new Error("Failed to send verification email");
    }

    return { otp };
  } catch (error) {
    console.error("Resend OTP error:", error);
    return { error };
  }
};

exports.handleSignedIn = async (accountId) => {
  try {
    // Update account's emailVerified status
    await Account.findByIdAndUpdate(accountId, {
      emailVerified: true,
    });

    console.log("Account email verified status updated");
  } catch (error) {
    console.error("Error handling signed in event:", error);
  }
};

// Clean up temporary accounts that were never verified
// This can be run as a scheduled job
exports.cleanupTemporaryAccounts = async () => {
  try {
    // Find temporary accounts created more than 5 minute ago
    const cutoffDate = new Date(Date.now() - 5 * 60 * 1000);

    const result = await Account.deleteMany({
      isTemporary: true,
      createdAt: { $lt: cutoffDate },
    });

    console.log(`✅ Cleaned up ${result.deletedCount} temporary accounts`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error("❌ Error cleaning up temporary accounts:", error);
    return { success: false, error };
  }
};

// Register a patient
exports.registerPatient = async ({
  email,
  password,
  name,
  dateOfBirth,
  gender,
}) => {
  try {
    // Check if patient already exists
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return { error: new Error("Patient already exists with this email") };
    }

    // Create patient with temporary flag
    const patient = await Patient.create({
      email,
      password,
      name,
      dateOfBirth,
      gender,
      isTemporary: true,
    });

    // Generate OTP
    const otp = patient.generateOTP();
    await patient.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      throw new Error("Failed to send verification email");
    }

    return { patient, otp };
  } catch (error) {
    console.error("Patient registration error:", error);
    return { error };
  }
};

// Register a psychiatrist
exports.registerPsychiatrist = async ({
  email,
  password,
  name,
  phone_number,
  gender,
  date_of_birth,
  country_of_nationality,
  country_of_graduation,
  date_of_graduation,
  institute_name,
  license_number,
  degrees,
  years_of_experience,
  expertise,
  bio,
  certificateUrl,
  specializations = [],
  education = [],
  availability = {},
}) => {
  try {
    // Check if psychiatrist already exists
    const existingPsychiatrist = await Psychiatrist.findOne({ email });
    if (existingPsychiatrist) {
      return {
        error: new Error("Psychiatrist already exists with this email"),
      };
    }

    // Validate required fields
    if (
      !expertise ||
      !bio ||
      !certificateUrl ||
      !phone_number ||
      !date_of_birth ||
      !country_of_nationality ||
      !country_of_graduation ||
      !date_of_graduation ||
      !institute_name ||
      !license_number ||
      !degrees ||
      !years_of_experience
    ) {
      return {
        error: new Error(
          "Missing required fields for psychiatrist registration"
        ),
      };
    }

    // Create psychiatrist with temporary flag
    const psychiatrist = await Psychiatrist.create({
      email,
      password,
      name,
      phone_number,
      gender,
      date_of_birth,
      country_of_nationality,
      country_of_graduation,
      date_of_graduation,
      institute_name,
      license_number,
      degrees,
      years_of_experience,
      expertise,
      bio,
      certificateUrl,
      specializations,
      education,
      availability,
      isApproved: false,
      isTemporary: true,
    });

    // Generate OTP
    const otp = psychiatrist.generateOTP();
    await psychiatrist.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      throw new Error("Failed to send verification email");
    }

    return { psychiatrist, otp };
  } catch (error) {
    console.error("Psychiatrist registration error:", error);
    return { error };
  }
};

// Register an admin
exports.registerAdmin = async ({
  email,
  password,
  name,
  permissions,
  adminLevel,
  secretKey,
}) => {
  try {
    // Validate secret key
    if (!secretKey || secretKey !== process.env.ADMIN_SECRET_KEY) {
      return { error: new Error("Invalid admin secret key") };
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return { error: new Error("Admin already exists with this email") };
    }

    // Create admin with temporary flag
    const admin = await Admin.create({
      email,
      password,
      name,
      permissions,
      adminLevel,
      isTemporary: true,
    });

    // Generate OTP
    const otp = admin.generateOTP();
    await admin.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      throw new Error("Failed to send verification email");
    }

    return { admin, otp };
  } catch (error) {
    console.error("Admin registration error:", error);
    return { error };
  }
};

// Verify OTP for patient
exports.verifyPatientOTP = async (patientId, otp) => {
  try {
    const patient = await Patient.findById(patientId);

    if (!patient) {
      throw new Error("Patient not found");
    }

    if (patient.emailVerified) {
      throw new Error("Email already verified");
    }

    if (!patient.verifyOTP(otp)) {
      throw new Error("Invalid or expired OTP");
    }

    // Update patient - remove temporary flag and mark as verified
    patient.emailVerified = true;
    patient.isTemporary = false;
    patient.otp = undefined;
    await patient.save();

    return { patient };
  } catch (error) {
    console.error("Patient OTP verification error:", error);
    return { error };
  }
};

// Verify OTP for psychiatrist
exports.verifyPsychiatristOTP = async (psychiatristId, otp) => {
  try {
    const psychiatrist = await Psychiatrist.findById(psychiatristId);

    if (!psychiatrist) {
      throw new Error("Psychiatrist not found");
    }

    if (psychiatrist.emailVerified) {
      throw new Error("Email already verified");
    }

    if (!psychiatrist.verifyOTP(otp)) {
      throw new Error("Invalid or expired OTP");
    }

    // Update psychiatrist - remove temporary flag and mark as verified
    psychiatrist.emailVerified = true;
    psychiatrist.isTemporary = false;
    psychiatrist.otp = undefined;
    await psychiatrist.save();

    return { psychiatrist };
  } catch (error) {
    console.error("Psychiatrist OTP verification error:", error);
    return { error };
  }
};

// Verify OTP for admin
exports.verifyAdminOTP = async (adminId, otp) => {
  try {
    const admin = await Admin.findById(adminId);

    if (!admin) {
      throw new Error("Admin not found");
    }

    if (admin.emailVerified) {
      throw new Error("Email already verified");
    }

    if (!admin.verifyOTP(otp)) {
      throw new Error("Invalid or expired OTP");
    }

    // Update admin - remove temporary flag and mark as verified
    admin.emailVerified = true;
    admin.isTemporary = false;
    admin.otp = undefined;
    await admin.save();

    return { admin };
  } catch (error) {
    console.error("Admin OTP verification error:", error);
    return { error };
  }
};

// Resend OTP for patient
exports.resendPatientOTP = async (patientId) => {
  try {
    const patient = await Patient.findById(patientId);

    if (!patient) {
      throw new Error("Patient not found");
    }

    if (patient.emailVerified) {
      throw new Error("Email already verified");
    }

    // Generate new OTP
    const otp = patient.generateOTP();
    await patient.save();

    // Send new OTP email
    const emailResult = await sendOTPEmail(patient.email, otp);
    if (!emailResult.success) {
      throw new Error("Failed to send verification email");
    }

    return { otp };
  } catch (error) {
    console.error("Resend patient OTP error:", error);
    return { error };
  }
};

// Resend OTP for psychiatrist
exports.resendPsychiatristOTP = async (psychiatristId) => {
  try {
    const psychiatrist = await Psychiatrist.findById(psychiatristId);

    if (!psychiatrist) {
      throw new Error("Psychiatrist not found");
    }

    if (psychiatrist.emailVerified) {
      throw new Error("Email already verified");
    }

    // Generate new OTP
    const otp = psychiatrist.generateOTP();
    await psychiatrist.save();

    // Send new OTP email
    const emailResult = await sendOTPEmail(psychiatrist.email, otp);
    if (!emailResult.success) {
      throw new Error("Failed to send verification email");
    }

    return { otp };
  } catch (error) {
    console.error("Resend psychiatrist OTP error:", error);
    return { error };
  }
};

// Resend OTP for admin
exports.resendAdminOTP = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);

    if (!admin) {
      throw new Error("Admin not found");
    }

    if (admin.emailVerified) {
      throw new Error("Email already verified");
    }

    // Generate new OTP
    const otp = admin.generateOTP();
    await admin.save();

    // Send new OTP email
    const emailResult = await sendOTPEmail(admin.email, otp);
    if (!emailResult.success) {
      throw new Error("Failed to send verification email");
    }

    return { otp };
  } catch (error) {
    console.error("Resend admin OTP error:", error);
    return { error };
  }
};

// Clean up temporary patients that were never verified
exports.cleanupTemporaryPatients = async () => {
  try {
    // Find temporary patients created more than 5 minutes ago
    const cutoffDate = new Date(Date.now() - 5 * 60 * 1000); //5 minutes
    // const cutoffDate = new Date(Date.now() - 1 * 5 * 1000); //5 seconds

    const result = await Patient.deleteMany({
      isTemporary: true,
      createdAt: { $lt: cutoffDate },
    });

    console.log(`✅ Cleaned up ${result.deletedCount} temporary patients`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error("❌ Error cleaning up temporary patients:", error);
    return { success: false, error };
  }
};

// Clean up temporary psychiatrists that were never verified
exports.cleanupTemporaryPsychiatrists = async () => {
  try {
    // Find temporary psychiatrists created more than 5 minutes ago
    const cutoffDate = new Date(Date.now() - 5 * 60 * 1000); //5 minutes
    // const cutoffDate = new Date(Date.now() - 1 * 5 * 1000); //5 seconds

    const result = await Psychiatrist.deleteMany({
      isTemporary: true,
      createdAt: { $lt: cutoffDate },
    });

    console.log(`✅ Cleaned up ${result.deletedCount} temporary psychiatrists`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error("❌ Error cleaning up temporary psychiatrists:", error);
    return { success: false, error };
  }
};
