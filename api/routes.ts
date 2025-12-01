import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as XLSX from "xlsx";
// Use MongoDB-backed models for uploads/travel data instead of filesystem storage
import { UploadSession } from "./models/upload-session";
import { TravelData } from "./models/travel-data";
import {
  insertTravelDataSchema,
  updateTravelDataSchema,
  insertUploadSessionSchema,
  type UploadResponse,
} from "@shared/schema";
import { FlightStatus, PaymentStatus } from "@shared/types";
import { normalizeDate } from "./utils";
import jwt from "jsonwebtoken";
import { User } from "./models/user";
import "./types/express.d.ts";
import { authenticateToken } from "./middleware/auth";
import "dotenv/config";

// Configure multer for file uploads with serverless-friendly settings
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: process.env.MAX_FILE_SIZE
      ? parseInt(process.env.MAX_FILE_SIZE)
      : 10 * 1024 * 1024, // 10MB default limit (matching client)
    files: 1, // Allow only one file
  },
  fileFilter: (req: any, file: any, cb: any) => {
    try {
      // Removed early content-length check as multer's fileSize limit handles this better

      const allowedExtensions = [".csv", ".xls", ".xlsx"];
      const fileExtension = file.originalname
        .toLowerCase()
        .slice(file.originalname.lastIndexOf("."));

      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Invalid file type. Only CSV, XLS, and XLSX files are allowed."
          )
        );
      }
    } catch (error) {
      console.error("File upload filter error:", error);
      cb(new Error("Error processing file"));
    }
  },
});

function parseCompositeField(compositeField: string): {
  customer_name: string | null;
  route: string | null;
  pnr: string | null;
  flying_date: string | null;
} {
  if (!compositeField || typeof compositeField !== "string") {
    return { customer_name: null, route: null, pnr: null, flying_date: null };
  }

  // Pattern: "Customer Name ROUTE PNR Date"
  // Example: "Ali DXB-LHE PNR54321 2025-08-01" or "Ali DXB/LHE PNR54321 2025-08-01"
  const patterns = [
    // Pattern with PNR prefix (hyphen or slash in route)
    /^([A-Za-z\s]+?)\s+([A-Z]{3}[\/\-][A-Z]{3})\s+(PNR\w+)\s+(\d{4}-\d{2}-\d{2})$/,
    // Pattern without PNR prefix (hyphen or slash in route)
    /^([A-Za-z\s]+?)\s+([A-Z]{3}[\/\-][A-Z]{3})\s+(\w+)\s+(\d{4}-\d{2}-\d{2})$/,
    // More flexible pattern (hyphen or slash in route)
    /^([A-Za-z\s]+?)\s+([A-Z]{2,4}[\/\-][A-Z]{2,4})\s+(\w+)\s+(.+)$/,
  ];

  for (const pattern of patterns) {
    const match = compositeField.trim().match(pattern);
    if (match) {
      return {
        customer_name: match[1]?.trim() || null,
        route: match[2]?.trim() || null,
        pnr: match[3]?.trim() || null,
        flying_date: match[4]?.trim() || null,
      };
    }
  }

  // Fallback: try to extract what we can
  const words = compositeField.trim().split(/\s+/);
  let customer_name = null;
  let route = null;
  let pnr = null;
  let flying_date = null;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check for route pattern (XXX-XXX or XXX/XXX)
    if (/^[A-Z]{2,4}[\/\-][A-Z]{2,4}$/.test(word)) {
      route = word.replace(/\//g, "-"); // Convert slashes to hyphens for consistency
      // Customer name is everything before route
      if (i > 0) {
        customer_name = words.slice(0, i).join(" ");
      }
      continue;
    }

    // Check for PNR pattern
    if (/^(PNR)?\w+$/.test(word) && word.length >= 5) {
      pnr = word;
      continue;
    }

    // Check for date pattern
    if (/^\d{4}-\d{2}-\d{2}$/.test(word)) {
      flying_date = word;
      continue;
    }
  }

  return { customer_name, route, pnr, flying_date };
}

