import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Database, 
  Users, 
  MessageCircle, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Clock,
  HardDrive,
  Zap,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ForcedLightSurface } from "@/components/ForcedLightSurface";

interface MaintenanceMetrics {
  database: {
    totalUsers: number;
    activeSessions: number;
    totalPosts: number;
    activePolls: number;
    upcomingEvents: number;
    storageUsage: number;
    queryPerformance: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
  cleanup: {
    expiredSessions: number;
    oldNotifications: number;
    expiredStories: number;
    completedPolls: number;
    pastEvents: number;
  };
  lastMaintenance: {
    sessionCleanup: string | null;
    notificationCleanup: string | null;
    storyCleanup: string | null;
    databaseOptimization: string | null;
  };
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
}

export default function MaintenanceDashboard() {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // Note: Admin access is now handled by route-level authentication

  const { data: metrics, isLoading, refetch } = useQuery<MaintenanceMetrics>({
    queryKey: ["/api/maintenance/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: healthStatus } = useQuery<HealthStatus>({
    queryKey: ["/api/maintenance/health"],
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast({
      title: "Dashboard Refreshed",
      description: "All metrics have been updated",
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (isLoading || !metrics) {
    return (
      <ForcedLightSurface className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Maintenance Dashboard</h1>
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ForcedLightSurface>
    );
  }

  return (
    <ForcedLightSurface>
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6" data-testid="maintenance-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Maintenance Dashboard</h1>
              <p className="text-gray-600">Monitor MyKliq system health and performance</p>
            </div>
          </div>
        <div className="flex items-center space-x-4">
          {healthStatus && (
            <div className={cn("flex items-center space-x-2", getStatusColor(healthStatus.status))}>
              {getStatusIcon(healthStatus.status)}
              <span className="font-medium capitalize">{healthStatus.status}</span>
            </div>
          )}
          <Button onClick={handleRefresh} disabled={refreshing} data-testid="refresh-dashboard">
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Alerts */}
      {healthStatus && healthStatus.issues.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>System Issues Detected</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {healthStatus.issues.map((issue, index) => (
                <li key={index} className="text-sm text-destructive">• {issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Database Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.database.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.database.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.database.totalPosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.database.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">Future events</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Avg Response Time</span>
                <span>{Math.round(metrics.performance.avgResponseTime)}ms</span>
              </div>
              <Progress value={Math.min(metrics.performance.avgResponseTime / 20, 100)} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Error Rate</span>
                <span>{metrics.performance.errorRate.toFixed(1)}%</span>
              </div>
              <Progress 
                value={metrics.performance.errorRate} 
                className={metrics.performance.errorRate > 5 ? "bg-destructive/20" : ""}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>{metrics.performance.memoryUsage}MB</span>
              </div>
              <Progress value={Math.min(metrics.performance.memoryUsage / 10, 100)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Database Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Query Performance</span>
              <Badge variant={metrics.database.queryPerformance < 500 ? "default" : "destructive"}>
                {Math.round(metrics.database.queryPerformance)}ms
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Active Polls</span>
              <span className="font-medium">{metrics.database.activePolls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Storage Usage</span>
              <span className="font-medium">{metrics.database.storageUsage}MB</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5" />
              <span>Cleanup Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Expired Sessions</span>
                <Badge variant={metrics.cleanup.expiredSessions > 50 ? "destructive" : "secondary"}>
                  {metrics.cleanup.expiredSessions}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Old Notifications</span>
                <Badge variant={metrics.cleanup.oldNotifications > 500 ? "destructive" : "secondary"}>
                  {metrics.cleanup.oldNotifications}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Expired Stories</span>
                <Badge variant={metrics.cleanup.expiredStories > 10 ? "destructive" : "secondary"}>
                  {metrics.cleanup.expiredStories}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Maintenance Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Session Cleanup</h4>
              <p className="text-xs text-muted-foreground">{formatDate(metrics.lastMaintenance.sessionCleanup)}</p>
              <Badge variant="outline" className="mt-1">Daily</Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Story Cleanup</h4>
              <p className="text-xs text-muted-foreground">{formatDate(metrics.lastMaintenance.storyCleanup)}</p>
              <Badge variant="outline" className="mt-1">Daily</Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Notification Cleanup</h4>
              <p className="text-xs text-muted-foreground">{formatDate(metrics.lastMaintenance.notificationCleanup)}</p>
              <Badge variant="outline" className="mt-1">Weekly</Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Database Optimization</h4>
              <p className="text-xs text-muted-foreground">{formatDate(metrics.lastMaintenance.databaseOptimization)}</p>
              <Badge variant="outline" className="mt-1">Weekly</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </ForcedLightSurface>
  );
}