"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";

function getApiUrl(path: string): string {
  const apiBase = import.meta.env.VITE_API_URL ?? "";
  return apiBase ? `${apiBase}${path}` : path;
}

export default function DeleteAccountConfirm() {
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [checked, setChecked] = useState(false);
  const [step, setStep] = useState<"confirm" | "password">("confirm");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setError("");
    setLoading(true);
    if (!user) {
      setError("User not found. Please log in again.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(getApiUrl(`/api/users/${user.id}/delete`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Password incorrect or deletion failed.");
        setLoading(false);
        return;
      }
      await signOut();
      navigate("/account-deleted");
    } catch (err) {
      setError("An error occurred. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(239,68,68,0.05),transparent_50%)]" />

      {step === "confirm" && (
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-red-100 p-8 relative z-10">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg mb-6">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold mb-2 text-red-600">
              Delete Account
            </h2>
            <p className="text-sm text-slate-600 mb-6 text-center leading-relaxed">
              All your data will be{" "}
              <span className="font-semibold text-red-600">
                permanently deleted
              </span>{" "}
              and cannot be reinstated under any circumstances.
            </p>

            <label className="flex items-start gap-3 mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-red-200 transition-colors cursor-pointer w-full">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <span className="text-sm text-slate-700 leading-relaxed">
                I understand that my account and data will be permanently
                deleted.
              </span>
            </label>

            <div className="flex gap-3 w-full">
              <button
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 hover:shadow-md transition-all disabled:opacity-50"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all disabled:opacity-50"
                disabled={!checked || loading}
                onClick={() => setStep("password")}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "password" && (
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-red-100 p-8 relative z-10">
          <h2 className="text-2xl font-bold mb-4 text-red-600 text-center">
            Confirm Deletion
          </h2>
          <p className="text-sm text-slate-600 mb-6 text-center leading-relaxed">
            Please enter your password to confirm account deletion.
          </p>

          <input
            type="password"
            className="w-full border border-slate-300 px-4 py-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-red-400 transition-colors disabled:opacity-50 disabled:bg-slate-50"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 hover:shadow-md transition-all disabled:opacity-50"
              onClick={() => setStep("confirm")}
              disabled={loading}
            >
              Back
            </button>
            <button
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all disabled:opacity-50"
              disabled={!password || loading}
              onClick={handleDelete}
            >
              {loading ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
