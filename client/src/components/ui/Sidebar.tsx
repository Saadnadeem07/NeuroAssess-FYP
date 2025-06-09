import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  id: string;
}

interface SidebarProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
  menuItems: MenuItem[];
  activeNavItem: string;
  onNavItemClick: (id: string) => void;
  gradientFrom: string;
  gradientTo: string;
}

export default function Sidebar({
  isOpen,
  title,
  subtitle,
  menuItems,
  activeNavItem,
  onNavItemClick,
  gradientFrom,
  gradientTo,
}: SidebarProps) {
  // Helper function to get gradient classes based on props
  const getGradientClasses = () => {
    if (gradientFrom === "sky" && gradientTo === "blue") {
      return "bg-gradient-to-r from-sky-500 to-blue-500";
    } else if (gradientFrom === "indigo" && gradientTo === "purple") {
      return "bg-gradient-to-r from-indigo-500 to-purple-500";
    } else if (gradientFrom === "blue" && gradientTo === "indigo") {
      return "bg-gradient-to-r from-blue-500 to-indigo-500";
    } else {
      return "bg-gradient-to-r from-sky-500 to-blue-500"; // Default
    }
  };

  // Helper function to get active button classes
  const getActiveButtonClasses = (isActive: boolean) => {
    if (isActive) {
      return "bg-gradient-to-r from-sky-100 to-blue-100 text-sky-600 font-medium shadow-md";
    } else {
      return "hover:bg-sky-50 text-gray-700 hover:text-sky-600 hover:shadow-sm";
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-white h-full shadow-xl overflow-hidden border-r border-sky-100 relative"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-transparent rounded-full -ml-12 -mb-12 opacity-50" />

          <div
            className={
              getGradientClasses() + " p-8 text-white relative overflow-hidden"
            }
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg
                className="w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>

            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold relative"
            >
              {title}
            </motion.h2>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sky-100 text-sm mt-2 relative"
            >
              {subtitle}
            </motion.p>
          </div>

          <div className="p-4 overflow-y-auto h-[calc(100%-8rem)] relative">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <motion.li
                  key={item.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <button
                    onClick={() => onNavItemClick(item.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl 
                      ${getActiveButtonClasses(
                        activeNavItem === item.id
                      )} transition-all duration-200 ease-in-out`}
                  >
                    <span className="bg-white p-2 rounded-lg shadow-sm">
                      <item.icon
                        className={`h-5 w-5 ${
                          activeNavItem === item.id
                            ? "text-sky-600"
                            : "text-gray-500"
                        }`}
                      />
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
