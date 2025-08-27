// Performance monitoring and metrics for production scaling
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  requestCounts: Map<string, number>;
  responseTime: Map<string, number[]>;
  errorCounts: Map<string, number>;
  dbQueryTimes: number[];
  memoryUsage: Array<{ timestamp: number; heapUsed: number; heapTotal: number }>;
  activeConnections: number;
  cacheHitRate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    requestCounts: new Map(),
    responseTime: new Map(),
    errorCounts: new Map(),
    dbQueryTimes: [],
    memoryUsage: [],
    activeConnections: 0,
    cacheHitRate: 0,
  };

  private startTime: number = Date.now();

  // Track API request performance
  trackRequest(endpoint: string, duration: number): void {
    // Increment request count
    const currentCount = this.metrics.requestCounts.get(endpoint) || 0;
    this.metrics.requestCounts.set(endpoint, currentCount + 1);

    // Track response times (keep last 100 for average calculation)
    const responseTimes = this.metrics.responseTime.get(endpoint) || [];
    responseTimes.push(duration);
    if (responseTimes.length > 100) {
      responseTimes.shift();
    }
    this.metrics.responseTime.set(endpoint, responseTimes);
  }

  // Track database query performance
  trackDbQuery(duration: number): void {
    this.metrics.dbQueryTimes.push(duration);
    // Keep only last 1000 query times to prevent memory leak
    if (this.metrics.dbQueryTimes.length > 1000) {
      this.metrics.dbQueryTimes.shift();
    }
  }

  // Track errors
  trackError(endpoint: string): void {
    const currentCount = this.metrics.errorCounts.get(endpoint) || 0;
    this.metrics.errorCounts.set(endpoint, currentCount + 1);
  }

  // Record memory usage
  recordMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
    });

    // Keep only last 100 memory snapshots
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }
  }

  // Update cache hit rate
  updateCacheHitRate(hitRate: number): void {
    this.metrics.cacheHitRate = hitRate;
  }

  // Get comprehensive performance report
  getPerformanceReport(): any {
    const now = Date.now();
    const uptimeMinutes = Math.floor((now - this.startTime) / (1000 * 60));

    // Calculate average response times
    const avgResponseTimes: Record<string, number> = {};
    const responseTimeEntries = Array.from(this.metrics.responseTime.entries());
    for (const [endpoint, times] of responseTimeEntries) {
      const avg = times.reduce((sum: number, time: number) => sum + time, 0) / times.length;
      avgResponseTimes[endpoint] = Math.round(avg);
    }

    // Calculate database query stats
    const dbStats = this.metrics.dbQueryTimes.length > 0 ? {
      avgQueryTime: Math.round(
        this.metrics.dbQueryTimes.reduce((sum, time) => sum + time, 0) / 
        this.metrics.dbQueryTimes.length
      ),
      maxQueryTime: Math.max(...this.metrics.dbQueryTimes),
      totalQueries: this.metrics.dbQueryTimes.length,
    } : { avgQueryTime: 0, maxQueryTime: 0, totalQueries: 0 };

    // Get current memory usage
    const memUsage = process.memoryUsage();
    const currentMemoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    // Calculate request rates (requests per minute)
    const requestRates: Record<string, number> = {};
    const requestCountEntries = Array.from(this.metrics.requestCounts.entries());
    for (const [endpoint, count] of requestCountEntries) {
      requestRates[endpoint] = Math.round((count / uptimeMinutes) * 100) / 100;
    }

    return {
      uptime: {
        minutes: uptimeMinutes,
        hours: Math.round(uptimeMinutes / 60 * 100) / 100,
      },
      requests: {
        totalRequests: Array.from(this.metrics.requestCounts.values()).reduce((sum, count) => sum + count, 0),
        requestCounts: Object.fromEntries(this.metrics.requestCounts),
        requestRates,
        avgResponseTimes,
      },
      database: dbStats,
      memory: {
        currentUsageMB: currentMemoryMB,
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        memoryTrend: this.metrics.memoryUsage.slice(-10).map(m => Math.round(m.heapUsed / 1024 / 1024)),
      },
      errors: Object.fromEntries(this.metrics.errorCounts),
      cache: {
        hitRate: this.metrics.cacheHitRate,
      },
      health: this.getHealthStatus(),
    };
  }

  // Determine overall system health
  private getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const report = this.getPerformanceReport();
    
    // Check for critical issues
    if (report.memory.currentUsageMB > 900) return 'critical'; // >900MB memory usage
    if (report.database.avgQueryTime > 5000) return 'critical'; // >5s avg query time

    // Check for warning conditions
    if (report.memory.currentUsageMB > 500) return 'warning'; // >500MB memory usage
    if (report.database.avgQueryTime > 1000) return 'warning'; // >1s avg query time
    if (report.cache.hitRate < 0.7) return 'warning'; // <70% cache hit rate

    return 'healthy';
  }

  // Reset metrics (useful for periodic reports)
  reset(): void {
    this.metrics.requestCounts.clear();
    this.metrics.responseTime.clear();
    this.metrics.errorCounts.clear();
    this.metrics.dbQueryTimes = [];
    this.metrics.memoryUsage = [];
    this.startTime = Date.now();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Database query timing decorator
export function trackDbQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  return queryFn().then(result => {
    const duration = performance.now() - start;
    performanceMonitor.trackDbQuery(duration);
    return result;
  });
}

// Middleware for tracking request performance
export function performanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = performance.now();
    
    res.on('finish', () => {
      const duration = performance.now() - start;
      const endpoint = `${req.method} ${req.route?.path || req.path}`;
      performanceMonitor.trackRequest(endpoint, duration);
      
      if (res.statusCode >= 400) {
        performanceMonitor.trackError(endpoint);
      }
    });
    
    next();
  };
}

// Start periodic memory monitoring
setInterval(() => {
  performanceMonitor.recordMemoryUsage();
}, 30 * 1000); // Every 30 seconds

// Log performance report every 10 minutes
setInterval(() => {
  const report = performanceMonitor.getPerformanceReport();
  console.log('=== PERFORMANCE REPORT ===');
  console.log(`Health: ${report.health.toUpperCase()}`);
  console.log(`Memory: ${report.memory.currentUsageMB}MB (${report.memory.heapTotalMB}MB total)`);
  console.log(`DB Avg Query: ${report.database.avgQueryTime}ms`);
  console.log(`Cache Hit Rate: ${(report.cache.hitRate * 100).toFixed(1)}%`);
  console.log(`Total Requests: ${report.requests.totalRequests}`);
  if (Object.keys(report.errors).length > 0) {
    console.log(`Errors:`, report.errors);
  }
  console.log('========================');
}, 10 * 60 * 1000); // Every 10 minutes