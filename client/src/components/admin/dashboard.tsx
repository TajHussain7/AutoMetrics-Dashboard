"use client";

import type React from "react";

import {
  Users,
  HardDrive,
  MessageSquare,
  Star,
  Activity,
  Database,
  Server,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import adminApiClient from "@/lib/admin-api-client";
import { useToast } from "@/hooks/use-toast";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  iconBg: string;
}

function StatCard({ icon, label, value, color, iconBg }: StatCardProps) {
  return (
    <Card
      className={`relative overflow-hidden p-6 ${color} bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 ${iconBg} rounded-xl shadow-lg`}>{icon}</div>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStorageUsed: 0,
    openQueries: 0,
    pendingReviews: 0,
  });
  const { toast } = useToast();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-8">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full mb-8" />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        </div>
        <p className="text-slate-600 ml-14">
          Welcome to your admin control panel
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Users className="w-6 h-6 text-white" />}
              label="Total Users"
              value={stats.totalUsers}
              color="hover:border-blue-300"
              iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon={<HardDrive className="w-6 h-6 text-white" />}
              label="Total Storage Used"
              value={`${stats.totalStorageUsed} GB`}
              color="hover:border-green-300"
              iconBg="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon={<MessageSquare className="w-6 h-6 text-white" />}
              label="Open Queries"
              value={stats.openQueries}
              color="hover:border-orange-300"
              iconBg="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <StatCard
              icon={<Star className="w-6 h-6 text-white" />}
              label="Pending Reviews"
              value={stats.pendingReviews}
              color="hover:border-purple-300"
              iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Quick Stats
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className="text-slate-600">Active Sessions</span>
                  <span className="font-bold text-slate-900">—</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors border-t border-slate-100">
                  <span className="text-slate-600">Total Files Processed</span>
                  <span className="font-bold text-slate-900">—</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors border-t border-slate-100">
                  <span className="text-slate-600">Average Response Time</span>
                  <span className="font-bold text-slate-900">—</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  System Health
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Database className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-900 font-medium">Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">
                      Healthy
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Server className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-900 font-medium">
                      API Server
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">
                      Healthy
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <HardDrive className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-900 font-medium">Storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">
                      Healthy
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
