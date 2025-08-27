// Load balancing and request distribution for maximum scalability
import { Request, Response, NextFunction } from 'express';

interface ServerHealth {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  responseTime: number;
  timestamp: number;
}

class LoadBalancerManager {
  private serverHealth: ServerHealth = {
    cpuUsage: 0,
    memoryUsage: 0,
    activeConnections: 0,
    responseTime: 0,
    timestamp: Date.now()
  };

  private requestQueue: Map<string, number> = new Map();
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();

  // Advanced rate limiting by user/IP
  rateLimit(identifier: string, maxRequests = 300, windowMs = 60000) {
    const now = Date.now();
    const userLimit = this.rateLimiter.get(identifier);

    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimiter.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (userLimit.count >= maxRequests) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  // Intelligent request queuing
  queueRequest(endpoint: string): boolean {
    const current = this.requestQueue.get(endpoint) || 0;
    const maxQueue = this.getMaxQueueForEndpoint(endpoint);
    
    if (current >= maxQueue) {
      return false; // Queue full
    }

    this.requestQueue.set(endpoint, current + 1);
    return true;
  }

  releaseRequest(endpoint: string): void {
    const current = this.requestQueue.get(endpoint) || 0;
    this.requestQueue.set(endpoint, Math.max(0, current - 1));
  }

  private getMaxQueueForEndpoint(endpoint: string): number {
    // Different queue limits based on endpoint complexity
    if (endpoint.includes('kliq-feed')) return 20;
    if (endpoint.includes('stories') || endpoint.includes('posts')) return 15;
    if (endpoint.includes('notifications')) return 25;
    return 10; // Default
  }

  // Server health monitoring
  updateServerHealth(): void {
    const memUsage = process.memoryUsage();
    
    this.serverHealth = {
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      activeConnections: this.getTotalActiveConnections(),
      responseTime: this.getAverageResponseTime(),
      timestamp: Date.now()
    };
  }

  private getTotalActiveConnections(): number {
    // Sum all active requests across endpoints
    return Array.from(this.requestQueue.values()).reduce((sum, count) => sum + count, 0);
  }

  private getAverageResponseTime(): number {
    // This would be calculated from performance monitor data
    return 250; // Placeholder - integrate with actual performance monitor
  }

  // Circuit breaker pattern for high load
  shouldRejectRequest(): boolean {
    const { memoryUsage, activeConnections } = this.serverHealth;
    
    // More permissive thresholds for development
    if (memoryUsage > 1000) return true;
    
    // Higher threshold for active connections
    if (activeConnections > 500) return true;
    
    return false;
  }

  getHealthStatus(): ServerHealth {
    return { ...this.serverHealth };
  }
}

export const loadBalancer = new LoadBalancerManager();

// Middleware for request management
export function requestManagerMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const endpoint = req.path;
  const identifier = req.ip || 'unknown';

  // Update server health
  loadBalancer.updateServerHealth();

  // Circuit breaker check
  if (loadBalancer.shouldRejectRequest()) {
    return res.status(503).json({ 
      error: 'Server overloaded. Please try again later.',
      retryAfter: 30 
    });
  }

  // Rate limiting check  
  if (!loadBalancer.rateLimit(identifier, 500, 60000)) { // 500 requests per minute for development
    return res.status(429).json({ 
      error: 'Rate limit exceeded. Please slow down.',
      retryAfter: 60 
    });
  }

  // Request queueing
  if (!loadBalancer.queueRequest(endpoint)) {
    return res.status(503).json({ 
      error: 'Server busy. Please try again later.',
      retryAfter: 10 
    });
  }

  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    loadBalancer.releaseRequest(endpoint);
    
    // Log slow requests
    if (duration > 2000) {
      console.warn(`🐌 Slow request: ${endpoint} took ${duration}ms`);
    }
  });

  next();
}

// Health check endpoint data
export function getLoadBalancerStatus() {
  return {
    health: loadBalancer.getHealthStatus(),
    queueSizes: Object.fromEntries(loadBalancer.requestQueue),
    rateLimitStatus: loadBalancer.rateLimiter.size
  };
}

// Periodic cleanup
setInterval(() => {
  loadBalancer.updateServerHealth();
}, 5000); // Update every 5 seconds