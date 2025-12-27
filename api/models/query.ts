import mongoose from "mongoose";

export interface IQuery extends mongoose.Document {
  user_id: mongoose.Schema.Types.ObjectId;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "answered" | "closed";
  // Threaded messages: user and admin messages
  messages?: Array<{
    _id?: mongoose.Schema.Types.ObjectId;
    author: "user" | "admin";
    message: string;
    attachments?: Array<{ filename: string; url: string }>;
    // Reactions on a message (user-level: like/dislike)
    reactions?: Array<{
      user: mongoose.Schema.Types.ObjectId;
      type: "like" | "dislike";
    }>;
    created_at: Date;
  }>;
  // Legacy single-reply field (kept for backwards compatibility)
  reply?: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  assigned_to?: mongoose.Schema.Types.ObjectId;
  // Reactions on the top-level query (user-level)
  reactions?: Array<{
    user: mongoose.Schema.Types.ObjectId;
    type: "like" | "dislike";
  }>;
  created_at: Date;
  updated_at: Date;
}

const querySchema = new mongoose.Schema<IQuery>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
  },
  message: {
    type: String,
    required: [true, "Message is required"],
  },
  status: {
    type: String,
    enum: ["open", "in-progress", "answered", "closed"],
    default: "open",
  },
  messages: [
    {
      author: { type: String, enum: ["user", "admin"], required: true },
      message: { type: String, required: true },
      attachments: [
        {
          filename: String,
          url: String,
        },
      ],
      // Reactions on a message (user-level: like/dislike)
      reactions: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          type: { type: String, enum: ["like", "dislike"] },
        },
      ],
      created_at: { type: Date, default: Date.now },
    },
  ],
  // Reactions on the top-level query
  reactions: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      type: { type: String, enum: ["like", "dislike"] },
    },
  ],
  category: { type: String },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reply: {
    type: String,
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

querySchema.pre("save", function (next) {
  (this as any).updated_at = new Date();
  next();
});

export const Query = mongoose.model<IQuery>("Query", querySchema);
