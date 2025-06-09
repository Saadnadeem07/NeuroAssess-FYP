import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  AlertCircle,
} from "lucide-react";
import api from "@/services/api";

interface PendingPsychiatrist {
  _id: string;
  name: string;
  email: string;
  phone_number: string;
  gender?: string;
  date_of_birth: string;
  country_of_nationality: string;
  country_of_graduation: string;
  date_of_graduation: string;
  institute_name: string;
  license_number: string;
  degrees: string;
  years_of_experience: number;
  expertise: string;
  bio: string;
  certificateUrl: string;
  specializations: string[];
  education: string[];
  availability: Record<string, any>;
  emailVerified: boolean;
  isApproved: boolean;
  createdAt: string;
}

// Mock data for testing or fallback
const MOCK_PENDING_PSYCHIATRISTS: PendingPsychiatrist[] = [
  {
    _id: "1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone_number: "+1234567890",
    gender: "Female",
    date_of_birth: "1985-05-15T00:00:00.000Z",
    country_of_nationality: "United States",
    country_of_graduation: "United States",
    date_of_graduation: "2010-06-20T00:00:00.000Z",
    institute_name: "Harvard Medical School",
    license_number: "PSY12345",
    degrees: "MD, PhD",
    years_of_experience: 12,
    expertise: "Clinical Psychology",
    bio: "Experienced clinical psychologist specializing in anxiety disorders.",
    certificateUrl: "https://example.com/certificates/sarah-johnson.pdf",
    specializations: ["Anxiety Disorders", "Depression", "PTSD"],
    education: ["Harvard Medical School", "Stanford University"],
    availability: {},
    emailVerified: true,
    isApproved: false,
    createdAt: "2023-03-08T10:30:00Z",
  },
  {
    _id: "2",
    name: "Dr. Michael Chen",
    email: "michael.chen@example.com",
    phone_number: "+1987654321",
    gender: "Male",
    date_of_birth: "1980-08-22T00:00:00.000Z",
    country_of_nationality: "Canada",
    country_of_graduation: "Canada",
    date_of_graduation: "2008-05-15T00:00:00.000Z",
    institute_name: "University of Toronto",
    license_number: "PSY67890",
    degrees: "MD",
    years_of_experience: 15,
    expertise: "Neuropsychology",
    bio: "Neuropsychologist with 15 years of experience in cognitive assessment.",
    certificateUrl: "https://example.com/certificates/michael-chen.pdf",
    specializations: ["Cognitive Assessment", "Brain Injury", "Dementia"],
    education: ["University of Toronto", "McGill University"],
    availability: {},
    emailVerified: true,
    isApproved: false,
    createdAt: "2023-03-07T14:15:00Z",
  },
  {
    _id: "3",
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@example.com",
    phone_number: "+1122334455",
    gender: "Female",
    date_of_birth: "1988-11-10T00:00:00.000Z",
    country_of_nationality: "Spain",
    country_of_graduation: "United States",
    date_of_graduation: "2014-06-10T00:00:00.000Z",
    institute_name: "UCLA Medical School",
    license_number: "PSY54321",
    degrees: "MD, MSc",
    years_of_experience: 9,
    expertise: "Child Psychology",
    bio: "Specialized in treating children with developmental disorders.",
    certificateUrl: "https://example.com/certificates/emily-rodriguez.pdf",
    specializations: ["Child Development", "ADHD", "Autism"],
    education: ["UCLA Medical School", "University of Barcelona"],
    availability: {},
    emailVerified: true,
    isApproved: false,
    createdAt: "2023-03-06T09:45:00Z",
  },
];

