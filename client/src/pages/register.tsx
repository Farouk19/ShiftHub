import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Briefcase, Building2, User } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"EMPLOYER" | "EMPLOYEE">("EMPLOYER");
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        email,
        password,
        role,
        companyName: role === "EMPLOYER" ? companyName : undefined,
        fullName: role === "EMPLOYEE" ? fullName : undefined,
      });
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Briefcase className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">ShiftHub</span>
          </div>
          <CardTitle data-testid="text-register-title">Create Account</CardTitle>
          <CardDescription>Join ShiftHub to manage shift-based work</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>I am an</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={role === "EMPLOYER" ? "default" : "outline"}
                  onClick={() => setRole("EMPLOYER")}
                  className="h-auto py-3 flex flex-col items-center gap-1"
                  data-testid="button-role-employer"
                >
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm">Employer</span>
                </Button>
                <Button
                  type="button"
                  variant={role === "EMPLOYEE" ? "default" : "outline"}
                  onClick={() => setRole("EMPLOYEE")}
                  className="h-auto py-3 flex flex-col items-center gap-1"
                  data-testid="button-role-employee"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm">Employee</span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                data-testid="input-password"
              />
            </div>
            {role === "EMPLOYER" && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  data-testid="input-company-name"
                />
              </div>
            )}
            {role === "EMPLOYEE" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  data-testid="input-full-name"
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-register">
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
