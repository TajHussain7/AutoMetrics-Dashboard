import mongoose from "mongoose";

const openingBalanceSchema = new mongoose.Schema({
  date: String,
  amount: Number,
});

const uploadSessionSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  size: { type: Number, default: 0 }, // File size in bytes
  opening_balance: { type: openingBalanceSchema, default: null },
  total_records: { type: Number, default: 0 },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

uploadSessionSchema.pre("save", function (next) {
  (this as any).updated_at = new Date();
  next();
});

export const UploadSession = mongoose.model(
  "UploadSession",
  uploadSessionSchema
);
