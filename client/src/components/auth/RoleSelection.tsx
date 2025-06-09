import { motion } from "framer-motion";
import { User, Award, Brain, Home, LogIn, UserPlus } from "lucide-react";
import { UserRole } from "@/services/auth";
import { Link, useLocation } from "react-router-dom";

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void;
  title: string;
  subtitle: string;
}

export default function RoleSelection({
  onRoleSelect,
  title,
  subtitle,
}: RoleSelectionProps) {
  const location = useLocation();
  const isLoginPage = location.pathname.includes("login");
  const isRegisterPage = location.pathname.includes("register");

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-250 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center text-sky-600 hover:text-sky-700 transition-colors cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Brain className="h-10 w-10 mr-2" />
              <span className="text-2xl font-bold">NeuroAssess</span>
            </motion.div>
          </Link>
        </div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-center text-3xl font-extrabold text-gray-900"
        >
          {title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-center text-sm text-gray-600"
        >
          {subtitle}
        </motion.p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white py-8 px-4 shadow-xl shadow-sky-250 sm:rounded-3xl sm:px-10"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onRoleSelect("patient")}
                className="flex flex-col items-center justify-center p-6 border-2 border-sky-250 rounded-2xl bg-sky-50 hover:bg-sky-250 transition-colors"
              >
                <User className="h-14 w-14 text-sky-600 mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Patient / Student
                </h3>
                <p className="mt-2 text-sm text-gray-600 text-center">
                  Access mental health resources and connect with professionals
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onRoleSelect("psychiatrist")}
                className="flex flex-col items-center justify-center p-6 border-2 border-indigo-100 rounded-2xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <Award className="h-14 w-14 text-indigo-600 mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Psychiatrist
                </h3>
                <p className="mt-2 text-sm text-gray-600 text-center">
                  Provide mental health services and manage your practice
                </p>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-sky-600 border border-sky-200 rounded-full shadow-sm hover:bg-sky-50 transition-colors w-full sm:w-auto"
            >
              <Home size={18} />
              <span>Back to Home</span>
            </motion.button>
          </Link>

          {isLoginPage && (
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full shadow-sm hover:bg-indigo-100 transition-colors w-full sm:w-auto"
              >
                <UserPlus size={18} />
                <span>Create an Account</span>
              </motion.button>
            </Link>
          )}

          {isRegisterPage && (
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full shadow-sm hover:bg-indigo-100 transition-colors w-full sm:w-auto"
              >
                <LogIn size={18} />
                <span>Login to Account</span>
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
