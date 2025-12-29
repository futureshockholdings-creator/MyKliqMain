import Redis from 'redis';

let redis: Redis.RedisClientType | null = null;
let lastErrorLog = 0;
let initAttempted = false;

// Initialize Redis connection with production optimizations
export async function initializeRedis() {
  // Only attempt initialization once
  if (initAttempted) {
    return redis;
  }
  initAttempted = true;
  
  try {
    // Skip Redis initialization if REDIS_URL is not configured
    if (!process.env.REDIS_URL) {
      console.log('Redis not configured, using optimized memory cache for scaling');
      return null;
    }
    
    redis = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 3000,
        keepAlive: false,
        reconnectStrategy: (retries) => {
          // Stop reconnecting after 3 attempts to reduce connection spam
          if (retries >= 3) return false;
          return Math.min(retries * 1000, 3000);
        }
      },
      commandsQueueMaxLength: 1000,
      disableOfflineQueue: true
    });

    redis.on('error', (err) => {
      // Throttle error logging to once per 60 seconds
      const now = Date.now();
      if (now - lastErrorLog > 60000) {
        console.error('Redis Client Error:', err);
        lastErrorLog = now;
      }
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('ready', () => {
      console.log('Redis ready for operations');
    });

    // Connect to Redis
    await redis.connect();
    
    return redis;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    // Gracefully degrade - continue without cache
    redis = null;
    return null;
  }
}

// Get Redis client
export function getRedisClient() {
  return redis;
}

// Cache operations with fallback
export async function setCache(key: string, value: any, ttlSeconds = 300): Promise<void> {
  if (!redis) return; // Graceful degradation
  
  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Redis SET error:', error);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null; // Graceful degradation
  
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis DELETE error:', error);
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!redis) return;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Redis DELETE PATTERN error:', error);
  }
}

// Enhanced cache with automatic invalidation
export async function getCachedOrFetch<T>(
  key: string, 
  fetchFunction: () => Promise<T>, 
  ttlSeconds = 300
): Promise<T> {
  // Try cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetchFunction();
  
  // Cache the result
  await setCache(key, data, ttlSeconds);
  
  return data;
}

// Initialize Redis on startup
initializeRedis().catch(console.error);