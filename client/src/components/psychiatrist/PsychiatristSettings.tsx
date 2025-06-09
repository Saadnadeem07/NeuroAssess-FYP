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
  Clock,
  Calendar,
  Phone,
  Users,
  Award,
  Briefcase,
  GraduationCap,
  MapPin,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { authService } from "@/services/auth";

interface FormData {
  name: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  startTime: string;
  endTime: string;
  workingDays: string[];
  phone_number: string;
  gender: string;
  date_of_birth: string;
  country_of_nationality: string;
  country_of_graduation: string;
  date_of_graduation: string;
  institute_name: string;
  license_number: string;
  degrees: string;
  years_of_experience: string;
  expertise: string;
  bio: string;
}

interface PsychiatristSettingsProps {
  activeTab?: "profile" | "password" | "availability";
}

export default function PsychiatristSettings({
  activeTab: initialActiveTab,
}: PsychiatristSettingsProps) {
  const { user, currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "availability"
  >(initialActiveTab || "profile");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    startTime: "09:00",
    endTime: "17:00",
    workingDays: [],
    phone_number: "",
    gender: "",
    date_of_birth: "",
    country_of_nationality: "",
    country_of_graduation: "",
    date_of_graduation: "",
    institute_name: "",
    license_number: "",
    degrees: "",
    years_of_experience: "",
    expertise: "",
    bio: "",
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
    if (initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        startTime: user.availability?.startTime || "09:00",
        endTime: user.availability?.endTime || "17:00",
        workingDays: user.availability?.workingDays || [],
        phone_number: user.phone_number || "",
        gender: user.gender || "",
        date_of_birth: user.date_of_birth
          ? new Date(user.date_of_birth).toISOString().split("T")[0]
          : "",
        country_of_nationality: user.country_of_nationality || "",
        country_of_graduation: user.country_of_graduation || "",
        date_of_graduation: user.date_of_graduation
          ? new Date(user.date_of_graduation).toISOString().split("T")[0]
          : "",
        institute_name: user.institute_name || "",
        license_number: user.license_number || "",
        degrees: user.degrees || "",
        years_of_experience: user.years_of_experience?.toString() || "",
        expertise: user.expertise || "",
        bio: user.bio || "",
      }));
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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

    // Validate phone number
    if (!formData.phone_number.trim()) {
      setError("Phone number is required");
      return false;
    }

    // Basic phone number validation
    if (!/^\+?[0-9\s\-()]{8,20}$/.test(formData.phone_number)) {
      setError("Please enter a valid phone number");
      return false;
    }

    // Validate years of experience if provided
    if (formData.years_of_experience) {
      const years = parseInt(formData.years_of_experience);
      if (isNaN(years) || years < 0 || years > 100) {
        setError(
          "Years of experience must be a valid number between 0 and 100"
        );
        return false;
      }
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

  const validateAvailabilityForm = () => {
    if (!formData.startTime || !formData.endTime) {
      setError("Start time and end time are required");
      return false;
    }

    const startMinutes = convertTimeToMinutes(formData.startTime);
    const endMinutes = convertTimeToMinutes(formData.endTime);

    if (startMinutes >= endMinutes) {
      setError("End time must be after start time");
      return false;
    }

    return true;
  };

  const convertTimeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
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

      // Use the correct endpoint for psychiatrist
      const endpoint = `/users/psychiatrists/${user._id}`;

      console.log(`Updating psychiatrist profile with endpoint: ${endpoint}`);

      // Prepare the data to send
      const updateData: any = {
        name: formData.name,
        email: user.email, // Include email to avoid it being set to null
        phone_number: formData.phone_number,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        country_of_nationality: formData.country_of_nationality || null,
        country_of_graduation: formData.country_of_graduation || null,
        date_of_graduation: formData.date_of_graduation || null,
        institute_name: formData.institute_name || null,
        license_number: formData.license_number || null,
        degrees: formData.degrees || null,
        years_of_experience: parseInt(formData.years_of_experience) || 0,
        expertise: formData.expertise || null,
        bio: formData.bio || null,
      };

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

      // Use the psychiatrist role for the endpoint
      const response = await api.post(`/auth/psychiatrist/change-password`, {
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

  const handleUpdateAvailability = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAvailabilityForm()) return;

    try {
      setLoading(true);
      setError(null);

      if (!user?._id) {
        throw new Error("User ID not found");
      }

      // Use the correct endpoint for psychiatrist
      const endpoint = `/users/psychiatrists/${user._id}/availability`;

      console.log(
        `Updating psychiatrist availability with endpoint: ${endpoint}`
      );
      console.log(`Request data:`, {
        startTime: formData.startTime,
        endTime: formData.endTime,
        workingDays: formData.workingDays,
      });

      const response = await api.put(endpoint, {
        startTime: formData.startTime,
        endTime: formData.endTime,
        workingDays: formData.workingDays,
      });

      console.log(`Update response:`, response.data);

      if (response.data.success) {
        setSuccess(
          response.data.message || "Availability updated successfully"
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
      } else {
        throw new Error(
          response.data.message || "Failed to update availability"
        );
      }
    } catch (err: any) {
      console.error("Update availability error:", err);
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

  // Generate time options for select dropdown
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const time = `${formattedHour}:${formattedMinute}`;
        options.push(
          <option key={time} value={time}>
            {formatTimeForDisplay(time)}
          </option>
        );
      }
    }
    return options;
  };

  // Format time for display (convert 24h to 12h format)
  const formatTimeForDisplay = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handleWorkingDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      workingDays: checked
        ? [...prev.workingDays, value]
        : prev.workingDays.filter((day) => day !== value),
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
            activeTab === "availability"
              ? "text-sky-600 border-b-2 border-sky-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("availability")}
        >
          <Clock className="inline-block h-4 w-4 mr-2" />
          Availability
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-start">
          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Success</h3>
            <p className="text-green-700">{success}</p>
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

      {/* Profile Tab Content */}
      {activeTab === "profile" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Profile Information
          </h2>
          <form onSubmit={handleUpdateProfile}>
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3 pb-2 border-b">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                <div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="phone_number"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <Phone className="inline-block h-4 w-4 mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Your phone number"
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
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="date_of_birth"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <Calendar className="inline-block h-4 w-4 mr-1" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="country_of_nationality"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <MapPin className="inline-block h-4 w-4 mr-1" />
                    Country of Nationality
                  </label>
                  <input
                    type="text"
                    id="country_of_nationality"
                    name="country_of_nationality"
                    value={formData.country_of_nationality}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Your country of nationality"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3 pb-2 border-b">
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="institute_name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <GraduationCap className="inline-block h-4 w-4 mr-1" />
                    Institute Name
                  </label>
                  <input
                    type="text"
                    id="institute_name"
                    name="institute_name"
                    value={formData.institute_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Your institute name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="country_of_graduation"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <MapPin className="inline-block h-4 w-4 mr-1" />
                    Country of Graduation
                  </label>
                  <input
                    type="text"
                    id="country_of_graduation"
                    name="country_of_graduation"
                    value={formData.country_of_graduation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Country where you graduated"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="date_of_graduation"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <Calendar className="inline-block h-4 w-4 mr-1" />
                    Date of Graduation
                  </label>
                  <input
                    type="date"
                    id="date_of_graduation"
                    name="date_of_graduation"
                    value={formData.date_of_graduation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="license_number"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <FileText className="inline-block h-4 w-4 mr-1" />
                    License Number
                  </label>
                  <input
                    type="text"
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Your professional license number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="degrees"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <Award className="inline-block h-4 w-4 mr-1" />
                    Degrees
                  </label>
                  <input
                    type="text"
                    id="degrees"
                    name="degrees"
                    value={formData.degrees}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Your academic degrees (e.g., MD, PhD)"
                  />
                </div>
                <div>
                  <label
                    htmlFor="years_of_experience"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <Briefcase className="inline-block h-4 w-4 mr-1" />
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    id="years_of_experience"
                    name="years_of_experience"
                    value={formData.years_of_experience}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Years of professional experience"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3 pb-2 border-b">
                Expertise & Bio
              </h3>
              <div className="mb-4">
                <label
                  htmlFor="expertise"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  <Award className="inline-block h-4 w-4 mr-1" />
                  Areas of Expertise
                </label>
                <input
                  type="text"
                  id="expertise"
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Your areas of specialization (e.g., Depression, Anxiety, PTSD)"
                />
              </div>
              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  <FileText className="inline-block h-4 w-4 mr-1" />
                  Professional Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Write a brief professional biography"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">
                      <Settings className="h-4 w-4" />
                    </span>
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

      {/* Password Tab Content */}
      {activeTab === "password" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Change Password
          </h2>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
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

            <div className="mb-6">
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
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">
                      <Settings className="h-4 w-4" />
                    </span>
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

      {/* Availability Tab Content */}
      {activeTab === "availability" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Set Your Availability
          </h2>
          <p className="text-gray-600 mb-6">
            Set your working hours to let patients know when you're available
            for appointments. Time slots will be created in 30-minute intervals
            within your specified time range. <strong>Important:</strong> If you
            don't select any working days, you will not be visible to patients
            for booking appointments.
          </p>
          <form onSubmit={handleUpdateAvailability}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 appearance-none"
                  >
                    {generateTimeOptions()}
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 appearance-none"
                  >
                    {generateTimeOptions()}
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Days
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Select the days of the week when you're available for
                appointments. If no days are selected, you will not be shown to
                patients.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <div key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`day-${day}`}
                      name="workingDays"
                      value={day}
                      checked={formData.workingDays.includes(day)}
                      onChange={handleWorkingDaysChange}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`day-${day}`}
                      className="ml-2 block text-sm text-gray-700"
                    >
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-sky-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-sky-800 mb-2">
                Preview of Selected Working Days
              </h3>
              {formData.workingDays.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.workingDays.map((day) => (
                    <div
                      key={day}
                      className="bg-white px-3 py-1 text-sm rounded-lg border border-sky-100 text-center flex items-center"
                    >
                      <Calendar className="h-3 w-3 mr-1 text-sky-600" />
                      {day}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 mb-2">
                  <AlertCircle className="h-4 w-4 inline-block mr-1" />
                  <span className="text-sm">
                    No working days selected. You will not be visible to
                    patients for appointments.
                  </span>
                </div>
              )}
            </div>

            <div className="bg-sky-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-sky-800 mb-2">
                Preview of Available Slots
              </h3>
              {formData.startTime && formData.endTime ? (
                <>
                  {generatePreviewSlots(formData.startTime, formData.endTime)
                    .length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {generatePreviewSlots(
                        formData.startTime,
                        formData.endTime
                      ).map((slot, index) => (
                        <div
                          key={index}
                          className="bg-white p-2 text-sm rounded-lg border border-sky-100 text-center"
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600 bg-white p-3 rounded-lg border border-sky-100">
                      <span className="text-sm">
                        No time slots available. Please ensure end time is after
                        start time.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-600 bg-white p-3 rounded-lg border border-sky-100">
                  <span className="text-sm">
                    Please set both start and end times to see available slots.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">
                      <Settings className="h-4 w-4" />
                    </span>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Availability
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Helper function to generate preview slots
function generatePreviewSlots(startTime: string, endTime: string) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes >= endMinutes) {
    return [];
  }

  for (let time = startMinutes; time < endMinutes; time += 30) {
    const hour = Math.floor(time / 60);
    const minute = time % 60;

    const formattedHour = hour % 12 || 12;
    const period = hour >= 12 ? "PM" : "AM";

    slots.push(
      `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`
    );
  }

  return slots;
}
