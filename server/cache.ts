// Simple in-memory cache for frequently accessed data
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache: Map<string, CacheItem> = new Map();
  private maxSize: number = 5000; // Massive cache size for maximum performance

  // Public method to access cache keys for invalidation
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  set(key: string, data: any, ttlMs: number = 300000): void { // Default 5 minutes TTL
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
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
    const entries = Array.from(this.cache.entries());
    for (const [key, item] of entries) {
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

// Clean up expired items every 2 minutes for better memory management
setInterval(() => {
  cache.cleanup();
  console.log(`Cache stats: ${JSON.stringify(getCacheStats())}`);
}, 2 * 60 * 1000);

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
  const keys = cache.getKeys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

// Add cache performance monitoring
export function getCacheStats() {
  return cache.getStats();
}