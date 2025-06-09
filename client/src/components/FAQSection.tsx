import { motion } from "framer-motion";
import { HelpCircle, ShieldCheck, Stethoscope } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { useState } from "react";
import FAQItem from "./ui/FAQItem";
import ContactCTA from "./ui/ContactCTA";
import SectionHeader from "./ui/SectionHeader";

const animations = {
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
};

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      icon: <Stethoscope className="w-6 h-6" />,
      question: "How accurate are the AI-powered assessments?",
      answer:
        "Our AI assessments are built using state-of-the-art machine learning models, validated against clinical standards, and refined with expert oversight. Research shows a 95% correlation with traditional diagnostic methods. To ensure reliability, our system undergoes continuous improvement, incorporating feedback from medical professionals and real-world testing.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      question: "How is my data protected?",
      answer:
        "We prioritize data security and privacy through enterprise-grade encryption and strict compliance with HIPAA and GDPR regulations. Your information is securely stored and never shared without consent. Our security measures include:\n\n• 256-bit AES encryption for all data\n• Regular security audits and vulnerability assessments\n• Multi-factor authentication (MFA) for account protection\n• Secure, monitored data centers with 24/7 threat detection",
    },
    {
      icon: <HelpCircle className="w-6 h-6" />,
      question: "What role do psychiatrists play in the process?",
      answer:
        "Psychiatrists play a crucial role in ensuring accurate diagnosis and personalized treatment plans. While our AI models provide initial assessments, licensed professionals review all findings and offer expert guidance. Their role includes:\n\n• Validating AI-generated assessments for clinical accuracy\n• Providing tailored recommendations for complex cases\n• Developing structured intervention plans for students\n• Conducting follow-ups and progress monitoring",
    },
  ];

  return (
    <section
      className="py-32 bg-gradient-to-b from-white to-blue-50 relative overflow-hidden"
      id="faq"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(236,254,255,0.5),transparent)] pointer-events-none" />

      <AnimatedSection className="container max-w-7xl mx-auto px-4">
        <SectionHeader
          icon={<HelpCircle className="w-8 h-8" />}
          title="Frequently Asked Questions"
          description="Get answers to common questions about our healthcare platform and how we can help you on your journey to better health."
        />

        <motion.div
          variants={animations.fadeInUp}
          className="max-w-3xl mx-auto space-y-4"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              icon={faq.icon}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              index={index}
            />
          ))}
        </motion.div>

        <ContactCTA />
      </AnimatedSection>
    </section>
  );
}
