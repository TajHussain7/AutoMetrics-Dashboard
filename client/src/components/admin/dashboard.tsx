"use client";

import type React from "react";

import {
  Users,
  HardDrive,
  MessageSquare,
  Star,
  Activity,
  TrendingUp,
  Mail,
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

function StatCard({
  icon,
  label,
  value,
  color,
  iconBg,
  subtitle,
}: StatCardProps & { subtitle?: string | React.ReactNode }) {
  return (
    <Card
      className={`relative overflow-hidden p-6 ${color} bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
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
    totalUploadedFiles: 0,
    totalQueries: 0,
    newQueries: 0,
    openQueries: 0,
    reactivationTotal: 0,
    reactivationPending: 0,
    contactTotal: 0,
    contactPending: 0,
    avgQueryResponseMinutes: 0,
    pendingReviews: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApiClient.get("/dashboard/stats");
        console.debug("/dashboard/stats response:", response.data);
        setStats({
          totalUsers: Number(response.data.totalUsers) || 0,
          openQueries: Number(response.data.openQueries) || 0,
          pendingReviews: Number(response.data.pendingReviews) || 0,
          totalStorageUsed: Number(response.data.totalStorageUsed) || 0,
          totalUploadedFiles: Number(response.data.totalUploadedFiles) || 0,
          totalQueries: Number(response.data.totalQueries) || 0,
          newQueries: Number(response.data.newQueries) || 0,
          reactivationTotal: Number(response.data.reactivationTotal) || 0,
          reactivationPending: Number(response.data.reactivationPending) || 0,
          contactTotal: Number(response.data.contactTotal) || 0,
          contactPending: Number(response.data.contactPending) || 0,
          avgQueryResponseMinutes:
            Number(response.data.avgQueryResponseMinutes) || 0,
        });
      } catch (error: any) {
        console.error("Error fetching stats:", error?.response || error);
        toast({
          title: "Error",
          description:
            error?.response?.data?.message ||
            "Failed to fetch dashboard statistics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Real-time updates: refresh when relevant events arrive
    const onQueryCreated = () => fetchStats();
    const onQueryDeleted = () => fetchStats();
    const onContactCreated = () => fetchStats();
    const onAccountChange = () => fetchStats();

    window.addEventListener("query:created", onQueryCreated);
    window.addEventListener("query:deleted", onQueryDeleted);
    window.addEventListener("contact:created", onContactCreated);
    window.addEventListener("admin:user-status-changed", onAccountChange);

    return () => {
      window.removeEventListener("query:created", onQueryCreated);
      window.removeEventListener("query:deleted", onQueryDeleted);
      window.removeEventListener("contact:created", onContactCreated);
      window.removeEventListener("admin:user-status-changed", onAccountChange);
    };
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
              subtitle={`${stats.totalUploadedFiles} uploaded files`}
              color="hover:border-green-300"
              iconBg="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              icon={<MessageSquare className="w-6 h-6 text-white" />}
              label="New Queries"
              value={stats.newQueries}
              subtitle={`${stats.totalQueries} total queries`}
              color="hover:border-orange-300"
              iconBg="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <StatCard
              icon={<Mail className="w-6 h-6 text-white" />}
              label="Reactivation Requests"
              value={stats.reactivationPending}
              subtitle={`${stats.reactivationTotal} total`}
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
                  <span className="text-slate-600">Total Uploaded Files</span>
                  <span className="font-bold text-slate-900">
                    {stats.totalUploadedFiles}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors border-t border-slate-100">
                  <span className="text-slate-600">Average Query Response</span>
                  <span className="font-bold text-slate-900">
                    {stats.avgQueryResponseMinutes} min
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors border-t border-slate-100">
                  <span className="text-slate-600">
                    Contact Messages (pending)
                  </span>
                  <span className="font-bold text-slate-900">
                    {stats.contactPending}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
