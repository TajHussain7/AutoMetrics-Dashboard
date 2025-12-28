import { Router, Request, Response, NextFunction } from "express";
import { User } from "../models/user.js";
import { authenticateToken, requireActiveUser } from "../middleware/auth.js";
import { debug } from "../utils/logger.js";
import { Query } from "../models/query.js";
import { Announcement } from "../models/announcement.js";

const router = Router();

// Middleware to update lastActive timestamp
// NOTE: Do not automatically re-activate a user who has been explicitly set to 'inactive' by an admin.
const updateLastActive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user) {
    try {
      // Fetch current DB status so we don't overwrite an explicit inactive flag
      const dbUser = await User.findById(req.user.id).select("status");
      const update: any = { lastActive: new Date() };
      if (dbUser && dbUser.status && dbUser.status !== "inactive") {
        update.status = "active";
      }
      await User.findByIdAndUpdate(req.user.id, update);
    } catch (error) {
      console.error("Failed to update lastActive:", error);
    }
  }
  next();
};

// Get user profile
// -------------------------------
// Announcements (user-facing)
// -------------------------------

// Get announcements for authenticated user (includes read flag)
router.get(
  "/announcements",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.id || user._id;
      if (!user || !(user.id || user._id)) {
        console.error(
          "Announcements: user or user._id not found. req.user:",
          user
        );
        return res.status(401).json({ message: "Not authenticated" });
      }

      const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
      const limit = Math.max(1, parseInt(String(req.query.limit || "10"), 10));
      const unreadOnly =
        String(req.query.unread || "").toLowerCase() === "true";
      const search = String(req.query.search || "").trim();

      const queryObj: any = {};
      if (search) {
        queryObj.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ];
      }

      // Load only announcements referenced by this user (or nothing)
      const userDoc = await User.findById(userId).select("announcements");
      const userAnnouncements = userDoc?.announcements || [];

      if (userAnnouncements.length === 0) {
        // No announcements for this user (fast path)
        return res.json({ announcements: [], total: 0, page, totalPages: 1 });
      }

      const ids = userAnnouncements.map((a: any) => a.announcement);

      // Restrict query to user's announcement IDs and apply optional search
      const match: any = { _id: { $in: ids } };
      if (search) {
        match.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ];
      }

      const announcements = await Announcement.find(match)
        .populate({
          path: "created_by",
          select: "fullName email",
          transform: (doc) => doc || { fullName: "System", email: "" },
        })
        .sort({ pinned: -1, created_at: -1 });

      const userMap = new Map<string, any>();
      (userAnnouncements || []).forEach((a: any) =>
        userMap.set(String(a.announcement), a)
      );

      let decorated = announcements.map((a: any) => {
        const readEntry = userMap.get(String(a._id));
        return {
          _id: a._id,
          title: a.title,
          content: a.content,
          attachments: a.attachments || [],
          pinned: Boolean(a.pinned || false),
          pinned_at: a.pinned_at || null,
          created_at: a.created_at,
          created_by: a.created_by,
          read: readEntry ? Boolean(readEntry.read) : false,
        };
      });

      if (unreadOnly) {
        decorated = decorated.filter((d) => !d.read);
      }

      const total = decorated.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const pageItems = decorated.slice(start, start + limit);

      res.json({ announcements: pageItems, total, page, totalPages });
    } catch (error: any) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// User: List my queries
