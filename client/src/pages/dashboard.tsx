import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, CreditCard, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

function useAuthFetch(url: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!token,
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: jobs, isLoading: jobsLoading } = useAuthFetch("/api/jobs");
  const { data: credits, isLoading: creditsLoading } = useAuthFetch("/api/credits");
  const { data: subscription, isLoading: subLoading } = useAuthFetch("/api/subscription");
  const { data: shifts, isLoading: shiftsLoading } = useAuthFetch("/api/employer/shifts");

  const activeJobs = jobs?.filter((j: any) => j.status === "OPEN" || j.status === "FILLED")?.length || 0;
  const totalJobs = jobs?.length || 0;
  const pendingShifts = shifts?.filter((s: any) => s.status === "ASSIGNED")?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/jobs">
          <Card className="hover-elevate cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {jobsLoading ? <Skeleton className="h-8 w-16" /> : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-active-jobs">{activeJobs}</div>
                  <p className="text-xs text-muted-foreground">{totalJobs} total jobs</p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/credits">
          <Card className="hover-elevate cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Credits</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {creditsLoading ? <Skeleton className="h-8 w-16" /> : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-credits">{credits?.balance ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Available credits</p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/credits">
          <Card className="hover-elevate cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {subLoading ? <Skeleton className="h-8 w-16" /> : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-plan">{subscription?.plan || "FREE"}</div>
                  <p className="text-xs text-muted-foreground">Current subscription</p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Shifts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {shiftsLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold" data-testid="text-pending-shifts">{pendingShifts}</div>
                <p className="text-xs text-muted-foreground">Upcoming assignments</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : jobs?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No jobs yet. Create your first job posting!</p>
            ) : (
              <div className="space-y-3">
                {jobs?.slice(0, 5).map((job: any) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover-elevate cursor-pointer" data-testid={`card-job-${job.id}`}>
                      <div>
                        <p className="font-medium text-sm">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.location} &middot; {job.shiftDate}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        job.status === "OPEN" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                        job.status === "FILLED" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                        job.status === "CANCELLED" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                        "bg-muted text-muted-foreground"
                      }`} data-testid={`badge-status-${job.id}`}>{job.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/jobs/new">
              <div className="p-3 rounded-lg border hover-elevate cursor-pointer" data-testid="link-create-job">
                <p className="font-medium text-sm">Create New Job</p>
                <p className="text-xs text-muted-foreground">Post a new shift opportunity</p>
              </div>
            </Link>
            <Link href="/employees">
              <div className="p-3 rounded-lg border hover-elevate cursor-pointer" data-testid="link-search-employees">
                <p className="font-medium text-sm">Search Employees</p>
                <p className="text-xs text-muted-foreground">Find available workers by skill</p>
              </div>
            </Link>
            <Link href="/credits">
              <div className="p-3 rounded-lg border hover-elevate cursor-pointer" data-testid="link-manage-credits">
                <p className="font-medium text-sm">Manage Credits</p>
                <p className="text-xs text-muted-foreground">Top up or upgrade your plan</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
