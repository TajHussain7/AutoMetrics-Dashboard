"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MoreVertical,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ConfirmModal from "@/components/dashboard/ConfirmModal";
import adminApiClient from "@/lib/admin-api-client";

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: "member" | "admin";
  status: "active" | "inactive";
  // Email verification
  isVerified?: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Quick stats for header
  const totalUsers = users.length;
  const verifiedCount = users.filter((u) => u.isVerified).length;

  useEffect(() => {
    fetchUsers();

    const handler = (ev: any) => {
      const userId = ev?.detail?.userId;
      if (!userId) return;
      // Refresh the table when a user's status changes elsewhere
      fetchUsers();
    };

    window.addEventListener(
      "admin:user-status-changed",
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        "admin:user-status-changed",
        handler as EventListener
      );
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await adminApiClient.patch(`/users/${userId}/role`, { role: newRole });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      await adminApiClient.patch(`/users/${userId}/status`, {
        status: newStatus,
      });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openDeleteConfirm = (user: User) => {
    setSelectedUser({ id: user._id, name: user.fullName });
    setConfirmOpen(true);
  };

  const deleteUser = async (userId?: string) => {
    const id = userId || selectedUser?.id;
    if (!id) return;
    setDeleting(true);
    try {
      await adminApiClient.delete(`/users/${id}`);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setConfirmOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6" />

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Users Management
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage user accounts and permissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-500 text-sm font-medium text-slate-700 shadow-sm">
            <strong className="mr-2">{totalUsers}</strong>Users
          </div>
          <div className="px-3 py-2 rounded-xl bg-white border border-slate-500 text-sm font-medium text-slate-700 shadow-sm flex items-center gap-2">
            <CheckCircle className="text-green-600" size={16} />
            <span>
              <strong className="mr-1">{verifiedCount}</strong>Verified
            </span>
          </div>
        </div>
      </div>

      <Card className="mb-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-white">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={20}
              />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 hover:bg-slate-100/50">
                  <TableHead className="font-semibold text-slate-700">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Role
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Verified
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Joined
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">
                      {user.fullName}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.role === "admin" ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                          Admin (Locked)
                        </span>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            updateUserRole(user._id, value)
                          }
                        >
                          <SelectTrigger className="w-[110px] rounded-xl border-slate-300 hover:border-blue-400 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          user.status === "active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {user.status}
                      </span>
                    </TableCell>

                    <TableCell>
                      {user.isVerified ? (
                        <span
                          title={
                            user.emailVerifiedAt
                              ? new Date(user.emailVerifiedAt).toLocaleString()
                              : undefined
                          }
                          className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-green-50 text-green-700 border-green-200 flex items-center gap-2"
                        >
                          <CheckCircle size={14} />
                          Verified
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-2">
                          <XCircle size={14} />
                          Unverified
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl hover:bg-slate-100"
                          >
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-xl border-slate-200 shadow-lg"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              updateUserStatus(
                                user._id,
                                user.status === "active" ? "inactive" : "active"
                              )
                            }
                            className="rounded-lg"
                          >
                            {user.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteConfirm(user)}
                            className="text-red-600 rounded-lg hover:bg-red-50"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <ConfirmModal
        open={confirmOpen}
        title="Delete user"
        message={`Are you sure you want to delete ${
          selectedUser?.name ?? "this user"
        }? This will delete all the data of user.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={() => deleteUser()}
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
