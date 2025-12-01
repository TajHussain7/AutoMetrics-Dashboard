"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAnnouncements } from "@/contexts/announcement-context";
import { Megaphone, ArrowLeft, Check, Clock, User } from "lucide-react";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: { fullName: string; email: string };
  read: boolean;
}

export default function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { setUnreadCount } = useAnnouncements();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      setError(null);
      const res = await fetch("/api/users/announcements?page=1&limit=10", {
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Announcements fetch failed:", res.status, text);
        setError(text || `HTTP ${res.status}`);
        toast({
          title: "Error",
          description: "Failed to load announcements",
          variant: "destructive",
        });
        setAnnouncements([]);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) setAnnouncements(data);
      else if (data && Array.isArray(data.announcements))
        setAnnouncements(data.announcements);
      else setAnnouncements([]);
    } catch (err: any) {
      console.error("Failed to fetch announcements:", err);
      setError(err?.message || String(err));
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive",
      });
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    try {
      const res = await fetch(`/api/users/announcements/${id}/read`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to mark read");

      setAnnouncements((prev) =>
        prev.map((a) => (a._id === id ? { ...a, read: true } : a))
      );

      const unreadCount = announcements.filter((a) => !a.read).length - 1;
      setUnreadCount(Math.max(0, unreadCount));
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to mark announcement as read",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">Loading announcements...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-l-4 border-red-500">
        <p className="text-sm text-red-600">
          Error loading announcements: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 -mt-6 -mx-6 mb-6 rounded-t-2xl" />

      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Announcements</h3>
            <p className="text-sm text-slate-500">
              {announcements.length} total announcements
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="rounded-xl border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600">No announcements yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Check back later for updates
          </p>
        </div>
      ) : (
        <ul className="space-y-4 mt-6">
          {announcements.map((a) => (
            <li
              key={a._id}
              className={`relative p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                a.read
                  ? "bg-slate-50/50 border-slate-100"
                  : "bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200 shadow-md"
              }`}
            >
              {!a.read && (
                <div className="absolute top-5 left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full" />
              )}

              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-lg">
                    {a.title}
                  </div>
                  <div className="text-slate-600 mt-2 leading-relaxed">
                    {a.content}
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                      <User className="w-3 h-3" />
                      {a.created_by?.fullName || "System"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {a.read ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Read
                    </span>
                  ) : (
                    <button
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl"
                      onClick={() => markRead(a._id)}
                    >
                      <Check className="w-4 h-4" />
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
