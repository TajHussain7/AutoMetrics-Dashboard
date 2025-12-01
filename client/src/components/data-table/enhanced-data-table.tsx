"use client";

import type React from "react";

import {
  useState,
  useMemo,
  Fragment,
  type FC,
  useCallback,
  useRef,
} from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Search,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Trash2,
  CalendarIcon,
  Plus,
  Table,
} from "lucide-react";
import type { MongoTravelData } from "@shared/mongodb-types";
import type { TravelDataBase } from "@shared/types";
import { useCreateTravelData } from "@/hooks/use-travel-data";
import { PaymentStatus, FlightStatus } from "@shared/types";
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
import { useAuth } from "@/contexts/auth-context";
import { BlurOverlay } from "@/components/auth/blur-overlay";
import { Badge } from "@/components/ui/badge";
import { useTravelData } from "@/contexts/travel-data-context";
import {
  useUpdateTravelData,
  useTravelDataBySession,
  useDeleteTravelData,
} from "@/hooks/use-travel-data";
import { filterTravelData, sortTravelData } from "@/lib/data-processing";
import { useQueryClient } from "@tanstack/react-query";
import { cn, getFlightStatus } from "@/lib/utils";
import type { TravelData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import ConfirmModal from "@/components/dashboard/ConfirmModal";

export default function EnhancedDataTable() {
  const { travelData, currentSessionId, setTravelData } = useTravelData();
  const updateMutation = useUpdateTravelData();
  const createMutation = useCreateTravelData();
  const deleteMutation = useDeleteTravelData();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const {
    data: paginatedData,
    isLoading,
    refetch,
  } = useTravelDataBySession(currentSessionId, page, pageSize);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [sortBy, setSortBy] = useState<keyof TravelData>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const [editedCustomerRates, setEditedCustomerRates] = useState<
    Record<string, string>
  >({});
  const [editedCompanyRates, setEditedCompanyRates] = useState<
    Record<string, string>
  >({});
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteContext, setDeleteContext] = useState({
    itemsToDelete: [] as string[],
    displayNames: "",
    selectedCount: 0,
  });

  const updateTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  const filteredData = useMemo(() => {
    return filterTravelData(travelData, {
      search: debouncedSearch,
      status: "All Status",
    });
  }, [travelData, debouncedSearch]);

  const filteredAndSortedData = useMemo(() => {
    return sortTravelData(filteredData, sortBy, sortOrder);
  }, [filteredData, sortBy, sortOrder]);

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
      const visibleIds = new Set(filteredAndSortedData.map((item) => item.id));
      setSelectedItems(visibleIds);
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
    setSelectedItems(new Set(newSelected));
  };

  const getRowColor = (index: number) => {
    return index % 2 === 0 ? "bg-white" : "bg-slate-50/80";
  };

  const formatters = useMemo(() => {
    const currencyFormatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return {
      currency: (value: number | undefined) => {
        if (typeof value !== "number" || isNaN(value)) return "$0.00";
        return currencyFormatter.format(value);
      },

      number: (value: number | undefined) => {
        if (typeof value !== "number" || isNaN(value) || value === 0)
          return "0";
        return Math.round(value).toString();
      },

      route: (route: string | null) => {
        if (!route) return null;
        const segments = route.split(/[-/]/);

        return (
          <div className="inline-flex items-center gap-1">
            {segments.map((segment, index) => (
              <Fragment key={`${index}-${segment}`}>
                <span className="font-mono font-medium">{segment}</span>
                {index < segments.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-blue-500" />
                )}
              </Fragment>
            ))}
          </div>
        );
      },

      date: (dateStr: string) => {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          }
          if (dateStr.includes("/")) {
            const [day, month, year] = dateStr.split("/").map(Number);
            if (day && month && year) {
              return `${day.toString().padStart(2, "0")}/${month
                .toString()
                .padStart(2, "0")}/${year}`;
            }
          }
          return dateStr;
        } catch (error) {
          console.error("Error formatting date:", error);
          return dateStr;
        }
      },
    };
  }, []);

  const SortButton: FC<{
    column: keyof TravelData;
    children: React.ReactNode;
  }> = ({ column, children }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1.5 group hover:text-blue-200 transition-all duration-200 whitespace-nowrap w-full"
    >
      <span className="font-semibold text-sm tracking-wide">{children}</span>
      <div className="flex flex-col -space-y-2">
        <ChevronUp
          className={cn(
            "w-3.5 h-3.5 transition-all duration-200",
            sortBy === column && sortOrder === "asc"
              ? "text-blue-300"
              : "text-slate-400 group-hover:text-slate-300"
          )}
        />
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-all duration-200",
            sortBy === column && sortOrder === "desc"
              ? "text-blue-300"
              : "text-slate-400 group-hover:text-slate-300"
          )}
        />
      </div>
    </button>
  );

  const getEffectiveCustomer = useCallback(
    (row: TravelData) =>
      editedCustomerRates[row.id] ?? row.customer_rate?.toString() ?? "0",
    [editedCustomerRates]
  );
  const getEffectiveCompany = useCallback(
    (row: TravelData) =>
      editedCompanyRates[row.id] ?? row.company_rate?.toString() ?? "0",
    [editedCompanyRates]
  );

  const getMongoId = useCallback(
    (frontendId: string) => {
      const row = filteredAndSortedData.find((item) => item.id === frontendId);
      return (row as any)?._id;
    },
    [filteredAndSortedData]
  );

  const updateRatesImmediately = useCallback(
    async (rowId: string, customerRate?: string, companyRate?: string) => {
      if (updateTimersRef.current[rowId]) {
        clearTimeout(updateTimersRef.current[rowId]);
      }

      updateTimersRef.current[rowId] = setTimeout(async () => {
        try {
          const row = filteredAndSortedData.find((item) => item.id === rowId);
          if (!row) return;

          const updates: Partial<TravelData> = {};

          const currentCustomerRate = customerRate ?? getEffectiveCustomer(row);
          const currentCompanyRate = companyRate ?? getEffectiveCompany(row);

          const customer_rate = Math.max(
            0,
            Number.parseFloat(currentCustomerRate || "0")
          );
          const company_rate = Math.max(
            0,
            Number.parseFloat(currentCompanyRate || "0")
          );

          updates.customer_rate = Math.round(customer_rate);
          updates.company_rate = Math.round(company_rate);
          updates.profit = Math.round(customer_rate - company_rate);

          const mongoId = row.id;

          if (!mongoId) {
            console.error("MongoDB _id not found for row:", rowId);
            toast({
              title: "Update Error",
              description: "Could not find database ID for this record.",
              variant: "destructive",
            });
            return;
          }

          await updateMutation.mutateAsync({
            id: mongoId,
            data: updates,
          });

          await queryClient.invalidateQueries({
            queryKey: ["/api/travel-data"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["/api/travel-data", currentSessionId],
          });

          delete updateTimersRef.current[rowId];

          console.debug(
            `Rates updated for row ${rowId} (MongoDB ID: ${mongoId}):`,
            updates
          );
        } catch (error) {
          console.error("Error updating rates immediately:", error);

          toast({
            title: "Error",
            description: "Failed to update rates. Please try again.",
            variant: "destructive",
            duration: 3000,
          });

          delete updateTimersRef.current[rowId];
        }
      }, 500);
    },
    [
      filteredAndSortedData,
      updateMutation,
      queryClient,
      currentSessionId,
      toast,
      getEffectiveCustomer,
      getEffectiveCompany,
      getMongoId,
    ]
  );

  const handleCustomerRateChange = useCallback(
    (rowId: string, value: string) => {
      setEditedCustomerRates((prev) => ({
        ...prev,
        [rowId]: value,
      }));
      updateRatesImmediately(rowId, value, undefined);
    },
    [updateRatesImmediately]
  );

  const handleCompanyRateChange = useCallback(
    (rowId: string, value: string) => {
      setEditedCompanyRates((prev) => ({
        ...prev,
        [rowId]: value,
      }));
      updateRatesImmediately(rowId, undefined, value);
    },
    [updateRatesImmediately]
  );

  const commitRates = async (row: TravelData) => {
    try {
      if (updateTimersRef.current[row.id]) {
        clearTimeout(updateTimersRef.current[row.id]);
        delete updateTimersRef.current[row.id];
      }

      const updates: Partial<TravelData> = {};

      if (editedCustomerRates[row.id] !== undefined) {
        const customer_rate = Math.max(
          0,
          Number.parseFloat(editedCustomerRates[row.id] || "0")
        );
        updates.customer_rate = Math.round(customer_rate);
      }

      if (editedCompanyRates[row.id] !== undefined) {
        const company_rate = Math.max(
          0,
          Number.parseFloat(editedCompanyRates[row.id] || "0")
        );
        updates.company_rate = Math.round(company_rate);
      }

      if (Object.keys(updates).length > 0) {
        const finalCustomerRate =
          updates.customer_rate ?? row.customer_rate ?? 0;
        const finalCompanyRate = updates.company_rate ?? row.company_rate ?? 0;
        updates.profit = Math.round(finalCustomerRate - finalCompanyRate);
      }

      if (Object.keys(updates).length > 0) {
        const mongoId = getMongoId(row.id);

        await updateMutation.mutateAsync({
          id: mongoId,
          data: updates,
        });

        setEditedCustomerRates((prev) => {
          const copy = { ...prev };
          delete copy[row.id];
          return copy;
        });
        setEditedCompanyRates((prev) => {
          const copy = { ...prev };
          delete copy[row.id];
          return copy;
        });

        await queryClient.invalidateQueries({ queryKey: ["/api/travel-data"] });
        await queryClient.invalidateQueries({
          queryKey: ["/api/travel-data", currentSessionId],
        });

        toast({
          title: "Rates Updated",
          description: `Successfully updated rates and profit calculation.`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error updating rates:", error);
      toast({
        title: "Error",
        description: "Failed to update rates. Please try again.",
        variant: "destructive",
        duration: 3000,
      });

      setEditedCustomerRates((prev: Record<string, string>) => ({
        ...prev,
        [row.id]: (row.customer_rate ?? 0).toString(),
      }));
      setEditedCompanyRates((prev: Record<string, string>) => ({
        ...prev,
        [row.id]: (row.company_rate ?? 0).toString(),
      }));
    }
  };

  const handleFlightStatusChange = async (row: TravelData, value: string) => {
    const currentStatus = getFlightStatus(row);

    if (currentStatus === "Gone") {
      toast({
        title: "Cannot Change Status",
        description:
          "Flight date has already passed. Status is locked to 'Gone'.",
        variant: "destructive",
      });
      return;
    }

    const mongoId = getMongoId(row.id);

    await updateMutation.mutateAsync({
      id: mongoId,
      data: {
        flight_status:
          value === "Cancelled" ? FlightStatus.Cancelled : FlightStatus.Coming,
      },
    });

    // Update context state immediately for instant UI feedback
    setTravelData(
      travelData.map((item) =>
        item.id === row.id
          ? {
              ...item,
              flight_status:
                value === "Cancelled"
                  ? FlightStatus.Cancelled
                  : FlightStatus.Coming,
            }
          : item
      )
    );

    // Invalidate queries to trigger server refetch
    await queryClient.invalidateQueries({ queryKey: ["/api/travel-data"] });
    await queryClient.invalidateQueries({
      queryKey: ["/api/travel-data", currentSessionId],
    });
  };

  function AddEntryForm({
    onAdd,
    onCancel,
  }: {
    onAdd: (values: Record<string, string>) => Promise<void> | void;
    onCancel: () => void;
  }) {
    const [values, setValues] = useState<Record<string, string>>({
      date: new Date().toISOString().split("T")[0],
      voucher: "",
      customer_name: "",
      route: "",
      pnr: "",
      flying_date: "",
      debit: "",
      credit: "",
      balance: "",
      customer_rate: "",
      company_rate: "",
      profit: "",
      payment_status: "Pending",
      narration: "",
      reference: "",
    });
    const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

    const [dateSelected, setDateSelected] = useState<Date | undefined>(
      values.date ? new Date(values.date) : new Date()
    );
    const [flyingDateSelected, setFlyingDateSelected] = useState<
      Date | undefined
    >(values.flying_date ? new Date(values.flying_date) : undefined);

    const setDateFromObj = (k: string, d?: Date) => {
      if (!d) return set(k, "");
      const iso = d.toISOString().split("T")[0];
      set(k, iso);
    };
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [flyingDatePickerOpen, setFlyingDatePickerOpen] = useState(false);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Date <span className="text-red-500">*</span>
            </label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <div className="relative w-full">
                  <CalendarIcon
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none"
                    aria-hidden
                  />
                  <Input
                    placeholder="Select date"
                    readOnly
                    value={values.date}
                    onClick={() => setDatePickerOpen(true)}
                    className="pr-9 cursor-pointer bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="w-auto p-0 rounded-xl shadow-xl border-slate-200"
              >
                <Calendar
                  mode="single"
                  selected={dateSelected}
                  onSelect={(d) => {
                    const dd = Array.isArray(d)
                      ? d[0]
                      : (d as Date | undefined);
                    setDateSelected(dd);
                    setDateFromObj("date", dd);
                    setDatePickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Voucher <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter voucher number"
              value={values.voucher}
              onChange={(e) => set("voucher", e.target.value)}
              className="bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter customer name"
              value={values.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
              className="bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Route <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. DXB-LHE"
              value={values.route}
              onChange={(e) => set("route", e.target.value)}
              className="bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              PNR <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter PNR"
              value={values.pnr}
              onChange={(e) => set("pnr", e.target.value)}
              className="bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Flying Date <span className="text-red-500">*</span>
            </label>
            <Popover
              open={flyingDatePickerOpen}
              onOpenChange={setFlyingDatePickerOpen}
            >
              <PopoverTrigger asChild>
                <div className="relative w-full">
                  <CalendarIcon
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none"
                    aria-hidden
                  />
                  <Input
                    placeholder="Select flying date"
                    readOnly
                    value={values.flying_date}
                    onClick={() => setFlyingDatePickerOpen(true)}
                    className="pr-9 cursor-pointer bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="w-auto p-0 rounded-xl shadow-xl border-slate-200"
              >
                <Calendar
                  mode="single"
                  selected={flyingDateSelected}
                  onSelect={(d) => {
                    const fd = Array.isArray(d)
                      ? d[0]
                      : (d as Date | undefined);
                    setFlyingDateSelected(fd);
                    setDateFromObj("flying_date", fd);
                    setFlyingDatePickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Debit
            </label>
            <Input
              placeholder="0.00"
              value={values.debit}
              onChange={(e) => set("debit", e.target.value)}
              className="bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Credit
            </label>
            <Input
              placeholder="0.00"
              value={values.credit}
              onChange={(e) => set("credit", e.target.value)}
              className="bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Balance
            </label>
            <Input
              placeholder="0.00"
              value={values.balance}
              onChange={(e) => set("balance", e.target.value)}
              className="bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Customer Rate
            </label>
            <Input
              placeholder="0"
              value={values.customer_rate}
              onChange={(e) => set("customer_rate", e.target.value)}
              className="bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Company Rate
            </label>
            <Input
              placeholder="0"
              value={values.company_rate}
              onChange={(e) => set("company_rate", e.target.value)}
              className="bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              Profit
            </label>
            <Input
              placeholder="Auto-calculated"
              value={values.profit}
              onChange={(e) => set("profit", e.target.value)}
              className="bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 block">
            Narration
          </label>
          <Textarea
            placeholder="Add any notes or narration..."
            value={values.narration}
            onChange={(e) => set("narration", e.target.value)}
            className="w-full bg-white border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl min-h-[80px]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="px-6 rounded-xl border-slate-200 hover:bg-slate-50 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const required = [
                ["date", "Date"],
                ["voucher", "Voucher"],
                ["customer_name", "Customer Name"],
                ["route", "Route"],
                ["pnr", "PNR"],
                ["flying_date", "Flying Date"],
              ];
              const missing = required
                .filter(
                  ([k]) =>
                    !values[k as string] || values[k as string].trim() === ""
                )
                .map(([, label]) => label);
              if (missing.length > 0) {
                toast({
                  title: "Missing fields",
                  description: `Please provide: ${missing.join(", ")}`,
                  variant: "destructive",
                });
                return;
              }

              await onAdd(values);
            }}
            className="px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>
    );
  }

  if (travelData.length === 0) {
    return (
      <div className="relative">
        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 pointer-events-none" />
          <CardContent className="p-8 relative">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Table className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                No travel data available
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Upload a CSV or Excel file to see your travel bookings here
              </p>
            </div>
          </CardContent>
        </Card>
        {!user && <BlurOverlay />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none" />
        <CardContent className="p-4 md:p-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Badge
                variant="outline"
                className="px-4 py-1.5 whitespace-nowrap shadow-sm bg-white/80 border-blue-200 text-blue-700 font-semibold rounded-xl"
              >
                {filteredAndSortedData.length} entries
              </Badge>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search bookings, customers, routes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm hover:shadow bg-white/80 backdrop-blur-sm rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="min-w-[140px] rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-[95vw] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                      Add New Travel Entry
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                      Fill the fields below and click Add to insert a new row.
                    </DialogDescription>
                  </DialogHeader>

                  <AddEntryForm
                    onAdd={async (values) => {
                      try {
                        const debitNum = values.debit
                          ? Number(values.debit)
                          : null;
                        const creditNum = values.credit
                          ? Number(values.credit)
                          : null;
                        const balanceNum = values.balance
                          ? Number(values.balance)
                          : null;
                        const customerRate = values.customer_rate
                          ? Number(values.customer_rate)
                          : 0;
                        const companyRate = values.company_rate
                          ? Number(values.company_rate)
                          : 0;

                        if (values.debit && isNaN(debitNum!))
                          throw new Error("Invalid debit amount");
                        if (values.credit && isNaN(creditNum!))
                          throw new Error("Invalid credit amount");
                        if (values.balance && isNaN(balanceNum!))
                          throw new Error("Invalid balance amount");
                        if (isNaN(customerRate))
                          throw new Error("Invalid customer rate");
                        if (isNaN(companyRate))
                          throw new Error("Invalid company rate");

                        const profit = customerRate - companyRate;

                        const currentStatus = values.flying_date
                          ? getFlightStatus({
                              flying_date: values.flying_date,
                              flight_status: FlightStatus.Coming,
                            })
                          : FlightStatus.Coming;

                        const newItem = {
                          session_id: currentSessionId || "local",
                          date:
                            values.date ||
                            new Date().toISOString().split("T")[0],
                          voucher: (values.voucher || "").toUpperCase(),
                          reference: values.reference || null,
                          narration: values.narration || null,
                          debit: debitNum,
                          credit: creditNum,
                          balance: balanceNum,
                          customer_name: (
                            values.customer_name || ""
                          ).toUpperCase(),
                          route: (values.route || "").toUpperCase(),
                          pnr: (values.pnr || "").toUpperCase(),
                          flying_date: values.flying_date || null,
                          flight_status: currentStatus,
                          customer_rate: customerRate,
                          company_rate: companyRate,
                          profit: profit,
                          payment_status: PaymentStatus.Pending,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        } as Omit<TravelDataBase, "id">;

                        const mongoResponse = await createMutation.mutateAsync(
                          newItem
                        );

                        const mongoData =
                          mongoResponse as unknown as MongoTravelData;
                        const createdItem: TravelDataBase = {
                          ...mongoData,
                          id: mongoData._id,
                        };

                        setTravelData([createdItem, ...travelData]);

                        await queryClient.invalidateQueries({
                          queryKey: ["/api/travel-data"],
                        });
                        await queryClient.invalidateQueries({
                          queryKey: ["/api/travel-data", currentSessionId],
                        });

                        toast({
                          title: "Entry Added Successfully",
                          description:
                            "New travel entry has been added to the database.",
                          duration: 3000,
                        });

                        setAddOpen(false);
                      } catch (error) {
                        console.error("Error adding new entry:", error);
                        toast({
                          title: "Error",
                          description:
                            "Failed to add new entry. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    onCancel={() => setAddOpen(false)}
                  />
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 min-w-[120px] rounded-xl border-slate-200 hover:bg-slate-50 shadow-sm hover:shadow bg-white/80"
                onClick={async () => {
                  try {
                    setIsRefreshing(true);
                    await refetch();
                    toast({
                      title: "Data Refreshed",
                      description: "Latest travel data has been loaded.",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to refresh data.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
              >
                <RefreshCw
                  className={cn("w-4 h-4", isRefreshing && "animate-spin")}
                />
                <span>Refresh</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "min-w-[100px] rounded-xl shadow-sm hover:shadow",
                  selectedItems.size > 0
                    ? "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-red-50/50"
                    : "text-slate-400 bg-slate-50/50 border-slate-200 cursor-not-allowed"
                )}
                disabled={selectedItems.size === 0}
                onClick={() => {
                  const itemsToDelete = Array.from(selectedItems);
                  const selectedCount = itemsToDelete.length;
                  const itemNames = itemsToDelete.map((id) => {
                    const item = filteredAndSortedData.find((d) => d.id === id);
                    return item?.customer_name || "Unknown";
                  });

                  const displayNames =
                    selectedCount === 1
                      ? itemNames[0]
                      : `${selectedCount} entries`;

                  setDeleteContext({
                    itemsToDelete,
                    displayNames,
                    selectedCount,
                  });
                  setOpenConfirm(true);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span>Delete</span>
              </Button>

              <ConfirmModal
                open={openConfirm}
                title={`Delete ${deleteContext.displayNames}?`}
                message={
                  deleteContext.selectedCount === 1
                    ? "This action cannot be undone."
                    : `Are you sure you want to delete these ${deleteContext.selectedCount} entries?`
                }
                confirmText="Yes, Delete"
                cancelText="Cancel"
                onConfirm={async () => {
                  try {
                    const idsToDelete = deleteContext.itemsToDelete
                      .map((i) => (typeof i === "string" ? i : String(i)))
                      .filter((i) => !!i && i !== "undefined");

                    if (idsToDelete.length === 0) {
                      toast({
                        title: "Nothing to delete",
                        description:
                          "No valid items were selected for deletion.",
                        variant: "destructive",
                      });
                      setOpenConfirm(false);
                      return;
                    }

                    console.debug("Deleting travel-data ids:", idsToDelete);

                    await Promise.all(
                      idsToDelete.map((id) => deleteMutation.mutateAsync(id))
                    );

                    setSelectedItems(new Set());
                    toast({
                      title: "Deleted Successfully",
                      description: `${deleteContext.displayNames} ${
                        deleteContext.selectedCount === 1 ? "has" : "have"
                      } been deleted.`,
                      duration: 3000,
                    });
                  } catch (error) {
                    console.error("Delete entries error:", error);
                    toast({
                      title: "Error",
                      description:
                        "Failed to delete entries. Please try again.",
                      variant: "destructive",
                      duration: 3000,
                    });
                  } finally {
                    setOpenConfirm(false);
                  }
                }}
                onCancel={() => {
                  toast({
                    title: "Cancelled",
                    description: "No entries were deleted.",
                    duration: 2000,
                  });

                  setSelectedItems(new Set());

                  setOpenConfirm(false);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl border-0 overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
              <tr>
                <th className="w-12 px-4 py-5 text-left">
                  <Checkbox
                    checked={
                      selectedItems.size === filteredAndSortedData.length &&
                      filteredAndSortedData.length > 0
                    }
                    onCheckedChange={(val) => handleSelectAll(Boolean(val))}
                    className="border-white/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                </th>
                <th className="px-4 py-5 text-left min-w-[100px]">
                  <SortButton column="date">Date</SortButton>
                </th>
                <th className="px-4 py-5 text-left min-w-[120px]">
                  <SortButton column="voucher">Voucher</SortButton>
                </th>
                <th className="px-4 py-5 text-left min-w-[140px]">
                  <SortButton column="customer_name">Customer</SortButton>
                </th>
                <th className="px-4 py-5 text-left min-w-[120px]">
                  <SortButton column="route">Route</SortButton>
                </th>
                <th className="px-4 py-5 text-left min-w-[100px]">
                  <SortButton column="pnr">PNR</SortButton>
                </th>
                <th className="px-4 py-5 text-left min-w-[120px]">
                  <SortButton column="flying_date">Flying Date</SortButton>
                </th>
                <th className="px-4 py-5 text-left min-w-[120px]">
                  <SortButton column="flight_status">Flight Status</SortButton>
                </th>
                <th className="px-4 py-5 text-right min-w-[100px]">
                  <SortButton column="debit">Debit</SortButton>
                </th>
                <th className="px-4 py-5 text-right min-w-[100px]">
                  <SortButton column="credit">Credit</SortButton>
                </th>
                <th className="px-4 py-5 text-right min-w-[100px]">
                  <SortButton column="balance">Balance</SortButton>
                </th>
                <th className="px-4 py-5 text-right min-w-[130px]">
                  <SortButton column="customer_rate">Customer Rate</SortButton>
                </th>
                <th className="px-4 py-5 text-right font-semibold">
                  <SortButton column="company_rate">Company Rate</SortButton>
                </th>
                <th className="px-4 py-5 text-right font-semibold">
                  <SortButton column="profit">Profit</SortButton>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAndSortedData.map((item, index) => {
                const effectiveCustomer = getEffectiveCustomer(item);
                const effectiveCompany = getEffectiveCompany(item);
                const c = Number.parseFloat(effectiveCustomer || "0") || 0;
                const k = Number.parseFloat(effectiveCompany || "0") || 0;
                const previewProfit = new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(c - k);
                const flightStatus =
                  (item as any).flight_status === FlightStatus.Cancelled
                    ? FlightStatus.Cancelled
                    : getFlightStatus(item as any);

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b border-slate-100 hover:bg-blue-50/60 transition-colors duration-150",
                      getRowColor(index),
                      selectedItems.has(item.id) &&
                        "bg-blue-100/80 hover:bg-blue-100"
                    )}
                  >
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(val) =>
                          handleSelectItem(item.id, Boolean(val))
                        }
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-700">
                      {formatters.date(item.date)}
                    </td>
                    <td className="px-4 py-4">
                      <code className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-sm font-mono border border-slate-200">
                        {item.voucher}
                      </code>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">
                        {item.customer_name || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm bg-blue-50 text-blue-800 px-2.5 py-1.5 rounded-lg border border-blue-100 inline-block">
                        {item.route ? formatters.route(item.route) : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <code className="bg-green-50 text-green-800 px-2.5 py-1 rounded-lg text-sm font-mono border border-green-100">
                        {item.pnr || "—"}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 font-medium">
                      {item.flying_date
                        ? formatters.date(item.flying_date)
                        : "—"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {flightStatus === FlightStatus.Gone ? (
                        <span className="w-28 h-8 text-sm font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg shadow-sm inline-flex items-center justify-center border border-amber-200">
                          {FlightStatus.Gone}
                        </span>
                      ) : (
                        <Select
                          value={flightStatus}
                          onValueChange={(v: FlightStatus) =>
                            handleFlightStatusChange(item, v)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "w-28 h-8 text-sm font-semibold px-3 py-1 rounded-lg shadow-sm border",
                              flightStatus === "Cancelled"
                                ? "text-red-800 bg-red-50 border-red-200"
                                : "text-green-800 bg-green-50 border-green-200"
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value={FlightStatus.Coming}>
                              {FlightStatus.Coming}
                            </SelectItem>
                            <SelectItem value={FlightStatus.Cancelled}>
                              {FlightStatus.Cancelled}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm">
                      <span
                        className={cn(
                          "font-semibold",
                          item.debit ? "text-red-600" : "text-slate-300"
                        )}
                      >
                        {formatters.currency(item.debit)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm">
                      <span
                        className={cn(
                          "font-semibold",
                          item.credit ? "text-green-600" : "text-slate-300"
                        )}
                      >
                        {formatters.currency(item.credit)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm font-semibold">
                      <span
                        className={cn(
                          item.balance !== undefined && item.balance > 0
                            ? "text-green-600"
                            : item.balance !== undefined && item.balance < 0
                            ? "text-red-600"
                            : "text-slate-300"
                        )}
                      >
                        {formatters.currency(item.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end">
                        <Input
                          type="number"
                          value={
                            editedCustomerRates[item.id] ??
                            (!item.customer_rate || item.customer_rate === 0
                              ? ""
                              : formatters.number(item.customer_rate))
                          }
                          onChange={(e) => {
                            setEditingRow(item.id);
                            handleCustomerRateChange(item.id, e.target.value);
                          }}
                          onFocus={() => setEditingRow(item.id)}
                          onBlur={() => {
                            commitRates(item);
                            if (editingRow === item.id) {
                              setEditingRow(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              (e.target as HTMLInputElement).blur();
                          }}
                          className="w-24 text-right font-mono rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end">
                        <Input
                          type="number"
                          value={
                            editedCompanyRates[item.id] ??
                            (!item.company_rate || item.company_rate === 0
                              ? ""
                              : item.company_rate.toString())
                          }
                          onChange={(e) => {
                            setEditingRow(item.id);
                            handleCompanyRateChange(item.id, e.target.value);
                          }}
                          onFocus={() => setEditingRow(item.id)}
                          onBlur={() => {
                            commitRates(item);
                            if (editingRow === item.id) {
                              setEditingRow(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              (e.target as HTMLInputElement).blur();
                          }}
                          className="w-24 text-right font-mono rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm">
                      <span
                        className={cn(
                          "font-bold",
                          c - k === 0
                            ? "text-slate-300"
                            : c - k > 0
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        {previewProfit}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
