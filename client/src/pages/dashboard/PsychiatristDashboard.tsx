// i think this is fully implemented here only /-_-\
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Calendar,
  Clock,
  User,
  FileText,
  Settings,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingScreen from "@/components/ui/LoadingScreen";
import PendingApprovalScreen from "@/components/psychiatrist/PendingApprovalScreen";

import PsychiatristAppointments from "@/components/psychiatrist/PsychiatristAppointments";
import PsychiatristDashboardHome from "@/components/psychiatrist/PsychiatristDashboardHome";
import PsychiatristMessages from "@/components/psychiatrist/PsychiatristMessages";
import PsychiatristPatients from "@/components/psychiatrist/PsychiatristPatients";
import PsychiatristReports from "@/components/psychiatrist/PsychiatristReports";
import PsychiatristSettings from "@/components/psychiatrist/PsychiatristSettings";

export default function PsychiatristDashboard() {
  const { user, logout, currentRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState("home");
  const [activeSettingsSection, setActiveSettingsSection] = useState<
    "profile" | "password" | "availability"
  >("profile");
  const [approvalStatus, setApprovalStatus] = useState<
    "approved" | "pending" | "rejected"
  >("pending");

  useEffect(() => {
    // Check if user is logged in and has the correct role
    if (!user) {
      console.log("No user found, redirecting to login");
      navigate("/login");
      return;
    }

    if (currentRole !== "psychiatrist") {
      console.log(
        `User has role ${currentRole}, not psychiatrist, redirecting`
      );
      // Redirect to the appropriate dashboard based on role
      if (currentRole === "patient") {
        navigate("/patient/dashboard");
      } else if (currentRole === "admin") {
        navigate("/admin/dashboard");
      } else {
        // If role is invalid or not set, redirect to login
        localStorage.removeItem("currentRole"); // Clear invalid role
        localStorage.removeItem("token"); // Also clear token
        navigate("/login");
      }
      return;
    }

    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting to login");
      navigate("/login");
      return;
    }

    // Simulate loading data and checking approval status
    const timer = setTimeout(() => {
      // In a real app, this would come from the user object or an API call
      if (user && typeof user.isApproved !== "undefined") {
        setApprovalStatus(user.isApproved ? "approved" : "pending");
      } else {
        console.warn("User object doesn't contain isApproved property");
        // Default to pending if we can't determine approval status
        setApprovalStatus("pending");
      }
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, navigate, currentRole]);

  useEffect(() => {
    // Parse URL parameters to set active tab and section
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    const sectionParam = searchParams.get("section");

    if (
      tabParam &&
      [
        "home",
        "appointments",
        "messages",
        "patients",
        "reports",
        "settings",
      ].includes(tabParam)
    ) {
      setActiveNavItem(tabParam);
    }

    if (
      sectionParam &&
      ["profile", "password", "availability"].includes(sectionParam)
    ) {
      setActiveSettingsSection(
        sectionParam as "profile" | "password" | "availability"
      );
    }
  }, [location]);

  // Add a new useEffect to handle the navItemClick event
  useEffect(() => {
    const handleNavItemClick = (event: CustomEvent) => {
      const { navItem } = event.detail;
      setActiveNavItem(navItem);

      // Reset settings section when navigating away from settings
      if (navItem !== "settings") {
        setActiveSettingsSection("profile");
      }
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavItemClick = (navItem: string) => {
    setActiveNavItem(navItem);
    // Reset settings section when navigating away from settings
    if (navItem !== "settings") {
      setActiveSettingsSection("profile");
    }
    // Update URL without reloading the page
    navigate(`/psychiatrist/dashboard?tab=${navItem}`, { replace: true });
  };

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  // If psychiatrist is not approved yet, show pending approval screen
  if (approvalStatus === "pending") {
    return <PendingApprovalScreen />;
  }

  const menuItems = [
    { icon: User, label: "Dashboard", id: "home" },
    { icon: Calendar, label: "Appointments", id: "appointments" },
    { icon: FileText, label: "Messages", id: "messages" },
    { icon: Users, label: "Patients", id: "patients" },
    { icon: FileText, label: "Reports", id: "reports" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  const renderContent = () => {
    switch (activeNavItem) {
      case "home":
        return <PsychiatristDashboardHome />;
      case "appointments":
        return <PsychiatristAppointments />;
      case "messages":
        return <PsychiatristMessages />;
      case "patients":
        return <PsychiatristPatients />;
      case "reports":
        return <PsychiatristReports />;
      case "settings":
        return (
          <PsychiatristSettings
            activeSection={activeSettingsSection}
            onSectionChange={setActiveSettingsSection}
          />
        );
      default:
        return <PsychiatristDashboardHome />;
    }
  };

  return (
    <DashboardLayout
      title="Psychiatrist Dashboard"
      subtitle="Manage your patients and appointments"
      menuItems={menuItems}
      gradientFrom="sky"
      gradientTo="blue"
      hoverColor="sky"
      activeColor="sky"
      bgColor="white"
      borderColor="sky"
      onNavItemClick={handleNavItemClick}
      activeNavItem={activeNavItem}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
