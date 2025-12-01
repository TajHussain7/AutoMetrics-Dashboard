import { Router, Request, Response } from "express";
import { User, IUser } from "../models/user";
import { Announcement } from "../models/announcement";
import { Query } from "../models/query";
import { Review } from "../models/review";
import { File } from "../models/file";
import { FileData } from "../models/file-data";
import { UploadSession } from "../models/upload-session";
import { isAdmin, authenticateToken } from "../middleware/auth";

const router = Router();

// ========================
// USERS MANAGEMENT
// ========================

// Get all users (admin only)
router.get("/users", isAdmin, async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, "-password").select(
      "fullName email role status createdAt company_name phone_number"
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

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete user (admin only)
router.delete(
  "/users/:userId",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const user = await User.findByIdAndDelete(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
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
    console.debug("[/storage] Starting...");

    // Aggregation pipeline: group upload sessions by user_id and sum sizes
    const fileStats = await UploadSession.aggregate([
      {
        $group: {
          _id: "$user_id",
          totalSizeBytes: { $sum: "$size" },
        },
      },
    ]);

    console.debug("[/storage] fileStats:", fileStats);

    // Create a map for quick lookup, skip null user_ids
    const fileSizeMap = new Map<string, number>();
    for (const stat of fileStats) {
      if (stat._id !== null && stat._id !== undefined) {
        fileSizeMap.set(stat._id.toString(), stat.totalSizeBytes || 0);
      }
    }
    console.debug("[/storage] fileSizeMap:", Array.from(fileSizeMap.entries()));

    // Get all users
    console.debug("[/storage] Fetching users...");
    const users = await User.find().select(
      "fullName email storage_quota_bytes"
    );
    console.debug("[/storage] Found", users.length, "users");

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

    console.debug(
      "[/storage] Sending response with",
      storageData.length,
      "users"
    );
    res.json({ data: storageData, summary });
  } catch (error: any) {
    console.error("[/storage] ERROR:", error.message);
    console.error("[/storage] Stack:", error.stack);
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

// ADMIN: Clear storage for a specific user (deletes File and FileData documents)
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

      res.json({
        message: "User storage cleared",
        deletedFiles: fResult.deletedCount,
        deletedFileData: fdResult.deletedCount,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ADMIN: Clear storage for ALL users
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
      res.json({
        message: "All storage cleared",
        deletedFiles: fResult.deletedCount,
        deletedFileData: fdResult.deletedCount,
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
      .sort({ created_at: -1 });
    res.json(announcements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create announcement
router.post("/announcements", isAdmin, async (req: Request, res: Response) => {
  try {
    const { title, content, broadcastEmail } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    console.debug("\n📝 [CREATE ANNOUNCEMENT] Starting process");
    console.debug(`   ├─ Title: ${title}`);
    console.debug(`   ├─ Content length: ${content.length} chars`);

    const announcement = new Announcement({
      title,
      content,
      created_by: (req as any).user._id,
    });

    await announcement.save();
    await announcement.populate("created_by", "fullName email");
    console.debug(`   ├─ ✅ Saved to DB: ${announcement._id}`);

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
      console.debug(
        `   ├─ ✅ Pushed refs to ${updateResult.modifiedCount} users`
      );
    } catch (pushErr) {
      console.error(`   ├─ ❌ Failed to push refs:`, pushErr);
    }

    // Broadcast announcement via WebSocket (if server has it)
    try {
      const wsServer = (global as any).__wsServer;
      if (wsServer) {
        console.debug(`   ├─ WebSocket server found`);
        const broadcastData = {
          type: "ANNOUNCEMENT_CREATED",
          data: {
            _id: announcement._id,
            title: announcement.title,
            content: announcement.content,
            created_at: announcement.created_at,
            created_by: announcement.created_by,
          },
        };
        const sentCount = wsServer.broadcast(broadcastData);
        console.debug(`   ├─ ✅ Broadcasted to ${sentCount} clients`);
      } else {
        console.debug(`   ├─ ⚠️  WebSocket server not available`);
      }
    } catch (wsErr) {
      console.error(`   ├─ ❌ Broadcast error:`, wsErr);
    }

    console.debug(`   └─ ✅ Announcement creation complete\n`);

    res.status(201).json(announcement);
  } catch (error: any) {
    console.error(`❌ [CREATE ANNOUNCEMENT ERROR]:`, error.message);
    res.status(500).json({ message: error.message });
  }
});

// Update announcement
router.patch(
  "/announcements/:id",
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const { title, content } = req.body;
      const announcement = await Announcement.findByIdAndUpdate(
        req.params.id,
        { title, content },
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
        console.error("Failed to cleanup user announcement refs:", cleanupErr);
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

// Get all queries
router.get("/queries", isAdmin, async (req: Request, res: Response) => {
  try {
    const queries = await Query.find()
      .populate("user_id", "fullName email")
      .sort({ created_at: -1 });
    res.json(queries);
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
  async (req: Request, res: Response) => {
    try {
      const { subject, message } = req.body;

      if (!subject || !message) {
        return res
          .status(400)
          .json({ message: "Subject and message are required" });
      }

      const query = new Query({
        user_id: (req as any).user._id,
        subject,
        message,
      });

      await query.save();
      await query.populate("user_id", "fullName email");
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
      const { reply } = req.body;

      if (!reply) {
        return res.status(400).json({ message: "Reply is required" });
      }

      const query = await Query.findByIdAndUpdate(
        req.params.id,
        { reply, status: "replied" },
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
    const openQueries = await Query.countDocuments({ status: "open" });
    const pendingReviews = await Review.countDocuments({ status: "pending" });
    const approvedReviews = await Review.countDocuments({ status: "approved" });

    const users = await User.find();
    const files = await File.find();
    const totalStorageUsed = files.reduce(
      (sum, file) => sum + (file.size || 0),
      0
    );
    const totalQuota = users.length * 10 * 1024 * 1024 * 1024; // 10GB per user

    res.json({
      totalUsers,
      totalAdmins,
      openQueries,
      pendingReviews,
      approvedReviews,
      totalStorageUsed: parseFloat(
        (totalStorageUsed / (1024 * 1024 * 1024)).toFixed(2)
      ),
      totalQuota: parseFloat((totalQuota / (1024 * 1024 * 1024)).toFixed(2)),
      storagePercentage: Math.round((totalStorageUsed / totalQuota) * 100),
      averageStoragePerUser: parseFloat(
        (totalStorageUsed / (users.length || 1) / (1024 * 1024 * 1024)).toFixed(
          2
        )
      ),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
