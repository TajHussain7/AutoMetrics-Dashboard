import { TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTravelData } from "@/contexts/travel-data-context";
import { calculateDashboardMetrics } from "@/lib/data-processing";

export default function SummaryCards() {
  const { travelData } = useTravelData();
  const metrics = calculateDashboardMetrics(travelData);

  const cards = [
    {
      title: "Total Bookings",
      value: metrics.totalBookings.toLocaleString(),
      icon: TrendingUp,
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconColor: "text-white",
      accentColor: "from-blue-500/10 to-blue-600/5",
      borderAccent: "group-hover:border-blue-300",
    },
    {
      title: "Total Profit",
      value:
        travelData.length > 0
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(metrics.totalProfit)
          : "$0.00",
      icon: BarChart3,
      iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
      iconColor: "text-white",
      accentColor: "from-orange-500/10 to-orange-600/5",
      borderAccent: "group-hover:border-orange-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl ${card.borderAccent}`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />

            <CardContent
              className="relative"
              style={{ padding: "clamp(1rem, 3vw, 1.5rem)" }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2 tracking-widest uppercase">
                    {card.title}
                  </p>
                  <p
                    className="font-bold text-slate-900 tracking-tight truncate"
                    style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)" }}
                  >
                    {card.value}
                  </p>
                </div>
                <div
                  className={`${card.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0`}
                  style={{
                    width: "clamp(3rem, 8vw, 3.5rem)",
                    height: "clamp(3rem, 8vw, 3.5rem)",
                  }}
                >
                  <Icon
                    className={`${card.iconColor}`}
                    style={{
                      width: "clamp(1.5rem, 4vw, 1.75rem)",
                      height: "clamp(1.5rem, 4vw, 1.75rem)",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
