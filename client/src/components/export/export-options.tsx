import { useState } from "react";
import { FileSpreadsheet, Download, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatDistanceToNow } from "date-fns";

const HISTORY_KEY = "tajmetrics_export_history";

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

  const handleExportExcel = async () => {
    if (travelData.length === 0) {
      toast({
        title: "No data to export",
        description: "Please upload travel data first.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      await exportToExcel(travelData, exportOptions);

      saveExportHistory({
        filename: `TajMetrics_Export_${
          new Date().toISOString().split("T")[0]
        }.xlsx`,
        type: "excel",
        recordCount: travelData.length,
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
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setHistory(updated);
      toast({ title: "Deleted", description: "Export entry removed." });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const updateExportOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions((prev) => ({ ...prev, ...updates }));
  };

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
    <div className="max-w-9xl space-y-8">
      {/* Export Options */}
      <Card className="w-full">
        <CardContent className="p-4 md:p-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-6">
            Export Data
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="border border-slate-200 rounded-lg p-8 hover:border-primary transition-colors shadow-sm lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mr-5">
                  <FileSpreadsheet className="text-green-600 h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Excel Export</h4>
                  <p className="text-sm text-slate-500">
                    Download as .xlsx file
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Export all travel data in Excel format with formatting
                preserved. Includes all calculated fields and formulas.
              </p>
              <Button
                onClick={handleExportExcel}
                disabled={isExporting || travelData.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export to Excel"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card className="w-full">
        <CardContent className="p-4 md:p-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-6">
            Export Settings
          </h3>
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Date Range
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  onChange={(e) =>
                    updateExportOptions({
                      dateRange: {
                        start: e.target.value,
                        end: exportOptions.dateRange?.end || e.target.value,
                      },
                    })
                  }
                />
                <Input
                  type="date"
                  onChange={(e) =>
                    updateExportOptions({
                      dateRange: {
                        start: exportOptions.dateRange?.start || e.target.value,
                        end: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-3 block">
                Include Sections
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="summary-cards"
                    checked={exportOptions.includeSections.summaryCards}
                    onCheckedChange={(checked) =>
                      updateIncludeSections("summaryCards", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="summary-cards"
                    className="text-sm text-slate-600"
                  >
                    Summary Cards
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="data-table"
                    checked={exportOptions.includeSections.dataTable}
                    onCheckedChange={(checked) =>
                      updateIncludeSections("dataTable", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="data-table"
                    className="text-sm text-slate-600"
                  >
                    Data Table
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charts"
                    checked={exportOptions.includeSections.charts}
                    onCheckedChange={(checked) =>
                      updateIncludeSections("charts", checked as boolean)
                    }
                  />
                  <Label htmlFor="charts" className="text-sm text-slate-600">
                    Charts & Analytics
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="raw-data"
                    checked={exportOptions.includeSections.rawData}
                    onCheckedChange={(checked) =>
                      updateIncludeSections("rawData", checked as boolean)
                    }
                  />
                  <Label htmlFor="raw-data" className="text-sm text-slate-600">
                    Raw Data
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Filter by Flight Status
              </Label>
              <Select
                value={exportOptions.statusFilter || "All Flights"}
                onValueChange={(value) =>
                  updateExportOptions({ statusFilter: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Flights">All Flights</SelectItem>
                  <SelectItem value="Coming Only">Coming Only</SelectItem>
                  <SelectItem value="Gone Only">Gone Only</SelectItem>
                  <SelectItem value="Cancelled Only">Cancelled Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Recent Exports
          </h3>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No exports yet</p>
              <p className="text-sm text-slate-400">
                Your export history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((exportItem) => (
                <div
                  key={exportItem.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                      <FileSpreadsheet className="text-green-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {exportItem.filename}
                      </p>
                      <p className="text-xs text-slate-500">
                        Exported{" "}
                        {formatDistanceToNow(new Date(exportItem.exportedAt), {
                          addSuffix: true,
                        })}{" "}
                        • {exportItem.recordCount} records
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-blue-700"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
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
