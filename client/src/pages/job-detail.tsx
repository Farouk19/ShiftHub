import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, Calendar, Clock, Users, Check, X, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function JobDetailPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const jobId = params.id;

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!token && !!jobId,
  });

  const { data: appsList, isLoading: appsLoading } = useQuery({
    queryKey: ["/api/jobs", jobId, "applications"],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/applications`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!token && !!jobId,
  });

  const acceptMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const res = await fetch(`/api/applications/${applicationId}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId, "applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      toast({ title: "Application accepted" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to accept", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const res = await fetch(`/api/applications/${applicationId}/reject`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId, "applications"] });
      toast({ title: "Application rejected" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Job cancelled" });
      setLocation("/jobs");
    },
  });

  if (jobLoading) return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/jobs">
          <Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold" data-testid="text-job-title">{job?.title}</h1>
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
          job?.status === "OPEN" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
          job?.status === "FILLED" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
          "bg-muted text-muted-foreground"
        }`} data-testid="badge-job-status">{job?.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {job?.description && <p className="text-sm" data-testid="text-job-description">{job.description}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{job?.location}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{job?.shiftDate}</span></div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{job?.startTime} - {job?.endTime}</span></div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span>{job?.acceptedCount}/{job?.positionsQty} positions filled</span></div>
              </div>
              {job?.payRate && <p className="text-sm"><strong>Pay Rate:</strong> ${job.payRate}/hr</p>}
              {job?.requiredSkills?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill: string) => (
                    <span key={skill} className="text-xs px-2 py-1 rounded-full bg-muted">{skill}</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applications ({appsList?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {appsLoading ? (
                <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : appsList?.length === 0 ? (
                <p className="text-muted-foreground text-sm">No applications yet</p>
              ) : (
                <div className="space-y-3">
                  {appsList?.map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`card-application-${app.id}`}>
                      <div>
                        <p className="font-medium text-sm">{app.employee?.fullName || "Employee"}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.employee?.location && `${app.employee.location} · `}
                          {app.employee?.skills?.join(", ") || "No skills listed"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          app.status === "PENDING" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                          app.status === "ACCEPTED" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                          app.status === "REJECTED" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                          "bg-muted text-muted-foreground"
                        }`}>{app.status}</span>
                        {app.status === "PENDING" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => acceptMutation.mutate(app.id)}
                              disabled={acceptMutation.isPending} data-testid={`button-accept-${app.id}`}>
                              <Check className="h-3.5 w-3.5 mr-1" /> Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(app.id)}
                              disabled={rejectMutation.isPending} data-testid={`button-reject-${app.id}`}>
                              <X className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {job?.status === "OPEN" && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="destructive" className="w-full" onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending} data-testid="button-cancel-job">
                  <Trash2 className="h-4 w-4 mr-2" /> Cancel Job
                </Button>
                <p className="text-xs text-muted-foreground">
                  {job?.acceptedCount === 0 ? "Credits will be refunded" : "Credits will not be refunded (applications already accepted)"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
