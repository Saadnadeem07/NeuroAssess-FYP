import { useState } from "react";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import TopNavbar from "./ui/TopNavbar";
import Sidebar from "./ui/Sidebar";

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  id: string;
}

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  menuItems: MenuItem[];
  children: ReactNode;
  gradientFrom: string;
  gradientTo: string;
  hoverColor: string;
  activeColor: string;
  bgColor: string;
  borderColor: string;
  onNavItemClick: (id: string) => void;
  activeNavItem: string;
}

export default function DashboardLayout({
  title,
  subtitle,
  menuItems,
  children,
  gradientFrom,
  gradientTo,
  hoverColor,
  activeColor,
  bgColor,
  borderColor,
  onNavItemClick,
  activeNavItem,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 to-sky-500">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />

      {/* Navigation */}
      <TopNavbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Dashboard Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          title={title}
          subtitle={subtitle}
          menuItems={menuItems}
          activeNavItem={activeNavItem}
          onNavItemClick={onNavItemClick}
          gradientFrom={gradientFrom}
          gradientTo={gradientTo}
        />

        {/* Main Content - Added padding to the left side for spacing from sidebar */}
        <motion.div
          layout
          className="flex-1 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-white rounded-none min-h-full pl-6">
            <div className="py-6 pr-6">{children}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
