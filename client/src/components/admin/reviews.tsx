import { useState, useEffect } from "react";
import { Star, Trash2, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import adminApiClient from "@/lib/admin-api-client";

interface Review {
  _id: string;
  user_id: { _id: string; fullName: string; email: string };
  title: string;
  content: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.get("/reviews");
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (id: string) => {
    try {
      await adminApiClient.patch(`/reviews/${id}/approve`);
      toast({
        title: "Success",
        description: "Review approved",
      });
      fetchReviews();
      setSelectedReview(null);
    } catch (error) {
      console.error("Error approving review:", error);
      toast({
        title: "Error",
        description: "Failed to approve review",
        variant: "destructive",
      });
    }
  };

  const rejectReview = async (id: string) => {
    try {
      await adminApiClient.patch(`/reviews/${id}/reject`);
      toast({
        title: "Success",
        description: "Review rejected",
      });
      fetchReviews();
      setSelectedReview(null);
    } catch (error) {
      console.error("Error rejecting review:", error);
      toast({
        title: "Error",
        description: "Failed to reject review",
        variant: "destructive",
      });
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await adminApiClient.delete(`/reviews/${id}`);
      toast({
        title: "Success",
        description: "Review deleted",
      });
      fetchReviews();
      setSelectedReview(null);
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
    approved: { color: "bg-green-100 text-green-700", label: "Approved" },
    rejected: { color: "bg-red-100 text-red-700", label: "Rejected" },
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(
        1
      )
    : 0;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        Reviews Management
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <p className="text-sm text-slate-600 font-medium">Total Reviews</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {reviews.length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-slate-600 font-medium">Pending Reviews</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {pendingCount}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-slate-600 font-medium">Avg Rating</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {averageRating}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">User Reviews</h2>
            </div>
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                {reviews.length === 0 ? (
                  <div className="p-6 text-center text-slate-600">
                    No reviews yet
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review._id}
                      onClick={() => setSelectedReview(review)}
                      className={`p-6 cursor-pointer hover:bg-slate-50 transition ${
                        selectedReview?._id === review._id
                          ? "bg-blue-50 border-l-4 border-l-blue-600"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">
                              {review.title}
                            </h3>
                            <div className="flex gap-1">
                              {Array.from({ length: review.rating }).map(
                                (_, i) => (
                                  <Star
                                    key={i}
                                    size={14}
                                    fill="#fbbf24"
                                    stroke="#fbbf24"
                                  />
                                )
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600">
                            {review.user_id.fullName}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            statusConfig[review.status].color
                          }`}
                        >
                          {statusConfig[review.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{review.content}</p>
                      <span className="text-xs text-slate-500 mt-2 block">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>

        <div>
          {selectedReview ? (
            <Card className="p-6 sticky top-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Review Details
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs text-slate-600 font-semibold">RATING</p>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: selectedReview.rating }).map(
                      (_, i) => (
                        <Star
                          key={i}
                          size={18}
                          fill="#fbbf24"
                          stroke="#fbbf24"
                        />
                      )
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">USER</p>
                  <p className="text-slate-900">
                    {selectedReview.user_id.fullName}
                  </p>
                  <p className="text-xs text-slate-600">
                    {selectedReview.user_id.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">TITLE</p>
                  <p className="text-slate-900">{selectedReview.title}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">
                    CONTENT
                  </p>
                  <p className="text-slate-900">{selectedReview.content}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold">STATUS</p>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded inline-block ${
                      statusConfig[selectedReview.status].color
                    }`}
                  >
                    {statusConfig[selectedReview.status].label}
                  </span>
                </div>
              </div>

              {selectedReview.status === "pending" && (
                <div className="space-y-2">
                  <Button
                    onClick={() => approveReview(selectedReview._id)}
                    className="w-full bg-green-600 text-white hover:bg-green-700"
                  >
                    <Check size={16} className="mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectReview(selectedReview._id)}
                    className="w-full bg-red-600 text-white hover:bg-red-700"
                  >
                    <X size={16} className="mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              <Button
                onClick={() => deleteReview(selectedReview._id)}
                variant="outline"
                className="w-full mt-2"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            </Card>
          ) : (
            <Card className="p-6 text-center text-slate-600">
              Select a review to view details
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
