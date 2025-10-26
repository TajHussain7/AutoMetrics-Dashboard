export enum FlightStatus {
  Coming = "Coming",
  Gone = "Gone",
  Cancelled = "Cancelled",
}

export enum PaymentStatus {
  Paid = "Paid",
  Pending = "Pending",
  Partial = "Partial",
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface TravelDataBase extends BaseEntity {
  session_id: string | null;
  date: string;
  voucher: string;
  reference: string | null;
  narration: string | null;
  debit: number;
  credit: number;
  balance: number;
  customer_name: string;
  route: string;
  pnr: string;
  flying_date: string;
  flight_status: FlightStatus;
  // Backwards-compatible alias used across the client in some places
  // (some code uses `flying_status` or camelCase `createdAt`). Keep these
  // optional to avoid massive refactors while preserving type-safety.
  flying_status?: FlightStatus | string;
  createdAt?: string;
  updatedAt?: string;
  customer_rate: number;
  company_rate: number;
  profit: number;
  payment_status: PaymentStatus;
  // user_id may be missing for local/in-memory entries; treat as optional
  user_id?: string | null;
}

export interface UploadSessionBase extends BaseEntity {
  filename: string;
  total_records: number;
  opening_balance?: {
    date: string;
    amount: number;
  };
  user_id?: string | null;
  // Backwards-compatible aliases
  processedAt?: string | Date;
  totalRecords?: number;
  createdAt?: string;
}

// Type guards for type safety
export const isFlightStatus = (value: string): value is FlightStatus => {
  return Object.values(FlightStatus).includes(value as FlightStatus);
};

export const isPaymentStatus = (value: string): value is PaymentStatus => {
  return Object.values(PaymentStatus).includes(value as PaymentStatus);
};
