// Simple in-memory cache for frequently accessed data
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache: Map<string, CacheItem> = new Map();
  private maxSize: number = 1000; // Prevent memory leaks

  set(key: string, data: any, ttlMs: number = 300000): void { // Default 5 minutes TTL
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired items periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Global cache instance
export const cache = new SimpleCache();

// Clean up expired items every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// Cache helper functions for common patterns
export function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = 300000
): Promise<T> {
  const cached = cache.get(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return fetchFn().then(data => {
    cache.set(key, data, ttlMs);
    return data;
  });
}

export function invalidateCache(pattern: string): void {
  const keys = Array.from(cache['cache'].keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}