import { MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Star,
  Users,
  ArrowLeft,
  Check,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface TimeSlot {
  time: string;
  available: boolean;
}

// This will be replaced with dynamically generated slots based on psychiatrist availability
const defaultTimeSlots: TimeSlot[] = [
  { time: "02:00 PM", available: true },
  { time: "02:30 PM", available: true },
  { time: "03:00 PM", available: false },
  { time: "03:30 PM", available: true },
];

// Generate 7 days starting from today
const generateDays = (workingDays: string[] = []) => {
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const daysFull = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const result = [];

  // Map full day names to abbreviations for comparison
  const workingDaysAbbr = workingDays.map((day) => {
    const index = daysFull.findIndex((d) => d === day);
    return index !== -1 ? daysOfWeek[index] : day.substring(0, 3).toUpperCase();
  });

  // If no working days specified, show all days
  const showAllDays = workingDaysAbbr.length === 0;

  // Get current date and set to start of day for comparison using UTC
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );

  for (let i = 0; i < 14; i++) {
    // Look ahead 14 days to find enough working days
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + i);

    // Create a UTC date version of the current date
    const date = new Date(
      Date.UTC(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      )
    );

    // Skip dates in the past
    if (date < today) continue;

    // Get the day of week in UTC to avoid timezone shifts
    const dayAbbr = daysOfWeek[date.getUTCDay()];

    // Only include days that match the psychiatrist's working days
    if (showAllDays || workingDaysAbbr.includes(dayAbbr)) {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      result.push({
        day: dayAbbr,
        date: date.getUTCDate().toString(),
        month: monthNames[date.getUTCMonth()],
        fullDate: date.toISOString().split("T")[0], // Store full date in YYYY-MM-DD format
        selected: result.length === 0, // First available day is selected by default
      });

      // Once we have 7 days, stop
      if (result.length >= 7) break;
    }
  }

  return result;
};

interface Psychiatrist {
  _id: string;
  name: string;
  expertise: string;
  bio: string;
  specializations: string[];
  yearsOfExperience: number;
  rating?: number;
  patients?: number;
  location?: string;
  sessionPrice?: number;
  image?: string;
  availability?: {
    startTime: string;
    endTime: string;
    workingDays: string[];
  };
  degree?: string;
  degrees?: string;
}

// Mock psychiatrist data as fallback
const mockPsychiatrist: Psychiatrist = {
  _id: "1",
  name: "Dr. Richard James",
  expertise: "MBBS - General physician",
  bio: "Dr. James has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. With over 15 years of experience, he specializes in treating various mental health conditions including anxiety, depression, and PTSD.",
  specializations: [
    "Anxiety",
    "Depression",
    "PTSD",
    "Stress Management",
    "Cognitive Behavioral Therapy",
  ],
  yearsOfExperience: 15,
  rating: 4.9,
  patients: 2000,
  location: "New York City, NY",
  sessionPrice: 50,
  image:
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=2000",
  availability: {
    startTime: "09:00",
    endTime: "17:00",
    workingDays: ["MON", "TUE", "WED", "THU", "FRI"],
  },
  degree: "MBBS",
  degrees: "MBBS, MD in Psychiatry",
};

interface UserSeeOnePsyProps {
  psychiatristId: string | null;
}

