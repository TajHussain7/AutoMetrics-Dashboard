import mongoose from "mongoose";

export interface IReview extends mongoose.Document {
  user_id: mongoose.Schema.Types.ObjectId;
  title: string;
  content: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  created_at: Date;
  updated_at: Date;
}

const reviewSchema = new mongoose.Schema<IReview>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Content is required"],
  },
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: 1,
    max: 5,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
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

reviewSchema.pre("save", function (next) {
  (this as any).updated_at = new Date();
  next();
});

export const Review = mongoose.model<IReview>("Review", reviewSchema);
