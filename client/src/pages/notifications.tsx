import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";

export default function NotificationsPage() {
  const { token } = useAuth();

  const { data: notifs, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token,
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const markOneMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const unread = notifs?.filter((n: any) => !n.isRead)?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-notifications-title">Notifications</h1>
          <p className="text-muted-foreground">{unread} unread</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={() => markAllMutation.mutate()} data-testid="button-mark-all-read">
            <CheckCheck className="h-4 w-4 mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : notifs?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifs?.map((n: any) => (
            <Card key={n.id} className={`${!n.isRead ? "border-primary/30 bg-primary/5" : ""}`}
              data-testid={`card-notification-${n.id}`}>
              <CardContent className="p-4 flex items-start justify-between">
                <div className="space-y-1">
                  <p className={`text-sm ${!n.isRead ? "font-semibold" : ""}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && (
                  <Button size="sm" variant="ghost" onClick={() => markOneMutation.mutate(n.id)} data-testid={`button-read-${n.id}`}>
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
