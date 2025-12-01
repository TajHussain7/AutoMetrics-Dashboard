import mongoose from "mongoose";

export interface IQuery extends mongoose.Document {
  user_id: mongoose.Schema.Types.ObjectId;
  subject: string;
  message: string;
  status: "open" | "replied" | "closed";
  reply?: string;
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
    enum: ["open", "replied", "closed"],
    default: "open",
  },
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