export default function UserSeeOnePsy({ psychiatristId }: UserSeeOnePsyProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [days, setDays] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [psychiatrist, setPsychiatrist] = useState<Psychiatrist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(defaultTimeSlots);
  const [bookedSlots, setBookedSlots] = useState<{ [date: string]: string[] }>(
    {}
  );
  const [fetchingSlots, setFetchingSlots] = useState(false);

  useEffect(() => {
    if (psychiatristId) {
      fetchPsychiatristDetails(psychiatristId);
    } else {
      // If no psychiatristId is provided, use mock data
      setPsychiatrist(mockPsychiatrist);
      setUsingMockData(true);
      setLoading(false);
    }
  }, [psychiatristId]);

  useEffect(() => {
    if (psychiatrist && psychiatrist.availability) {
      // Generate available days based on psychiatrist's working days
      const availableDays = generateDays(
        psychiatrist.availability.workingDays || []
      );
      setDays(availableDays);

      // Set the first available day as selected
      if (availableDays.length > 0) {
        setSelectedDay(availableDays[0]);
      }
    } else if (psychiatrist) {
      // If no availability set, use default days
      const defaultDays = generateDays();
      setDays(defaultDays);
      setSelectedDay(defaultDays[0]);
    }
  }, [psychiatrist]);

  useEffect(() => {
    if (selectedDay && psychiatrist) {
      const dateKey = selectedDay.fullDate;

      // Only fetch if we don't already have this date's slots cached
      if (!bookedSlots[dateKey]) {
        fetchBookedSlots(psychiatrist._id, dateKey);
      } else {
        // If we already have the data, just regenerate the time slots
        if (psychiatrist.availability) {
          const slots = generateTimeSlots(
            psychiatrist.availability.startTime,
            psychiatrist.availability.endTime,
            dateKey
          );
          setTimeSlots(slots);
        }
      }
    }
  }, [selectedDay, psychiatrist]);

  const fetchPsychiatristDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      try {
        // Fetch psychiatrist details from the API
        const response = await api.get(`/users/psychiatrists/${id}`);
        setPsychiatrist(response.data.data);
        setUsingMockData(false);
      } catch (apiError) {
        console.warn("API call failed, using mock data instead:", apiError);
        // Fall back to mock data if API call fails
        setPsychiatrist(mockPsychiatrist);
        setUsingMockData(true);
      }
    } catch (err) {
      console.error("Error fetching psychiatrist details:", err);
      setError("Failed to load psychiatrist details");
      setPsychiatrist(mockPsychiatrist);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    // Dispatch a custom event to go back to the psychiatrist list
    const event = new CustomEvent("goToPsychiatristList");
    window.dispatchEvent(event);
  };

  // Handle booking appointment
  const handleBookAppointment = async () => {
    if (!psychiatrist || !selectedDay || !selectedTime || !user) {
      setBookingStatus("error");
      setBookingMessage("Please select a date and time slot");
      return;
    }

    try {
      // Create the appointment date properly to avoid timezone issues
      // Parse the fullDate from YYYY-MM-DD format and use UTC methods
      const dateParts = selectedDay.fullDate.split("-");
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed in JS Date
      const day = parseInt(dateParts[2]);

      // Create a date using UTC to guarantee the correct day regardless of timezone
      const appointmentDate = new Date(Date.UTC(year, month, day, 12, 0, 0));

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for date comparison

      // Create a comparison date using UTC methods
      const todayUTC = new Date(
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
      );

      // For comparison, get UTC date parts
      const appointmentDayUTC = new Date(Date.UTC(year, month, day, 0, 0, 0));

      if (appointmentDayUTC < todayUTC) {
        setBookingStatus("error");
        setBookingMessage("Cannot book appointments in the past");
        return;
      }

      // Check if the appointment time is in the past for today's appointments
      if (appointmentDayUTC.getTime() === todayUTC.getTime()) {
        // Parse the time from the time slot (e.g., "2:00 PM - 2:30 PM" -> "2:00 PM")
        const timeStart = selectedTime.split(" - ")[0];
        const [hourStr, minuteStr] = timeStart.split(":");
        let [hour, minute] = [
          parseInt(hourStr),
          parseInt(minuteStr.split(" ")[0]),
        ];
        const isPM = timeStart.includes("PM");

        // Convert to 24-hour format
        if (isPM && hour !== 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;

        // Create a date object with the appointment time using UTC
        const now = new Date();
        const appointmentDateTime = new Date(
          Date.UTC(year, month, day, hour, minute, 0, 0)
        );

        // Convert current time to UTC for proper comparison
        const nowUTC = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds()
          )
        );

        // Check if the appointment time is in the past
        if (appointmentDateTime < nowUTC) {
          setBookingStatus("error");
          setBookingMessage("Cannot book appointments in the past");
          return;
        }
      }

      setBookingStatus("loading");
      setBookingMessage("Booking your appointment...");

      // Format date for the backend using toISOString - it will now properly reflect the UTC date
      const response = await api.post("/appointments", {
        psychiatristId: psychiatrist._id,
        date: appointmentDate.toISOString(),
        timeSlot: selectedTime,
      });

      if (response.data.success) {
        setBookingStatus("success");
        setBookingMessage("Appointment booked successfully!");

        // Clear selections
        setSelectedTime(null);

        // Redirect to appointments page after a short delay
        setTimeout(() => {
          // Use the correct URL format for the patient dashboard with the appointments tab
          navigate("/patient/dashboard?tab=appointments", { replace: true });

          // Dispatch a custom event to notify the parent component to switch tabs
          const event = new CustomEvent("appointmentBooked");
          window.dispatchEvent(event);
        }, 2000);
      } else {
        setBookingStatus("error");
        setBookingMessage(
          response.data.message || "Failed to book appointment"
        );
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      setBookingStatus("error");
      setBookingMessage(
        error.response?.data?.message ||
          "An error occurred while booking your appointment"
      );
    }
  };

  // Function to fetch booked slots for a specific date
  const fetchBookedSlots = async (psychiatristId: string, date: string) => {
    try {
      setFetchingSlots(true);

      // The date string is already in YYYY-MM-DD format from the fullDate property
      // No need for additional formatting which might introduce timezone issues
      const formattedDate = date;

      const response = await api.get(
        `/appointments/booked-slots/${psychiatristId}?date=${formattedDate}`
      );

      if (response.data.success) {
        // Update the bookedSlots state with the new data
        setBookedSlots((prev) => ({
          ...prev,
          [date]: response.data.data || [],
        }));

        // Generate time slots with the new booked slots data
        if (psychiatrist && psychiatrist.availability) {
          const slots = generateTimeSlots(
            psychiatrist.availability.startTime,
            psychiatrist.availability.endTime,
            date
          );
          setTimeSlots(slots);
        }
      } else {
        console.error("Failed to fetch booked slots:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching booked slots:", error);
    } finally {
      setFetchingSlots(false);
    }
  };

  // Update the generateTimeSlots function to use the cached booked slots
  const generateTimeSlots = (
    startTime: string,
    endTime: string,
    date: string
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes >= endMinutes) {
      return defaultTimeSlots;
    }

    // Get the booked slots for this date
    const dateBookedSlots = bookedSlots[date] || [];

    for (let time = startMinutes; time < endMinutes; time += 30) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;

      // Calculate end time (start time + 30 minutes)
      const endTimeMinutes = time + 30;
      const endHour = Math.floor(endTimeMinutes / 60);
      const endMinute = endTimeMinutes % 60;

      // Format start time
      const formattedStartHour = hour % 12 || 12;
      const startPeriod = hour >= 12 ? "PM" : "AM";
      const formattedStartTime = `${formattedStartHour}:${minute
        .toString()
        .padStart(2, "0")} ${startPeriod}`;

      // Format end time
      const formattedEndHour = endHour % 12 || 12;
      const endPeriod = endHour >= 12 ? "PM" : "AM";
      const formattedEndTime = `${formattedEndHour}:${endMinute
        .toString()
        .padStart(2, "0")} ${endPeriod}`;

      // Combine into a time range
      const formattedTime = `${formattedStartTime} - ${formattedEndTime}`;

      // Check if this slot is already booked
      const isBooked = dateBookedSlots.includes(formattedTime);

      // Make all slots available by default, except those that are already booked
      const available = !isBooked;

      slots.push({
        time: formattedTime,
        available,
      });
    }

    return slots;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (error || !psychiatrist) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error || "Psychiatrist not found"}</p>
        <button
          onClick={handleBackClick}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Psychiatrist Booking Section */}
      <div>
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleBackClick}
          className="flex items-center text-gray-600 hover:text-sky-600 mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Psychiatrists
        </motion.button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl shadow-sky-250 overflow-hidden flex flex-col h-full"
          >
            <div className="p-8 flex-grow">
              <div className="flex items-center space-x-2 mb-6">
                <h1 className="text-3xl font-bold text-sky-700">
                  Dr. {psychiatrist.name}
                </h1>
                <Check className="h-6 w-6 text-sky-400" />
              </div>

              <div className="text-sky-600 text-xl font-medium mb-4">
                {psychiatrist.expertise}
                {psychiatrist.yearsOfExperience && (
                  <span className="ml-2">
                    • {psychiatrist.yearsOfExperience} years experience
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center">
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                    <span className="ml-1 font-semibold">
                      {psychiatrist.rating || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-sky-500" />
                    <span className="ml-1">
                      {psychiatrist.patients
                        ? `${psychiatrist.patients}+ Patients`
                        : "New Doctor"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-6 w-6 text-sky-500" />
                    <span className="ml-1">
                      {psychiatrist.location || "Available Online"}
                    </span>
                  </div>
                  {psychiatrist.availability && (
                    <div className="flex items-center">
                      <Clock className="h-6 w-6 text-sky-500" />
                      <span className="ml-1">
                        {psychiatrist.availability.startTime} -{" "}
                        {psychiatrist.availability.endTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed">
                  {psychiatrist.bio}
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {psychiatrist.expertise}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Degree & Qualifications
                </h2>
                <div className="flex flex-wrap gap-2">
                  {psychiatrist.degrees ? (
                    <span className="px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-sm font-medium">
                      {psychiatrist.degrees}
                    </span>
                  ) : psychiatrist.degree ? (
                    <span className="px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-sm font-medium">
                      {psychiatrist.degree}
                    </span>
                  ) : (
                    <span className="text-gray-600">
                      No degree information available
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Session Fee</h2>
                <div className="text-xl font-semibold text-sky-600 bg-sky-50 inline-block px-4 py-2 rounded-lg">
                  ${psychiatrist.sessionPrice || "N/A"}
                  <span className="text-sm font-normal ml-1">/session</span>
                </div>
              </div>

              {psychiatrist.availability &&
                psychiatrist.availability.workingDays && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Working Days</h2>
                    <div className="flex flex-wrap gap-2">
                      {psychiatrist.availability.workingDays.map((day) => (
                        <span
                          key={day}
                          className="px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-sm font-medium"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </motion.div>

          {/* Booking Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl shadow-sky-250 overflow-hidden flex flex-col h-full"
          >
            <div className="p-8 flex-grow">
              <h2 className="text-xl font-semibold mb-6">Book Appointment</h2>

              {/* Date Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-600 mb-3">
                  Select Date
                </h3>
                {days.length > 0 ? (
                  <div className="grid grid-cols-7 gap-2">
                    {days.map((day) => (
                      <button
                        key={day.day + day.date}
                        onClick={() => setSelectedDay(day)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                          day === selectedDay
                            ? "bg-sky-500 text-white"
                            : "hover:bg-sky-50"
                        }`}
                      >
                        <span className="text-xs">{day.day}</span>
                        <span className="text-sm font-semibold">
                          {day.date}
                        </span>
                        <span className="text-xs text-gray-500">
                          {day.month}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-amber-50 p-4 rounded-lg text-amber-800">
                    <p>
                      The psychiatrist has not set any working days yet. Please
                      check back later or contact them directly.
                    </p>
                  </div>
                )}
              </div>

              {/* Time Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-600 mb-3">
                  Available Slots
                </h3>
                {selectedDay ? (
                  <>
                    {fetchingSlots ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full mr-2"></div>
                        <span className="text-gray-500">
                          Checking availability...
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() =>
                              slot.available && setSelectedTime(slot.time)
                            }
                            disabled={!slot.available}
                            className={`p-2 text-xs md:text-sm rounded-xl transition-all ${
                              selectedTime === slot.time
                                ? "bg-sky-500 text-white"
                                : slot.available
                                ? "hover:bg-sky-50"
                                : "bg-gray-50 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {slot.time}
                            {!slot.available && (
                              <span className="block text-xs text-red-500 mt-1">
                                Booked
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-500">
                    <p>Please select an available date first.</p>
                  </div>
                )}
              </div>

              {/* Book Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBookAppointment}
                disabled={
                  !selectedDay || !selectedTime || bookingStatus === "loading"
                }
                className={`w-full py-4 rounded-xl font-medium shadow-lg flex items-center justify-center space-x-2 ${
                  !selectedDay || !selectedTime || bookingStatus === "loading"
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sky-250 hover:shadow-sky-300"
                }`}
              >
                {bookingStatus === "loading" ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-5 w-5" />
                    <span>Book Appointment</span>
                  </>
                )}
              </motion.button>

              {/* Booking Status Message */}
              {bookingMessage && (
                <div
                  className={`mt-4 p-3 rounded-lg text-center ${
                    bookingStatus === "success"
                      ? "bg-green-50 text-green-700"
                      : bookingStatus === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-sky-50 text-sky-700"
                  }`}
                >
                  {bookingMessage}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mock Data Notice */}
      {usingMockData && (
        <div className="text-center mt-8 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700">
            Note: Currently displaying mock data. Connect to the API for real
            data.
          </p>
        </div>
      )}
    </div>
  );
}
