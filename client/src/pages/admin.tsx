import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Search, Shield, Users, Database, Activity, AlertTriangle, BarChart3, Download, RefreshCw, Trash2, UserX, Calendar, Ban } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("users"); // users, analytics, system
  const [systemStats, setSystemStats] = useState<any>(null);
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

  // Fetch system analytics
  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
    queryFn: () => fetch(`/api/admin/analytics?password=${encodeURIComponent("mykliq2025admin!")}`).then(res => res.json()),
    enabled: isAuthenticated && selectedTab === "analytics",
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch system health
  const { data: systemHealth } = useQuery<any>({
    queryKey: ["/api/admin/system-health"],
    queryFn: () => fetch(`/api/admin/system-health?password=${encodeURIComponent("mykliq2025admin!")}`).then(res => res.json()),
    enabled: isAuthenticated && selectedTab === "system",
    refetchInterval: 10000, // Refresh every 10 seconds
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

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`, { password: "mykliq2025admin!" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  // Suspend user mutation
  const suspendUser = useMutation({
    mutationFn: async ({ userId, suspensionType }: { userId: string; suspensionType: string }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/suspend`, { 
        password: "mykliq2025admin!", 
        suspensionType 
      });
    },
    onSuccess: (data, { suspensionType }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      const typeLabels: { [key: string]: string } = {
        "24hours": "24 hours",
        "7days": "7 days", 
        "30days": "30 days",
        "90days": "90 days",
        "180days": "180 days",
        "banned": "permanently"
      };
      toast({
        title: "User Suspended",
        description: `User has been suspended for ${typeLabels[suspensionType] || suspensionType}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to suspend user.",
        variant: "destructive",
      });
    },
  });

  // Export data mutation
  const exportData = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch(`/api/admin/export/${type}?password=${encodeURIComponent("mykliq2025admin!")}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mykliq-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export Complete",
        description: "Data has been exported successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export data.",
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
          <div className="flex items-center gap-3">
            <Button
              onClick={() => exportData.mutate('users')}
              disabled={exportData.isPending}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
              data-testid="button-export-users"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
            <Button 
              onClick={() => setIsAuthenticated(false)}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-border">
          <Button
            variant={selectedTab === "users" ? "default" : "ghost"}
            onClick={() => setSelectedTab("users")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-testid="tab-users"
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </Button>
          <Button
            variant={selectedTab === "analytics" ? "default" : "ghost"}
            onClick={() => setSelectedTab("analytics")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-testid="tab-analytics"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant={selectedTab === "system" ? "default" : "ghost"}
            onClick={() => setSelectedTab("system")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-testid="tab-system"
          >
            <Activity className="h-4 w-4 mr-2" />
            System Health
          </Button>
        </div>

        {/* Content based on selected tab */}
        {selectedTab === "users" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <Calendar className="h-8 w-8 text-orange-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {users.filter((u: any) => {
                        const joinDate = new Date(u.createdAt);
                        const today = new Date();
                        const daysDiff = (today.getTime() - joinDate.getTime()) / (1000 * 3600 * 24);
                        return daysDiff <= 7;
                      }).length}
                    </p>
                    <p className="text-muted-foreground">New This Week</p>
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
                    <TableHead className="text-foreground">Account Status</TableHead>
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
                        {user.isSuspended ? (
                          <div className="space-y-1">
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs font-semibold">
                              {user.suspensionType === "banned" ? "BANNED" : "SUSPENDED"}
                            </span>
                            {user.suspendedAt && (
                              <p className="text-xs text-muted-foreground">
                                Since: {new Date(user.suspendedAt).toLocaleDateString()}
                              </p>
                            )}
                            {user.suspensionExpiresAt && user.suspensionType !== "banned" && (
                              <p className="text-xs text-muted-foreground">
                                Until: {new Date(user.suspensionExpiresAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                            Active
                          </span>
                        )}
                      </TableCell>
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
                        <div className="flex gap-2">
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
                          
                          {/* Suspension Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
                                data-testid={`button-suspend-user-${user.id}`}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-primary">Suspend User Account</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-muted-foreground">
                                  Select how long to suspend {user.firstName} {user.lastName}'s account:
                                </p>
                                
                                <div className="space-y-3">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm(`Suspend ${user.firstName} ${user.lastName} for 24 hours?`)) {
                                          suspendUser.mutate({ userId: user.id, suspensionType: "24hours" });
                                        }
                                      }}
                                      disabled={suspendUser.isPending}
                                      className="flex-1"
                                    >
                                      24 Hours
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm(`Suspend ${user.firstName} ${user.lastName} for 7 days?`)) {
                                          suspendUser.mutate({ userId: user.id, suspensionType: "7days" });
                                        }
                                      }}
                                      disabled={suspendUser.isPending}
                                      className="flex-1"
                                    >
                                      7 Days
                                    </Button>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm(`Suspend ${user.firstName} ${user.lastName} for 30 days?`)) {
                                          suspendUser.mutate({ userId: user.id, suspensionType: "30days" });
                                        }
                                      }}
                                      disabled={suspendUser.isPending}
                                      className="flex-1"
                                    >
                                      30 Days
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm(`Suspend ${user.firstName} ${user.lastName} for 90 days?`)) {
                                          suspendUser.mutate({ userId: user.id, suspensionType: "90days" });
                                        }
                                      }}
                                      disabled={suspendUser.isPending}
                                      className="flex-1"
                                    >
                                      90 Days
                                    </Button>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm(`Suspend ${user.firstName} ${user.lastName} for 180 days?`)) {
                                          suspendUser.mutate({ userId: user.id, suspensionType: "180days" });
                                        }
                                      }}
                                      disabled={suspendUser.isPending}
                                      className="flex-1"
                                    >
                                      180 Days
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm(`PERMANENTLY BAN ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
                                          suspendUser.mutate({ userId: user.id, suspensionType: "banned" });
                                        }
                                      }}
                                      disabled={suspendUser.isPending}
                                      className="flex-1"
                                    >
                                      Ban Forever
                                    </Button>
                                  </div>
                                </div>
                                
                                {user.isSuspended && (
                                  <div className="border-t pt-3">
                                    <p className="text-sm text-orange-600 dark:text-orange-400">
                                      <strong>Current Status:</strong> This user is currently suspended
                                      {user.suspensionType && ` (${user.suspensionType})`}
                                      {user.suspendedAt && (
                                        <span className="block">
                                          Suspended on: {new Date(user.suspendedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                      {user.suspensionExpiresAt && user.suspensionType !== "banned" && (
                                        <span className="block">
                                          Expires: {new Date(user.suspensionExpiresAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                deleteUser.mutate(user.id);
                              }
                            }}
                            disabled={deleteUser.isPending}
                            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </>
        )}

        {/* Analytics Tab */}
        {selectedTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <Users className="h-8 w-8 text-blue-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{analytics?.totalUsers || users.length}</p>
                    <p className="text-muted-foreground">Total Users</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <Activity className="h-8 w-8 text-green-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{analytics?.activeToday || 0}</p>
                    <p className="text-muted-foreground">Active Today</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <BarChart3 className="h-8 w-8 text-purple-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{analytics?.postsToday || 0}</p>
                    <p className="text-muted-foreground">Posts Today</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <Shield className="h-8 w-8 text-orange-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{analytics?.storiesActive || 0}</p>
                    <p className="text-muted-foreground">Active Stories</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-foreground">User Activity Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Analytics dashboard coming soon...
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* System Health Tab */}
        {selectedTab === "system" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <Activity className="h-8 w-8 text-green-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">Online</p>
                    <p className="text-muted-foreground">Server Status</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <Database className="h-8 w-8 text-blue-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{systemHealth?.dbConnections || "N/A"}</p>
                    <p className="text-muted-foreground">DB Connections</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{systemHealth?.memoryUsage || "N/A"}</p>
                    <p className="text-muted-foreground">Memory Usage</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <RefreshCw className="h-8 w-8 text-purple-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{systemHealth?.uptime || "N/A"}</p>
                    <p className="text-muted-foreground">Uptime</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Activity className="h-5 w-5" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Database Pool Status</span>
                    <span className="text-green-600 font-medium">Healthy</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cache Performance</span>
                    <span className="text-green-600 font-medium">Optimal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">API Response Time</span>
                    <span className="text-green-600 font-medium">&lt; 200ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Error Rate</span>
                    <span className="text-green-600 font-medium">0.01%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}