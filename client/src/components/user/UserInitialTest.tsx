import { useState } from "react";
import {
  Brain,
  Upload,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  User,
  Settings,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface TestResults {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
  classification?: {
    class: string;
    probability: number;
  };
  feedback?: {
    summary: string;
    recommendations: string[];
    encouraging_message: string;
    learning_plan: string;
  };
  report?: {
    _id: string;
    report_name: string;
    report_type: string;
    created_at: string;
  };
  [key: string]: unknown;
}

export default function UserInitialTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setError(null);
    setResults(null);

    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        setError("Please select a valid image file (JPG, JPEG, PNG, GIF)");
        setSelectedFile(null);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size should be less than 10MB");
        setSelectedFile(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select an image to upload");
      return;
    }

    if (!user) {
      setError("You must be logged in to submit a test");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create form data for the file upload
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("userId", user._id);

      // Send to our backend API
      const response = await api.post("/tests/initial", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        console.log("API response:", response.data);

        // Set the results from the API response
        const apiResults = response.data.results;

        // Add the report info and message if available
        if (response.data.report) {
          apiResults.report = response.data.report;
        }

        apiResults.message = response.data.message;

        setResults(apiResults);

        // Scroll to the results section
        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      } else {
        setError(response.data.message || "Failed to process the image");
      }
    } catch (err) {
      console.error("Error submitting initial test:", err);
      setError(
        "An error occurred while processing your image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Brain className="h-6 w-6 text-sky-500" />
        <h1 className="text-2xl font-bold text-gray-900">
          Initial Dysgraphia Test
        </h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="max-w-xl mx-auto">
          <p className="text-gray-600 mb-6">
            Upload a handwritten sample to analyze for potential dysgraphia
            indicators. For best results, please upload a clear image of
            handwriting on plain paper. Accepted formats: JPG, JPEG, PNG, GIF
            (max 10MB).
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="image-upload"
                accept="image/jpeg, image/png, image/gif, image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer py-6"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-gray-500 font-medium">
                    Click to upload an image
                  </span>
                  <span className="text-gray-400 text-sm mt-1">
                    JPG, JPEG, PNG, GIF up to 10MB
                  </span>
                </label>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedFile || loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                !selectedFile || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-sky-500 hover:bg-sky-600"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Analyzing...
                </span>
              ) : (
                "Analyze Handwriting"
              )}
            </button>
          </form>

          {results && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>

              {/* Display message about report status */}
              {results.message && !results.message.includes("Failed") && (
                <div
                  className={`p-4 rounded-lg mb-6 ${
                    results.report
                      ? "bg-green-50 border border-green-200"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div className="flex items-start">
                    <AlertCircle
                      className={`h-5 w-5 ${
                        results.report ? "text-green-500" : "text-blue-500"
                      } mr-2 mt-0.5`}
                    />
                    <p className="text-gray-700">{results.message}</p>
                  </div>
                  {results.report && (
                    <p className="text-sm text-gray-600 mt-2 ml-7">
                      You can view the full report in your{" "}
                      <a
                        href="/patient/dashboard?tab=reports"
                        className="text-sky-600 hover:underline"
                      >
                        Reports page
                      </a>
                      .
                    </p>
                  )}
                </div>
              )}

              {results.classification && (
                <div className="mb-6">
                  <div
                    className={`p-4 rounded-lg ${
                      results.classification.class === "Potential Dysgraphia"
                        ? "bg-amber-50 border border-amber-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <h4 className="font-medium text-lg mb-2">Classification</h4>
                    <p className="font-bold text-xl mb-1">
                      {results.classification.class}
                    </p>
                    <p className="text-gray-600">
                      Confidence:{" "}
                      {Math.round(results.classification.probability * 100)}%
                    </p>
                  </div>
                </div>
              )}

              {results.feedback && (
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Feedback</h4>

                  {results.feedback.summary && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h5 className="font-medium mb-2">Summary</h5>
                      <p className="text-gray-700">
                        {results.feedback.summary.replace(/\*\*/g, "")}
                      </p>
                    </div>
                  )}

                  {results.feedback.recommendations && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h5 className="font-medium mb-2">Recommendations</h5>
                      <div
                        className="text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html: results.feedback.recommendations[0]
                            .replace(/\*\*/g, "")
                            .replace(/\n/g, "<br>"),
                        }}
                      />
                    </div>
                  )}

                  {results.feedback.encouraging_message && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h5 className="font-medium mb-2">Encouraging Message</h5>
                      <p className="text-gray-700">
                        {results.feedback.encouraging_message.replace(
                          /\*\*/g,
                          ""
                        )}
                      </p>
                    </div>
                  )}

                  {results.feedback.learning_plan && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h5 className="font-medium mb-2">Learning Plan</h5>
                      <p className="text-gray-700">
                        {results.feedback.learning_plan.replace(/\*\*/g, "")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={() => setResults(null)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Hide Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
