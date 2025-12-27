"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import {
  queriesApi,
  type QueryItem,
  type QueryMessage,
} from "@/lib/queries-api-client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Paperclip,
  Plus,
  Clock,
  AlertCircle,
  ArrowLeft,
  Bold,
  Italic,
  RefreshCcw,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { error } from "@/lib/logger";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export default function MyQueriesPage() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<QueryItem | null>(null);
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newMessage, setNewMessage] = useState("");
  const [newAttachments, setNewAttachments] = useState<any[]>([]);
  const [replyHistory, setReplyHistory] = useState<string[]>([]);
  const [replyHistoryIndex, setReplyHistoryIndex] = useState(-1);
  const [newMessageHistory, setNewMessageHistory] = useState<string[]>([]);
  const [newMessageHistoryIndex, setNewMessageHistoryIndex] = useState(-1);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const currentUserId = user ? (user as any)._id || (user as any).id : null;
  const [, navigate] = useLocation();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const newMessageTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const applyFormatting = (
    text: string,
    formatType: "bold" | "italic",
    setter: (value: string) => void,
    textareaRef: React.RefObject<HTMLTextAreaElement>,
    historyState: { history: string[]; index: number },
    setHistory: (history: string[]) => void,
    setIndex: (index: number) => void
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);

    if (!selectedText) return; // No text selected

    let formattedText: string;
    if (formatType === "bold") {
      formattedText = `**${selectedText}**`;
    } else {
      formattedText = `*${selectedText}*`;
    }

    const newText =
      text.substring(0, start) + formattedText + text.substring(end);
    setter(newText);

    // Update history
    const newHistory = historyState.history.slice(0, historyState.index + 1);
    newHistory.push(newText);
    setHistory(newHistory);
    setIndex(newHistory.length - 1);

    // Restore cursor position after state update
    setTimeout(() => {
      if (textarea) {
        textarea.selectionStart = start + (formatType === "bold" ? 2 : 1);
        textarea.selectionEnd =
          start + formattedText.length - (formatType === "bold" ? 2 : 1);
        textarea.focus();
      }
    }, 0);
  };

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const data = await queriesApi.getMyQueries();
      setQueries(data);
    } catch (err) {
      error(err);
      toast({ title: "Failed to load queries" });
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = (
    value: string,
    history: string[],
    index: number,
    setIndex: (i: number) => void,
    setter: (v: string) => void
  ) => {
    if (index > 0) {
      const newIndex = index - 1;
      setIndex(newIndex);
      setter(history[newIndex]);
    }
  };

  const handleRedo = (
    value: string,
    history: string[],
    index: number,
    setIndex: (i: number) => void,
    setter: (v: string) => void
  ) => {
    if (index < history.length - 1) {
      const newIndex = index + 1;
      setIndex(newIndex);
      setter(history[newIndex]);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    isReply: boolean
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (isReply) {
        handleUndo(
          reply,
          replyHistory,
          replyHistoryIndex,
          setReplyHistoryIndex,
          setReply
        );
      } else {
        handleUndo(
          newMessage,
          newMessageHistory,
          newMessageHistoryIndex,
          setNewMessageHistoryIndex,
          setNewMessage
        );
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
      e.preventDefault();
      if (isReply) {
        handleRedo(
          reply,
          replyHistory,
          replyHistoryIndex,
          setReplyHistoryIndex,
          setReply
        );
      } else {
        handleRedo(
          newMessage,
          newMessageHistory,
          newMessageHistoryIndex,
          setNewMessageHistoryIndex,
          setNewMessage
        );
      }
    }
  };

  const updateTextWithHistory = (value: string, isReply: boolean) => {
    if (isReply) {
      setReply(value);
      const newHistory = replyHistory.slice(0, replyHistoryIndex + 1);
      newHistory.push(value);
      setReplyHistory(newHistory);
      setReplyHistoryIndex(newHistory.length - 1);
    } else {
      setNewMessage(value);
      const newHistory = newMessageHistory.slice(0, newMessageHistoryIndex + 1);
      newHistory.push(value);
      setNewMessageHistory(newHistory);
      setNewMessageHistoryIndex(newHistory.length - 1);
    }
  };

  const renderFormattedText = (text: string) => {
    // Parse **bold** and *italic* markdown
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

    // Find all bold matches
    let match: RegExpExecArray | null;
    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({
        type: "bold",
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
      });
    }

    // Find all italic matches (that aren't inside bold)
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

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    // Build parts array
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

  const handleNewFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const ups: any[] = [];
      for (const f of files) {
        const res = await queriesApi.uploadAttachment(f);
        ups.push(res);
      }
      setNewAttachments((a) => [...a, ...ups]);
      toast({ title: "Attachments uploaded" });
    } catch (err) {
      error("Attachment upload failed:", err);
      toast({ title: "Upload failed" });
    } finally {
      setUploading(false);
      (e.target as HTMLInputElement).value = "";
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const ups = [] as any[];
      for (const f of files) {
        const res = await queriesApi.uploadAttachment(f);
        ups.push(res);
      }
      setAttachments((a) => [...a, ...ups]);
      toast({ title: "Attachments uploaded" });
    } catch (err) {
      error("Attachment upload failed:", err);
      toast({ title: "Upload failed" });
    } finally {
      setUploading(false);
      (e.target as HTMLInputElement).value = "";
    }
  };

  const openQuery = async (q: QueryItem) => {
    // 1️⃣ Open dialog immediately with existing data
    setSelected(q);

    try {
      // 2️⃣ Fetch full thread in background
      const full = await queriesApi.getQuery(q._id);

      // 3️⃣ Replace with full data once ready
      setSelected(full);
    } catch (err) {
      error("Failed to load full query:", err);
      toast({ title: "Failed to refresh conversation" });
    }
  };

  const handleCreateQuery = async () => {
    if (!newSubject.trim() || !newMessage.trim())
      return toast({ title: "Subject and message are required" });
    setCreating(true);
    try {
      const created = await queriesApi.submitQuery({
        subject: newSubject.trim(),
        message: newMessage.trim(),
        category: newCategory,
        attachments: newAttachments,
      });
      toast({
        title: "Query submitted",
        description: "We'll get back to you soon.",
      });
      setNewOpen(false);
      setNewSubject("");
      setNewMessage("");
      setNewAttachments([]);
      await fetchQueries();
      const full = await queriesApi.getQuery(created._id);
      setSelected(full);
    } catch (err) {
      error("Query submission failed:", err);
      toast({ title: "Failed to submit query" });
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selected) return;
    if (!reply.trim()) return toast({ title: "Message required" });

    const optimisticMessage: QueryMessage & { _sending?: boolean } = {
      message: reply.trim(),
      author: "user" as const,
      created_at: new Date().toISOString(),
      attachments: attachments,
      _sending: true, // Flag to show sending state
    };

    const previousMessages = selected.messages;
    setSelected({
      ...selected,
      messages: [...(selected.messages || []), optimisticMessage],
    });

    const messageText = reply.trim();
    const messageAttachments = [...attachments];
    setReply("");
    setAttachments([]);
    setSending(true);

    try {
      await queriesApi.postMessage(selected._id, {
        message: messageText,
        attachments: messageAttachments,
      });

      toast({ title: "Message sent" });
      await fetchQueries();

      // Attempt to refresh the query, but don't fail if it returns 403
      try {
        const refreshed = await queriesApi.getQuery(selected._id);
        setSelected(refreshed);
      } catch (refreshErr: any) {
        // If we get a 403, it might be a temporary auth issue
        // Remove the _sending flag from the optimistic message to show it was sent
        if (selected.messages && selected.messages.length > 0) {
          const lastMsg = selected.messages[selected.messages.length - 1];
          if ((lastMsg as any)._sending) {
            delete (lastMsg as any)._sending;
            setSelected({ ...selected });
          }
        }
        error("Failed to refresh query:", refreshErr);
        // Don't show an error toast here since the message was actually sent
      }
    } catch (err) {
      error("Failed to send message:", err);
      setSelected({
        ...selected,
        messages: previousMessages,
      });
      setReply(messageText);
      setAttachments(messageAttachments);
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = (status || "open").toLowerCase();
    if (statusLower === "open")
      return (
        <Badge
          variant="default"
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          Open
        </Badge>
      );
    if (statusLower === "closed")
      return <Badge variant="secondary">Closed</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const getCategoryStyles = (category: string | undefined) => {
    const categoryLower = (category || "general").toLowerCase();
    const styles: Record<
      string,
      { bg: string; border: string; badge: string; icon: string }
    > = {
      general: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        badge: "bg-blue-100 text-blue-700 border-blue-300",
        icon: "text-blue-600",
      },
      technical: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        badge: "bg-orange-100 text-orange-700 border-orange-300",
        icon: "text-orange-600",
      },
      billing: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        badge: "bg-purple-100 text-purple-700 border-purple-300",
        icon: "text-purple-600",
      },
      other: {
        bg: "bg-slate-50",
        border: "border-slate-200",
        badge: "bg-slate-100 text-slate-700 border-slate-300",
        icon: "text-slate-600",
      },
    };
    return styles[categoryLower] || styles.general;
  };

  useEffect(() => {
    if (!selected?._id || !messagesContainerRef.current) return;

    const scrollToBottom = () => {
      const el = messagesContainerRef.current;
      if (!el) return;
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } catch (e) {
        el.scrollTop = el.scrollHeight;
      }
    };

    // Small delay to allow DOM to render
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [selected?._id, selected?.messages?.length]);

  // Load queries on mount (and when auth user changes)
  useEffect(() => {
    fetchQueries();
  }, [currentUserId]);

  // Listen for real-time query events dispatched by AnnouncementProvider
  useEffect(() => {
    const onQueryReply = async (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        if (!detail) return;
        // If the reply is for the currently open thread, refresh it
        if (selected?._id && String(detail.queryId) === String(selected._id)) {
          try {
            const refreshed = await queriesApi.getQuery(String(detail.queryId));
            setSelected(refreshed);
          } catch (err) {
            error("Failed to refresh query on reply event:", err);
            // If refresh failed, avoid showing a destructive toast — user already sees a notification
          }
        } else {
          // Otherwise just refresh the list so unread counts / preview update
          await fetchQueries();
        }
      } catch (err) {
        error("query:reply handler error:", err);
      }
    };

    const onQueryDeleted = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        if (!detail) return;
        // If the currently open thread was deleted, close the dialog
        if (selected?._id && String(detail.queryId) === String(selected._id)) {
          setSelected(null);
          toast({ title: "This query was removed by an administrator" });
        }
        // Refresh list in any case
        fetchQueries();
      } catch (err) {
        error("query:deleted handler error:", err);
      }
    };

    window.addEventListener("query:reply", onQueryReply as EventListener);
    window.addEventListener("query:deleted", onQueryDeleted as EventListener);

    return () => {
      window.removeEventListener("query:reply", onQueryReply as EventListener);
      window.removeEventListener(
        "query:deleted",
        onQueryDeleted as EventListener
      );
    };
  }, [selected?._id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-6">
      <div className="w-full mx-auto">
        <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl mb-6">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 -mt-6 -mx-6 mb-6 rounded-t-2xl" />

          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Support Queries
                </h3>
                <p className="text-sm text-slate-500">
                  {queries.length} total queries
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={fetchQueries}
                disabled={loading}
                className="rounded-xl border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <RefreshCcw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                type="button"
                onClick={() => setNewOpen(true)}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Query
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-600">Loading queries...</span>
              </div>
            </div>
          ) : queries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600">No queries yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Click "New Query" to start a conversation
              </p>
            </div>
          ) : (
            <ul className="space-y-4 mt-6">
              {queries.map((q) => {
                const categoryStyle = getCategoryStyles(q.category);
                return (
                  <li
                    key={q._id}
                    className={`relative p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg ${categoryStyle.bg} ${categoryStyle.border} shadow-sm`}
                  >
                    {q.status?.toLowerCase() === "open" && (
                      <div className="absolute top-5 left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full" />
                    )}

                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-semibold text-slate-900 text-lg">
                            {renderFormattedText(q.subject)}
                          </div>
                          {q.status ? getStatusBadge(q.status) : null}
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs ${categoryStyle.badge}`}
                          >
                            <AlertCircle className="w-3 h-3" />
                            <span className="capitalize">
                              {q.category || "General"}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(q.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                          {q.messages && q.messages.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                              <MessageSquare className="w-3 h-3" />
                              {q.messages.length}{" "}
                              {q.messages.length === 1 ? "message" : "messages"}
                            </span>
                          )}
                        </div>

                        <div className="text-slate-600 mt-2 leading-relaxed text-sm">
                          {renderFormattedText(
                            (q.messages?.[0]?.message?.slice(0, 150) ?? "") +
                              ((q.messages?.[0]?.message?.length ?? 0) > 150
                                ? "..."
                                : "")
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <button
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl"
                          onClick={() => openQuery(q)}
                        >
                          View Thread
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
      >
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col p-0">
          {/* Header */}
          <DialogHeader className="border-b pb-4 px-6 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-slate-900 mb-2">
                  {selected?.subject}
                </DialogTitle>
                <div className="flex items-center gap-3">
                  {selected?.status ? getStatusBadge(selected.status) : null}
                  <span className="text-sm text-slate-500 capitalize">
                    {selected?.category || "General"}
                  </span>
                  {/* Query reactions (color active reaction) */}
                  <div className="ml-4 inline-flex items-center gap-2">
                    {(() => {
                      const current = selected?.reactions || [];
                      const existing = current.find(
                        (r) => String(r.user) === String(currentUserId)
                      );
                      const isLike = existing?.type === "like";
                      const isDislike = existing?.type === "dislike";

                      return (
                        <>
                          <button
                            onClick={async () => {
                              if (!selected || !user) return;
                              const type: "like" | "dislike" = "like";
                              try {
                                // optimistic
                                if (existing && existing.type === type) {
                                  selected.reactions = current.filter(
                                    (r) =>
                                      String(r.user) !== String(currentUserId)
                                  );
                                } else if (existing) {
                                  existing.type = type;
                                } else {
                                  selected.reactions = [
                                    ...current,
                                    { user: currentUserId, type },
                                  ];
                                }
                                setSelected({ ...selected });
                                const refreshed = await queriesApi.reactOnQuery(
                                  selected._id,
                                  type
                                );
                                setSelected(refreshed);
                              } catch (err) {
                                error("Failed to react to query:", err);
                                toast({ title: "Failed to react" });
                              }
                            }}
                            className={`inline-flex items-center gap-1 p-1 rounded-md hover:bg-slate-100 ${
                              isLike
                                ? "text-green-600 bg-green-50"
                                : "text-slate-600"
                            }`}
                            title="Like"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-xs text-slate-500 ml-1">
                              {selected?.reactions?.filter(
                                (r) => r.type === "like"
                              ).length || 0}
                            </span>
                          </button>

                          <button
                            onClick={async () => {
                              if (!selected || !user) return;
                              const type: "like" | "dislike" = "dislike";
                              try {
                                if (existing && existing.type === type) {
                                  selected.reactions = current.filter(
                                    (r) =>
                                      String(r.user) !== String(currentUserId)
                                  );
                                } else if (existing) {
                                  existing.type = type;
                                } else {
                                  selected.reactions = [
                                    ...current,
                                    { user: currentUserId, type },
                                  ];
                                }
                                setSelected({ ...selected });
                                const refreshed = await queriesApi.reactOnQuery(
                                  selected._id,
                                  type
                                );
                                setSelected(refreshed);
                              } catch (err) {
                                error("Failed to react to query:", err);
                                toast({ title: "Failed to react" });
                              }
                            }}
                            className={`inline-flex items-center gap-1 p-1 rounded-md hover:bg-slate-100 ${
                              isDislike
                                ? "text-red-600 bg-red-50"
                                : "text-slate-600"
                            }`}
                            title="Dislike"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-xs text-slate-500 ml-1">
                              {selected?.reactions?.filter(
                                (r) => r.type === "dislike"
                              ).length || 0}
                            </span>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0"
          >
            {selected?.messages?.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.author === "admin" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    m.author === "admin"
                      ? "bg-slate-100 text-slate-900"
                      : "bg-blue-500 text-white"
                  } ${m._sending ? "opacity-60" : ""}`}
                >
                  <div
                    className={`text-xs font-medium mb-2 flex items-center gap-2 ${
                      m.author === "admin" ? "text-slate-600" : "text-blue-100"
                    }`}
                  >
                    <span className="capitalize">{m.author}</span>
                    <span>•</span>
                    <span>
                      {m._sending
                        ? "Sending..."
                        : formatDistanceToNow(new Date(m.created_at), {
                            addSuffix: true,
                          })}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-sm">
                    {renderFormattedText(m.message)}
                  </div>

                  {m.attachments?.length ? (
                    <div className="mt-3 pt-3 border-t border-slate-200/20 flex flex-wrap gap-2">
                      {m.attachments.map((a, idx) => (
                        <a
                          key={idx}
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                            m.author === "admin"
                              ? "bg-white text-slate-700 hover:bg-slate-50"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Paperclip className="h-3 w-3" />
                          {a.filename}
                        </a>
                      ))}
                    </div>
                  ) : null}

                  {/* Show admin reactions on user messages (other-side badges) */}
                  {m.author === "user" &&
                    (() => {
                      const other = (m.reactions || []) as Array<any>;
                      const otherSide = other.filter(
                        (r) => String(r.user) !== String(currentUserId)
                      );
                      const otherLikes = otherSide.filter(
                        (r) => r.type === "like"
                      ).length;
                      const otherDislikes = otherSide.filter(
                        (r) => r.type === "dislike"
                      ).length;
                      if (!otherLikes && !otherDislikes) return null;
                      return (
                        <div className="mt-2 flex items-center gap-2">
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

                  {/* Message reactions (only for admin messages in the user UI) */}
                  {m.author === "admin" && (
                    <div className="mt-3 flex items-center gap-3">
                      {(() => {
                        const current = (m.reactions || []) as Array<any>;
                        const existing = current.find(
                          (r) => String(r.user) === String(currentUserId)
                        );
                        const isLike = existing?.type === "like";
                        const isDislike = existing?.type === "dislike";

                        return (
                          <>
                            <button
                              onClick={async () => {
                                if (!selected || !user || !m._id) return;
                                const current = (m.reactions ||
                                  []) as Array<any>;
                                const existing = current.find(
                                  (r) =>
                                    String(r.user) === String(currentUserId)
                                );
                                const type: "like" | "dislike" = "like";
                                try {
                                  if (existing && existing.type === type) {
                                    m.reactions = current.filter(
                                      (r) =>
                                        String(r.user) !== String(currentUserId)
                                    );
                                  } else if (existing) {
                                    existing.type = type;
                                  } else {
                                    m.reactions = [
                                      ...current,
                                      { user: currentUserId, type },
                                    ];
                                  }
                                  setSelected({ ...selected });
                                  const refreshed =
                                    await queriesApi.reactOnMessage(
                                      selected._id,
                                      m._id as string,
                                      type
                                    );
                                  setSelected(refreshed);
                                } catch (err) {
                                  console.error(
                                    "Failed to react to message:",
                                    err
                                  );
                                  toast({ title: "Failed to react" });
                                }
                              }}
                              className={`inline-flex items-center gap-1 p-1 rounded-md hover:bg-slate-100 ${
                                isLike
                                  ? "text-green-600 bg-green-50"
                                  : "text-slate-600"
                              }`}
                              title="Like"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span className="text-xs text-slate-500 ml-1">
                                {m.reactions?.filter((r) => r.type === "like")
                                  .length || 0}
                              </span>
                            </button>

                            <button
                              onClick={async () => {
                                if (!selected || !user || !m._id) return;
                                const current = (m.reactions ||
                                  []) as Array<any>;
                                const existing = current.find(
                                  (r) =>
                                    String(r.user) === String(currentUserId)
                                );
                                const type: "like" | "dislike" = "dislike";
                                try {
                                  if (existing && existing.type === type) {
                                    m.reactions = current.filter(
                                      (r) =>
                                        String(r.user) !== String(currentUserId)
                                    );
                                  } else if (existing) {
                                    existing.type = type;
                                  } else {
                                    m.reactions = [
                                      ...current,
                                      { user: currentUserId, type },
                                    ];
                                  }
                                  setSelected({ ...selected });
                                  const refreshed =
                                    await queriesApi.reactOnMessage(
                                      selected._id,
                                      m._id as string,
                                      type
                                    );
                                  setSelected(refreshed);
                                } catch (err) {
                                  console.error(
                                    "Failed to react to message:",
                                    err
                                  );
                                  toast({ title: "Failed to react" });
                                }
                              }}
                              className={`inline-flex items-center gap-1 p-1 rounded-md hover:bg-slate-100 ${
                                isDislike
                                  ? "text-red-600 bg-red-50"
                                  : "text-slate-600"
                              }`}
                              title="Dislike"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              <span className="text-xs text-slate-500 ml-1">
                                {m.reactions?.filter(
                                  (r) => r.type === "dislike"
                                ).length || 0}
                              </span>
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer with reply box */}
          <div className="border-t pt-4 px-6 pb-6 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() =>
                    applyFormatting(
                      reply,
                      "bold",
                      setReply,
                      replyTextareaRef,
                      { history: replyHistory, index: replyHistoryIndex },
                      setReplyHistory,
                      setReplyHistoryIndex
                    )
                  }
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyFormatting(
                      reply,
                      "italic",
                      setReply,
                      replyTextareaRef,
                      { history: replyHistory, index: replyHistoryIndex },
                      setReplyHistory,
                      setReplyHistoryIndex
                    )
                  }
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                ref={replyTextareaRef}
                value={reply}
                onChange={(e) => updateTextWithHistory(e.target.value, true)}
                onKeyDown={(e) => handleKeyDown(e, true)}
                placeholder="Type your follow-up message..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors text-sm font-medium text-slate-700">
                <Paperclip className="h-4 w-4" />
                Attach Files
                <input
                  type="file"
                  multiple
                  onChange={handleFile}
                  accept="image/*,.pdf"
                  className="hidden"
                />
              </label>
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  Uploading...
                </div>
              )}
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700"
                  >
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate max-w-[10rem]">
                      {a.filename || a.name || String(a)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${
                        a.filename || a.name || "attachment"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAttachments((p) => p.filter((_, idx) => idx !== i));
                      }}
                      className="ml-2 inline-flex items-center justify-center rounded-full p-1 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                onClick={handleSendMessage}
                disabled={sending || !reply.trim()}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {sending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Create Support Query
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Describe your issue and we'll get back to you as soon as possible
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Subject *
              </label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Brief summary of your issue"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Category *
              </label>
              <select
                className="w-full h-11 rounded-lg border border-slate-200 px-4 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Message *
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      applyFormatting(
                        newMessage,
                        "bold",
                        setNewMessage,
                        newMessageTextareaRef,
                        {
                          history: newMessageHistory,
                          index: newMessageHistoryIndex,
                        },
                        setNewMessageHistory,
                        setNewMessageHistoryIndex
                      )
                    }
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyFormatting(
                        newMessage,
                        "italic",
                        setNewMessage,
                        newMessageTextareaRef,
                        {
                          history: newMessageHistory,
                          index: newMessageHistoryIndex,
                        },
                        setNewMessageHistory,
                        setNewMessageHistoryIndex
                      )
                    }
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                </div>
                <Textarea
                  ref={newMessageTextareaRef}
                  value={newMessage}
                  onChange={(e) => updateTextWithHistory(e.target.value, false)}
                  onKeyDown={(e) => handleKeyDown(e, false)}
                  placeholder="Provide detailed information about your issue..."
                  className="min-h-[140px] resize-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">
                Attachments
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors text-sm font-medium text-slate-700">
                  <Paperclip className="h-4 w-4" />
                  Choose Files
                  <input
                    type="file"
                    multiple
                    onChange={handleNewFile}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                </label>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
              {newAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newAttachments.map((a, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate max-w-[12rem]">
                        {a.filename || a.name || String(a)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${
                          a.filename || a.name || "attachment"
                        }`}
                        onClick={() =>
                          setNewAttachments((p) =>
                            p.filter((_, idx) => idx !== i)
                          )
                        }
                        className="ml-2 inline-flex items-center justify-center rounded-full p-1 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-end gap-3 w-full">
              <Button variant="outline" onClick={() => setNewOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateQuery}
                disabled={creating}
                className="gap-2"
              >
                {creating ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Query
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
