import express from "express";
import { TravelData } from "../models/travel-data";
import { UploadSession } from "../models/upload-session";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Get file history for the authenticated user
router.get("/history", authenticateToken, async (req, res) => {
  try {
    // Ensure middleware attached a user (runtime guard for TypeScript narrowing)
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    // Debug: log authenticated user
    console.debug(
      "Authenticated user for file history:",
      req.user && (req.user as any)._id
    );

    // Get unique upload sessions with their metadata
    const sessions = await UploadSession.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .lean();

    console.debug("Found upload sessions:", sessions.length);

    // Get associated travel data counts for each session
    const history = await Promise.all(
      sessions.map(async (session) => {
        // TravelData stores session_id as a string (sessionDoc._id.toString())
        const sessionIdStr = String((session as any)._id);
        const recordCount = await TravelData.countDocuments({
          session_id: sessionIdStr,
        });

        // Map fields with safe fallbacks for older/newer schema shapes
        const originalName = (session as any).original_name || session.filename;
        const columns = (session as any).columns || [];
        const fileType = (session as any).file_type || "csv";

        return {
          _id: String((session as any)._id),
          filename: session.filename,
          original_name: originalName,
          created_at: session.created_at,
          metadata: {
            total_rows: recordCount,
            columns,
            file_type: fileType,
          },
        };
      })
    );

    res.json(history);
  } catch (error) {
    console.error("Error fetching file history:", error);
    res.status(500).json({ error: "Failed to fetch file history" });
  }
});

// Restore file by ID
router.post("/:sessionId/restore", authenticateToken, async (req, res) => {
  try {
    console.debug(
      "Restore request received for session:",
      req.params.sessionId
    );

    // Ensure JSON response type
    res.setHeader("Content-Type", "application/json");

    // Ensure middleware attached a user (runtime guard for TypeScript narrowing)
    if (!req.user) {
      console.debug("No user found in request");
      return res.status(401).json({ error: "Authentication required" });
    }

    console.debug("User authenticated:", req.user._id);

    // Find the upload session
    const session = await UploadSession.findOne({
      _id: req.params.sessionId,
      user_id: req.user._id,
    });

    if (!session) {
      console.debug("Session not found:", req.params.sessionId);
      return res.status(404).json({ error: "Session not found" });
    }

    console.debug("Session found:", session._id);

    // Get the associated travel data (session_id is stored as a string)
    const travelData = await TravelData.find({
      session_id: session._id.toString(),
    }).lean();

    console.debug("Found travel data records:", travelData.length);

    if (!travelData.length) {
      return res.status(404).json({ error: "No data found for this session" });
    }

    // Return the session and its data for restoration
    // Normalize ObjectId fields to strings before sending to client
    const normalizedData = travelData.map((d: any) => ({
      ...d,
      _id: String(d._id),
      id: d._id ? String(d._id) : d.id,
    }));

    const response = {
      session: {
        _id: String((session as any)._id),
        filename: session.filename,
        created_at: session.created_at,
      },
      data: normalizedData,
    };

    console.debug("Sending response with session ID:", response.session._id);
    res.json(response);
  } catch (error) {
    console.error("Error restoring session:", error);
    res.status(500).json({ error: "Failed to restore session" });
  }
});

// Delete file and its associated data
router.delete("/:sessionId", authenticateToken, async (req, res) => {
  try {
    // Ensure middleware attached a user (runtime guard for TypeScript narrowing)
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Find the upload session
    const session = await UploadSession.findOne({
      _id: req.params.sessionId,
      user_id: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Delete associated travel data first
    await TravelData.deleteMany({
      session_id: session._id.toString(),
    });

    // Then delete the session
    await UploadSession.deleteOne({ _id: session._id });

    res.json({ message: "Session and associated data deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

export default router;
