import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  feedbackSchema,
  FeedbackStatus,
} from "../../shared/feedback-schema.js";
import { Feedback } from "../models/feedback.js";
import { debug } from "../utils/logger.js";

const feedbackRouter = Router();

console.info("🚨 feedback router loaded");

// Debug middleware (minimal, non-sensitive info only)
feedbackRouter.use((req, res, next) => {
  debug(`[Feedback Route] ${req.method} ${req.path}`);
  next();
});

// Submit new feedback (public endpoint - no authentication required)
feedbackRouter.post("/", async (req, res) => {
  // Ensure JSON response type
  res.setHeader("Content-Type", "application/json");

  try {
    debug("Received feedback request");
    const feedbackData = feedbackSchema.parse(req.body);
    debug("Parsed feedback data");

    // Get user ID if authenticated, otherwise set to null
    const userId = req.user?._id || null;
    debug("Creating feedback with user:", userId);

    const feedback = new Feedback({
      ...feedbackData,
      user_id: userId,
      status: FeedbackStatus.New,
    });

    await feedback.save();
    debug("Feedback saved successfully:", feedback._id);

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

    debug("Sending response:", response);
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

// Public: Get recent feedback entries (lightweight, includes user profile if available)
feedbackRouter.get("/recent", async (req, res) => {
  try {
    const limit = Math.max(
      1,
      Math.min(20, parseInt(String(req.query.limit || "4"), 10))
    );
    const feedback = await Feedback.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .populate("user_id", "fullName avatar");

    const transformed = feedback.map((f: any) => ({
      _id: f._id,
      name: f.user_id?.fullName || f.name || "Anonymous",
      avatar: f.user_id?.avatar || undefined,
      created_at: f.created_at,
    }));

    res.status(200).json({ success: true, feedback: transformed });
  } catch (err: any) {
    console.error("Error fetching recent feedback:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch recent feedback" });
  }
});

// Export both default and named export for compatibility

export default feedbackRouter;
