import { Router, Request, Response, NextFunction } from "express";
import { User } from "../models/user";
import { Announcement } from "../models/announcement";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Middleware to update lastActive timestamp
const updateLastActive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user) {
    try {
      await User.findByIdAndUpdate(req.user.id, {
        lastActive: new Date(),
        status: "active",
      });
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

      const announcements = await Announcement.find(queryObj)
        .populate({
          path: "created_by",
          select: "fullName email",
          transform: (doc) => doc || { fullName: "System", email: "" },
        })

        .sort({ created_at: -1 });

      const userDoc = await User.findById(userId).select("announcements");

      const userMap = new Map<string, any>();
      (userDoc?.announcements || []).forEach((a: any) =>
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

      // Get all announcements
      const announcements = await Announcement.find().select("_id");

      // Get user's announcement read status
      const userDoc = await User.findById(userId).select("announcements");

      // Build map of read announcements
      const readMap = new Map<string, boolean>();
      (userDoc?.announcements || []).forEach((a: any) => {
        readMap.set(String(a.announcement), a.read);
      });

      // Count unread
      let unreadCount = 0;
      announcements.forEach((a) => {
        if (!readMap.get(String(a._id))) {
          unreadCount++;
        }
      });

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
      console.debug("Fetching user profile:", req.params.userId);
      const user = await User.findById(req.params.userId).select("-password");
      if (!user) {
        console.debug("User not found");
        return res.status(404).json({ message: "User not found" });
      }
      console.debug("User found:", user._id);

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
      user.status = "active";
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

      const announcements = await Announcement.find(queryObj)
        .populate({
          path: "created_by",
          select: "fullName email",
          transform: (doc) => doc || { fullName: "System", email: "" },
        })

        .sort({ created_at: -1 });

      const userDoc = await User.findById(userId).select("announcements");

      const userMap = new Map<string, any>();
      (userDoc?.announcements || []).forEach((a: any) =>
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

export default router;
