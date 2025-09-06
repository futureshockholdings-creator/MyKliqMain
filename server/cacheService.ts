import Redis from 'redis';

// Cache service optimized for 5000+ concurrent users
class CacheService {
  private client: any = null;
  private isRedisAvailable = false;
  private memoryCache = new Map<string, { data: any; expiry: number }>();
  
  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      // Try to connect to Redis if available
      if (process.env.REDIS_URL) {
        this.client = Redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 5000
          }
        });

        this.client.on('error', (err: any) => {
          console.log('Redis connection failed, using memory cache fallback');
          this.isRedisAvailable = false;
        });

        this.client.on('connect', () => {
          console.log('✅ Redis cache connected for high-performance scaling');
          this.isRedisAvailable = true;
        });

        await this.client.connect();
      } else {
        console.log('Redis not configured, using optimized memory cache for scaling');
      }
    } catch (error) {
      console.log('Redis not available, using memory cache fallback');
      this.isRedisAvailable = false;
    }
  }

  async get(key: string): Promise<any> {
    try {
      if (this.isRedisAvailable && this.client) {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        // Memory cache fallback with TTL
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.data;
        }
        if (cached) {
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      if (this.isRedisAvailable && this.client) {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      } else {
        // Memory cache with size limit for memory efficiency
        if (this.memoryCache.size > 1000) {
          // Remove oldest entries when cache gets too large
          const entries = Array.from(this.memoryCache.entries());
          for (let i = 0; i < 100; i++) {
            this.memoryCache.delete(entries[i][0]);
          }
        }
        
        this.memoryCache.set(key, {
          data: value,
          expiry: Date.now() + (ttlSeconds * 1000)
        });
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.client) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      if (this.isRedisAvailable && this.client) {
        await this.client.flushDb();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  // Optimized caching for frequent queries
  async cacheUserProfile(userId: string, userData: any, ttl: number = 600): Promise<void> {
    await this.set(`user:${userId}`, userData, ttl);
  }

  async getCachedUserProfile(userId: string): Promise<any> {
    return await this.get(`user:${userId}`);
  }

  async cacheFeed(userId: string, feedData: any, ttl: number = 180): Promise<void> {
    await this.set(`feed:${userId}`, feedData, ttl);
  }

  async getCachedFeed(userId: string): Promise<any> {
    return await this.get(`feed:${userId}`);
  }

  async cacheNotifications(userId: string, notifications: any, ttl: number = 120): Promise<void> {
    await this.set(`notifications:${userId}`, notifications, ttl);
  }

  async getCachedNotifications(userId: string): Promise<any> {
    return await this.get(`notifications:${userId}`);
  }

  // Cache invalidation patterns for data consistency
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.del(`user:${userId}`),
      this.del(`feed:${userId}`),
      this.del(`notifications:${userId}`)
    ]);
  }

  // Analytics caching for performance
  async cacheAnalytics(data: any, ttl: number = 1800): Promise<void> {
    await this.set('analytics:dashboard', data, ttl);
  }

  async getCachedAnalytics(): Promise<any> {
    return await this.get('analytics:dashboard');
  }

  // System health metrics
  getMemoryCacheSize(): number {
    return this.memoryCache.size;
  }

  isRedisConnected(): boolean {
    return this.isRedisAvailable;
  }
}

export const cacheService = new CacheService();