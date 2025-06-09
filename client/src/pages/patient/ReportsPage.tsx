import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import UserReports from "@/components/user/UserReports";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Brain,
  Calendar,
  FileText,
  Settings,
  MessageSquare,
  BookOpen,
  User,
} from "lucide-react";

export default function ReportsPage() {
  const { user, currentRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user is a patient
    if (currentRole !== "patient") {
      navigate("/dashboard");
      return;
    }
  }, [user, currentRole, navigate]);

  const menuItems = [
    { icon: User, label: "Home", id: "home" },
    { icon: Brain, label: "Initial Test", id: "initial-test" },
    { icon: Calendar, label: "Appointments", id: "appointments" },
    { icon: MessageSquare, label: "All PSY", id: "userSeeAllPsy" },
    { icon: BookOpen, label: "Learning Plan", id: "learning-plan" },
    { icon: FileText, label: "Reports", id: "reports" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  const handleNavItemClick = (navItem: string) => {
    switch (navItem) {
      case "home":
        navigate("/patient/dashboard?tab=home");
        break;
      case "initial-test":
        navigate("/patient/initial-test");
        break;
      case "appointments":
        navigate("/patient/dashboard?tab=appointments");
        break;
      case "userSeeAllPsy":
        navigate("/patient/dashboard?tab=psychiatrists");
        break;
      case "learning-plan":
        navigate("/patient/learning-plan");
        break;
      case "reports":
        navigate("/patient/reports");
        break;
      case "settings":
        navigate("/patient/dashboard?tab=settings");
        break;
      default:
        navigate("/patient/dashboard");
        break;
    }
  };

  return (
    <DashboardLayout
      title="Reports"
      subtitle="View your test results and progress"
      menuItems={menuItems}
      activeNavItem="reports"
      onNavItemClick={handleNavItemClick}
      gradientFrom="sky"
      gradientTo="indigo"
      hoverColor="sky-100"
      activeColor="sky-200"
      bgColor="white"
      borderColor="sky-200"
    >
      <UserReports />
    </DashboardLayout>
  );
}
