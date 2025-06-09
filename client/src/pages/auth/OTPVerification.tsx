import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Mail, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth";
import axios from "axios";

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserAfterOTPVerification, currentRole } = useAuth();
  const [otp, setOTP] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [isEmailVerification, setIsEmailVerification] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Get account data from location state
    const state = location.state as {
      email: string;
      id: string;
      isEmailVerification: boolean;
      role: string;
    } | null;

    console.log("OTP Verification - Location state:", state);

    if (!state?.email || !state?.id || !state?.role) {
      console.warn("Missing required state parameters, redirecting to login");
      navigate("/login");
      return;
    }

    setEmail(state.email);
    setAccountId(state.id);
    setRole(state.role);
    setIsEmailVerification(state.isEmailVerification !== false); // Default to true if not provided

    console.log("OTP Verification - Parameters set:", {
      email: state.email,
      accountId: state.id,
      role: state.role,
      isEmailVerification: state.isEmailVerification !== false,
    });
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !otp || !role) {
      setError("Account ID, role and verification code are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Email verification OTP
      const response = await authService.verifyOTP(role as any, accountId, otp);
      console.log("OTP verification response:", response);

      if (response.success) {
        setSuccess(response.message || "Verification successful");

        // Set user after successful verification
        await setUserAfterOTPVerification();

        // Redirect to appropriate dashboard based on role
        setTimeout(() => {
          if (role === "patient") {
            navigate("/patient/dashboard");
          } else if (role === "psychiatrist") {
            navigate("/psychiatrist/dashboard");
          } else if (role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      } else {
        setError(response.message || "Verification failed");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      
      // Add more detailed error logging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        setError(error.message || "An error occurred during verification");
      } else if (axios.isAxiosError(error)) {
        console.error("Axios error response:", error.response?.data);
        console.error("Axios error status:", error.response?.status);
        setError(error.response?.data?.message || "An error occurred during verification");
      } else {
        setError("An error occurred during verification");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!accountId || !role) {
      setError("Account ID and role are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Resend email verification OTP
      await authService.resendOTP(role as any, accountId);
      setSuccess("Verification code resent to your email");

      // Clear success message after a delay
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error("Resend OTP error:", error);
      
      // Add more detailed error logging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        setError(error.message || "Failed to resend verification code");
      } else if (axios.isAxiosError(error)) {
        console.error("Axios error response:", error.response?.data);
        console.error("Axios error status:", error.response?.status);
        setError(error.response?.data?.message || "Failed to resend verification code");
      } else {
        setError("Failed to resend verification code");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-250">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative border-b bg-white/80 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto flex h-16 items-center px-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-gray-900 hover:text-sky-600 transition-colors"
            onClick={() => navigate("/")}
          >
            <Brain className="h-6 w-6 text-sky-500" />
            <span className="text-lg font-medium">NeuroAssess</span>
          </motion.button>
        </div>
      </nav>

      {/* OTP Verification Form */}
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-xl shadow-sky-250"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {isEmailVerification
                  ? "Verify Your Email"
                  : "Login Verification"}
              </h1>
              <p className="mt-2 text-gray-600">
                We've sent a verification code to{" "}
                <span className="font-medium">{email}</span>
              </p>
              {currentRole && (
                <p className="mt-1 text-sm text-sky-600 font-medium">
                  Account type:{" "}
                  {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                </p>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600"
              >
                {success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* OTP Input */}
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOTP(e.target.value)}
                    maxLength={6}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-250 transition-all"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 rounded-xl font-medium shadow-lg shadow-sky-250 hover:shadow-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-gray-600">
              Didn't receive the code?{" "}
              <motion.button
                onClick={handleResendOTP}
                disabled={loading}
                className="text-sky-600 hover:text-sky-700 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Resend Code
              </motion.button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
