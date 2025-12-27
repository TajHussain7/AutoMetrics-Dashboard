import { useMutation } from "@tanstack/react-query";
import { FeedbackFormData, FeedbackResponse } from "@shared/feedback-schema";
import { useToast } from "./use-toast";
import { debug, error } from "@/lib/logger";

export function useFeedback() {
  const { toast } = useToast();

  const submitFeedback = useMutation<FeedbackResponse, Error, FeedbackFormData>(
    {
      mutationFn: async (data) => {
        debug("Submitting feedback data:", data);

        // Use relative API path instead of absolute URL
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include", // Include cookies for authentication
        });

        debug("Response status:", response.status);
        debug(
          "Response headers:",
          Object.fromEntries(response.headers.entries())
        );

        // Get the raw text first for debugging
        const responseText = await response.text();
        debug("Raw response:", responseText);

        // Try to parse as JSON
        let result;
        try {
          // Check if the response is HTML (indicating a routing issue)
          if (responseText.trim().startsWith("<!DOCTYPE html>")) {
            throw new Error(
              "Received HTML instead of JSON. Please check the API endpoint URL."
            );
          }

          result = JSON.parse(responseText);
        } catch (e) {
          // Use logger that redacts details in production
          error("Response parsing error:", e);
          error("Full response:", responseText);
          throw new Error(
            "Server returned an invalid response. Please try again or contact support."
          );
        }

        if (!response.ok) {
          throw new Error(result.message || "Failed to submit feedback");
        }

        return result;
      },
      onSuccess: () => {
        toast({
          title: "Feedback submitted",
          description: "Thank you for your feedback!",
          variant: "default",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to submit feedback",
          variant: "destructive",
        });
      },
    }
  );

  return {
    submitFeedback,
    isSubmitting: submitFeedback.isPending,
  };
}
