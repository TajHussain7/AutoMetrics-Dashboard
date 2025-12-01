import { useState, useEffect, useRef } from "react";
import {
  Home,
  Table,
  BarChart3,
  Download,
  Activity,
  ChevronDown,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAnnouncements } from "@/contexts/announcement-context";

type ScreenType =
  | "dashboard"
  | "data-table"
  | "analytics"
  | "export"
  | "history";

interface TopNavProps {
  activeScreen: ScreenType;
  onScreenChange: (screen: ScreenType) => void;
}

const navigation = [
  { id: "dashboard" as const, label: "Dashboard Overview", icon: Home },
  { id: "data-table" as const, label: "Data Management", icon: Table },
  { id: "analytics" as const, label: "Analytics Hub", icon: BarChart3 },
  { id: "export" as const, label: "Export Center", icon: Download },
  { id: "history" as const, label: "History", icon: Activity },
];

export default function TopNav({ activeScreen, onScreenChange }: TopNavProps) {
  const auth = useAuth();
  const { user, signOut } = auth;
  const [, navigate] = useLocation();
  const [avatarError, setAvatarError] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Get unread count from announcement context (no fetching here)
  const { unreadCount } = useAnnouncements();

  // form state for editing
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    phone_number: "",
    role: "",
    status: "",
  });

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${user.id}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setProfile(data);
        setForm({
          full_name: data.full_name || "",
          company_name: data.company_name || "",
          phone_number: data.phone_number || "",
          role: data.role || "",
          status: data.status || "",
        });
        if (data.avatar) {
          setAvatarUrl(data.avatar);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <div className="bg-white shadow-sm border-b border-slate-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-10"></div>
              <Activity className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoMetrics
              </h1>
              <p className="text-sm text-slate-500">
                Intelligent Travel Data Dashboard
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-100 rounded-xl p-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onScreenChange(item.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                    isActive
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Section — Actions */}
          <div className="flex items-center gap-4">
            {/* Announcements Button with Badge */}
            <button
              onClick={() => navigate("/announcements")}
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="View announcements"
            >
              <Bell className="w-5 h-5 text-slate-700 hover:text-slate-900" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-6">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative group">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-slate-800 flex items-center gap-0.3">
                    {profile?.full_name ||
                      user?.full_name ||
                      user?.email ||
                      "User"}
                    <ChevronDown className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </p>
                  <p className="text-sm text-slate-500">
                    {profile?.company_name || "Member"}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-green-400 to-blue-500 ring-2 ring-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUrl && !avatarError ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : avatarError ? (
                    <div className="w-full h-full rounded-full bg-white/80 text-slate-700 flex items-center justify-center text-sm font-medium">
                      {(
                        profile?.full_name ||
                        user?.full_name ||
                        user?.email ||
                        "U"
                      )
                        .split(" ")
                        .map((s: any) => s.charAt(0))
                        .slice(0, 2)
                        .join("")}
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-white/80 text-slate-700 flex items-center justify-center text-sm font-medium">
                      {(
                        profile?.full_name ||
                        user?.full_name ||
                        user?.email ||
                        "U"
                      )
                        .split(" ")
                        .map((s: any) => s.charAt(0))
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden file input for avatar upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;

                  try {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64Data = reader.result as string;
                      try {
                        const res = await fetch(
                          `/api/users/${user.id}/avatar`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ avatar: base64Data }),
                          }
                        );

                        if (!res.ok) {
                          throw new Error("Failed to upload avatar");
                        }

                        const data = await res.json();
                        const uploadedAvatar =
                          data?.avatar || data?.avatarUrl || base64Data;

                        setAvatarUrl(uploadedAvatar);
                        setProfile((prev: any) => ({
                          ...prev,
                          avatar: uploadedAvatar,
                        }));
                      } catch (err) {
                        console.error("Failed to upload avatar:", err);
                        setAvatarError(true);
                      }
                    };
                    reader.readAsDataURL(file);
                  } catch (err) {
                    console.error("Avatar upload failed", err);
                    setAvatarError(true);
                  }
                }}
              />

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800">
                    {profile?.full_name || user?.full_name || user?.email}
                  </p>
                  <p className="text-xs text-slate-500">
                    {profile?.company_name || "Member"}
                  </p>
                </div>
                <div className="p-3">
                  {!editing ? (
                    <div className="flex flex-col">
                      <button
                        className="text-sm text-slate-700 text-left py-2 px-2 hover:bg-slate-50 rounded-md"
                        onClick={() => {
                          navigate && navigate("/profile");
                        }}
                      >
                        Edit profile
                      </button>
                      <button
                        className="text-sm text-slate-700 text-left py-2 px-2 hover:bg-slate-50 rounded-md"
                        onClick={async () => {
                          try {
                            await signOut();
                            navigate && navigate("/login");
                          } catch (err) {
                            console.error("Sign out failed", err);
                          }
                        }}
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(ev) => {
                        ev.preventDefault();
                        if (!profile || !user) return;
                        setSaving(true);
                        try {
                          const updatedProfile = {
                            ...profile,
                            full_name: form.full_name,
                            company_name: form.company_name,
                            phone_number: form.phone_number,
                            role: form.role,
                            status: form.status,
                          };
                          localStorage.setItem(
                            `user_profile_${user.id}`,
                            JSON.stringify(updatedProfile)
                          );
                          setProfile(updatedProfile);
                          setEditing(false);
                        } catch (err) {
                          console.error("Failed to update profile", err);
                          alert(
                            "Failed to update profile. See console for details."
                          );
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      <div className="space-y-2">
                        <input
                          className="w-full border px-2 py-1 rounded"
                          value={form.full_name}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              full_name: e.target.value,
                            }))
                          }
                          placeholder="Full name"
                        />
                        <input
                          className="w-full border px-2 py-1 rounded"
                          value={form.company_name}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              company_name: e.target.value,
                            }))
                          }
                          placeholder="Company"
                        />
                        <input
                          className="w-full border px-2 py-1 rounded"
                          value={form.phone_number}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              phone_number: e.target.value,
                            }))
                          }
                          placeholder="Phone"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(false)}
                            className="px-3 py-1 border rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
