import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, ArrowUp, Zap, Crown, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";

export default function CreditsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [topupAmount, setTopupAmount] = useState(10);

  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: ["/api/credits"],
    queryFn: async () => {
      const res = await fetch("/api/credits", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["/api/subscription"],
    queryFn: async () => {
      const res = await fetch("/api/subscription", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["/api/credits/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/credits/transactions", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token,
  });

  const topupMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch("/api/credits/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/transactions"] });
      toast({ title: "Credits topped up successfully" });
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/transactions"] });
      toast({ title: "Plan upgraded successfully" });
    },
  });

  const txTypeLabels: Record<string, string> = {
    MONTHLY_REFRESH: "Monthly Credit Refresh",
    TOP_UP: "Credit Top-Up",
    JOB_POST: "Job Posting",
    ACCEPT_APPLICATION: "Accept Application",
    REFUND: "Refund",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-credits-title">Credits & Subscription</h1>
        <p className="text-muted-foreground">Manage your credits and plan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {creditsLoading ? <Skeleton className="h-10 w-24" /> : (
              <div className="text-4xl font-bold" data-testid="text-credit-balance">{credits?.balance ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Available credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {subLoading ? <Skeleton className="h-10 w-24" /> : (
              <div className="text-4xl font-bold" data-testid="text-current-plan">{subscription?.plan || "FREE"}</div>
            )}
            {subscription?.expiresAt && (
              <p className="text-xs text-muted-foreground mt-1">Expires: {new Date(subscription.expiresAt).toLocaleDateString()}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Up Credits</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {[5, 10, 25, 50].map(amt => (
                <Button key={amt} variant={topupAmount === amt ? "default" : "outline"} size="sm"
                  onClick={() => setTopupAmount(amt)} data-testid={`button-topup-${amt}`}>
                  {amt}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label>Custom amount</Label>
                <Input type="number" min={1} value={topupAmount} onChange={(e) => setTopupAmount(Number(e.target.value))}
                  data-testid="input-topup-amount" />
              </div>
              <Button onClick={() => topupMutation.mutate(topupAmount)} disabled={topupMutation.isPending}
                data-testid="button-topup-submit">
                <ArrowUp className="h-4 w-4 mr-2" /> Top Up
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upgrade Plan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["BASIC", "PRO"].map(plan => (
              <div key={plan} className={`p-4 rounded-lg border ${subscription?.plan === plan ? "border-primary bg-primary/5" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {plan === "PRO" ? <Star className="h-4 w-4 text-primary" /> : <Zap className="h-4 w-4 text-primary" />}
                    <span className="font-medium">{plan}</span>
                  </div>
                  {subscription?.plan === plan ? (
                    <span className="text-xs text-primary font-medium">Current Plan</span>
                  ) : (
                    <Button size="sm" onClick={() => upgradeMutation.mutate(plan)}
                      disabled={upgradeMutation.isPending} data-testid={`button-upgrade-${plan.toLowerCase()}`}>
                      Upgrade
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {plan === "BASIC" ? "5 active jobs, 20 credits/month, 20 search results" :
                    "Unlimited jobs, unlimited credits, priority listing, reports"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : transactions?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions?.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`row-transaction-${tx.id}`}>
                  <div>
                    <p className="text-sm font-medium">{txTypeLabels[tx.type] || tx.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`font-medium ${tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
