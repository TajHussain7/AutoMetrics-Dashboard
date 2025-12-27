"use client";

import { useState, useEffect } from "react";
import {
  MessageCircle,
  CheckCircle2,
  XCircle,
  Paperclip,
  Trash2,
  ImageIcon,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
} from "lucide-react";
import ConfirmModal from "@/components/dashboard/ConfirmModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import adminApiClient from "@/lib/admin-api-client";
import { queriesApi } from "@/lib/queries-api-client";
import { formatDistanceToNow } from "date-fns";

interface Query {
  _id: string;
  user_id: { _id: string; fullName: string; email: string };
  subject: string;
  message: string;
  status: "open" | "in-progress" | "answered" | "closed";
  messages?: Array<{
    _id?: string;
    author: "user" | "admin";
    message: string;
    attachments?: { filename: string; url: string }[];
    created_at: string;
    reactions?: Array<{ user: string; type: "like" | "dislike" }>;
  }>;
  reply?: string;
  reactions?: Array<{ user: string; type: "like" | "dislike" }>;
  created_at: string;
}

export default function QueriesPage() {
  const { user } = useAuth();
  const currentUserId = user ? (user as any)._id || (user as any).id : null;
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [replyAttachments, setReplyAttachments] = useState<any[]>([]);
  const ALLOWED_ATTACHMENT_TYPES = ["image/png", "image/jpeg"];
  const MAX_ATTACHMENT_SIZE = 1 * 1024 * 1024; // 1MB
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingQueryId, setDeletingQueryId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<
    Array<{ url: string; filename: string }>
  >([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  const [expandedAttachments, setExpandedAttachments] =
    useState<boolean>(false);
  const { toast } = useToast();

  const renderFormattedText = (text: string) => {
    const parts: Array<{ type: "text" | "bold" | "italic"; content: string }> =
      [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    const italicRegex = /\*(.+?)\*/g;

    const matches: Array<{
      type: "bold" | "italic";
      start: number;
      end: number;
      content: string;
    }> = [];

    let match: RegExpExecArray | null;
    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({
        type: "bold",
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
      });
    }

    while ((match = italicRegex.exec(text)) !== null) {
      const isBold = matches.some(
        (m) =>
          m.type === "bold" &&
          match!.index >= m.start &&
          match!.index + match![0].length <= m.end
      );
      if (!isBold && !match[0].startsWith("**")) {
        matches.push({
          type: "italic",
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
        });
      }
    }

    matches.sort((a, b) => a.start - b.start);

    let lastIndex = 0;
    for (const m of matches) {
      if (lastIndex < m.start) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, m.start),
        });
      }
      parts.push({ type: m.type, content: m.content });
      lastIndex = m.end;
    }

    if (lastIndex < text.length) {
      parts.push({ type: "text", content: text.substring(lastIndex) });
    }

    return (
      <>
        {parts.map((part, idx) => {
          if (part.type === "bold") {
            return (
              <strong key={idx} className="font-semibold">
                {part.content}
              </strong>
            );
          } else if (part.type === "italic") {
            return (
              <em key={idx} className="italic">
                {part.content}
              </em>
            );
          } else {
            return <span key={idx}>{part.content}</span>;
          }
        })}
      </>
    );
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async (params: any = {}) => {
    try {
      setLoading(true);
      const p = { ...params };
      if (filters.status) p.status = filters.status;
      if (filters.search) p.search = filters.search;
      const response = await adminApiClient.get("/queries", { params: p });
      setQueries(response.data.queries || response.data || []);
    } catch (error) {
      console.error("Error fetching queries:", error);
      toast({
        title: "Error",
        description: "Failed to fetch queries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!selectedQuery || !reply.trim()) {
      toast({
        title: "Validation Error",
        description: "Reply cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const attachments = [] as any[];
      for (const f of replyAttachments) {
        const res = await queriesApi.uploadAttachment(f.file);
        attachments.push(res);
      }

      await adminApiClient.patch(`/queries/${selectedQuery._id}/reply`, {
        reply,
        attachments,
      });
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      setReply("");
      setReplyAttachments([]);
      setSelectedQuery(null);
      fetchQueries();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const closeQuery = async (id: string) => {
    try {
      await adminApiClient.patch(`/queries/${id}/close`);
      toast({
        title: "Success",
        description: "Query closed successfully",
      });
      fetchQueries();
      setSelectedQuery(null);
    } catch (error) {
      console.error("Error closing query:", error);
      toast({
        title: "Error",
        description: "Failed to close query",
        variant: "destructive",
      });
    }
  };

  const deleteQuery = async (id: string | null) => {
    if (!id) return;
    try {
      await adminApiClient.delete(`/queries/${id}`);
      toast({ title: "Success", description: "Query deleted successfully" });

      if (selectedQuery?._id === id) setSelectedQuery(null);

      window.dispatchEvent(
        new CustomEvent("query:deleted", { detail: { queryId: id } })
      );

      fetchQueries();
    } catch (error) {
      console.error("Error deleting query:", error);
      toast({
        title: "Error",
        description: "Failed to delete query",
        variant: "destructive",
      });
    }
  };
  type QueryStatus = Query["status"];
  const refreshSelectedQuery = async (queryId: string) => {
    try {
      const res = await adminApiClient.get(`/queries/${queryId}`);
      setSelectedQuery(res.data);
    } catch (err) {
      console.error("Failed to refresh selected query:", err);
    }
  };

  const reactToQueryAsAdmin = async (
    queryId: string,
    type: "like" | "dislike"
  ) => {
    try {
      await adminApiClient.patch(`/queries/${queryId}/reactions`, { type });

      // ✅ always reload full query
      await refreshSelectedQuery(queryId);

      // ✅ keep list in sync
      fetchQueries();
    } catch (err) {
      console.error("Failed to react to query as admin:", err);
      toast({ title: "Failed to react" });
    }
  };

  const reactToMessageAsAdmin = async (
    queryId: string,
    messageId: string,
    type: "like" | "dislike"
  ) => {
    try {
      await adminApiClient.patch(
        `/queries/${queryId}/messages/${messageId}/reactions`,
        { type }
      );

      // ✅ reload populated query
      await refreshSelectedQuery(queryId);

      fetchQueries();
    } catch (err) {
      console.error("Failed to react to message as admin:", err);
      toast({ title: "Failed to react" });
    }
  };

  const statusConfig: Record<
    QueryStatus,
    {
      icon: any;
      color: string;
      bg: string;
      label: string;
    }
  > = {
    open: {
      icon: MessageCircle,
      color: "text-orange-600",
      bg: "bg-orange-100",
      label: "Open",
    },
    "in-progress": {
      icon: MessageCircle,
      color: "text-orange-600",
      bg: "bg-orange-100",
      label: "In Progress",
    },
    answered: {
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100",
      label: "Answered",
    },
    closed: {
      icon: XCircle,
      color: "text-slate-600",
      bg: "bg-slate-100",
      label: "Closed",
    },
  };

  return (
    <>
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600" />

      <div className="p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-screen">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Queries & Support
            </h1>
          </div>
          <p className="text-slate-600 ml-[60px]">
            Manage and respond to user queries
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                    User Queries
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        placeholder="Search subject or message"
                        value={filters.search}
                        onChange={(e) =>
                          setFilters((f) => ({ ...f, search: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={filters.status}
                        onChange={(e) =>
                          setFilters((f) => ({ ...f, status: e.target.value }))
                        }
                        className="rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"
                      >
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="answered">Answered</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <Button
                      onClick={() => fetchQueries()}
                      className="rounded-xl shadow-md hover:shadow-lg transition-shadow"
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters({ status: "", search: "" });
                        fetchQueries({});
                      }}
                      className="rounded-xl"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
                  <p className="mt-4 text-slate-600 text-sm">
                    Loading queries...
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
                  {queries.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                      <div className="p-4 bg-slate-100 rounded-full mb-4">
                        <MessageCircle className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium">
                        No queries found
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Try adjusting your filters
                      </p>
                    </div>
                  ) : (
                    queries.map((query) => {
                      const StatusIcon = statusConfig[query.status].icon;
                      return (
                        <div
                          key={query._id}
                          onClick={async () => {
                            try {
                              const res = await adminApiClient.get(
                                `/queries/${query._id}`
                              );
                              setSelectedQuery(res.data);
                            } catch (err) {
                              console.error(err);
                              toast({ title: "Failed to load query" });
                            }
                          }}
                          className={`p-6 cursor-pointer transition-all ${
                            selectedQuery?._id === query._id
                              ? "bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-600 shadow-md"
                              : "hover:bg-slate-50/80 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2.5 rounded-xl shadow-sm ${
                                  statusConfig[query.status].bg
                                }`}
                              >
                                <StatusIcon
                                  size={20}
                                  className={statusConfig[query.status].color}
                                />
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 text-lg">
                                  {query.subject}
                                </h3>
                                <p className="text-sm text-slate-600 mt-0.5">
                                  {query.user_id?.fullName ?? "Unknown user"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                                {new Date(
                                  query.created_at
                                ).toLocaleDateString()}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingQueryId(query._id);
                                  setDeleteModalOpen(true);
                                }}
                                title="Delete query"
                                className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-700 ml-[52px] line-clamp-2 leading-relaxed">
                            {renderFormattedText(query.message)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </Card>
          </div>

          <div>
            {selectedQuery ? (
              /* Enhanced query details card with glassmorphism */
              <Card className="p-6 sticky top-8 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                  <h3 className="text-xl font-bold text-slate-900">
                    Query Details
                  </h3>
                </div>

                <div className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200/50">
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-2">
                    Subject
                  </p>
                  <p className="text-slate-900 font-semibold text-lg mb-3">
                    {renderFormattedText(selectedQuery.subject)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="bg-white px-3 py-1.5 rounded-full border border-green-800">
                      {selectedQuery.user_id?.fullName ?? "Unknown user"}
                    </span>
                    <span className="bg-white px-3 py-1.5 rounded-full border border-green-800">
                      {selectedQuery.user_id?.email ?? "Unknown email"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {(() => {
                      const current = selectedQuery.reactions || [];
                      const existing = current.find(
                        (r) => String(r.user) === String(currentUserId)
                      );
                      const isLike = existing?.type === "like";
                      const isDislike = existing?.type === "dislike";

                      return (
                        <>
                          <button
                            onClick={() =>
                              reactToQueryAsAdmin(selectedQuery._id, "like")
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all shadow-sm hover:shadow-md ${
                              isLike
                                ? "text-green-600 bg-green-50 border-2 border-green-200"
                                : "text-slate-600 bg-white border border-slate-200 hover:border-green-300"
                            }`}
                            title="Like"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-xs font-semibold">
                              {selectedQuery.reactions?.filter(
                                (r) => r.type === "like"
                              ).length || 0}
                            </span>
                          </button>

                          <button
                            onClick={() =>
                              reactToQueryAsAdmin(selectedQuery._id, "dislike")
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all shadow-sm hover:shadow-md ${
                              isDislike
                                ? "text-red-600 bg-red-50 border-2 border-red-200"
                                : "text-slate-600 bg-white border border-slate-200 hover:border-red-300"
                            }`}
                            title="Dislike"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-xs font-semibold">
                              {selectedQuery.reactions?.filter(
                                (r) => r.type === "dislike"
                              ).length || 0}
                            </span>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-auto mb-6 px-1">
                  {(selectedQuery.messages || []).map((m, i) => {
                    const attachments = m.attachments || [];

                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          m.author === "admin"
                            ? "bg-gradient-to-br from-slate-50 to-slate-100 ml-6 border-slate-200 shadow-sm"
                            : "bg-gradient-to-br from-blue-50 to-purple-50 mr-6 border-blue-200 shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                                m.author === "admin"
                                  ? "bg-slate-500"
                                  : "bg-blue-500"
                              }`}
                            ></div>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                              {m.author === "admin"
                                ? "Support Team"
                                : selectedQuery.user_id?.fullName ??
                                  "Unknown user"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 bg-white/50 px-2 py-1 rounded-full">
                            {formatDistanceToNow(new Date(m.created_at), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                        <div className="mt-3 whitespace-pre-wrap text-slate-800 leading-relaxed">
                          {renderFormattedText(m.message)}
                        </div>

                        {attachments.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {attachments.map((a, idx) => {
                              const isImage = /(png|jpe?g|gif|bmp|webp)$/i.test(
                                a.url
                              );
                              return (
                                <a
                                  key={idx}
                                  className={`inline-flex items-center gap-2 text-xs transition-all hover:scale-105 ${
                                    isImage
                                      ? "p-0 rounded-xl overflow-hidden shadow-md hover:shadow-xl"
                                      : "px-3 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 border-2 border-blue-200 shadow-sm"
                                  }`}
                                  href={a.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={a.filename}
                                >
                                  {isImage ? (
                                    <img
                                      src={a.url || "/placeholder.svg"}
                                      alt={a.filename}
                                      className="w-32 h-20 object-cover"
                                    />
                                  ) : (
                                    <>
                                      <Paperclip className="h-4 w-4" />
                                      <span className="font-medium">
                                        {a.filename}
                                      </span>
                                    </>
                                  )}
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Show user reactions on admin messages (other-side badges) */}
                        {m.author === "admin" &&
                          (() => {
                            const other = (m as any).reactions || [];
                            const otherSide = other.filter(
                              (r: any) =>
                                String(r.user) !== String(currentUserId)
                            );
                            const otherLikes = otherSide.filter(
                              (r: any) => r.type === "like"
                            ).length;
                            const otherDislikes = otherSide.filter(
                              (r: any) => r.type === "dislike"
                            ).length;
                            if (!otherLikes && !otherDislikes) return null;
                            return (
                              <div className="mt-3 flex items-center gap-2">
                                {otherLikes > 0 && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-green-700 bg-green-50 text-xs">
                                    <ThumbsUp className="w-3 h-3" />
                                    <span>{otherLikes}</span>
                                  </div>
                                )}
                                {otherDislikes > 0 && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-red-700 bg-red-50 text-xs">
                                    <ThumbsDown className="w-3 h-3" />
                                    <span>{otherDislikes}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                        {m.author === "user" && (
                          <div className="mt-4 flex items-center gap-2">
                            {(() => {
                              const current = (m as any).reactions || [];
                              const existing = current.find(
                                (r: any) =>
                                  String(r.user) === String(currentUserId)
                              );
                              const isLike = existing?.type === "like";
                              const isDislike = existing?.type === "dislike";

                              return (
                                <>
                                  <button
                                    onClick={() =>
                                      reactToMessageAsAdmin(
                                        selectedQuery._id,
                                        (m as any)._id,
                                        "like"
                                      )
                                    }
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs font-semibold ${
                                      isLike
                                        ? "text-green-600 bg-green-100 border border-green-300"
                                        : "text-slate-600 bg-white border border-slate-200 hover:border-green-300"
                                    }`}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    {(m as any).reactions?.filter(
                                      (r: any) => r.type === "like"
                                    ).length || 0}
                                  </button>

                                  <button
                                    onClick={() =>
                                      reactToMessageAsAdmin(
                                        selectedQuery._id,
                                        (m as any)._id,
                                        "dislike"
                                      )
                                    }
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs font-semibold ${
                                      isDislike
                                        ? "text-red-600 bg-red-100 border border-red-300"
                                        : "text-slate-600 bg-white border border-slate-200 hover:border-red-300"
                                    }`}
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                    {(m as any).reactions?.filter(
                                      (r: any) => r.type === "dislike"
                                    ).length || 0}
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t-2 border-slate-200 space-y-4">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write your reply..."
                    className="rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-[100px]"
                  />
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:shadow-md transition-all text-sm font-semibold text-slate-700">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        Attach Images
                        <input
                          type="file"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const items: any[] = [];
                            for (const f of files) {
                              if (!ALLOWED_ATTACHMENT_TYPES.includes(f.type)) {
                                toast({
                                  title: "Invalid file type",
                                  description: `${f.name} is not a PNG or JPEG image`,
                                  variant: "destructive",
                                });
                                continue;
                              }
                              if (f.size > MAX_ATTACHMENT_SIZE) {
                                toast({
                                  title: "File too large",
                                  description: `${f.name} exceeds the 1MB limit`,
                                  variant: "destructive",
                                });
                                continue;
                              }
                              items.push({ filename: f.name, file: f });
                            }
                            if (items.length)
                              setReplyAttachments((a) => [...a, ...items]);
                            (e.target as HTMLInputElement).value = "";
                          }}
                          accept="image/png,image/jpeg"
                          className="hidden"
                        />
                      </label>
                      <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200 font-medium">
                        PNG, JPEG • Max 1MB each
                      </div>
                    </div>

                    {replyAttachments.length > 0 && (
                      <div className="bg-slate-50 rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm">
                        <button
                          onClick={() =>
                            setExpandedAttachments(!expandedAttachments)
                          }
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-all"
                        >
                          <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-blue-600" />
                            Attached Images ({replyAttachments.length})
                          </span>
                          <span className="text-slate-500 font-bold">
                            {expandedAttachments ? "▼" : "▶"}
                          </span>
                        </button>
                        {expandedAttachments && (
                          <div className="px-4 py-3 border-t-2 border-slate-200 space-y-2 bg-white">
                            {replyAttachments.map((a, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between gap-2 bg-gradient-to-r from-slate-50 to-blue-50 px-3 py-2.5 rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-all shadow-sm"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <ImageIcon className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <span className="truncate text-sm text-slate-700 font-medium">
                                    {a.filename}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    setReplyAttachments((cur) =>
                                      cur.filter((_, idx) => idx !== i)
                                    )
                                  }
                                  title="Remove file"
                                  className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                                >
                                  <span className="font-bold text-sm">✕</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedQuery(null)}
                      className="rounded-xl"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={sendReply}
                      disabled={submitting}
                      className="rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                      {submitting ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>

                {selectedQuery.status !== "closed" && (
                  <div className="mt-4">
                    <Button
                      onClick={() => closeQuery(selectedQuery._id)}
                      variant="outline"
                      className="w-full rounded-xl border-2 hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Close Query
                    </Button>
                  </div>
                )}
                <div className="mt-3">
                  <Button
                    onClick={() => {
                      setDeletingQueryId(selectedQuery._id);
                      setDeleteModalOpen(true);
                    }}
                    variant="destructive"
                    className="w-full rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Query
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50">
                <div className="p-4 bg-slate-100 rounded-full inline-block mb-4">
                  <MessageCircle className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">
                  Select a query to view details
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Query"
        message="Are you sure you want to delete this query? This action cannot be undone and will notify the user."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          const id = deletingQueryId;
          setDeleteModalOpen(false);
          setDeletingQueryId(null);
          deleteQuery(id);
        }}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeletingQueryId(null);
        }}
      />
    </>
  );
}
