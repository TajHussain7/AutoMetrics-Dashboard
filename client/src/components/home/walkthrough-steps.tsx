"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Upload, Cog, BarChart3 } from "lucide-react";

const steps = [
  {
    id: "upload",
    title: "Upload",
    subtitle:
      "Drop your CSV or Excel file (≤10MB). We'll detect columns automatically.",
    color: "blue",
    icon: Upload,
  },
  {
    id: "process",
    title: "Process",
    subtitle:
      "We extract PNR, Route & Flight Date and categorize flight status.",
    color: "purple",
    icon: Cog,
  },
  {
    id: "analyze",
    title: "Analyze",
    subtitle:
      "Use the dashboard to edit rates, calculate profit and export reports.",
    color: "green",
    icon: BarChart3,
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

interface StepCardProps {
  step: (typeof steps)[0];
  index: number;
  isInView: boolean;
  shouldReduceMotion: boolean | null;
}

function StepCard({
  step,
  index,
  isInView,
  shouldReduceMotion,
}: StepCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = colorClasses[step.color as keyof typeof colorClasses];

  // Extract the icon component from the step
  const Icon = step.icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;

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
        className={`relative h-full bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 group rounded-2xl`}
        style={{ padding: "clamp(1.5rem, 4vw, 2rem)", overflow: "hidden" }}
        data-testid={`walkthrough-step-${step.id}`}
      >
        {/* Gradient overlay on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        />

        {/* Step number */}
        <div className="absolute top-4 right-4 z-10">
          <div
            className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center border ${colors.border}`}
          >
            <span
              className={`text-sm font-bold ${colors.text}`}
              data-testid={`step-number-${index + 1}`}
            >
              {index + 1}
            </span>
          </div>
        </div>

        {/* Icon Container */}
        <div
          className={`w-24 h-24 rounded-2xl ${colors.iconBg} flex items-center justify-center mb-6 relative overflow-hidden transition-transform duration-300 group-hover:scale-105`}
        >
          {/* Render the icon component safely */}
          {Icon && <Icon className="w-10 h-10 text-slate-700 relative z-10" />}
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-slate-800 transition-colors">
            {step.title}
          </h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            {step.subtitle}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

export function WalkthroughSteps() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      className="bg-slate-50 relative"
      style={{ padding: "clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 3rem)" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-50" />

      {/* Horizontal flow line + circles */}
      <div
        className="hidden lg:flex items-center justify-between absolute left-0 right-0 z-0"
        style={{
          top: "clamp(300px, 40vh, 360px)",
          paddingInline: "clamp(2rem, 6vw, 6rem)",
        }}
      >
        {/* Left Circle */}
        <div className="w-4 h-4 bg-blue-500 rounded-full shrink-0" />

        {/* Line */}
        <div className="flex-1 h-[4px] bg-slate-300" />

        {/* Right Circle */}
        <div className="w-4 h-4 bg-blue-500 rounded-full shrink-0" />
      </div>

      <div className="w-full max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12 lg:mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2
            className="font-bold mb-4 text-slate-900 text-balance"
            style={{ fontSize: "clamp(1.875rem, 4vw, 3rem)" }}
          >
            How it works
          </h2>
          <p
            className="text-slate-600 max-w-2xl mx-auto"
            style={{ fontSize: "clamp(1rem, 1.5vw, 1.125rem)" }}
          >
            Three simple steps to transform your travel data into insights
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              isInView={isInView}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
