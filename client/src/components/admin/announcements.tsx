import { useState, useEffect } from "react";
import { Send, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import adminApiClient from "@/lib/admin-api-client";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: { fullName: string; email: string };
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.get("/announcements");
      setAnnouncements(response.data);
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
      await adminApiClient.post("/announcements", { title, content });
      toast({
        title: "Success",
        description: "Announcement sent successfully",
      });
      setTitle("");
      setContent("");
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
    if (!confirm("Are you sure you want to delete this announcement?")) return;

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
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Announcements</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Recent Announcements
              </h2>
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
                      className="p-6 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {announcement.title}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {announcement.content}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAnnouncement(announcement._id)}
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500 mt-3">
                        <span>
                          {new Date(
                            announcement.created_at
                          ).toLocaleDateString()}
                        </span>
                        <span>By: {announcement.created_by.fullName}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-6 sticky top-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              New Announcement
            </h3>
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
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                  className="mt-2"
                />
              </div>
              <div>
                <Label
                  htmlFor="content"
                  className="text-sm font-medium text-slate-900"
                >
                  Content
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Announcement content..."
                  rows={6}
                  className="mt-2"
                />
              </div>
              <Button
                onClick={sendAnnouncement}
                disabled={submitting}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
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
