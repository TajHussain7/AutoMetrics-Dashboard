import mongoose from "mongoose";

const fileDataSchema = new mongoose.Schema({
  file_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true,
  },
  rows: [
    {
      row_number: Number,
      data: mongoose.Schema.Types.Mixed,
      validation_errors: [String],
      last_modified_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      modified_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const FileData = mongoose.model("FileData", fileDataSchema);
