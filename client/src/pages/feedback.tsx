import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, Loader2 } from "lucide-react";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Replace with your Google Apps Script deployment URL
      const scriptUrl =
        "https://script.google.com/macros/s/AKfycbxb2DPxmLVax7VNDv5Erd_DelOsjkor0nZQpd3XiGMLfDO9DqKDm2CJpNyrxvggNMLCwg/exec";

      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          name,
          email,
          rating,
          feedback,
        }),
      });

      // Show success message
      alert("Thank you for your feedback!");

      // Reset form
      setName("");
      setEmail("");
      setFeedback("");
      setRating(0);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("There was an error submitting your feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="backdrop-blur-sm bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-8">
            {/* Header Section */}
            <div className="text-center mb-8 space-y-3">
              <h1 className="text-3xl font-bold text-slate-900">
                Share Your Feedback
              </h1>
              <p className="text-slate-600">
                Help us improve AutoMetrics by sharing your thoughts
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Your Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tajamal Hussain"
                  required
                  className="w-full transition-shadow focus:shadow-md"
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tajamalhussain@example.com"
                  required
                  className="w-full transition-shadow focus:shadow-md"
                />
              </div>

              {/* Star Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredStar || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-300"
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Your Feedback
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your experience and suggestions..."
                  required
                  className="w-full h-32 transition-shadow focus:shadow-md"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </form>

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-indigo-100/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-100/30 to-blue-100/20 rounded-full blur-2xl animate-pulse delay-500" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