router.get(
  "/queries/me",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user._id || user.id;
      debug(`[GET /queries/me] userId=${userId}`);
      const queries = await Query.find({ user_id: userId }).sort({
        created_at: -1,
      });
      debug(
        `[GET /queries/me] returning ${queries.length} queries for user=${userId}`
      );
      res.json({ queries });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// User: Get a single query (owner only)
router.get(
  "/queries/:id",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      const user = req.user as any;
      const q = await Query.findById(req.params.id).populate(
        "user_id",
        "fullName email"
      );
      if (!q) return res.status(404).json({ message: "Query not found" });

      // Proper MongoDB ObjectId comparison (handles populated doc or raw ObjectId)
      const queryUserId = String((q.user_id as any)?._id ?? q.user_id);
      const currentUserId = String(user._id);

      if (queryUserId !== currentUserId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(q);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// User: Add a follow-up message to a query
router.post(
  "/queries/:id/messages",
  authenticateToken,
  requireActiveUser,
  updateLastActive,
  async (req, res) => {
    try {
      const user = req.user as any;
      const { message, attachments } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }

      const q = await Query.findById(req.params.id);
      if (!q) return res.status(404).json({ message: "Query not found" });

      // Proper MongoDB ObjectId comparison
      if (String(q.user_id) !== String(user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      q.messages = q.messages || [];
      q.messages.push({
        author: "user",
        message,
        attachments: Array.isArray(attachments) ? attachments : [],
        created_at: new Date(),
      } as any);

      // If closed previously, reopen
      if (q.status === "closed") q.status = "open";

      await q.save();

      // Optionally notify admins
      try {
        const announcement = new Announcement({
          title: `Updated support query: ${q.subject}`,
          content: `${user.fullName || "A user"} added a follow-up to query ${
            q.subject
          }`,
          created_by: user._id,
          // Internal: do not broadcast to all users
          recipients: [],
          broadcast: false,
        });
        await announcement.save();
      } catch (err) {
        console.error("Failed to notify admins about query follow-up", err);
      }

      res.json(q);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// User: React to a message (like/dislike)
router.post(
  "/queries/:id/messages/:messageId/reactions",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      const user = req.user as any;
      const { type } = req.body;
      if (!type || !["like", "dislike"].includes(type)) {
        return res.status(400).json({ message: "Invalid reaction type" });
      }

      const q = await Query.findById(req.params.id);
      if (!q) return res.status(404).json({ message: "Query not found" });
      if (String(q.user_id) !== String(user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Find message by _id (avoid relying on DocumentArray.id which TS may not recognize)
      const msg = (q.messages || []).find(
        (m: any) => String((m as any)._id) === String(req.params.messageId)
      ) as any;
      if (!msg) return res.status(404).json({ message: "Message not found" });

      msg.reactions = msg.reactions || [];
      const existing = msg.reactions.find(
        (r: any) => String(r.user) === String(user._id)
      );
      if (existing) {
        if (existing.type === type) {
          // toggle off
          msg.reactions = msg.reactions.filter(
            (r: any) => String(r.user) !== String(user._id)
          );
        } else {
          existing.type = type;
        }
      } else {
        msg.reactions.push({ user: user._id, type });
      }

      await q.save();
      res.json(q);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// User: React to a query (like/dislike)
router.post(
  "/queries/:id/reactions",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      const user = req.user as any;
      const { type } = req.body;
      if (!type || !["like", "dislike"].includes(type)) {
        return res.status(400).json({ message: "Invalid reaction type" });
      }

      const q = await Query.findById(req.params.id);
      if (!q) return res.status(404).json({ message: "Query not found" });
      if (String(q.user_id) !== String(user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      q.reactions = q.reactions || [];
      const existing = q.reactions.find(
        (r: any) => String(r.user) === String(user._id)
      );
      if (existing) {
        if (existing.type === type) {
          q.reactions = q.reactions.filter(
            (r: any) => String(r.user) !== String(user._id)
          );
        } else {
          existing.type = type;
        }
      } else {
        q.reactions.push({ user: user._id, type });
      }

      await q.save();
      res.json(q);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get unread announcement count (lightweight, no announcement data)
router.get(
  "/announcements/unread-count",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.id || user._id;
      if (!user || !(user.id || user._id)) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Compute unread count directly from the user's announcements entries
      const userDoc = await User.findById(userId).select("announcements");
      const unreadCount = (userDoc?.announcements || []).reduce(
        (acc: number, a: any) => acc + (a.read ? 0 : 1),
        0
      );

      res.json({ unreadCount });
    } catch (error: any) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// Public: Return total user count (used for dashboard joining number)
router.get("/count", async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ success: true, count });
  } catch (err: any) {
    console.error("Error fetching user count:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user count" });
  }
});

// Mark an announcement as read for the authenticated user
router.patch(
  "/announcements/:id/read",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      const user = req.user as any;
      if (!user || !user._id) {
        console.error("Mark read: user or user._id not found. req.user:", user);
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = user._id;
      const announcementId = req.params.id;

      // Try to update existing entry
      const updateResult = await User.updateOne(
        { _id: userId, "announcements.announcement": announcementId },
        {
          $set: {
            "announcements.$.read": true,
            "announcements.$.notified": true,
          },
        }
      );

      if (updateResult.matchedCount === 0) {
        // Push a new entry
        await User.findByIdAndUpdate(userId, {
          $push: {
            announcements: {
              announcement: announcementId,
              read: true,
              notified: true,
              created_at: new Date(),
            },
          },
        });
      }

      res.json({ message: "Marked as read" });
    } catch (error: any) {
      console.error("Error marking announcement as read:", error);
      res.status(500).json({
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// Get user profile
router.get(
  "/:userId",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      debug("Fetching user profile:", req.params.userId);
      const user = await User.findById(req.params.userId).select("-password");
      if (!user) {
        debug("User not found");
        return res.status(404).json({ message: "User not found" });
      }
      debug("User found:", user._id);

      // Format user data with consistent field names
      const userData = {
        id: user._id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        created_at: user.createdAt,
        // Add other fields as needed
        company_name: user.company_name || "",
        phone_number: user.phone_number || "",
        address: user.address || "",
        dob: user.dob ? user.dob.toISOString().split("T")[0] : null,
        status: user.status || "active",
        // Include avatar so frontend can render it immediately after load
        avatar: user.avatar || null,
      };

      res.json(userData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update single field (used for real-time field updates)
router.patch(
  "/:userId/field",
  authenticateToken,
  updateLastActive,
  async (req: Request, res: Response) => {
    try {
      const { field, value } = req.body;

      if (!field || value === undefined) {
        return res
          .status(400)
          .json({ message: "Field and value are required" });
      }

      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Apply the update explicitly to known fields (avoids dynamic indexing types)
      switch (field) {
        case "full_name":
          user.fullName = String(value);
          break;
        case "company_name":
          user.company_name = String(value);
          break;
        case "phone_number":
          user.phone_number = String(value);
          break;
        case "address":
          user.address = String(value);
          break;
        case "dob":
          user.dob = new Date(String(value));
          break;
        default:
          return res.status(400).json({ message: "Invalid field name" });
      }

      user.lastActive = new Date();
      // Do not auto-reactivate users when they update profile fields
      await user.save();

      const userData = {
        id: user._id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        created_at: user.createdAt,
        company_name: user.company_name || "",
        phone_number: user.phone_number || "",
        address: user.address || "",
        dob: user.dob ? user.dob.toISOString().split("T")[0] : null,
        status: user.status || "active",
        avatar: user.avatar || null,
      };

      res.json(userData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update user profile
// Handle avatar upload
router.post(
  "/:userId/avatar",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      const { avatar } = req.body; // Expect base64 encoded image
      if (!avatar) {
        return res.status(400).json({ message: "No avatar provided" });
      }

      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.avatar = avatar;
      await user.save();

      res.json({ message: "Avatar updated successfully", avatar });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.patch(
  "/:userId",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      const {
        full_name,
        company_name,
        phone_number,
        address,
        dob,
        field_value,
      } = req.body;

      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update fields
      if (full_name) user.fullName = full_name;
      if (company_name) user.company_name = company_name;
      if (phone_number) user.phone_number = phone_number;
      if (address) user.address = address;
      if (dob) user.dob = new Date(dob);

      await user.save();

      // Return updated user data
      const userData = {
        id: user._id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        created_at: user.createdAt,
        company_name: user.company_name || "",
        phone_number: user.phone_number || "",
        address: user.address || "",
        dob: user.dob ? user.dob.toISOString().split("T")[0] : null,
        status: user.status || "active",
        avatar: user.avatar || null,
      };

      res.json(userData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// -------------------------------
// Announcements (user-facing)
// -------------------------------

// Get announcements for authenticated user (includes read flag)
router.get(
  "/announcements",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.id || user._id;
      if (!user || !(user.id || user._id)) {
        console.error(
          "Announcements: user or user._id not found. req.user:",
          user
        );
        return res.status(401).json({ message: "Not authenticated" });
      }

      const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
      const limit = Math.max(1, parseInt(String(req.query.limit || "10"), 10));
      const unreadOnly =
        String(req.query.unread || "").toLowerCase() === "true";
      const search = String(req.query.search || "").trim();

      const queryObj: any = {};
      if (search) {
        queryObj.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ];
      }

      // Load only announcements referenced by this user (or nothing)
      const userDoc = await User.findById(userId).select("announcements");
      const userAnnouncements = userDoc?.announcements || [];

      if (userAnnouncements.length === 0) {
        // No announcements for this user (fast path)
        return res.json({ announcements: [], total: 0, page, totalPages: 1 });
      }

      const ids = userAnnouncements.map((a: any) => a.announcement);

      // Restrict query to user's announcement IDs and apply optional search
      const match: any = { _id: { $in: ids } };
      if (search) {
        match.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ];
      }

      const announcements = await Announcement.find(match)
        .populate({
          path: "created_by",
          select: "fullName email",
          transform: (doc) => doc || { fullName: "System", email: "" },
        })
        .sort({ pinned: -1, created_at: -1 });

      const userMap = new Map<string, any>();
      (userAnnouncements || []).forEach((a: any) =>
        userMap.set(String(a.announcement), a)
      );

      let decorated = announcements.map((a: any) => {
        const readEntry = userMap.get(String(a._id));
        return {
          _id: a._id,
          title: a.title,
          content: a.content,
          created_at: a.created_at,
          created_by: a.created_by,
          read: readEntry ? Boolean(readEntry.read) : false,
        };
      });

      if (unreadOnly) {
        decorated = decorated.filter((d) => !d.read);
      }

      const total = decorated.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const pageItems = decorated.slice(start, start + limit);

      res.json({ announcements: pageItems, total, page, totalPages });
    } catch (error: any) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// Mark an announcement as read for the authenticated user
router.patch(
  "/announcements/:id/read",
  authenticateToken,
  updateLastActive,
  async (req, res) => {
    try {
      const user = req.user as any;
      if (!user || !user._id) {
        console.error("Mark read: user or user._id not found. req.user:", user);
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = user._id;
      const announcementId = req.params.id;

      // Try to update existing entry
      const updateResult = await User.updateOne(
        { _id: userId, "announcements.announcement": announcementId },
        {
          $set: {
            "announcements.$.read": true,
            "announcements.$.notified": true,
          },
        }
      );

      if (updateResult.matchedCount === 0) {
        // Push a new entry
        await User.findByIdAndUpdate(userId, {
          $push: {
            announcements: {
              announcement: announcementId,
              read: true,
              notified: true,
              created_at: new Date(),
            },
          },
        });
      }

      res.json({ message: "Marked as read" });
    } catch (error: any) {
      console.error("Error marking announcement as read:", error);
      res.status(500).json({
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// Delete user account (with password confirmation)
router.post("/:id/delete", authenticateToken, async (req, res) => {
  try {
    const user = req.user as any;
    const userId = req.params.id;
    if (!user || (user._id?.toString() !== userId && user.id !== userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password required" });
    }
    // Fetch user from DB
    const dbUser = await User.findById(userId);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await dbUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password incorrect" });
    }

    // Delete all user data except feedback
    // 1) Remove queries belonging to the user
    await Query.deleteMany({ user_id: userId });

    // 2) Delete announcement documents that were created by this user
    const userAnnouncementIds = (dbUser.announcements || []).map((a: any) =>
      String(a.announcement)
    );
    for (const annId of userAnnouncementIds) {
      if (!annId) continue;
      try {
        const ann = await Announcement.findById(annId);
        if (!ann) continue;
        // If the announcement was created by the user themselves, delete it entirely
        if (String(ann.created_by) === String(userId)) {
          await Announcement.findByIdAndDelete(annId);
          // Remove any leftover references to this announcement from other users
          try {
            await User.updateMany(
              {},
              { $pull: { announcements: { announcement: annId } } }
            );
          } catch (pullErr) {
            console.error("Failed to cleanup announcement refs:", pullErr);
          }
        }
        // If announcement was created by admin/other user, leave it in place (requirement)
      } catch (e) {
        console.error(`Error processing announcement ${annId}:`, e);
      }
    }

    // 3) Remove announcements read entries from the user record (not necessary, user will be deleted) but keep for consistency
    dbUser.announcements = [];
    await dbUser.save();

    // 4) Remove user
    await User.findByIdAndDelete(userId);

    // Invalidate session/token (if using JWT, client should delete token; if using sessions, destroy session)
    if ((req as any).session) {
      (req as any).session.destroy(() => {});
    }
    // WebSocket: If you have a ws server, close user socket here (pseudo-code)
    if (req.app.get("wss")) {
      const wss = req.app.get("wss");
      if (wss && wss.clients) {
        for (const client of wss.clients) {
          if (client.userId === userId) {
            client.close();
          }
        }
      }
    }

    // Clear cookies (if any)
    res.clearCookie && res.clearCookie("token");

    return res.json({ message: "Account deleted" });
  } catch (error: any) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
