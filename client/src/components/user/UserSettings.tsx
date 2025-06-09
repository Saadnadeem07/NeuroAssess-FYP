import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Lock,
  Bell,
  Save,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  Phone,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { authService } from "@/services/auth";

interface FormData {
  name: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  dateOfBirth: string;
  gender: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

export default function UserSettings() {
  const { user, currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "notifications"
  >("profile");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    dateOfBirth: "",
    gender: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: user.gender || "",
        emergencyContactName: user.emergencyContact?.name || "",
        emergencyContactRelationship: user.emergencyContact?.relationship || "",
        emergencyContactPhone: user.emergencyContact?.phone || "",
      }));
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear any previous success/error messages when user starts typing
    setSuccess(null);
    setError(null);
  };

  const validateProfileForm = () => {
    if (!formData.name.trim()) {
      setError("Name cannot be empty");
      return false;
    }

    // Validate phone number format if provided
    if (
      formData.emergencyContactPhone &&
      !/^\+?[0-9\s\-()]{8,20}$/.test(formData.emergencyContactPhone)
    ) {
      setError("Please enter a valid emergency contact phone number");
      return false;
    }

    return true;
  };

  const validatePasswordForm = () => {
    if (!formData.currentPassword) {
      setError("Current password is required");
      return false;
    }
    if (!formData.newPassword) {
      setError("New password is required");
      return false;
    }

    // Enhanced password validation
    const errors = [];

    if (formData.newPassword.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(formData.newPassword)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(formData.newPassword)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(formData.newPassword)) {
      errors.push("Password must contain at least one number");
    }

    if (errors.length > 0) {
      setError(errors.join(". "));
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) return;

    try {
      setLoading(true);
      setError(null);

      if (!user?._id) {
        throw new Error("User ID not found");
      }

      // Use the correct endpoint based on the user's role
      let endpoint = "";
      if (currentRole === "patient") {
        endpoint = `/users/${user._id}`;
      } else if (currentRole === "psychiatrist") {
        endpoint = `/users/psychiatrists/${user._id}`;
      } else if (currentRole === "admin") {
        endpoint = `/users/admins/${user._id}`;
      } else {
        throw new Error("Invalid user role");
      }

      console.log(`Updating user profile with endpoint: ${endpoint}`);

      // Prepare the data to send based on the role
      const updateData: any = {
        name: formData.name,
        email: user.email, // Include email to avoid it being set to null
      };

      // Add patient-specific fields
      if (currentRole === "patient") {
        updateData.dateOfBirth = formData.dateOfBirth || null;
        updateData.gender = formData.gender || null;

        // Only include emergency contact if at least one field is filled
        if (
          formData.emergencyContactName ||
          formData.emergencyContactRelationship ||
          formData.emergencyContactPhone
        ) {
          updateData.emergencyContact = {
            name: formData.emergencyContactName || "",
            relationship: formData.emergencyContactRelationship || "",
            phone: formData.emergencyContactPhone || "",
          };
        }
      }

      console.log(`Request data:`, updateData);

      const response = await api.put(endpoint, updateData);

      console.log(`Update response:`, response.data);

      if (response.data.success) {
        setSuccess(response.data.message || "Profile updated successfully");

        // Get the updated user data from the response
        const updatedUser = response.data.data;

        // Update local storage with new user data
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const mergedUser = {
          ...currentUser,
          ...updatedUser,
        };
        localStorage.setItem("user", JSON.stringify(mergedUser));

        // Update the auth context
        if (typeof window !== "undefined") {
          // Dispatch a custom event to notify the auth context
          const event = new CustomEvent("userUpdated", {
            detail: { user: mergedUser },
          });
          window.dispatchEvent(event);
        }

        // Refresh the current user data from the server
        try {
          await authService.getCurrentUser();
        } catch (refreshError) {
          console.error("Error refreshing user data:", refreshError);
        }

        // Wait a moment before reloading to ensure the API request completes
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Update profile error:", err);
      setError(
        err.response?.data?.message || err.message || "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    try {
      setLoading(true);
      setError(null);

      if (!currentRole) {
        throw new Error("User role not found");
      }

      const response = await api.post(`/auth/${currentRole}/change-password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        setSuccess("Password updated successfully");
        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        throw new Error(response.data.message || "Failed to update password");
      }
    } catch (err: any) {
      console.error("Update password error:", err);
      setError(
        err.response?.data?.message || err.message || "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setPasswordVisible((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Account Settings
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "profile"
              ? "text-sky-600 border-b-2 border-sky-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          <User className="inline-block h-4 w-4 mr-2" />
          Profile
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "password"
              ? "text-sky-600 border-b-2 border-sky-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("password")}
        >
          <Lock className="inline-block h-4 w-4 mr-2" />
          Password
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "notifications"
              ? "text-sky-600 border-b-2 border-sky-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("notifications")}
        >
          <Bell className="inline-block h-4 w-4 mr-2" />
          Notifications
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
          <Check className="h-5 w-5 mr-2 text-green-500" />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
          {error}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500 cursor-not-allowed"
                placeholder="Your email address"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email address cannot be changed
              </p>
            </div>

            {currentRole === "patient" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="dateOfBirth"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <Calendar className="inline-block h-4 w-4 mr-1" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <Users className="inline-block h-4 w-4 mr-1" />
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-2">
                    Emergency Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="emergencyContactName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Contact Name
                      </label>
                      <input
                        type="text"
                        id="emergencyContactName"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="emergencyContactRelationship"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Relationship
                      </label>
                      <input
                        type="text"
                        id="emergencyContactRelationship"
                        name="emergencyContactRelationship"
                        value={formData.emergencyContactRelationship}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        placeholder="e.g. Parent, Spouse, Friend"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label
                      htmlFor="emergencyContactPhone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      <Phone className="inline-block h-4 w-4 mr-1" />
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="Emergency contact phone number"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-4">
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible.current ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {passwordVisible.current ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible.new ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {passwordVisible.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                <p>Password requirements:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li
                    className={
                      formData.newPassword.length >= 8 ? "text-green-500" : ""
                    }
                  >
                    At least 8 characters long
                  </li>
                  <li
                    className={
                      /[A-Z]/.test(formData.newPassword) ? "text-green-500" : ""
                    }
                  >
                    At least one uppercase letter
                  </li>
                  <li
                    className={
                      /[a-z]/.test(formData.newPassword) ? "text-green-500" : ""
                    }
                  >
                    At least one lowercase letter
                  </li>
                  <li
                    className={
                      /[0-9]/.test(formData.newPassword) ? "text-green-500" : ""
                    }
                  >
                    At least one number
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible.confirm ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {passwordVisible.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Notification Preferences
          </h2>
          <p className="text-gray-600 mb-4">
            Configure how and when you receive notifications from our platform.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-500">
                  Receive updates via email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Appointment Reminders</h3>
                <p className="text-sm text-gray-500">
                  Get notified about upcoming appointments
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Learning Plan Updates</h3>
                <p className="text-sm text-gray-500">
                  Notifications about new content in your learning plan
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center">
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
