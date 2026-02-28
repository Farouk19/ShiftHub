import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Shield,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const employerLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/credits", label: "Credits & Plan", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: UserCog },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const links = user?.role === "ADMIN" ? adminLinks : employerLinks;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate" data-testid="text-app-name">ShiftHub</span>
            <span className="text-xs text-muted-foreground">{user?.role === "ADMIN" ? "Admin Panel" : "Employer Portal"}</span>
          </div>
        </div>
        {user && (
          <p className="text-xs text-muted-foreground mt-2 truncate" data-testid="text-user-email">{user.email}</p>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{user?.role === "ADMIN" ? "Admin" : "Navigation"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((link) => {
                const isActive = link.href === "/"
                  ? location === "/"
                  : link.href === "/admin"
                    ? location === "/admin"
                    : location.startsWith(link.href);
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={link.href} data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}>
                        <link.icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "ADMIN" && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Admin Access</span>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout} data-testid="button-logout">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
