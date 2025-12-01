import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TravelData } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeDate(value: string | number | Date): string {
  if (!value) return "";

  // Case 1: Already a Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }

  // Case 2: Numeric Excel serial number (e.g., 45123)
  if (typeof value === "number" || /^\d+$/.test(value.toString().trim())) {
    const serial = Number(value);
    if (serial > 59) {
      // Excel bug: 1900 is leap year
      const excelEpoch = new Date(1899, 11, 30);
      const normalized = new Date(excelEpoch.getTime() + serial * 86400000);
      if (!isNaN(normalized.getTime())) {
        return normalized.toISOString().split("T")[0];
      }
    }
  }

  // Case 3: DD/MM/YYYY
  if (typeof value === "string" && value.includes("/")) {
    const [d, m, y] = value.trim().split("/").map(Number);
    if (d && m && y) {
      const normalized = new Date(y, m - 1, d);
      if (!isNaN(normalized.getTime())) {
        return normalized.toISOString().split("T")[0];
      }
    }
  }

  // Case 4: Try ISO or free text parse
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  // If all fails → return empty string instead of today
  return "";
}

export function formatDateToDDMMYYYY(dateStr: string): string {
  try {
    // Try to create a date object from the input string
    const date = new Date(dateStr);

    // If it's a valid date
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // If the date string is in DD/MM/YYYY format already
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/").map(Number);
      if (day && month && year) {
        return `${day.toString().padStart(2, "0")}/${month
          .toString()
          .padStart(2, "0")}/${year}`;
      }
    }

    // Return original string if parsing fails
    return dateStr;
  } catch (error) {
    return dateStr;
  }
}

export type FlightStatus = "Coming" | "Gone" | "Cancelled";

export function getFlightStatus(
  row: Pick<TravelData, "flying_date" | "flight_status">
): FlightStatus {
  if (!row.flying_date || row.flying_date.trim() === "") {
    return "Coming";
  }

  const date = new Date(row.flying_date);
  if (isNaN(date.getTime())) {
    return "Coming";
  }

  // If the date has passed, always return "Gone" regardless of user-set status
  if (new Date() > date) {
    return "Gone";
  }

  // For future dates, allow user to set status to "Cancelled", default to "Coming"
  // prefer the explicit flight_status field (DB canonical)
  // fall back to any optional flying_status alias if present
  const status = (row as any).flight_status ?? (row as any).flying_status;
  return status === "Cancelled" ? "Cancelled" : "Coming";
}
