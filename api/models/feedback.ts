import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Allow null for unauthenticated users
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Bug Report", "Suggestion", "Performance", "Question", "Other"],
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["New", "In Progress", "Resolved", "Closed"],
    default: "New",
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

// Update the updated_at timestamp before saving
feedbackSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export const Feedback = mongoose.model("Feedback", feedbackSchema);
