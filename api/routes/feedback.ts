import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { feedbackSchema, FeedbackStatus } from "@shared/feedback-schema";
import { Feedback } from "../models/feedback";

const feedbackRouter = Router();

console.info("🚨 feedback router loaded");

// Debug middleware
feedbackRouter.use((req, res, next) => {
  console.debug(`[Feedback Route] ${req.method} ${req.path}`, {
    body: req.body,
    headers: req.headers,
    url: req.originalUrl,
    baseUrl: req.baseUrl,
  });
  next();
});

// Submit new feedback (public endpoint - no authentication required)
feedbackRouter.post("/", async (req, res) => {
  // Ensure JSON response type
  res.setHeader("Content-Type", "application/json");

  try {
    console.debug("Received feedback request:", req.body);
    const feedbackData = feedbackSchema.parse(req.body);
    console.debug("Parsed feedback data:", feedbackData);

    // Get user ID if authenticated, otherwise set to null
    const userId = req.user?._id || null;
    console.debug("Creating feedback with user:", userId);

    const feedback = new Feedback({
      ...feedbackData,
      user_id: userId,
      status: FeedbackStatus.New,
    });

    await feedback.save();
    console.debug("Feedback saved successfully:", feedback._id);

    const response = {
      success: true,
      message: "Feedback submitted successfully",
      feedback: {
        id: feedback._id.toString(),
        ...feedbackData,
        status: feedback.status,
        created_at: feedback.created_at,
      },
    };

    console.debug("Sending response:", response);
    return res.status(201).json(response);
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to submit feedback",
    });
  }
});

// Get feedback for admin
feedbackRouter.get("/", authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view feedback",
      });
    }

    const feedback = await Feedback.find()
      .sort({ created_at: -1 })
      .populate("user_id", "name email");

    return res.status(200).json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
    });
  }
});

// Update feedback status (admin only)
feedbackRouter.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update feedback status",
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(FeedbackStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback status",
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback status updated successfully",
      feedback,
    });
  } catch (error) {
    console.error("Error updating feedback status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update feedback status",
    });
  }
});

// Export both default and named export for compatibility

export default feedbackRouter;
