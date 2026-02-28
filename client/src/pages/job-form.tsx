import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function JobFormPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    shiftDate: "",
    startTime: "",
    endTime: "",
    positionsQty: 1,
    requiredSkills: "",
    payRate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        ...form,
        positionsQty: Number(form.positionsQty),
        requiredSkills: form.requiredSkills ? form.requiredSkills.split(",").map(s => s.trim()) : [],
        payRate: form.payRate || undefined,
      };
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      toast({ title: "Job created successfully" });
      setLocation("/jobs");
    } catch (err: any) {
      toast({ title: "Failed to create job", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/jobs">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold" data-testid="text-create-job-title">Create Job Posting</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" placeholder="e.g. Warehouse Assistant" value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required data-testid="input-title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the job duties and requirements..." value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4} data-testid="input-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g. Downtown Office" value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} required data-testid="input-location" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shiftDate">Shift Date</Label>
                <Input id="shiftDate" type="date" value={form.shiftDate}
                  onChange={(e) => setForm(f => ({ ...f, shiftDate: e.target.value }))} required data-testid="input-shift-date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" value={form.startTime}
                  onChange={(e) => setForm(f => ({ ...f, startTime: e.target.value }))} required data-testid="input-start-time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" value={form.endTime}
                  onChange={(e) => setForm(f => ({ ...f, endTime: e.target.value }))} required data-testid="input-end-time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="positionsQty">Positions</Label>
                <Input id="positionsQty" type="number" min={1} value={form.positionsQty}
                  onChange={(e) => setForm(f => ({ ...f, positionsQty: parseInt(e.target.value) || 1 }))} data-testid="input-positions" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payRate">Pay Rate ($/hr)</Label>
                <Input id="payRate" type="number" step="0.01" min={0} placeholder="25.00" value={form.payRate}
                  onChange={(e) => setForm(f => ({ ...f, payRate: e.target.value }))} data-testid="input-pay-rate" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills (comma-separated)</Label>
              <Input id="skills" placeholder="e.g. forklift, heavy lifting, first aid" value={form.requiredSkills}
                onChange={(e) => setForm(f => ({ ...f, requiredSkills: e.target.value }))} data-testid="input-skills" />
            </div>
            <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
              <span>This will cost 5 credits</span>
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-submit-job">
              {loading ? "Creating..." : "Create Job Posting"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
