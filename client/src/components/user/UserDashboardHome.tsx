import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Calendar,
  Clock,
  User,
  FileText,
  Settings,
  MessageSquare,
  BookOpen,
} from "lucide-react";

export default function UserDashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  // Define the cards based on sidebar menu items
  const cards = [
    {
      icon: Brain,
      title: "Initial Test",
      description: "Take your initial assessment test",
      color: "bg-blue-500",
      textColor: "text-blue-500",
      bgColor: "bg-blue-100",
      id: "initial-test",
    },
    {
      icon: Calendar,
      title: "Appointments",
      description: "Manage your appointments with psychiatrists",
      color: "bg-green-500",
      textColor: "text-green-500",
      bgColor: "bg-green-100",
      id: "appointments",
    },
    {
      icon: MessageSquare,
      title: "All Psychiatrists",
      description: "View and connect with psychiatrists",
      color: "bg-purple-500",
      textColor: "text-purple-500",
      bgColor: "bg-purple-100",
      id: "userSeeAllPsy",
    },
    {
      icon: BookOpen,
      title: "Learning Plan",
      description: "Access your personalized learning plan",
      color: "bg-amber-500",
      textColor: "text-amber-500",
      bgColor: "bg-amber-100",
      id: "learning-plan",
    },
    {
      icon: FileText,
      title: "Reports",
      description: "View your assessment reports and progress",
      color: "bg-rose-500",
      textColor: "text-rose-500",
      bgColor: "bg-rose-100",
      id: "reports",
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Manage your account settings",
      color: "bg-gray-500",
      textColor: "text-gray-500",
      bgColor: "bg-gray-100",
      id: "settings",
    },
  ];

  // Function to handle card click
  const handleCardClick = (id: string) => {
    // Create a custom event to notify the parent component
    const event = new CustomEvent("navItemClick", {
      detail: { navItem: id },
    });
    window.dispatchEvent(event);

    // Update URL without reloading the page
    let tabParam: string;
    switch (id) {
      case "initial-test":
        tabParam = "initial-test";
        break;
      case "learning-plan":
        tabParam = "learning-plan";
        break;
      case "reports":
        tabParam = "reports";
        break;
      case "appointments":
        tabParam = "appointments";
        break;
      case "userSeeAllPsy":
        tabParam = "psychiatrists";
        break;
      case "settings":
        tabParam = "settings";
        break;
      default:
        tabParam = "home";
        break;
    }
    navigate(`/patient/dashboard?tab=${tabParam}`, { replace: true });
  };

  return (
    <div>
      {/* Dashboard Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Access all your mental health resources from one place
        </p>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleCardClick(card.id)}
          >
            <div className={card.color}></div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${card.bgColor}`}
                >
                  <card.icon className={`h-6 w-6 ${card.textColor}`} />
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900">
                  {card.title}
                </h3>
              </div>
              <p className="text-gray-600">{card.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8 bg-gradient-to-r from-sky-500 to-blue-600 p-6 rounded-xl shadow-lg text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Let's Start</h2>
            <p className="mt-2 text-sky-100"></p>
          </div>
          <button
            className="mt-4 md:mt-0 px-6 py-3 bg-white text-sky-600 rounded-xl font-medium hover:bg-sky-50 transition-colors"
            onClick={() => handleCardClick("initial-test")}
          >
            Take New Assessment
          </button>
        </div>
      </motion.div>
    </div>
  );
}
