import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Mail,
  User,
  FileText,
  Award,
  Link as LinkIcon,
  Calendar,
  Users,
  Phone,
  Globe,
  School,
  BookOpen,
  Briefcase,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  PatientRegisterData,
  PsychiatristRegisterData,
  UserRole,
} from "@/services/auth";
import {
  PasswordInput,
  validatePassword,
} from "@/components/ui/password-input";
import RoleSelection from "@/components/auth/RoleSelection";

// List of countries for the dropdown menus
const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Korea, North",
  "Korea, South",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

export default function Register() {
  const navigate = useNavigate();
  const { registerPatient, registerPsychiatrist, setRole } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Patient specific fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  // Psychiatrist specific fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [psychiatristGender, setPsychiatristGender] = useState("");
  const [psychiatristDateOfBirth, setPsychiatristDateOfBirth] = useState("");
  const [countryOfNationality, setCountryOfNationality] = useState("");
  const [countryOfGraduation, setCountryOfGraduation] = useState("");
  const [dateOfGraduation, setDateOfGraduation] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [degrees, setDegrees] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [expertise, setExpertise] = useState("");
  const [bio, setBio] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(false);

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

    if (selectedRole === "psychiatrist") {
      // Date validation for birth date - not more than 90 years old
      if (psychiatristDateOfBirth) {
        const birthDate = new Date(psychiatristDateOfBirth);
        const today = new Date();
        const minBirthDate = new Date();
        minBirthDate.setFullYear(today.getFullYear() - 90);

        if (birthDate < minBirthDate) {
          errors.push("Date of birth cannot be more than 90 years ago");
        }

        if (birthDate > today) {
          errors.push("Date of birth cannot be in the future");
        }
      }

      // Date validation for graduation date - not more than 70 years old
      if (dateOfGraduation) {
        const gradDate = new Date(dateOfGraduation);
        const today = new Date();
        const minGradDate = new Date();
        minGradDate.setFullYear(today.getFullYear() - 70);

        if (gradDate < minGradDate) {
          errors.push("Date of graduation cannot be more than 70 years ago");
        }

        if (gradDate > today) {
          errors.push("Date of graduation cannot be in the future");
        }

        // Check if graduation date is before birth date
        if (
          psychiatristDateOfBirth &&
          gradDate < new Date(psychiatristDateOfBirth)
        ) {
          errors.push("Date of graduation cannot be before date of birth");
        }
      }

      if (!expertise.trim()) {
        errors.push("Expertise is required for psychiatrists");
      }

      if (!bio.trim()) {
        errors.push("Bio is required for psychiatrists");
      }

      if (!certificateUrl.trim()) {
        errors.push("Certificate URL is required for psychiatrists");
      }

      if (!phoneNumber.trim()) {
        errors.push("Phone number is required for psychiatrists");
      }

      if (!psychiatristDateOfBirth) {
        errors.push("Date of birth is required for psychiatrists");
      }

      if (!countryOfNationality.trim()) {
        errors.push("Country of nationality is required for psychiatrists");
      }

      if (!countryOfGraduation.trim()) {
        errors.push("Country of graduation is required for psychiatrists");
      }

      if (!dateOfGraduation) {
        errors.push("Date of graduation is required for psychiatrists");
      }

      if (!instituteName.trim()) {
        errors.push("Institute name is required for psychiatrists");
      }

      if (!licenseNumber.trim()) {
        errors.push("License number is required for psychiatrists");
      }

      if (!degrees.trim()) {
        errors.push("Degrees are required for psychiatrists");
      }

      if (yearsOfExperience <= 0) {
        errors.push("Years of experience must be greater than 0");
      }

      if (!psychiatristGender) {
        errors.push("Gender is required for psychiatrists");
      } else if (!["Male", "Female", "Other"].includes(psychiatristGender)) {
        errors.push("Invalid gender value. Please select from the dropdown.");
      }
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
    setShowValidation(true);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let response;
      console.log("Starting registration process for role:", selectedRole);

      if (selectedRole === "patient") {
        const patientData: PatientRegisterData = {
          name,
          email,
          password,
          dateOfBirth,
          gender,
        };
        console.log("Patient registration data:", patientData);
        response = await registerPatient(patientData);
      } else if (selectedRole === "psychiatrist") {
        // Create a FormData object for psychiatrist registration
        // This allows us to send the certificate file if needed

        // Ensure gender is one of the allowed values
        const validGender = ["Male", "Female", "Other"].includes(
          psychiatristGender
        )
          ? psychiatristGender
          : undefined;

        // Log the psychiatrist gender and validation
        console.log("Psychiatrist Gender Value:", psychiatristGender);
        console.log("Valid Gender Value:", validGender);

        // Ensure dates are in ISO 8601 format
        const formatDateToISO = (dateString: string): string => {
          if (!dateString) return "";
          // Check if the date is already in ISO format (YYYY-MM-DD)
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
          }
          // Otherwise, create a new Date object and format it
          const date = new Date(dateString);
          return date.toISOString().split("T")[0]; // YYYY-MM-DD format
        };

        const formattedDateOfBirth = formatDateToISO(psychiatristDateOfBirth);
        const formattedDateOfGraduation = formatDateToISO(dateOfGraduation);

        console.log("Original Date of Birth:", psychiatristDateOfBirth);
        console.log("Formatted Date of Birth:", formattedDateOfBirth);
        console.log("Original Date of Graduation:", dateOfGraduation);
        console.log("Formatted Date of Graduation:", formattedDateOfGraduation);

        // Validate date ranges
        const today = new Date();

        // Check date of birth (not more than 90 years old)
        const birthDate = new Date(formattedDateOfBirth);
        const minBirthDate = new Date();
        minBirthDate.setFullYear(today.getFullYear() - 90);

        if (birthDate < minBirthDate) {
          setError("Date of birth cannot be more than 90 years ago");
          setIsLoading(false);
          return;
        }

        if (birthDate > today) {
          setError("Date of birth cannot be in the future");
          setIsLoading(false);
          return;
        }

        // Check date of graduation (not more than 70 years old)
        const gradDate = new Date(formattedDateOfGraduation);
        const minGradDate = new Date();
        minGradDate.setFullYear(today.getFullYear() - 70);

        if (gradDate < minGradDate) {
          setError("Date of graduation cannot be more than 70 years ago");
          setIsLoading(false);
          return;
        }

        if (gradDate > today) {
          setError("Date of graduation cannot be in the future");
          setIsLoading(false);
          return;
        }

        // Check if graduation date is before birth date
        if (gradDate < birthDate) {
          setError("Date of graduation cannot be before date of birth");
          setIsLoading(false);
          return;
        }

        // Ensure years_of_experience is a valid number
        const parsedYearsOfExperience = Number(yearsOfExperience);
        console.log("Years of Experience (original):", yearsOfExperience);
        console.log("Years of Experience (parsed):", parsedYearsOfExperience);

        // Ensure passwords match
        if (password !== confirmPassword) {
          console.error("Password mismatch:", { password, confirmPassword });
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }

        const psychiatristData: PsychiatristRegisterData = {
          name,
          email,
          password,
          expertise,
          bio,
          certificateUrl:
            certificateUrl.trim() ||
            "https://example.com/placeholder-certificate.pdf", // Provide default value if empty
          phone_number: phoneNumber,
          gender: validGender,
          date_of_birth: formattedDateOfBirth,
          country_of_nationality: countryOfNationality,
          country_of_graduation: countryOfGraduation,
          date_of_graduation: formattedDateOfGraduation,
          institute_name: instituteName,
          license_number: licenseNumber,
          degrees,
          years_of_experience: parsedYearsOfExperience,
          // Don't include confirm_password to avoid backend validation issues
        };

        // Validate all required fields have values
        const missingFields = [];
        if (!name) missingFields.push("name");
        if (!email) missingFields.push("email");
        if (!password) missingFields.push("password");
        if (!expertise) missingFields.push("expertise");
        if (!bio) missingFields.push("bio");
        if (!certificateUrl) missingFields.push("certificateUrl");
        if (!phoneNumber) missingFields.push("phone_number");
        if (!validGender) missingFields.push("gender");
        if (!formattedDateOfBirth) missingFields.push("date_of_birth");
        if (!countryOfNationality) missingFields.push("country_of_nationality");
        if (!countryOfGraduation) missingFields.push("country_of_graduation");
        if (!formattedDateOfGraduation)
          missingFields.push("date_of_graduation");
        if (!instituteName) missingFields.push("institute_name");
        if (!licenseNumber) missingFields.push("license_number");
        if (!degrees) missingFields.push("degrees");
        if (parsedYearsOfExperience <= 0)
          missingFields.push("years_of_experience");

        if (missingFields.length > 0) {
          console.error("Missing fields:", missingFields);
        }

        console.log("Psychiatrist registration data:", psychiatristData);

        try {
          // Add a delay to ensure the request is properly sent
          await new Promise((resolve) => setTimeout(resolve, 500));
          console.log("Sending registration request...");
          response = await registerPsychiatrist(psychiatristData);
          console.log("Registration response received:", response);
        } catch (registrationError: any) {
          console.error("Registration API call failed:", registrationError);

          // Log detailed error information
          if (registrationError.response) {
            console.error("Error status:", registrationError.response.status);
            console.error("Error data:", registrationError.response.data);

            // If there are validation errors, log them in detail
            if (registrationError.response.data?.errors) {
              console.error(
                "Validation errors:",
                registrationError.response.data.errors
              );
            }
          } else {
            console.error("No response object in error");
          }

          // Handle specific psychiatrist registration errors
          if (registrationError.response?.status === 409) {
            setError("A psychiatrist with this email already exists.");
            setIsLoading(false);
            return;
          } else if (registrationError.response?.status === 400) {
            let errorMsg =
              "Please check your registration information and try again.";

            // Try to extract specific validation errors
            if (
              registrationError.response.data?.errors &&
              Array.isArray(registrationError.response.data.errors)
            ) {
              const validationErrors = registrationError.response.data.errors
                .map((err: any) => err.msg || err.message || err.param)
                .filter(Boolean);

              if (validationErrors.length > 0) {
                errorMsg = `Validation errors: ${validationErrors.join(", ")}`;
              }
            } else if (registrationError.response.data?.message) {
              errorMsg = registrationError.response.data.message;
            }

            setError(errorMsg);
            setIsLoading(false);
            return;
          }

          throw registrationError;
        }
      } else {
        throw new Error("Invalid role selected");
      }

      // Check if response exists
      if (!response) {
        console.error("No response received from server");
        throw new Error("No response received from server");
      }

      // Check if response.data exists
      if (!response.data) {
        console.error("Invalid response structure:", response);
        throw new Error("Invalid response structure from server");
      }

      // Check if user ID exists in the response
      const userId = response.data._id || response.data.id;
      if (!userId) {
        console.error("No user ID in response:", response.data);

        // Try to extract ID from other possible locations in the response
        let extractedId = null;

        // Check if the ID might be in a nested property
        if (response.data.data && response.data.data._id) {
          extractedId = response.data.data._id;
          console.log("Found ID in response.data.data._id:", extractedId);
        } else if (response.data.user && response.data.user._id) {
          extractedId = response.data.user._id;
          console.log("Found ID in response.data.user._id:", extractedId);
        } else if (
          response.data.psychiatrist &&
          response.data.psychiatrist._id
        ) {
          extractedId = response.data.psychiatrist._id;
          console.log(
            "Found ID in response.data.psychiatrist._id:",
            extractedId
          );
        }

        if (extractedId) {
          // We found an ID in a different location
          console.log(
            "Navigating to verify-otp with extracted ID:",
            extractedId
          );
          navigate("/verify-otp", {
            state: {
              email,
              id: extractedId,
              isEmailVerification: true,
              role: selectedRole,
            },
          });
          return;
        }

        // If we still couldn't find an ID, throw an error
        throw new Error("No user ID received from server");
      }

      console.log("Navigating to verify-otp with ID:", userId);
      navigate("/verify-otp", {
        state: {
          email,
          id: userId,
          isEmailVerification: true,
          role: selectedRole,
        },
      });
    } catch (error: any) {
      console.error("Registration error:", error);

      // Extract the most useful error message
      let errorMessage = "Registration failed. Please try again.";

      if (error.response) {
        console.error("Error response:", error.response);

        // Handle validation errors from the server
        if (error.response.data?.errors) {
          const serverErrors = error.response.data.errors;
          if (Array.isArray(serverErrors)) {
            errorMessage = serverErrors
              .map((err: any) => err.msg || err.message)
              .join(", ");
          } else {
            errorMessage = "Validation error from server";
          }
        }
        // Handle general error message from server
        else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
        // Handle status code specific errors
        else if (error.response.status === 409) {
          errorMessage = "Email already in use. Please use a different email.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
      }
      // Use error message if it's an Error object
      else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // If no role is selected, show the role selection screen
  if (!selectedRole) {
    return (
      <RoleSelection
        onRoleSelect={handleRoleSelect}
        title="Create your account"
        subtitle="Please select your account type to continue"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-250 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center text-sky-600 mb-8"
          >
            <Brain className="h-12 w-12 mr-2" />
            <span className="text-3xl font-bold">NeuroAssess</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold text-gray-900 sm:text-4xl"
          >
            Create your {selectedRole} account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-lg text-gray-600"
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

        {/* If no role is selected, show the role selection screen */}
        {!selectedRole ? (
          <RoleSelection
            onRoleSelect={handleRoleSelect}
            title="Create your account"
            subtitle="Please select your account type to continue"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white shadow-xl shadow-sky-250 sm:rounded-3xl overflow-hidden"
          >
            <div className="px-4 py-8 sm:px-10">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {formErrors.length > 0 && showValidation && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  <ul className="list-disc pl-5">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          required
                          className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
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
                      <div className="mt-1">
                        <PasswordInput
                          id="password"
                          name="password"
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
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          showValidation={false}
                        />
                      </div>
                      {password !== confirmPassword && confirmPassword && (
                        <p className="mt-1 text-xs text-red-500">
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedRole === "psychiatrist" && (
                  <>
                    {/* Personal Information Section */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label
                            htmlFor="phoneNumber"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Phone Number
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="phoneNumber"
                              name="phoneNumber"
                              type="text"
                              required
                              className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              placeholder="+1 (555) 555-5555"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="psychiatristGender"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Gender
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Users className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                              id="psychiatristGender"
                              name="psychiatristGender"
                              required
                              className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              value={psychiatristGender}
                              onChange={(e) =>
                                setPsychiatristGender(e.target.value)
                              }
                            >
                              <option value="">Select gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="psychiatristDateOfBirth"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Date of Birth
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="psychiatristDateOfBirth"
                              name="psychiatristDateOfBirth"
                              type="date"
                              required
                              className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              value={psychiatristDateOfBirth}
                              onChange={(e) =>
                                setPsychiatristDateOfBirth(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="countryOfNationality"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Country of Nationality
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Globe className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                              id="countryOfNationality"
                              name="countryOfNationality"
                              required
                              className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              value={countryOfNationality}
                              onChange={(e) =>
                                setCountryOfNationality(e.target.value)
                              }
                            >
                              <option value="">Select country</option>
                              {COUNTRIES.map((country) => (
                                <option key={country} value={country}>
                                  {country}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Educational Background Section */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                        Educational Background
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label
                            htmlFor="instituteName"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Institute Name
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <School className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="instituteName"
                              name="instituteName"
                              type="text"
                              required
                              className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              placeholder="e.g., Harvard University"
                              value={instituteName}
                              onChange={(e) => setInstituteName(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="countryOfGraduation"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Country of Graduation
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Globe className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                              id="countryOfGraduation"
                              name="countryOfGraduation"
                              required
                              className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              value={countryOfGraduation}
                              onChange={(e) =>
                                setCountryOfGraduation(e.target.value)
                              }
                            >
                              <option value="">Select country</option>
                              {COUNTRIES.map((country) => (
                                <option key={country} value={country}>
                                  {country}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="dateOfGraduation"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Date of Graduation
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="dateOfGraduation"
                              name="dateOfGraduation"
                              type="date"
                              required
                              className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              value={dateOfGraduation}
                              onChange={(e) =>
                                setDateOfGraduation(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label
                            htmlFor="degrees"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Degrees
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="degrees"
                              name="degrees"
                              rows={2}
                              required
                              className="block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              placeholder="List your degrees (e.g., MD in Psychiatry, Ph.D. in Clinical Psychology)"
                              value={degrees}
                              onChange={(e) => setDegrees(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Information Section */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                        Professional Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="licenseNumber"
                            className="block text-sm font-medium text-gray-700"
                          >
                            License Number
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <BookOpen className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="licenseNumber"
                              name="licenseNumber"
                              type="text"
                              required
                              className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              placeholder="e.g., 123456789"
                              value={licenseNumber}
                              onChange={(e) => setLicenseNumber(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="yearsOfExperience"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Years of Experience
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Briefcase className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="yearsOfExperience"
                              name="yearsOfExperience"
                              type="number"
                              required
                              min="0"
                              className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              value={yearsOfExperience}
                              onChange={(e) =>
                                setYearsOfExperience(Number(e.target.value))
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="expertise"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Area of Expertise
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Award className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="expertise"
                              name="expertise"
                              type="text"
                              required
                              className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              placeholder="e.g., Clinical Psychology, Neuropsychology"
                              value={expertise}
                              onChange={(e) => setExpertise(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="certificateUrl"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Certificate URL
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <LinkIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="certificateUrl"
                              name="certificateUrl"
                              type="url"
                              required
                              className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              placeholder="https://example.com/certificate.pdf"
                              value={certificateUrl}
                              onChange={(e) =>
                                setCertificateUrl(e.target.value)
                              }
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Please provide a link to your professional
                            certificate or license
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <label
                            htmlFor="bio"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Professional Bio
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="bio"
                              name="bio"
                              rows={3}
                              required
                              className="block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                              placeholder="Brief description of your professional background and expertise..."
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Patient-specific fields */}
                {selectedRole === "patient" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="dateOfBirth"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Date of Birth (Optional)
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="gender"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Gender (Optional)
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Users className="h-5 w-5 text-gray-400" />
                          </div>
                          <select
                            id="gender"
                            name="gender"
                            className="pl-10 block w-full py-2 border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
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
                    </div>
                  </div>
                )}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${
                      isLoading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading ? "Creating account..." : "Create account"}
                  </button>
                </div>

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
                      to="/login"
                      className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
//   );
// }
