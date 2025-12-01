import mongoose from "mongoose";

export interface IAnnouncement extends mongoose.Document {
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  created_by: mongoose.Schema.Types.ObjectId;
}

const announcementSchema = new mongoose.Schema<IAnnouncement>({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Content is required"],
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
