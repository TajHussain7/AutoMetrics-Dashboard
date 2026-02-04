/**
 * Database Index Initialization
 * Creates indexes for frequently queried fields to improve query performance
 */
import { User } from "../models/user.js";
import { TravelData } from "../models/travel-data.js";
import { UploadSession } from "../models/upload-session.js";
import { Query } from "../models/query.js";
import { Announcement } from "../models/announcement.js";
import { info, error as errorLogger } from "./logger.js";

/**
 * Initialize all database indexes for optimal query performance
 * This should be called once during application startup
 */
export async function initializeIndexes() {
  try {
    info("🔧 Creating database indexes...");

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ status: 1 });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ lastActive: -1 });

    // TravelData indexes - critical for dashboard performance
    await TravelData.collection.createIndex({ session_id: 1 });
    await TravelData.collection.createIndex({ user_id: 1 });
    await TravelData.collection.createIndex({ created_at: -1 });
    await TravelData.collection.createIndex({ session_id: 1, created_at: -1 });

    // UploadSession indexes
    await UploadSession.collection.createIndex({ user_id: 1 });
    await UploadSession.collection.createIndex({ created_at: -1 });
    await UploadSession.collection.createIndex({ user_id: 1, created_at: -1 });

    // Query indexes
    await Query.collection.createIndex({ user_id: 1 });
    await Query.collection.createIndex({ status: 1 });
    await Query.collection.createIndex({ created_at: -1 });
    await Query.collection.createIndex({ user_id: 1, created_at: -1 });

    // Announcement indexes
    await Announcement.collection.createIndex({ created_at: -1 });
    await Announcement.collection.createIndex({ pinned: -1 });
    await Announcement.collection.createIndex({ pinned: -1, created_at: -1 });

    info("✅ Database indexes created successfully");
  } catch (err) {
    errorLogger("❌ Error creating database indexes:", err);
    // Don't exit - indexes may already exist
  }
}
