import { motion } from "framer-motion";
import { AlertCircle, Brain } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PendingApprovalScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-250">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative border-b bg-white/80 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-gray-900"
          >
            <Brain className="h-6 w-6 text-sky-500" />
            <span className="text-lg font-medium">NeuroAssess</span>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-medium">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Pending Approval Content */}
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl shadow-sky-250 text-center"
        >
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Account Pending Approval
          </h1>
          <p className="text-gray-600 mb-6">
            Your psychiatrist account is currently under review by our
            administrators. You'll receive an email notification once your
            account has been approved.
          </p>
          <div className="p-4 bg-amber-50 rounded-xl text-amber-700 mb-6">
            <p>
              Please ensure your professional credentials are up to date. If you
              need to update any information, contact our support team.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors"
          >
            Return to Login
          </button>
        </motion.div>
      </div>
    </div>
  );
}
