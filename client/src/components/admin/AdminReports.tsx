import { useState, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  User,
  Calendar,
  Flag,
  MessageSquare,
  MoreHorizontal,
  AlertCircle,
  Filter,
} from "lucide-react";
import api from "@/services/api";

interface Report {
  _id: string;
  reportType: "user" | "psychiatrist" | "content";
  reportedEntityId: string;
  reportedEntityName: string;
  reportedEntityType: string;
  reportedBy: {
    _id: string;
    name: string;
    email: string;
  };
  reason: string;
  description: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
  updatedAt: string;
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "resolved" | "dismissed"
  >("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "user" | "psychiatrist" | "content"
  >("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/reports");
      setReports(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await api.put(`/admin/reports/${reportId}/resolve`);
      // Update local state
      setReports(
        reports.map((report) =>
          report._id === reportId ? { ...report, status: "resolved" } : report
        )
      );
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error resolving report:", err);
      // Show error message
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await api.put(`/admin/reports/${reportId}/dismiss`);
      // Update local state
      setReports(
        reports.map((report) =>
          report._id === reportId ? { ...report, status: "dismissed" } : report
        )
      );
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error dismissing report:", err);
      // Show error message
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.reportedEntityName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedBy.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;

    const matchesType =
      typeFilter === "all" || report.reportType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="h-2 w-2 mr-1 rounded-full bg-yellow-400"></span>
            Pending
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="h-2 w-2 mr-1 rounded-full bg-green-400"></span>
            Resolved
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="h-2 w-2 mr-1 rounded-full bg-gray-400"></span>
            Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-5 w-5 text-orange-500" />;
      case "psychiatrist":
        return <User className="h-5 w-5 text-purple-500" />;
      case "content":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button
            onClick={fetchReports}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manage Reports</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <option value="all">All Types</option>
              <option value="user">User Reports</option>
              <option value="psychiatrist">Psychiatrist Reports</option>
              <option value="content">Content Reports</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Flag className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-600 font-medium">No reports found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No reports have been submitted yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden shadow rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Reported Entity
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Reason
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Reported By
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getReportTypeIcon(report.reportType)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {report.reportType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {report.reportedEntityName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {report.reportedEntityType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {report.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {report.reportedBy.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {report.reportedBy.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(report.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-sky-600 hover:text-sky-900"
                      onClick={() => {
                        setSelectedReport(report);
                        setIsModalOpen(true);
                      }}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Detail Modal */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                {getReportTypeIcon(selectedReport.reportType)}
                <h3 className="text-lg font-bold text-gray-900 ml-2">
                  Report Details
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <div className="mt-1">
                  {getStatusBadge(selectedReport.status)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Reported Entity
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReport.reportedEntityName}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedReport.reportedEntityType}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Reported By
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReport.reportedBy.name}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedReport.reportedBy.email}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Reason</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedReport.reason}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Description
                </h4>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {selectedReport.description}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Date Reported
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(selectedReport.createdAt)}
                </p>
              </div>

              {selectedReport.status === "pending" && (
                <div className="flex space-x-4 pt-4 border-t">
                  <button
                    onClick={() => handleResolveReport(selectedReport._id)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark as Resolved
                  </button>
                  <button
                    onClick={() => handleDismissReport(selectedReport._id)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Dismiss Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
