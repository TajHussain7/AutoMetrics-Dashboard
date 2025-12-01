import { useState, useEffect } from "react";
import { MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import adminApiClient from "@/lib/admin-api-client";

interface Query {
  _id: string;
  user_id: { _id: string; fullName: string; email: string };
  subject: string;
  message: string;
  status: "open" | "replied" | "closed";
  reply?: string;
  created_at: string;
}

export default function QueriesPage() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.get("/queries");
      setQueries(response.data);
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
      await adminApiClient.patch(`/queries/${selectedQuery._id}/reply`, {
        reply,
      });
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      setReply("");
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

  const statusConfig = {
    open: {
      icon: MessageCircle,
      color: "text-orange-600",
      bg: "bg-orange-100",
      label: "Open",
    },
    replied: {
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100",
      label: "Replied",
    },
    closed: {
      icon: XCircle,
      color: "text-slate-600",
      bg: "bg-slate-100",
      label: "Closed",
    },
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        Queries & Support
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">User Queries</h2>
            </div>
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                {queries.length === 0 ? (
                  <div className="p-6 text-center text-slate-600">
                    No queries yet
                  </div>
                ) : (
                  queries.map((query) => {
                    const StatusIcon = statusConfig[query.status].icon;
                    return (
                      <div
                        key={query._id}
                        onClick={() => setSelectedQuery(query)}
                        className={`p-6 cursor-pointer hover:bg-slate-50 transition ${
                          selectedQuery?._id === query._id
                            ? "bg-blue-50 border-l-4 border-l-blue-600"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                statusConfig[query.status].bg
                              }`}
                            >
                              <StatusIcon
                                size={18}
                                className={statusConfig[query.status].color}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                {query.subject}
                              </h3>
                              <p className="text-sm text-slate-600">
                                {query.user_id.fullName}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(query.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 ml-12">
                          {query.message}
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
            <Card className="p-6 sticky top-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Query Details
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs text-slate-600 font-semibold">
                    SUBJECT
                  </p>
                  <p className="text-slate-900">{selectedQuery.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">FROM</p>
                  <p className="text-slate-900">
                    {selectedQuery.user_id.fullName}
                  </p>
                  <p className="text-xs text-slate-600">
                    {selectedQuery.user_id.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">
                    MESSAGE
                  </p>
                  <p className="text-slate-900">{selectedQuery.message}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">STATUS</p>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      statusConfig[selectedQuery.status].bg
                    } ${statusConfig[selectedQuery.status].color}`}
                  >
                    {statusConfig[selectedQuery.status].label}
                  </span>
                </div>
                {selectedQuery.reply && (
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">
                      REPLY
                    </p>
                    <p className="text-slate-900">{selectedQuery.reply}</p>
                  </div>
                )}
              </div>

              {selectedQuery.status === "open" && (
                <>
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    rows={4}
                    className="mb-3"
                  />
                  <Button
                    onClick={sendReply}
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 mb-2"
                  >
                    {submitting ? "Sending..." : "Send Reply"}
                  </Button>
                </>
              )}

              {selectedQuery.status !== "closed" && (
                <Button
                  onClick={() => closeQuery(selectedQuery._id)}
                  variant="outline"
                  className="w-full"
                >
                  Close Query
                </Button>
              )}
            </Card>
          ) : (
            <Card className="p-6 text-center text-slate-600">
              Select a query to view details
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
