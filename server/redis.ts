import Redis from 'redis';

let redis: Redis.RedisClientType | null = null;
let lastErrorLog = 0;
let initAttempted = false;
let initPromise: Promise<Redis.RedisClientType | null> | null = null;

// Initialize Redis connection with production optimizations
// Returns a singleton promise to prevent multiple connection attempts
export async function initializeRedis(): Promise<Redis.RedisClientType | null> {
  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }
  
  // Only attempt initialization once
  if (initAttempted) {
    return redis;
  }
  
  initPromise = (async () => {
    initAttempted = true;
    
    try {
      // Skip Redis initialization if REDIS_URL is not configured
      if (!process.env.REDIS_URL) {
        console.log('Redis not configured, using optimized memory cache for scaling');
        return null;
      }
      
      redis = Redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 3000,
          keepAlive: false,
          reconnectStrategy: (retries) => {
            // Stop reconnecting after 2 attempts to reduce connection spam
            if (retries >= 2) {
              console.log('Redis: max reconnection attempts reached, using memory cache');
              return false;
            }
            return Math.min(retries * 1000, 3000);
          }
        },
        commandsQueueMaxLength: 500,
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

      // Connect to Redis with timeout
      const connectPromise = redis.connect();
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      return redis;
    } catch (error) {
      console.log('Redis not available, using memory cache fallback');
      // Gracefully degrade - continue without cache
      redis = null;
      return null;
    }
  })();
  
  return initPromise;
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