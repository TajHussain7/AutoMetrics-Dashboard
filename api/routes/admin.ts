import { Router, Request, Response } from "express";
import { User } from "../models/user";
import { Announcement } from "../models/announcement";
import { Query } from "../models/query";
import { Review } from "../models/review";
import { File } from "../models/file";
import { FileData } from "../models/file-data";
import { UploadSession } from "../models/upload-session";
import { TravelData } from "../models/travel-data";
import { Feedback } from "../models/feedback";
import { Contact } from "../models/contact";
import { EmailVerification } from "../models/emailVerification";
import {
  isAdmin,
  authenticateToken,
  requireActiveUser,
} from "../middleware/auth";
import { debug, info, warn, error } from "../utils/logger.js";
import fs from "fs";
import path from "path";

const router = Router();

// ========================
// USERS MANAGEMENT
// ========================

// Get all users (admin only)
router.get("/users", isAdmin, async (req: Request, res: Response) => {
  try {
    // Include verification fields so admin can view whether users are verified
    const users = await User.find({}, "-password").select(
      "fullName email role status createdAt company_name phone_number isVerified emailVerifiedAt"
    );
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get("/users/:userId", isAdmin, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update user role (admin only)
router.patch(
  "/users/:userId/role",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!["member", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, select: "-password" }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update user status (admin only)
router.patch(
  "/users/:userId/status",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { status },
        { new: true, select: "-password" }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Attempt to notify the user by email about status change (best-effort)
      try {
        const nodemailer = await import("nodemailer");
        const from =
          process.env.SMTP_FROM ||
          process.env.RESEND_FROM ||
          process.env.ADMIN_EMAIL ||
          "no-reply@example.com";
        if (
          process.env.SMTP_HOST &&
          process.env.SMTP_USER &&
          process.env.SMTP_PASS
        ) {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          const subject =
            status === "inactive"
              ? "Your account has been deactivated"
              : "Your account has been reactivated";

          const html = `
            <p>Hi ${user.fullName || user.email},</p>
            <p>Your account has been <strong>${
              status === "inactive" ? "deactivated" : "reactivated"
            }</strong> by an administrator.</p>
            <p>If you have questions, please reply to this email or contact support.</p>
          `;

          await transporter.sendMail({
            from,
            to: user.email,
            subject,
            html,
          });
        }
      } catch (emailErr) {
        warn("Failed to send status notification email:", emailErr);
      }

      // Broadcast account status change via Announcement WebSocket (best-effort)
      try {
        const wsServer = (global as any).__wsServer;
        if (wsServer && typeof wsServer.broadcast === "function") {
          wsServer.broadcast({
            type: "ACCOUNT_STATUS_CHANGED",
            data: { userId: String(user._id), status },
          });
        }
      } catch (wsErr) {
        error("Failed to broadcast account status change:", wsErr);
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete user (admin only) with cascading cleanup of related data
router.delete(
  "/users/:userId",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Collect files for the user and remove their related FileData entries
      const files = await File.find({ user_id: userId }).select("_id");
      const fileIds = files.map((f) => f._id);

      let deletedFileData = 0;
      let deletedFiles = 0;
      let deletedUploadSessions = 0;
      let deletedQueries = 0;
      let deletedTravelData = 0;
      let deletedFeedback = 0;
      let deletedEmailVerifications = 0;
      let cleanedContacts = 0;
      let deletedAttachmentFiles = 0;

      try {
        const fdResult = await FileData.deleteMany({
          file_id: { $in: fileIds },
        });
        deletedFileData = fdResult.deletedCount || 0;
      } catch (err) {
        error("Failed to delete file data for user:", err);
      }

      try {
        const fResult = await File.deleteMany({ user_id: userId });
        deletedFiles = fResult.deletedCount || 0;
      } catch (err) {
        error("Failed to delete files for user:", err);
      }

      // Remove upload sessions associated with the user
      try {
        const uResult = await UploadSession.deleteMany({ user_id: userId });
        deletedUploadSessions = uResult.deletedCount || 0;
      } catch (err) {
        error("Failed to delete upload sessions for user:", err);
      }

      // Delete support queries/threads for the user (keep reviews intact)
      try {
        // First, find queries so we can remove uploaded attachments from disk
        const userQueries = await Query.find({ user_id: userId }).lean();
        try {
          const uploadsDir = path.resolve(__dirname, "..", "uploads");
          for (const q of userQueries) {
            const messages = (q as any).messages || [];
            for (const m of messages) {
              const attachments = m.attachments || [];
              for (const a of attachments) {
                if (!a || !a.url) continue;
                try {
                  // Only handle local uploads served under /uploads/
                  const url = String(a.url);
                  const parsed = url.split("/");
                  const fileName = parsed[parsed.length - 1];
                  if (!fileName) continue;
                  const filePath = path.join(uploadsDir, fileName);
                  if (fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath);
                    deletedAttachmentFiles++;
                  }
                } catch (fileErr) {
                  error("Failed to delete attachment file:", fileErr);
                }
              }
            }
          }
        } catch (fsErr) {
          error("Failed to cleanup attachment files:", fsErr);
        }

        const qResult = await Query.deleteMany({ user_id: userId });
        deletedQueries = qResult.deletedCount || 0;
      } catch (err) {
        error("Failed to delete queries for user:", err);
      }

      // Delete travel data belonging to this user
      try {
        const tdResult = await TravelData.deleteMany({ user_id: userId });
        deletedTravelData = tdResult.deletedCount || 0;
      } catch (err) {
        error("Failed to delete travel data for user:", err);
      }

      // Preserve feedback authored by this user (do NOT delete).
      // The user self-delete flow keeps feedback entries to retain historical records.
      try {
        // Optionally count feedback for reporting purposes but do not delete
        const fbCount = await Feedback.countDocuments({
          $or: [
            { user_id: userId },
            { email: (user.email || "").toLowerCase() },
          ],
        });
        // No feedback is deleted when an admin removes a user to match self-delete behavior
        deletedFeedback = 0;
      } catch (err) {
        error("Failed to inspect feedback for user:", err);
      }

      // Delete any email verifications for this user
      try {
        const evResult = await EmailVerification.deleteMany({ userId: userId });
        deletedEmailVerifications = evResult.deletedCount || 0;
      } catch (err) {
        error("Failed to delete email verifications for user:", err);
      }

      // For contact messages where this user was the responder, unset the response_by
      try {
        const updateResult = await Contact.updateMany(
          { response_by: userId },
          { $unset: { response_by: "", response_at: "" } }
        );
        cleanedContacts = updateResult.modifiedCount || 0;
      } catch (err) {
        error("Failed to cleanup contacts for user:", err);
      }

      // If user authored announcements, keep the announcement but clear created_by
      try {
        await Announcement.updateMany(
          { created_by: userId },
          { $set: { created_by: null } }
        );
      } catch (err) {
        error("Failed to unset announcement authorship:", err);
      }

      // Unset any assigned_to references on queries pointing to this user
      try {
        await Query.updateMany(
          { assigned_to: userId },
          { $unset: { assigned_to: "" } }
        );
      } catch (err) {
        error("Failed to unset assigned_to in queries:", err);
      }

      // Finally delete the user document
      await User.findByIdAndDelete(userId);

      res.json({
        message: "User deleted successfully",
        deletedFiles,
        deletedFileData,
        deletedUploadSessions,
        deletedQueries,
        deletedAttachmentFiles,
        deletedTravelData,
        deletedFeedback,
        deletedEmailVerifications,
        cleanedContacts,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get user storage info
router.get("/users/:userId/storage", async (req: Request, res: Response) => {
  try {
    const files = await File.find({ user_id: req.params.userId });
    const used = files.reduce((sum, file) => sum + (file.size || 0), 0);
    // Prefer per-user quota if present
    const user = await User.findById(req.params.userId).lean();
    const quota = user?.storage_quota_bytes ?? 10 * 1024 * 1024 * 1024; // 10GB
    const percentage = Math.round((used / quota) * 100);

    res.json({
      used: (used / (1024 * 1024 * 1024)).toFixed(2),
      quota: quota / (1024 * 1024 * 1024),
      percentage,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN: Get storage usage per user and global summary (using aggregation pipeline for performance)
router.get("/storage", isAdmin, async (req: Request, res: Response) => {
  try {
    debug("[/storage] Starting");

    // Aggregation pipeline: group upload sessions by user_id and sum sizes
    const fileStats = await UploadSession.aggregate([
      {
        $group: {
          _id: "$user_id",
          totalSizeBytes: { $sum: "$size" },
        },
      },
    ]);

    debug("[/storage] fileStats length:", fileStats.length);

    // Create a map for quick lookup, skip null user_ids
    const fileSizeMap = new Map<string, number>();
    for (const stat of fileStats) {
      if (stat._id !== null && stat._id !== undefined) {
        fileSizeMap.set(stat._id.toString(), stat.totalSizeBytes || 0);
      }
    }
    debug("[/storage] fileSizeMap size:", fileSizeMap.size);

    // Get all users
    debug("[/storage] Fetching users...");
    const users = await User.find().select(
      "fullName email storage_quota_bytes"
    );
    debug("[/storage] Found", users.length, "users");

    const storageData = [] as any[];
    let totalUsed = 0;
    let totalQuota = 0;

    for (const u of users) {
      const user = u as any;
      const userId = user._id?.toString() || "";
      const usedBytes = fileSizeMap.get(userId) || 0;
      const quota = user.storage_quota_bytes ?? 10 * 1024 * 1024 * 1024;
      totalUsed += usedBytes;
      totalQuota += quota;

      storageData.push({
        userId: user._id,
        userName: user.fullName || user.email,
        usedBytes,
        used: Number((usedBytes / (1024 * 1024 * 1024)).toFixed(3)),
        quotaBytes: quota,
        quota: Number((quota / (1024 * 1024 * 1024)).toFixed(1)),
        percentage: Math.min(100, Math.round((usedBytes / quota) * 100)),
      });
    }

    const summary = {
      totalUsedBytes: totalUsed,
      totalUsed: Number((totalUsed / (1024 * 1024 * 1024)).toFixed(2)),
      totalQuotaBytes: totalQuota,
      totalQuota: Number((totalQuota / (1024 * 1024 * 1024)).toFixed(1)),
      percentage:
        totalQuota > 0 ? Math.round((totalUsed / totalQuota) * 100) : 0,
    };

    debug("[/storage] Sending response with", storageData.length, "users");
    res.json({ data: storageData, summary });
  } catch (error: any) {
    error("[/storage] ERROR:", error.message);
    error("[/storage] Stack:", error.stack);
    res.status(500).json({
      message: error.message,
      type: error.constructor.name,
    });
  }
});

// ADMIN: Update user's storage quota (GB)
router.patch(
  "/users/:userId/storage",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { quotaGb } = req.body;
      if (quotaGb == null || isNaN(Number(quotaGb))) {
        return res.status(400).json({ message: "Invalid quota value" });
      }
      const quotaBytes = Math.max(0, Number(quotaGb) * 1024 * 1024 * 1024);
      const user = await User.findByIdAndUpdate(
        userId,
        { storage_quota_bytes: quotaBytes },
        { new: true, select: "fullName email storage_quota_bytes" }
      );
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({
        message: "Quota updated",
        quotaGb: quotaBytes / (1024 * 1024 * 1024),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ADMIN: Clear storage for a specific user (deletes File, FileData and upload sessions)
router.post(
  "/storage/clear/:userId",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const files = await File.find({ user_id: userId }).select("_id");
      const fileIds = files.map((f) => f._id);

      // Delete file data entries
      const fdResult = await FileData.deleteMany({ file_id: { $in: fileIds } });
      const fResult = await File.deleteMany({ user_id: userId });

      // Delete upload sessions (these count towards storage usage)
      const uResult = await UploadSession.deleteMany({ user_id: userId });

      // Cleanup local attachment files referenced in the user's queries (do NOT delete the query documents themselves)
      let deletedAttachmentFiles = 0;
      try {
        const userQueries = await Query.find({ user_id: userId }).lean();
        const uploadsDir = path.resolve(__dirname, "..", "uploads");
        for (const q of userQueries) {
          const messages = (q as any).messages || [];
          for (const m of messages) {
            const attachments = m.attachments || [];
            for (const a of attachments) {
              if (!a || !a.url) continue;
              try {
                // Only handle local uploads served under /uploads/
                const url = String(a.url);
                const parsed = url.split("/");
                const fileName = parsed[parsed.length - 1];
                if (!fileName) continue;
                const filePath = path.join(uploadsDir, fileName);
                if (fs.existsSync(filePath)) {
                  await fs.promises.unlink(filePath);
                  deletedAttachmentFiles++;
                }
              } catch (fileErr) {
                error("Failed to delete attachment file:", fileErr);
              }
            }
          }
        }
      } catch (fsErr) {
        error("Failed to cleanup attachment files for user:", fsErr);
      }

      res.json({
        message: "User storage cleared",
        deletedFiles: fResult.deletedCount,
        deletedFileData: fdResult.deletedCount,
        deletedUploadSessions: uResult.deletedCount,
        deletedAttachmentFiles,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ADMIN: Clear storage for ALL users (deletes File, FileData, UploadSessions and uploaded files)
router.post(
  "/storage/clearAll",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const allFiles = await File.find().select("_id");
      const allFileIds = allFiles.map((f) => f._id);
      const fdResult = await FileData.deleteMany({
        file_id: { $in: allFileIds },
      });
      const fResult = await File.deleteMany({});

      // Delete all upload sessions (storage accounting)
      const uResult = await UploadSession.deleteMany({});

      // Remove all files in the uploads directory (attachments)
      let deletedFilesCount = 0;
      try {
        const uploadsDir = path.resolve(__dirname, "..", "uploads");
        if (fs.existsSync(uploadsDir)) {
          const files = await fs.promises.readdir(uploadsDir);
          for (const fileName of files) {
            try {
              const p = path.join(uploadsDir, fileName);
              const stat = await fs.promises.stat(p);
              if (stat.isFile()) {
                await fs.promises.unlink(p);
                deletedFilesCount++;
              }
            } catch (err) {
              error("Failed to delete upload file:", err);
            }
          }
        }
      } catch (fsErr) {
        error("Failed to cleanup uploads directory:", fsErr);
      }

      res.json({
        message: "All storage cleared",
        deletedFiles: fResult.deletedCount,
        deletedFileData: fdResult.deletedCount,
        deletedUploadSessions: uResult.deletedCount,
        deletedUploadFilesOnDisk: deletedFilesCount,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ========================
// ANNOUNCEMENTS
// ========================

// Get all announcements
router.get("/announcements", isAdmin, async (req: Request, res: Response) => {
  try {
    const announcements = await Announcement.find()
      .populate("created_by", "fullName email")
      .sort({ pinned: -1, created_at: -1 });
    res.json(announcements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create announcement
router.post("/announcements", isAdmin, async (req: Request, res: Response) => {
  try {
    const { title, content, broadcastEmail, pinned, attachments } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    debug("CREATE ANNOUNCEMENT: Starting", { title, pinned: Boolean(pinned) });

    // Basic validation for attachments array - only accept uploads served from our uploads directory
    const validatedAttachments: any[] = [];
    if (Array.isArray(attachments)) {
      for (const a of attachments) {
        if (!a || typeof a.url !== "string") continue;
        // Accept local uploads (starting with /uploads/) OR absolute URLs to same host
        if (!a.url.startsWith("/uploads/") && !a.url.startsWith("http"))
          continue;
        validatedAttachments.push({
          filename: a.filename,
          url: a.url,
          mimeType: a.mimeType || a.type,
          size: a.size || 0,
        });
      }
    }

    const announcement = new Announcement({
      title,
      content,
      attachments: validatedAttachments,
      pinned: Boolean(pinned),
      pinned_at: pinned ? new Date() : null,
      created_by: (req as any).user._id,
      // For admin-created UI announcements, mark as broadcast when requested
      broadcast: Boolean(broadcastEmail || pinned),
    });

    await announcement.save();
    await announcement.populate("created_by", "fullName email");
    debug(`Saved announcement to DB`, { id: announcement._id });

    // Insert lightweight references into each user's announcements array
    try {
      const updateResult = await User.updateMany(
        {},
        {
          $push: {
            announcements: {
              announcement: announcement._id,
              read: false,
              notified: false,
              created_at: new Date(),
            },
          },
        }
      );
      debug("Pushed announcement refs to users", {
        count: updateResult.modifiedCount,
      });
    } catch (pushErr) {
      error(`   ├─ ❌ Failed to push refs:`, pushErr);
    }

    // Broadcast announcement via WebSocket (if server has it)
    try {
      const wsServer = (global as any).__wsServer;
      if (wsServer) {
        debug(`WebSocket server found`);
        const broadcastData = {
          type: "ANNOUNCEMENT_CREATED",
          data: {
            _id: announcement._id,
            title: announcement.title,
            content: announcement.content,
            attachments: announcement.attachments || [],
            pinned: announcement.pinned || false,
            created_at: announcement.created_at,
            created_by: announcement.created_by,
            // Include broadcast flag and recipients metadata so clients can
            // decide whether to surface the toast to the current user.
            broadcast: Boolean(announcement.broadcast || false),
            recipients: announcement.recipients || [],
          },
        };
        const sentCount = wsServer.broadcast(broadcastData);
        debug("Broadcasted announcement to clients", { sentCount });
      } else {
        debug("WebSocket server not available for broadcast");
      }
    } catch (wsErr) {
      error(`   ├─ ❌ Broadcast error:`, wsErr);
    }

    debug(`Announcement creation complete`);

    res.status(201).json(announcement);
  } catch (error: any) {
    error(`❌ [CREATE ANNOUNCEMENT ERROR]:`, error.message);
    res.status(500).json({ message: error.message });
  }
});

// Delete all announcements (must come BEFORE /:id routes for proper matching)
router.delete(
  "/announcements/all",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await Announcement.deleteMany({});
      // Clean up all user announcement references
      try {
        await User.updateMany({}, { $set: { announcements: [] } });
      } catch (cleanupErr) {
        error("Failed to cleanup user announcement refs:", cleanupErr);
      }
      res.json({
        message: "All announcements deleted successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update announcement
router.patch(
  "/announcements/:id",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { title, content, pinned, attachments } = req.body;

      const update: any = {};
      if (typeof title !== "undefined") update.title = title;
      if (typeof content !== "undefined") update.content = content;
      if (typeof attachments !== "undefined") update.attachments = attachments;

      if (typeof pinned !== "undefined") {
        update.pinned = Boolean(pinned);
        update.pinned_at = pinned ? new Date() : null;
      }

      const announcement = await Announcement.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true }
      ).populate("created_by", "fullName email");

      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete announcement
router.delete(
  "/announcements/:id",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const announcement = await Announcement.findByIdAndDelete(req.params.id);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      // Clean up any user references to this announcement but DO NOT delete users
      try {
        await User.updateMany(
          {},
          { $pull: { announcements: { announcement: announcement._id } } }
        );
      } catch (cleanupErr) {
        error("Failed to cleanup user announcement refs:", cleanupErr);
      }

      res.json({ message: "Announcement deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ========================
// QUERIES & SUPPORT
// ========================

// Debug: show a user's announcements entries and all announcements (admin only)
router.get(
  "/debug/user-announcements/:userId",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.params.userId).select(
        "announcements email fullName"
      );
      const announcements = await Announcement.find().sort({ created_at: -1 });
      res.json({ user, announcements });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/queries", isAdmin, async (req: Request, res: Response) => {
  try {
    const {
      status,
      userId,
      category,
      startDate,
      endDate,
      search,
      page = "1",
      limit = "50",
    } = req.query as any;
    const queryObj: any = {};

    if (status) queryObj.status = status;
    if (userId) queryObj.user_id = userId;
    if (category) queryObj.category = category;

    if (startDate || endDate) {
      queryObj.created_at = {};
      if (startDate) queryObj.created_at.$gte = new Date(startDate);
      if (endDate) queryObj.created_at.$lte = new Date(endDate);
    }

    if (search) {
      queryObj.$or = [
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const p = Math.max(1, parseInt(page, 10));
    const l = Math.max(1, parseInt(limit, 10));

    const total = await Query.countDocuments(queryObj);
    const queries = await Query.find(queryObj)
      .populate("user_id", "fullName email")
      .sort({ created_at: -1 })
      .skip((p - 1) * l)
      .limit(l);

    res.json({
      queries,
      total,
      page: p,
      totalPages: Math.max(1, Math.ceil(total / l)),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get query by ID
router.get("/queries/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const query = await Query.findById(req.params.id).populate(
      "user_id",
      "fullName email"
    );
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }
    res.json(query);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Submit a query (authenticated users)
router.post(
  "/queries",
  authenticateToken,
  requireActiveUser,
  async (req: Request, res: Response) => {
    try {
      const { subject, message, category, priority, attachments } = req.body;

      if (!subject || !message) {
        return res
          .status(400)
          .json({ message: "Subject and message are required" });
      }

      const query = new Query({
        user_id: (req as any).user._id,
        subject,
        message,
        category: category || undefined,
        priority: priority || undefined,
        messages: [
          {
            author: "user",
            message,
            attachments: Array.isArray(attachments) ? attachments : [],
            created_at: new Date(),
          },
        ],
      });

      await query.save();
      await query.populate("user_id", "fullName email");

      // Optionally notify admins via announcement websocket (internal; not broadcast)
      try {
        const announcement = new Announcement({
          title: `New support query: ${subject}`,
          content: `${
            (req as any).user.fullName || "A user"
          } submitted a query: ${subject}`,
          created_by: (req as any).user._id,
          recipients: [],
          broadcast: false,
        });
        await announcement.save();
        // Broadcast a lightweight event to connected admin clients so dashboards update in real-time
        try {
          const wsServer = (global as any).__wsServer;
          if (wsServer) {
            const broadcastData = {
              type: "QUERY_CREATED",
              data: {
                queryId: query._id,
                subject: query.subject,
                userId: (req as any).user._id,
              },
            };
            const sentCount = wsServer.broadcast(broadcastData);
            debug(`Broadcasted QUERY_CREATED`, { sentCount });
          }
        } catch (wsErr) {
          error("Failed to broadcast QUERY_CREATED:", wsErr);
        }
      } catch (notifyErr) {
        error("Failed to create admin notification for query:", notifyErr);
      }

      res.status(201).json(query);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Reply to query (admin only)
router.patch(
  "/queries/:id/reply",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { reply, attachments, status } = req.body;

      if (!reply || !reply.trim()) {
        return res.status(400).json({ message: "Reply is required" });
      }

      const q = await Query.findById(req.params.id);
      if (!q) return res.status(404).json({ message: "Query not found" });

      q.messages = q.messages || [];
      q.messages.push({
        author: "admin",
        message: reply,
        attachments: Array.isArray(attachments) ? attachments : [],
        created_at: new Date(),
      } as any);

      q.status = status || "answered";
      // Keep legacy reply field for compatibility
      q.reply = reply;

      await q.save();
      await q.populate("user_id", "fullName email");

      // Create an announcement for the user so they get notified
      try {
        const userId = (q as any).user_id?._id || (q as any).user_id;
        const announcement = new Announcement({
          title: `Reply to your support query: ${q.subject}`,
          content: reply,
          created_by: (req as any).user._id,
          // Target the announcement to the specific user only
          recipients: userId ? [userId] : [],
          broadcast: false,
        });
        await announcement.save();

        // Add announcement reference to user (unread)
        if (userId) {
          await (
            await (q as any).populate("user_id")
          ).user_id.updateOne({
            $push: {
              announcements: {
                announcement: announcement._id,
                read: false,
                notified: false,
                created_at: new Date(),
              },
            },
          } as any);
        }

        // Broadcast a real-time notification for the query reply
        try {
          const wsServer = (global as any).__wsServer;
          if (wsServer) {
            const broadcastData = {
              type: "QUERY_REPLY",
              data: {
                queryId: q._id,
                userId: userId,
                reply,
                announcementId: announcement._id,
              },
            };
            const sent = wsServer.broadcast(broadcastData);
            debug(`Broadcasted QUERY_REPLY to clients`, { sent });
          } else {
            debug(`WebSocket server not available for QUERY_REPLY`);
          }
        } catch (wsErr) {
          error("Failed to broadcast QUERY_REPLY:", wsErr);
        }
      } catch (notifyErr) {
        error("Failed to notify user about query reply:", notifyErr);
      }

      res.json(q);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Admin: React to a message (like/dislike)
router.patch(
  "/queries/:id/messages/:messageId/reactions",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { type } = req.body;
      if (!type || !["like", "dislike"].includes(type)) {
        return res.status(400).json({ message: "Invalid reaction type" });
      }

      const q = await Query.findById(req.params.id);
      if (!q) return res.status(404).json({ message: "Query not found" });

      // Robustly find the sub-message by its _id without relying on Mongoose's
      // DocumentArray.id (which TypeScript may not recognize on the typed array).
      const msg = (q.messages || []).find(
        (m: any) => String((m as any)._id) === String(req.params.messageId)
      ) as any;
      if (!msg) return res.status(404).json({ message: "Message not found" });

      msg.reactions = msg.reactions || [];
      const existing = msg.reactions.find(
        (r: any) => String(r.user) === String((req as any).user._id)
      );
      if (existing) {
        if (existing.type === type) {
          msg.reactions = msg.reactions.filter(
            (r: any) => String(r.user) !== String((req as any).user._id)
          );
        } else {
          existing.type = type;
        }
      } else {
        msg.reactions.push({ user: (req as any).user._id, type });
      }

      await q.save();
      res.json(q);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Admin: React to the query (like/dislike)
router.patch(
  "/queries/:id/reactions",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { type } = req.body;
      if (!type || !["like", "dislike"].includes(type)) {
        return res.status(400).json({ message: "Invalid reaction type" });
      }

      const q = await Query.findById(req.params.id);
      if (!q) return res.status(404).json({ message: "Query not found" });

      q.reactions = q.reactions || [];
      const existing = q.reactions.find(
        (r: any) => String(r.user) === String((req as any).user._id)
      );
      if (existing) {
        if (existing.type === type) {
          q.reactions = q.reactions.filter(
            (r: any) => String(r.user) !== String((req as any).user._id)
          );
        } else {
          existing.type = type;
        }
      } else {
        q.reactions.push({ user: (req as any).user._id, type });
      }

      await q.save();
      res.json(q);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Close query (admin only)
router.patch(
  "/queries/:id/close",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const query = await Query.findByIdAndUpdate(
        req.params.id,
        { status: "closed" },
        { new: true }
      ).populate("user_id", "fullName email");

      if (!query) {
        return res.status(404).json({ message: "Query not found" });
      }

      res.json(query);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete query (admin only)
router.delete("/queries/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const q = await Query.findById(req.params.id);
    if (!q) return res.status(404).json({ message: "Query not found" });

    const userId = (q as any).user_id?._id || (q as any).user_id;

    // Delete the query
    await Query.deleteOne({ _id: req.params.id });

    // Silently notify the user's clients via WebSocket to remove the query from UI
    // No announcement is created - the query is simply removed
    try {
      const wsServer = (global as any).__wsServer;
      if (wsServer) {
        const broadcastData = {
          type: "QUERY_DELETED",
          data: { queryId: req.params.id, userId },
        };
        const sent = wsServer.broadcast(broadcastData);
        debug("Broadcasted QUERY_DELETED to clients", { sent, userId });
      } else {
        debug("WebSocket server not available for QUERY_DELETED");
      }
    } catch (wsErr) {
      error("Failed to broadcast QUERY_DELETED:", wsErr);
    }

    res.json({ message: "Query deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ========================
// REVIEWS
// ========================

// Get all reviews
router.get("/reviews", isAdmin, async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find()
      .populate("user_id", "fullName email")
      .sort({ created_at: -1 });
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get review by ID
router.get("/reviews/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.id).populate(
      "user_id",
      "fullName email"
    );
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json(review);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create review (authenticated users)
router.post(
  "/reviews",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { title, content, rating } = req.body;

      if (!title || !content || !rating) {
        return res.status(400).json({
          message: "Title, content, and rating are required",
        });
      }

      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ message: "Rating must be between 1 and 5" });
      }

      const review = new Review({
        user_id: (req as any).user._id,
        title,
        content,
        rating,
      });

      await review.save();
      await review.populate("user_id", "fullName email");
      res.status(201).json(review);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Approve review (admin only)
router.patch(
  "/reviews/:id/approve",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const review = await Review.findByIdAndUpdate(
        req.params.id,
        { status: "approved" },
        { new: true }
      ).populate("user_id", "fullName email");

      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(review);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Reject review (admin only)
router.patch(
  "/reviews/:id/reject",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const review = await Review.findByIdAndUpdate(
        req.params.id,
        { status: "rejected" },
        { new: true }
      ).populate("user_id", "fullName email");

      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(review);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete review (admin only)
router.delete("/reviews/:id", isAdmin, async (req: Request, res: Response) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json({ message: "Review deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard statistics
router.get("/dashboard/stats", isAdmin, async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ role: "member" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Queries
    const totalQueries = await Query.countDocuments();
    const openQueries = await Query.countDocuments({ status: "open" });
    // New queries in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newQueries = await Query.countDocuments({
      created_at: { $gte: since },
    });

    // Reviews (kept for backwards compatibility but we'll surface reactivations elsewhere)
    const pendingReviews = await Review.countDocuments({ status: "pending" });
    const approvedReviews = await Review.countDocuments({ status: "approved" });

    // Storage: use UploadSession aggregation (consistent with storage UI)
    const uploadAgg = await UploadSession.aggregate([
      {
        $group: { _id: null, totalSize: { $sum: "$size" }, count: { $sum: 1 } },
      },
    ]);
    const totalStorageBytes = uploadAgg?.[0]?.totalSize || 0;
    const totalUploadedFiles = uploadAgg?.[0]?.count || 0;

    // Contacts: total and pending
    const contactTotal = await Contact.countDocuments();
    const contactPending = await Contact.countDocuments({ responded: false });

    // Reactivation requests: filter contact messages mentioning reactivation
    const reactivationFilter = {
      $or: [{ subject: /reactivation/i }, { message: /reactivate/i }],
    };
    const reactivationTotal = await Contact.countDocuments(reactivationFilter);
    const reactivationPending = await Contact.countDocuments({
      ...reactivationFilter,
      responded: false,
    });

    // Average response time (between query.created_at and first admin message)
    const queriesWithReplies = await Query.find({
      "messages.author": "admin",
    }).lean();
    let totalResponseMillis = 0;
    let responseCount = 0;
    for (const q of queriesWithReplies) {
      const createdAt = q.created_at ? new Date(q.created_at).getTime() : null;
      if (!createdAt) continue;
      const adminMsg = (q.messages || []).find(
        (m: any) => m.author === "admin" && m.created_at
      );
      if (!adminMsg || !adminMsg.created_at) continue;
      const adminAt = new Date(adminMsg.created_at).getTime();
      if (adminAt > createdAt) {
        totalResponseMillis += adminAt - createdAt;
        responseCount++;
      }
    }
    const avgResponseMillis =
      responseCount > 0 ? totalResponseMillis / responseCount : 0;
    const avgResponseMinutes = avgResponseMillis
      ? Math.round(avgResponseMillis / 60000)
      : 0;

    // Debug: log computed stats for verification
    debug("[/dashboard/stats] computed", {
      totalUsers,
      totalAdmins,
      totalQueries,
      newQueries,
      openQueries,
      totalStorageBytes,
      totalUploadedFiles,
      contactTotal,
      contactPending,
      reactivationTotal,
      reactivationPending,
      avgResponseMinutes,
    });

    res.json({
      totalUsers,
      totalAdmins,
      // Queries
      totalQueries,
      newQueries,
      openQueries,
      // Reviews (legacy)
      pendingReviews,
      approvedReviews,
      // Storage
      totalStorageUsed: parseFloat(
        (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2)
      ),
      totalUploadedFiles,
      totalQuota: parseFloat(
        (
          ((totalUsers + totalAdmins) * 10 * 1024 * 1024 * 1024) /
          (1024 * 1024 * 1024)
        ).toFixed(2)
      ),
      storagePercentage: Math.round(
        (totalStorageBytes /
          ((totalUsers + totalAdmins) * 10 * 1024 * 1024 * 1024)) *
          100
      ),
      averageStoragePerUser: parseFloat(
        (
          totalStorageBytes /
          (totalUsers + totalAdmins || 1) /
          (1024 * 1024 * 1024)
        ).toFixed(2)
      ),
      // Contacts & reactivations
      contactTotal,
      contactPending,
      reactivationTotal,
      reactivationPending,
      // Avg response time in minutes
      avgQueryResponseMinutes: avgResponseMinutes,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
