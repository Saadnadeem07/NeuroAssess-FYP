import { useState, useEffect } from "react";
import {
  FileText,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
  Brain,
  Calendar,
  User,
  Settings,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface Report {
  _id: string;
  report_name: string;
  report_type: "testing" | "learning-plan";
  created_at: string;
  user_id: string;
  report_data: {
    classification?: {
      class: string;
      probability: number;
    };
    feedback?: {
      summary: string;
    };
    dysgraphic_words?: string[];
    spelling_errors?: string[];
    alignment_issues?: string[];
    spacing_issues?: string[];
    image?: string; // Base64 encoded image
  };
}

export default function UserReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) {
        setError("You must be logged in to view reports");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/tests/reports?userId=${user._id}`);

        if (response.data.success) {
          setReports(response.data.reports);
        } else {
          setError(response.data.message || "Failed to fetch reports");
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError(
          "An error occurred while fetching your reports. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "testing":
        return "Initial Test";
      case "learning-plan":
        return "Learning Plan";
      default:
        return type;
    }
  };

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
  };

  const handleBackClick = () => {
    setSelectedReport(null);
  };

  // Helper function to parse and display dysgraphic words
  const renderDysgraphicWords = (words: string[] | undefined) => {
    if (!words || words.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3 text-red-700">
          Dysgraphic Words
        </h4>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <ul className="space-y-2">
            {words.map((word, index) => (
              <li key={index} className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div
                  className="text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: word
                      .replace(/\*\*/g, "")
                      .replace(/\*/g, "")
                      .replace(/\n/g, "<br>"),
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Helper function to render issues
  const renderIssues = (
    issues: string[] | undefined,
    title: string,
    color: string
  ) => {
    if (!issues || issues.length === 0) return null;

    const colorClasses = {
      red: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        icon: "text-red-500",
      },
      amber: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        icon: "text-amber-500",
      },
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: "text-blue-500",
      },
    };

    const classes =
      colorClasses[color as keyof typeof colorClasses] || colorClasses.amber;

    return (
      <div className="mb-6">
        <h4 className={`text-lg font-medium mb-3 ${classes.text}`}>{title}</h4>
        <div
          className={`${classes.bg} p-4 rounded-lg border ${classes.border}`}
        >
          <ul className="space-y-2">
            {issues.map((issue, index) => (
              <li key={index} className="flex items-start">
                <AlertTriangle
                  className={`h-5 w-5 ${classes.icon} mr-2 mt-0.5 flex-shrink-0`}
                />
                <div
                  className="text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: issue
                      .replace(/\*\*/g, "")
                      .replace(/\*/g, "")
                      .replace(/\n/g, "<br>"),
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
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
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      );
    }

    if (selectedReport) {
      const reportData = selectedReport.report_data;

      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBackClick}
              className="flex items-center text-sky-600 hover:text-sky-800"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Handwriting Analysis Report
              </h2>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span className="mr-4">
                  {formatDate(selectedReport.created_at)}
                </span>
                <span className="bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs">
                  {getReportTypeLabel(selectedReport.report_type)}
                </span>
              </div>
            </div>

            {/* Display the handwriting image */}
            {reportData.image && (
              <div className="mb-6 border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <div className="flex items-center">
                    <ImageIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-medium">Handwriting Sample</h3>
                  </div>
                </div>
                <div className="p-4 flex justify-center">
                  <img
                    src={reportData.image}
                    alt="Handwriting Sample"
                    className="max-h-96 rounded-md shadow-sm"
                  />
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              {/* Classification */}
              {reportData.classification && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Classification</h3>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center">
                      <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />
                      <div>
                        <p className="font-bold text-lg text-amber-800">
                          {reportData.classification.class}
                        </p>
                        <p className="text-amber-700">
                          Confidence:{" "}
                          {Math.round(
                            reportData.classification.probability * 100
                          )}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {reportData.feedback?.summary && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Summary</h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700">
                      {reportData.feedback.summary.replace(/\*\*/g, "")}
                    </p>
                  </div>
                </div>
              )}

              {/* Dysgraphic Words */}
              {renderDysgraphicWords(reportData.dysgraphic_words)}

              {/* Spelling Errors */}
              {renderIssues(
                reportData.spelling_errors,
                "Spelling Errors",
                "red"
              )}

              {/* Alignment Issues */}
              {renderIssues(
                reportData.alignment_issues,
                "Alignment Issues",
                "amber"
              )}

              {/* Spacing Issues */}
              {renderIssues(
                reportData.spacing_issues,
                "Spacing Issues",
                "blue"
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-sky-500" />
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {reports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No reports yet
              </h3>
              <p className="text-gray-500">
                Complete an initial test or learning plan to generate reports.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {reports.map((report) => (
                <li key={report._id}>
                  <button
                    onClick={() => handleReportClick(report)}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Handwriting Analysis Report
                      </h3>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-500 mr-3">
                          {formatDate(report.created_at)}
                        </span>
                        <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-xs">
                          {getReportTypeLabel(report.report_type)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6 text-sky-500" />
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      {renderContent()}
    </div>
  );
}
