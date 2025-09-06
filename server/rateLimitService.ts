import { cacheService } from './cacheService';

// Rate limiting service optimized for 5000+ concurrent users
class RateLimitService {
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  // Rate limit configurations for different endpoints
  private readonly limits = {
    // High-frequency endpoints (can handle more load)
    feed: { requests: 60, window: 60000 },        // 60 requests per minute
    notifications: { requests: 120, window: 60000 }, // 120 requests per minute
    profile: { requests: 30, window: 60000 },      // 30 requests per minute
    
    // Medium-frequency endpoints
    posts: { requests: 20, window: 60000 },        // 20 posts per minute
    comments: { requests: 50, window: 60000 },     // 50 comments per minute
    likes: { requests: 100, window: 60000 },       // 100 likes per minute
    
    // Low-frequency endpoints (resource intensive)
    upload: { requests: 10, window: 60000 },       // 10 uploads per minute
    search: { requests: 30, window: 60000 },       // 30 searches per minute
    admin: { requests: 100, window: 60000 },       // 100 admin actions per minute
    
    // Authentication endpoints
    auth: { requests: 10, window: 300000 },        // 10 auth attempts per 5 minutes
    passwordReset: { requests: 3, window: 900000 }, // 3 attempts per 15 minutes
    
    // Real-time features
    websocket: { requests: 1000, window: 60000 },  // 1000 WebSocket messages per minute
    videoCall: { requests: 5, window: 300000 },    // 5 video calls per 5 minutes
    
    // Default for unspecified endpoints
    default: { requests: 50, window: 60000 }       // 50 requests per minute
  };

  async checkRateLimit(identifier: string, endpoint: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `ratelimit:${endpoint}:${identifier}`;
    const limit = this.limits[endpoint as keyof typeof this.limits] || this.limits.default;
    
    try {
      // Try to use cache service first (Redis or memory cache)
      const cachedData = await cacheService.get(key);
      
      if (cachedData) {
        const { count, resetTime } = cachedData;
        
        if (Date.now() > resetTime) {
          // Reset window
          const newData = { count: 1, resetTime: Date.now() + limit.window };
          await cacheService.set(key, newData, Math.ceil(limit.window / 1000));
          return { allowed: true, remaining: limit.requests - 1, resetTime: newData.resetTime };
        } else {
          // Within window
          if (count >= limit.requests) {
            return { allowed: false, remaining: 0, resetTime };
          } else {
            const newData = { count: count + 1, resetTime };
            await cacheService.set(key, newData, Math.ceil((resetTime - Date.now()) / 1000));
            return { allowed: true, remaining: limit.requests - newData.count, resetTime };
          }
        }
      } else {
        // First request in window
        const newData = { count: 1, resetTime: Date.now() + limit.window };
        await cacheService.set(key, newData, Math.ceil(limit.window / 1000));
        return { allowed: true, remaining: limit.requests - 1, resetTime: newData.resetTime };
      }
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fallback to in-memory rate limiting
      return this.fallbackRateLimit(identifier, endpoint);
    }
  }

  private fallbackRateLimit(identifier: string, endpoint: string): { allowed: boolean; remaining: number; resetTime: number } {
    const key = `${endpoint}:${identifier}`;
    const limit = this.limits[endpoint as keyof typeof this.limits] || this.limits.default;
    const now = Date.now();
    
    const current = this.requestCounts.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or first request
      const newData = { count: 1, resetTime: now + limit.window };
      this.requestCounts.set(key, newData);
      return { allowed: true, remaining: limit.requests - 1, resetTime: newData.resetTime };
    } else {
      // Within window
      if (current.count >= limit.requests) {
        return { allowed: false, remaining: 0, resetTime: current.resetTime };
      } else {
        current.count++;
        return { allowed: true, remaining: limit.requests - current.count, resetTime: current.resetTime };
      }
    }
  }

  // Middleware factory for Express routes
  createRateLimitMiddleware(endpoint: string) {
    return async (req: any, res: any, next: any) => {
      try {
        // Use IP + user ID for more accurate rate limiting
        const identifier = req.user?.claims?.sub || req.ip || 'anonymous';
        const result = await this.checkRateLimit(identifier, endpoint);
        
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': this.limits[endpoint as keyof typeof this.limits]?.requests || this.limits.default.requests,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000)
        });
        
        if (!result.allowed) {
          const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
          res.set('Retry-After', retryAfter.toString());
          return res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded for ${endpoint}. Try again in ${retryAfter} seconds.`,
            retryAfter
          });
        }
        
        next();
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        // On error, allow request to proceed to avoid blocking users
        next();
      }
    };
  }

  // Burst protection for sudden traffic spikes
  async checkBurstProtection(identifier: string): Promise<boolean> {
    const key = `burst:${identifier}`;
    const burstLimit = 100; // 100 requests per 10 seconds
    const burstWindow = 10000; // 10 seconds
    
    try {
      const cachedData = await cacheService.get(key);
      
      if (cachedData) {
        const { count, resetTime } = cachedData;
        
        if (Date.now() > resetTime) {
          await cacheService.set(key, { count: 1, resetTime: Date.now() + burstWindow }, 10);
          return true;
        } else if (count >= burstLimit) {
          return false;
        } else {
          await cacheService.set(key, { count: count + 1, resetTime }, Math.ceil((resetTime - Date.now()) / 1000));
          return true;
        }
      } else {
        await cacheService.set(key, { count: 1, resetTime: Date.now() + burstWindow }, 10);
        return true;
      }
    } catch (error) {
      console.error('Burst protection error:', error);
      return true; // Allow on error
    }
  }

  // Clean up old rate limit data
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }

  // Get current rate limit stats for monitoring
  getStats(): { 
    memoryEntries: number;
    cacheConnected: boolean;
    limits: typeof this.limits;
  } {
    return {
      memoryEntries: this.requestCounts.size,
      cacheConnected: cacheService.isRedisConnected(),
      limits: this.limits
    };
  }
}

export const rateLimitService = new RateLimitService();

// Cleanup old entries every 5 minutes
setInterval(() => {
  rateLimitService.cleanup();
}, 300000);