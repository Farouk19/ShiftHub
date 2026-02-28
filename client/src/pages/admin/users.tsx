import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, Ban, CheckCircle, UserPlus, ChevronDown, ShieldCheck, Briefcase, User } from "lucide-react";

export default function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("ADMIN");

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated" });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update role");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; role: string }) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created successfully" });
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("ADMIN");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    EMPLOYER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    EMPLOYEE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  const roleIcons: Record<string, typeof Shield> = {
    ADMIN: ShieldCheck,
    EMPLOYER: Briefcase,
    EMPLOYEE: User,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-users-title">User Management</h1>
          <p className="text-muted-foreground">Manage platform users and roles</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  data-testid="input-create-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="Enter password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-create-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger data-testid="select-create-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="EMPLOYER">Employer</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" data-testid="button-cancel-create">Cancel</Button>
              </DialogClose>
              <Button
                onClick={() => createMutation.mutate({ email: newEmail, password: newPassword, role: newRole })}
                disabled={createMutation.isPending || !newEmail || !newPassword}
                data-testid="button-confirm-create"
              >
                {createMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {allUsers?.map((u: any) => {
                const isCurrentUser = u.id === currentUser?.id;
                const RoleIcon = roleIcons[u.role] || User;
                return (
                  <div key={u.id} className="flex items-center justify-between p-4" data-testid={`row-user-${u.id}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm" data-testid={`text-email-${u.id}`}>{u.email}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${roleColors[u.role]}`}>
                          <RoleIcon className="h-3 w-3" />
                          {u.role}
                        </span>
                        {!u.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Disabled</span>}
                        {isCurrentUser && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">You</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                    {!isCurrentUser && (
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" data-testid={`button-role-${u.id}`} disabled={roleMutation.isPending}>
                              <Shield className="h-3.5 w-3.5 mr-1" />
                              Role
                              <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {["ADMIN", "EMPLOYER", "EMPLOYEE"].filter(r => r !== u.role).map(role => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => roleMutation.mutate({ id: u.id, role })}
                                data-testid={`menu-role-${role.toLowerCase()}-${u.id}`}
                              >
                                {role === "ADMIN" && <ShieldCheck className="h-3.5 w-3.5 mr-2" />}
                                {role === "EMPLOYER" && <Briefcase className="h-3.5 w-3.5 mr-2" />}
                                {role === "EMPLOYEE" && <User className="h-3.5 w-3.5 mr-2" />}
                                Set as {role.charAt(0) + role.slice(1).toLowerCase()}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button size="sm" variant={u.isActive ? "destructive" : "default"}
                          onClick={() => toggleMutation.mutate({ id: u.id, isActive: !u.isActive })}
                          disabled={toggleMutation.isPending}
                          data-testid={`button-toggle-${u.id}`}>
                          {u.isActive ? <><Ban className="h-3.5 w-3.5 mr-1" /> Disable</> : <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Enable</>}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
