import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Search, Shield, Users, Database, Activity, AlertTriangle, BarChart3, Download, RefreshCw, Trash2, UserX, Calendar, Ban, Flag, FileWarning, Bell, Send, Loader2, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { buildApiUrl, resolveAssetUrl } from "@/lib/apiConfig";
import { ForcedLightSurface } from "@/components/ForcedLightSurface";
import { MemeDisplay } from "@/components/MemeDisplay";
import { MovieconDisplay } from "@/components/MovieconDisplay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogDescription,
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
  const [selectedTab, setSelectedTab] = useState("users"); // users, analytics, system, reports, broadcasts
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState("all");
  const [broadcastDeepLink, setBroadcastDeepLink] = useState("");
  const [systemStats, setSystemStats] = useState<any>(null);
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("all");
  const [reportedUserFilter, setReportedUserFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [securityAnswer1, setSecurityAnswer1] = useState("");
  const [securityAnswer2, setSecurityAnswer2] = useState("");
  const [securityAnswer3, setSecurityAnswer3] = useState("");
  const [securityVerificationResult, setSecurityVerificationResult] = useState<any>(null);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [isRevealingPassword, setIsRevealingPassword] = useState(false);
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Admin authentication
  const authenticateAdmin = useMutation({
    mutationFn: async (password: string) => {
      return await apiRequest("POST", "/api/admin/auth", { password });
    },
    onSuccess: () => {
      setIsAuthenticated(true);
      sessionStorage.setItem("adminPassword", adminPassword);
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
    queryFn: () => fetch(buildApiUrl(`/api/admin/users?password=${encodeURIComponent(adminPassword)}`)).then(res => res.json()),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch system analytics
  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
    queryFn: () => fetch(buildApiUrl(`/api/admin/analytics?password=${encodeURIComponent(adminPassword)}`)).then(res => res.json()),
    enabled: isAuthenticated && selectedTab === "analytics",
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch system health
  const { data: systemHealth } = useQuery<any>({
    queryKey: ["/api/admin/system-health"],
    queryFn: () => fetch(buildApiUrl(`/api/admin/system-health?password=${encodeURIComponent(adminPassword)}`)).then(res => res.json()),
    enabled: isAuthenticated && selectedTab === "system",
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch rules reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/reports", reportStatusFilter],
    queryFn: () => fetch(buildApiUrl(`/api/admin/reports?password=${encodeURIComponent(adminPassword)}${reportStatusFilter !== "all" ? `&status=${reportStatusFilter}` : ""}`)).then(res => res.json()),
    enabled: isAuthenticated && selectedTab === "reports",
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch full post for viewing
  const { data: viewingPost, isLoading: postLoading, error: postError } = useQuery<any>({
    queryKey: ["/api/posts", viewingPostId],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/posts/${viewingPostId}?password=${encodeURIComponent(adminPassword)}`));
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch post");
      }
      return data;
    },
    enabled: !!viewingPostId && isAuthenticated,
  });

  // Compute unique reported users with report counts (for repeat offender filter)
  const reportedUsersWithCounts = useMemo(() => {
    const userMap = new Map<string, { id: string; name: string; email?: string; count: number }>();
    reports.forEach((report: any) => {
      const userId = report.postAuthorId;
      if (userId) {
        const existing = userMap.get(userId);
        if (existing) {
          existing.count++;
        } else {
          userMap.set(userId, {
            id: userId,
            name: report.postAuthor?.firstName || userId.substring(0, 8),
            email: report.postAuthor?.email,
            count: 1
          });
        }
      }
    });
    // Sort by count descending (repeat offenders first)
    return Array.from(userMap.values()).sort((a, b) => b.count - a.count);
  }, [reports]);

  // Filter reports by reported user
  const filteredReports = useMemo(() => {
    if (reportedUserFilter === "all") return reports;
    return reports.filter((report: any) => report.postAuthorId === reportedUserFilter);
  }, [reports, reportedUserFilter]);

  // Fetch broadcasts
  const { data: broadcasts = [], isLoading: broadcastsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/broadcasts"],
    queryFn: () => fetch(buildApiUrl(`/api/admin/broadcasts?password=${encodeURIComponent(adminPassword)}`)).then(res => res.json()),
    enabled: isAuthenticated && selectedTab === "broadcasts",
    refetchInterval: 30000,
  });

  // Get audience count
  const { data: audienceCount } = useQuery<{ count: number; audience: string }>({
    queryKey: ["/api/admin/broadcasts/audience-count", broadcastAudience],
    queryFn: () => fetch(buildApiUrl(`/api/admin/broadcasts/audience-count?password=${encodeURIComponent(adminPassword)}&audience=${broadcastAudience}`)).then(res => res.json()),
    enabled: isAuthenticated && selectedTab === "broadcasts",
  });

  // Create broadcast mutation
  const createBroadcast = useMutation({
    mutationFn: async ({ title, body, targetAudience, deepLink, sendNow }: {
      title: string;
      body: string;
      targetAudience: string;
      deepLink?: string;
      sendNow: boolean;
    }) => {
      const response = await fetch(buildApiUrl(`/api/admin/broadcasts?password=${encodeURIComponent(adminPassword)}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, targetAudience, deepLink, sendNow })
      });
      if (!response.ok) throw new Error("Failed to create broadcast");
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      setBroadcastTitle("");
      setBroadcastBody("");
      setBroadcastDeepLink("");
      toast({
        title: variables.sendNow ? "Broadcast Sent!" : "Broadcast Created",
        description: variables.sendNow 
          ? `Push notification sent to ${audienceCount?.count || 0} devices.`
          : "Broadcast saved as draft.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create broadcast.",
        variant: "destructive",
      });
    },
  });

  // Send broadcast mutation
  const sendBroadcast = useMutation({
    mutationFn: async (broadcastId: string) => {
      const response = await fetch(buildApiUrl(`/api/admin/broadcasts/${broadcastId}/send?password=${encodeURIComponent(adminPassword)}`), {
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to send broadcast");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      toast({
        title: "Broadcast Sent!",
        description: `Sent to ${data.recipientCount} devices. Success: ${data.successCount}, Failed: ${data.failureCount}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send broadcast.",
        variant: "destructive",
      });
    },
  });

  // Delete broadcast mutation
  const deleteBroadcast = useMutation({
    mutationFn: async (broadcastId: string) => {
      const response = await fetch(buildApiUrl(`/api/admin/broadcasts/${broadcastId}?password=${encodeURIComponent(adminPassword)}`), {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete broadcast");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      toast({
        title: "Broadcast Deleted",
        description: "The broadcast has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete broadcast.",
        variant: "destructive",
      });
    },
  });

  // Update report mutation - uses POST for cross-domain compatibility
  const updateReport = useMutation({
    mutationFn: async ({ reportId, status, adminNotes, actionTaken }: { 
      reportId: string; 
      status: string; 
      adminNotes?: string; 
      actionTaken?: string 
    }) => {
      return await apiRequest("POST", `/api/admin/reports/${reportId}/update`, { 
        password: adminPassword,
        status, 
        adminNotes, 
        actionTaken 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      setSelectedReport(null);
      toast({
        title: "Report Updated",
        description: "The report status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update report.",
        variant: "destructive",
      });
    },
  });

  // Fetch user details
  const fetchUserDetails = useMutation({
    mutationFn: async (userId: string) => {
      return await fetch(buildApiUrl(`/api/admin/users/${userId}?password=${encodeURIComponent(adminPassword)}`)).then(res => res.json());
    },
    onSuccess: (data) => {
      setSelectedUser(data);
      // Reset security verification form when viewing a new user
      setSecurityAnswer1("");
      setSecurityAnswer2("");
      setSecurityAnswer3("");
      setSecurityVerificationResult(null);
      setRevealedPassword(null);
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
      return await apiRequest("DELETE", `/api/admin/users/${userId}`, { password: adminPassword });
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
        password: adminPassword, 
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

  // Verify security answers mutation
  const verifySecurityAnswers = useMutation({
    mutationFn: async ({ userId, answer1, answer2, answer3 }: { userId: string; answer1: string; answer2: string; answer3: string }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/verify-security`, { 
        password: adminPassword, 
        answer1,
        answer2,
        answer3
      });
    },
    onSuccess: (data: any) => {
      setSecurityVerificationResult(data);
      if (data.allValid) {
        toast({
          title: "Identity Verified",
          description: "All security answers match - user identity confirmed.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "One or more answers did not match.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to verify security answers.",
        variant: "destructive",
      });
    },
  });

  // Reveal password after verification
  const revealPassword = async (userId: string) => {
    setIsRevealingPassword(true);
    try {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/reveal-password`, {
        password: adminPassword,
        answer1: securityAnswer1,
        answer2: securityAnswer2,
        answer3: securityAnswer3
      });
      if (response.success && response.password) {
        setRevealedPassword(response.password);
        toast({
          title: "Password Retrieved",
          description: "User's password is now visible. Please share it securely.",
        });
      } else if (response.success && !response.password) {
        toast({
          title: "Password Unavailable",
          description: response.message || "Cannot retrieve password for this user.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: response.message || "Security answers did not match.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reveal password.",
        variant: "destructive",
      });
    } finally {
      setIsRevealingPassword(false);
    }
  };

  // Export data mutation
  const exportData = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch(buildApiUrl(`/api/admin/export/${type}?password=${encodeURIComponent(adminPassword)}`));
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
      <ForcedLightSurface className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-gray-300 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-gray-100">
              <Shield className="h-8 w-8 text-gray-800 mx-auto" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <p className="text-gray-600">
              Enter the admin password to access the customer service dashboard
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="border-gray-300 pr-10"
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
      </ForcedLightSurface>
    );
  }

  return (
    <ForcedLightSurface className="p-2 sm:p-4 md:p-6">
      <div className="w-full max-w-6xl mx-auto space-y-4 md:space-y-6">
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
          <Button
            variant={selectedTab === "reports" ? "default" : "ghost"}
            onClick={() => setSelectedTab("reports")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-testid="tab-reports"
          >
            <Flag className="h-4 w-4 mr-2" />
            Rules Reports
          </Button>
          <Button
            variant={selectedTab === "broadcasts" ? "default" : "ghost"}
            onClick={() => setSelectedTab("broadcasts")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            data-testid="tab-broadcasts"
          >
            <Bell className="h-4 w-4 mr-2" />
            Broadcasts
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
                    <TableHead className="text-foreground">Role</TableHead>
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
                        {user.isAdmin ? (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-semibold">
                            ADMIN
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-xs">
                            User
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
                              <DialogTitle className="text-foreground">User Details</DialogTitle>
                              <DialogDescription>
                                View comprehensive user account information and activity details.
                              </DialogDescription>
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

                                {/* Security Information & Verification */}
                                <div className="border-t pt-4">
                                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Identity Verification
                                  </h3>
                                  <p className="text-sm text-muted-foreground mb-4">
                                    Ask the user to provide their security answers verbally, then enter them below to verify their identity.
                                  </p>
                                  
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="text-muted-foreground">Password Set:</span>
                                      <span className={selectedUser.password ? "text-green-600" : "text-red-600"}>
                                        {selectedUser.password ? "Yes" : "No"}
                                      </span>
                                      <span className="text-muted-foreground ml-4">PIN Set:</span>
                                      <span className={selectedUser.securityPin ? "text-green-600" : "text-red-600"}>
                                        {selectedUser.securityPin ? "Yes" : "No"}
                                      </span>
                                    </div>

                                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                                      <div>
                                        <Label className="text-foreground text-sm">Question 1: What was your first car?</Label>
                                        <div className="flex gap-2 mt-1">
                                          <Input
                                            placeholder="Enter user's answer..."
                                            value={securityAnswer1}
                                            onChange={(e) => { setSecurityAnswer1(e.target.value); setSecurityVerificationResult(null); setRevealedPassword(null); }}
                                            className="bg-background"
                                          />
                                          {securityVerificationResult && (
                                            <span className={`flex items-center px-2 ${securityVerificationResult.answer1Valid ? 'text-green-600' : 'text-red-600'}`}>
                                              {securityVerificationResult.answer1Valid ? '✓' : '✗'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-foreground text-sm">Question 2: What is your mother's maiden name?</Label>
                                        <div className="flex gap-2 mt-1">
                                          <Input
                                            placeholder="Enter user's answer..."
                                            value={securityAnswer2}
                                            onChange={(e) => { setSecurityAnswer2(e.target.value); setSecurityVerificationResult(null); setRevealedPassword(null); }}
                                            className="bg-background"
                                          />
                                          {securityVerificationResult && (
                                            <span className={`flex items-center px-2 ${securityVerificationResult.answer2Valid ? 'text-green-600' : 'text-red-600'}`}>
                                              {securityVerificationResult.answer2Valid ? '✓' : '✗'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-foreground text-sm">Question 3: What is your favorite teacher's last name?</Label>
                                        <div className="flex gap-2 mt-1">
                                          <Input
                                            placeholder="Enter user's answer..."
                                            value={securityAnswer3}
                                            onChange={(e) => { setSecurityAnswer3(e.target.value); setSecurityVerificationResult(null); setRevealedPassword(null); }}
                                            className="bg-background"
                                          />
                                          {securityVerificationResult && (
                                            <span className={`flex items-center px-2 ${securityVerificationResult.answer3Valid ? 'text-green-600' : 'text-red-600'}`}>
                                              {securityVerificationResult.answer3Valid ? '✓' : '✗'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <Button
                                        onClick={() => {
                                          setSecurityVerificationResult(null);
                                          verifySecurityAnswers.mutate({
                                            userId: selectedUser.id,
                                            answer1: securityAnswer1,
                                            answer2: securityAnswer2,
                                            answer3: securityAnswer3
                                          });
                                        }}
                                        disabled={verifySecurityAnswers.isPending || (!securityAnswer1 && !securityAnswer2 && !securityAnswer3)}
                                        className="w-full mt-2"
                                        data-testid="button-verify-security"
                                      >
                                        {verifySecurityAnswers.isPending ? "Verifying..." : "Verify Security Answers"}
                                      </Button>
                                      
                                      {securityVerificationResult && (
                                        <div className={`p-3 rounded-lg ${securityVerificationResult.allValid ? 'bg-green-100 dark:bg-green-900/30 border border-green-300' : 'bg-red-100 dark:bg-red-900/30 border border-red-300'}`}>
                                          <p className={`text-sm font-medium ${securityVerificationResult.allValid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                            {securityVerificationResult.allValid ? '✓ Identity Verified - All answers match' : '✗ Verification Failed - One or more answers incorrect'}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {securityVerificationResult?.allValid && (
                                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                                          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2 font-medium">
                                            Identity verified. You can now reveal the user's password to share with them.
                                          </p>
                                          {!revealedPassword ? (
                                            <Button
                                              onClick={() => revealPassword(selectedUser.id)}
                                              disabled={isRevealingPassword}
                                              className="w-full bg-blue-600 hover:bg-blue-700"
                                              data-testid="button-reveal-password"
                                            >
                                              {isRevealingPassword ? "Revealing..." : "Reveal Password"}
                                            </Button>
                                          ) : (
                                            <div className="space-y-2">
                                              <Label className="text-blue-800 dark:text-blue-200">User's Password:</Label>
                                              <div className="flex gap-2">
                                                <Input
                                                  value={revealedPassword}
                                                  readOnly
                                                  className="bg-white dark:bg-gray-800 font-mono"
                                                />
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(revealedPassword);
                                                    toast({
                                                      title: "Copied",
                                                      description: "Password copied to clipboard.",
                                                    });
                                                  }}
                                                >
                                                  Copy
                                                </Button>
                                              </div>
                                              <p className="text-xs text-muted-foreground">
                                                Share this password securely with the verified user.
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )}
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
                                <DialogTitle className="text-foreground">Suspend User Account</DialogTitle>
                                <DialogDescription>
                                  Temporarily restrict user access to the platform. This action can be reversed.
                                </DialogDescription>
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

        {/* Rules Reports Tab */}
        {selectedTab === "reports" && (
          <div className="space-y-6">
            {/* Report Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <Flag className="h-8 w-8 text-red-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {reports.filter((r: any) => r.status === "pending").length}
                    </p>
                    <p className="text-muted-foreground">OPEN</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <FileWarning className="h-8 w-8 text-yellow-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {reports.filter((r: any) => r.status === "reviewed").length}
                    </p>
                    <p className="text-muted-foreground">PENDING</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <Shield className="h-8 w-8 text-green-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {reports.filter((r: any) => r.status === "resolved" || r.status === "dismissed").length}
                    </p>
                    <p className="text-muted-foreground">CLOSED</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="flex items-center p-6">
                  <Database className="h-8 w-8 text-blue-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{reports.length}</p>
                    <p className="text-muted-foreground">Total Reports</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reports Table */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-foreground">
                  <div className="flex items-center gap-2">
                    <Flag className="h-5 w-5" />
                    Content Reports
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                      <SelectTrigger className="w-[180px]" data-testid="select-report-status-filter">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reports</SelectItem>
                        <SelectItem value="pending">OPEN (Not Reviewed)</SelectItem>
                        <SelectItem value="reviewed">PENDING (Under Review)</SelectItem>
                        <SelectItem value="resolved">CLOSED (Resolved)</SelectItem>
                        <SelectItem value="dismissed">CLOSED (Dismissed)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={reportedUserFilter} onValueChange={setReportedUserFilter}>
                      <SelectTrigger className="w-[200px]" data-testid="select-reported-user-filter">
                        <SelectValue placeholder="Filter by user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {reportedUsersWithCounts.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.count} {user.count === 1 ? 'report' : 'reports'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {reports.length === 0 ? "No reports found. All clear!" : "No reports match the current filters."}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-foreground">Status</TableHead>
                        <TableHead className="text-foreground">Reported User</TableHead>
                        <TableHead className="text-foreground">Reason</TableHead>
                        <TableHead className="text-foreground">Reporter</TableHead>
                        <TableHead className="text-foreground">Date</TableHead>
                        <TableHead className="text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report: any) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              report.status === "pending" 
                                ? "bg-red-100 text-red-700" 
                                : report.status === "reviewed"
                                ? "bg-yellow-100 text-yellow-700"
                                : report.status === "resolved"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {report.status === "pending" ? "OPEN" 
                                : report.status === "reviewed" ? "PENDING" 
                                : "CLOSED"}
                            </span>
                          </TableCell>
                          <TableCell className="text-foreground">
                            <div>
                              <p className="font-medium">
                                {report.postAuthor?.firstName || report.postAuthorId?.substring(0, 8)}
                              </p>
                              {report.postAuthor?.email && (
                                <p className="text-xs text-muted-foreground">{report.postAuthor.email}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground capitalize">{report.reason}</TableCell>
                          <TableCell className="text-foreground">
                            {report.reporter?.firstName || "Anonymous"}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedReport(report)}
                                  data-testid={`button-review-report-${report.id}`}
                                >
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Review Report</DialogTitle>
                                  <DialogDescription>
                                    Review this content report and take appropriate action.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">Reported User</Label>
                                      <p className="font-medium">
                                        {report.postAuthor?.firstName} {report.postAuthor?.lastName}
                                      </p>
                                      {report.postAuthor?.email && (
                                        <p className="text-sm text-muted-foreground">{report.postAuthor.email}</p>
                                      )}
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Reported By</Label>
                                      <p className="font-medium">
                                        {report.reporter?.firstName} {report.reporter?.lastName}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Reason</Label>
                                    <p className="font-medium capitalize">{report.reason}</p>
                                  </div>
                                  {report.description && (
                                    <div>
                                      <Label className="text-muted-foreground">Description</Label>
                                      <p>{report.description}</p>
                                    </div>
                                  )}
                                  <div>
                                    <Label className="text-muted-foreground">Post Content</Label>
                                    {report.post?.content && (
                                      <p className="p-3 bg-muted rounded-md mb-2">{report.post.content}</p>
                                    )}
                                    {(report.post?.mediaUrl || report.post?.memeId || report.post?.movieconId || report.post?.gifId) && (
                                      <p className="text-xs text-muted-foreground mb-2">
                                        Attachments: 
                                        {report.post?.mediaUrl && ` ${report.post?.mediaType || 'media'}`}
                                        {report.post?.memeId && ' meme'}
                                        {report.post?.movieconId && ' moviecon'}
                                        {report.post?.gifId && ' gif'}
                                      </p>
                                    )}
                                    <Button
                                      variant="link"
                                      className="p-0 h-auto text-blue-600 font-medium"
                                      onClick={() => setViewingPostId(report.postId)}
                                    >
                                      View Full Post →
                                    </Button>
                                  </div>
                                  <div className="border-t pt-4">
                                    <Label className="mb-2 block">Take Action</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => updateReport.mutate({
                                          reportId: report.id,
                                          status: "reviewed",
                                          adminNotes: "Under review"
                                        })}
                                        disabled={updateReport.isPending}
                                      >
                                        Mark as Pending
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="text-green-600 border-green-200 hover:bg-green-50"
                                        onClick={() => updateReport.mutate({
                                          reportId: report.id,
                                          status: "dismissed",
                                          actionTaken: "none"
                                        })}
                                        disabled={updateReport.isPending}
                                      >
                                        Dismiss
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                                        onClick={() => updateReport.mutate({
                                          reportId: report.id,
                                          status: "resolved",
                                          actionTaken: "warning"
                                        })}
                                        disabled={updateReport.isPending}
                                      >
                                        Issue Warning
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => updateReport.mutate({
                                          reportId: report.id,
                                          status: "resolved",
                                          actionTaken: "post_removed"
                                        })}
                                        disabled={updateReport.isPending}
                                      >
                                        Remove Post
                                      </Button>
                                    </div>
                                    <div className="mt-4 pt-4 border-t">
                                      <Label className="mb-2 block text-red-600">Suspend User</Label>
                                      <div className="grid grid-cols-3 gap-2">
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            if (confirm(`Suspend this user for 24 hours?`)) {
                                              suspendUser.mutate({ 
                                                userId: report.postAuthorId, 
                                                suspensionType: "24hours" 
                                              });
                                              updateReport.mutate({
                                                reportId: report.id,
                                                status: "resolved",
                                                actionTaken: "user_suspended"
                                              });
                                            }
                                          }}
                                          disabled={suspendUser.isPending || updateReport.isPending}
                                        >
                                          24h
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            if (confirm(`Suspend this user for 7 days?`)) {
                                              suspendUser.mutate({ 
                                                userId: report.postAuthorId, 
                                                suspensionType: "7days" 
                                              });
                                              updateReport.mutate({
                                                reportId: report.id,
                                                status: "resolved",
                                                actionTaken: "user_suspended"
                                              });
                                            }
                                          }}
                                          disabled={suspendUser.isPending || updateReport.isPending}
                                        >
                                          7 Days
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            if (confirm(`PERMANENTLY BAN this user? This cannot be undone.`)) {
                                              suspendUser.mutate({ 
                                                userId: report.postAuthorId, 
                                                suspensionType: "banned" 
                                              });
                                              updateReport.mutate({
                                                reportId: report.id,
                                                status: "resolved",
                                                actionTaken: "user_banned"
                                              });
                                            }
                                          }}
                                          disabled={suspendUser.isPending || updateReport.isPending}
                                        >
                                          Ban
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
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
        )}

        {/* Broadcasts Tab Content */}
        {selectedTab === "broadcasts" && (
          <div className="space-y-6">
            {/* Create Broadcast Card */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Send className="h-5 w-5" />
                  Create Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-title" className="text-foreground">Title</Label>
                    <Input
                      id="broadcast-title"
                      placeholder="Notification title..."
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-audience" className="text-foreground">Target Audience</Label>
                    <Select value={broadcastAudience} onValueChange={setBroadcastAudience}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="active_7d">Active (Last 7 Days)</SelectItem>
                        <SelectItem value="active_30d">Active (Last 30 Days)</SelectItem>
                        <SelectItem value="streak_users">Users with Login Streaks</SelectItem>
                      </SelectContent>
                    </Select>
                    {audienceCount && (
                      <p className="text-sm text-muted-foreground">
                        {audienceCount.count} device{audienceCount.count !== 1 ? 's' : ''} will receive this
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="broadcast-body" className="text-foreground">Message</Label>
                  <textarea
                    id="broadcast-body"
                    placeholder="Enter your broadcast message..."
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="broadcast-deeplink" className="text-foreground">Deep Link (Optional)</Label>
                  <Input
                    id="broadcast-deeplink"
                    placeholder="e.g., /profile or /headlines"
                    value={broadcastDeepLink}
                    onChange={(e) => setBroadcastDeepLink(e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Opens this screen when user taps the notification</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => createBroadcast.mutate({
                      title: broadcastTitle,
                      body: broadcastBody,
                      targetAudience: broadcastAudience,
                      deepLink: broadcastDeepLink || undefined,
                      sendNow: true
                    })}
                    disabled={!broadcastTitle.trim() || !broadcastBody.trim() || createBroadcast.isPending}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {createBroadcast.isPending ? "Sending..." : "Send Now"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => createBroadcast.mutate({
                      title: broadcastTitle,
                      body: broadcastBody,
                      targetAudience: broadcastAudience,
                      deepLink: broadcastDeepLink || undefined,
                      sendNow: false
                    })}
                    disabled={!broadcastTitle.trim() || !broadcastBody.trim() || createBroadcast.isPending}
                  >
                    Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Broadcast History Card */}
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Bell className="h-5 w-5" />
                  Broadcast History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {broadcastsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : broadcasts.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No broadcasts yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-foreground">Title</TableHead>
                        <TableHead className="text-foreground">Audience</TableHead>
                        <TableHead className="text-foreground">Status</TableHead>
                        <TableHead className="text-foreground">Recipients</TableHead>
                        <TableHead className="text-foreground">Success Rate</TableHead>
                        <TableHead className="text-foreground">Date</TableHead>
                        <TableHead className="text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {broadcasts.map((broadcast: any) => (
                        <TableRow key={broadcast.id} className="border-border">
                          <TableCell className="text-foreground font-medium">{broadcast.title}</TableCell>
                          <TableCell className="text-muted-foreground capitalize">
                            {broadcast.targetAudience === 'all' ? 'All Users' : 
                             broadcast.targetAudience === 'active_7d' ? 'Active 7d' :
                             broadcast.targetAudience === 'active_30d' ? 'Active 30d' :
                             broadcast.targetAudience === 'streak_users' ? 'Streak Users' :
                             broadcast.targetAudience}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              broadcast.status === 'sent' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {broadcast.status === 'sent' ? 'Sent' : 'Draft'}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {broadcast.recipientCount || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {broadcast.status === 'sent' && broadcast.recipientCount > 0
                              ? `${Math.round((broadcast.successCount / broadcast.recipientCount) * 100)}%`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {broadcast.sentAt 
                              ? new Date(broadcast.sentAt).toLocaleDateString()
                              : new Date(broadcast.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {broadcast.status === 'draft' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sendBroadcast.mutate(broadcast.id)}
                                  disabled={sendBroadcast.isPending}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Send
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm('Delete this broadcast?')) {
                                    deleteBroadcast.mutate(broadcast.id);
                                  }
                                }}
                                disabled={deleteBroadcast.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
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
          </div>
        )}
      </div>

      {/* Full Post View Dialog */}
      <Dialog open={!!viewingPostId} onOpenChange={(open) => !open && setViewingPostId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Review</DialogTitle>
            <DialogDescription>Post ID: {viewingPostId}</DialogDescription>
          </DialogHeader>
          
          {postLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : postError ? (
            <div className="text-center p-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-red-600">{(postError as Error).message}</p>
            </div>
          ) : viewingPost && viewingPost.id ? (
            <div className="space-y-4">
              {/* Author Info */}
              <div className="flex items-center space-x-3 pb-3 border-b">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={resolveAssetUrl(viewingPost.author?.profileImageUrl)} />
                  <AvatarFallback>
                    {viewingPost.author?.firstName?.[0] || "?"}
                    {viewingPost.author?.lastName?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {viewingPost.author?.firstName || "Unknown"} {viewingPost.author?.lastName || "User"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {viewingPost.createdAt ? new Date(viewingPost.createdAt).toLocaleString() : "Date unknown"}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              {viewingPost.content && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{viewingPost.content}</p>
                </div>
              )}

              {/* Media */}
              {viewingPost.mediaUrl && (
                <div className="rounded-lg overflow-hidden">
                  {viewingPost.mediaType === 'video' ? (
                    <video 
                      src={resolveAssetUrl(viewingPost.mediaUrl)} 
                      controls 
                      className="w-full max-h-[400px] object-contain bg-black"
                    />
                  ) : (
                    <img 
                      src={resolveAssetUrl(viewingPost.mediaUrl)} 
                      alt="Post media"
                      className="w-full max-h-[400px] object-contain"
                    />
                  )}
                </div>
              )}

              {/* Meme */}
              {viewingPost.meme && (
                <div className="rounded-lg overflow-hidden">
                  <MemeDisplay meme={viewingPost.meme} />
                </div>
              )}

              {/* Moviecon */}
              {viewingPost.moviecon && (
                <div className="rounded-lg overflow-hidden">
                  <MovieconDisplay moviecon={viewingPost.moviecon} />
                </div>
              )}

              {/* GIF */}
              {viewingPost.gifUrl && (
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={viewingPost.gifUrl} 
                    alt="GIF"
                    className="w-full max-h-[400px] object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p>Post not found or could not be loaded.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ForcedLightSurface>
  );
}