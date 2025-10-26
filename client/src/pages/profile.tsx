import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    phone_number: "",
    role: "",
    status: "",
  });

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    const load = async () => {
      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (!response.ok) throw new Error("Failed to load profile");
        const data = await response.json();

        setProfile(data);
        setForm({
          full_name: data.full_name || "",
          company_name: data.company_name || "",
          phone_number: data.phone_number || "",
          role: data.role || "",
          status: data.status || "",
        });
      } catch (err) {
        console.error("Profile load failed:", err);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user?.id) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: form.full_name,
          company_name: form.company_name,
          phone_number: form.phone_number,
          role: form.role,
          status: form.status,
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");
      const data = await response.json();

      setProfile(data);
      toast({ title: "Saved", description: "Profile updated" });

      // wait briefly before navigate for sync
      setTimeout(() => navigate("/"), 300);
    } catch (err) {
      console.error("Profile save failed:", err);
      toast({
        title: "Error",
        description: "Failed to save profile",
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
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`/api/users/${user.id}/avatar`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload avatar");
      const data = await response.json();

      if (data?.avatarUrl) {
        await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ avatar_url: data.avatarUrl }),
        });
      }

      toast({ title: "Uploaded", description: "Avatar uploaded" });
      fileRef.current!.value = "";
    } catch (err) {
      console.error("Avatar upload failed:", err);
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
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <Input
              placeholder="Full name"
              value={form.full_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, full_name: e.target.value }))
              }
            />
            <Input
              placeholder="Company"
              value={form.company_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, company_name: e.target.value }))
              }
            />
            <Input
              placeholder="Phone number"
              value={form.phone_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone_number: e.target.value }))
              }
            />
            <Input
              placeholder="Role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            />
            <Input
              placeholder="Status"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            />
            <div className="flex items-center gap-4">
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
              >
                {loading ? "Uploading..." : "Upload Avatar"}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
