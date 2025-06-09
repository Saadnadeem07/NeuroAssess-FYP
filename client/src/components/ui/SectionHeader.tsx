import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionHeaderProps {
  icon?: ReactNode;
  title: string;
  description: string;
  iconBgColor?: string;
  iconColor?: string;
}

const animations = {
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
};

export default function SectionHeader({
  icon,
  title,
  description,
  iconBgColor = "bg-blue-500",
  iconColor = "bg-blue-100",
}: SectionHeaderProps) {
  return (
    <motion.div
      variants={animations.fadeInUp}
      className="text-center space-y-6 mb-20"
    >
      {icon && (
        <div className={`inline-block p-3 ${iconColor} rounded-2xl mb-4`}>
          <div className={`${iconBgColor} rounded-xl p-2 text-white`}>
            {icon}
          </div>
        </div>
      )}
      <h2 className="text-4xl font-bold tracking-tight text-gray-900">
        {title}
      </h2>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">{description}</p>
    </motion.div>
  );
}
