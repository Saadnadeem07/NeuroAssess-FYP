import { motion } from "framer-motion";

interface ContactCTAProps {
  text?: string;
  buttonText?: string;
  href?: string;
}

const animations = {
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
};

export default function ContactCTA({
  text = "Still have questions? We're here to help.",
  buttonText = "Contact Our Support Team",
  href = "#contact",
}: ContactCTAProps) {
  return (
    <motion.div variants={animations.fadeInUp} className="text-center mt-12">
      <p className="text-gray-600 mb-6">{text}</p>
      <a
        href={href}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-medium hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all duration-300"
      >
        {buttonText}
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </a>
    </motion.div>
  );
}
