import { useState, useEffect } from "react";
import {
  Search,
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  Filter,
  AlertCircle,
} from "lucide-react";
import api from "@/services/api";

interface Psychiatrist {
  _id: string;
  accountId: string;
  name: string;
  email: string;
  expertise: string;
  bio: string;
  certificateUrl: string;
  createdAt: string;
  status: "approved" | "pending" | "rejected";
  rejectionReason?: string;
}

const MALE_AVATAR = "/assets/images/male-doctor-avatar.png";
const FEMALE_AVATAR = "/assets/images/female-doctor-avatar.png";

export default function AdminAllPsychiatrists() {
  const [psychiatrists, setPsychiatrists] = useState<Psychiatrist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "approved" | "pending" | "rejected"
  >("all");

  useEffect(() => {
    fetchPsychiatrists();
  }, []);

  const fetchPsychiatrists = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/psychiatrists");
      setPsychiatrists(response.data.data || []);
    } catch (err: any) {
      console.error("Error fetching psychiatrists:", err);
      setError("Failed to load psychiatrists. Please try again later.");

      setPsychiatrists([]);

      if (err.response) {
        console.log("Error response:", err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredPsychiatrists = psychiatrists.filter((psychiatrist) => {
    const matchesSearch =
      psychiatrist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      psychiatrist.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      psychiatrist.expertise.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || psychiatrist.status === statusFilter;

    return matchesSearch && matchesStatus;
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
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="h-2 w-2 mr-1 rounded-full bg-yellow-400"></span>
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <span className="ml-3 text-gray-600">Loading psychiatrists...</span>
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
            onClick={fetchPsychiatrists}
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
        <h2 className="text-2xl font-bold text-gray-800">All Psychiatrists</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search psychiatrists..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredPsychiatrists.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <User className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-600 font-medium">No psychiatrists found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filter"
              : "No psychiatrists have registered yet"}
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
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Expertise
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Registered On
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Certificate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPsychiatrists.map((psychiatrist) => (
                <tr key={psychiatrist._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-sky-250 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-sky-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {psychiatrist.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {psychiatrist.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {psychiatrist.expertise}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(psychiatrist.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(psychiatrist.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {psychiatrist.certificateUrl && (
                      <a
                        href={psychiatrist.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 hover:text-sky-900 flex items-center"
                      >
                        View <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