function calculateFlyingStatus(flying_date: string | null): FlightStatus {
  if (!flying_date) return FlightStatus.Coming;

  const today = new Date();
  const flying = new Date(flying_date);

  today.setHours(0, 0, 0, 0);
  flying.setHours(0, 0, 0, 0);

  if (flying > today) return FlightStatus.Coming;
  return FlightStatus.Gone; // If not future date, consider it Gone
}

export function processExcelData(
  buffer: Buffer,
  filename: string
): UploadResponse {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
  }) as any[][];

  // Handle different file formats
  const isRawLedgerData =
    filename.toLowerCase().includes("raw") ||
    jsonData.some(
      (row) =>
        row &&
        row.length > 0 &&
        (row[0]?.toString().includes("All Ledgers") ||
          row[0]?.toString().includes("TRAVELS") ||
          row[0]?.toString().includes("Statement Period"))
    );

  if (isRawLedgerData) {
    return processRawLedgerData(jsonData, filename);
  } else {
    return processStandardTravelData(jsonData, filename);
  }
}

function processRawLedgerData(
  jsonData: any[][],
  filename: string
): UploadResponse {
  // Step 1: Skip first 3 rows as per guidelines
  const dataAfterSkip = jsonData.slice(3);

  let openingBalance = null;
  const processedData = [];
  let dataStartIndex = 0;

  // Step 2: Find and extract opening balance
  for (let i = 0; i < Math.min(10, dataAfterSkip.length); i++) {
    const row = dataAfterSkip[i];
    if (!row || row.length === 0) continue;

    const rowStr = row.join(" ").toLowerCase();

    if (
      rowStr.includes("opening balance") ||
      rowStr.includes("opening") ||
      rowStr.includes("balance")
    ) {
      // Extract the balance amount from the row
      const balanceCell = row.find((cell: any) => {
        if (!cell) return false;
        const cellStr = cell.toString();
        return (
          cellStr.includes(",") &&
          (cellStr.includes(".") || /^\d+,\d+$/.test(cellStr))
        );
      });

      if (balanceCell) {
        // Extract date from the same row if available
        let balanceDate = new Date().toISOString().split("T")[0];
        const dateCell = row.find((cell: any) => {
          if (!cell) return false;
          const cellStr = cell.toString();
          return cellStr.includes("/") && cellStr.match(/\d{2}\/\d{2}\/\d{4}/);
        });

        if (dateCell) {
          const dateParts = dateCell.toString().split("/");
          if (dateParts.length === 3) {
            balanceDate = `${dateParts[2]}-${dateParts[1].padStart(
              2,
              "0"
            )}-${dateParts[0].padStart(2, "0")}`;
          }
        }

        openingBalance = {
          date: balanceDate,
          amount: parseFloat(balanceCell.toString().replace(/,/g, "")),
        };
        dataStartIndex = i + 1;
        break;
      }
    }
  }

  // Step 3: Process actual data rows
  const actualDataRows = dataAfterSkip.slice(dataStartIndex);

  for (const row of actualDataRows) {
    if (!row || row.length < 4) continue;

    // Skip empty rows and header rows
    const rowStr = row.join(" ").toLowerCase();
    if (
      rowStr.includes("date") &&
      rowStr.includes("voucher") &&
      rowStr.includes("narration")
    ) {
      continue; // Skip header row
    }

    // Note: The actual CSV structure has SALES info in position 4 (index 4)
    const [
      dateStr,
      voucher,
      reference,
      narration,
      salesOrDebitStr,
      creditStr,
      balanceStr,
      compositeField,
    ] = row;
    // Skip empty or invalid rows
    if (
      !dateStr ||
      !voucher ||
      dateStr.toString().trim() === "" ||
      voucher.toString().trim() === "" ||
      rowStr.includes("total")
    ) {
      continue;
    }

    // Step 3: Normalize date field using robust utility
    const parsedDate = normalizeDate(dateStr);

    // Skip row if date parsing failed
    if (!parsedDate) {
      console.warn(`Skipping row with invalid date: ${dateStr}`);
      continue;
    } // Step 4: Parse travel information from the correct column
    const narrationStr = narration?.toString() || "";
    let customer_name = null;
    let route = null;
    let pnr = null;
    let flying_date = null;

    // In this CSV format, SALES info is in the 5th column (position 4)
    const salesInfo = salesOrDebitStr?.toString() || "";

    if (salesInfo && salesInfo.toUpperCase().includes("SALES")) {
      const parsed = parseNarrationField(salesInfo);
      customer_name = parsed.customer_name;
      route = parsed.route;
      pnr = parsed.pnr;
      flying_date = parsed.flying_date;
    } else if (compositeField && compositeField.toString().trim()) {
      // Fallback to composite field if available
      const parsed = parseCompositeField(compositeField.toString());
      customer_name = parsed.customer_name;
      route = parsed.route;
      pnr = parsed.pnr;
      flying_date = parsed.flying_date;
    } else {
      // Fallback to narration field
      const parsed = parseNarrationField(narrationStr);
      customer_name = parsed.customer_name;
      route = parsed.route;
      pnr = parsed.pnr;
      flying_date = parsed.flying_date;
    }

    // Parse amounts that belong to ledger-only fields
    let debit: number | null = null;
    let credit: number | null = null;

    if (
      salesOrDebitStr &&
      !salesOrDebitStr.toString().toUpperCase().includes("SALES")
    ) {
      const debitStr2 = salesOrDebitStr.toString().trim();
      if (debitStr2 !== "" && debitStr2 !== "-") {
        debit = parseFloat(debitStr2.replace(/,/g, ""));
      }
    }

    if (
      creditStr &&
      creditStr.toString().trim() !== "" &&
      creditStr.toString() !== "-"
    ) {
      credit = parseFloat(creditStr.toString().replace(/,/g, ""));
    }

    const balance =
      balanceStr && balanceStr.toString().trim() !== ""
        ? parseFloat(balanceStr.toString().replace(/,/g, ""))
        : null;

    // Step 5: Derive flying status using valid enum values
    let flying_status = calculateFlyingStatus(flying_date);
    // Ensure flying_status matches valid enum values
    if (!Object.values(FlightStatus).includes(flying_status as FlightStatus)) {
      flying_status = FlightStatus.Coming; // Default to "Coming" if invalid
    }

    // Step 6: Set report-only fields to 0 by default (user will fill later)
    const customer_rate = 0;
    const company_rate = 0;
    const profit = 0;
    processedData.push({
      date: parsedDate || new Date().toISOString().split("T")[0],
      voucher: voucher.toString(),
      reference: reference?.toString() || null,
      narration: narrationStr,
      debit,
      credit,
      balance,
      customer_name,
      route,
      pnr,
      flying_date,
      flying_status,
      customer_rate,
      company_rate,
      profit,
      // booking_status removed — don't include
      payment_status: PaymentStatus.Pending, // Default to Pending instead of Unpaid
    });
  }

  return {
    sessionId: "", // Will be set later
    filename,
    totalRecords: processedData.length,
    openingBalance,
    entries: processedData,
    // Additional summary fields required by shared UploadResponse type
    parsedRows: processedData.length,
    totalRows: processedData.length,
    summary: {
      totalBookings: processedData.length,
      totalRevenue: processedData.reduce((s, r) => s + (r.debit || 0), 0),
      totalExpenses: processedData.reduce((s, r) => s + (r.credit || 0), 0),
      comingFlights: processedData.filter(
        (r) => r.flying_status === FlightStatus.Coming
      ).length,
    },
  };
}

