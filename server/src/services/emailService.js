const nodemailer = require("nodemailer");

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP email
exports.sendOTPEmail = async (
  email,
  otp,
  subject = "Verify Your Email - NeuroAssess"
) => {
  try {
    const mailOptions = {
      from: `"NeuroAssess Support" <${process.env.EMAIL_USER}>`, // Correct format
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to NeuroAssess!</h2>
          <p>Thank you for registering. To complete your registration, please use the following verification code:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification code, please ignore this email.</p>
          <p>Best regards,<br>The NeuroAssess Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Send email error:", error);
    return { success: false, error };
  }
};

// Send Reset Password email
exports.sendResetPasswordEmail = async (email, resetUrl) => {
  try {
    const mailOptions = {
      from: `"NeuroAssess Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password - NeuroAssess",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your NeuroAssess account. Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>The NeuroAssess Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Send reset password email error:", error);
    return { success: false, error };
  }
};

// Send psychiatrist approval email
exports.sendApprovalEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: `"NeuroAssess Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Psychiatrist Account Has Been Approved - NeuroAssess",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Account Approved!</h2>
          <p>Congratulations, ${name}! Your psychiatrist account on NeuroAssess has been approved.</p>
          <p>You can now log in and start using all the features available to psychiatrists on our platform.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Log In Now</a>
          </div>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The NeuroAssess Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Send approval email error:", error);
    return { success: false, error };
  }
};

// Send psychiatrist rejection email
exports.sendRejectionEmail = async (email, name, reason) => {
  try {
    const mailOptions = {
      from: `"NeuroAssess Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Update on Your Psychiatrist Application - NeuroAssess",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Application Update</h2>
          <p>Dear ${name},</p>
          <p>Thank you for your interest in becoming a psychiatrist on the NeuroAssess platform.</p>
          <p>After careful review of your application, we regret to inform you that we are unable to approve your psychiatrist account at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>You may still use our platform as a patient, or you can submit a new psychiatrist application with updated information in the future.</p>
          <p>If you have any questions or would like further clarification, please contact our support team.</p>
          <p>Best regards,<br>The NeuroAssess Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Send rejection email error:", error);
    return { success: false, error };
  }
};

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection error:", error);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});
