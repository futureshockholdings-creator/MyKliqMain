// Comprehensive health monitoring for maximum scalability
import { Request, Response } from 'express';
import { pool } from './db';
import { getRedisClient } from './redis';
import { performanceMonitor } from './performanceMonitor';
import { getLoadBalancerStatus } from './loadBalancer';
import { memoryOptimizer } from './memoryOptimizer';
import { SCALABILITY_CONFIG } from './scalabilityConfig';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    memory: ComponentHealth;
    performance: ComponentHealth;
    loadBalancer: ComponentHealth;
  };
  metrics: {
    requests: number;
    errors: number;
    responseTime: number;
    throughput: number;
  };
  scalability: {
    currentCapacity: number;
    estimatedMaxUsers: number;
    bottlenecks: string[];
    recommendations: string[];
  };
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  responseTime?: number;
  details?: any;
}

class HealthMonitor {
  private startTime = Date.now();

  // Comprehensive health check
  async getHealthStatus(): Promise<HealthStatus> {
    const [database, redis, memory, performance, loadBalancer] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkPerformance(),
      this.checkLoadBalancer()
    ]);

    const perfReport = performanceMonitor.getPerformanceReport();
    const overallStatus = this.calculateOverallStatus([database, redis, memory, performance, loadBalancer]);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      components: {
        database,
        redis,
        memory,
        performance,
        loadBalancer
      },
      metrics: {
        requests: perfReport.requests.totalRequests,
        errors: Object.values(perfReport.errors).reduce((sum: number, count: any) => sum + count, 0),
        responseTime: perfReport.database.avgQueryTime,
        throughput: perfReport.requests.totalRequests / (perfReport.uptime.minutes || 1)
      },
      scalability: this.assessScalability(perfReport)
    };
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    try {
      const startTime = Date.now();
      const client = await pool.connect();
      const result = await client.query('SELECT 1 as health_check');
      client.release();
      
      const responseTime = Date.now() - startTime;
      const poolStats = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      };

      if (responseTime > 2000) {
        return {
          status: 'degraded',
          message: `Slow database response: ${responseTime}ms`,
          responseTime,
          details: poolStats
        };
      }

      if (pool.totalCount > 60) {
        return {
          status: 'degraded',
          message: `High connection usage: ${pool.totalCount}/75`,
          responseTime,
          details: poolStats
        };
      }

      return {
        status: 'healthy',
        message: 'Database connection healthy',
        responseTime,
        details: poolStats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  }

  private async checkRedis(): Promise<ComponentHealth> {
    try {
      const redis = getRedisClient();
      if (!redis) {
        return {
          status: 'degraded',
          message: 'Redis not available - using fallback caching'
        };
      }

      const startTime = Date.now();
      await redis.ping();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        message: 'Redis connection healthy',
        responseTime
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: `Redis error: ${(error as Error).message} - using fallback`
      };
    }
  }

  private checkMemory(): Promise<ComponentHealth> {
    return new Promise((resolve) => {
      const memStats = memoryOptimizer.getMemoryStats();
      const heapUsedMB = memStats.memory.heapUsed;

      if (heapUsedMB > SCALABILITY_CONFIG.performance.criticalMemoryThreshold) {
        resolve({
          status: 'unhealthy',
          message: `Critical memory usage: ${heapUsedMB}MB`,
          details: memStats
        });
      } else if (heapUsedMB > SCALABILITY_CONFIG.performance.warningMemoryThreshold) {
        resolve({
          status: 'degraded',
          message: `High memory usage: ${heapUsedMB}MB`,
          details: memStats
        });
      } else {
        resolve({
          status: 'healthy',
          message: `Memory usage normal: ${heapUsedMB}MB`,
          details: memStats
        });
      }
    });
  }

  private checkPerformance(): Promise<ComponentHealth> {
    return new Promise((resolve) => {
      const perfReport = performanceMonitor.getPerformanceReport();
      const avgResponseTime = perfReport.database.avgQueryTime;

      if (avgResponseTime > SCALABILITY_CONFIG.performance.maxResponseTime) {
        resolve({
          status: 'unhealthy',
          message: `Critical response time: ${avgResponseTime}ms`,
          responseTime: avgResponseTime
        });
      } else if (avgResponseTime > SCALABILITY_CONFIG.performance.slowQueryThreshold) {
        resolve({
          status: 'degraded',
          message: `Slow response time: ${avgResponseTime}ms`,
          responseTime: avgResponseTime
        });
      } else {
        resolve({
          status: 'healthy',
          message: `Performance good: ${avgResponseTime}ms`,
          responseTime: avgResponseTime
        });
      }
    });
  }

  private checkLoadBalancer(): Promise<ComponentHealth> {
    return new Promise((resolve) => {
      const lbStatus = getLoadBalancerStatus();
      const activeConnections = lbStatus.health.activeConnections;

      if (activeConnections > SCALABILITY_CONFIG.loadBalancing.maxActiveConnections * 0.9) {
        resolve({
          status: 'degraded',
          message: `High load: ${activeConnections} active connections`,
          details: lbStatus
        });
      } else {
        resolve({
          status: 'healthy',
          message: `Load balanced: ${activeConnections} active connections`,
          details: lbStatus
        });
      }
    });
  }

  private calculateOverallStatus(components: ComponentHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (components.some(c => c.status === 'unhealthy')) return 'unhealthy';
    if (components.some(c => c.status === 'degraded')) return 'degraded';
    return 'healthy';
  }

  private assessScalability(perfReport: any): {
    currentCapacity: number;
    estimatedMaxUsers: number;
    bottlenecks: string[];
    recommendations: string[];
  } {
    const memUsage = perfReport.memory.currentUsageMB;
    const dbResponseTime = perfReport.database.avgQueryTime;
    const requestRate = perfReport.requests.totalRequests / (perfReport.uptime.minutes || 1);

    // Estimate current capacity based on multiple factors
    const memoryCapacity = Math.floor((800 - memUsage) / 2); // ~2MB per user
    const dbCapacity = Math.floor(2000 / Math.max(dbResponseTime / 100, 1)); // Response time factor
    const requestCapacity = Math.floor(requestRate * 10); // Request throughput factor

    const currentCapacity = Math.min(memoryCapacity, dbCapacity, requestCapacity);
    const estimatedMaxUsers = currentCapacity * 1.5; // Conservative estimate

    const bottlenecks = [];
    const recommendations = [];

    if (memUsage > 500) {
      bottlenecks.push('Memory usage high');
      recommendations.push('Enable clustering, optimize memory usage');
    }

    if (dbResponseTime > 500) {
      bottlenecks.push('Database response time slow');
      recommendations.push('Add read replicas, optimize queries');
    }

    if (pool.totalCount > 50) {
      bottlenecks.push('Database connection pool near limit');
      recommendations.push('Increase pool size, implement connection sharing');
    }

    return {
      currentCapacity,
      estimatedMaxUsers,
      bottlenecks,
      recommendations
    };
  }
}

