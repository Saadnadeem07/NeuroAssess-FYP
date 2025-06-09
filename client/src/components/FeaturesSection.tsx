import {
  Stethoscope,
  Clock,
  UserCheck,
  HeartPulse,
  Building2,
  Users,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";

function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: any;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="p-8 relative">
        <div className="mb-6 inline-flex">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200/50 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-8 w-8" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>

        {/* Decorative number */}
        <div className="absolute top-6 right-6 text-6xl font-bold text-gray-100 select-none">
          {(index + 1).toString().padStart(2, "0")}
        </div>
      </div>
    </motion.div>
  );
}

export default function FeatureSection() {
  const animations = {
    fadeInUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    staggerChildren: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 },
      },
    },
  };

  const features = [
    {
      icon: Stethoscope,
      title: "AI-Powered Assessments",
      description:
        "Our advanced AI models analyze writing patterns and cognitive responses to detect early signs of dyslexia and dysgraphia, ensuring timely intervention.",
    },
    {
      icon: Clock,
      title: "24/7 Access to Insights",
      description:
        "Instantly receive AI-generated reports and recommendations, accessible anytime. Our system continuously learns and improves for greater accuracy.",
    },
    {
      icon: UserCheck,
      title: "Easy Appointment Booking",
      description:
        "Easily schedule consultations with licensed psychiatrists through our intelligent booking system, ensuring timely expert guidance when needed.",
    },
    {
      icon: HeartPulse,
      title: "Personalized Learning Plans",
      description:
        "Tailored intervention plans based on AI analysis, designed to support students with dyslexia and dysgraphia in improving their reading and writing skills.",
    },
    {
      icon: Users,
      title: "Empowering Parents & Students",
      description:
        "Our AI-driven platform provides parents and students with accurate assessments, personalized learning plans, and real-time progress tracking, ensuring effective support for neurodivergent learning.",
    },
    {
      icon: Stethoscope,
      title: "Streamlined Support for Psychiatrists",
      description:
        "Psychiatrists receive AI-assisted reports, enabling them to make informed diagnoses, offer tailored recommendations, and monitor student progress seamlessly within the platform.",
    },
  ];

  return (
    <section className="py-32 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(236,254,255,0.5),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(236,254,255,0.5),transparent)] pointer-events-none" />

      <AnimatedSection className="container max-w-7xl mx-auto px-4">
        <motion.div
          variants={animations.fadeInUp}
          className="text-center space-y-6 mb-20"
        >
          <div className="inline-block p-3 bg-blue-100 rounded-2xl mb-4">
            <div className="bg-blue-500 rounded-xl p-2 text-white">
              <Activity className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            Why Choose NeuroAssess?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience AI-powered assessments and expert insights for
            neurodivergent support. NeuroAssess detects dyslexia and dysgraphia
            with advanced machine learning, offering personalized learning plans
            and seamless collaboration between parents, students, and
            specialists.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={animations.staggerChildren}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={animations.fadeInUp}>
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={animations.fadeInUp}
          className="text-center mt-16"
        >
          <a
            href="#appointment"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-full font-medium hover:shadow-lg hover:shadow-blue-200 transition-shadow duration-300"
          >
            Schedule an Appointment
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
      </AnimatedSection>
    </section>
  );
}
