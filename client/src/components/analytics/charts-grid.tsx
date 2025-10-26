import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
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

export default function ChartsGrid() {
  const { travelData } = useTravelData();
  const chartData = prepareChartData(travelData);

  // Build profit datasets directly from travelData so we include negative profits
  const profitData = (travelData || [])
    .map((item) => ({
      pnr: item.pnr || "N/A",
      profit: parseFloat((item.profit?.toString() || "0").replace(/,/g, "")),
      customer_name: item.customer_name || "Unknown",
    }))
    .filter((d) => d.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 20);

  const lossData = (travelData || [])
    .map((item) => ({
      pnr: item.pnr || "N/A",
      profit: parseFloat((item.profit?.toString() || "0").replace(/,/g, "")),
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
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="text-center py-12">
              <p className="text-lg text-slate-600 mb-2">
                No data available for analytics
              </p>
              <p className="text-sm text-slate-500">
                Upload travel data to see charts and analytics here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
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
    <div id="analytics-content" className="space-y-6">
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h3 className="text-lg font-semibold text-slate-800">
              Analytics & Reports
            </h3>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4 md:p-6">
            <h4 className="text-lg font-semibold text-slate-800 mb-4">
              Rates Comparison by Month
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.monthlyRevenue}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(100, 116, 139, 0.4)"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(215, 13%, 65%)"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(215, 13%, 65%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid hsl(210, 40%, 90%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`$${value}`, ""]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="customer_rate"
                    stroke={COLORS.blue}
                    strokeWidth={2}
                    name="Customer Rate"
                  />
                  <Line
                    type="monotone"
                    dataKey="company_rate"
                    stroke={COLORS.orange}
                    strokeWidth={2}
                    name="Company Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <h4 className="text-lg font-semibold text-slate-800 mb-4">
              Flight Status Overview
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={flightStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    {flightStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-4 md:p-6">
            <h4 className="text-lg font-semibold text-slate-800 mb-4">
              Top Profitable Bookings by PNR
            </h4>
            <div className="text-sm text-slate-600 mb-3">
              {profitData.length > 0 ? (
                <>
                  Showing {profitData.length} loss-making bookings — min:{" "}
                  {lossData.length > 0
                    ? `$${Math.min(...profitData.map((d) => d.profit))}`
                    : "N/A"}
                  , max:{" "}
                  {lossData.length > 0
                    ? `$${Math.max(...profitData.map((d) => d.profit))}`
                    : "N/A"}
                </>
              ) : (
                "No Profit-making bookings"
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
                    stroke="rgba(100, 116, 139, 0.5)"
                    horizontal={true}
                    vertical={true}
                  />
                  <XAxis
                    dataKey="pnr"
                    type="category"
                    stroke={COLORS.slate}
                    fontSize={12}
                  />
                  <YAxis
                    dataKey="profit"
                    type="number"
                    stroke={COLORS.slate}
                    fontSize={12}
                    tickFormatter={(v) => `$${v}`}
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
                      backgroundColor: "white",
                      border: "1px solid hsl(210, 40%, 90%)",
                      borderRadius: "8px",
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
                    const maxProfit = len > 0 ? profits[profits.length - 1] : 0;

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

        <Card className="lg:col-span-3">
          <CardContent className="p-4 md:p-6">
            <h4 className="text-lg font-semibold text-slate-800 mb-4">
              Loss-making Bookings by PNR
            </h4>
            {
              // small debug summary to make sure data exists and to show min/max
            }
            <div className="text-sm text-slate-600 mb-3">
              {lossData.length > 0 ? (
                <>
                  Showing {lossData.length} loss-making bookings — min:{" "}
                  {lossData.length > 0
                    ? `$${Math.min(...lossData.map((d) => d.profit))}`
                    : "N/A"}
                  , max:{" "}
                  {lossData.length > 0
                    ? `$${Math.max(...lossData.map((d) => d.profit))}`
                    : "N/A"}
                </>
              ) : (
                "No Loss-making bookings"
              )}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 40, right: 30, bottom: 40, left: 30 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(100, 116, 139, 0.5)"
                    horizontal={true}
                    vertical={true}
                  />
                  <XAxis
                    dataKey="pnr"
                    type="category"
                    stroke={COLORS.slate}
                    fontSize={12}
                  />
                  <YAxis
                    dataKey="profit"
                    type="number"
                    stroke={COLORS.slate}
                    fontSize={12}
                    tickFormatter={(v) => `$${v}`}
                    // Auto-scale Y axis for losses with consistent grid
                    domain={[lossDomainMin, lossDomainMax]}
                    tickCount={8}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid hsl(210, 40%, 90%)",
                      borderRadius: "8px",
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
      </div>
    </div>
  );
}
