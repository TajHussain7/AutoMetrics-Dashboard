import mongoose from "mongoose";

export interface IAnnouncement extends mongoose.Document {
  title: string;
  content: string;
  attachments?: Array<{
    filename?: string;
    url?: string;
    mimeType?: string;
    size?: number;
  }>;
  pinned?: boolean;
  pinned_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  created_by: mongoose.Schema.Types.ObjectId;
  // Optional recipients array: array of user IDs the announcement is intended for
  recipients?: mongoose.Schema.Types.ObjectId[];
  // Broadcast flag: true for site-wide announcements
  broadcast?: boolean;
}

const announcementSchema = new mongoose.Schema<IAnnouncement>({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  // Store rich HTML content (sanitized on the client before rendering)
  content: {
    type: String,
    required: [true, "Content is required"],
  },
  // Optional attachments (images, pdf, docs)
  attachments: [
    {
      filename: String,
      url: String,
      mimeType: String,
      size: Number,
    },
  ],
  // Optional recipients array (targets) to indicate this announcement is intended
  // for a subset of users. If empty or missing and `broadcast` is false, the
  // announcement is considered internal and won't be shown to users by default.
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // If true, this announcement is a site-wide broadcast and should be shown
  // to all users (server also pushes refs into user records when creating).
  broadcast: {
    type: Boolean,
    default: false,
  },
  // Allow admins to pin announcements to show at the top
  pinned: {
    type: Boolean,
    default: false,
  },
  pinned_at: {
    type: Date,
    default: null,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

announcementSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export const Announcement = mongoose.model<IAnnouncement>(
  "Announcement",
  announcementSchema
);
