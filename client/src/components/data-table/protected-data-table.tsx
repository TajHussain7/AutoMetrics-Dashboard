import { useMemo } from "react";
import { error } from "@/lib/logger";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { BlurOverlay } from "@/components/auth/blur-overlay";
import { useCallback } from "react";
import { useTravelData } from "@/contexts/travel-data-context";
import { filterTravelData, sortTravelData } from "@/lib/data-processing";
import type { TravelData } from "@shared/schema";

export function ProtectedDataTable() {
  const { travelData, isLoading, refetch } = useTravelData();
  const { user } = useAuth();

  const handleRefresh = useCallback(() => {
    refetch().catch((err: Error) => {
      error("Failed to refresh data:", err);
    });
  }, [refetch]);

  return (
    <Card className="relative bg-white border border-slate-200 shadow-sm">
      <CardContent className="p-6">
        {!user && <BlurOverlay />}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search..." className="pl-9 w-full" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="coming">Coming</SelectItem>
                <SelectItem value="gone">Gone</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="rounded-md border border-slate-200 bg-white">
          {/* Table implementation */}
          {isLoading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : travelData.length === 0 ? (
            <div className="p-4 text-center">No data available</div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">{/* Table content */}</table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
