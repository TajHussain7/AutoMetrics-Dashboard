import type { TravelData } from "@shared/schema";
import { getFlightStatus } from "./utils";
import { error } from "@/lib/logger";

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

// Professional Excel styling utilities
interface CellStyle {
  fill?: { fgColor?: { rgb?: string; indexed?: number } };
  font?: { bold?: boolean; size?: number; color?: { rgb?: string } };
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
  border?: {
    left?: { style?: string; color?: { rgb?: string } };
    right?: { style?: string; color?: { rgb?: string } };
    top?: { style?: string; color?: { rgb?: string } };
    bottom?: { style?: string; color?: { rgb?: string } };
  };
  numFmt?: string;
}

const headerStyle: CellStyle = {
  fill: { fgColor: { rgb: "1F2937" } }, // Dark gray
  font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    left: { style: "thin", color: { rgb: "D1D5DB" } },
    right: { style: "thin", color: { rgb: "D1D5DB" } },
    top: { style: "thin", color: { rgb: "D1D5DB" } },
    bottom: { style: "thin", color: { rgb: "D1D5DB" } },
  },
};

const alternateRowStyle: CellStyle = {
  fill: { fgColor: { rgb: "F9FAFB" } }, // Light gray
  alignment: { horizontal: "left", vertical: "center" },
  border: {
    left: { style: "thin", color: { rgb: "E5E7EB" } },
    right: { style: "thin", color: { rgb: "E5E7EB" } },
    top: { style: "thin", color: { rgb: "E5E7EB" } },
    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
  },
};

const normalRowStyle: CellStyle = {
  fill: { fgColor: { rgb: "FFFFFF" } },
  alignment: { horizontal: "left", vertical: "center" },
  border: {
    left: { style: "thin", color: { rgb: "E5E7EB" } },
    right: { style: "thin", color: { rgb: "E5E7EB" } },
    top: { style: "thin", color: { rgb: "E5E7EB" } },
    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
  },
};

const currencyStyle: CellStyle = {
  ...normalRowStyle,
  numFmt: "#,##0.00",
  alignment: { horizontal: "right", vertical: "center" },
};

