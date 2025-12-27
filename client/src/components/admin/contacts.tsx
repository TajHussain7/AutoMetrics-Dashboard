"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Mail, RefreshCw, Send, X, CheckCircle2, Clock } from "lucide-react";

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

export default function AdminContacts() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});

  const fetchMsgs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/contact");
      if (res?.data?.success) {
        // Exclude reactivation requests from Contact Messages list so
        // they only appear under the dedicated "Reactivation Requests" admin view.
        const all: Msg[] = res.data.messages || [];
        const filtered = all.filter((m) => {
          const s = (m.subject || "").toLowerCase();
          const b = (m.message || "").toLowerCase();
          return !(s.includes("reactivation") || b.includes("reactivate"));
        });
        setMessages(filtered);
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load messages" });
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
      await axios.patch(`/api/contact/${id}/respond`, { response });
      toast({ title: "Sent", description: "Response sent" });
      fetchMsgs();
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to send response" });
    }
  };

  const pendingCount = messages.filter((m) => !m.responded).length;
  const respondedCount = messages.filter((m) => m.responded).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,51,234,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />

      <div className="relative p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden mb-6">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
          <div className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Contact Messages
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Manage and respond to contact form submissions
                  </p>
                </div>
              </div>
              <Button
                onClick={fetchMsgs}
                variant="outline"
                disabled={loading}
                className="shadow-sm hover:shadow-md transition-shadow bg-transparent"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Messages</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {messages.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center shadow-md">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Pending</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {pendingCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Responded</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {respondedCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-slate-600">Loading messages...</p>
            </div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-slate-600 text-center">No messages yet.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m) => (
            <div
              key={m._id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
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
                          <CheckCircle2 className="w-3 h-3" />
                          Responded
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
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
                          <CheckCircle2 className="w-4 h-4" />
                          Admin Response
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
                    className="resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={() => sendResponse(m._id)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Response
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setReplyMap((s) => ({ ...s, [m._id]: "" }))
                      }
                      className="hover:bg-slate-100"
                    >
                      <X className="w-4 h-4 mr-2" />
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
