"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAnnouncements } from "@/contexts/announcement-context";
import { error as errorLogger } from "@/lib/logger";
import {
  Megaphone,
  ArrowLeft,
  Check,
  Clock,
  User,
  Eye,
  X,
  FileText,
  Download,
  Pin,
  RefreshCcw,
} from "lucide-react";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  attachments?: Array<{ filename: string; url: string; mimeType?: string }>;
  pinned?: boolean;
  pinned_at?: string | null;
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

  const [selected, setSelected] = useState<Announcement | null>(null);

  // Lightbox / preview state (must be inside component to use hooks correctly)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<
    Array<{ url: string; filename?: string }>
  >([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);

  const sortedAnnouncements = announcements.slice().sort((a, b) => {
    const pa = a.pinned ? 1 : 0;
    const pb = b.pinned ? 1 : 0;
    if (pb - pa !== 0) return pb - pa;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const stripHtml = (html: string) => {
    const sanitized = DOMPurify.sanitize(html || "");
    if (typeof document === "undefined")
      return sanitized
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const div = document.createElement("div");
    div.innerHTML = sanitized;
    return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
  };
  const previewFromHtml = (html: string, length = 120) => {
    const plain = stripHtml(html);
    if (!plain) return "";
    if (plain.length <= length) return plain;
    return plain.slice(0, length).trim() + "…";
  };

  const openAnnouncement = (a: Announcement) => {
    setSelected(a);
    // Scroll to the announcement detail panel when it opens
    setTimeout(() => {
      document
        .getElementById("announcement-detail")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const closeAnnouncement = async () => {
    if (selected) {
      if (!selected.read) {
        await markRead(selected._id);
      }
      setSelected(null);
    }
  };

  // Open the lightbox with a list of images and the clicked index
  const openLightbox = (
    images: Array<{ url: string; filename?: string }>,
    index = 0
  ) => {
    setLightboxImages(
      images.map((i) => ({ url: i.url, filename: i.filename }))
    );
    setLightboxInitialIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImages([]);
    setLightboxInitialIndex(0);
  };

  // Handle clicks inside sanitized content blocks to open images
  const handleInlineImageClick = (e: any) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === "IMG") {
      const container = e.currentTarget as HTMLElement;
      const imgs = Array.from(
        container.querySelectorAll("img")
      ) as HTMLImageElement[];
      if (imgs.length === 0) return;
      const images = imgs.map((img) => ({
        url: img.src,
        filename:
          img.getAttribute("alt") || img.src.split("/").pop() || "image",
      }));
      const clicked = target as HTMLImageElement;
      const index = images.findIndex((i) => i.url === clicked.src);
      openLightbox(images, index >= 0 ? index : 0);
    }
  };

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const handleQueryDeleted = (event: any) => {
      const queryId = event.detail?.queryId;
      if (queryId) {
        setAnnouncements((prev) => {
          const filtered = prev.filter(
            (a) => !a.title?.toLowerCase().includes(queryId)
          );
          const unreadCount = filtered.filter((a) => !a.read).length;
          setUnreadCount(unreadCount);
          return filtered;
        });
      }
    };

    window.addEventListener("query:deleted", handleQueryDeleted);
    return () =>
      window.removeEventListener("query:deleted", handleQueryDeleted);
  }, [setUnreadCount]);

  const getApiUrl = (path: string) => {
    const apiBase = import.meta.env.VITE_API_URL ?? "";
    return apiBase ? `${apiBase}${path}` : path;
  };

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      setError(null);
      const res = await fetch(
        getApiUrl("/api/users/announcements?page=1&limit=10"),
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        errorLogger("Announcements fetch failed:", res.status, text);
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
      errorLogger("Failed to fetch announcements:", err);
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
      const already = announcements.find((a) => a._id === id && a.read);
      if (already) return;

      const res = await fetch(`/api/users/announcements/${id}/read`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to mark read");

      setAnnouncements((prev) => {
        const updated = prev.map((a) =>
          a._id === id ? { ...a, read: true } : a
        );
        const unreadCount = updated.filter((x) => !x.read).length;
        setUnreadCount(Math.max(0, unreadCount));
        return updated;
      });
    } catch (err) {
      errorLogger(err);
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
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <Button
              type="button"
              variant="outline"
              onClick={fetchAnnouncements}
              disabled={loading}
              className="rounded-xl border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <RefreshCcw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
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
          {sortedAnnouncements.map((a) => {
            const isQueryAnnouncement =
              a.title
                ?.toLowerCase()
                .startsWith("reply to your support query") ||
              a.title?.toLowerCase().startsWith("support query removed");
            return (
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
                      <div className="mt-2">
                        <div
                          className="prose prose-sm max-w-none line-clamp-2 
           prose-img:cursor-zoom-in 
           prose-img:hover:opacity-90"
                          onClick={(e) => handleInlineImageClick(e)}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(a.content || "", {
                              ALLOWED_TAGS: [
                                "p",
                                "br",
                                "b",
                                "strong",
                                "i",
                                "em",
                                "u",
                                "span",
                                "ul",
                                "ol",
                                "li",
                                "h1",
                                "h2",
                                "h3",
                                "img",
                              ],
                              ALLOWED_ATTR: [
                                "style",
                                "src",
                                "alt",
                                "width",
                                "height",
                              ],
                            }),
                          }}
                        />
                      </div>
                    </div>

                    {a.pinned && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg font-medium">
                        <Pin className="w-3 h-3" />
                        Pinned
                      </div>
                    )}

                    {a.attachments && a.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {a.attachments.map((at) => (
                          <a
                            key={at.url}
                            href={at.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs hover:bg-blue-100 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            {at.filename}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs text-green-600">
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
                    <div className="flex flex-col items-end gap-2">
                      {isQueryAnnouncement ? (
                        <button
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl"
                          onClick={() => {
                            markRead(a._id);
                            navigate("/queries");
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Query
                        </button>
                      ) : (
                        <button
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl"
                          onClick={() => openAnnouncement(a)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </button>
                      )}

                      {a.read && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-sm font-medium">
                          <Check className="w-4 h-4" />
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <div
          id="announcement-detail"
          className="mt-6 bg-white rounded-2xl shadow-2xl border overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Megaphone className="w-5 h-5 text-white" />
                  </div>
                  {selected.pinned && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg font-medium">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                  {selected.title}
                </h3>
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                    <User className="w-3.5 h-3.5" />
                    {selected.created_by?.fullName || "System"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(selected.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={closeAnnouncement}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div
              className="prose prose-slate max-w-none
  prose-headings:text-slate-900
  prose-p:text-slate-700 prose-p:leading-relaxed
  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
  prose-strong:text-slate-900
  prose-ul:text-slate-700 prose-ol:text-slate-700
  prose-img:cursor-zoom-in
  prose-img:hover:opacity-90"
              onClick={(e) => handleInlineImageClick(e)}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(selected.content || "", {
                  ALLOWED_TAGS: [
                    "p",
                    "br",
                    "b",
                    "strong",
                    "i",
                    "em",
                    "u",
                    "span",
                    "ul",
                    "ol",
                    "li",
                    "h1",
                    "h2",
                    "h3",
                    "img",
                  ],
                  ALLOWED_ATTR: ["style", "src", "alt", "width", "height"],
                }),
              }}
            />

            {/* Attachments section */}
            {selected.attachments && selected.attachments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Attachments ({selected.attachments.length})
                </h4>
                <div className="space-y-2">
                  {selected.attachments
                    .filter((at) => !/(png|jpe?g|gif|bmp|webp)$/i.test(at.url))
                    .map((at) => (
                      <a
                        key={at.url}
                        href={at.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        {at.filename}
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                {selected.read ? (
                  <span className="inline-flex items-center gap-1.5 text-green-600">
                    <Check className="w-4 h-4" />
                    Marked as read
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Will be marked as read when you close
                  </span>
                )}
              </div>
              <Button
                onClick={closeAnnouncement}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => closeLightbox()}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/95 rounded-xl p-6 flex items-center justify-center">
              <img
                src={lightboxImages[lightboxInitialIndex]?.url}
                alt={lightboxImages[lightboxInitialIndex]?.filename || "image"}
                className="max-h-[80vh] w-auto object-contain rounded"
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <a
                href={lightboxImages[lightboxInitialIndex]?.url}
                target="_blank"
                rel="noreferrer"
                download={lightboxImages[lightboxInitialIndex]?.filename}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow"
              >
                <Download className="w-4 h-4" />
                Download
              </a>

              <button
                onClick={closeLightbox}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
