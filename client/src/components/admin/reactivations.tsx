"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Mail, CheckCircle2, Clock } from "lucide-react";
import adminApiClient from "@/lib/admin-api-client";
import { error } from "@/lib/logger";

function getApiUrl(path: string): string {
  const apiBase = import.meta.env.VITE_API_URL ?? "";
  return apiBase ? `${apiBase}${path}` : path;
}

type Msg = {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  responded?: boolean;
  response?: string;
  created_at?: string;
};

export default function AdminReactivations() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});

  const fetchMsgs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(getApiUrl("/api/contact"), {
        withCredentials: true,
      });
      if (res?.data?.success) {
        // Filter to only reactivation-type messages
        const all: Msg[] = res.data.messages || [];
        const filtered = all.filter((m) => {
          const s = (m.subject || "").toLowerCase();
          const b = (m.message || "").toLowerCase();
          return s.includes("reactivation") || b.includes("reactivate");
        });
        setMessages(filtered);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to load reactivation requests",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMsgs();
  }, []);

  const sendResponse = async (id: string) => {
    const response = (replyMap[id] || "").trim();
    if (!response)
      return toast({ title: "Error", description: "Response cannot be empty" });
    try {
      await axios.patch(
        getApiUrl(`/api/contact/${id}/respond`),
        { response },
        {
          withCredentials: true,
        }
      );
      toast({ title: "Sent", description: "Response sent" });
      fetchMsgs();
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to send response" });
    }
  };

  const reactivateUser = async (m: Msg) => {
    // Try several strategies to determine the target user id from the message:
    // 1) Newer messages: "User <id> (name/email) requests..." -> capture id from before paren
    // 2) Older messages: "User <name> requests..." -> attempt to find user by name/email via admin API
    const idParensMatch = m.message.match(/User\s+([^\s]+)\s*\(([^)]+)\)/i);
    const simpleMatch = m.message.match(/User\s+([^\s]+)\s+requests/i);
    let candidate = idParensMatch?.[1] || simpleMatch?.[1];

    // Helper to check for a Mongo ObjectId-ish string (24 hex chars)
    const looksLikeObjectId = (s?: string) =>
      !!s && /^[a-fA-F0-9]{24}$/.test(s);

    let userId: string | undefined;

    if (looksLikeObjectId(candidate)) {
      userId = candidate;
    } else {
      // Try to extract an email from the message
      const emailMatch = m.message.match(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
      const email = emailMatch?.[0];

      try {
        const res = await adminApiClient.get(`/users`);
        const users: any[] = res?.data || res || [];

        if (email) {
          const found = users.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
          );
          if (found) userId = found._id || found.id || found._id?.toString();
        }

        // If no email match or not found, try matching by name fragment
        if (!userId) {
          const nameCandidate = idParensMatch?.[2] || simpleMatch?.[1];
          if (nameCandidate) {
            const foundByName = users.find((u) => {
              const full = (u.fullName || u.full_name || "").toLowerCase();
              return full.includes(nameCandidate.toLowerCase());
            });
            if (foundByName) userId = foundByName._id || foundByName.id;
          }
        }
      } catch (err: any) {
        // Use centralized logger; in production this will be minimal
        error("Error fetching users while resolving reactivation target:", err);
      }
    }

    if (!userId) {
      return toast({
        title: "Error",
        description:
          "Could not determine user id from request. Try reactivating the user from the Users admin page.",
      });
    }

    try {
      await adminApiClient.patch(`/users/${userId}/status`, {
        status: "active",
      });
      toast({ title: "Success", description: "User reactivated" });
      // Refresh local list
      fetchMsgs();
      // Notify other admin pages to refresh (e.g., Users list)
      try {
        window.dispatchEvent(
          new CustomEvent("admin:user-status-changed", { detail: { userId } })
        );
      } catch (e) {
        /* no-op */
      }
    } catch (err: any) {
      // Log and toast; logger will redact details in production
      error("Failed reactivating user:", err);
      toast({ title: "Error", description: "Failed to reactivate user" });
    }
  };

  const pendingCount = messages.filter((m) => !m.responded).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,51,234,0.06),transparent_50%)]" />
      <div className="relative p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden mb-6">
          <div className="h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500" />
          <div className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Reactivation Requests
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    User-initiated reactivation requests
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-2 rounded-xl bg-white border border-slate-500 text-sm font-medium text-slate-700 shadow-sm">
                  <strong className="mr-2">{messages.length}</strong>Requests
                </div>
                <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-sm font-medium text-slate-700 shadow-sm">
                  <strong className="mr-2">{pendingCount}</strong>Pending
                </div>
                <Button
                  onClick={fetchMsgs}
                  variant="outline"
                  className="shadow-sm hover:shadow-md transition-shadow bg-transparent"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
              <p className="text-slate-600">Loading requests...</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m) => (
            <div
              key={m._id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500" />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="font-semibold text-slate-900">
                        {m.name}
                      </div>
                      <span className="text-sm text-slate-500 px-3 py-1 bg-slate-100 rounded-full">
                        {m.email}
                      </span>
                      {m.responded ? (
                        <span className="text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Responded
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </div>

                    {m.subject && (
                      <div className="text-sm font-medium text-slate-700 mt-2">
                        Subject: {m.subject}
                      </div>
                    )}

                    <div className="text-sm text-slate-600 mt-3 leading-relaxed">
                      {m.message}
                    </div>

                    {m.responded && m.response && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/50">
                        <div className="flex items-center gap-2 text-sm font-semibold text-green-800 mb-2">
                          <CheckCircle2 className="w-4 h-4" /> Admin Response
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed">
                          {m.response}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-slate-500 whitespace-nowrap">
                    {m.created_at
                      ? new Date(m.created_at).toLocaleString()
                      : ""}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Textarea
                    placeholder="Write a response..."
                    value={replyMap[m._id] || ""}
                    onChange={(e) =>
                      setReplyMap((s) => ({ ...s, [m._id]: e.target.value }))
                    }
                    rows={3}
                    className="resize-none border-slate-200 focus:border-red-500 focus:ring-red-500/20"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={() => sendResponse(m._id)}
                      className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 shadow-md hover:shadow-lg transition-all"
                    >
                      <Mail className="w-4 h-4 mr-2" /> Send Response
                    </Button>
                    <Button
                      onClick={() => reactivateUser(m)}
                      className="bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 shadow-md hover:shadow-lg transition-all"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" /> Reactivate User
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setReplyMap((s) => ({ ...s, [m._id]: "" }))
                      }
                      className="hover:bg-slate-100"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
