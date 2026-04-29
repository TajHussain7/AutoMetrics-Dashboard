import mongoose from "mongoose";
import { FlightStatus, PaymentStatus } from "../../shared/types.js";

const travelDataSchema = new mongoose.Schema({
  session_id: { type: String, index: true },
  date: String,
  voucher: String,
  reference: { type: String, default: null },
  referred_by: { type: String, default: null },
  narration: { type: String, default: null },
  debit: { type: Number, default: null },
  credit: { type: Number, default: null },
  balance: { type: Number, default: null },
  customer_name: { type: String, default: null },
  route: { type: String, default: null },
  pnr: { type: String, default: null },
  flying_date: { type: String, default: null },
  flight_status: {
    type: String,
    enum: Object.values(FlightStatus),
    default: FlightStatus.Coming,
  },
  customer_rate: { type: Number, default: 0 },
  company_rate: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  payment_status: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.Pending,
  },
  amount_paid: { type: Number, default: 0 },
  amount_pending: { type: Number, default: 0 },
  amount_partial: { type: Number, default: 0 },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

travelDataSchema.pre("save", function (next) {
  (this as any).updated_at = new Date();
  next();
});

export const TravelData = mongoose.model("TravelData", travelDataSchema);
