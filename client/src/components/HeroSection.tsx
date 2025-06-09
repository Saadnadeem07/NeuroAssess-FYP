import { ArrowRight, Calendar, Clock, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
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
    <div className="relative min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-250 pt-20">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,rgba(14,165,233,0.05),transparent)] pointer-events-none" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animations.staggerChildren}
            className="space-y-8"
          >
            <motion.div variants={animations.fadeInUp} className="inline-block">
              <span className="bg-sky-250 text-sky-600 px-4 py-2 rounded-full text-sm font-medium">
                Trusted Healthcare Provider
              </span>
            </motion.div>

            <motion.h1
              variants={animations.fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
            >
              Empowering
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                {" "}
                Neurodivergent Minds
              </span>
            </motion.h1>

            <motion.p
              variants={animations.fadeInUp}
              className="text-gray-600 text-lg leading-relaxed"
            >
              Unlock personalized support for dyslexia and dysgraphia with
              AI-driven assessments and expert guidance. NeuroAssess combines
              cutting-edge technology with professional oversight to provide
              accurate evaluations, tailored learning plans, and seamless
              collaboration between parents, students, and psychiatrists.
            </motion.p>

            <motion.div
              variants={animations.fadeInUp}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-3.5 rounded-full font-medium shadow-lg shadow-sky-300 hover:shadow-sky-300 flex items-center group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Book Consultation
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                className="bg-white text-gray-700 px-8 py-3.5 rounded-full font-medium border border-gray-200 hover:border-sky-300 hover:bg-sky-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.button>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={animations.fadeInUp}
            className="bg-white p-8 rounded-3xl shadow-xl shadow-sky-250"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Schedule Your Visit
            </h2>
            <form className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-250 transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-250 transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-250 transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-250 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-250 transition-all appearance-none">
                      <option value="">Select a time</option>
                      <option value="morning">Morning (9AM - 12PM)</option>
                      <option value="afternoon">Afternoon (1PM - 5PM)</option>
                      <option value="evening">Evening (6PM - 8PM)</option>
                    </select>
                  </div>
                </div>
              </div>

              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 rounded-xl font-medium shadow-lg shadow-sky-250 hover:shadow-sky-300 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Schedule Appointment
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
