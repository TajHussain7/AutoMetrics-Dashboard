"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";

// Feedback/Message Lottie Animation JSON
const feedbackAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Feedback",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Bubble",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            {
              t: 0,
              s: [50, 50, 0],
              e: [50, 45, 0],
              i: { x: 0.5, y: 1 },
              o: { x: 0.5, y: 0 },
            },
            {
              t: 30,
              s: [50, 45, 0],
              e: [50, 50, 0],
              i: { x: 0.5, y: 1 },
              o: { x: 0.5, y: 0 },
            },
            { t: 60, s: [50, 50, 0] },
          ],
        },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            {
              t: 0,
              s: [100, 100, 100],
              e: [105, 105, 100],
              i: { x: 0.5, y: 1 },
              o: { x: 0.5, y: 0 },
            },
            {
              t: 30,
              s: [105, 105, 100],
              e: [100, 100, 100],
              i: { x: 0.5, y: 1 },
              o: { x: 0.5, y: 0 },
            },
            { t: 60, s: [100, 100, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [60, 45] },
              p: { a: 0, k: [0, -5] },
              r: { a: 0, k: 12 },
              nm: "Rectangle",
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.23, 0.51, 0.96, 1] },
              o: { a: 0, k: 100 },
              r: 1,
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Bubble Shape",
        },
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [35, 4] },
              p: { a: 0, k: [0, -15] },
              r: { a: 0, k: 2 },
              nm: "Line 1",
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 1, 1, 1] },
              o: {
                a: 1,
                k: [
                  {
                    t: 0,
                    s: [60],
                    e: [100],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  {
                    t: 30,
                    s: [100],
                    e: [60],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  { t: 60, s: [60] },
                ],
              },
              r: 1,
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Line 1",
        },
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [28, 4] },
              p: { a: 0, k: [-3, -5] },
              r: { a: 0, k: 2 },
              nm: "Line 2",
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 1, 1, 1] },
              o: {
                a: 1,
                k: [
                  {
                    t: 0,
                    s: [40],
                    e: [80],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  {
                    t: 30,
                    s: [80],
                    e: [40],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  { t: 60, s: [40] },
                ],
              },
              r: 1,
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Line 2",
        },
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [20, 4] },
              p: { a: 0, k: [-7, 5] },
              r: { a: 0, k: 2 },
              nm: "Line 3",
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 1, 1, 1] },
              o: {
                a: 1,
                k: [
                  {
                    t: 0,
                    s: [30],
                    e: [60],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  {
                    t: 30,
                    s: [60],
                    e: [30],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  { t: 60, s: [30] },
                ],
              },
              r: 1,
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Line 3",
        },
        {
          ty: "gr",
          it: [
            {
              ty: "sr",
              sy: 1,
              d: 1,
              pt: { a: 0, k: 3 },
              p: { a: 0, k: [0, 25] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 5 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 8 },
              os: { a: 0, k: 0 },
              nm: "Tail",
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.23, 0.51, 0.96, 1] },
              o: { a: 0, k: 100 },
              r: 1,
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 180 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Tail",
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Dots",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              d: 1,
              s: {
                a: 1,
                k: [
                  {
                    t: 0,
                    s: [6, 6],
                    e: [8, 8],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  {
                    t: 15,
                    s: [8, 8],
                    e: [6, 6],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  { t: 30, s: [6, 6] },
                ],
              },
              p: { a: 0, k: [-35, -30] },
              nm: "Dot 1",
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.55, 0.36, 0.96, 1] },
              o: { a: 0, k: 100 },
              r: 1,
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Dot 1",
        },
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              d: 1,
              s: {
                a: 1,
                k: [
                  {
                    t: 10,
                    s: [5, 5],
                    e: [7, 7],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  {
                    t: 25,
                    s: [7, 7],
                    e: [5, 5],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  { t: 40, s: [5, 5] },
                ],
              },
              p: { a: 0, k: [38, -25] },
              nm: "Dot 2",
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.23, 0.51, 0.96, 1] },
              o: { a: 0, k: 100 },
              r: 1,
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Dot 2",
        },
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              d: 1,
              s: {
                a: 1,
                k: [
                  {
                    t: 20,
                    s: [4, 4],
                    e: [6, 6],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  {
                    t: 35,
                    s: [6, 6],
                    e: [4, 4],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  { t: 50, s: [4, 4] },
                ],
              },
              p: { a: 0, k: [35, 20] },
              nm: "Dot 3",
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.55, 0.36, 0.96, 1] },
              o: { a: 0, k: 100 },
              r: 1,
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Dot 3",
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
    },
  ],
};

