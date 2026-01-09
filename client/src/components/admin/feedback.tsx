"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Star,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { useLocation } from "wouter";

function getApiUrl(path: string): string {
  const apiBase = import.meta.env.VITE_API_URL ?? "";
  return apiBase ? `${apiBase}${path}` : path;
}

type FeedbackItem = {
  _id: string;
  name?: string;
  email?: string;
  type: string;
  rating?: number;
  message?: string;
  status: string;
  created_at?: string;
  user_id?: { _id: string; name?: string; email?: string } | null;
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const fetchFeedback = async (bustCache = false) => {
    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = {};
      if (bustCache) headers["Cache-Control"] = "no-cache";

      const res = await axios.get(getApiUrl("/api/feedback"), {
        withCredentials: true,
        headers,
      });

      if (res?.data?.success) {
        setFeedback(res.data.feedback || []);
      } else {
        setError("Failed to fetch feedback");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Fetch error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const stats = {
    total: feedback.length,
    averageRating:
      feedback.length > 0
        ? Math.round(
            (feedback.reduce((s, f) => s + (f.rating || 0), 0) /
              feedback.filter((f) => typeof f.rating === "number").length ||
              0) * 10
          ) / 10
        : 0,
    byStatus: feedback.reduce((acc: Record<string, number>, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await axios.patch(
        getApiUrl(`/api/feedback/${id}/status`),
        { status },
        { withCredentials: true }
      );
      if (res?.data?.success) {
        toast({ title: "Updated", description: "Feedback status updated" });
        setFeedback((prev) =>
          prev.map((f) => (f._id === id ? res.data.feedback : f))
        );
      } else {
        toast({ title: "Error", description: res?.data?.message || "Failed" });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || err?.message || "Update failed",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      New: "bg-blue-100 text-blue-700 border-blue-200",
      "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
      Resolved: "bg-green-100 text-green-700 border-green-200",
      Closed: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return colors[status] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/10 to-pink-300/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative p-6 max-w-7xl mx-auto">
        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 mb-6 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Feedback
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    View and manage user feedback
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fetchFeedback(false)}
                  variant="outline"
                  className="rounded-xl border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 shadow-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={() => fetchFeedback(true)}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/30"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Hard Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Total Feedback
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {stats.total}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Average Rating
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {stats.averageRating}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                By Status
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(stats.byStatus).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-600 font-medium capitalize">
                    {k}
                  </span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-12 text-center">
            <div className="inline-flex items-center gap-3 text-slate-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span className="font-medium">Loading feedback...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50/80 backdrop-blur-md rounded-2xl shadow-xl border border-red-200/50 p-6">
            <div className="text-red-700 font-medium">{error}</div>
          </div>
        )}

        {/* Feedback List */}
        {!loading && !error && (
          <div className="space-y-4">
            {feedback.length === 0 && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-12 text-center">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <div className="text-slate-500 font-medium">
                  No feedback yet.
                </div>
              </div>
            )}

            {feedback.map((f) => (
              <div
                key={f._id}
                className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            f.status
                          )}`}
                        >
                          {f.status}
                        </span>
                        <span className="text-sm text-slate-500">
                          {f.type} •{" "}
                          {new Date(f.created_at || "").toLocaleString()}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        {f.name || (f.user_id as any)?.name || "Anonymous"}
                      </div>
                      <div className="text-sm text-slate-600">
                        {f.email || (f.user_id as any)?.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={f.status}
                        onChange={(e) => updateStatus(f._id, e.target.value)}
                        className="min-w-[150px] rounded-xl border-2 border-slate-200 px-4 py-2 font-medium text-slate-700 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm bg-white"
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 rounded-xl p-4 mb-3 border border-slate-100">
                    <div className="text-slate-700 leading-relaxed">
                      {f.message}
                    </div>
                  </div>

                  {typeof f.rating === "number" && (
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-sm font-semibold rounded-full border border-amber-200 shadow-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        Rating: {f.rating}/5
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
