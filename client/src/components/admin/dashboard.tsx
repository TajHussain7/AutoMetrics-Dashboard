import { Users, HardDrive, MessageSquare, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import adminApiClient from "@/lib/admin-api-client";
import { useToast } from "@/hooks/use-toast";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <Card className={`p-6 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div className="text-4xl opacity-20">{icon}</div>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    openQueries: 0,
    pendingReviews: 0,
    totalStorageUsed: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  //   const token = localStorage.getItem("token");
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApiClient.get("/dashboard/stats");
        setStats({
          totalUsers: response.data.totalUsers,
          openQueries: response.data.openQueries,
          pendingReviews: response.data.pendingReviews,
          totalStorageUsed: response.data.totalStorageUsed,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard statistics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome to your admin panel</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Users size={40} />}
              label="Total Users"
              value={stats.totalUsers}
              color="bg-gradient-to-br from-blue-50 to-blue-100"
            />
            <StatCard
              icon={<HardDrive size={40} />}
              label="Total Storage Used"
              value={`${stats.totalStorageUsed} GB`}
              color="bg-gradient-to-br from-green-50 to-green-100"
            />
            <StatCard
              icon={<MessageSquare size={40} />}
              label="Open Queries"
              value={stats.openQueries}
              color="bg-gradient-to-br from-orange-50 to-orange-100"
            />
            <StatCard
              icon={<Star size={40} />}
              label="Pending Reviews"
              value={stats.pendingReviews}
              color="bg-gradient-to-br from-purple-50 to-purple-100"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Quick Stats
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Active Sessions</span>
                  <span className="font-bold text-slate-900">—</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-slate-200">
                  <span className="text-slate-600">Total Files Processed</span>
                  <span className="font-bold text-slate-900">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Average Response Time</span>
                  <span className="font-bold text-slate-900">—</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                System Health
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-slate-600">Database: Healthy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-slate-600">API Server: Healthy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-slate-600">Storage: Healthy</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
