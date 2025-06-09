import { Calendar, Clock, User, MapPin, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { motion } from "framer-motion";

interface Appointment {
  _id: string;
  psychiatristName: string;
  date: string;
  timeSlot: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}

export default function UserAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/appointments/patient");

      if (response.data.success) {
        setAppointments(response.data.data);
      } else {
        setError("Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("An error occurred while fetching your appointments");
    } finally {
      setLoading(false);
    }
  };

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
          "An error occurred while cancelling your appointment"
      );
    }
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
        Your Appointments
      </h1>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-6">
          {error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="bg-sky-50 p-6 rounded-2xl border border-sky-250">
          <div className="flex items-center justify-center flex-col gap-4 py-8">
            <Calendar className="h-12 w-12 text-sky-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              No Appointments Scheduled
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              You don't have any upcoming appointments. Schedule a session with
              a psychiatrist to get started.
            </p>
            <button
              onClick={() => navigate("/user/dashboard?tab=psychiatrists")}
              className="mt-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
            >
              Schedule Appointment
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Appointments */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Upcoming Appointments
            </h2>

            {upcomingAppointments.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
                No upcoming appointments
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <motion.div
                    key={appointment._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Dr. {appointment.psychiatristName}
                        </h3>
                        <div className="flex items-center text-gray-500 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {formatDate(appointment.date)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {appointment.timeSlot}
                          </span>
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
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Past Appointments
              </h2>
              <div className="space-y-4">
                {pastAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className={`bg-white p-4 rounded-xl shadow-sm border ${
                      appointment.status === "cancelled"
                        ? "border-red-100 bg-red-50"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Dr. {appointment.psychiatristName}
                        </h3>
                        <div className="flex items-center text-gray-500 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {formatDate(appointment.date)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {appointment.timeSlot}
                          </span>
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
