import mongoose from "mongoose";

export interface IEmailVerification extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  resendCount: number;
  purpose: "email_verification" | "reset_password";
  createdAt: Date;
}

const emailVerificationSchema = new mongoose.Schema<IEmailVerification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    purpose: {
      type: String,
      enum: ["email_verification", "reset_password"],
      default: "email_verification",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const EmailVerification = mongoose.model<IEmailVerification>(
  "EmailVerification",
  emailVerificationSchema
);