export const healthMonitor = new HealthMonitor();

// Health check endpoint handler
export async function healthCheckHandler(req: Request, res: Response) {
  try {
    const healthStatus = await healthMonitor.getHealthStatus();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      message: `Health check failed: ${(error as Error).message}`,
      timestamp: new Date().toISOString()
    });
  }
}

// Detailed scalability report
export async function scalabilityReportHandler(req: Request, res: Response) {
  try {
    const healthStatus = await healthMonitor.getHealthStatus();
    const perfReport = performanceMonitor.getPerformanceReport();
    const memStats = memoryOptimizer.getMemoryStats();
    
    const report = {
      overview: {
        currentUsers: healthStatus.scalability.currentCapacity,
        maxCapacity: healthStatus.scalability.estimatedMaxUsers,
        utilizationPercent: Math.round((healthStatus.scalability.currentCapacity / healthStatus.scalability.estimatedMaxUsers) * 100)
      },
      performance: perfReport,
      memory: memStats,
      recommendations: healthStatus.scalability.recommendations,
      bottlenecks: healthStatus.scalability.bottlenecks,
      config: SCALABILITY_CONFIG
    };
    
    res.json(report);
  } catch (error) {
    res.status(500).json({
      error: `Scalability report failed: ${(error as Error).message}`
    });
  }
}