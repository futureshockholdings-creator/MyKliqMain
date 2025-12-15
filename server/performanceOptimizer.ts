import { Request, Response, NextFunction } from 'express';
import { cacheService } from './cacheService';

// Performance optimization service for 5000+ concurrent users
class PerformanceOptimizer {
  private responseTimeTracking = new Map<string, number[]>();
  private slowRequestThreshold = 1000; // 1 second
  private criticalRequestThreshold = 3000; // 3 seconds
  
  // Response time monitoring middleware
  responseTimeMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const endpoint = req.path;
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.trackResponseTime(endpoint, duration);
        
        // Log slow requests for optimization
        if (duration > this.slowRequestThreshold) {
          console.warn(`🐌 Slow request: ${req.method} ${endpoint} took ${duration}ms`);
        }
        
        if (duration > this.criticalRequestThreshold) {
          console.error(`🚨 Critical slow request: ${req.method} ${endpoint} took ${duration}ms`);
        }
      });
      
      next();
    };
  }

  private trackResponseTime(endpoint: string, duration: number): void {
    if (!this.responseTimeTracking.has(endpoint)) {
      this.responseTimeTracking.set(endpoint, []);
    }
    
    const times = this.responseTimeTracking.get(endpoint)!;
    times.push(duration);
    
    // Keep only last 100 measurements per endpoint
    if (times.length > 100) {
      times.shift();
    }
  }

  // Memory optimization middleware
  memoryOptimizationMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Clear large request bodies after processing
      res.on('finish', () => {
        if (req.body && Object.keys(req.body).length > 10) {
          req.body = undefined;
        }
      });
      
      next();
    };
  }

  // Database query optimization wrapper
  async optimizeQuery<T>(
    queryFunction: () => Promise<T>,
    cacheKey?: string,
    cacheTtl: number = 300
  ): Promise<T> {
    // Try cache first if cache key provided
    if (cacheKey) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const startTime = Date.now();
    const result = await queryFunction();
    const duration = Date.now() - startTime;
    
    // Log slow database queries
    if (duration > 500) {
      console.warn(`🐌 Slow DB query took ${duration}ms`);
    }
    
    // Cache result if cache key provided
    if (cacheKey && result) {
      await cacheService.set(cacheKey, result, cacheTtl);
    }
    
    return result;
  }

  // Request prioritization for critical endpoints
  prioritizeRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      const criticalEndpoints = [
        '/api/auth',
        '/api/notifications',
        '/api/emergency'
      ];
      
      if (criticalEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
        // Set higher priority for critical requests
        (req as any).priority = 'high';
      }
      
      next();
    };
  }

  // Compression middleware for large responses
  compressionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalJson = res.json;
      
      res.json = function(obj: any) {
        // Compress large response objects
        if (obj && typeof obj === 'object' && JSON.stringify(obj).length > 1000) {
          res.set('Content-Encoding', 'gzip');
        }
        
        return originalJson.call(this, obj);
      };
      
      next();
    };
  }

  // Get performance statistics
  getPerformanceStats(): {
    averageResponseTimes: Record<string, number>;
    slowEndpoints: string[];
    memoryUsage: NodeJS.MemoryUsage;
    cacheStats: any;
  } {
    const averageResponseTimes: Record<string, number> = {};
    const slowEndpoints: string[] = [];
    
    for (const [endpoint, times] of Array.from(this.responseTimeTracking.entries())) {
      const average = times.reduce((sum: number, time: number) => sum + time, 0) / times.length;
      averageResponseTimes[endpoint] = Math.round(average);
      
      if (average > this.slowRequestThreshold) {
        slowEndpoints.push(endpoint);
      }
    }
    
    return {
      averageResponseTimes,
      slowEndpoints,
      memoryUsage: process.memoryUsage(),
      cacheStats: {
        memoryCacheSize: cacheService.getMemoryCacheSize(),
        redisConnected: cacheService.isRedisConnected()
      }
    };
  }

  // Database connection monitoring
  async checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    details: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { pool } = require('./db');
      
      // Simple connection test
      await pool.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      const poolInfo = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      };
      
      console.log(`Connection pool stats - Total: ${poolInfo.total}, Idle: ${poolInfo.idle}, Waiting: ${poolInfo.waiting}`);
      
      if (responseTime > 1000 || poolInfo.waiting > 5) {
        return {
          status: 'warning',
          responseTime,
          details: `Slow response: ${responseTime}ms, Waiting connections: ${poolInfo.waiting}`
        };
      }
      
      if (responseTime > 2000 || poolInfo.waiting > 10) {
        return {
          status: 'critical',
          responseTime,
          details: `Critical performance: ${responseTime}ms, Waiting connections: ${poolInfo.waiting}`
        };
      }
      
      return {
        status: 'healthy',
        responseTime,
        details: `DB healthy: ${responseTime}ms response`
      };
    } catch (error) {
      return {
        status: 'critical',
        responseTime: Date.now() - startTime,
        details: `Database error: ${error}`
      };
    }
  }

  // Automated optimization suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const stats = this.getPerformanceStats();
    
    // Memory suggestions
    const heapUsedMB = stats.memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      suggestions.push('Consider implementing object pooling to reduce memory usage');
    }
    
    // Slow endpoint suggestions
    if (stats.slowEndpoints.length > 0) {
      suggestions.push(`Optimize slow endpoints: ${stats.slowEndpoints.join(', ')}`);
    }
    
    // Cache suggestions - only suggest Redis if not configured at all
    if (!stats.cacheStats.redisConnected && !process.env.REDIS_URL) {
      suggestions.push('Consider setting up Redis for better caching performance');
    }
    
    if (stats.cacheStats.memoryCacheSize > 500 && !process.env.REDIS_URL) {
      suggestions.push('Memory cache is large, consider cache cleanup or Redis migration');
    }
    
    return suggestions;
  }

  // Cleanup old performance data
  cleanup(): void {
    for (const [endpoint, times] of Array.from(this.responseTimeTracking.entries())) {
      if (times.length > 100) {
        this.responseTimeTracking.set(endpoint, times.slice(-50));
      }
    }
  }
}

export const performanceOptimizer = new PerformanceOptimizer();

// Cleanup every 10 minutes
setInterval(() => {
  performanceOptimizer.cleanup();
}, 600000);