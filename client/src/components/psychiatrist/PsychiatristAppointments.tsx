import { Calendar, Clock, Settings, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

interface Appointment {
  _id: string;
  patientName: string;
  date: string;
  timeSlot: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}

export default function PsychiatristAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAvailability, setHasAvailability] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if the psychiatrist has set their availability
    if (
      user &&
      user.availability &&
      user.availability.startTime &&
      user.availability.endTime
    ) {
      setHasAvailability(true);
    }

    // Fetch appointments
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/appointments/psychiatrist");

      if (response.data.success) {
        setAppointments(response.data.data);
        setError(null);
      } else {
        setError("Failed to fetch appointments");
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error);

      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        setError("Authentication error. Please log in again.");
      } else if (error.response && error.response.status === 403) {
        setError("You don't have permission to access this resource.");
      } else {
        setError("An error occurred while fetching your appointments");
      }
    } finally {
      setLoading(false);
    }
  };

  // Format time for display (convert 24h to 12h format)
  const formatTimeForDisplay = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    // Parse the date string
    const date = new Date(dateString);
    
    // Use UTC date functions to get the correct date components
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const weekday = date.getUTCDay();
    
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

  // Navigate to settings page with availability tab active
  const goToAvailabilitySettings = () => {
    navigate("/psychiatrist/dashboard?tab=settings&section=availability");
  };

  // Cancel an appointment
  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      const response = await api.put(`/appointments/cancel/${appointmentId}`);

      if (response.data.success) {
        // Update the appointment in the state
        setAppointments(
          appointments.map((appointment) =>
            appointment._id === appointmentId
              ? { ...appointment, status: "cancelled" }
              : appointment
          )
        );
      } else {
        alert(response.data.message || "Failed to cancel appointment");
      }
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      alert(
        error.response?.data?.message ||
          "An error occurred while cancelling the appointment"
      );
    }
  };

  // Get upcoming and past appointments
  const upcomingAppointments = appointments.filter((appointment) => {
    // Convert appointment date string to date object with proper UTC handling
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    
    // Compare dates - make sure to just compare the date part, not time
    const appointmentDay = new Date(
      Date.UTC(
        appointmentDate.getUTCFullYear(),
        appointmentDate.getUTCMonth(),
        appointmentDate.getUTCDate()
      )
    );
    
    const today = new Date(
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
    );
    
    return appointmentDay >= today && appointment.status !== "cancelled";
  });

  const pastAppointments = appointments.filter((appointment) => {
    // Convert appointment date string to date object with proper UTC handling
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    
    // Compare dates - make sure to just compare the date part, not time
    const appointmentDay = new Date(
      Date.UTC(
        appointmentDate.getUTCFullYear(),
        appointmentDate.getUTCMonth(),
        appointmentDate.getUTCDate()
      )
    );
    
    const today = new Date(
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
    );
    
    return appointmentDay < today || appointment.status === "cancelled";
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Appointment Management
      </h1>

      {/* Availability Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Your Availability
          </h2>
          <button
            onClick={goToAvailabilitySettings}
            className="text-sky-600 hover:text-sky-700 flex items-center"
          >
            <Settings className="h-4 w-4 mr-1" />
            <span>Manage</span>
          </button>
        </div>

        {hasAvailability ? (
          <div>
            <div className="flex items-center text-gray-700 mb-2">
              <Clock className="h-5 w-5 text-sky-500 mr-2" />
              <span className="font-medium">Working Hours:</span>
              <span className="ml-2">
                {formatTimeForDisplay(user?.availability?.startTime)} -{" "}
                {formatTimeForDisplay(user?.availability?.endTime)}
              </span>
            </div>
            <div className="flex items-center text-gray-700 mb-2">
              <Calendar className="h-5 w-5 text-sky-500 mr-2" />
              <span className="font-medium">Working Days:</span>
              <span className="ml-2">
                {user?.availability?.workingDays?.join(", ") || "Not set"}
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Patients can book appointments during these hours in 30-minute
              slots.
            </p>
          </div>
        ) : (
          <div className="text-gray-600">
            <p className="mb-2">You haven't set your availability yet.</p>
            <button
              onClick={goToAvailabilitySettings}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              Set Availability
            </button>
          </div>
        )}
      </div>

      {/* Appointments Section */}
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div>
        )}

        {/* Upcoming Appointments */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Upcoming Appointments
          </h2>

          {upcomingAppointments.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-xl text-gray-500 text-center">
              <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p>No upcoming appointments scheduled</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingAppointments.map((appointment) => (
                <motion.div
                  key={appointment._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center">
                        <User className="h-4 w-4 mr-2 text-sky-500" />
                        {appointment.patientName}
                      </h3>
                      <div className="flex items-center text-gray-500 mt-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {formatDate(appointment.date)}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-500 mt-1">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="text-sm">{appointment.timeSlot}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelAppointment(appointment._id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Cancel Appointment"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Past Appointments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className={`bg-white p-5 rounded-xl shadow-sm border ${
                    appointment.status === "cancelled"
                      ? "border-red-100 bg-red-50"
                      : "border-gray-100"
                  }`}
                >
                  <div>
                    <h3 className="font-medium text-gray-900 flex items-center">
                      <User className="h-4 w-4 mr-2 text-sky-500" />
                      {appointment.patientName}
                    </h3>
                    <div className="flex items-center text-gray-500 mt-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {formatDate(appointment.date)}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500 mt-1">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm">{appointment.timeSlot}</span>
                    </div>
                    {appointment.status === "cancelled" && (
                      <div className="mt-2">
                        <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-1 rounded">
                          Cancelled
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
