import {
  Clock,
  MapPin,
  Phone,
  Star,
  Users,
  GraduationCap,
  Briefcase,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import api from "@/services/api";

// Define avatar URLs for male and female doctors
const MALE_AVATAR = "/assets/images/male.png";
const FEMALE_AVATAR = "/assets/images/female.jpg";
const DEFAULT_AVATAR = "/assets/images/male.png"; // Default to male avatar if gender is unknown

// Create a custom event for psychiatrist selection
export const selectPsychiatrist = (psychiatristId: string) => {
  const event = new CustomEvent("psychiatristSelected", {
    detail: { psychiatristId },
  });
  window.dispatchEvent(event);
};

interface Psychiatrist {
  id: number;
  name: string;
  expertise: string;
  yearsOfExperience: number;
  degrees: string;
  image: string;
  gender: string;
}

// We'll keep this as a fallback in case the API fails
const mockPsychiatrists: Psychiatrist[] = [
  {
    id: 1,
    name: "Dr. Sarah Mitchell",
    expertise: "Clinical Psychiatry",
    yearsOfExperience: 15,
    degrees: "MD, PhD in Psychiatry",
    image: FEMALE_AVATAR,
    gender: "female",
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    expertise: "Child Psychiatry",
    yearsOfExperience: 12,
    degrees: "MD, Fellowship in Child Psychiatry",
    image: MALE_AVATAR,
    gender: "male",
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    expertise: "Addiction Psychiatry",
    yearsOfExperience: 10,
    degrees: "MD, Specialization in Addiction Treatment",
    image: FEMALE_AVATAR,
    gender: "female",
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    expertise: "Geriatric Psychiatry",
    yearsOfExperience: 18,
    degrees: "MD, Fellowship in Geriatric Psychiatry",
    image: MALE_AVATAR,
    gender: "male",
  },
];

export default function UserSeeAllPsy() {
  const [psychiatrists, setPsychiatrists] = useState<Psychiatrist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    fetchApprovedPsychiatrists();
  }, []);

  const fetchApprovedPsychiatrists = async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        // Fetch approved psychiatrists from the API
        const response = await api.get("/users/psychiatrists/approved");

        // Transform the data to match our interface
        const formattedData = response.data.data.map((psy: any) => {
          // Determine gender based on name or provided gender field
          // This is a simple heuristic and not always accurate
          const gender = psy.gender || determineGenderFromName(psy.name);
          const avatarImage = gender === "female" ? FEMALE_AVATAR : MALE_AVATAR;

          return {
            id: psy._id,
            name: psy.name,
            expertise: psy.expertise || "General Psychiatry",
            yearsOfExperience: psy.yearsOfExperience || 0,
            degrees: psy.degrees || "MD",
            image: avatarImage,
            gender: gender,
          };
        });

        setPsychiatrists(formattedData);
        setUsingMockData(false);
      } catch (apiError) {
        console.warn("API call failed, using mock data instead:", apiError);
        // Fall back to mock data if API call fails
        setPsychiatrists(mockPsychiatrists);
        setUsingMockData(true);
      }
    } catch (err) {
      console.error("Error fetching psychiatrists:", err);
      setError("Failed to load psychiatrists");
      setPsychiatrists(mockPsychiatrists);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to guess gender from name (not always accurate)
  const determineGenderFromName = (name: string): string => {
    // Extract first name (assuming format "Dr. FirstName LastName")
    const firstName = name.split(" ")[1]?.toLowerCase();

    // Common female name endings (very simplified)
    const femaleEndings = ["a", "e", "i", "y"];

    // List of common female names that don't follow the pattern
    const femaleNames = [
      "sarah",
      "emily",
      "jennifer",
      "karen",
      "susan",
      "mary",
      "elizabeth",
      "jessica",
    ];

    // List of common male names for reference
    const maleNames = [
      "john",
      "michael",
      "david",
      "james",
      "robert",
      "william",
      "joseph",
      "thomas",
    ];

    if (!firstName) return "unknown";

    if (femaleNames.includes(firstName)) return "female";
    if (maleNames.includes(firstName)) return "male";

    // Check name endings (this is a very simplified approach)
    if (femaleEndings.includes(firstName.charAt(firstName.length - 1))) {
      return "female";
    }

    // Default to male if we can't determine
    return "male";
  };

  const handlePsychiatristClick = (psychiatristId: number) => {
    // Dispatch the custom event with the psychiatrist ID
    selectPsychiatrist(psychiatristId.toString());
  };

  const animations = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-250 pt-20">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />

      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="bg-sky-250 text-sky-600 px-4 py-2 rounded-full text-sm font-medium">
            Expert Care Providers
          </span>
          <h1 className="mt-6 text-4xl md:text-5xl font-bold text-gray-900">
            Meet Our{" "}
            <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
              Psychiatrists
            </span>
          </h1>
          <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
            Our team of experienced psychiatrists is here to provide you with
            the highest quality mental health care and support.
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchApprovedPsychiatrists}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Psychiatrists Grid */}
        {!loading && !error && (
          <motion.div
            variants={animations.container}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {psychiatrists.map((psychiatrist) => (
              <motion.div
                key={psychiatrist.id}
                variants={animations.item}
                className="bg-white rounded-3xl shadow-xl shadow-sky-250 overflow-hidden hover:shadow-2xl hover:shadow-sky-300 transition-all duration-300 cursor-pointer"
                onClick={() => handlePsychiatristClick(psychiatrist.id)}
              >
                {/* Image Section */}
                <div className="relative h-64">
                  <img
                    src={psychiatrist.image}
                    alt={psychiatrist.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <h3 className="text-white text-xl font-bold">
                      {psychiatrist.name}
                    </h3>
                    <p className="text-sky-250">{psychiatrist.expertise}</p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-5 w-5 text-sky-500" />
                      <span className="font-medium text-gray-800">
                        {psychiatrist.degrees}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-sky-500" />
                      <span className="text-gray-700">
                        {psychiatrist.yearsOfExperience}+ Years of Experience
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-5 w-5 text-sky-500" />
                      <span className="text-gray-700">
                        Expertise: {psychiatrist.expertise}
                      </span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-sky-250 hover:shadow-sky-300 flex items-center justify-center space-x-2"
                    onClick={() =>
                      selectPsychiatrist(psychiatrist.id.toString())
                    }
                  >
                    <Calendar className="h-5 w-5" />
                    <span>Book Appointment</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No Psychiatrists Found */}
        {!loading && !error && psychiatrists.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600 mb-4">No psychiatrists found.</p>
          </div>
        )}

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
    </div>
  );
}
