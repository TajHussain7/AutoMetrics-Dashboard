"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  PieChartIcon,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useTravelData } from "@/contexts/travel-data-context";
import { prepareChartData } from "@/lib/data-processing";
import { getFlightStatus } from "@/lib/utils";

// Color palette used across charts. These are simple Tailwind-like colors
// chosen for clarity and contrast in charts.
const COLORS = {
  slate: "hsl(215, 13%, 65%)",
  blue: "#3b82f6",
  orange: "#f97316",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function ChartsGrid() {
  const { travelData } = useTravelData();
  const chartData = prepareChartData(travelData);

  // Build profit datasets directly from travelData so we include negative profits
  const profitData = (travelData || [])
    .map((item) => ({
      pnr: item.pnr || "N/A",
      profit: Number.parseFloat(
        (item.profit?.toString() || "0").replace(/,/g, "")
      ),
      customer_name: item.customer_name || "Unknown",
    }))
    .filter((d) => d.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 20);

  const lossData = (travelData || [])
    .map((item) => ({
      pnr: item.pnr || "N/A",
      profit: Number.parseFloat(
        (item.profit?.toString() || "0").replace(/,/g, "")
      ),
      customer_name: item.customer_name || "Unknown",
    }))
    .filter((d) => d.profit < 0)
    .sort((a, b) => a.profit - b.profit) // most negative first
    .slice(0, 20);

  // precompute loss domain/padding with more generous padding
  const lossMin = lossData.length
    ? Math.min(...lossData.map((d) => d.profit))
    : 0;
  const lossMax = lossData.length
    ? Math.max(...lossData.map((d) => d.profit))
    : 0;
  const lossRange = Math.max(1, Math.abs(lossMax - lossMin));
  const lossPad = Math.max(100, Math.round(lossRange * 0.15));
  const lossDomainMin = lossMin - lossPad;
  const lossDomainMax = Math.min(0, lossMax + lossPad);

  if (travelData.length === 0) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 pointer-events-none" />
          <CardContent className="p-4 md:p-6 relative">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <p className="text-lg font-medium text-slate-700 mb-2">
                No data available for analytics
              </p>
              <p className="text-sm text-slate-500">
                Upload travel data to see charts and analytics here
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const flightStatusData = [
    {
      name: "Coming",
      value: travelData.filter((r) => getFlightStatus(r) === "Coming").length,
      color: COLORS.green,
    },
    {
      name: "Gone",
      value: travelData.filter((r) => getFlightStatus(r) === "Gone").length,
      color: COLORS.amber,
    },
    {
      name: "Cancelled",
      value: travelData.filter((r) => getFlightStatus(r) === "Cancelled")
        .length,
      color: COLORS.red,
    },
  ];

  return (
    <motion.div
      id="analytics-content"
      className="space-y-6 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none -z-10" />

      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <CardContent className="p-4 md:p-6 relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Analytics & Reports
                  </h3>
                  <p className="text-sm text-slate-500">
                    Visual insights from your travel data
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  {travelData.length} Records
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 xl:col-span-2"
        >
          <Card className="h-full rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-slate-800">
                  Rates Comparison by Month
                </h4>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.monthlyRevenue}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(100, 116, 139, 0.2)"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(215, 13%, 65%)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(215, 13%, 65%)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(8px)",
                      }}
                      formatter={(value) => [`$${value}`, ""]}
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: "16px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="customer_rate"
                      stroke={COLORS.blue}
                      strokeWidth={3}
                      name="Customer Rate"
                      dot={{ fill: COLORS.blue, strokeWidth: 0, r: 4 }}
                      activeDot={{
                        r: 6,
                        stroke: COLORS.blue,
                        strokeWidth: 2,
                        fill: "white",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="company_rate"
                      stroke={COLORS.orange}
                      strokeWidth={3}
                      name="Company Rate"
                      dot={{ fill: COLORS.orange, strokeWidth: 0, r: 4 }}
                      activeDot={{
                        r: 6,
                        stroke: COLORS.orange,
                        strokeWidth: 2,
                        fill: "white",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                  <PieChartIcon className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-slate-800">
                  Flight Status Overview
                </h4>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={flightStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      dataKey="value"
                      label={({ name, value }) => `${name} ${value}`}
                      labelLine={{
                        stroke: "hsl(215, 13%, 75%)",
                        strokeWidth: 1,
                      }}
                    >
                      {flightStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(8px)",
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800">
                    Top Profitable Bookings by PNR
                  </h4>
                </div>
                {profitData.length > 0 && (
                  <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    {profitData.length} Profitable
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-500 mb-3 bg-slate-50 rounded-lg px-3 py-2 inline-block">
                {profitData.length > 0 ? (
                  <>
                    Showing {profitData.length} profit-making bookings — min:{" "}
                    <span className="font-medium text-green-600">
                      ${Math.min(...profitData.map((d) => d.profit))}
                    </span>
                    , max:{" "}
                    <span className="font-medium text-green-600">
                      ${Math.max(...profitData.map((d) => d.profit))}
                    </span>
                  </>
                ) : (
                  "No profit-making bookings"
                )}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {
                    // Scatter plot: PNR on X (category), profit on Y (number).
                  }
                  <ScatterChart
                    margin={{ top: 40, right: 30, bottom: 40, left: 30 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(100, 116, 139, 0.2)"
                      horizontal={true}
                      vertical={true}
                    />
                    <XAxis
                      dataKey="pnr"
                      type="category"
                      stroke={COLORS.slate}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey="profit"
                      type="number"
                      stroke={COLORS.slate}
                      fontSize={12}
                      tickFormatter={(v) => `$${v}`}
                      tickLine={false}
                      axisLine={false}
                      // Auto-scale Y axis with consistent padding and more ticks
                      domain={[
                        (dataMin: number) => {
                          const profits = (profitData || []).map((d: any) =>
                            Number(d.profit || 0)
                          );
                          if (profits.length === 0) return 0;
                          const min = Math.min(...profits);
                          const max = Math.max(...profits);
                          const range = Math.max(1, max);
                          const pad = Math.max(100, Math.round(range * 0.21));
                          return Math.max(0, min - pad);
                        },
                        (dataMax: number) => {
                          const profits = (profitData || []).map((d: any) =>
                            Number(d.profit || 0)
                          );
                          if (profits.length === 0) return dataMax;
                          const max = Math.max(...profits);
                          const range = Math.max(1, max);
                          const pad = Math.max(100, Math.round(range * 0.15));
                          return max + pad;
                        },
                      ]}
                      tickCount={10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(8px)",
                      }}
                      formatter={(value: any, name: any) => {
                        if (name?.toLowerCase().includes("pnr")) {
                          return [value, "PNR"];
                        }
                        return [`$${value}`, "PROFIT"];
                      }}
                      labelFormatter={(label) => `PNR: ${label}`}
                    />

                    <Legend />
                    {
                      // Determine tertile thresholds for coloring
                    }
                    {(() => {
                      const data = profitData || [];
                      if (data.length === 0) {
                        return (
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            fill={COLORS.slate}
                            fontSize={14}
                          >
                            No Profit-making bookings found
                          </text>
                        );
                      }
                      const profits = data
                        .map((d) => Number(d.profit || 0))
                        .sort((a, b) => a - b);
                      const len = profits.length;
                      const lowCut = len > 0 ? profits[Math.floor(len / 3)] : 0;
                      const midCut =
                        len > 0 ? profits[Math.floor((2 * len) / 3)] : 0;
                      const maxProfit =
                        len > 0 ? profits[profits.length - 1] : 0;

                      const radiusFor = (p: number) => {
                        if (maxProfit <= 0) return 8;
                        const normalized = Math.max(0, p) / maxProfit;
                        return 6 + Math.round(normalized * 14); // 6..20
                      };

                      const renderPoint = (props: any) => {
                        const payload = props.payload || {};
                        const baseX = props.x ?? props.cx;
                        // Add small horizontal jitter based on PNR/id to prevent exact overlaps
                        const key = String(payload?.pnr || payload?.id || "");
                        let sum = 0;
                        for (let i = 0; i < key.length; i++)
                          sum = (sum * 31 + key.charCodeAt(i)) >>> 0;
                        const jitter = (sum % 21) - 10; // -10 to +10 pixels
                        const x = baseX + jitter;
                        const y = props.y ?? props.cy;
                        const p = Number(payload.profit || 0);
                        const fill =
                          p >= midCut
                            ? COLORS.green
                            : p >= lowCut
                            ? COLORS.orange
                            : COLORS.red;
                        const r = radiusFor(p);

                        return (
                          <g transform={`translate(${x}, ${y})`}>
                            <circle
                              cx={0}
                              cy={0}
                              r={r + 4}
                              fill={fill}
                              opacity={0.2}
                            />
                            <circle
                              cx={0}
                              cy={0}
                              r={r}
                              fill={fill}
                              opacity={0.95}
                            >
                              <animateTransform
                                attributeName="transform"
                                type="scale"
                                values="1;1.08;1"
                                dur="1.6s"
                                repeatCount="indefinite"
                              />
                            </circle>
                            <circle
                              cx={0}
                              cy={0}
                              r={Math.max(2, Math.floor(r / 3))}
                              fill="#ffffff"
                              opacity={0.6}
                            />
                          </g>
                        );
                      };

                      return (
                        <Scatter
                          name="Profit"
                          data={data}
                          shape={renderPoint}
                          animationDuration={900}
                          animationEasing="ease-out"
                        />
                      );
                    })()}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <CardContent className="p-4 md:p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
                    <TrendingDown className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800">
                    Loss-making Bookings by PNR
                  </h4>
                </div>
                {lossData.length > 0 && (
                  <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                    {lossData.length} Loss-making
                  </span>
                )}
              </div>
              {
                // small debug summary to make sure data exists and to show min/max
              }
              <div className="text-sm text-slate-500 mb-3 bg-slate-50 rounded-lg px-3 py-2 inline-block">
                {lossData.length > 0 ? (
                  <>
                    Showing {lossData.length} loss-making bookings — min:{" "}
                    <span className="font-medium text-red-600">
                      ${Math.min(...lossData.map((d) => d.profit))}
                    </span>
                    , max:{" "}
                    <span className="font-medium text-red-600">
                      ${Math.max(...lossData.map((d) => d.profit))}
                    </span>
                  </>
                ) : (
                  "No loss-making bookings"
                )}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 40, right: 30, bottom: 40, left: 30 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(100, 116, 139, 0.2)"
                      horizontal={true}
                      vertical={true}
                    />
                    <XAxis
                      dataKey="pnr"
                      type="category"
                      stroke={COLORS.slate}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey="profit"
                      type="number"
                      stroke={COLORS.slate}
                      fontSize={12}
                      tickFormatter={(v) => `$${v}`}
                      tickLine={false}
                      axisLine={false}
                      // Auto-scale Y axis for losses with consistent grid
                      domain={[
                        (dataMin: number) => {
                          const losses = (lossData || []).map((d: any) =>
                            Number(d.profit || 0)
                          );
                          if (losses.length === 0) return dataMin;
                          const min = Math.min(...losses); // should be negative
                          const max = Math.max(...losses); // likely closer to zero
                          const range = Math.abs(max - min);
                          const pad = Math.max(100, Math.round(range * 0.15));
                          return min - pad; // push further down
                        },
                        (dataMax: number) => {
                          const losses = (lossData || []).map((d: any) =>
                            Number(d.profit || 0)
                          );
                          if (losses.length === 0) return dataMax;
                          const max = Math.max(...losses);
                          const range = Math.abs(max - Math.min(...losses));
                          const pad = Math.max(100, Math.round(range * 0.1));
                          return max + pad; // should be near 0
                        },
                      ]}
                      tickCount={10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                        backdropFilter: "blur(8px)",
                      }}
                      formatter={(value: any, name: any) => {
                        if (name?.toLowerCase().includes("pnr")) {
                          return [value, "PNR"];
                        }
                        return [`$${value}`, "LOSS"];
                      }}
                      labelFormatter={(label) => `PNR: ${label}`}
                    />

                    <Legend />
                    {(() => {
                      const data = lossData || [];

                      if (data.length === 0) {
                        return (
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            fill={COLORS.slate}
                            fontSize={14}
                          >
                            No Loss-making bookings found
                          </text>
                        );
                      }

                      const losses = data
                        .map((d) => Math.abs(Number(d.profit || 0)))
                        .sort((a, b) => a - b);
                      const len = losses.length;
                      const lowCut = len > 0 ? losses[Math.floor(len / 3)] : 0;
                      const midCut =
                        len > 0 ? losses[Math.floor((2 * len) / 3)] : 0;
                      const maxLoss = len > 0 ? losses[losses.length - 1] : 0;

                      const radiusFor = (p: number) => {
                        if (maxLoss <= 0) return 8;
                        const normalized = Math.abs(p) / maxLoss;
                        return 6 + Math.round(normalized * 14); // 6..20
                      };

                      const renderPoint = (props: any) => {
                        const payload = props.payload || {};
                        const baseX = props.x ?? props.cx;
                        // Add small horizontal jitter based on PNR/id to prevent exact overlaps
                        const key = String(payload?.pnr || payload?.id || "");
                        let sum = 0;
                        for (let i = 0; i < key.length; i++)
                          sum = (sum * 31 + key.charCodeAt(i)) >>> 0;
                        const jitter = (sum % 21) - 10; // -10 to +10 pixels
                        const x = baseX + jitter;
                        const y = props.y ?? props.cy;
                        const loss = Math.abs(Number(payload.profit || 0));
                        // Color gets darker red as loss increases
                        const fill =
                          loss >= midCut
                            ? "#991b1b" // dark red
                            : loss >= lowCut
                            ? "#dc2626" // medium red
                            : "#ef4444"; // lighter red
                        const r = radiusFor(loss);

                        return (
                          <g transform={`translate(${x}, ${y})`}>
                            <circle
                              cx={0}
                              cy={0}
                              r={r + 4}
                              fill={fill}
                              opacity={0.2}
                            />
                            <circle
                              cx={0}
                              cy={0}
                              r={r}
                              fill={fill}
                              opacity={0.95}
                            >
                              <animateTransform
                                attributeName="transform"
                                type="scale"
                                values="1;1.08;1"
                                dur="1.6s"
                                repeatCount="indefinite"
                              />
                            </circle>
                            <circle
                              cx={0}
                              cy={0}
                              r={Math.max(2, Math.floor(r / 3))}
                              fill="#ffffff"
                              opacity={0.6}
                            />
                          </g>
                        );
                      };

                      return (
                        <Scatter
                          name="Loss"
                          data={data}
                          shape={renderPoint}
                          animationDuration={900}
                          animationEasing="ease-out"
                        />
                      );
                    })()}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
