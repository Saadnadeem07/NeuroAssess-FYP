import { useState, useEffect } from "react";
import {
  BookOpen,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  Calendar,
  User,
  Settings,
  MessageSquare,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface LearningPlan {
  _id: string;
  user_id: string;
  module_number: number;
  learning_plan_paragraph: string;
  created_at: string;
  report_id: string;
}

interface ModuleState {
  selectedFile: File | null;
  previewUrl: string | null;
  loading: boolean;
  results: Record<string, unknown> | null;
  error: string | null;
  success: boolean;
}

export default function UserLearningPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<number>(1);
  const [learningPlans, setLearningPlans] = useState<LearningPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestLearningPlanText, setLatestLearningPlanText] = useState<
    string | null
  >(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [module1State, setModule1State] = useState<ModuleState>({
    selectedFile: null,
    previewUrl: null,
    loading: false,
    results: null,
    error: null,
    success: false,
  });

  const [module2State, setModule2State] = useState<ModuleState>({
    selectedFile: null,
    previewUrl: null,
    loading: false,
    results: null,
    error: null,
    success: false,
  });

  useEffect(() => {
    const fetchLearningPlans = async () => {
      try {
        if (!user) {
          setError("You must be logged in to view learning plans");
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await api.get(`/learning-plans?userId=${user._id}`);

        if (response.data.success) {
          setLearningPlans(response.data.learningPlans);

          // If user has completed module 1, set active module to 2
          const hasModule1 = response.data.learningPlans.some(
            (plan: LearningPlan) => plan.module_number === 1
          );

          if (hasModule1) {
            setActiveModule(2);
          }
        } else {
          setError(response.data.message || "Failed to fetch learning plans");
        }
      } catch (err) {
        console.error("Error fetching learning plans:", err);
        setError(
          "An error occurred while fetching your learning plans. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPlans();
  }, [user]);

  // Fetch reports to get the latest learning plan paragraph
  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;

      try {
        const response = await api.get(`/tests/reports?userId=${user._id}`);

        if (response.data.success && response.data.reports) {
          // Define a type for the report structure
          type ReportType = {
            report_type: string;
            created_at: string;
            report_data: {
              learning_plan?: string;
              feedback?: {
                learning_plan?: string;
                summary?: string;
              };
            };
          };

          // Find the latest report (could be either testing or learning-plan type)
          const allReports = response.data.reports.sort(
            (a: ReportType, b: ReportType) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

          console.log("Found reports:", allReports.length);

          if (allReports.length > 0) {
            // Try to extract learning plan text from any report
            for (const report of allReports) {
              let learningPlanText = null;

              // First priority: Check for feedback.learning_plan
              if (report.report_data?.feedback?.learning_plan) {
                learningPlanText = report.report_data.feedback.learning_plan;
                console.log(
                  "Found learning plan text in feedback.learning_plan"
                );
              }
              // Second priority: Check for learning_plan directly
              else if (report.report_data?.learning_plan) {
                learningPlanText = report.report_data.learning_plan;
                console.log("Found learning plan text in learning_plan");
              }

              if (learningPlanText) {
                // Clean up the text if needed (remove markdown, etc.)
                learningPlanText = learningPlanText.replace(/\*\*/g, "").trim();
                setLatestLearningPlanText(learningPlanText);
                console.log(
                  "Set learning plan text:",
                  learningPlanText.substring(0, 50) + "..."
                );
                break; // Stop after finding the first valid learning plan text
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
      }
    };

    fetchReports();
  }, [user]);

  const handleFileChange = (
    moduleNumber: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    const currentState = moduleNumber === 1 ? module1State : module2State;
    const setCurrentState =
      moduleNumber === 1 ? setModule1State : setModule2State;

    if (!file) {
      setCurrentState({
        ...currentState,
        selectedFile: null,
        previewUrl: null,
        error: null,
        results: null,
        success: false,
      });
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setCurrentState({
        ...currentState,
        selectedFile: null,
        previewUrl: null,
        error: "Please select a valid image file (JPG, JPEG, PNG, GIF)",
        results: null,
        success: false,
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCurrentState({
        ...currentState,
        selectedFile: null,
        previewUrl: null,
        error: "File size should be less than 10MB",
        results: null,
        success: false,
      });
      return;
    }

    // File is valid, create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrentState({
        ...currentState,
        selectedFile: file,
        previewUrl: reader.result as string,
        error: null,
        results: null,
        success: false,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (moduleNumber: number, e: React.FormEvent) => {
    e.preventDefault();

    const currentState = moduleNumber === 1 ? module1State : module2State;
    const setCurrentState =
      moduleNumber === 1 ? setModule1State : setModule2State;

    if (!currentState.selectedFile) {
      setCurrentState({
        ...currentState,
        error: "Please select an image to upload",
      });
      return;
    }

    if (!user) {
      setCurrentState({
        ...currentState,
        error: "You must be logged in to submit a learning plan",
      });
      return;
    }

    setCurrentState({
      ...currentState,
      loading: true,
      error: null,
    });

    try {
      // Create form data for the file upload
      const formData = new FormData();
      formData.append("image", currentState.selectedFile);
      formData.append("moduleNumber", moduleNumber.toString());
      formData.append("userId", user._id);

      // For module 2, include the previous learning plan
      if (moduleNumber === 2) {
        const module1Plan = learningPlans.find(
          (plan) => plan.module_number === 1
        );

        let previousLearningPlanText = null;

        if (module1Plan) {
          previousLearningPlanText = module1Plan.learning_plan_paragraph;
        } else if (latestLearningPlanText) {
          previousLearningPlanText = latestLearningPlanText;
        }

        if (previousLearningPlanText) {
          formData.append("previousLearningPlan", previousLearningPlanText);
          console.log(
            "Including previous learning plan:",
            previousLearningPlanText
          );
        }
      }

      // Send to our backend API
      const response = await api.post("/learning-plans/module", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setCurrentState({
          ...currentState,
          results: response.data.results,
          success: true,
          loading: false,
        });

        // Update learning plans
        if (response.data.learningPlan) {
          setLearningPlans((prev) => {
            const exists = prev.some(
              (plan) => plan.module_number === moduleNumber
            );
            if (exists) {
              return prev.map((plan) =>
                plan.module_number === moduleNumber
                  ? response.data.learningPlan
                  : plan
              );
            } else {
              return [...prev, response.data.learningPlan];
            }
          });
        }

        // If module 1 is completed, set active module to 2
        if (moduleNumber === 1) {
          setActiveModule(2);
        }
      } else {
        setCurrentState({
          ...currentState,
          error: response.data.message || "Failed to process the image",
          loading: false,
        });
      }
    } catch (err) {
      console.error(`Error submitting module ${moduleNumber}:`, err);
      setCurrentState({
        ...currentState,
        error:
          "An error occurred while processing your image. Please try again.",
        loading: false,
      });
    }
  };

  const renderModuleContent = (moduleNumber: number) => {
    const currentState = moduleNumber === 1 ? module1State : module2State;
    const existingPlan = learningPlans.find(
      (plan) => plan.module_number === moduleNumber
    );

    if (existingPlan) {
      return (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-green-800">
              Module {moduleNumber} Completed
            </h3>
          </div>
          <div className="bg-white p-4 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">
              Your Learning Plan:
            </h4>
            <p className="text-gray-600">
              {existingPlan.learning_plan_paragraph}
            </p>
          </div>
          {moduleNumber === 1 && (
            <div className="mt-4">
              <button
                onClick={() => setActiveModule(2)}
                className="text-green-600 font-medium hover:text-green-800"
              >
                Continue to Module 2 →
              </button>
            </div>
          )}
        </div>
      );
    }

    // Get the text to handwrite for this module
    let textToHandwrite = "";

    if (moduleNumber === 1) {
      // For module 1, use a standard pangram
      textToHandwrite =
        "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!";
    } else {
      // For module 2, prioritize different sources
      if (latestLearningPlanText) {
        // First priority: Use the text from the latest report
        textToHandwrite = latestLearningPlanText;
      } else if (
        learningPlans.find((plan) => plan.module_number === 1)
          ?.learning_plan_paragraph
      ) {
        // Second priority: Use the text from module 1 learning plan
        textToHandwrite = learningPlans.find(
          (plan) => plan.module_number === 1
        )!.learning_plan_paragraph;
      } else {
        // Fallback: Use a standard text
        textToHandwrite =
          "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.";
      }
    }

    return (
      <>
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Text to Handwrite:</h4>
          <div className="bg-white p-4 rounded-md border border-blue-100">
            <p className="text-gray-700">{textToHandwrite}</p>
          </div>
          <div className="mt-3 flex items-center">
            {moduleNumber === 2 && latestLearningPlanText && (
              <div className="flex items-center text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full mr-2">
                <FileText className="h-3 w-3 mr-1" />
                <span>From latest report</span>
              </div>
            )}
            <p className="text-sm text-blue-600">
              Please handwrite the text above on a piece of paper and upload a
              clear image of it.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => handleSubmit(moduleNumber, e)}
          className="space-y-6"
        >
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id={`image-upload-module-${moduleNumber}`}
              accept="image/jpeg, image/png, image/gif, image/jpg"
              onChange={(e) => handleFileChange(moduleNumber, e)}
              className="hidden"
            />

            {currentState.previewUrl ? (
              <div className="space-y-4">
                <img
                  src={currentState.previewUrl}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (moduleNumber === 1) {
                      setModule1State({
                        ...module1State,
                        selectedFile: null,
                        previewUrl: null,
                      });
                    } else {
                      setModule2State({
                        ...module2State,
                        selectedFile: null,
                        previewUrl: null,
                      });
                    }
                  }}
                  className="text-red-500 text-sm hover:underline"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <label
                htmlFor={`image-upload-module-${moduleNumber}`}
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

          {currentState.error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {currentState.error}
            </div>
          )}

          <button
            type="submit"
            disabled={!currentState.selectedFile || currentState.loading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
              !currentState.selectedFile || currentState.loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-sky-500 hover:bg-sky-600"
            }`}
          >
            {currentState.loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Processing...
              </span>
            ) : (
              "Submit Handwriting Sample"
            )}
          </button>

          {currentState.success && currentState.results && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <h4 className="font-medium text-green-800">
                  Analysis Complete
                </h4>
              </div>
              <p className="text-gray-600 text-sm">
                Your handwriting sample has been analyzed and a learning plan
                has been created.
              </p>
            </div>
          )}
        </form>
      </>
    );
  };

  const handleResetLearningPlans = async () => {
    if (!user) {
      setResetError("You must be logged in to reset learning plans");
      return;
    }

    // Confirm with the user
    if (
      !window.confirm(
        "Are you sure you want to reset your learning plans? This will delete all your current progress."
      )
    ) {
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(false);

    try {
      const response = await api.post("/learning-plans/reset", {
        userId: user._id,
      });

      if (response.data.success) {
        setResetSuccess(true);
        setLearningPlans([]);
        setActiveModule(1);

        // Reset module states
        setModule1State({
          selectedFile: null,
          previewUrl: null,
          loading: false,
          results: null,
          error: null,
          success: false,
        });

        setModule2State({
          selectedFile: null,
          previewUrl: null,
          loading: false,
          results: null,
          error: null,
          success: false,
        });
      } else {
        setResetError(
          response.data.message || "Failed to reset learning plans"
        );
      }
    } catch (err) {
      console.error("Error resetting learning plans:", err);
      setResetError(
        "An error occurred while resetting your learning plans. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 text-red-600 p-6 rounded-lg border border-red-200">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-lg mb-2">
                Error Loading Learning Plans
              </h3>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Check if both modules are completed
    const hasCompletedBothModules =
      learningPlans.some((plan) => plan.module_number === 1) &&
      learningPlans.some((plan) => plan.module_number === 2);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-sky-500" />
          <h1 className="text-2xl font-bold text-gray-900">Learning Plan</h1>
        </div>

        {hasCompletedBothModules && (
          <button
            onClick={handleResetLearningPlans}
            disabled={resetLoading}
            className={`flex items-center px-4 py-2 rounded-lg text-white ${
              resetLoading ? "bg-gray-400" : "bg-sky-500 hover:bg-sky-600"
            }`}
          >
            {resetLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Reset Learning Plan
          </button>
        )}

        {resetSuccess && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700">
                Your learning plans have been reset successfully. You can now
                start a new assessment.
              </p>
            </div>
          </div>
        )}

        {resetError && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{resetError}</p>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <p className="text-gray-600">
              Upload handwriting samples to receive personalized learning plans
              to help improve your writing skills. Complete Module 1 before
              proceeding to Module 2.
            </p>
          </div>

          {hasCompletedBothModules && (
            <div className="mb-6 bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-lg text-green-800 mb-2">
                    Congratulations! You've completed both learning plan
                    modules.
                  </h3>
                  <p className="text-green-700">
                    You can continue to view your learning plans or reset them
                    to start a new assessment. Resetting will save your
                    completed plans in your reports for future reference.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveModule(1)}
              className={`py-3 px-4 font-medium border-b-2 ${
                activeModule === 1
                  ? "border-sky-500 text-sky-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Module 1: Initial Assessment
            </button>
            <button
              onClick={() => setActiveModule(2)}
              disabled={!learningPlans.some((plan) => plan.module_number === 1)}
              className={`py-3 px-4 font-medium border-b-2 ${
                activeModule === 2
                  ? "border-sky-500 text-sky-600"
                  : learningPlans.some((plan) => plan.module_number === 1)
                  ? "border-transparent text-gray-500 hover:text-gray-700"
                  : "border-transparent text-gray-300 cursor-not-allowed"
              }`}
            >
              Module 2: Progress Assessment
            </button>
          </div>

          <div className="p-1">
            {activeModule === 1 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Module 1: Initial Assessment
                </h2>
                <p className="text-gray-600 mb-6">
                  Upload a handwriting sample to receive your initial learning
                  plan. This will establish a baseline for your skills.
                </p>
                {renderModuleContent(1)}
              </div>
            )}

            {activeModule === 2 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Module 2: Progress Assessment
                </h2>
                <p className="text-gray-600 mb-6">
                  Upload a new handwriting sample to assess your progress and
                  receive an updated learning plan.
                </p>
                {!learningPlans.some((plan) => plan.module_number === 1) ? (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                      <p className="text-amber-700">
                        Please complete Module 1 before proceeding to Module 2.
                      </p>
                    </div>
                  </div>
                ) : (
                  renderModuleContent(2)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return <div className="space-y-6">{renderContent()}</div>;
}
