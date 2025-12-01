import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { TravelData } from "@shared/schema";
import { getFlightStatus } from "./utils";

export interface ExportOptions {
  dateRange?: { start: string; end: string };
  includeSections: {
    summaryCards: boolean;
    dataTable: boolean;
    charts: boolean;
    rawData: boolean;
  };
  statusFilter?: string;
}

export async function exportToExcel(
  data: TravelData[],
  options: ExportOptions,
  filename?: string
): Promise<void> {
  try {
    const workbook = XLSX.utils.book_new();

    // Filter data based on options
    let filteredData = [...data];

    if (options.dateRange) {
      const { start, end } = options.dateRange;
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(start) && itemDate <= new Date(end);
      });
    }

    if (options.statusFilter && options.statusFilter !== "All Flights") {
      const statusMap: Record<string, string> = {
        "Coming Only": "Coming",
        "Gone Only": "Gone",
        "Cancelled Only": "Cancelled",
      };
      const targetStatus = statusMap[options.statusFilter];
      if (targetStatus) {
        filteredData = filteredData.filter(
          (item) => getFlightStatus(item) === targetStatus
        );
      }
    }

    // Main data sheet
    if (options.includeSections.dataTable) {
      const tableData = filteredData.map((item) => ({
        Date: item.date,
        Voucher: item.voucher,
        Reference: item.reference || "",
        Narration: item.narration || "",
        Debit: item.debit?.toString() || "0",
        Credit: item.credit?.toString() || "0",
        Balance: item.balance?.toString() || "0",
        "Customer Name": item.customer_name || "",
        Route: item.route || "",
        PNR: item.pnr || "",
        "Flying Date": item.flying_date || "",
        "Flight Status": getFlightStatus({
          flying_date: item.flying_date,
          flight_status:
            (item as any).flight_status ?? (item as any).flying_status,
        } as any),
        "Customer Rate": item.customer_rate?.toString() || "0",
        "Company Rate": item.company_rate?.toString() || "0",
        Profit: item.profit?.toString() || "0",
        "Payment Status": item.payment_status || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(tableData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Travel Data");
    }

    // Summary sheet
    if (options.includeSections.summaryCards) {
      const totalBookings = filteredData.length;
      const totalRevenue = filteredData.reduce(
        (sum, item) => sum + (item.debit || 0),
        0
      );
      const totalProfit = filteredData.reduce(
        (sum, item) => sum + (item.profit || 0),
        0
      );
      const profitMargin =
        totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      const summaryData = [
        ["Metric", "Value"],
        ["Total Bookings", totalBookings],
        ["Total Revenue", totalRevenue.toFixed(2)],
        ["Total Profit", totalProfit.toFixed(2)],
        ["Profit Margin", profitMargin.toFixed(2) + "%"],
        ["Export Date", new Date().toLocaleDateString()],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    }

    // Raw data sheet (if requested)
    if (options.includeSections.rawData) {
      const rawSheet = XLSX.utils.json_to_sheet(filteredData);
      XLSX.utils.book_append_sheet(workbook, rawSheet, "Raw Data");
    }

    // Save the file
    const finalFilename =
      filename ||
      `TajMetrics_Export_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, finalFilename);
  } catch (error) {
    console.error("Excel export error:", error);
    throw new Error("Failed to export to Excel");
  }
}

export async function exportToPDF(
  elementId: string,
  options: ExportOptions,
  filename?: string
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error("Element not found for PDF export");
    }

    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    // Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 297; // A4 landscape width in mm
    const pageHeight = 210; // A4 landscape height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add title page
    pdf.setFontSize(20);
    pdf.text("TajMetrics - Travel Data Report", 20, 30);
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);

    if (options.dateRange) {
      pdf.text(
        `Date Range: ${options.dateRange.start} to ${options.dateRange.end}`,
        20,
        55
      );
    }

    pdf.addPage();

    // Add the main content
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    const finalFilename =
      filename ||
      `TajMetrics_Report_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(finalFilename);
  } catch (error) {
    console.error("PDF export error:", error);
    throw new Error("Failed to export to PDF");
  }
}

export function generateQuickExport(data: TravelData[]): void {
  if (!data || data.length === 0) {
    throw new Error("No data available for export");
  }

  const options: ExportOptions = {
    includeSections: {
      summaryCards: true,
      dataTable: true,
      charts: false,
      rawData: false,
    },
  };

  exportToExcel(data, options);
}

export interface ExportHistory {
  id: string;
  filename: string;
  type: "excel" | "pdf";
  exportedAt: Date;
  recordCount: number;
}

export function saveExportHistory(
  export_: Omit<ExportHistory, "id" | "exportedAt">
): void {
  const history = getExportHistory();
  const newExport: ExportHistory = {
    ...export_,
    id: Date.now().toString(),
    exportedAt: new Date(),
  };

  history.unshift(newExport);

  // Keep only last 10 exports
  const trimmedHistory = history.slice(0, 10);

  sessionStorage.setItem(
    "tajmetrics_export_history",
    JSON.stringify(trimmedHistory)
  );
}

export function getExportHistory(): ExportHistory[] {
  try {
    const stored = sessionStorage.getItem("tajmetrics_export_history");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
