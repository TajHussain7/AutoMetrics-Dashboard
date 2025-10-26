import { z } from "zod";
import {
  FlightStatus,
  PaymentStatus,
  TravelDataBase,
  UploadSessionBase,
} from "./types";

// Re-export types for convenience
export type {
  FlightStatus,
  PaymentStatus,
  TravelDataBase as TravelData,
  UploadSessionBase as UploadSession,
};

// Validation schemas
export const insertTravelDataSchema = z.object({
  session_id: z.string().nullable(),
  date: z.string(),
  voucher: z.string(),
  reference: z.string().nullable(),
  narration: z.string().nullable(),
  debit: z.number(),
  credit: z.number(),
  balance: z.number(),
  customer_name: z.string(),
  route: z.string(),
  pnr: z.string(),
  flying_date: z.string(),
  flight_status: z.nativeEnum(FlightStatus),
  customer_rate: z.number(),
  company_rate: z.number(),
  profit: z.number(),
  payment_status: z.nativeEnum(PaymentStatus).default(PaymentStatus.Pending),
  user_id: z.string(),
});

export const insertUploadSessionSchema = z.object({
  filename: z.string(),
  openingBalance: z
    .object({
      date: z.string(),
      amount: z.number(),
    })
    .optional(),
  totalRecords: z.string().optional(),
});

// Additional schemas for API responses
export const uploadResponseSchema = z.object({
  sessionId: z.string(),
  filename: z.string(),
  totalRecords: z.number(),
  openingBalance: z
    .object({
      date: z.string(),
      amount: z.number(),
    })
    .nullable(),
  entries: z.array(
    z.object({
      date: z.string(),
      voucher: z.string(),
      reference: z.string().nullable(),
      narration: z.string().nullable(),
      debit: z.number().nullable(),
      credit: z.number().nullable(),
      balance: z.number().nullable(),
      customer_name: z.string().nullable(),
      route: z.string().nullable(),
      pnr: z.string().nullable(),
      flying_date: z.string().nullable(),
      flying_status: z.string().nullable(),
      customer_rate: z.number().nullable(),
      company_rate: z.number().nullable(),
      profit: z.number().nullable(),
      payment_status: z.string(),
    })
  ),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
