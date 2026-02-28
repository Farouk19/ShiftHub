import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function SettingsPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/employer/profile"],
    queryFn: async () => {
      const res = await fetch("/api/employer/profile", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token && user?.role === "EMPLOYER",
  });

  const [form, setForm] = useState({
    companyName: "",
    description: "",
    location: "",
    phone: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName || "",
        description: profile.description || "",
        location: profile.location || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/employer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/profile"] });
      toast({ title: "Profile updated" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground">Manage your company profile</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Company Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled data-testid="input-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={form.companyName}
                onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))} data-testid="input-company-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} data-testid="input-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} data-testid="input-location" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} data-testid="input-phone" />
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-profile">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
