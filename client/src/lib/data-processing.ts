import type { TravelData } from "@shared/schema";
import { normalizeDate } from "./utils";

export interface DashboardMetrics {
  totalBookings: number;
  totalRevenue: number;
  totalProfit: number;
  activeAgents: number;
  profitMargin: number;
  recentActivity: Array<{
    id: string;
    type: "booking" | "payment" | "export";
    message: string;
    details: string;
    timestamp: Date;
  }>;
  // booking_status removed
}

export function calculateDashboardMetrics(
  data: TravelData[]
): DashboardMetrics {
  if (!data || data.length === 0) {
    return {
      totalBookings: 0,
      totalRevenue: 0,
      totalProfit: 0,
      activeAgents: 0,
      profitMargin: 0,
      recentActivity: [],
      // booking_status removed
    };
  }

  const totalBookings = data.length;
  const totalRevenue = data.reduce((sum, item) => {
    const debit = parseFloat(item.debit?.toString() || "0");
    return sum + debit;
  }, 0);

  const uniqueAgents = new Set(
    data.map((item) => item.voucher?.split("-")[0]).filter(Boolean)
  );
  const activeAgents = uniqueAgents.size;

  const totalProfit = data.reduce((sum, item) => {
    const profit = parseFloat(item.profit?.toString() || "0");
    // Include all profits, whether positive or negative
    return sum + profit;
  }, 0);

  const profitMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Generate recent activity from latest bookings
  const recentActivity = data
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      type: "booking" as const,
      message: `New booking processed`,
      details: `PNR: ${item.pnr || "N/A"} - ${item.customer_name || "Unknown"}`,
      timestamp: new Date(item.created_at),
    }));

  return {
    totalBookings,
    totalRevenue,
    totalProfit,
    activeAgents,
    profitMargin,
    recentActivity,
    // booking_status removed
  };
}

export interface ChartData {
  monthlyRevenue: Array<{
    month: string;
    customer_rate: number;
    company_rate: number;
  }>;
  profitTrends: Array<{
    pnr: string;
    profit: number;
    customer_name: string;
  }>;
  routePerformance: Array<{ route: string; bookings: number; revenue: number }>;
}

export function prepareChartData(data: TravelData[]): ChartData {
  if (!data || data.length === 0) {
    return {
      monthlyRevenue: [],
      profitTrends: [],
      routePerformance: [],
    };
  }

  // Monthly rates data
  const monthlyData = data.reduce(
    (acc, item) => {
      const date = new Date(item.date);
      const month = date.toLocaleString("default", { month: "short" });

      if (!acc[month]) {
        acc[month] = {
          customer_rate: 0,
          company_rate: 0,
          count: 0,
        };
      }

      const customer_rate = parseFloat(item.customer_rate?.toString() || "0");
      const company_rate = parseFloat(item.company_rate?.toString() || "0");

      if (customer_rate > 0 || company_rate > 0) {
        acc[month].customer_rate += customer_rate;
        acc[month].company_rate += company_rate;
        acc[month].count++;
      }

      return acc;
    },
    {} as Record<
      string,
      {
        customer_rate: number;
        company_rate: number;
        count: number;
      }
    >
  );

  const monthlyRevenue = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    customer_rate:
      data.count > 0 ? Math.round(data.customer_rate / data.count) : 0,
    company_rate:
      data.count > 0 ? Math.round(data.company_rate / data.count) : 0,
  }));

  // Agent performance data
  const agentData = data.reduce((acc, item) => {
    const agent = item.voucher?.split("-")[0] || "Unknown";

    if (!acc[agent]) {
      acc[agent] = { bookings: 0, profit: 0 };
    }

    acc[agent].bookings++;
    acc[agent].profit += parseFloat(item.profit?.toString() || "0");

    return acc;
  }, {} as Record<string, { bookings: number; profit: number }>);

  const agentPerformance = Object.entries(agentData)
    .sort(([, a], [, b]) => b.profit - a.profit)
    .slice(0, 10)
    .map(([agent, data]) => ({
      agent,
      bookings: data.bookings,
      profit: Math.round(data.profit),
    }));

  // Route performance data
  const routeData = data.reduce((acc, item) => {
    const route = item.route || "Unknown";

    if (!acc[route]) {
      acc[route] = { bookings: 0, revenue: 0 };
    }

    acc[route].bookings++;
    acc[route].revenue += parseFloat(item.debit?.toString() || "0");

    return acc;
  }, {} as Record<string, { bookings: number; revenue: number }>);

  const routePerformance = Object.entries(routeData)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(([route, data]) => ({
      route,
      bookings: data.bookings,
      revenue: Math.round(data.revenue),
    }));

  // Calculate profit trends by PNR (highest profit first)
  const profitTrends = data
    .filter((item) => parseFloat(item.profit?.toString() || "0") > 0) // Only show entries with profit
    .sort(
      (a, b) =>
        parseFloat(b.profit?.toString() || "0") -
        parseFloat(a.profit?.toString() || "0")
    ) // Sort by profit descending
    .slice(0, 20) // Show top 20 profitable entries
    .map((item) => ({
      pnr: item.pnr || "N/A",
      profit: parseFloat(item.profit?.toString() || "0"),
      customer_name: item.customer_name || "Unknown",
    }));

  return {
    monthlyRevenue,
    profitTrends,
    routePerformance,
  };
}

export function filterTravelData(
  data: TravelData[],
  filters: {
    search?: string;
    status?: string;
    dateRange?: { start: string; end: string };
  }
): TravelData[] {
  let filtered = [...data];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.customer_name?.toLowerCase().includes(searchLower) ||
        item.pnr?.toLowerCase().includes(searchLower) ||
        item.route?.toLowerCase().includes(searchLower) ||
        item.voucher?.toLowerCase().includes(searchLower)
    );
  }

  if (filters.status && filters.status !== "All Status") {
    // Filtering by booking status removed; keep all items or adapt to flight/payment status if needed
  }

  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter((item) => {
      const normalizedDate = normalizeDate(item.date);
      if (!normalizedDate) return false;

      const itemDate = new Date(normalizedDate);
      const startDate = new Date(start);
      const endDate = new Date(end);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  return filtered;
}

export function sortTravelData(
  data: TravelData[],
  sortBy: keyof TravelData,
  sortOrder: "asc" | "desc"
): TravelData[] {
  return [...data].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === "asc" ? comparison : -comparison;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });
}
