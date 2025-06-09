import {
  Stethoscope,
  ClipboardList,
  UserCog,
  FileCheck2,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";

const animations = {
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
};

export default function HowItWorks() {
  const steps = [
    {
      icon: <ClipboardList className="h-8 w-8" />,
      title: "Initial Assessment",
      description:
        "Complete an AI-powered assessment to evaluate your child’s symptoms of dyslexia or dysgraphia.",
      details: [
        "AI analysis of writing patterns",
        "Symptom identification for dyslexia or dysgraphia",
        "Initial recommendations for intervention",
      ],
    },
    {
      icon: <UserCog className="h-8 w-8" />,
      title: "Personalized Learning Plan",
      description:
        "Receive a personalized learning plan based on AI insights and expert recommendations.",
      details: [
        "Tailored exercises for reading and writing",
        "Targeted intervention strategies",
        "Progress tracking and adjustments",
      ],
    },
    {
      icon: <FileCheck2 className="h-8 w-8" />,
      title: "Expert Consultation",
      description:
        "Consult with a licensed psychiatrist or specialist to validate the AI findings and discuss treatment options.",
      details: [
        "Expert review of AI-generated results",
        "Customized treatment recommendations",
        "Ongoing monitoring and follow-up consultations",
      ],
    },
  ];

  return (
    <section className="py-32 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue-100/25 bg-[size:20px_20px] pointer-events-none" />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="absolute top-0 left-1/2 -translate-x-1/2"
      >
        <Activity className="h-64 w-64 text-blue-100/50 rotate-12" />
      </motion.div>

      <AnimatedSection className="container max-w-7xl mx-auto px-4 relative">
        <motion.div
          variants={animations.fadeInUp}
          className="text-center space-y-6 mb-20"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-100 rounded-full p-3">
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            Your Path to Personalized Support
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            NeuroAssess simplifies the journey of diagnosing and supporting
            neurodivergent students with dyslexia and dysgraphia. Our AI-powered
            assessments and expert-driven plans ensure that every student
            receives tailored support for their unique needs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={animations.scaleIn}
              transition={{ delay: index * 0.2 }}
              className="relative group"
            >
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-100 to-blue-200" />
              )}
              <div className="relative flex flex-col items-center text-center space-y-6">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.details.map((detail, idx) => (
                      <li
                        key={idx}
                        className="text-gray-500 flex items-center justify-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={animations.fadeInUp}
          className="mt-20 text-center"
        >
          <a
            href="#schedule"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-full font-medium hover:shadow-lg hover:shadow-blue-200 transition-shadow duration-300"
          >
            Start Your Health Journey
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
// import { Bot, BookOpen, ClipboardCheck } from "lucide-react";
// import { motion } from "framer-motion";
// import { AnimatedSection } from "./AnimatedSection";

// const animations = {
//   fadeInUp: {
//     hidden: { opacity: 0, y: 20 },
//     visible: { opacity: 1, y: 0 },
//   },
// };

// export default function HowItWorks() {
//   const steps = [
//     {
//       icon: <ClipboardCheck className="h-6 w-6" />,
//       title: "Initial Assessment",
//       description:
//         "Complete our comprehensive diagnostic tests designed by experts.",
//     },
//     {
//       icon: <Bot className="h-6 w-6" />,
//       title: "AI Analysis",
//       description:
//         "Our AI processes the results to identify learning patterns and needs.",
//     },
//     {
//       icon: <BookOpen className="h-6 w-6" />,
//       title: "Personalized Plan",
//       description:
//         "Receive a tailored learning strategy based on your unique profile.",
//     },
//   ];

//   return (
//     <section className="py-24 bg-muted/50">
//       <AnimatedSection className="container max-w-6xl mx-auto">
//         <motion.div
//           variants={animations.fadeInUp}
//           className="text-center space-y-4 mb-16">
//           <h2 className="text-3xl font-medium tracking-tight">How It Works</h2>
//           <p className="text-muted-foreground">
//             Three simple steps to transform your learning journey
//           </p>
//         </motion.div>
//         <div className="grid md:grid-cols-3 gap-12">
//           {steps.map((step, index) => (
//             <motion.div
//               key={index}
//               variants={animations.fadeInUp}
//               className="relative group">
//               {index < steps.length - 1 && (
//                 <div className="hidden md:block absolute top-12 left-1/2 w-full h-px bg-border" />
//               )}
//               <div className="relative flex flex-col items-center text-center space-y-4">
//                 <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
//                   {step.icon}
//                 </div>
//                 <h3 className="text-lg font-medium">{step.title}</h3>
//                 <p className="text-muted-foreground">{step.description}</p>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       </AnimatedSection>
//     </section>
//   );
// }
