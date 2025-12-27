"use client";

import { useState, useEffect } from "react";
import { Trash2, HardDrive, ArrowLeft, Database } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import adminApiClient from "@/lib/admin-api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

interface StorageItem {
  userId: string;
  userName: string;
  used: number;
  usedBytes?: number;
  quota: number;
  quotaBytes?: number;
  percentage: number;
}

interface StorageStats {
  data: StorageItem[];
  summary: {
    totalUsed: number;
    totalUsedBytes?: number;
    totalQuota: number;
    totalQuotaBytes?: number;
    percentage: number;
  };
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "0.00 GB";
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`;
  if (bytes >= KB) return `${(bytes / KB).toFixed(2)} KB`;
  return `${bytes} B`;
}

export default function StoragePage() {
  const [storageData, setStorageData] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaEditingUser, setQuotaEditingUser] = useState<{
    userId: string;
    userName: string;
    currentQuota: number;
  } | null>(null);
  const [quotaInput, setQuotaInput] = useState<string>("");

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.get("/storage");
      setStorageData(response.data);
    } catch (error) {
      console.error("Error fetching storage data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch storage analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openClearDialog = (userId: string, userName: string) => {
    setClearTarget({ userId, userName });
    setClearDialogOpen(true);
  };

  const confirmClearUser = async () => {
    if (!clearTarget) return;
    try {
      const resp = await adminApiClient.post(
        `/storage/clear/${clearTarget.userId}`
      );
      toast({ title: "Success", description: resp.data.message });
      fetchStorageData();
    } catch (error: any) {
      console.error("Failed to clear user storage:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to clear storage",
        variant: "destructive",
      });
    } finally {
      setClearDialogOpen(false);
      setClearTarget(null);
    }
  };

  const openClearAllDialog = () => setClearAllDialogOpen(true);

  const confirmClearAll = async () => {
    try {
      const resp = await adminApiClient.post("/storage/clearAll");
      toast({ title: "Success", description: resp.data.message });
      fetchStorageData();
    } catch (error: any) {
      console.error("Failed to clear all storage:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to clear storage",
        variant: "destructive",
      });
    } finally {
      setClearAllDialogOpen(false);
    }
  };

  const openQuotaDialog = (
    userId: string,
    userName: string,
    currentQuotaGb: number
  ) => {
    setQuotaEditingUser({ userId, userName, currentQuota: currentQuotaGb });
    setQuotaInput(String(currentQuotaGb));
    setQuotaDialogOpen(true);
  };

  const confirmUpdateQuota = async () => {
    if (!quotaEditingUser) return;
    const q = Number(quotaInput);
    if (isNaN(q) || q < 0) {
      toast({
        title: "Invalid value",
        description: "Please enter a valid non-negative number",
        variant: "destructive",
      });
      return;
    }
    try {
      const resp = await adminApiClient.patch(
        `/users/${quotaEditingUser.userId}/storage`,
        { quotaGb: q }
      );
      toast({
        title: "Success",
        description: resp.data.message || "Quota updated",
      });
      fetchStorageData();
    } catch (error: any) {
      console.error("Failed to update quota:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update quota",
        variant: "destructive",
      });
    } finally {
      setQuotaDialogOpen(false);
      setQuotaEditingUser(null);
      setQuotaInput("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl mb-6">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 -mt-6 -mx-6 mb-6 rounded-t-2xl" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Storage Analytics
                </h1>
                <p className="text-sm text-slate-500">
                  Monitor and manage storage usage
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-600 font-medium">
                Loading storage data...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!storageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl mb-6">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 -mt-6 -mx-6 mb-6 rounded-t-2xl" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Storage Analytics
                </h1>
                <p className="text-sm text-slate-500">
                  Monitor and manage storage usage
                </p>
              </div>
            </div>
          </div>
          <Card className="p-12 text-center bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 mx-auto">
              <Database className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">
              No storage data available
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Storage analytics will appear here once data is available
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl mb-6">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 -mt-6 -mx-6 mb-6 rounded-t-2xl" />

          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Storage Analytics
                </h1>
                <p className="text-sm text-slate-500">
                  Monitor and manage storage usage
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl hover:border-blue-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 mb-2 tracking-widest uppercase">
                      Total Storage Used
                    </p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">
                      {formatBytes(storageData.summary.totalUsedBytes)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      of {storageData.summary.totalQuota.toFixed(1)} GB total
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <HardDrive className="text-white h-7 w-7" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl hover:border-purple-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 mb-2 tracking-widest uppercase">
                      Storage Usage
                    </p>
                    <p className="text-3xl font-bold text-purple-600 tracking-tight">
                      {storageData.summary.percentage}%
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Database className="text-white h-7 w-7" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl hover:border-green-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 mb-2 tracking-widest uppercase">
                      Available Storage
                    </p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">
                      {formatBytes(
                        (storageData.summary.totalQuotaBytes || 0) -
                          (storageData.summary.totalUsedBytes || 0)
                      )}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <HardDrive className="text-white h-7 w-7" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Database className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                User Storage Details
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openClearAllDialog()}
              className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Storage
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-700">
                    User
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Used
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Quota
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Usage %
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storageData.data.map((item) => (
                  <TableRow
                    key={item.userId}
                    className="border-slate-100 hover:bg-blue-50/50 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">
                      {item.userName}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {formatBytes(item.usedBytes)}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {item.quota} GB
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-28 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(item.percentage, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-700 font-semibold min-w-[45px]">
                          {item.percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openQuotaDialog(
                              item.userId,
                              item.userName,
                              item.quota
                            )
                          }
                          className="rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all"
                        >
                          Edit Quota
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openClearDialog(item.userId, item.userName)
                          }
                          className="rounded-lg hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border-slate-200">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 -mt-6 -mx-6 mb-4 rounded-t-2xl" />
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Edit Storage Quota
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Adjust storage quota (GB) for the selected user.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  User
                </label>
                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-medium text-slate-900">
                    {quotaEditingUser?.userName}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Quota (GB)
                </label>
                <Input
                  value={quotaInput}
                  onChange={(e) => setQuotaInput(e.target.value)}
                  type="number"
                  min={0}
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
            </div>
            <DialogFooter>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuotaDialogOpen(false);
                    setQuotaEditingUser(null);
                    setQuotaInput("");
                  }}
                  className="flex-1 rounded-xl border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmUpdateQuota}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
                >
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border-slate-200">
            <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 -mt-6 -mx-6 mb-4 rounded-t-2xl" />
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Clear User Storage
              </DialogTitle>
              <DialogDescription className="text-slate-600 leading-relaxed">
                This will permanently delete files associated with the user{" "}
                <strong className="text-slate-900">
                  {clearTarget?.userName}
                </strong>
                . This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    setClearDialogOpen(false);
                    setClearTarget(null);
                  }}
                  className="flex-1 rounded-xl border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmClearUser}
                  className="flex-1 rounded-xl shadow-lg"
                >
                  Clear Storage
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border-slate-200">
            <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 -mt-6 -mx-6 mb-4 rounded-t-2xl" />
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Clear All Storage
              </DialogTitle>
              <DialogDescription className="text-slate-600 leading-relaxed">
                This will permanently delete files for{" "}
                <strong className="text-slate-900">all users</strong>. This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => setClearAllDialogOpen(false)}
                  className="flex-1 rounded-xl border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmClearAll}
                  className="flex-1 rounded-xl shadow-lg"
                >
                  Clear All Storage
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
