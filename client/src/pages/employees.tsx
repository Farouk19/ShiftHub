import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, MapPin, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeesPage() {
  const { token } = useAuth();
  const [location, setLocation] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/search/employees", searchLocation],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchLocation) params.set("location", searchLocation);
      const res = await fetch(`/api/search/employees?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!token,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLocation(location);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-employees-title">Search Employees</h1>
        <p className="text-muted-foreground">Find available workers for your shifts</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1">
          <Input placeholder="Filter by location..." value={location}
            onChange={(e) => setLocation(e.target.value)} data-testid="input-search-location" />
        </div>
        <Button type="submit" data-testid="button-search">
          <Search className="h-4 w-4 mr-2" /> Search
        </Button>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : data?.employees?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No employees found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{data?.total || 0} employees found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.employees?.map((emp: any) => (
              <Card key={emp.id} data-testid={`card-employee-${emp.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{emp.fullName}</p>
                      {emp.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {emp.location}
                        </p>
                      )}
                      {emp.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {emp.skills.map((skill: string) => (
                            <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-muted">{skill}</span>
                          ))}
                        </div>
                      )}
                      {emp.phone && <p className="text-xs text-muted-foreground mt-1">{emp.phone}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
