import { z } from "zod";
import { BaseEntity } from "./types";

export enum FileStatus {
  Active = "active",
  Archived = "archived",
  Processing = "processing",
  Error = "error",
}

// Base interface for uploaded files
export interface UploadedFileBase extends BaseEntity {
  user_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  status: FileStatus;
  metadata: {
    total_rows?: number;
    processed_rows?: number;
    has_headers?: boolean;
    columns?: string[];
    file_type?: string;
  };
  processing_errors?: string[];
}

// Base interface for file history
export interface FileHistoryBase extends BaseEntity {
  file_id: string;
  user_id: string;
  change_type: "upload" | "update" | "archive";
  previous_status: FileStatus;
  new_status: FileStatus;
  metadata?: {
    modified_fields?: string[];
    change_reason?: string;
    automated?: boolean;
  };
}

// File data row tracking
export interface FileDataRowBase extends BaseEntity {
  file_id: string;
  row_number: number;
  raw_data: Record<string, any>;
  processed_data: Record<string, any>;
  validation_errors?: string[];
  last_modified_by: string;
}

// Zod schema for uploaded file validation
export const uploadedFileSchema = z.object({
  user_id: z.string(),
  filename: z.string(),
  original_name: z.string(),
  mime_type: z.string(),
  size: z.number(),
  status: z.nativeEnum(FileStatus),
  metadata: z.object({
    total_rows: z.number().optional(),
    processed_rows: z.number().optional(),
    has_headers: z.boolean().optional(),
    columns: z.array(z.string()).optional(),
    file_type: z.string().optional(),
  }),
  processing_errors: z.array(z.string()).optional(),
});

// Schema for file history entries
export const fileHistorySchema = z.object({
  file_id: z.string(),
  user_id: z.string(),
  change_type: z.enum(["upload", "update", "archive"]),
  previous_status: z.nativeEnum(FileStatus),
  new_status: z.nativeEnum(FileStatus),
  metadata: z
    .object({
      modified_fields: z.array(z.string()).optional(),
      change_reason: z.string().optional(),
      automated: z.boolean().optional(),
    })
    .optional(),
});

// Schema for file data rows
export const fileDataRowSchema = z.object({
  file_id: z.string(),
  row_number: z.number(),
  raw_data: z.record(z.any()),
  processed_data: z.record(z.any()),
  validation_errors: z.array(z.string()).optional(),
  last_modified_by: z.string(),
});

// Type exports
export type UploadedFile = z.infer<typeof uploadedFileSchema>;
export type FileHistory = z.infer<typeof fileHistorySchema>;
export type FileDataRow = z.infer<typeof fileDataRowSchema>;

// Response types for API endpoints
export const fileUploadResponseSchema = z.object({
  file: uploadedFileSchema,
  history: fileHistorySchema.optional(),
  rowCount: z.number(),
  status: z.string(),
  errors: z.array(z.string()).optional(),
});

export type FileUploadResponse = z.infer<typeof fileUploadResponseSchema>;

// Real-time update response
export const fileUpdateResponseSchema = z.object({
  file_id: z.string(),
  updated_rows: z.array(fileDataRowSchema),
  timestamp: z.string(),
  change_type: z.enum(["update", "delete", "insert"]),
  status: z.string(),
  sync_token: z.string(), // For optimistic updates
});

export type FileUpdateResponse = z.infer<typeof fileUpdateResponseSchema>;
