"use client";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative"
      style={{ minHeight: "clamp(4rem, 10vh, 5rem)" }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-white to-white pointer-events-none" />

      <div className="relative bg-white/80 backdrop-blur-sm border-t border-slate-200/50 h-full">
        <div
          className="max-w-[1600px] mx-auto h-full"
          style={{ paddingInline: "clamp(1rem, 5vw, 3rem)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-2 h-full py-4"
          >
            {/* Logo with Activity icon */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative flex items-center justify-center shrink-0"
              style={{
                width: "clamp(1.5rem, 5vw, 2rem)",
                height: "clamp(1.5rem, 5vw, 2rem)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-10"></div>
              <Activity
                className="text-blue-600"
                strokeWidth={2.5}
                style={{
                  width: "clamp(0.875rem, 3vw, 1rem)",
                  height: "clamp(0.875rem, 3vw, 1rem)",
                }}
              />
            </motion.div>

            {/* Copyright text */}
            <p
              className="text-slate-600 text-center"
              style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)" }}
            >
              © {year}{" "}
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tajamal Hussain
              </span>
              . All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
