"use client";

import type React from "react";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  RotateCcw,
} from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FileCode, Cpu, Upload, Download } from "lucide-react";

type ProcessingStage =
  | "idle"
  | "uploading"
  | "processing"
  | "extracting"
  | "complete";

// Demo data for standalone usage
const demoData = [
  {
    id: 1,
    date: "2024-01-15",
    voucher: "V001",
    customer_name: "John Doe",
    route: "NYC-LAX",
    pnr: "ABC123",
    flying_date: "2024-02-01",
    flight_status: "Coming",
    debit: 500,
    credit: 0,
    balance: 500,
    customer_rate: 550,
    company_rate: 450,
    profit: 50,
    payment_status: "Paid",
  },
  {
    id: 2,
    date: "2024-01-16",
    voucher: "V002",
    customer_name: "Jane Smith",
    route: "LAX-SFO",
    pnr: "DEF456",
    flying_date: "2024-01-20",
    flight_status: "Gone",
    debit: 300,
    credit: 0,
    balance: 300,
    customer_rate: 350,
    company_rate: 280,
    profit: 20,
    payment_status: "Pending",
  },
  {
    id: 3,
    date: "2024-01-17",
    voucher: "V003",
    customer_name: "Bob Wilson",
    route: "SFO-SEA",
    pnr: "GHI789",
    flying_date: "2024-02-05",
    flight_status: "Coming",
    debit: 400,
    credit: 0,
    balance: 400,
    customer_rate: 450,
    company_rate: 380,
    profit: 20,
    payment_status: "Paid",
  },
  {
    id: 4,
    date: "2024-01-18",
    voucher: "V004",
    customer_name: "Alice Brown",
    route: "SEA-DEN",
    pnr: "JKL012",
    flying_date: "2024-01-25",
    flight_status: "Cancelled",
    debit: 0,
    credit: 250,
    balance: -250,
    customer_rate: 300,
    company_rate: 250,
    profit: 0,
    payment_status: "Refunded",
  },
  {
    id: 5,
    date: "2024-01-19",
    voucher: "V005",
    customer_name: "Charlie Davis",
    route: "DEN-CHI",
    pnr: "MNO345",
    flying_date: "2024-02-10",
    flight_status: "Coming",
    debit: 600,
    credit: 100,
    balance: 600,
    customer_rate: 650,
    company_rate: 550,
    profit: 50,
    payment_status: "Paid",
  },
  {
    id: 6,
    date: "2024-01-20",
    voucher: "V006",
    customer_name: "Eva Martinez",
    route: "CHI-MIA",
    pnr: "PQR678",
    flying_date: "2024-01-22",
    flight_status: "Gone",
    debit: 450,
    credit: 0,
    balance: 450,
    customer_rate: 500,
    company_rate: 420,
    profit: 30,
    payment_status: "Paid",
  },
  {
    id: 7,
    date: "2024-01-21",
    voucher: "V007",
    customer_name: "Frank Lee",
    route: "MIA-BOS",
    pnr: "STU901",
    flying_date: "2024-02-15",
    flight_status: "Coming",
    debit: 550,
    credit: 0,
    balance: 550,
    customer_rate: 600,
    company_rate: 500,
    profit: 50,
    payment_status: "Pending",
  },
];

interface UploadResponse {
  sessionId: string;
  filename: string;
  totalRecords: number;
  openingBalance: number | null;
  entries: typeof demoData;
  parsedRows: number;
  totalRows: number;
  summary: {
    totalBookings: number;
    totalRevenue: number;
    totalExpenses: number;
    comingFlights: number;
  };
}

