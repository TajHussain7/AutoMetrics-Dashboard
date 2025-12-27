import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: false },
  message: { type: String, required: true },
  responded: { type: Boolean, default: false },
  response: { type: String, required: false },
  response_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  response_at: { type: Date, required: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

contactSchema.pre("save", function (next) {
  (this as any).updated_at = new Date();
  next();
});

export const Contact = mongoose.model("Contact", contactSchema);
