import { useState, useEffect } from "react";
import { Menu, BrainCircuit, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("home");

  // Function to handle smooth scrolling
  const scrollToSection = (sectionId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }

    // Only scroll if we're on the landing page
    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        window.scrollTo({
          top: element.offsetTop - 80, // Offset for the fixed header
          behavior: "smooth",
        });
        setActiveSection(sectionId);
      }
    }

    // Close mobile menu after clicking
    setIsMobileMenuOpen(false);
  };

  // Update active section based on scroll position
  useEffect(() => {
    if (location.pathname !== "/") return;

    const handleScroll = () => {
      const sections = ["home", "about", "services", "faq", "contact"];

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const menuItems = [
    { name: "Home", path: "/#home", section: "home" },
    { name: "About Us", path: "/#about", section: "about" },
    { name: "Services", path: "/#services", section: "services" },
    { name: "FAQ", path: "/#faq", section: "faq" },
    { name: "Contact", path: "/#contact", section: "contact" },
    { name: "Get Started", path: "/register", isButton: true },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed w-full z-50 bg-white/80 backdrop-blur-lg shadow-sm"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/">
            <motion.div
              className="text-sky-600 text-2xl font-bold flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BrainCircuit className="h-10 w-10 text-sky-500 fill-sky-500" />
              Neuro
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                Assess
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {menuItems
              .filter((item) => !item.isButton)
              .map((item) => (
                <motion.div key={item.name}>
                  {item.section ? (
                    <a
                      href={item.path}
                      onClick={(e) => scrollToSection(item.section, e)}
                      className={`text-gray-600 hover:text-sky-600 font-medium transition-colors relative group py-2 ${
                        activeSection === item.section ? "text-sky-600" : ""
                      }`}
                    >
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {item.name}
                        <span
                          className={`absolute bottom-0 left-0 w-full h-0.5 bg-sky-500 ${
                            activeSection === item.section
                              ? "scale-x-100"
                              : "scale-x-0 group-hover:scale-x-100"
                          } transition-transform origin-left`}
                        />
                      </motion.span>
                    </a>
                  ) : (
                    <Link to={item.path}>
                      <motion.span
                        className={`text-gray-600 hover:text-sky-600 font-medium transition-colors relative group py-2 ${
                          location.pathname === item.path ? "text-sky-600" : ""
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {item.name}
                        <span
                          className={`absolute bottom-0 left-0 w-full h-0.5 bg-sky-500 ${
                            location.pathname === item.path
                              ? "scale-x-100"
                              : "scale-x-0 group-hover:scale-x-100"
                          } transition-transform origin-left`}
                        />
                      </motion.span>
                    </Link>
                  )}
                </motion.div>
              ))}
          </div>

          <Link to="/register">
            <motion.button
              className="hidden md:flex bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-2.5 rounded-full font-medium shadow-lg shadow-sky-250 hover:shadow-sky-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600 hover:text-sky-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden bg-white mt-4"
            >
              <div className="py-4 space-y-4">
                {menuItems.map((item) => (
                  <div key={item.name} className="block">
                    {!item.isButton ? (
                      item.section ? (
                        <a
                          href={item.path}
                          onClick={(e) => scrollToSection(item.section, e)}
                          className="block"
                        >
                          <motion.span
                            className={`block text-gray-600 hover:text-sky-600 transition-colors py-2 px-4 rounded-lg hover:bg-sky-50 ${
                              activeSection === item.section
                                ? "text-sky-600 bg-sky-50"
                                : ""
                            }`}
                            whileHover={{ x: 8 }}
                          >
                            {item.name}
                          </motion.span>
                        </a>
                      ) : (
                        <Link
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <motion.span
                            className={`block text-gray-600 hover:text-sky-600 transition-colors py-2 px-4 rounded-lg hover:bg-sky-50 ${
                              location.pathname === item.path
                                ? "text-sky-600 bg-sky-50"
                                : ""
                            }`}
                            whileHover={{ x: 8 }}
                          >
                            {item.name}
                          </motion.span>
                        </Link>
                      )
                    ) : (
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <motion.span
                          className="w-full block bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium shadow-lg shadow-sky-250 hover:shadow-sky-300 text-center mt-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {item.name}
                        </motion.span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
