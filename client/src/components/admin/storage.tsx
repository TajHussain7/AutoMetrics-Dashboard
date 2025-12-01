import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
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
    totalUsed: number; // GB (legacy)
    totalUsedBytes?: number; // raw bytes
    totalQuota: number; // GB
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
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Storage Analytics
        </h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!storageData) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Storage Analytics
        </h1>
        <Card className="p-6 text-center text-slate-600">
          No storage data available
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        Storage Analytics
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <p className="text-sm text-slate-600 font-medium">
            Total Storage Used
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {formatBytes(storageData.summary.totalUsedBytes)}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            of {storageData.summary.totalQuota.toFixed(1)} GB total
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-slate-600 font-medium">Storage Usage</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {storageData.summary.percentage}%
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-slate-600 font-medium">
            Available Storage
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {formatBytes(
              (storageData.summary.totalQuotaBytes || 0) -
                (storageData.summary.totalUsedBytes || 0)
            )}
          </p>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            User Storage Details
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openClearAllDialog()}
              className="text-red-600"
            >
              Clear All Storage
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Usage %</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storageData.data.map((item) => (
                <TableRow key={item.userId}>
                  <TableCell className="font-medium">{item.userName}</TableCell>
                  <TableCell>{formatBytes(item.usedBytes)}</TableCell>
                  <TableCell>{item.quota} GB</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 font-medium">
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
                      >
                        Edit Quota
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openClearDialog(item.userId, item.userName)
                        }
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
      {/* Quota Editor Dialog */}
      <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Storage Quota</DialogTitle>
            <DialogDescription>
              Adjust storage quota (GB) for the selected user.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <label className="block text-sm text-slate-700 mb-2">User</label>
            <div className="mb-3 font-medium">{quotaEditingUser?.userName}</div>

            <label className="block text-sm text-slate-700 mb-2">
              Quota (GB)
            </label>
            <Input
              value={quotaInput}
              onChange={(e) => setQuotaInput(e.target.value)}
              type="number"
              min={0}
            />
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setQuotaDialogOpen(false);
                  setQuotaEditingUser(null);
                  setQuotaInput("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={confirmUpdateQuota}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear User Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear User Storage</DialogTitle>
            <DialogDescription>
              This will permanently delete files associated with the user{" "}
              <strong>{clearTarget?.userName}</strong>. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setClearDialogOpen(false);
                  setClearTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmClearUser}>
                Clear Storage
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Dialog */}
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Storage</DialogTitle>
            <DialogDescription>
              This will permanently delete files for all users. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setClearAllDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmClearAll}>
                Clear All
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
