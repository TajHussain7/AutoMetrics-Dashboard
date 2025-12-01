import { useState, useMemo, useEffect } from "react";
import { Search, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTravelData } from "@/contexts/travel-data-context";
import { useUpdateTravelData } from "@/hooks/use-travel-data";
import { filterTravelData, sortTravelData } from "@/lib/data-processing";
import type { TravelData } from "@shared/schema";
import { FlightStatus } from "@shared/types";
import { cn, getFlightStatus } from "@/lib/utils";

export default function DataTable() {
  const { travelData } = useTravelData();
  const updateMutation = useUpdateTravelData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sortBy, setSortBy] = useState<keyof TravelData>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate filtered and sorted data first
  const filteredAndSortedData = useMemo(() => {
    let filtered = filterTravelData(travelData, {
      search,
      status: statusFilter,
    });
    const sorted = sortTravelData(filtered, sortBy, sortOrder);
    return sorted;
  }, [travelData, search, statusFilter, sortBy, sortOrder]);

  // Then calculate pagination values
  const pageSize = 50;
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleSort = (column: keyof TravelData) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAndSortedData.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Convert string to FlightStatus enum
      const flightStatus = newStatus as FlightStatus;
      await updateMutation.mutateAsync({
        id,
        data: {
          flight_status: flightStatus,
          flying_status: flightStatus, // Update both fields for consistency
        },
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "coming":
        return "default";
      case "gone":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getFlyingStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "coming":
        return "default";
      case "gone":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (travelData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <p className="text-lg text-slate-600 mb-2">
              No travel data available
            </p>
            <p className="text-sm text-slate-500">
              Upload a file to see your travel data here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Table Controls */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search bookings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full shadow-sm hover:shadow transition-shadow"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Coming">Coming</SelectItem>
                  <SelectItem value="Gone">Gone</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="shadow-sm hover:shadow transition-all duration-200 min-w-[100px]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedItems.size === 0}
              >
                Bulk Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-sm text-slate-600">Loading data...</span>
              </div>
            </div>
          ) : null}
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={
                      selectedItems.size === filteredAndSortedData.length &&
                      filteredAndSortedData.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort("date")}
                >
                  Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort("customer_name")}
                >
                  Customer{" "}
                  {sortBy === "customer_name" &&
                    (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort("route")}
                >
                  Route{" "}
                  {sortBy === "route" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  PNR
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort("flying_date")}
                >
                  Flying Date{" "}
                  {sortBy === "flying_date" &&
                    (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort("flight_status")}
                >
                  Flight Status{""}
                  {sortBy === "flight_status" &&
                    (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                  onClick={() => handleSort("profit")}
                >
                  Profit{" "}
                  {sortBy === "profit" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredAndSortedData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedItems.has(row.id)}
                      onCheckedChange={(checked) =>
                        handleSelectItem(row.id, checked as boolean)
                      }
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                    {row.date
                      ? new Date(row.date).toLocaleDateString("en-GB")
                      : "–"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-slate-600">
                          {row.customer_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2) || "N/A"}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {row.customer_name || "Unknown"}
                        </div>
                        <div className="text-sm text-slate-500">
                          {row.voucher}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                    {row.route || "–"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {row.pnr ? (
                      <Badge variant="outline">{row.pnr}</Badge>
                    ) : (
                      <span className="text-slate-400">–</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm text-slate-800">
                        {row.flying_date
                          ? (() => {
                              const date = new Date(row.flying_date);
                              if (!isNaN(date.getTime())) {
                                const day = date
                                  .getDate()
                                  .toString()
                                  .padStart(2, "0");
                                const month = (date.getMonth() + 1)
                                  .toString()
                                  .padStart(2, "0");
                                const year = date.getFullYear();
                                return `${day}/${month}/${year}`;
                              }
                              return row.flying_date;
                            })()
                          : "–"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select
                      value={
                        (row as any).flight_status ||
                        (row as any).flying_status ||
                        "Coming"
                      }
                      onValueChange={(newStatus) =>
                        handleStatusChange(row.id, newStatus)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Coming">
                          <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
                            Coming
                          </span>
                        </SelectItem>
                        <SelectItem value="Gone">
                          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                            Gone
                          </span>
                        </SelectItem>
                        <SelectItem value="Cancelled">
                          <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                            Cancelled
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {row.profit != null ? (
                      <span
                        className={
                          row.profit >= 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {row.profit >= 0 ? "+" : ""}${row.profit.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-400">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(page * pageSize, totalItems)}
            </span>{" "}
            of <span className="font-medium">{totalItems}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            {[...Array(totalPages)].map((_, idx) => (
              <Button
                key={idx + 1}
                size="sm"
                variant={page === idx + 1 ? "default" : "outline"}
                onClick={() => setPage(idx + 1)}
              >
                {idx + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
