"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { error } from "@/lib/logger";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Upload,
  User,
  Building,
  Phone,
  MapPin,
  Calendar,
  ArrowLeft,
  Save,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    phone_number: "",
    address: "",
    dob: "",
    role: "",
    status: "",
  });

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    const first = parts[0].charAt(0).toUpperCase();
    const last = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${first}${last}`;
  };

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    const load = async () => {
      try {
        const response = await fetch(`/api/users/${user.id}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to load profile");
        const data = await response.json();

        setProfile(data);
        setForm({
          full_name: data.full_name || "",
          company_name: data.company_name || "",
          phone_number: data.phone_number || "",
          address: data.address || "",
          dob: data.dob || "",
          role: data.role || "",
          status: data.status || "",
        });
      } catch (err) {
        error("Profile load failed:", err);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const handleFieldUpdate = async (field: string, value: string) => {
    if (!user?.id) return;

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

    setForm((prev) => ({ ...prev, [field]: value }));

    if (field === "full_name" && !value.trim()) {
      setFieldErrors((prev) => ({ ...prev, [field]: "Name is required" }));
      return;
    }
    if (
      field === "phone_number" &&
      value.trim() &&
      !/^\+?[\d\s-]+$/.test(value)
    ) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: "Invalid phone number format",
      }));
      return;
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/${user.id}/field`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ field, value: value.trim() }),
        });

        if (!response.ok) {
          throw new Error((await response.text()) || "Failed to update field");
        }

        const data = await response.json();
        setProfile(data);

        toast({
          title: "Updated",
          description: `${field.replace("_", " ")} updated successfully`,
          variant: "default",
        });
      } catch (err) {
        error("Field update failed:", err);
        setFieldErrors((prev) => ({
          ...prev,
          [field]:
            err instanceof Error ? err.message : "Failed to update field",
        }));
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to update field",
          variant: "destructive",
        });
      }
    }, 500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || saving) return;

    const errors: { [key: string]: string } = {};
    if (!form.full_name.trim()) {
      errors.full_name = "Full name is required";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          company_name: form.company_name.trim(),
          phone_number: form.phone_number.trim(),
          address: form.address.trim(),
          dob: form.dob,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update profile");
      }

      const data = await response.json();
      setProfile(data);

      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "default",
      });

      setTimeout(() => {
        setSaving(false);
      }, 1000);
      navigate("/dashboard");
    } catch (err) {
      error("Profile save failed:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file?: File) => {
    if (!user || !file) return;
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        const response = await fetch(`/api/users/${user.id}/avatar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ avatar: base64 }),
        });

        if (!response.ok) {
          throw new Error("Failed to upload avatar to server");
        }

        const data = await response.json();
        const newAvatar = data?.avatar ?? data?.avatarUrl ?? null;
        if (newAvatar) {
          setProfile((prev: any) => ({ ...(prev || {}), avatar: newAvatar }));
        }

        toast({ title: "Uploaded", description: "Avatar uploaded" });
        fileRef.current!.value = "";
      };
      reader.readAsDataURL(file);
    } catch (err) {
      error("Avatar upload failed:", err);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 relative overflow-hidden">
      <div className="absolute top-40 left-10 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl" />

      <main className="flex-1 py-12 relative">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600" />

            <CardHeader className="border-b border-slate-100 pb-6 pt-8 px-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-slate-900">
                    Edit Profile
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    Update your personal information and preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-8 px-8">
              <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-100">
                <div className="relative group">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar || "/placeholder.svg"}
                      alt="Profile"
                      className="w-32 h-32 rounded-2xl object-cover shadow-xl ring-4 ring-white"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl ring-4 ring-white">
                      <span className="text-4xl font-bold text-white">
                        {getInitials(form.full_name)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={loading}
                    className="rounded-xl border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {loading ? "Uploading..." : "Upload Avatar"}
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="full_name"
                      className="text-sm font-semibold text-slate-700 flex items-center gap-1"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <Input
                        id="full_name"
                        required
                        placeholder="Enter your full name"
                        value={form.full_name}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            full_name: e.target.value,
                          }))
                        }
                        className={`pl-14 h-12 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-200 ${
                          fieldErrors.full_name ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {fieldErrors.full_name && (
                      <p className="text-sm text-red-500">
                        {fieldErrors.full_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="company_name"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Company Name
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Building className="w-4 h-4 text-slate-500" />
                      </div>
                      <Input
                        id="company_name"
                        placeholder="Enter company name"
                        value={form.company_name}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            company_name: e.target.value,
                          }))
                        }
                        className={`pl-14 h-12 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-200 ${
                          fieldErrors.company_name ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {fieldErrors.company_name && (
                      <p className="text-sm text-red-500">
                        {fieldErrors.company_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone_number"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Phone Number
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </div>
                      <Input
                        id="phone_number"
                        placeholder="Enter phone number"
                        value={form.phone_number}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            phone_number: e.target.value,
                          }))
                        }
                        className={`pl-14 h-12 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-200 ${
                          fieldErrors.phone_number ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {fieldErrors.phone_number && (
                      <p className="text-sm text-red-500">
                        {fieldErrors.phone_number}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Address
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-slate-500" />
                      </div>
                      <Input
                        id="address"
                        placeholder="Enter address"
                        value={form.address}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        className={`pl-14 h-12 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-200 ${
                          fieldErrors.address ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {fieldErrors.address && (
                      <p className="text-sm text-red-500">
                        {fieldErrors.address}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="dob"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Date of Birth
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-slate-500" />
                      </div>
                      <Input
                        id="dob"
                        type="date"
                        value={form.dob}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, dob: e.target.value }))
                        }
                        className={`pl-14 h-12 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-200 ${
                          fieldErrors.dob ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {fieldErrors.dob && (
                      <p className="text-sm text-red-500">{fieldErrors.dob}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    disabled={saving}
                    className="rounded-xl border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all h-12 px-6"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || Object.keys(fieldErrors).length > 0}
                    className="h-12 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl"
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        <span>Save Changes</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