function parseNarrationField(narration: string): {
  customer_name: string | null;
  route: string | null;
  pnr: string | null;
  flying_date: string | null;
} {
  if (!narration || typeof narration !== "string") {
    return { customer_name: null, route: null, pnr: null, flying_date: null };
  }

  let customer_name = null;
  let route = null;
  let pnr = null;
  let flying_date = null;

  // Handle SALES entries: "SALES - MR SULEMAN SAFDAR - DXB/SKT/DXB - 94A63T - 06/12/2024"
  if (narration.toUpperCase().includes("SALES")) {
    const parts = narration.split(" - ");

    if (parts.length >= 5) {
      // Extract customer name (2nd part, remove title)
      customer_name =
        parts[1]?.trim().replace(/^(MR|MRS|MISS|MS)\.?\s+/i, "") || null;

      // Extract route (3rd part)
      route = parts[2]?.trim() || null;

      // Extract PNR (4th part)
      pnr = parts[3]?.trim() || null;

      // Extract flying date (5th part)
      const datePart = parts[4]?.trim();
      if (datePart && datePart.includes("/")) {
        const dateParts = datePart.split("/");
        if (dateParts.length === 3) {
          // Convert DD/MM/YYYY to YYYY-MM-DD
          flying_date = `${dateParts[2]}-${dateParts[1].padStart(
            2,
            "0"
          )}-${dateParts[0].padStart(2, "0")}`;
        }
      }
    }
  } else {
    // Fallback parsing for other formats
    // Extract route patterns like DXB/SKT/DXB or LHE/JED/LHE or DXB-LHE
    const routeMatch = narration.match(/([A-Z]{3}(?:[\/\-][A-Z]{3}){1,4})/);
    if (routeMatch) {
      route = routeMatch[1];
      // Convert slashes to hyphens for consistency
      route = route.replace(/\//g, "-");
    }

    // Extract PNR patterns - alphanumeric codes (5-8 characters)
    const pnrMatch = narration.match(/([A-Z0-9]{5,8})(?:\s|$|-)/);
    if (pnrMatch) {
      pnr = pnrMatch[1];
    }

    // Extract flying date from patterns like 06/12/2024
    const dateMatch = narration.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      const dateParts = dateMatch[1].split("/");
      if (dateParts.length === 3) {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        flying_date = `${dateParts[2]}-${dateParts[1].padStart(
          2,
          "0"
        )}-${dateParts[0].padStart(2, "0")}`;
      }
    }
  }

  return { customer_name, route, pnr, flying_date };
}