export function DemoWidget() {
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [ariaStatus, setAriaStatus] = useState("");
  const shouldReduceMotion = useReducedMotion();

  const handleTryDemo = async () => {
    setStage("uploading");
    setResult(null);
    setAriaStatus("Uploading file...");

    await new Promise((resolve) =>
      setTimeout(resolve, shouldReduceMotion ? 100 : 800)
    );
    setStage("processing");
    setAriaStatus("Processing data and analyzing rows...");

    await new Promise((resolve) =>
      setTimeout(resolve, shouldReduceMotion ? 100 : 1000)
    );
    setStage("extracting");
    setAriaStatus("Extracting fields from your data...");

    await new Promise((resolve) =>
      setTimeout(resolve, shouldReduceMotion ? 100 : 800)
    );

    const summary = {
      totalBookings: demoData.length,
      totalRevenue: demoData.reduce((sum, row) => sum + (row.debit || 0), 0),
      totalExpenses: demoData.reduce((sum, row) => sum + (row.credit || 0), 0),
      comingFlights: demoData.filter((row) => row.flight_status === "Coming")
        .length,
    };

    const uploadResponse: UploadResponse = {
      sessionId: "demo-session-id",
      filename: "demo.csv",
      totalRecords: demoData.length,
      openingBalance: null,
      entries: demoData,
      parsedRows: demoData.length,
      totalRows: demoData.length,
      summary,
    };

    setStage("complete");
    setAriaStatus(
      `Processing complete! Parsed ${demoData.length} rows successfully.`
    );
    setResult(uploadResponse);
  };

  const handleReset = () => {
    setStage("idle");
    setResult(null);
    setAriaStatus("Demo reset. Ready for new upload.");
  };

  return (
    <section
      className="py-20 md:py-28 bg-slate-50 relative overflow-hidden"
      id="demo"
    >
      {/* Background decoration matching walkthrough */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-50" />

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
            Interactive Demo
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 text-balance">
            Try it without signup
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Experience the power of automated ledger processing with our
            interactive demo
          </p>
        </motion.div>

        <Card className="p-8 md:p-12 bg-white border-slate-200 shadow-lg rounded-2xl overflow-hidden">
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {ariaStatus}
          </div>
          <AnimatePresence mode="wait">
            {stage === "idle" && (
              <IdleState key="idle" onStart={handleTryDemo} />
            )}
            {stage === "uploading" && <UploadingAnimation key="uploading" />}
            {stage === "processing" && <ProcessingAnimation key="processing" />}
            {stage === "extracting" && <ExtractingAnimation key="extracting" />}
            {stage === "complete" && result && (
              <ResultsView
                key="complete"
                result={result}
                onReset={handleReset}
              />
            )}
          </AnimatePresence>
        </Card>
      </div>
    </section>
  );
}

function IdleState({ onStart }: { onStart: () => void }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      className="text-center"
    >
      <motion.div
        whileHover={shouldReduceMotion ? {} : { scale: 0.98 }}
        className="border-2 border-dashed border-slate-300 rounded-2xl p-12 mb-8 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
        onClick={onStart}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onStart()}
        aria-label="Click to start demo upload"
        data-testid="demo-upload-zone"
      >
        <div className="flex flex-col items-center gap-6">
          {/* Lottie Upload Animation */}
          <div className="w-32 h-32 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <DotLottieReact
              src="/lottie/upload.json"
              loop
              autoplay
              className="absolute inset-0 w-full h-full"
            />
            <FileCode className="relative z-20 w-10 h-10 text-slate-700 opacity-80" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-slate-900 group-hover:text-blue-700 transition-colors">
              Drop sample file here
            </h3>
            <p className="text-slate-600">or click to start the demo</p>
          </div>
        </div>
      </motion.div>
      <Button
        size="lg"
        onClick={onStart}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
        data-testid="button-start-demo"
      >
        Start Demo
      </Button>
    </motion.div>
  );
}

function UploadingAnimation() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="text-center py-16"
      data-testid="stage-uploading"
    >
      <div className="w-32 h-32 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
        <DotLottieReact
          src="/lottie/upload.json"
          loop
          autoplay
          className="absolute inset-0 w-full h-full"
        />

        <Upload className="relative z-20 w-10 h-10 text-slate-700 opacity-80" />
      </div>
      <h3
        className="text-xl font-semibold mb-3 text-slate-900"
        data-testid="text-uploading"
      >
        Uploading file...
      </h3>
      <p className="text-slate-600">Preparing your data for processing</p>
      {/* Progress indicator */}
      <div className="mt-6 w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
        <motion.div
          className="h-full bg-blue-600 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: shouldReduceMotion ? 0.1 : 0.8,
            ease: "easeOut",
          }}
        />
      </div>
    </motion.div>
  );
}

function ProcessingAnimation() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center py-16"
      data-testid="stage-processing"
    >
      <div className="w-32 h-32 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6 relative">
        <DotLottieReact
          src="/lottie/process.json"
          loop
          autoplay
          className="absolute inset-0 w-full h-full"
        />
        <Cpu className="relative z-20 w-10 h-10 text-slate-700 opacity-80" />
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-2xl bg-purple-400/20 animate-ping" />
      </div>
      <h3
        className="text-xl font-semibold mb-3 text-slate-900"
        data-testid="text-processing"
      >
        Processing data...
      </h3>
      <p className="text-slate-600">Analyzing rows and detecting patterns</p>
      {/* Progress indicator */}
      <div className="mt-6 w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
        <motion.div
          className="h-full bg-purple-600 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: shouldReduceMotion ? 0.1 : 1,
            ease: "easeOut",
          }}
        />
      </div>
    </motion.div>
  );
}

