import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/lib/auth";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import JobsPage from "@/pages/jobs";
import JobFormPage from "@/pages/job-form";
import JobDetailPage from "@/pages/job-detail";
import EmployeesPage from "@/pages/employees";
import CreditsPage from "@/pages/credits";
import NotificationsPage from "@/pages/notifications";
import SettingsPage from "@/pages/settings";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsersPage from "@/pages/admin/users";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b border-border sticky top-0 z-50 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/jobs/new" component={JobFormPage} />
              <Route path="/jobs/:id" component={JobDetailPage} />
              <Route path="/jobs" component={JobsPage} />
              <Route path="/employees" component={EmployeesPage} />
              <Route path="/credits" component={CreditsPage} />
              <Route path="/notifications" component={NotificationsPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/admin/users" component={AdminUsersPage} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/login"><Redirect to="/" /></Route>
              <Route path="/register"><Redirect to="/" /></Route>
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  if (user.role === "ADMIN") {
    return <AuthenticatedLayout />;
  }

  if (user.role === "EMPLOYER") {
    return <AuthenticatedLayout />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Employee Portal</h1>
        <p className="text-muted-foreground">The employee experience is available through the mobile app.</p>
        <p className="text-sm text-muted-foreground">Logged in as {user.email}</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
