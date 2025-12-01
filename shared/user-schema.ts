import { z } from "zod";
import { BaseEntity } from "./types";

// User role and status enums
export enum UserRole {
  Admin = "admin",
  Agent = "agent",
  User = "user",
}

export enum UserStatus {
  Active = "active",
  Inactive = "inactive",
  Suspended = "suspended",
}

// User interface
export interface User extends BaseEntity {
  auth_id: string;
  email: string;
  full_name: string;
  company_name?: string;
  phone_number?: string;
  role: UserRole;
  status: UserStatus;
  last_login?: Date;
  login_count: number;
  failed_login_attempts: number;
  password_last_changed?: Date;
}

// Registration validation schema
export const registerSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .min(5, "Email is too short")
      .max(255, "Email is too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password cannot exceed 72 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string(),
    full_name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),
    company_name: z
      .string()
      .max(100, "Company name cannot exceed 100 characters")
      .optional(),
    phone_number: z
      .string()
      .regex(
        /^\+?[1-9]\d{1,14}$/,
        "Invalid phone number format. Please use international format (e.g., +1234567890)"
      )
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .min(5, "Email is too short")
    .max(255, "Email is too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password cannot exceed 72 characters"),
});

// Password reset validation schema
export const passwordResetSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password cannot exceed 72 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
  });

// Profile update validation schema
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters")
    .optional(),
  company_name: z
    .string()
    .max(100, "Company name cannot exceed 100 characters")
    .optional(),
  phone_number: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Invalid phone number format. Please use international format (e.g., +1234567890)"
    )
    .optional(),
});
