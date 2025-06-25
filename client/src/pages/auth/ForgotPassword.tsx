import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Mail } from "lucide-react";
import { authService } from "@/services/auth";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.forgotPassword("patient", email);
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred while sending the reset link");
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

      {/* Forgot Password Form */}
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-xl shadow-sky-250"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Forgot Password
              </h1>
              <p className="mt-2 text-gray-600">
                Enter your email and we'll send you a reset link
              </p>
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

            {success ? (
              <motion.div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600"
                >
                  Check your email for the password reset link.
                </motion.div>

                <motion.button
                  onClick={() => navigate("/login")}
                  className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Return to Login
                </motion.button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* Email Input */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? "Sending..." : "Send Reset Link"}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back to Login
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
