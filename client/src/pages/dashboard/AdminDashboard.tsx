import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Users,
  Settings,
  Loader2,
  Brain,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Flag,
  FileText,
  UserCheck,
} from "lucide-react";
import { motion } from "framer-motion";

import DashboardLayout from "@/components/DashboardLayout";
import AdminPsychiatristApprovals from "@/components/admin/AdminPsychiatristApprovals";
//import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminAllPatients from "@/components/admin/AdminAllPatients";
import AdminAllPsychiatrists from "@/components/admin/AdminAllPsychiatrists";
import AdminReports from "@/components/admin/AdminReports";
import AdminTests from "@/components/admin/AdminTests";
import AdminDashboardHome from "@/components/admin/AdminDashboardHome";

// Mock data for psychiatrists pending approval
const MOCK_PENDING_PSYCHIATRISTS = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@example.com",
    expertise: "Clinical Psychology",
    dateApplied: "2023-03-08T10:30:00Z",
    certificateUrl: "https://example.com/certificates/sarah-johnson.pdf",
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    email: "michael.chen@example.com",
    expertise: "Neuropsychology",
    dateApplied: "2023-03-07T14:15:00Z",
    certificateUrl: "https://example.com/certificates/michael-chen.pdf",
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@example.com",
    expertise: "Child Psychology",
    dateApplied: "2023-03-06T09:45:00Z",
    certificateUrl: "https://example.com/certificates/emily-rodriguez.pdf",
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState("home");

  const { user, logout, currentRole } = useAuth();
  useEffect(() => {
    // Debug logging
    console.log("AdminDashboard - Auth state:", {
      user,
      currentRole,
      hasToken: !!localStorage.getItem("token"),
    });

    // Check if user is logged in and has the correct role
    if (!user) {
      console.log("AdminDashboard - No user found, redirecting to login");
      navigate("/login");
      return;
    }

    if (currentRole !== "admin") {
      console.log(
        `AdminDashboard - User has role ${currentRole}, not admin, redirecting`
      );
      // Redirect to the appropriate dashboard based on role
      if (currentRole === "patient") {
        navigate("/patient/dashboard");
      } else if (currentRole === "psychiatrist") {
        navigate("/psychiatrist/dashboard");
      } else {
        navigate("/login");
      }
      return;
    }

    console.log(
      "AdminDashboard - User authenticated as admin, loading dashboard"
    );
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, navigate, currentRole]);

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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-250">
        <div className="text-center">
          <Brain className="h-12 w-12 text-sky-500 mx-auto animate-pulse" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">
            Loading admin dashboard...
          </h2>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: User, label: "Dashboard", id: "home" },
    { icon: CheckCircle, label: "Psychiatrist Approvals", id: "approvals" },
    { icon: User, label: "All Patients", id: "all-users" },
    { icon: UserCheck, label: "All Psychiatrists", id: "all-psychiatrists" },
    { icon: Flag, label: "Manage Reports", id: "reports" },
    { icon: FileText, label: "Manage Tests", id: "tests" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  const renderContent = () => {
    switch (activeNavItem) {
      case "home":
        return <AdminDashboardHome />;
      case "approvals":
        return <AdminPsychiatristApprovals />;
      case "all-users":
        return <AdminAllPatients />;
      case "all-psychiatrists":
        return <AdminAllPsychiatrists />;
      case "reports":
        return <AdminReports />;
      case "tests":
        return <AdminTests />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminDashboardHome />;
    }
  };

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Manage system and users"
      menuItems={menuItems}
      gradientFrom="sky"
      gradientTo="blue"
      hoverColor="sky"
      activeColor="sky"
      bgColor="sky"
      borderColor="sky"
      onNavItemClick={setActiveNavItem}
      activeNavItem={activeNavItem}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
