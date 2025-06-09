import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function PageNotFound() {
  const navigate = useNavigate();

  const animations = {
    fadeInUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    staggerChildren: {
      visible: { transition: { staggerChildren: 0.1 } },
    },
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-red-200 to-red-300">
      {/* Decorative gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(255,99,71,0.1),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(255,99,71,0.1),transparent)] pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={animations.staggerChildren}
        className="text-center max-w-lg p-8 bg-white rounded-3xl shadow-xl shadow-red-300"
      >
        <motion.h1
          variants={animations.fadeInUp}
          className="text-6xl font-bold text-red-600"
        >
          ⚠️ 404
        </motion.h1>

        <motion.p
          variants={animations.fadeInUp}
          className="text-lg text-red-500 mt-4"
        >
          Oops! The page you are looking for doesn’t exist.
        </motion.p>

        <motion.button
          variants={animations.fadeInUp}
          className="mt-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-3.5 rounded-full font-medium shadow-lg shadow-yellow-200 hover:shadow-yellow-300 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/")}
        >
          Go Home
        </motion.button>
      </motion.div>
    </div>
  );
}
