"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, CheckCircle2, Sparkles } from "lucide-react";
import Lottie from "lottie-react";
import footerAnim from "../../../public/lottie/footer.json";

interface FooterCTAProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

export function FooterCTA({ onGetStarted, onTryDemo }: FooterCTAProps) {
  const shouldReduceMotion = useReducedMotion();

  const benefits = [
    "No credit card required",
    "Free trial available",
    "Cancel anytime",
  ];

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 via-white to-white" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15), transparent 60%)",
        }}
      />

      <div className="w-full relative mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6"
          >
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Start Your Journey
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: shouldReduceMotion ? 0 : 0.2,
            }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-8 shadow-lg shadow-blue-500/25"
          >
            <Lottie animationData={footerAnim} loop autoplay />
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 text-balance">
            Ready to transform your travel data?
          </h2>

          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto text-pretty">
            Join thousands of travel professionals who trust TravelLedger Pro
            for their data processing needs
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: shouldReduceMotion ? 0 : 0.4,
            }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              onClick={onGetStarted}
              className="text-base px-8 py-6 min-w-[220px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
              data-testid="button-get-started"
            >
              Get started — it's free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onTryDemo}
              className="text-base px-8 py-6 min-w-[220px] border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-0.5 bg-transparent"
              data-testid="button-upload-sample"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload sample
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: shouldReduceMotion ? 0 : 0.6,
            }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.4,
                  delay: shouldReduceMotion ? 0 : 0.7 + index * 0.1,
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-slate-600">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
