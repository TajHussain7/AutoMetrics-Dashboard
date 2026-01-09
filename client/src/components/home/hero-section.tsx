"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface HeroSectionProps {
  onTryDemo: () => void;
  onHowItWorks: () => void;
}

export function HeroSection({ onTryDemo, onHowItWorks }: HeroSectionProps) {
  return (
    <section
      className="w-full relative overflow-hidden"
      style={{ padding: "clamp(3rem, 8vw, 5rem) 0" }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-white to-slate-50" />

      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />

      <div
        className="relative w-full"
        style={{ paddingInline: "clamp(1rem, 5vw, 3rem)" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6 flex-wrap justify-center lg:justify-start"
            >
              <span className="relative flex h-4 w-4 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium text-blue-700">
                Trusted by 5,000+ travel professionals
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="font-bold tracking-tight mb-6 text-slate-900 text-balance"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.75rem)",
                lineHeight: "1.1",
              }}
            >
              Turn travel ledgers into{" "}
              <span className="text-blue-600 relative inline-block">
                actionable insights
                <svg
                  className="absolute left-0 w-full"
                  style={{ bottom: "clamp(-4px, -1vw, -8px)" }}
                  viewBox="0 0 300 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="text-blue-300"
                  />
                </svg>
              </span>{" "}
              — in seconds
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
              className="text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)" }}
            >
              Upload CSV / XLSX. We extract bookings, PNRs and flight dates,
              then show dashboard analytics and exports.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.4, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start flex-wrap"
            >
              <Button
                size="lg"
                onClick={onTryDemo}
                className="text-base px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all"
                data-testid="button-try-demo"
              >
                Try Demo
                <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onHowItWorks}
                className="text-base px-8 py-6 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                data-testid="button-how-it-works"
              >
                How it works
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="mt-10 flex flex-wrap items-center gap-4 sm:gap-6 justify-center lg:justify-start text-sm text-slate-500"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-500 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>No signup required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-500 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Free to use</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-500 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secure processing</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Enhanced Animation Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="relative flex flex-col items-center justify-center gap-8"
          >
            {/* Primary Lottie Animation - Process Flow */}
            <div className="relative w-full flex justify-center">
              {/* Multiple layered glow effects for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-blue-600/20 blur-3xl rounded-full scale-125 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent blur-2xl rounded-full scale-100" />

              {/* Main Portal Flow Animation */}
              <div className="relative w-full max-w-2xl">
                <DotLottieReact
                  src="/lottie/hero.json"
                  loop
                  autoplay
                  className="w-full h-auto relative z-10"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
