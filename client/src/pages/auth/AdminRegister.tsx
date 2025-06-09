import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Mail,
  User,
  Shield,
  Lock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminRegisterData } from "@/services/auth";
import {
  PasswordInput,
  validatePassword,
} from "@/components/ui/password-input";

export default function AdminRegister() {
  const navigate = useNavigate();
  const { registerAdmin, setRole } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminLevel, setAdminLevel] = useState("standard");
  const [secretKey, setSecretKey] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  // Set the role to admin
  useEffect(() => {
    setRole("admin");
  }, [setRole]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push("Name is required");
    }

    if (!email.trim()) {
      errors.push("Email is required");
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.push("Please enter a valid email address");
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    if (!secretKey.trim()) {
      errors.push("Admin secret key is required");
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors([]);
    setShowValidation(true);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create admin registration data
      const adminData: AdminRegisterData = {
        name,
        email,
        password,
        adminLevel,
        secretKey, // This would be validated on the server
      };

      const response = await registerAdmin(adminData);

      if (response.success) {
        // If OTP verification is required
        if (response.data.otp) {
          navigate("/verify-otp", {
            state: {
              email,
              id: response.data._id,
              isEmailVerification: true,
              role: "admin",
            },
          });
        } else {
          // Direct login if no OTP required
          navigate("/admin/login", {
            state: {
              message:
                "Registration successful! Please log in with your credentials.",
            },
          });
        }
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Admin registration error:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Failed to register");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(124,58,237,0.05),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(124,58,237,0.05),transparent)] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center text-purple-600"
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
          Register as Administrator
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-center text-sm text-gray-600"
        >
          Create a new admin account with system privileges
        </motion.p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white py-8 px-4 shadow-xl shadow-purple-100 sm:rounded-3xl sm:px-10"
        >
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-purple-100 rounded-full">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </div>

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
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

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
                  className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="admin@example.com"
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
              <div className="mt-1">
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showValidation={showValidation}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="mt-1">
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  className={`${
                    showValidation && password !== confirmPassword
                      ? "border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500"
                      : ""
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {showValidation && password !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="adminLevel"
                className="block text-sm font-medium text-gray-700"
              >
                Admin Level
              </label>
              <select
                id="adminLevel"
                name="adminLevel"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={adminLevel}
                onChange={(e) => setAdminLevel(e.target.value)}
              >
                <option value="standard">Standard Admin</option>
                <option value="super">Super Admin</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="secretKey"
                className="block text-sm font-medium text-gray-700"
              >
                Admin Secret Key
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="secretKey"
                  name="secretKey"
                  type="password"
                  required
                  className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter the admin secret key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                This key is provided by the system administrator
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Registering..." : "Register"}
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
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/admin/login"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
