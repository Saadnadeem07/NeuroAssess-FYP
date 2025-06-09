import { motion } from "framer-motion";
import { PlusCircle, MinusCircle } from "lucide-react";
import { ReactNode } from "react";

interface FAQItemProps {
  icon: ReactNode;
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}

const animations = {
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
};

export default function FAQItem({
  icon,
  question,
  answer,
  isOpen,
  onClick,
  index,
}: FAQItemProps) {
  return (
    <motion.div
      variants={animations.scaleIn}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-md shadow-blue-100/50 overflow-hidden"
    >
      <button
        onClick={onClick}
        className="w-full text-left px-6 py-5 flex items-start gap-4 hover:bg-blue-50/50 transition-colors duration-200"
      >
        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg text-blue-600">
          {icon}
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-center gap-4">
            <h3 className="font-semibold text-lg text-gray-900">{question}</h3>
            {isOpen ? (
              <MinusCircle className="flex-shrink-0 w-5 h-5 text-blue-500" />
            ) : (
              <PlusCircle className="flex-shrink-0 w-5 h-5 text-blue-500" />
            )}
          </div>
          <div
            className={`mt-2 text-gray-600 whitespace-pre-line transition-all duration-300 ${
              isOpen ? "block opacity-100" : "hidden opacity-0"
            }`}
          >
            {answer}
          </div>
        </div>
      </button>
    </motion.div>
  );
}
