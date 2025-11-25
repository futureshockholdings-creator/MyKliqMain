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
  ArrowLeft,
  Server,
  Gauge,
  Shield,
  Lightbulb
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

interface ScalingMetrics {
  currentLoad: {
    activeUsers: number;
    memoryUsageMB: number;
    databaseConnections: {
      total: number;
      idle: number;
      waiting: number;
      utilization: string;
    };
    cachePerformance: {
      redisConnected: boolean;
      memoryCacheSize: number;
      rateLimitEntries: number;
    };
  };
  performance: {
    averageResponseTimes: Record<string, number>;
    slowEndpoints: string[];
    databaseHealth: {
      status: string;
      poolUtilization: number;
    };
    optimizationSuggestions: string[];
  };
  scalingCapacity: {
    estimatedConcurrentUsers: number;
    memoryCapacityUsed: string;
    dbCapacityUsed: string;
    scalingStatus: string;
  };
  rateLimiting: {
    limits: Record<string, number>;
    activeRateLimits: number;
    effectiveness: string;
  };
  recommendations: string[];
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

  const { data: scalingMetrics, refetch: refetchScaling } = useQuery<ScalingMetrics>({
    queryKey: ["/api/admin/scaling-dashboard"],
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchScaling()]);
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

      {/* Scaling Metrics */}
      {scalingMetrics && (
        <>
          {/* Scaling Capacity & Connection Pool */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scaling Capacity</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scalingMetrics.scalingCapacity.estimatedConcurrentUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Max concurrent users</p>
                <Badge 
                  variant={scalingMetrics.scalingCapacity.scalingStatus === 'optimal' ? 'default' : 'secondary'}
                  className="mt-2"
                >
                  {scalingMetrics.scalingCapacity.scalingStatus}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Capacity</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scalingMetrics.currentLoad.memoryUsageMB}MB</div>
                <p className="text-xs text-muted-foreground">Used: {scalingMetrics.scalingCapacity.memoryCapacityUsed}</p>
                <Progress 
                  value={parseFloat(scalingMetrics.scalingCapacity.memoryCapacityUsed)} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DB Connections</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scalingMetrics.currentLoad.databaseConnections.total}/50</div>
                <p className="text-xs text-muted-foreground">
                  Idle: {scalingMetrics.currentLoad.databaseConnections.idle} | 
                  Waiting: {scalingMetrics.currentLoad.databaseConnections.waiting}
                </p>
                <Progress 
                  value={parseFloat(scalingMetrics.scalingCapacity.dbCapacityUsed)} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rate Limiting</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scalingMetrics.rateLimiting.activeRateLimits}</div>
                <p className="text-xs text-muted-foreground">Active rate limits</p>
                <Badge variant="outline" className="mt-2">
                  {scalingMetrics.rateLimiting.effectiveness}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Cache & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>Cache Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Redis Connection</span>
                  <Badge variant={scalingMetrics.currentLoad.cachePerformance.redisConnected ? 'default' : 'secondary'}>
                    {scalingMetrics.currentLoad.cachePerformance.redisConnected ? 'Connected' : 'Memory Fallback'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Memory Cache Size</span>
                  <span className="font-medium">{scalingMetrics.currentLoad.cachePerformance.memoryCacheSize} entries</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Rate Limit Entries</span>
                  <span className="font-medium">{scalingMetrics.currentLoad.cachePerformance.rateLimitEntries}</span>
                </div>
                {scalingMetrics.performance.slowEndpoints.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Slow Endpoints:</span>
                    <div className="mt-1 space-y-1">
                      {scalingMetrics.performance.slowEndpoints.slice(0, 3).map((endpoint, i) => (
                        <Badge key={i} variant="destructive" className="mr-1 text-xs">
                          {endpoint}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5" />
                  <span>Scaling Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {scalingMetrics.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      {rec.includes('optimal') || rec.includes('healthy') || rec.includes('good') || rec.includes('operational') ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}

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
      </div>
    </ForcedLightSurface>
  );
}