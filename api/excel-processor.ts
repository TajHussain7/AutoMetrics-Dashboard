import * as XLSX from "xlsx";
import { normalizeDate } from "./utils.js";
import type { UploadResponse } from "@shared/schema.js";

interface ParsedRow {
  date: string;
  voucher: string;
  reference: string | null;
  narration: string | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  customer_name: string | null;
  route: string | null;
  pnr: string | null;
  flying_date: string | null;
  flight_status: string | null;
  flying_status: string | null; // Add the missing property
  customer_rate: number | null;
  company_rate: number | null;
  profit: number | null;
  payment_status: string;
}

export function processExcelData(
  buffer: Buffer,
  filename: string
): UploadResponse {
  // Use streaming to handle large files
  // Read workbook with optimized settings
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    cellNF: false,
    cellText: false,
    // Only use supported XLSX options
    WTF: false,
    bookDeps: false,
    bookFiles: false,
    bookProps: false,
    bookSheets: false,
    bookVBA: false,
  });

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Calculate the range of data to process
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  const chunkSize = 1000; // Process 1000 rows at a time

  // Convert to JSON with optimized settings and chunking
  let jsonData: any[][] = [];

  for (let startRow = range.s.r; startRow <= range.e.r; startRow += chunkSize) {
    const endRow = Math.min(startRow + chunkSize - 1, range.e.r);
    const chunkRange = {
      s: { r: startRow, c: range.s.c },
      e: { r: endRow, c: range.e.c },
    };

    const chunk = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true,
      dateNF: "yyyy-mm-dd",
      defval: null,
      blankrows: false,
      range: chunkRange,
    }) as any[][];

    jsonData = jsonData.concat(chunk);
  }

  // Skip empty rows and find header row
  const headerRowIndex = jsonData.findIndex((row) =>
    row.some(
      (cell) => typeof cell === "string" && cell.toLowerCase().includes("date")
    )
  );

  const dataRows = jsonData
    .slice(headerRowIndex + 1)
    .filter(
      (row) =>
        row.length > 0 && row.some((cell) => cell !== null && cell !== "")
    );

  const processedRows: ParsedRow[] = dataRows.map((row) => {
    const [
      date,
      voucher,
      reference,
      narration,
      debit,
      credit,
      balance,
      ...rest
    ] = row;

    // Extract customer info from narration or other fields
    const customerInfo = extractCustomerInfo(narration, rest);

    return {
      date: normalizeDate(date),
      voucher: String(voucher || ""),
      reference: reference ? String(reference) : null,
      narration: narration ? String(narration) : null,
      debit: parseFloat(debit) || null,
      credit: parseFloat(credit) || null,
      balance: parseFloat(balance) || null,
      customer_name: customerInfo.customer_name,
      route: customerInfo.route,
      pnr: customerInfo.pnr,
      flying_date: customerInfo.flying_date
        ? normalizeDate(customerInfo.flying_date)
        : null,
      flight_status: customerInfo.flight_status || "Pending",
      flying_status: customerInfo.flight_status || "Pending", // Add flying_status with same value as flight_status
      customer_rate: null, // To be filled by user
      company_rate: null, // To be filled by user
      profit: null, // To be calculated
      payment_status: "Pending",
    };
  });

  // Find opening balance if present
  const openingBalance = findOpeningBalance(jsonData.slice(0, headerRowIndex));

  return {
    sessionId: "", // Will be set by upload handler
    filename,
    totalRecords: processedRows.length,
    openingBalance,
    entries: processedRows,
    // Additional summary fields required by shared UploadResponse type
    parsedRows: processedRows.length,
    totalRows: processedRows.length,
    summary: {
      totalBookings: processedRows.length,
      totalRevenue: processedRows.reduce((s, r) => s + (r.debit || 0), 0),
      totalExpenses: processedRows.reduce((s, r) => s + (r.credit || 0), 0),
      comingFlights: processedRows.filter((r) => r.flying_status === "Coming")
        .length,
    },
  };
}

function extractCustomerInfo(narration: string, otherFields: any[]) {
  const info = {
    customer_name: null as string | null,
    route: null as string | null,
    pnr: null as string | null,
    flying_date: null as string | null,
    flight_status: null as string | null,
  };

  if (!narration) return info;

  // Try to extract from narration text
  const narrationText = String(narration).toUpperCase();

  // Look for route pattern (XXX-XXX or XXX/XXX)
  const routeMatch = narrationText.match(/([A-Z]{3}[\/-][A-Z]{3})/);
  if (routeMatch) {
    info.route = routeMatch[1].replace("/", "-");
  }

  // Look for PNR pattern
  const pnrMatch = narrationText.match(/\b([A-Z0-9]{6})\b/);
  if (pnrMatch) {
    info.pnr = pnrMatch[1];
  }

  // Look for customer name (assume it's before route/PNR)
  if (routeMatch || pnrMatch) {
    const beforeMarkers = narrationText.split(
      /[A-Z]{3}[\/-][A-Z]{3}|\b[A-Z0-9]{6}\b/
    )[0];
    const namePart = beforeMarkers.replace(/^.*?([A-Z\s]{2,}).*$/, "$1").trim();
    if (namePart.length > 1) {
      info.customer_name = namePart;
    }
  }

  return info;
}

function findOpeningBalance(
  headerRows: any[]
): { date: string; amount: number } | null {
  for (const row of headerRows) {
    if (!row || !Array.isArray(row)) continue;

    const rowText = row.join(" ").toLowerCase();
    if (rowText.includes("opening") && rowText.includes("balance")) {
      // Look for amount in the row
      const amount = row.find(
        (cell: any) =>
          cell && !isNaN(parseFloat(String(cell).replace(/,/g, "")))
      );

      if (amount) {
        return {
          date: normalizeDate(new Date()),
          amount: parseFloat(String(amount).replace(/,/g, "")),
        };
      }
    }
  }
  return null;
}
