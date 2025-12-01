"use client";

import { motion, useReducedMotion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  Info,
  Calendar,
  User,
  Ticket,
  Plane,
  List,
  WalletCards,
  CreditCard,
  Scale,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import Lottie from "lottie-react";
import animationData from "../../../public/lottie/important.json";

const fields = [
  {
    name: "Date",
    description:
      "Flight date extracted from your ledger using multiple date format detection (DD/MM/YYYY, MM/DD/YYYY, ISO)",
    color: "blue",
    icon: Calendar,
  },
  {
    name: "Voucher",
    description:
      "Voucher or reference number automatically identified from transaction records",

    color: "purple",
    icon: Ticket,
  },
  {
    name: "Customer Name",
    description: "Passenger or customer name parsed from the booking details",
    color: "green",
    icon: User,
  },
  {
    name: "Route",
    description:
      "Flight route (origin-destination) detected from route columns or narration",
    color: "orange",
    icon: Plane,
  },
  {
    name: "PNR",
    description:
      "Passenger Name Record (PNR) extracted from dedicated columns or embedded in narration",
    color: "pink",
    icon: List,
  },
  {
    name: "Debit",
    description:
      "Debit amount parsed from financial columns, representing expenses or charges",
    color: "red",
    icon: WalletCards,
  },
  {
    name: "Credit",
    description:
      "Credit amount parsed from financial columns, representing revenue or receipts",
    color: "emerald",
    icon: CreditCard,
  },
  {
    name: "Balance",
    description:
      "Running balance calculated from debit and credit transactions",
    color: "cyan",
    icon: Scale,
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
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-200",
    text: "text-orange-600",
    gradient: "from-orange-500/20 to-orange-600/5",
    iconBg: "bg-orange-100",
  },
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-200",
    text: "text-pink-600",
    gradient: "from-pink-500/20 to-pink-600/5",
    iconBg: "bg-pink-100",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-200",
    text: "text-red-600",
    gradient: "from-red-500/20 to-red-600/5",
    iconBg: "bg-red-100",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-200",
    text: "text-emerald-600",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    iconBg: "bg-emerald-100",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-200",
    text: "text-cyan-600",
    gradient: "from-cyan-500/20 to-cyan-600/5",
    iconBg: "bg-cyan-100",
  },
};

interface FieldCardProps {
  field: (typeof fields)[0];
  index: number;
  isInView: boolean;
  shouldReduceMotion: boolean | null;
}

function FieldCard({
  field,
  index,
  isInView,
  shouldReduceMotion,
}: FieldCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = colorClasses[field.color as keyof typeof colorClasses];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.4,
        delay: shouldReduceMotion ? 0 : index * 0.05,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className="relative p-6 h-full bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 group overflow-hidden rounded-2xl cursor-help"
              data-testid={`field-${field.name
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div
                className={`w-14 h-14 rounded-xl ${colors.iconBg} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
              >
                <field.icon className="w-8 h-8 text-slate-700" />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <h3
                    className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors"
                    data-testid={`field-name-${field.name
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {field.name}
                  </h3>
                  <Info className="h-4 w-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-1">
                  {field.description}
                </p>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs"
            aria-describedby={`tooltip-${field.name}`}
          >
            <p>{field.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}

export function FieldExplanation() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section ref={ref} className="py-20 md:py-10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-100 via-white to-white" />

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
            Smart Extraction
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 text-balance">
            What we extract
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Our intelligent parser automatically identifies and extracts key
            fields from your travel ledgers
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {fields.map((field, index) => (
            <FieldCard
              key={field.name}
              field={field}
              index={index}
              isInView={isInView}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 relative w-fit mx-auto"
        >
          <div className="relative">
            {/* Lottie animation positioned outside top-left */}
            <div className="absolute -top-20 -left-20 z-20">
              <Lottie
                animationData={animationData}
                loop
                autoplay
                style={{ width: 140, height: 140 }}
              />
            </div>

            {/* Pro Tip Box */}
            <Alert className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200 rounded-2xl p-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <AlertTitle className="text-slate-900 font-semibold mb-1">
                    Pro tip
                  </AlertTitle>
                  <AlertDescription className="text-slate-600 leading-relaxed">
                    To improve automatic date detection, ensure your Date column
                    is the left-most (first) column in the CSV before uploading.
                    If the Date is located elsewhere, move that column to the
                    first position or make sure the header clearly contains the
                    word "date" so the parser can detect it reliably.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
