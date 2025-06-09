import { BrainCircuit, MapPin, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  const animations = {
    fadeInUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
  };

  return (
    <footer className="bg-blue-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={animations.fadeInUp}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-7 w-7 text-sky-500 fill-sky-500" />
              <span className="text-2xl font-bold">
                Neuro
                <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                  Assess
                </span>
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We are honored to be part of your journey in supporting
              neurodivergent students. Our mission is to provide compassionate,
              AI-driven assessments and expert-guided plans every step of the
              way.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Trust NeuroAssess to empower your child's learning journey and
              work with us to achieve the best possible outcomes for their
              growth and development.
            </p>
          </motion.div>

          {/* About Us Links */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={animations.fadeInUp}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-gray-900">About Us</h3>
            <ul className="space-y-3">
              {[
                "Home",
                "About Us",
                "Work With Us",
                "Our Blog",
                "Terms & Conditions",
              ].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-gray-600 hover:text-sky-600 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services Links */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={animations.fadeInUp}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-gray-900">Services</h3>
            <ul className="space-y-3">
              {[
                "Search Terms",
                "Advance Search",
                "Privacy Policy",
                "Suppliers",
                "Our Stores",
              ].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-gray-600 hover:text-sky-600 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={animations.fadeInUp}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-gray-900">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-sky-500 shrink-0 mt-1" />
                <span className="text-gray-600">
                  123, London Bridge Street, London
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-sky-500" />
                <a
                  href="mailto:support@neuroassess.com"
                  className="text-gray-600 hover:text-sky-600 transition-colors"
                >
                  support@neuroassess.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-sky-500" />
                <a
                  href="tel:+012-3456-789"
                  className="text-gray-600 hover:text-sky-600 transition-colors"
                >
                  (+012) 3456 789
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Copyright Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={animations.fadeInUp}
          viewport={{ once: true }}
          className="mt-16 pt-8 border-t border-gray-100"
        >
          <p className="text-center text-gray-600">
            © {new Date().getFullYear()} NeuroAssess. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
