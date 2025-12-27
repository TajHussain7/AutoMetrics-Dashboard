"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldAlert, LogIn, UserPlus, Mail, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.05),transparent_50%)]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500" />

        <div className="container mx-auto px-4 py-16 max-w-md relative z-10">
          <Card className="p-8 space-y-6 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-slate-900">
              Access Denied
            </h2>
            <p className="text-center text-slate-600 leading-relaxed">
              You need administrator privileges to access this content.
            </p>
            <div className="flex justify-center pt-2">
              <Button
                variant="default"
                onClick={() => (window.location.href = "/")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              >
                Back to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-blue-600 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.05),transparent_50%)]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500" />

        <div className="container mx-auto px-4 py-16 max-w-md relative z-10">
          <Card className="p-8 space-y-6 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-slate-900">
              Registration Required
            </h2>
            <p className="text-center text-slate-600 leading-relaxed">
              You need to register or sign in to access this content.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="default"
                onClick={() => (window.location.href = "/register")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Register Now
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/login")}
                className="border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-xl flex items-center gap-2 transition-all duration-300"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (user.status === "inactive") {
    return (
      <div className="relative min-h-screen bg-slate-50">
        {children}

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-w-lg w-full p-8 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-2xl space-y-6">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-t-5xl" />

            <div className="flex items-start gap-4 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <ShieldAlert className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Account Deactivated
                </h3>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  Your account has been deactivated by an administrator. You can
                  still sign in and view read-only content, but actions such as
                  uploading files, creating queries, or modifying data are
                  disabled.
                </p>

                <div className="flex flex-col gap-2 mt-6">
                  <RequestReactivationButton />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => (window.location.href = "/contact")}
                      className="flex-1 rounded-xl border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        window.location.href = "/login";
                        sessionStorage.removeItem("user");
                        localStorage.removeItem("user");
                      }}
                      className="flex-1 rounded-xl hover:bg-slate-100"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function RequestReactivationButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const request = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        name: (user.full_name || user.email) as string,
        email: user.email,
        subject: "Reactivation request",
        // Include the user's id first so admin pages can reliably parse it when
        // attempting to reactivate a user from the message.
        message: `User ${user.id} (${
          user.full_name || user.email
        }) requests account reactivation. Please review and reactivate if appropriate.`,
      };
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      toast({
        title: "Request sent",
        description: "Support will review your request.",
      });
    } catch (err) {
      console.error("Reactivation request failed:", err);
      toast({
        title: "Request failed",
        description: "Could not send reactivation request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={request}
      disabled={loading}
      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
    >
      <RefreshCw className="w-4 h-4 mr-2" />
      {loading ? "Sending..." : "Request Reactivation"}
    </Button>
  );
}
