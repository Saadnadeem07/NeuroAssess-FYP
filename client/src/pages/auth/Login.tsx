import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Mail, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PasswordInput } from "@/components/ui/password-input";
import RoleSelection from "@/components/auth/RoleSelection";
import { UserRole } from "@/services/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginPatient, loginPsychiatrist, currentRole, setRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setMessage(state.message);
    }
  }, [location]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!email.trim()) {
      errors.push("Email is required");
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.push("Please enter a valid email address");
    }

    if (!password) {
      errors.push("Password is required");
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors([]);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (selectedRole === "patient") {
        response = await loginPatient(email, password);
      } else if (selectedRole === "psychiatrist") {
        response = await loginPsychiatrist(email, password);
      } else {
        throw new Error("Invalid role selected");
      }

      console.log("Login response:", response);

      // Handle email verification requirement
      if (
        response.emailVerified === false ||
        response.requiresEmailVerification
      ) {
        navigate("/verify-otp", {
          state: {
            email,
            id: response.id,
            isEmailVerification: true,
            role: selectedRole,
          },
        });
        return;
      }

      if (response.success) {
        // Redirect based on role
        if (selectedRole === "patient") {
          navigate("/patient/dashboard");
        } else if (selectedRole === "psychiatrist") {
          navigate("/psychiatrist/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(response.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Failed to login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If no role is selected, show the role selection screen
  if (!selectedRole) {
    return (
      <RoleSelection
        onRoleSelect={handleRoleSelect}
        title="Sign in to your account"
        subtitle="Please select your account type to continue"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-250 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center text-sky-600"
          >
            <Brain className="h-10 w-10 mr-2" />
            <span className="text-2xl font-bold">NeuroAssess</span>
          </motion.div>
        </div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-center text-3xl font-extrabold text-gray-900"
        >
          Sign in to your {selectedRole} account
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-center text-sm text-gray-600"
        >
          Or{" "}
          <button
            onClick={() => setSelectedRole(null)}
            className="font-medium text-sky-600 hover:text-sky-500"
          >
            change account type
          </button>
        </motion.p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white py-8 px-4 shadow-xl shadow-sky-250 sm:rounded-3xl sm:px-10"
        >
          {message && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {formErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <ul className="list-disc pl-5">
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-sky-600 hover:text-sky-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Link
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Create a new account
              </Link>

              <Link
                to="/admin/login"
                className="w-full flex justify-center py-2 px-4 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-white hover:bg-purple-50"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
