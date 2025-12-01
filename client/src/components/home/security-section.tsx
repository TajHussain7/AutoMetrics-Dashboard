"use client";

import { motion, useReducedMotion, useInView } from "framer-motion";
import { CheckCircle2, Fingerprint, Cpu, FileKey } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRef, useState } from "react";
import Lottie from "lottie-react";
import securityAnim from "../../../public/lottie/security.json";

const securityFeatures = [
  {
    id: "secure-processing",
    title: "Secure Processing",
    description:
      "Your files are processed and stored securely with industry-standard encryption",
    color: "blue",
    icon: Cpu,
  },
  {
    id: "jwt-auth",
    title: "JWT Authentication",
    description:
      "JWT-protected accounts ensure your data is accessible only to authorized users",
    color: "purple",
    icon: Fingerprint,
  },
  {
    id: "private-data",
    title: "Private Data",
    description:
      "No external exposure - your sensitive travel data never leaves our secure infrastructure",
    color: "green",
    icon: FileKey,
  },
];

const colorClasses = {
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-200",
    text: "text-blue-600",
    gradient: "from-blue-500/20 to-blue-600/5",
    iconBg: "bg-blue-100",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-200",
    text: "text-purple-600",
    gradient: "from-purple-500/20 to-purple-600/5",
    iconBg: "bg-purple-100",
  },
  green: {
    bg: "bg-green-500/10",
    border: "border-green-200",
    text: "text-green-600",
    gradient: "from-green-500/20 to-green-600/5",
    iconBg: "bg-green-100",
  },
};

const additionalFeatures = [
  "Files are automatically deleted after processing unless you choose to save them",
  "End-to-end encryption for all data transfers",
  "Regular security audits and compliance monitoring",
];

interface FeatureCardProps {
  feature: (typeof securityFeatures)[0];
  index: number;
  isInView: boolean;
  shouldReduceMotion: boolean | null;
}

function FeatureCard({
  feature,
  index,
  isInView,
  shouldReduceMotion,
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = colorClasses[feature.color as keyof typeof colorClasses];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.5,
        delay: shouldReduceMotion ? 0 : index * 0.15,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className="relative p-5 h-full bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 group overflow-hidden rounded-2xl text-center"
        data-testid={`security-feature-${index}`}
      >
        {/* Gradient overlay on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        />

        {/* Lottie Animation Container */}
        <div
          className={`w-20 h-20 rounded-2xl ${colors.iconBg} flex items-center justify-center mb-6 mx-auto relative overflow-hidden transition-transform duration-300 group-hover:scale-105`}
        >
          {feature.icon && (
            <feature.icon className="w-10 h-10 text-slate-700" />
          )}
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3
            className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-slate-800 transition-colors"
            data-testid={`security-title-${index}`}
          >
            {feature.title}
          </h3>
          <p
            className="text-slate-600 leading-relaxed text-sm"
            data-testid={`security-description-${index}`}
          >
            {feature.description}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

export function SecuritySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      className="py-20 md:py-10 bg-slate-50 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-50" />

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Enterprise Security
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-4">
            <div>
              <Lottie
                animationData={securityAnim}
                loop
                autoplay
                style={{ width: 110, height: 110 }}
              />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 text-balance">
              Security & Trust
            </h2>
          </div>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Your data security is our top priority. We use enterprise-grade
            protection to keep your information safe
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {securityFeatures.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              isInView={isInView}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>

        {/* Additional Features Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <Card className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <h3 className="font-semibold mb-5 flex items-center gap-3 text-slate-900 text-lg">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              Additional Security Features
            </h3>
            <ul className="space-y-4 text-slate-600">
              {additionalFeatures.map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={
                    isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }
                  }
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="leading-relaxed">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