function processStandardTravelData(
  jsonData: any[][],
  filename: string
): UploadResponse {
  // Remove first 3 rows as specified
  const dataRows = jsonData.slice(3);

  if (dataRows.length === 0) {
    throw new Error("No data found after removing header rows");
  }

  // Find opening balance row (look for balance-related keywords)
  let openingBalance = null;
  let dataStartIndex = 0;

  for (let i = 0; i < Math.min(5, dataRows.length); i++) {
    const row = dataRows[i];
    const rowStr = row.join(" ").toLowerCase();

    if (rowStr.includes("opening") || rowStr.includes("balance")) {
      // Try to extract date and amount
      const dateMatch = rowStr.match(/\d{4}-\d{2}-\d{2}/);
      const amountMatch = rowStr.match(/[\d,]+\.?\d*/);

      if (dateMatch && amountMatch) {
        openingBalance = {
          date: dateMatch[0],
          amount: parseFloat(amountMatch[0].replace(/,/g, "")),
        };
        dataStartIndex = i + 1;
        break;
      }
    }
  }

  // Helper function to safely parse numbers from Excel
  const parseExcelNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === "") return null;
    // Handle Excel number format
    const num =
      typeof value === "number"
        ? value
        : parseFloat(String(value).replace(/,/g, ""));
    return isNaN(num) ? null : num;
  };

  // Process data rows
  const processedData = [];
  const actualDataRows = dataRows.slice(dataStartIndex);

  // Expected columns: Date, Voucher, Reference, Narration, Debit, Credit, Balance, Composite Field
  for (const row of actualDataRows) {
    if (!row || row.length < 4) continue; // Skip empty or incomplete rows

    const [
      date,
      voucher,
      reference,
      narration,
      debit,
      credit,
      balance,
      compositeField,
    ] = row;
    if (!date || !voucher) continue; // Skip rows without essential data

    // Parse composite field
    const { customer_name, route, pnr, flying_date } = parseCompositeField(
      compositeField as string
    );

    // Calculate derived fields
    const flying_status = calculateFlyingStatus(flying_date);

    // Report-only fields should default to 0 (user will fill later)
    const customer_rate = 0;
    const company_rate = 0;
    const profit = 0;

    // Helper to safely parse numbers
    const parseAmount = (value: any): number | null => {
      if (!value) return null;
      const parsed = parseFloat(value.toString().replace(/,/g, ""));
      return isNaN(parsed) ? null : parsed;
    };

    processedData.push({
      date: date.toString(),
      voucher: voucher.toString(),
      reference: reference?.toString() || null,
      narration: narration?.toString() || null,
      debit: parseAmount(debit),
      credit: parseAmount(credit),
      balance: parseAmount(balance),
      customer_name,
      route,
      pnr,
      flying_date,
      flying_status,
      customer_rate,
      company_rate,
      profit,
      // booking_status removed
      payment_status: PaymentStatus.Pending,
    });
  }

  return {
    sessionId: "", // Will be set later
    filename,
    totalRecords: processedData.length,
    openingBalance,
    entries: processedData,
    // Additional summary fields required by shared UploadResponse type
    parsedRows: processedData.length,
    totalRows: processedData.length,
    summary: {
      totalBookings: processedData.length,
      totalRevenue: processedData.reduce((s, r) => s + (r.debit || 0), 0),
      totalExpenses: processedData.reduce((s, r) => s + (r.credit || 0), 0),
      comingFlights: processedData.filter(
        (r) => r.flying_status === FlightStatus.Coming
      ).length,
    },
  };
}

