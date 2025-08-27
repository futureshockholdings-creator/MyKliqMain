import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Search, Shield, Users, Database } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const queryClient = useQueryClient();

  // Admin authentication
  const authenticateAdmin = useMutation({
    mutationFn: async (password: string) => {
      return await apiRequest("POST", "/api/admin/auth", { password });
    },
    onSuccess: () => {
      setIsAuthenticated(true);
      toast({
        title: "Admin Access Granted",
        description: "Welcome to the admin dashboard.",
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

  // Fetch all users for admin
  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch(`/api/admin/users?password=${encodeURIComponent("mykliq2025admin!")}`).then(res => res.json()),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user details
  const fetchUserDetails = useMutation({
    mutationFn: async (userId: string) => {
      return await fetch(`/api/admin/users/${userId}?password=${encodeURIComponent("mykliq2025admin!")}`).then(res => res.json());
    },
    onSuccess: (data) => {
      setSelectedUser(data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to fetch user details.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    if (!adminPassword.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter the admin password.",
        variant: "destructive",
      });
      return;
    }
    authenticateAdmin.mutate(adminPassword);
  };

  const filteredUsers = users.filter((user: any) => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber?.includes(searchTerm)
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary mx-auto" />
            </div>
            <CardTitle className="text-2xl text-primary">Admin Access</CardTitle>
            <p className="text-muted-foreground">
              Enter the admin password to access the customer service dashboard
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Admin Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="bg-input border-border text-foreground pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  data-testid="input-admin-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-admin-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={authenticateAdmin.isPending}
              data-testid="button-admin-login"
            >
              {authenticateAdmin.isPending ? "Authenticating..." : "Access Dashboard"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
              <p className="text-muted-foreground">Customer Service & User Management</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAuthenticated(false)}
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
          >
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardContent className="flex items-center p-6">
              <Shield className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u: any) => u.password).length}
                </p>
                <p className="text-muted-foreground">Users with Passwords</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardContent className="flex items-center p-6">
              <Database className="h-8 w-8 text-purple-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u: any) => u.securityPin).length}
                </p>
                <p className="text-muted-foreground">Users with Security PINs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and User Table */}
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md bg-input border-border text-foreground"
                data-testid="input-user-search"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Name</TableHead>
                    <TableHead className="text-foreground">Email</TableHead>
                    <TableHead className="text-foreground">Phone</TableHead>
                    <TableHead className="text-foreground">Kliq Name</TableHead>
                    <TableHead className="text-foreground">Security Status</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-foreground">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.phoneNumber || "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.kliqName || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.password && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                              Password
                            </span>
                          )}
                          {user.securityPin && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                              PIN
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchUserDetails.mutate(user.id)}
                              className="border-border text-foreground hover:bg-muted"
                              data-testid={`button-view-user-${user.id}`}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-card border-border max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-primary">User Details</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="space-y-4">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-foreground">Full Name</Label>
                                    <p className="text-muted-foreground">{selectedUser.firstName} {selectedUser.lastName}</p>
                                  </div>
                                  <div>
                                    <Label className="text-foreground">Email</Label>
                                    <p className="text-muted-foreground">{selectedUser.email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-foreground">Phone Number</Label>
                                    <p className="text-muted-foreground">{selectedUser.phoneNumber || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <Label className="text-foreground">Kliq Name</Label>
                                    <p className="text-muted-foreground">{selectedUser.kliqName || "Not set"}</p>
                                  </div>
                                </div>

                                {/* Security Information */}
                                <div className="border-t pt-4">
                                  <h3 className="font-semibold text-foreground mb-3">Security Information</h3>
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-foreground">Password</Label>
                                      <p className="text-muted-foreground font-mono bg-muted p-2 rounded">
                                        {selectedUser.password || "No password set"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-foreground">Security PIN</Label>
                                      <p className="text-muted-foreground font-mono bg-muted p-2 rounded">
                                        {selectedUser.securityPin || "No PIN set"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-foreground">Security Answer 1 (First car)</Label>
                                      <p className="text-muted-foreground font-mono bg-muted p-2 rounded">
                                        {selectedUser.securityAnswer1 || "Not answered"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-foreground">Security Answer 2 (Mother's maiden name)</Label>
                                      <p className="text-muted-foreground font-mono bg-muted p-2 rounded">
                                        {selectedUser.securityAnswer2 || "Not answered"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-foreground">Security Answer 3 (Favorite teacher's last name)</Label>
                                      <p className="text-muted-foreground font-mono bg-muted p-2 rounded">
                                        {selectedUser.securityAnswer3 || "Not answered"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Profile Information */}
                                <div className="border-t pt-4">
                                  <h3 className="font-semibold text-foreground mb-3">Profile Information</h3>
                                  <div className="space-y-2">
                                    <div>
                                      <Label className="text-foreground">Bio</Label>
                                      <p className="text-muted-foreground">{selectedUser.bio || "No bio set"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-foreground">Birthdate</Label>
                                      <p className="text-muted-foreground">{selectedUser.birthdate || "Not provided"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-foreground">Member Since</Label>
                                      <p className="text-muted-foreground">
                                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "Unknown"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}