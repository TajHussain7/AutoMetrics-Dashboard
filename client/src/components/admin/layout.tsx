"use client";

import type React from "react";

import {
  Users,
  HardDrive,
  MessageSquare,
  Megaphone,
  Star,
  LayoutDashboard,
  LogOut,
  Mail,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";

interface AdminLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  currentPage,
  onNavigate,
  children,
}: AdminLayoutProps) {
  const { signOut } = useAuth();
  const [, setLocation] = useLocation();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "storage", label: "Storage", icon: HardDrive },
    { id: "reactivations", label: "Reactivation Requests", icon: RefreshCw },
    { id: "queries", label: "Queries & Support", icon: MessageSquare },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "contacts", label: "Contact Messages", icon: Mail },
    { id: "feedback", label: "Feedback", icon: Star },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      setLocation("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20">
      <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white border-r border-slate-700/50 flex flex-col shadow-2xl relative">
        {/* Decorative gradient accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />

        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Portal</h1>
            </div>
          </div>
          <p className="text-sm text-slate-400">Manage your platform</p>
        </div>

        <nav className="p-4 flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <div
                  className={`transition-transform duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                >
                  <Icon size={20} />
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-red-600/20 hover:text-red-400 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/30"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20">
          {children}
        </div>
      </main>
    </div>
  );
}
