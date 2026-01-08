"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  FileSpreadsheet,
  RotateCw,
  Trash2,
  History,
  Database,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTravelData } from "@/contexts/travel-data-context";
import { formatDistance } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { debug, error as errorLogger } from "@/lib/logger";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UploadSession {
  _id: string;
  filename: string;
  original_name: string;
  created_at: string;
  metadata: {
    total_rows: number;
    columns: string[];
    file_type: string;
  };
}

export function FileHistory() {
  const [sessions, setSessions] = useState<UploadSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { setTravelData, setCurrentSessionId } = useTravelData();
  const { toast } = useToast();

  const getApiUrl = (path: string) => {
    const apiBase = import.meta.env.VITE_API_URL ?? "";
    return apiBase ? `${apiBase}${path}` : path;
  };

  useEffect(() => {
    fetchFileHistory();
  }, []);

  const fetchFileHistory = async () => {
    try {
      const response = await fetch(getApiUrl("/api/files/history"), {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch file history");
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      errorLogger("Error fetching file history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch file history",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      setDeletingId(sessionId);
      const response = await fetch(getApiUrl(`/api/files/${sessionId}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete session");

      // Remove the session from the UI
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      errorLogger("Error deleting session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete file",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (sessionId: string) => {
    try {
      debug("Restoring session:", sessionId);
      const response = await fetch(`/api/files/${sessionId}/restore`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Read raw text once to avoid "body stream already read" errors
      const rawText = await response.text();

      if (!response.ok) {
        errorLogger("Server response:", rawText);
        throw new Error(
          `Failed to restore session: ${response.status} ${response.statusText} - ${rawText}`
        );
      }

      let responseData;
      try {
        responseData = JSON.parse(rawText);
      } catch (parseError) {
        errorLogger("Failed to parse response:", rawText);
      }

      if (!responseData.session || !responseData.data) {
        throw new Error("Invalid response format from server");
      }

      const { session, data } = responseData;

      // Update travel data context with restored data
      debug("Setting travel data: (length)", data?.length || 0);
      setTravelData(data);

      // Set the restored session as the active session
      if (session && session._id) {
        debug("Setting current session:", session._id);
        setCurrentSessionId(session._id);

        // Trigger a state update in the parent dashboard component
        const event = new CustomEvent("sessionRestored", {
          detail: { sessionId, data },
        });
        window.dispatchEvent(event);

        // Update URL without full page reload
        const url = new URL(window.location.href);
        url.searchParams.set("section", "data-table");
        url.searchParams.set("restored", sessionId);
        window.history.pushState({}, "", url.toString());
      }

      toast({
        title: "Success",
        description: "Data restored successfully",
      });
    } catch (error) {
      console.error("Error restoring session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to restore data",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
            <History className="h-8 w-8 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 blur-xl opacity-30 animate-pulse" />
        </div>
        <p className="text-slate-500 font-medium">Loading history...</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="w-full p-6 relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 pointer-events-none rounded-3xl" />

      <motion.div
        className="flex items-center gap-4 mb-8 relative"
        variants={itemVariants}
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 blur-lg opacity-30" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">
            Upload History
          </h2>
          <p className="text-sm text-slate-500">
            {sessions.length} {sessions.length === 1 ? "file" : "files"}{" "}
            uploaded
          </p>
        </div>
      </motion.div>

      {sessions.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-16 gap-4"
          variants={itemVariants}
        >
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Database className="h-10 w-10 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No files uploaded yet</p>
          <p className="text-sm text-slate-400">Upload a file to see it here</p>
        </motion.div>
      ) : (
        <motion.div
          className="grid gap-4 w-full relative"
          variants={containerVariants}
        >
          {sessions.map((session, index) => (
            <motion.div
              key={session._id}
              variants={itemVariants}
              custom={index}
            >
              <Card className="p-5 rounded-2xl border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="flex items-start justify-between relative">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {session.original_name}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDistance(
                            new Date(session.created_at),
                            new Date(),
                            {
                              addSuffix: true,
                            }
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg font-medium">
                          <Database className="h-3.5 w-3.5" />
                          {session.metadata.total_rows.toLocaleString()} records
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(session._id)}
                      className="flex items-center gap-2 rounded-xl border-blue-200 bg-blue-50/50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                    >
                      <RotateCw className="h-4 w-4" />
                      Restore
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 rounded-xl border-red-200 bg-red-50/50 text-red-500 hover:bg-red-100 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                          disabled={deletingId === session._id}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === session._id
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border-slate-200">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-slate-800">
                            Are you sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-500">
                            This will permanently delete this file and its data.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 rounded-xl"
                            onClick={() => handleDelete(session._id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