// Heart/Like Lottie Animation JSON
const heartAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Heart",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Heart",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 52, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            {
              t: 0,
              s: [100, 100, 100],
              e: [115, 115, 100],
              i: { x: 0.5, y: 1 },
              o: { x: 0.5, y: 0 },
            },
            {
              t: 15,
              s: [115, 115, 100],
              e: [100, 100, 100],
              i: { x: 0.5, y: 1 },
              o: { x: 0.5, y: 0 },
            },
            {
              t: 30,
              s: [100, 100, 100],
              e: [110, 110, 100],
              i: { x: 0.5, y: 1 },
              o: { x: 0.5, y: 0 },
            },
            {
              t: 45,
              s: [110, 110, 100],
              e: [100, 100, 100],
              i: { x: 0.5, y: 1 },
              o: { x: 0.5, y: 0 },
            },
            { t: 60, s: [100, 100, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              d: 1,
              ks: {
                a: 0,
                k: {
                  c: true,
                  v: [
                    [0, -10],
                    [-20, -25],
                    [-25, -5],
                    [0, 20],
                    [25, -5],
                    [20, -25],
                  ],
                  i: [
                    [0, 0],
                    [-15, 0],
                    [0, -15],
                    [-15, 10],
                    [0, 15],
                    [15, 0],
                  ],
                  o: [
                    [0, 0],
                    [0, -15],
                    [15, 0],
                    [0, 15],
                    [-15, 10],
                    [0, -15],
                  ],
                },
              },
              nm: "Heart Path",
            },
            {
              ty: "fl",
              c: {
                a: 1,
                k: [
                  {
                    t: 0,
                    s: [0.96, 0.26, 0.4, 1],
                    e: [0.96, 0.4, 0.5, 1],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  {
                    t: 30,
                    s: [0.96, 0.4, 0.5, 1],
                    e: [0.96, 0.26, 0.4, 1],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  { t: 60, s: [0.96, 0.26, 0.4, 1] },
                ],
              },
              o: { a: 0, k: 100 },
              r: 1,
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Heart Shape",
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
    },
  ],
};

// Star/Sparkle Lottie Animation JSON
const sparkleAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Sparkle",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Star",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            {
              t: 0,
              s: [0],
              e: [360],
              i: { x: [0.5], y: [1] },
              o: { x: [0.5], y: [0] },
            },
            { t: 60, s: [360] },
          ],
        },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            {
              t: 0,
              s: [80, 80, 100],
              e: [100, 100, 100],
              i: { x: 0.5, y: 1 },
              o: { x: 0.5, y: 0 },
            },
            {
              t: 30,
              s: [100, 100, 100],
              e: [80, 80, 100],
              i: { x: 0.5, y: 1 },
              o: { x: 0.5, y: 0 },
            },
            { t: 60, s: [80, 80, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sr",
              sy: 1,
              d: 1,
              pt: { a: 0, k: 4 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 8 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 20 },
              os: { a: 0, k: 0 },
              nm: "Star",
            },
            {
              ty: "fl",
              c: {
                a: 1,
                k: [
                  {
                    t: 0,
                    s: [1, 0.8, 0.2, 1],
                    e: [1, 0.9, 0.4, 1],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  {
                    t: 30,
                    s: [1, 0.9, 0.4, 1],
                    e: [1, 0.8, 0.2, 1],
                    i: { x: [0.5], y: [1] },
                    o: { x: [0.5], y: [0] },
                  },
                  { t: 60, s: [1, 0.8, 0.2, 1] },
                ],
              },
              o: { a: 0, k: 100 },
              r: 1,
              nm: "Fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Star Shape",
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
    },
  ],
};

export default function FeedbackPrompt() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("feedback-prompt");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const handleFeedbackClick = () => {
    window.open("/feedback", "_blank", "noopener,noreferrer");
  };

  return (
    <section id="feedback-prompt" className="py-16 lg:py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(139,92,246,0.06),transparent_50%)]" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card
            className="group rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white/80 backdrop-blur-sm"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <CardContent className="p-8 lg:p-12 relative">
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-purple-50/40 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 relative">
                {/* Left Content */}
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 order-2 lg:order-1">
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200/50"
                  >
                    <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-medium text-blue-700">
                      We Value Your Input
                    </span>
                  </motion.div>

                  {/* Heading */}
                  <div className="space-y-4 max-w-md">
                    <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight text-balance">
                      Help us improve{" "}
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        AutoMetrics
                      </span>
                    </h3>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Your insights help us create a better experience for
                      everyone. Share your thoughts and suggestions!
                    </p>
                  </div>

                  {/* CTA Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleFeedbackClick}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
                    >
                      <span>Share Your Feedback</span>
                      <ArrowUpRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </Button>
                  </motion.div>

                  {/* Trust Indicators */}
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex -space-x-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600"
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-slate-500">
                      Join{" "}
                      <span className="font-semibold text-slate-700">500+</span>{" "}
                      users who shared feedback
                    </span>
                  </div>
                </div>

                {/* Right Animation */}
                <div className="flex-shrink-0 order-1 lg:order-2">
                  <motion.div
                    animate={{ y: isHovered ? -5 : 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative"
                  >
                    {/* Main Animation Container */}
                    <div className="w-64 h-64 lg:w-72 lg:h-72 rounded-2xl bg-gradient-to-br from-blue-100 via-purple-50 to-blue-100 p-4 shadow-lg group-hover:shadow-xl transition-all duration-500">
                      <div className="w-full h-full flex items-center justify-center">
                        <Lottie
                          animationData={feedbackAnimation}
                          loop={isVisible}
                          className="w-56 h-56 lg:w-64 lg:h-64"
                        />
                      </div>
                    </div>

                    {/* Floating Decorations */}
                    {isVisible && (
                      <>
                        <motion.div
                          animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
                          transition={{
                            duration: 3,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                          className="absolute -top-4 -right-4 w-12 h-12"
                        >
                          <Lottie animationData={heartAnimation} loop />
                        </motion.div>

                        <motion.div
                          animate={{ y: [0, 6, 0], rotate: [0, -10, 0] }}
                          transition={{
                            duration: 2.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                            delay: 0.5,
                          }}
                          className="absolute -bottom-2 -left-4 w-10 h-10"
                        >
                          <Lottie animationData={sparkleAnimation} loop />
                        </motion.div>

                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                          className="absolute top-1/2 -right-6 w-3 h-3 rounded-full bg-blue-400"
                        />

                        <motion.div
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.4, 0.8, 0.4],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                            delay: 0.3,
                          }}
                          className="absolute top-4 -left-3 w-2 h-2 rounded-full bg-purple-400"
                        />
                      </>
                    )}
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
