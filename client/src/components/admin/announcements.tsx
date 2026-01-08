"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  Trash2,
  Megaphone,
  RefreshCcw,
  X,
  FileText,
  Pin,
  User,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import adminApiClient from "@/lib/admin-api-client";
import ConfirmModal from "@/components/dashboard/ConfirmModal";
import DOMPurify from "dompurify";
// React-Quill is a client-side rich text editor
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface Attachment {
  filename: string;
  url: string;
  mimeType?: string;
  size?: number;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  attachments?: Attachment[];
  pinned?: boolean;
  pinned_at?: string | null;
  created_at: string;
  created_by: { fullName: string; email: string };
}

export default function AnnouncementsPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const { toast } = useToast();
  const quillRef = useRef<any>(null);

  // Helpers to determine preview vs full content
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

  const previewFromHtml = (html: string, length = 240) => {
    const plain = stripHtml(html);
    if (!plain) return "";
    if (plain.length <= length) return plain;
    return plain.slice(0, length).trim() + "…";
  };

  // Inline detail panel state
  const [selected, setSelected] = useState<Announcement | null>(null);

  const openAnnouncement = (a: Announcement) => {
    setSelected(a);
    // scroll into view the detail panel once rendered
    setTimeout(() => {
      document
        .getElementById(`admin-announcement-detail-${a._id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const closeAnnouncement = () => {
    setSelected(null);
  };

  const addQuillTooltips = () => {
    const toolbar = document.querySelector(".ql-toolbar");
    if (!toolbar) return;

    const tooltipMap: Record<string, string> = {
      "ql-bold": "Bold",
      "ql-italic": "Italic",
      "ql-underline": "Underline",
      "ql-strike": "Strikethrough",
      "ql-link": "Insert Link",
      "ql-image": "Insert Image",
      "ql-clean": "Clear Formatting",
      "ql-header": "Heading",
      "ql-color": "Text Color",
      "ql-background": "Background Color",
      "ql-size": "Font Size",
    };

    Object.entries(tooltipMap).forEach(([className, title]) => {
      const buttons = toolbar.getElementsByClassName(className);
      Array.from(buttons).forEach((btn) => {
        (btn as HTMLElement).setAttribute("title", title);
      });
    });
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      addQuillTooltips();
    }, 0);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.get("/announcements");
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getApiUrl = (path: string) => {
    const apiBase = import.meta.env.VITE_API_URL ?? "";
    return apiBase ? `${apiBase}${path}` : path;
  };

  const uploadAttachment = async (file: File) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(getApiUrl("/api/attachments/upload"), {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      const a: Attachment = {
        filename: json.filename,
        url: json.url,
        mimeType: json.mimeType,
        size: json.size,
      };
      setAttachments((s) => [...s, a]);
      // If it's an image, insert into editor
      if ((a.mimeType || "").startsWith("image/")) {
        // Append an image tag into the HTML content
        setContent(
          (c) => c + `<p><img src="${a.url}" alt="${a.filename}" /></p>`
        );
      }
      toast({ title: "Uploaded", description: `${a.filename} uploaded` });
      return a;
    } catch (err) {
      console.error("Upload error:", err);
      toast({
        title: "Error",
        description: "Attachment upload failed",
        variant: "destructive",
      });
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Only images, PDF, and Word documents are allowed.",
        variant: "destructive",
      });
      e.currentTarget.value = "";
      return;
    }
    // Basic client-side size check (server also enforces)
    const maxSize = parseInt(
      String(import.meta.env.VITE_MAX_ATTACHMENT_SIZE ?? "10485760"),
      10
    );
    if (file.size > maxSize) {
      toast({
        title: "Too large",
        description: `File exceeds ${maxSize} bytes`,
        variant: "destructive",
      });
      return;
    }
    await uploadAttachment(file);
    // clear input
    e.currentTarget.value = "";
  };

  const sendAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await adminApiClient.post("/announcements", {
        title,
        content,
        attachments,
        pinned,
      });
      toast({
        title: "Success",
        description: "Announcement sent successfully",
      });
      setTitle("");
      setContent("");
      setAttachments([]);
      setPinned(false);
      fetchAnnouncements();
    } catch (error) {
      console.error("Error sending announcement:", error);
      toast({
        title: "Error",
        description: "Failed to send announcement",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await adminApiClient.delete(`/announcements/${id}`);
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const deleteAllAnnouncements = async () => {
    try {
      setDeletingAll(true);
      await adminApiClient.delete("/announcements/all");
      toast({
        title: "Success",
        description: "All announcements deleted successfully",
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting all announcements:", error);
      toast({
        title: "Error",
        description: "Failed to delete all announcements",
        variant: "destructive",
      });
    } finally {
      setDeletingAll(false);
    }
  };

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));

    // Optional: also remove image from editor content
    setContent((prev) =>
      prev.replace(new RegExp(`<img[^>]+src=["']${url}["'][^>]*>`, "g"), "")
    );
  };

  return (
    <div className="p-8">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6" />
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
          <Megaphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-600 mt-1">
            Broadcast messages to all users
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border-slate-200/60 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-transparent">
              <h2 className="text-lg font-bold text-slate-900">
                Recent Announcements
              </h2>

              {announcements.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteAllAnnouncements}
                  disabled={deletingAll}
                  className="ml-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  {deletingAll ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Trash2 size={16} className="mr-2" />
                  )}
                  {deletingAll ? "Deleting..." : "Delete All"}
                </Button>
              )}
            </div>
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {announcements.length === 0 ? (
                  <div className="p-6 text-center text-slate-600">
                    No announcements yet
                  </div>
                ) : (
                  announcements.map((announcement) => (
                    <div
                      key={announcement._id}
                      className="p-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 text-lg">
                            {announcement.title}
                          </h3>
                          <div className="text-sm text-slate-600 mt-2 leading-relaxed">
                            {(() => {
                              const plain = stripHtml(
                                announcement.content || ""
                              );
                              const isShort = plain.length <= 240;
                              return isShort ? (
                                <div
                                  className="prose max-w-none"
                                  dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(
                                      announcement.content || ""
                                    ),
                                  }}
                                />
                              ) : (
                                <div
                                  className="prose max-w-none line-clamp-2"
                                  dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(
                                      previewFromHtml(
                                        announcement.content || ""
                                      )
                                    ),
                                  }}
                                />
                              );
                            })()}
                          </div>
                          {announcement.pinned && (
                            <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-yellow-50 text-yellow-800 text-xs rounded-full font-medium">
                              Pinned
                            </div>
                          )}
                          {announcement.attachments &&
                            announcement.attachments.length > 0 && (
                              <div className="mt-3 space-y-1">
                                {announcement.attachments.map((a: any) => (
                                  <div
                                    key={a.url}
                                    className="text-xs text-slate-600"
                                  >
                                    <a
                                      href={a.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      {a.filename}
                                    </a>
                                    <span className="ml-2 text-xs text-slate-500">
                                      {a.mimeType}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(announcement._id)}
                          className="rounded-lg hover:bg-red-50 transition-colors opacity-100"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                          {new Date(
                            announcement.created_at
                          ).toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                          By:{" "}
                          {announcement.created_by?.fullName ?? "Unknown user"}
                        </span>

                        <div className="ml-auto flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAnnouncement(announcement)}
                            className="rounded-lg"
                          >
                            View
                          </Button>
                        </div>
                      </div>

                      {/* Inline detail panel (expanded under the item) */}
                      {selected?._id === announcement._id && (
                        <div
                          id={`admin-announcement-detail-${announcement._id}`}
                          className="mt-4 bg-white rounded-2xl shadow-lg border overflow-hidden"
                        >
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
                                    {new Date(
                                      selected.created_at
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeAnnouncement}
                                className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                aria-label="Close"
                              >
                                <X className="w-5 h-5 text-slate-600" />
                              </Button>
                            </div>
                          </div>

                          <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div
                              className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-ul:text-slate-700 prose-ol:text-slate-700"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                  selected.content || ""
                                ),
                              }}
                            />

                            {selected.attachments &&
                              selected.attachments.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-100">
                                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Attachments ({selected.attachments.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {selected.attachments.map((a) => {
                                      const isImage =
                                        /(png|jpe?g|gif|bmp|webp)$/i.test(
                                          a.url
                                        );
                                      if (isImage) {
                                        return (
                                          <a
                                            key={a.url}
                                            href={a.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block"
                                          >
                                            <img
                                              src={a.url}
                                              alt={a.filename}
                                              className="w-40 h-28 object-cover rounded-lg shadow-sm"
                                            />
                                          </a>
                                        );
                                      }
                                      return (
                                        <a
                                          key={a.url}
                                          href={a.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-all"
                                        >
                                          {a.filename}
                                        </a>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between gap-4">
                              <div className="text-sm text-slate-600">
                                <span className="text-slate-500">
                                  Close to collapse
                                </span>
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
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
          <ConfirmModal
            open={!!deleteId}
            title="Delete announcement?"
            message="This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={() => deleteId && deleteAnnouncement(deleteId)}
            onCancel={() => setDeleteId(null)}
          />
        </div>

        <div>
          <Card className="p-6 sticky top-8 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border-slate-200/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                <Send className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                New Announcement
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-slate-900"
                >
                  Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.toUpperCase())}
                  placeholder="Announcement title"
                  className="mt-2 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <Label
                  htmlFor="content"
                  className="text-sm font-medium text-slate-900"
                >
                  Content
                </Label>
                <div className="mt-2">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    ref={quillRef}
                    modules={{
                      toolbar: [
                        ["bold", "italic", "underline", "strike"],
                        [{ header: [1, 2, 3, false] }],
                        [{ size: ["small", false, "large"] }],
                        [{ color: [] }, { background: [] }],
                        ["link", "image"],
                        ["clean"],
                      ],
                    }}
                    formats={[
                      "header",
                      "bold",
                      "italic",
                      "underline",
                      "strike",
                      "size",
                      "color",
                      "background",
                      "link",
                      "image",
                    ]}
                    className="bg-white rounded-xl min-h-[300px]"
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <input
                      id="attachment"
                      type="file"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <label
                      htmlFor="attachment"
                      className="text-sm text-blue-600 hover:underline cursor-pointer"
                    >
                      {uploading
                        ? "Uploading..."
                        : "Attach file (image/pdf/doc)"}
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm ml-auto">
                      <input
                        type="checkbox"
                        checked={pinned}
                        onChange={(e) => setPinned(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span>Pin announcement</span>
                    </label>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {attachments.map((a) => {
                        const isImage = a.mimeType?.startsWith("image/");

                        if (isImage) {
                          return (
                            <div
                              key={a.url}
                              className="relative group rounded-xl overflow-hidden border shadow-sm"
                            >
                              <img
                                src={a.url}
                                alt={a.filename}
                                className="w-full h-32 object-cover"
                              />

                              {/* Cancel icon */}
                              <button
                                type="button"
                                onClick={() => removeAttachment(a.url)}
                                className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                aria-label="Remove image"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        }

                        // Non-image (PDF/DOC)
                        return (
                          <div
                            key={a.url}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border text-sm"
                          >
                            <FileText className="w-4 h-4 text-slate-500" />

                            <span className="truncate">{a.filename}</span>

                            <button
                              type="button"
                              onClick={() => removeAttachment(a.url)}
                              className="ml-auto text-slate-400 hover:text-red-600 transition"
                              aria-label="Remove file"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={sendAnnouncement}
                disabled={submitting || uploading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Send size={18} className="mr-2" />
                )}
                {submitting ? "Sending..." : "Send to All Users"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
