import mongoose from "mongoose";
import { FileStatus } from "../../shared/upload-schema.js";

const fileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  filename: String,
  original_name: String,
  mime_type: String,
  size: Number,
  status: {
    type: String,
    enum: Object.values(FileStatus),
    default: FileStatus.Processing,
  },
  metadata: {
    total_rows: Number,
    processed_rows: Number,
    has_headers: Boolean,
    columns: [String],
    file_type: String,
  },
  processing_errors: [String],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

fileSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export const File = mongoose.model("File", fileSchema);