function ExtractingAnimation() {
  const shouldReduceMotion = useReducedMotion();
  const fields = ["PNR", "Customer", "Date", "Route", "Status", "Amount"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center py-16"
      data-testid="stage-extracting"
    >
      <div className="w-32 h-32 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
        <DotLottieReact
          src="/lottie/analyze.json"
          loop
          autoplay
          className="absolute inset-0 w-full h-full"
        />
        <Download className="relative z-20 w-10 h-10 text-slate-700 opacity-80" />
      </div>
      <h3
        className="text-xl font-semibold mb-6 text-slate-900"
        data-testid="text-extracting"
      >
        Extracting fields...
      </h3>
      <div className="flex flex-wrap gap-3 justify-center max-w-md mx-auto">
        {fields.map((field, i) => (
          <motion.div
            key={field}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.2,
              delay: shouldReduceMotion ? 0 : i * 0.1,
              type: "spring",
              stiffness: 200,
            }}
          >
            <Badge
              variant="secondary"
              className="text-sm px-4 py-2 bg-green-100 text-green-700 border border-green-200"
              data-testid={`field-badge-${field.toLowerCase()}`}
            >
              {field}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ResultsView({
  result,
  onReset,
}: {
  result: UploadResponse;
  onReset: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const coming = result.entries.filter(
    (e) => e.flight_status === "Coming"
  ).length;
  const gone = result.entries.filter((e) => e.flight_status === "Gone").length;
  const cancelled = result.entries.filter(
    (e) => e.flight_status === "Cancelled"
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
      data-testid="stage-complete"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle2
              className="h-8 w-8 text-green-600"
              data-testid="icon-success"
            />
          </div>
          <div>
            <h3
              className="text-xl font-semibold text-slate-900"
              data-testid="text-complete"
            >
              Processing complete!
            </h3>
            <p
              className="text-sm text-slate-600"
              data-testid="text-parsed-rows"
            >
              Parsed {result.parsedRows} of {result.totalRows} rows successfully
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onReset}
          className="gap-2 border-slate-300 hover:bg-slate-100 bg-transparent"
          data-testid="button-reset-demo"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          icon={<Calendar className="h-5 w-5 text-blue-600" />}
          label="Total Bookings"
          value={result.summary.totalBookings}
          color="blue"
          delay={0}
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          label="Revenue"
          value={`$${result.summary.totalRevenue.toLocaleString()}`}
          color="green"
          delay={0.1}
        />
        <SummaryCard
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          label="Expenses"
          value={`$${result.summary.totalExpenses.toLocaleString()}`}
          color="red"
          delay={0.2}
        />
        <SummaryCard
          icon={<Users className="h-5 w-5 text-purple-600" />}
          label="Coming Flights"
          value={coming}
          color="purple"
          delay={0.3}
        />
      </div>

      {/* Flight Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatusCard status="Coming" count={coming} color="green" />
        <StatusCard status="Gone" count={gone} color="amber" />
        <StatusCard status="Cancelled" count={cancelled} color="red" />
      </div>

      {/* Sample Entries Table */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-white">
          <h4 className="font-semibold text-slate-900">Sample Entries</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Voucher
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Route
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  PNR
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Flight Date
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">
                  Debit
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">
                  Credit
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">
                  Profit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {result.entries.slice(0, 5).map((entry, i) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {entry.date}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{entry.voucher}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {entry.customer_name}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{entry.route}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {entry.pnr}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {entry.flying_date}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        entry.flight_status === "Coming"
                          ? "default"
                          : entry.flight_status === "Gone"
                          ? "secondary"
                          : "destructive"
                      }
                      className={`text-xs ${
                        entry.flight_status === "Coming"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : entry.flight_status === "Gone"
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                          : "bg-red-100 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      {entry.flight_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    ${entry.debit}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    ${entry.credit}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    ${entry.profit}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "blue" | "green" | "red" | "purple";
  delay: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const bgColors = {
    blue: "bg-blue-50 border-blue-100",
    green: "bg-green-50 border-green-100",
    red: "bg-red-50 border-red-100",
    purple: "bg-purple-50 border-purple-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
        delay: shouldReduceMotion ? 0 : delay,
      }}
    >
      <Card className={`p-5 ${bgColors[color]} border shadow-none`}>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-medium text-slate-600">{label}</span>
        </div>
        <p
          className="text-2xl font-bold text-slate-900"
          data-testid={`summary-${label.toLowerCase().replace(" ", "-")}`}
        >
          {value}
        </p>
      </Card>
    </motion.div>
  );
}

function StatusCard({
  status,
  count,
  color,
}: {
  status: string;
  count: number;
  color: "green" | "amber" | "red";
}) {
  const colorClasses = {
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      dot: "bg-green-500",
      text: "text-green-800",
      badge: "bg-green-100 text-green-900",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      dot: "bg-amber-500",
      text: "text-amber-800",
      badge: "bg-amber-100 text-amber-900",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      dot: "bg-red-500",
      text: "text-red-800",
      badge: "bg-red-100 text-red-900",
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={`flex items-center justify-between p-4 ${colors.bg} rounded-xl border ${colors.border}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 ${colors.dot} rounded-full shadow-sm`} />
        <span className={`text-sm font-medium ${colors.text}`}>{status}</span>
      </div>
      <span
        className={`text-sm font-bold ${colors.badge} px-3 py-1 rounded-full`}
      >
        {count}
      </span>
    </div>
  );
}