const statusStyleMap: Record<string, CellStyle> = {
  Coming: {
    fill: { fgColor: { rgb: "DBEAFE" } }, // Light blue
    font: { color: { rgb: "1E40AF" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" },
    border: normalRowStyle.border,
  },
  Gone: {
    fill: { fgColor: { rgb: "DCFCE7" } }, // Light green
    font: { color: { rgb: "15803D" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" },
    border: normalRowStyle.border,
  },
  Cancelled: {
    fill: { fgColor: { rgb: "FEE2E2" } }, // Light red
    font: { color: { rgb: "991B1B" }, bold: true },
    alignment: { horizontal: "center", vertical: "center" },
    border: normalRowStyle.border,
  },
};

export async function exportToExcel(
  data: TravelData[],
  options: ExportOptions,
  filename?: string
): Promise<void> {
  try {
    const XLSX = (await import("xlsx")) as typeof import("xlsx");
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
        Debit: item.debit || 0,
        Credit: item.credit || 0,
        Balance: item.balance || 0,
        "Customer Name": item.customer_name || "",
        Route: item.route || "",
        PNR: item.pnr || "",
        "Flying Date": item.flying_date || "",
        "Flight Status": getFlightStatus({
          flying_date: item.flying_date,
          flight_status:
            (item as any).flight_status ?? (item as any).flying_status,
        } as any),
        "Customer Rate": item.customer_rate || 0,
        "Company Rate": item.company_rate || 0,
        Profit: item.profit || 0,
        "Payment Status": item.payment_status || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(tableData);

      // Set column widths
      const colWidths = [
        12, 12, 14, 20, 12, 12, 12, 18, 14, 12, 14, 14, 14, 14, 12, 16,
      ];
      worksheet["!cols"] = colWidths.map((w) => ({ wch: w }));

      // Apply header styling
      const headers = Object.keys(tableData[0]);
      headers.forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_col(colIndex) + "1";
        worksheet[cellRef].s = headerStyle;
      });

      // Apply row styling and conditional formatting
      for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
        const isAlternate = rowIndex % 2 === 0;
        const baseStyle = isAlternate ? alternateRowStyle : normalRowStyle;

        headers.forEach((header, colIndex) => {
          const cellRef = XLSX.utils.encode_col(colIndex) + (rowIndex + 2);
          const cell = worksheet[cellRef];

          // Apply currency formatting to numeric columns
          if (
            [
              "Debit",
              "Credit",
              "Balance",
              "Customer Rate",
              "Company Rate",
              "Profit",
            ].includes(header)
          ) {
            worksheet[cellRef].s = {
              ...currencyStyle,
              fill: baseStyle.fill,
            };
          }
          // Apply status styling
          else if (header === "Flight Status") {
            const statusValue = tableData[rowIndex]["Flight Status"];
            worksheet[cellRef].s = statusStyleMap[statusValue] || baseStyle;
          }
          // Apply default row styling
          else {
            worksheet[cellRef].s = baseStyle;
          }

          // Format dates
          if (header === "Date" || header === "Flying Date") {
            cell.z = "yyyy-mm-dd";
          }
        });
      }

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
        ["Total Revenue", totalRevenue],
        ["Total Profit", totalProfit],
        ["Profit Margin", profitMargin],
        ["Export Date", new Date().toLocaleDateString()],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Set column widths
      summarySheet["!cols"] = [{ wch: 20 }, { wch: 20 }];

      // Style the summary sheet
      summarySheet["A1"].s = {
        ...headerStyle,
        fill: { fgColor: { rgb: "059669" } }, // Green header
      };
      summarySheet["B1"].s = {
        ...headerStyle,
        fill: { fgColor: { rgb: "059669" } },
      };

      // Color-code metric rows
      const metricColors: Record<string, string> = {
        "Total Bookings": "3B82F6", // Blue
        "Total Revenue": "10B981", // Green
        "Total Profit": "8B5CF6", // Purple
        "Profit Margin": "F59E0B", // Amber
        "Export Date": "6B7280", // Gray
      };

      for (let rowIndex = 1; rowIndex < summaryData.length; rowIndex++) {
        const metric = summaryData[rowIndex][0] as string;
        const color = metricColors[metric] || "6B7280";

        summarySheet[`A${rowIndex + 1}`].s = {
          fill: { fgColor: { rgb: color } },
          font: { bold: true, color: { rgb: "FFFFFF" }, size: 11 },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          },
        };

        summarySheet[`B${rowIndex + 1}`].s = {
          fill: { fgColor: { rgb: "F3F4F6" } },
          font: { bold: true, size: 12 },
          alignment: { horizontal: "right", vertical: "center" },
          border: {
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } },
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          },
          numFmt: "#,##0.00",
        };
      }

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    }

    // Raw data sheet (if requested)
    if (options.includeSections.rawData) {
      const rawSheet = XLSX.utils.json_to_sheet(filteredData);
      rawSheet["!cols"] = [{ wch: 15 }];

      // Apply basic styling to raw data headers
      const rawHeaders = Object.keys(filteredData[0]);
      rawHeaders.forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_col(colIndex) + "1";
        rawSheet[cellRef].s = headerStyle;
      });

      XLSX.utils.book_append_sheet(workbook, rawSheet, "Raw Data");
    }

    // Save the file
    const finalFilename =
      filename ||
      `TajMetrics_Export_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, finalFilename);
  } catch (error_) {
    error("Excel export error:", error_);
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

    const html2canvas = (await import("html2canvas")).default;
    const { default: jsPDF } = await import("jspdf");

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
  } catch (error_) {
    error("PDF export error:", error_);
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
