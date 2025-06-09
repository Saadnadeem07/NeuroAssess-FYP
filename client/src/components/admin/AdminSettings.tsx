import { useState, useEffect } from "react";
import {
  Settings,
  Mail,
  Bell,
  Shield,
  Database,
  AlertCircle,
  User,
  Lock,
  Save,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  FileText,
  Clock,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth";

interface SystemSettings {
  emailNotifications: boolean;
  systemAlerts: boolean;
  dataRetention: string;
  securityLevel: "low" | "medium" | "high";
}

interface FormData {
  name: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  adminLevel: string;
  permissions: string[];
}

// Default settings as fallback
const DEFAULT_SETTINGS: SystemSettings = {
  emailNotifications: true,
  systemAlerts: true,
  dataRetention: "90",
  securityLevel: "high",
};

export default function AdminSettings() {
  const { user, currentRole } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [usingDefaultSettings, setUsingDefaultSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"system" | "profile" | "password">(
    "system"
  );
  const [formData, setFormData] = useState<FormData>({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    adminLevel: "junior",
    permissions: [],
  });
  const [passwordVisible, setPasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    fetchSettings();

    // Initialize user data
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        adminLevel: user.adminLevel || "junior",
        permissions: user.permissions || [],
      }));
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        // Try to fetch real settings from API
        const response = await api.get("/admin/settings");
        setSettings(response.data.data);
        setUsingDefaultSettings(false);
      } catch (apiError) {
        console.warn("API call failed, using default settings:", apiError);
        // Fall back to default settings if API call fails
        setSettings(DEFAULT_SETTINGS);
        setUsingDefaultSettings(true);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (!usingDefaultSettings) {
        // Use real API if available
        await api.put("/admin/settings", settings);
        setSuccessMessage("Settings saved successfully");
      } else {
        // Simulate API call with default settings
        setTimeout(() => {
          setSuccessMessage("Settings saved successfully (mock)");
          setIsSaving(false);
        }, 500);
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings");
    } finally {
      if (!usingDefaultSettings) {
        setIsSaving(false);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (
      name === "name" ||
      name === "currentPassword" ||
      name === "newPassword" ||
      name === "confirmPassword" ||
      name === "adminLevel"
    ) {
      setFormData({
        ...formData,
        [name]: value,
      });
      // Clear any previous success/error messages when user starts typing
      setSuccessMessage(null);
      setError(null);
    } else {
      setSettings({
        ...settings,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      });
    }
  };

  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, value]
        : prev.permissions.filter((permission) => permission !== value),
    }));
  };

  const validateProfileForm = () => {
    if (!formData.name.trim()) {
      setError("Name cannot be empty");
      return false;
    }

    // Validate admin level
    const validAdminLevels = ["junior", "senior", "super"];
    if (!validAdminLevels.includes(formData.adminLevel)) {
      setError("Invalid admin level selected");
      return false;
    }

    // Validate permissions
    const validPermissions = [
      "manage_users",
      "manage_psychiatrists",
      "manage_content",
      "manage_payments",
      "super_admin",
    ];

    // Check if all permissions are valid
    const hasInvalidPermission = formData.permissions.some(
      (permission) => !validPermissions.includes(permission)
    );

    if (hasInvalidPermission) {
      setError("Invalid permission detected");
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
      setIsSaving(true);
      setError(null);

      if (!user?._id) {
        throw new Error("User ID not found");
      }

      // Use the admin endpoint
      const endpoint = `/users/admins/${user._id}`;

      console.log(`Updating admin profile with endpoint: ${endpoint}`);

      // Prepare the data to send
      const updateData = {
        name: formData.name,
        email: user.email, // Include email to avoid it being set to null
        adminLevel: formData.adminLevel,
        permissions: formData.permissions,
      };

      console.log(`Request data:`, updateData);

      const response = await api.put(endpoint, updateData);

      console.log(`Update response:`, response.data);

      if (response.data.success) {
        setSuccessMessage(
          response.data.message || "Profile updated successfully"
        );

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
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await api.post(`/auth/admin/change-password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        setSuccessMessage("Password updated successfully");
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
      setIsSaving(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setPasswordVisible((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Admin Settings</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "system"
              ? "text-sky-600 border-b-2 border-sky-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("system")}
        >
          <Settings className="inline-block h-4 w-4 mr-2" />
          System Settings
        </button>
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
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-start">
          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Success</h3>
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Notifications */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Mail className="h-5 w-5 text-sky-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Email Notifications
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configure email templates and notification settings
            </p>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="emailNotifications"
                name="emailNotifications"
                checked={settings.emailNotifications}
                onChange={handleInputChange}
                className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
              />
              <label
                htmlFor="emailNotifications"
                className="ml-2 block text-sm text-gray-700"
              >
                Enable email notifications
              </label>
            </div>
            <button className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
              Configure Templates
            </button>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-sky-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                System Alerts
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configure system alerts and notifications
            </p>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="systemAlerts"
                name="systemAlerts"
                checked={settings.systemAlerts}
                onChange={handleInputChange}
                className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
              />
              <label
                htmlFor="systemAlerts"
                className="ml-2 block text-sm text-gray-700"
              >
                Enable system alerts
              </label>
            </div>
            <button className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
              Configure Alerts
            </button>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-sky-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Security Settings
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configure security settings and access controls
            </p>
            <div className="mb-4">
              <label
                htmlFor="securityLevel"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Security Level
              </label>
              <select
                id="securityLevel"
                name="securityLevel"
                value={settings.securityLevel}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
              Configure Security
            </button>
          </div>

          {/* Data Retention */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Database className="h-5 w-5 text-sky-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Data Retention
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configure data retention policies
            </p>
            <div className="mb-4">
              <label
                htmlFor="dataRetention"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Data Retention Period (days)
              </label>
              <input
                type="number"
                id="dataRetention"
                name="dataRetention"
                value={settings.dataRetention}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
            <button className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
              Configure Retention
            </button>
          </div>
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
                <User className="inline-block h-4 w-4 mr-1" />
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
                <Mail className="inline-block h-4 w-4 mr-1" />
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

            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3 pb-2 border-b">
                <Shield className="inline-block h-4 w-4 mr-1" />
                Admin Privileges
              </h3>

              <div className="mb-4">
                <label
                  htmlFor="adminLevel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Admin Level
                </label>
                <select
                  id="adminLevel"
                  name="adminLevel"
                  value={formData.adminLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="junior">Junior Admin</option>
                  <option value="senior">Senior Admin</option>
                  <option value="super">Super Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Admin level determines the scope of your administrative
                  capabilities
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="perm-manage_users"
                      name="permissions"
                      value="manage_users"
                      checked={formData.permissions.includes("manage_users")}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="perm-manage_users"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      <UserCheck className="inline-block h-4 w-4 mr-1" />
                      Manage Users
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="perm-manage_psychiatrists"
                      name="permissions"
                      value="manage_psychiatrists"
                      checked={formData.permissions.includes(
                        "manage_psychiatrists"
                      )}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="perm-manage_psychiatrists"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      <User className="inline-block h-4 w-4 mr-1" />
                      Manage Psychiatrists
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="perm-manage_content"
                      name="permissions"
                      value="manage_content"
                      checked={formData.permissions.includes("manage_content")}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="perm-manage_content"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      <FileText className="inline-block h-4 w-4 mr-1" />
                      Manage Content
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="perm-manage_payments"
                      name="permissions"
                      value="manage_payments"
                      checked={formData.permissions.includes("manage_payments")}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="perm-manage_payments"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      <Clock className="inline-block h-4 w-4 mr-1" />
                      Manage Payments
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="perm-super_admin"
                      name="permissions"
                      value="super_admin"
                      checked={formData.permissions.includes("super_admin")}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="perm-super_admin"
                      className="ml-2 block text-sm text-gray-700 font-medium"
                    >
                      <Shield className="inline-block h-4 w-4 mr-1" />
                      Super Admin (All Permissions)
                    </label>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select the specific permissions you want to grant to this
                  admin account
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center"
              >
                {isSaving ? (
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
                  {passwordVisible.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
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
                disabled={isSaving}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center"
              >
                {isSaving ? (
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

      {/* System Settings Save Button */}
      {activeTab === "system" && (
        <div className="flex justify-end mt-6">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 mr-2"
            onClick={fetchSettings}
            disabled={isSaving}
          >
            Reset
          </button>
          <button
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
            onClick={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}
