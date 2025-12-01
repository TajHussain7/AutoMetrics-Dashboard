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
    const [d, m, y] = value.toString().trim().split("/").map(Number);
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