import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import userRoutes from "./routes/users";
import fileHistoryRouter from "./routes/file-history";
import mongoose from "mongoose";

export async function registerRoutes(app: Express) {
  // Auth routes
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/users", userRoutes);
  // File history endpoints (upload session history & restore)
  app.use("/api/files", fileHistoryRouter);
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "OK",
      message: "Backend is running",
      timestamp: new Date().toISOString(),
    });
  });

  // File upload endpoint with enhanced error handling
  app.post(
    "/api/upload",
    authenticateToken,
    (req: Request & { file?: Express.Multer.File }, res, next) => {
      upload.single("file")(req, res, (err) => {
        if (err) {
          console.error("File upload error:", err);
          return res.status(400).json({
            message: err.message || "File upload failed",
            error:
              process.env.NODE_ENV === "development" ? err.stack : undefined,
          });
        }
        next();
      });
    },
    async (req: Request & { file?: Express.Multer.File }, res) => {
      let isResponseSent = false;
      let timeoutId: NodeJS.Timeout | undefined;

      // Cleanup function to clear timeout and prevent memory leaks
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
        }
      };

      // Handle response only once
      const sendResponse = (status: number, data: any) => {
        if (!isResponseSent) {
          isResponseSent = true;
          cleanup();
          res.status(status).json(data);
        }
      };

      try {
        if (!req.file) {
          return sendResponse(400, { message: "No file uploaded" });
        }

        // Add request timeout (shorter for serverless)
        timeoutId = setTimeout(() => {
          sendResponse(504, {
            message: "Request timeout - File processing took too long",
            code: "PROCESSING_TIMEOUT",
          });
        }, 15000); // 15 second timeout for serverless environment

        // Process the uploaded file with validation
        if (!req.file.buffer || req.file.buffer.length === 0) {
          cleanup();
          throw new Error("Empty file uploaded");
        }

        // Process the file with proper error handling
        const processedData = processExcelData(
          req.file.buffer,
          req.file.originalname
        );

        // Ensure report-only fields are zeroed by default
        processedData.entries = processedData.entries.map((entry) => ({
          ...entry,
          customer_rate: 0,
          company_rate: 0,
          profit: 0,
        }));

        // Persist upload session to MongoDB (save file size for storage tracking)
        const sessionDoc = await UploadSession.create({
          filename: req.file.originalname,
          size: req.file.size || 0, // Store file size in bytes
          opening_balance: processedData.openingBalance || null,
          total_records: processedData.totalRecords || 0,
          user_id: (req as any).user?._id ?? null,
        });

        // Attach session id to response object
        processedData.sessionId = sessionDoc._id.toString();

        // Helper to safely handle numeric values
        const safeNumber = (value: any): number | null => {
          if (value === null || value === undefined) return null;
          const num =
            typeof value === "number"
              ? value
              : parseFloat(String(value).replace(/,/g, ""));
          return isNaN(num) ? null : num;
        };

        // Save travel data to MongoDB
        const travelDataItems = processedData.entries.map((entry) => ({
          session_id: sessionDoc._id.toString(),
          date: entry.date,
          voucher: entry.voucher,
          reference: entry.reference || null,
          narration: entry.narration || null,
          debit: safeNumber(entry.debit),
          credit: safeNumber(entry.credit),
          balance: safeNumber(entry.balance),
          customer_name: entry.customer_name || null,
          route: entry.route || null,
          pnr: entry.pnr || null,
          flying_date: entry.flying_date || null,
          flight_status: entry.flying_status || FlightStatus.Coming,
          customer_rate: safeNumber(entry.customer_rate) ?? 0,
          company_rate: safeNumber(entry.company_rate) ?? 0,
          profit: safeNumber(entry.profit) ?? 0,
          payment_status: PaymentStatus.Pending,
        }));

        // Insert travel data and capture inserted documents so we can
        // return DB-generated _id values to the client. This ensures the
        // client can perform updates (PATCH) against the correct document ids
        // immediately after an upload (matching restore behavior).
        const insertedDocs = await TravelData.insertMany(travelDataItems);

        // Map inserted _id back onto the processed entries so client receives
        // the same shape it gets when restoring from history. Include both
        // `_id` and `id` string fields for compatibility with client code
        // that may expect either.
        if (Array.isArray(insertedDocs) && insertedDocs.length > 0) {
          processedData.entries = processedData.entries.map((entry, idx) => {
            const doc = insertedDocs[idx];
            if (!doc) return entry;
            const idStr = String((doc as any)._id ?? (doc as any).id ?? "");
            return {
              ...entry,
              _id: idStr,
              id: idStr,
            };
          });
        }

        // Clear timeout and send response if not already sent
        cleanup();
        if (!isResponseSent) {
          isResponseSent = true;
          res.json(processedData);
        }
      } catch (error) {
        console.error("Upload error:", error);

        // Determine the appropriate error status and message
        let status = 400;
        let message = "File processing failed";
        let code = "PROCESSING_ERROR";

        if (error instanceof Error) {
          if (error.message.includes("size too large")) {
            status = 413; // Payload Too Large
            code = "FILE_TOO_LARGE";
          } else if (error.message.includes("Invalid file type")) {
            status = 415; // Unsupported Media Type
            code = "INVALID_FILE_TYPE";
          }
          message = error.message;
        }

        sendResponse(status, {
          message,
          code,
          details: process.env.NODE_ENV === "development" ? error : undefined,
        });
      }
    }
  );

  // Get travel data by session
  app.get("/api/travel-data/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const data = await TravelData.find({ session_id: sessionId }).lean();
      res.json(data);
    } catch (error) {
      console.error("Get travel data error:", error);
      res.status(500).json({ message: "Failed to retrieve travel data" });
    }
  });

  // List travel data (optionally filter by sessionId query param)
  app.get("/api/travel-data", async (req, res) => {
    try {
      const { sessionId } = req.query;
      const filter: any = {};
      if (sessionId) {
        filter.session_id = String(sessionId);
      }
      const data = await TravelData.find(filter).lean();
      res.json(data);
    } catch (error) {
      console.error("List travel data error:", error);
      res.status(500).json({ message: "Failed to list travel data" });
    }
  });

  // Create a single travel data item
  app.post("/api/travel-data", async (req, res) => {
    try {
      const payload = req.body || {};

      // Attempt to create the document directly. Keep validation minimal here
      // because client-side shapes may vary; Mongoose will enforce schema where applicable.
      const created = await TravelData.create(payload);
      res.status(201).json(created);
    } catch (error) {
      console.error("Create travel data error:", error);
      res.status(400).json({ message: "Failed to create travel data" });
    }
  });

  // Update travel data item
  app.patch("/api/travel-data/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Convert string numbers to actual numbers before validation
      const parsedBody = {
        ...req.body,
        customer_rate:
          req.body.customer_rate != null
            ? Number(req.body.customer_rate)
            : undefined,
        company_rate:
          req.body.company_rate != null
            ? Number(req.body.company_rate)
            : undefined,
        profit: req.body.profit != null ? Number(req.body.profit) : undefined,
      };

      // Find existing document first
      const existingDoc = await TravelData.findById(id).lean();
      if (!existingDoc) {
        throw new Error("Travel data not found");
      }

      // Merge existing data with updates, ensuring we don't override unrelated fields
      const mergedData = {
        ...existingDoc,
        ...parsedBody,
        // Ensure numeric fields are properly handled
        customer_rate:
          parsedBody.customer_rate ?? existingDoc.customer_rate ?? 0,
        company_rate: parsedBody.company_rate ?? existingDoc.company_rate ?? 0,
        profit: parsedBody.profit ?? existingDoc.profit ?? 0,
      };

      // Use updateTravelDataSchema which explicitly allows nullable fields
      // (customer_name, route, pnr, flying_date can be null)
      const updateData = updateTravelDataSchema.parse(mergedData);

      const updated = await TravelData.findByIdAndUpdate(
        id,
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        }
      ).lean();

      if (!updated) throw new Error("Travel data not found");
      res.json(updated);
    } catch (error) {
      console.error("Update travel data error:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Update failed",
      });
    }
  });

  // Delete travel data item
  app.delete("/api/travel-data/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Try to delete by MongoDB ObjectId first (most common)
      let deleted = null;

      if (mongoose.Types.ObjectId.isValid(id)) {
        deleted = await TravelData.findByIdAndDelete(id);
      }

      // If not found by _id, attempt to delete by a string `id` field
      if (!deleted) {
        deleted = await TravelData.findOneAndDelete({ id: String(id) });
      }

      // Last-resort: attempt to delete by matching a stringified _id field
      if (!deleted) {
        deleted = await TravelData.findOneAndDelete({ _id: String(id) });
      }

      if (!deleted) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Travel data deleted successfully" });
    } catch (error) {
      console.error("Delete travel data error:", error);
      res.status(500).json({ message: "Delete failed" });
    }
  });

  // Get recent upload sessions
  app.get("/api/upload-sessions", async (req, res) => {
    try {
      const sessions = await UploadSession.find()
        .sort({ created_at: -1 })
        .limit(10)
        .lean();
      res.json(sessions);
    } catch (error) {
      console.error("Get upload sessions error:", error);
      res.status(500).json({ message: "Failed to retrieve upload sessions" });
    }
  });

  // Get user's latest session
  app.get(
    "/api/upload-sessions/latest",
    authenticateToken,
    async (req: Request & { user?: any }, res) => {
      try {
        if (!req.user?._id) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        const latestSession = await UploadSession.findOne({
          user_id: req.user._id,
        })
          .sort({ created_at: -1 })
          .lean();

        if (!latestSession) {
          return res.status(404).json({ message: "No sessions found" });
        }

        res.json(latestSession);
      } catch (error) {
        console.error("Get latest session error:", error);
        res.status(500).json({ message: "Failed to retrieve latest session" });
      }
    }
  );

  // Routes are now registered on the app
  // The server will be created in the main server file
}
