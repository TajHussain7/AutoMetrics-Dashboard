"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";

interface HeaderProps {
  title: string;
  breadcrumb: string;
}

export default function Header({ title, breadcrumb }: HeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-slate-200">
      <div className="px-6">
        <div className="max-w-[1600px] mx-auto flex h-16 items-center justify-between">
          {/* Left Section — Logo and Title */}
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative w-14 h-14 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-10"></div>
              <Activity className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
            </motion.div>

            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-sm text-slate-500">
                Intelligent Travel Data Dashboard
              </p>
            </div>
          </div>

          {/* Right Section — Breadcrumb */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
            <span className="text-sm text-slate-400">Dashboard</span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-sm font-medium text-slate-700">
              {breadcrumb}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
