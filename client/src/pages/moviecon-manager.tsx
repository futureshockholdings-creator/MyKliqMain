import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MovieconUploader } from "@/components/MovieconUploader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Moviecon {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
}

export function MovieconManagerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const authenticateAdmin = useMutation({
    mutationFn: async (password: string) => {
      return await apiRequest("POST", "/api/admin/auth", { password });
    },
    onSuccess: () => {
      setIsAuthenticated(true);
      toast({
        title: "Admin Access Granted",
        description: "Welcome to the Moviecon Manager.",
      });
    },
    onError: () => {
      toast({
        title: "Access Denied",
        description: "Invalid admin password.",
        variant: "destructive",
      });
    },
  });

  const { data: moviecons = [], refetch } = useQuery<Moviecon[]>({
    queryKey: ["/api/moviecons"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Moviecon Manager Access</CardTitle>
            <CardDescription>
              Enter the admin password to access the moviecon library manager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                authenticateAdmin.mutate(adminPassword);
              }}
              className="space-y-4"
            >
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={authenticateAdmin.isPending || !adminPassword}
              >
                {authenticateAdmin.isPending ? "Authenticating..." : "Access Moviecon Manager"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="moviecon-manager-page">
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Moviecon Manager
            </h1>
            <p className="text-muted-foreground">
              Upload and manage your video clips (moviecons) that users can add to their posts
            </p>
          </div>

          <MovieconUploader 
            moviecons={moviecons} 
            onRefresh={() => refetch()}
            adminPassword={adminPassword}
          />
        </div>
      </div>
    </div>
  );
}