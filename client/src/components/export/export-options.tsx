"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Trash,
  CalendarIcon,
  Clock,
  Database,
  Filter,
  Settings,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTravelData } from "@/contexts/travel-data-context";
import {
  exportToExcel,
  getExportHistory,
  saveExportHistory,
  type ExportOptions,
} from "@/lib/export-utils";
import { getFlightStatus } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const HISTORY_KEY = "AutoMetrics_export_file";

export default function ExportOptionsComponent() {
  const { travelData } = useTravelData();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeSections: {
      summaryCards: true,
      dataTable: true,
      charts: true,
      rawData: false,
    },
  });

  const [history, setHistory] = useState(getExportHistory());
  const [fileStart, setFileStart] = useState<string | undefined>(undefined);
  const [fileEnd, setFileEnd] = useState<string | undefined>(undefined);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  // Helper: filter data by flight status
  const getFilteredDataByStatus = () => {
    let filtered = [...travelData];
    if (
      exportOptions.statusFilter &&
      exportOptions.statusFilter !== "All Flights"
    ) {
      const statusMap: Record<string, string> = {
        "Coming Only": "Coming",
        "Gone Only": "Gone",
        "Cancelled Only": "Cancelled",
      };
      const targetStatus = statusMap[exportOptions.statusFilter];
      if (targetStatus) {
        filtered = filtered.filter(
          (item) => getFlightStatus(item) === targetStatus
        );
      }
    }
    return filtered;
  };

  const handleExportExcel = async () => {
    if (travelData.length === 0) {
      toast({
        title: "No data to export",
        description: "Please upload travel data first.",
        variant: "destructive",
      });
      return;
    }

    const filteredData = getFilteredDataByStatus();
    if (filteredData.length === 0) {
      toast({
        title: "No data to export",
        description: `No records match the selected filter (${
          exportOptions.statusFilter || "All Flights"
        }).`,
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      await exportToExcel(filteredData, exportOptions);

      saveExportHistory({
        filename: `TajMetrics_Export_${
          new Date().toISOString().split("T")[0]
        }.xlsx`,
        type: "excel",
        recordCount: filteredData.length,
      });

      setHistory(getExportHistory());

      toast({
        title: "Export successful",
        description: "Excel file has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description:
          error instanceof Error ? error.message : "Failed to export data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteHistory = (id: string) => {
    try {
      const current = getExportHistory();
      const updated = current.filter((h) => h.id !== id);
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setHistory(updated);
      toast({ title: "Deleted", description: "Export entry removed." });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const updateExportOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions((prev) => ({ ...prev, ...updates }));
  };

  // Compute earliest/latest date from travelData and initialize dateRange
  useEffect(() => {
    if (!travelData || travelData.length === 0) {
      setFileStart(undefined);
      setFileEnd(undefined);
      return;
    }

    const extractDateFromRecord = (rec: any): Date | null => {
      for (const key of Object.keys(rec)) {
        if (/date/i.test(key) && rec[key]) {
          const d = new Date(rec[key]);
          if (!isNaN(d.getTime())) return d;
        }
      }
      return null;
    };

    const dates: Date[] = travelData
      .map((r: any) => extractDateFromRecord(r))
      .filter((d: Date | null): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) {
      setFileStart(undefined);
      setFileEnd(undefined);
      return;
    }

    const min = dates[0];
    const max = dates[dates.length - 1];
    const minIso = min.toISOString().split("T")[0];
    const maxIso = max.toISOString().split("T")[0];

    setFileStart(minIso);
    setFileEnd(maxIso);

    // initialize export options dateRange if not set or if the data changed
    setExportOptions((prev) => ({
      ...prev,
      dateRange: {
        start: minIso,
        end: prev.dateRange?.end ?? maxIso,
      },
    }));
    setDateRangeError(null);
  }, [travelData]);

  const updateIncludeSections = (
    section: keyof ExportOptions["includeSections"],
    value: boolean
  ) => {
    setExportOptions((prev) => ({
      ...prev,
      includeSections: {
        ...prev.includeSections,
        [section]: value,
      },
    }));
  };

  return (
    <div className="max-w-9xl space-y-8 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 rounded-3xl pointer-events-none" />

      {/* Export Options */}
      <Card className="w-full rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-transparent pointer-events-none" />
        <CardContent className="p-6 md:p-8 relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">
                Export Data
              </h3>
              <p className="text-sm text-slate-500">
                Download your travel data in various formats
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative group border border-slate-200 rounded-2xl p-8 hover:border-green-400 transition-all duration-300 shadow-sm hover:shadow-xl bg-white lg:col-span-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-5 shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="text-white h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-lg">
                      Excel Export
                    </h4>
                    <p className="text-sm text-slate-500">
                      Download as .xlsx file with formatting
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Export all travel data in Excel format with formatting
                  preserved. Includes all calculated fields and formulas for
                  comprehensive analysis.
                </p>
                <div className="mb-4 p-4 bg-blue-50/80 border border-blue-200 rounded-xl">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Records to export:</span>{" "}
                    <span className="text-blue-600 font-medium">
                      {getFilteredDataByStatus().length}
                    </span>{" "}
                    out of {travelData.length} total
                    {exportOptions.statusFilter &&
                      exportOptions.statusFilter !== "All Flights" && (
                        <span className="text-slate-600">
                          {" "}
                          (filtered by: {exportOptions.statusFilter})
                        </span>
                      )}
                  </p>
                </div>
                <Button
                  onClick={handleExportExcel}
                  disabled={isExporting || travelData.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl h-12 text-base font-medium shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {isExporting ? "Exporting..." : "Export to Excel"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card className="w-full rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent pointer-events-none" />
        <CardContent className="p-6 md:p-8 relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">
                Export Settings
              </h3>
              <p className="text-sm text-slate-500">
                Customize your export preferences
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Date Range Section */}
            <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                </div>
                <Label className="text-sm font-semibold text-slate-700">
                  Date Range
                </Label>
              </div>
              <div className="space-y-2">
                {dateRangeError ? (
                  <div className="text-sm text-red-600 font-medium">
                    {dateRangeError}
                  </div>
                ) : fileStart && fileEnd ? (
                  <div className="text-sm text-slate-500">
                    File date range: {format(new Date(fileStart), "PPP")} —{" "}
                    {format(new Date(fileEnd), "PPP")}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* START DATE (fixed to file start) */}
                  <div>
                    <Button
                      variant="outline"
                      disabled={!fileStart}
                      title={
                        fileStart ? "Start date fixed to file start" : "No data"
                      }
                      className="w-full justify-start text-left font-normal rounded-xl h-12 border-slate-200 bg-transparent"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                      {fileStart
                        ? format(new Date(fileStart), "PPP")
                        : "Select start date"}
                    </Button>
                  </div>

                  {/* END DATE */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal rounded-xl h-12 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors bg-transparent"
                        disabled={!fileEnd}
                      >
                        <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                        {exportOptions.dateRange?.end
                          ? format(new Date(exportOptions.dateRange.end), "PPP")
                          : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 rounded-xl shadow-xl border-0">
                      <Calendar
                        mode="single"
                        selected={
                          exportOptions.dateRange?.end
                            ? new Date(exportOptions.dateRange.end)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (!date) return;
                          const formatted = date.toISOString().split("T")[0];
                          const startDate =
                            exportOptions.dateRange?.start ??
                            fileStart ??
                            formatted;

                          if (fileEnd && formatted > fileEnd) {
                            setDateRangeError(
                              `End date cannot be after file end date (${format(
                                new Date(fileEnd),
                                "PPP"
                              )}).`
                            );
                            // clamp to fileEnd
                            updateExportOptions({
                              dateRange: {
                                start: startDate,
                                end: fileEnd,
                              },
                            });
                          } else {
                            setDateRangeError(null);
                            updateExportOptions({
                              dateRange: {
                                start: startDate,
                                end: formatted,
                              },
                            });
                          }
                        }}
                        className="rounded-xl border-0"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Include Sections */}
              <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Database className="h-4 w-4 text-purple-600" />
                  </div>
                  <Label className="text-sm font-semibold text-slate-700">
                    Include Sections
                  </Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    htmlFor="summary-cards"
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      id="summary-cards"
                      checked={exportOptions.includeSections.summaryCards}
                      onCheckedChange={(checked) =>
                        updateIncludeSections(
                          "summaryCards",
                          checked as boolean
                        )
                      }
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="text-sm text-slate-700 font-medium">
                      Summary Cards
                    </span>
                  </label>

                  <label
                    htmlFor="data-table"
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      id="data-table"
                      checked={exportOptions.includeSections.dataTable}
                      onCheckedChange={(checked) =>
                        updateIncludeSections("dataTable", checked as boolean)
                      }
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="text-sm text-slate-700 font-medium">
                      Data Table
                    </span>
                  </label>

                  <label
                    htmlFor="charts"
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      id="charts"
                      checked={exportOptions.includeSections.charts}
                      onCheckedChange={(checked) =>
                        updateIncludeSections("charts", checked as boolean)
                      }
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="text-sm text-slate-700 font-medium">
                      Charts & Analytics
                    </span>
                  </label>

                  <label
                    htmlFor="raw-data"
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      id="raw-data"
                      checked={exportOptions.includeSections.rawData}
                      onCheckedChange={(checked) =>
                        updateIncludeSections("rawData", checked as boolean)
                      }
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="text-sm text-slate-700 font-medium">
                      Raw Data
                    </span>
                  </label>
                </div>
              </div>

              {/* Filter by Flight Status */}
              <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Filter className="h-4 w-4 text-amber-600" />
                  </div>
                  <Label className="text-sm font-semibold text-slate-700">
                    Filter by Flight Status
                  </Label>
                </div>
                <Select
                  value={exportOptions.statusFilter || "All Flights"}
                  onValueChange={(value) =>
                    updateExportOptions({ statusFilter: value })
                  }
                >
                  <SelectTrigger className="rounded-xl h-12 border-slate-200 hover:border-blue-400 focus:border-blue-500 bg-white transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-xl">
                    <SelectItem value="All Flights" className="rounded-lg">
                      All Flights
                    </SelectItem>
                    <SelectItem value="Coming Only" className="rounded-lg">
                      Coming Only
                    </SelectItem>
                    <SelectItem value="Gone Only" className="rounded-lg">
                      Gone Only
                    </SelectItem>
                    <SelectItem value="Cancelled Only" className="rounded-lg">
                      Cancelled Only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card className="rounded-2xl border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent pointer-events-none" />
        <CardContent className="p-6 md:p-8 relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-500/25">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">
                Recent Exports
              </h3>
              <p className="text-sm text-slate-500">
                {history.length} export{history.length !== 1 ? "s" : ""} in
                history
              </p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No exports yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Your export history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((exportItem) => (
                <div
                  key={exportItem.id}
                  className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="text-white h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {exportItem.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(
                            new Date(exportItem.exportedAt),
                            { addSuffix: true }
                          )}
                        </span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {exportItem.recordCount} records
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      onClick={() => handleDeleteHistory(exportItem.id)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
