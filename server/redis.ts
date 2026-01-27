import { Redis as UpstashRedis } from '@upstash/redis';

let redis: UpstashRedis | null = null;
let initAttempted = false;

export async function initializeRedis(): Promise<UpstashRedis | null> {
  if (initAttempted) {
    return redis;
  }
  
  initAttempted = true;
  
  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.log('Redis not configured, using optimized memory cache for scaling');
      return null;
    }
    
    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (restUrl && restToken) {
      redis = new UpstashRedis({
        url: restUrl,
        token: restToken,
      });
    } else if (redisUrl.startsWith('https://')) {
      redis = new UpstashRedis({
        url: redisUrl,
        token: process.env.REDIS_TOKEN || '',
      });
    } else if (redisUrl.startsWith('rediss://') || redisUrl.startsWith('redis://')) {
      const url = new URL(redisUrl);
      const derivedRestUrl = `https://${url.hostname}`;
      const token = url.password;
      
      redis = new UpstashRedis({
        url: derivedRestUrl,
        token: token,
      });
    } else {
      console.log('Invalid Redis URL format, using memory cache fallback');
      return null;
    }
    
    await redis.ping();
    console.log('✅ Upstash Redis connected successfully (HTTP mode)');
    
    return redis;
  } catch (error) {
    console.log('Redis not available, using memory cache fallback');
    redis = null;
    return null;
  }
}

export function getRedisClient() {
  return redis;
}

export async function setCache(key: string, value: any, ttlSeconds = 300): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Redis SET error:', error);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  
  try {
    const cached = await redis.get(key);
    if (cached === null) return null;
    return typeof cached === 'string' ? JSON.parse(cached) : cached as T;
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
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis DELETE PATTERN error:', error);
  }
}

export async function getCachedOrFetch<T>(
  key: string, 
  fetchFunction: () => Promise<T>, 
  ttlSeconds = 300
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  const data = await fetchFunction();
  await setCache(key, data, ttlSeconds);
  
  return data;
}

initializeRedis().catch(console.error);