export default function AdminPsychiatristApprovals() {
  const [pendingPsychiatrists, setPendingPsychiatrists] = useState<
    PendingPsychiatrist[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPsychiatrist, setSelectedPsychiatrist] =
    useState<PendingPsychiatrist | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    fetchPendingPsychiatrists();

    // Check authentication status
    const checkAuthStatus = async () => {
      const isAuthenticated = await api.checkAuth();
      if (!isAuthenticated) {
        setError("Authentication failed. Please log in again.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 3000);
      }
    };

    checkAuthStatus();
  }, []);

  const fetchPendingPsychiatrists = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add retry logic for network errors
      let retries = 0;
      const maxRetries = 2;
      let success = false;

      while (retries <= maxRetries && !success) {
        try {
          // Check if we're online before making the request
          if (!navigator.onLine) {
            throw new Error(
              "You are currently offline. Please check your internet connection and try again."
            );
          }

          // Try to fetch real data from API
          const response = await api.get("/admin/psychiatrists/pending");
          setPendingPsychiatrists(response.data.data);
          setUsingMockData(false);
          success = true;
        } catch (apiError: any) {
          console.warn(`API call attempt ${retries + 1} failed:`, apiError);

          // Only retry on network errors, not on server errors
          if (
            (apiError.isNetworkError || !apiError.response) &&
            retries < maxRetries
          ) {
            console.log(
              `Network error, retrying (${retries + 1}/${maxRetries})...`
            );
            retries++;

            // Show a temporary message about retrying
            setError(
              `Network issue detected. Retrying... (${retries}/${maxRetries})`
            );

            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, retries))
            );
          } else {
            // Don't retry for server errors or if max retries reached
            console.warn(
              "API call failed after retries, using mock data instead:",
              apiError
            );
            // Fall back to mock data if API call fails
            setPendingPsychiatrists(MOCK_PENDING_PSYCHIATRISTS);
            setUsingMockData(true);

            // Set a more user-friendly error message
            if (apiError.isNetworkError || !apiError.response) {
              setError(
                "Network connection issue. Using mock data instead. Please check your internet connection."
              );
            } else {
              setError(
                apiError.response?.data?.message ||
                  "Failed to load psychiatrist data from server. Using mock data instead."
              );
            }

            break;
          }
        }
      }
    } catch (err: any) {
      console.error("Error fetching pending psychiatrists:", err);
      setError(err.message || "Failed to load pending psychiatrist approvals");
      // Fall back to mock data as a last resort
      setPendingPsychiatrists(MOCK_PENDING_PSYCHIATRISTS);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionInProgress(true);
      setError(null);

      // Debug: Log authentication token
      const token = localStorage.getItem("token");
      console.log("Authentication token available:", !!token);

      if (!token) {
        setError("Authentication token missing. Please log in again.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 3000);
        return;
      }

      if (!usingMockData) {
        // Use real API if available
        try {
          // Add retry logic for network errors
          let retries = 0;
          const maxRetries = 3;
          let success = false;
          let lastError: any = null;

          // Try a different approach - use fetch API directly as a fallback
          const tryDirectFetch = async () => {
            try {
              const apiUrl =
                import.meta.env.VITE_API_URL || "http://localhost:5002/api";
              const url = `${apiUrl}/admin/psychiatrists/${id}/approve`;
              console.log("Trying direct fetch to:", url);

              const response = await fetch(url, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                credentials: "include",
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const data = await response.json();
              console.log("Direct fetch response:", data);

              if (data.success) {
                setPendingPsychiatrists((prev) =>
                  prev.filter((p) => p._id !== id)
                );
                setSuccessMessage("Psychiatrist approved successfully");
                return true;
              } else {
                throw new Error(
                  data.message || "Failed to approve psychiatrist"
                );
              }
            } catch (fetchError) {
              console.error("Direct fetch failed:", fetchError);
              return false;
            }
          };

          while (retries <= maxRetries && !success) {
            try {
              // Check if we're online before making the request
              if (!navigator.onLine) {
                throw new Error(
                  "You are currently offline. Please check your internet connection and try again."
                );
              }

              // Debug: Log the API endpoint being called
              console.log(
                `Calling API endpoint: /admin/psychiatrists/${id}/approve`
              );

              // First try with axios
              try {
                const response = await api.patch(
                  `/admin/psychiatrists/${id}/approve`
                );
                console.log("Approval response:", response.data);

                if (response.data.success) {
                  setPendingPsychiatrists((prev) =>
                    prev.filter((p) => p._id !== id)
                  );
                  setSuccessMessage("Psychiatrist approved successfully");
                  success = true;
                } else {
                  throw new Error(
                    response.data.message || "Failed to approve psychiatrist"
                  );
                }
              } catch (axiosError: any) {
                console.error(
                  "Axios request failed, trying direct fetch:",
                  axiosError
                );

                // If axios fails, try direct fetch
                success = await tryDirectFetch();
                if (!success) {
                  throw axiosError; // Re-throw for retry logic
                }
              }
            } catch (apiError: any) {
              lastError = apiError;
              console.error(`Attempt ${retries + 1} failed:`, apiError);

              // Debug: Log detailed error information
              if (apiError.response) {
                console.error("Error response data:", apiError.response.data);
                console.error(
                  "Error response status:",
                  apiError.response.status
                );
                console.error(
                  "Error response headers:",
                  apiError.response.headers
                );
              } else if (apiError.request) {
                console.error("Error request:", apiError.request);
              }

              // Only retry on network errors, not on server errors
              if (
                (apiError.isNetworkError || !apiError.response) &&
                retries < maxRetries
              ) {
                console.log(
                  `Network error, retrying (${retries + 1}/${maxRetries})...`
                );
                retries++;

                // Show a temporary message to the user about retrying
                setError(
                  `Network issue detected. Retrying... (${retries}/${maxRetries})`
                );

                // Wait before retrying (exponential backoff)
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * Math.pow(2, retries))
                );
              } else {
                // Don't retry for server errors or if max retries reached
                break;
              }
            }
          }

          // If all retries failed, handle the error
          if (!success) {
            console.error(
              "API Error approving psychiatrist after retries:",
              lastError
            );
            const errorMessage = lastError.isNetworkError
              ? "Network connection issue. Please check your internet connection and try again."
              : lastError.response?.data?.message ||
                lastError.message ||
                "Failed to approve psychiatrist";
            setError(errorMessage);
            throw new Error(errorMessage);
          }
        } catch (apiError: any) {
          console.error("Final API Error approving psychiatrist:", apiError);
          const errorMessage =
            apiError.response?.data?.message ||
            apiError.message ||
            "Failed to approve psychiatrist";
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        // Simulate API call with mock data
        setTimeout(() => {
          setPendingPsychiatrists((prev) => prev.filter((p) => p._id !== id));
          setSuccessMessage("Psychiatrist approved successfully");
          setActionInProgress(false);
        }, 500);
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error approving psychiatrist:", err);
      setError(
        err instanceof Error ? err.message : "Failed to approve psychiatrist"
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      if (!usingMockData) {
        setActionInProgress(false);
      }
    }
  };

  const openRejectionModal = (psychiatrist: PendingPsychiatrist) => {
    setSelectedPsychiatrist(psychiatrist);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const handleReject = async () => {
    if (!selectedPsychiatrist) return;

    try {
      setActionInProgress(true);
      setError(null);

      if (!usingMockData) {
        // Use real API if available
        try {
          // Add retry logic for network errors
          let retries = 0;
          const maxRetries = 3;
          let success = false;
          let lastError: any = null;

          while (retries <= maxRetries && !success) {
            try {
              // Check if we're online before making the request
              if (!navigator.onLine) {
                throw new Error(
                  "You are currently offline. Please check your internet connection and try again."
                );
              }

              const response = await api.patch(
                `/admin/psychiatrists/${selectedPsychiatrist._id}/reject`,
                {
                  reason: rejectionReason,
                }
              );

              console.log("Rejection response:", response.data);

              if (response.data.success) {
                setPendingPsychiatrists((prev) =>
                  prev.filter((p) => p._id !== selectedPsychiatrist._id)
                );
                setShowRejectionModal(false);
                setSuccessMessage("Psychiatrist application rejected");
                success = true;
              } else {
                throw new Error(
                  response.data.message || "Failed to reject psychiatrist"
                );
              }
            } catch (apiError: any) {
              lastError = apiError;
              console.error(`Attempt ${retries + 1} failed:`, apiError);

              // Only retry on network errors, not on server errors
              if (
                (apiError.isNetworkError || !apiError.response) &&
                retries < maxRetries
              ) {
                console.log(
                  `Network error, retrying (${retries + 1}/${maxRetries})...`
                );
                retries++;

                // Show a temporary message to the user about retrying
                setError(
                  `Network issue detected. Retrying... (${retries}/${maxRetries})`
                );

                // Wait before retrying (exponential backoff)
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * Math.pow(2, retries))
                );
              } else {
                // Don't retry for server errors or if max retries reached
                break;
              }
            }
          }

          // If all retries failed, handle the error
          if (!success) {
            console.error(
              "API Error rejecting psychiatrist after retries:",
              lastError
            );
            const errorMessage = lastError.isNetworkError
              ? "Network connection issue. Please check your internet connection and try again."
              : lastError.response?.data?.message ||
                lastError.message ||
                "Failed to reject psychiatrist";
            setError(errorMessage);
            throw new Error(errorMessage);
          }
        } catch (apiError: any) {
          console.error("Final API Error rejecting psychiatrist:", apiError);
          const errorMessage =
            apiError.response?.data?.message ||
            apiError.message ||
            "Failed to reject psychiatrist";
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        // Simulate API call with mock data
        setTimeout(() => {
          setPendingPsychiatrists((prev) =>
            prev.filter((p) => p._id !== selectedPsychiatrist._id)
          );
          setShowRejectionModal(false);
          setSuccessMessage("Psychiatrist application rejected");
          setActionInProgress(false);
        }, 500);
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error rejecting psychiatrist:", err);
      setError(
        err instanceof Error ? err.message : "Failed to reject psychiatrist"
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      if (!usingMockData) {
        setActionInProgress(false);
      }
    }
  };

  const testApiConnection = async () => {
    try {
      setError(null);

      // First, test the health endpoint
      console.log("Testing API health endpoint...");
      try {
        const healthResponse = await api.get("/api/health");
        console.log("API health check response:", healthResponse.data);
        setSuccessMessage("API health check successful");
      } catch (healthError: any) {
        console.error("API health check failed:", healthError);
        setError(
          "API health check failed. The server might be down or unreachable."
        );
        return;
      }

      // Then, test a simple admin endpoint
      console.log("Testing admin endpoint...");
      try {
        const adminResponse = await api.get("/admin/psychiatrists/pending");
        console.log("Admin endpoint test response:", adminResponse.data);
        setSuccessMessage(
          "API connection successful. Admin endpoints are accessible."
        );
      } catch (adminError: any) {
        console.error("Admin endpoint test failed:", adminError);
        if (adminError.response) {
          // We got a response, but it's an error
          setError(
            `Admin endpoint test failed with status ${
              adminError.response.status
            }: ${adminError.response.data.message || "Unknown error"}`
          );
        } else {
          // No response received
          setError(
            "Admin endpoint test failed. Authentication might be invalid or the endpoint might not exist."
          );
        }
        return;
      }

      // Finally, test the direct fetch approach to the approval endpoint
      if (pendingPsychiatrists.length > 0) {
        const testId = pendingPsychiatrists[0]._id;
        console.log(
          `Testing direct fetch to approval endpoint for ID: ${testId}`
        );

        try {
          const token = localStorage.getItem("token");
          if (!token) {
            setError("Authentication token missing. Please log in again.");
            return;
          }

          const apiUrl =
            import.meta.env.VITE_API_URL || "http://localhost:5002/api";
          const url = `${apiUrl}/admin/psychiatrists/${testId}/approve`;

          // Don't actually approve, just test the connection with a HEAD request
          const testResponse = await fetch(url, {
            method: "HEAD",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          });

          console.log(
            "Direct fetch test response status:",
            testResponse.status
          );

          if (testResponse.ok || testResponse.status === 405) {
            // 405 Method Not Allowed is actually good here - it means the endpoint exists
            setSuccessMessage(
              "Approval endpoint is accessible. You should be able to approve psychiatrists."
            );
          } else {
            setError(
              `Approval endpoint test failed with status: ${testResponse.status}`
            );
          }
        } catch (fetchError) {
          console.error("Direct fetch test failed:", fetchError);
          setError(
            "Approval endpoint test failed. There might be a network or CORS issue."
          );
        }
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("API connection test failed:", error);
      setError(
        "API connection test failed. Please check your network connection and server status."
      );
      setTimeout(() => setError(null), 5000);
    }
  };

  const filteredPsychiatrists = pendingPsychiatrists.filter(
    (psychiatrist) =>
      psychiatrist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psychiatrist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psychiatrist.expertise.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Psychiatrist Approvals
          {usingMockData && (
            <div className="flex items-center text-amber-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Using mock data</span>
            </div>
          )}
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name, email, or expertise..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
            {error.includes("Network") && (
              <button
                onClick={fetchPendingPsychiatrists}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add test connection button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={testApiConnection}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Test API Connection
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">
            Loading psychiatrist approvals...
          </p>
        </div>
      ) : filteredPsychiatrists.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">
            No pending psychiatrist approvals found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredPsychiatrists.map((psychiatrist) => (
            <div
              key={psychiatrist._id}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {psychiatrist.name}
                    </h3>
                    <p className="text-gray-600">{psychiatrist.email}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700">
                        Professional Details
                      </h4>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>
                          <span className="font-medium">Expertise:</span>{" "}
                          {psychiatrist.expertise}
                        </li>
                        <li>
                          <span className="font-medium">Experience:</span>{" "}
                          {psychiatrist.years_of_experience} years
                        </li>
                        <li>
                          <span className="font-medium">Degrees:</span>{" "}
                          {psychiatrist.degrees}
                        </li>
                        <li>
                          <span className="font-medium">License:</span>{" "}
                          {psychiatrist.license_number}
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-700">
                        Education & Specialization
                      </h4>
                      <div className="mt-2 text-sm">
                        <p>
                          <span className="font-medium">Institute:</span>{" "}
                          {psychiatrist.institute_name}
                        </p>
                        <p>
                          <span className="font-medium">Graduation:</span>{" "}
                          {new Date(
                            psychiatrist.date_of_graduation
                          ).toLocaleDateString()}
                        </p>
                        {psychiatrist.specializations &&
                          psychiatrist.specializations.length > 0 && (
                            <div className="mt-1">
                              <span className="font-medium">
                                Specializations:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {psychiatrist.specializations.map(
                                  (spec, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                    >
                                      {spec}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700">Bio</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {psychiatrist.bio}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <a
                      href={psychiatrist.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Certificate <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-3 justify-end">
                  <button
                    onClick={() => handleApprove(psychiatrist._id)}
                    disabled={actionInProgress}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => openRejectionModal(psychiatrist)}
                    disabled={actionInProgress}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedPsychiatrist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Reject Application
            </h3>
            <p className="mb-4 text-gray-600">
              You are about to reject the application for{" "}
              <span className="font-semibold">{selectedPsychiatrist.name}</span>
              . Please provide a reason for rejection:
            </p>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-4"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this application is being rejected..."
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionInProgress}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
