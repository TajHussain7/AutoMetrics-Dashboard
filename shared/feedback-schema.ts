import { z } from "zod";
import { BaseEntity } from "./types.js";

// Feedback type and status enums
export enum FeedbackType {
  BugReport = "Bug Report",
  Suggestion = "Suggestion",
  Performance = "Performance",
  Question = "Question",
  Other = "Other",
}

export enum FeedbackStatus {
  New = "New",
  InProgress = "In Progress",
  Resolved = "Resolved",
  Closed = "Closed",
}

// Base feedback interface
export interface FeedbackBase extends BaseEntity {
  name: string;
  email: string;
  type: FeedbackType;
  rating: number;
  message: string;
  status: FeedbackStatus;
}

// Feedback creation schema
export const feedbackSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .email("Invalid email format")
    .min(5, "Email is too short")
    .max(255, "Email is too long"),
  type: z.nativeEnum(FeedbackType, {
    errorMap: () => ({ message: "Please select a feedback type" }),
  }),
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters long")
    .max(1000, "Message cannot exceed 1000 characters"),
});

// Response schema for feedback submission
export const feedbackResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  feedback: z
    .object({
      id: z.string(),
      created_at: z.string(),
      ...feedbackSchema.shape,
      status: z.nativeEnum(FeedbackStatus),
    })
    .optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;
export type FeedbackResponse = z.infer<typeof feedbackResponseSchema>;
