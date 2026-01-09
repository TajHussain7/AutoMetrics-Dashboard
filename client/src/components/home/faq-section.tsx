"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Lottie from "lottie-react";
import faqAnim from "../../../public/lottie/faq.json";
const faqs = [
  {
    question: "Why is my PNR not detected?",
    answer:
      "PNRs are typically extracted from dedicated PNR columns or found embedded in the Narration/Composite fields. If your PNR isn't being detected, try ensuring it's in a column labeled 'PNR' or include it in the Narration column. Our system looks for alphanumeric codes that match standard PNR patterns.",
  },
  {
    question: "What if my dates are in DD/MM/YYYY format?",
    answer:
      "Our system automatically detects multiple date formats including DD/MM/YYYY, MM/DD/YYYY, and ISO 8601 formats. The parser uses contextual analysis to determine the correct format. If you're experiencing issues, ensure dates are consistent throughout your file.",
  },
  {
    question: "How do I export my processed data?",
    answer:
      "After processing, you'll see an export button in the dashboard. You can export your data in multiple formats including CSV, Excel (XLSX), and PDF reports. All exports include your original data plus our extracted insights and calculations.",
  },
  {
    question: "What file size limits apply?",
    answer:
      "Currently, we support files up to 10MB in size. This typically accommodates thousands of transactions. If you need to process larger files, consider splitting them into multiple batches or contact us for enterprise options.",
  },
  {
    question: "Is my data stored permanently?",
    answer:
      "No, uploaded files and processed data are stored temporarily for your session. Unless you explicitly save your work to an account, all data is automatically deleted after 24 hours for security and privacy.",
  },
];

export function FAQSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden"
      style={{ padding: "clamp(3rem, 8vw, 5rem) 0" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white" />

      <div
        className="relative w-full max-w-4xl mx-auto"
        style={{ paddingInline: "clamp(1rem, 5vw, 3rem)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Support
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <div className="shrink-0">
              <Lottie
                animationData={faqAnim}
                loop
                autoplay
                style={{
                  width: "clamp(100px, 20vw, 150px)",
                  height: "clamp(100px, 20vw, 150px)",
                }}
              />
            </div>
            <h2
              className="font-bold text-slate-900 text-balance text-center sm:text-left"
              style={{ fontSize: "clamp(1.875rem, 4vw, 2.25rem)" }}
            >
              Frequently Asked Questions
            </h2>
          </div>
          <p
            className="text-slate-600 max-w-2xl mx-auto text-pretty"
            style={{ fontSize: "clamp(1rem, 1.5vw, 1.125rem)" }}
          >
            Quick answers to common questions about our service
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.5,
            delay: shouldReduceMotion ? 0 : 0.2,
          }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.3,
                  delay: shouldReduceMotion ? 0 : index * 0.1,
                }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="group border border-slate-200 rounded-2xl px-6 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300"
                  data-testid={`faq-item-${index}`}
                >
                  <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline py-5 group-hover:text-blue-600 transition-colors duration-200">
                    <span className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-sm font-bold text-slate-500 group-hover:text-blue-600 transition-colors duration-200">
                        {index + 1}
                      </span>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 pb-5 leading-relaxed pl-11">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.5,
            delay: shouldReduceMotion ? 0 : 0.4,
          }}
          className="mt-12 text-center"
        >
          <p className="text-slate-600">
            Still have questions?{" "}
            <a
              href="/contact"
              className="text-blue-600 font-medium hover:text-blue-700 underline underline-offset-4 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact our support team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
