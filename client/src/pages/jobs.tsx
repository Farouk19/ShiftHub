import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, MapPin, Calendar, Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  FILLED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PAUSED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  COMPLETED: "bg-muted text-muted-foreground",
};

export default function JobsPage() {
  const { token } = useAuth();
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!token,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-jobs-title">Job Postings</h1>
          <p className="text-muted-foreground">Manage your shift job postings</p>
        </div>
        <Link href="/jobs/new">
          <Button data-testid="button-create-job">
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : jobs?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No jobs posted yet</p>
            <Link href="/jobs/new">
              <Button data-testid="button-first-job">Create Your First Job</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs?.map((job: any) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover-elevate cursor-pointer" data-testid={`card-job-${job.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[job.status] || statusColors.COMPLETED}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{job.shiftDate}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{job.startTime} - {job.endTime}</span>
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.acceptedCount}/{job.positionsQty} filled</span>
                      </div>
                      {job.payRate && <p className="text-sm font-medium">${job.payRate}/hr</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
