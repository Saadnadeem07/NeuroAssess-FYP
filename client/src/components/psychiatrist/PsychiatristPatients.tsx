import { Users, User, Calendar, Mail, Search, Clock, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { motion } from "framer-motion";

interface Patient {
  _id: string;
  name: string;
  email: string;
  appointmentCount: number;
  lastAppointment: string;
  nextAppointment: string | null;
  status: string;
}

export default function PsychiatristPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Patient>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      try {
        const response = await api.get("/appointments/psychiatrist/patients");
        
        if (response.data.success) {
          setPatients(response.data.data);
        } else {
          setError("Failed to fetch patients");
        }
      } catch (error: any) {
        console.error("Error fetching patients:", error);
        
        // If the endpoint returns 404, show a proper message for the administrator
        if (error.response && error.response.status === 404) {
          setError(
            "The patient list API endpoint is not available. " +
            "Please make sure your backend server has been restarted after adding the new patients endpoint."
          );
        } else {
          setError("An error occurred while fetching your patients");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    
    // Parse the date string
    const date = new Date(dateString);
    
    // Use UTC date functions to get the correct date components
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    
    // Create a new Date object with the UTC components
    // Note: Month in JavaScript is 0-indexed
    const utcDate = new Date(Date.UTC(year, month, day));
    
    // Format the date, explicitly using UTC timezone
    return utcDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC" // Ensure date is interpreted in UTC
    });
  };

  // Handle sorting
  const handleSort = (field: keyof Patient) => {
    if (field === sortField) {
      // Toggle sort direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sorted and filtered patients
  const getSortedPatients = () => {
    return [...patients]
      .filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        
        // Convert dates to comparable values
        if (sortField === "lastAppointment" || sortField === "nextAppointment") {
          valA = valA ? new Date(valA as string).getTime() : 0;
          valB = valB ? new Date(valB as string).getTime() : 0;
        }
        
        if (valA === null) return sortDirection === "asc" ? 1 : -1;
        if (valB === null) return sortDirection === "asc" ? -1 : 1;
        
        if (typeof valA === "string" && typeof valB === "string") {
          return sortDirection === "asc" 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
        
        // For numbers or date timestamps
        return sortDirection === "asc" 
          ? (valA as number) - (valB as number) 
          : (valB as number) - (valA as number);
      });
  };

  // Get sorted and filtered patients
  const sortedPatients = getSortedPatients();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Patient Management
      </h1>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-6">
          {error}
        </div>
      )}

      {patients.length === 0 ? (
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <div className="flex items-center justify-center flex-col gap-4 py-8">
            <Users className="h-12 w-12 text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              No Patients Yet
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              You don't have any patients assigned to you yet. Patients will
              appear here once they book appointments with you.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* Search and filter bar */}
          <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search patients by name or email..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Patients list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        <span>Patient</span>
                        {sortField === "name" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("appointmentCount")}
                    >
                      <div className="flex items-center">
                        <span>Sessions</span>
                        {sortField === "appointmentCount" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("lastAppointment")}
                    >
                      <div className="flex items-center">
                        <span>Last Session</span>
                        {sortField === "lastAppointment" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("nextAppointment")}
                    >
                      <div className="flex items-center">
                        <span>Next Session</span>
                        {sortField === "nextAppointment" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        <span>Status</span>
                        {sortField === "status" && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedPatients.map((patient) => (
                    <motion.tr 
                      key={patient._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {patient.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.appointmentCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(patient.lastAppointment)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(patient.nextAppointment)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {patient.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
