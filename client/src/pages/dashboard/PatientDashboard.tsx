//new
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Calendar,
  Clock,
  User,
  FileText,
  Settings,
  MessageSquare,
  BookOpen,
  Loader2,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
//yes it is imorting from the components/user folder ✅
import DashboardLayout from "@/components/DashboardLayout";
import UserDashboardHome from "@/components/user/UserDashboardHome";
import UserProfile from "@/components/user/UserProfile";
import UserAppointments from "@/components/user/UserAppointments";
import UserLearningPlan from "@/components/user/UserLearningPlan";
import UserSettings from "@/components/user/UserSettings";
import UserInitialTest from "@/components/user/UserInitialTest";
import UserReports from "@/components/user/UserReports";
import UserMessages from "@/components/user/UserMessages";
import UserSeeOnePsy from "@/components/user/UserSeeOnePsy";
import UserSeeAllPsy from "@/components/user/UserSeeAllPsy";

export default function PatientDashboard() {
  const { user, logout, currentRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState("home");
  const [selectedPsychiatristId, setSelectedPsychiatristId] = useState<
    string | null
  >(null);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate("/login");
      return;
    }

    // Handle role-based redirects for the default dashboard route
    if (currentRole !== "patient") {
      // Redirect to the appropriate dashboard based on role
      if (currentRole === "psychiatrist") {
        navigate("/psychiatrist/dashboard", { replace: true });
        return;
      } else if (currentRole === "admin") {
        navigate("/admin/dashboard", { replace: true });
        return;
      } else {
        // If no valid role, redirect to login
        navigate("/login");
        return;
      }
    }

    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, navigate, currentRole]);

  // Add a new useEffect to handle URL parameters
  useEffect(() => {
    // Parse URL parameters to set active tab
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get("tab");

    if (tabParam) {
      // Map URL parameter to the corresponding navigation item
      switch (tabParam) {
        case "appointments":
          setActiveNavItem("appointments");
          break;
        case "psychiatrists":
          setActiveNavItem("userSeeAllPsy");
          break;
        case "messages":
          setActiveNavItem("messages");
          break;
        case "learning-plan":
          setActiveNavItem("learning-plan");
          break;
        case "initial-test":
          setActiveNavItem("initial-test");
          break;
        case "reports":
          setActiveNavItem("reports");
          break;
        case "settings":
          setActiveNavItem("settings");
          break;
        case "home":
        default:
          setActiveNavItem("home");
          break;
      }
    }
  }, []);

  // Add a new useEffect to handle the navItemClick event
  useEffect(() => {
    const handleNavItemClick = (event: CustomEvent) => {
      const { navItem } = event.detail;
      setActiveNavItem(navItem);
    };

    // Add event listener
    window.addEventListener(
      "navItemClick",
      handleNavItemClick as EventListener
    );

    return () => {
      // Remove event listener
      window.removeEventListener(
        "navItemClick",
        handleNavItemClick as EventListener
      );
    };
  }, []);

  // Add event listener for psychiatrist selection
  const handlePsychiatristSelected = (event: CustomEvent) => {
    const { psychiatristId } = event.detail;
    setSelectedPsychiatristId(psychiatristId);
    setActiveNavItem("userSeeOnePsy");
  };

  // Add event listener for going back to psychiatrist list
  const handleGoToPsychiatristList = () => {
    setActiveNavItem("userSeeAllPsy");
    navigate(`/patient/dashboard?tab=psychiatrists`, { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Add a new useEffect for event listeners
  useEffect(() => {
    // Handler for appointment booking completion
    const handleAppointmentBooked = () => {
      setActiveNavItem("appointments");
    };

    // Add event listeners
    window.addEventListener(
      "psychiatristSelected",
      handlePsychiatristSelected as EventListener
    );
    window.addEventListener(
      "goToPsychiatristList",
      handleGoToPsychiatristList as EventListener
    );
    window.addEventListener(
      "appointmentBooked",
      handleAppointmentBooked as EventListener
    );

    return () => {
      // Remove event listeners
      window.removeEventListener(
        "psychiatristSelected",
        handlePsychiatristSelected as EventListener
      );
      window.removeEventListener(
        "goToPsychiatristList",
        handleGoToPsychiatristList as EventListener
      );
      window.removeEventListener(
        "appointmentBooked",
        handleAppointmentBooked as EventListener
      );
    };
  }, []);

  // Add the handleNavItemClick function that was removed
  const handleNavItemClick = (navItem: string) => {
    setActiveNavItem(navItem);

    // Map navigation items to URL parameters and routes
    let tabParam: string;

    switch (navItem) {
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
      case "messages":
        tabParam = "messages";
        break;
      case "settings":
        tabParam = "settings";
        break;
      case "home":
      default:
        tabParam = "home";
        break;
    }

    // Update URL without reloading the page
    navigate(`/patient/dashboard?tab=${tabParam}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 via-white to-sky-400">
        <div className="text-center">
          <Brain className="h-12 w-12 text-sky-500 mx-auto animate-pulse" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">
            Loading your dashboard...
          </h2>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: User, label: "Home", id: "home" },
    { icon: Brain, label: "Initial Test", id: "initial-test" },
    { icon: Calendar, label: "Appointments", id: "appointments" },
    { icon: Users, label: "All PSY", id: "userSeeAllPsy" },
    { icon: MessageSquare, label: "Messages", id: "messages" },
    { icon: BookOpen, label: "Learning Plan", id: "learning-plan" },
    { icon: FileText, label: "Reports", id: "reports" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  const renderContent = () => {
    switch (activeNavItem) {
      case "home":
        return <UserDashboardHome />;
      case "profile":
        return <UserProfile />;
      case "appointments":
        return <UserAppointments />;
      case "userSeeOnePsy":
        return <UserSeeOnePsy psychiatristId={selectedPsychiatristId} />;
      case "learning-plan":
        return <UserLearningPlan />;
      case "initial-test":
        return <UserInitialTest />;
      case "reports":
        return <UserReports />;
      case "userSeeAllPsy":
        return <UserSeeAllPsy />;
      case "messages":
        return <UserMessages />;
      case "settings":
        return <UserSettings />;
      default:
        return <UserDashboardHome />;
    }
  };

  return (
    <DashboardLayout
      title="Patient Dashboard"
      subtitle="Manage your health journey"
      menuItems={menuItems}
      gradientFrom="sky"
      gradientTo="blue"
      hoverColor="sky"
      activeColor="sky"
      bgColor="sky"
      borderColor="sky"
      onNavItemClick={handleNavItemClick}
      activeNavItem={activeNavItem}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
