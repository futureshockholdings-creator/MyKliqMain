/**
 * Enhanced Cache - Web Enterprise Edition
 * Features:
 * - Two-tier: Memory (LRU) + IndexedDB (via localForage)
 * - Size governor (max 15MB per user)
 * - Stale-while-revalidate support
 * - Automatic eviction with metrics
 */

import { SimpleLRUCache } from './SimpleLRUCache';
import localforage from 'localforage';

interface CacheStats {
  memorySize: number;
  memoryBytes: number;
  diskBytes: number;
  memoryHits: number;
  memoryMisses: number;
  diskHits: number;
  diskMisses: number;
  totalRequests: number;
}

interface CacheOptions {
  memoryTTL?: number;
  diskTTL?: number;
  skipMemory?: boolean;
  skipDisk?: boolean;
}

interface DiskCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class EnhancedCache {
  // Memory tier - fast, limited capacity (5MB)
  private memoryCache = new SimpleLRUCache<any>({
    maxSize: 5 * 1024 * 1024, // 5MB
    ttl: 5 * 60 * 1000, // 5 minutes
  });

  // Disk tier using IndexedDB (via localForage)
  private diskCache = localforage.createInstance({
    name: 'MyKliq',
    storeName: 'enterprise_cache',
    description: 'Enterprise-grade caching for 20k+ users'
  });
  private diskSize = 0;
  private readonly MAX_DISK_SIZE = 15 * 1024 * 1024; // 15MB

  // Statistics
  private stats: CacheStats = {
    memorySize: 0,
    memoryBytes: 0,
    diskBytes: 0,
    memoryHits: 0,
    memoryMisses: 0,
    diskHits: 0,
    diskMisses: 0,
    totalRequests: 0,
  };

  constructor() {
    // Calculate initial disk size
    this.calculateDiskSize();
  }

  /**
   * Stale-while-revalidate pattern
   * Returns cached data immediately, fetches fresh in background
   */
  async swr<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    this.stats.totalRequests++;

    // 1. Check memory cache (fastest)
    if (!options.skipMemory) {
      const memCached = this.memoryCache.get(key);
      if (memCached !== undefined) {
        console.log(`[EnhancedCache] Memory hit: ${key}`);
        this.stats.memoryHits++;
        
        // Return stale, revalidate in background
        fetchFn()
          .then((fresh) => this.set(key, fresh, options))
          .catch((err) => console.error('[EnhancedCache] Background revalidation failed:', err));
        
        return memCached;
      }
      this.stats.memoryMisses++;
    }

    // 2. Check disk cache (slower)
    if (!options.skipDisk) {
      const diskCached = await this.getDiskCache<T>(key, options.diskTTL);
      if (diskCached) {
        console.log(`[EnhancedCache] Disk hit: ${key}`);
        this.stats.diskHits++;
        
        // Promote to memory
        if (!options.skipMemory) {
          this.memoryCache.set(key, diskCached);
        }
        
        // Revalidate in background
        fetchFn()
          .then((fresh) => this.set(key, fresh, options))
          .catch((err) => console.error('[EnhancedCache] Background revalidation failed:', err));
        
        return diskCached;
      }
      this.stats.diskMisses++;
    }

    // 3. Fetch fresh data
    console.log(`[EnhancedCache] Cache miss: ${key}, fetching...`);
    const fresh = await fetchFn();
    await this.set(key, fresh, options);
    return fresh;
  }

  /**
   * Get from cache (no revalidation)
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    // Check memory first
    if (!options.skipMemory) {
      const memCached = this.memoryCache.get(key);
      if (memCached !== undefined) {
        this.stats.memoryHits++;
        return memCached;
      }
      this.stats.memoryMisses++;
    }

    // Check disk
    if (!options.skipDisk) {
      const diskCached = await this.getDiskCache<T>(key, options.diskTTL);
      if (diskCached) {
        this.stats.diskHits++;
        
        // Promote to memory
        if (!options.skipMemory) {
          this.memoryCache.set(key, diskCached);
        }
        
        return diskCached;
      }
      this.stats.diskMisses++;
    }

    return null;
  }

  /**
   * Set data in both tiers
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    // Memory tier
    if (!options.skipMemory) {
      this.memoryCache.set(key, data);
      this.stats.memorySize = this.memoryCache.size;
      this.stats.memoryBytes = this.memoryCache.calculatedSize;
    }

    // Disk tier with size check
    if (!options.skipDisk) {
      const entry: DiskCacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: options.diskTTL || 60 * 60 * 1000, // 1 hour default
      };

      const serialized = JSON.stringify(entry);
      const size = serialized.length;
      
      // Check if we need to evict
      if (this.diskSize + size > this.MAX_DISK_SIZE) {
        console.warn('[EnhancedCache] Disk limit reached, evicting oldest...');
        await this.evictOldest();
      }

      try {
        await this.diskCache.setItem(key, entry);
        this.diskSize += size;
        this.stats.diskBytes = this.diskSize;
      } catch (e) {
        console.error('[EnhancedCache] Failed to write to IndexedDB:', e);
        // IndexedDB might be full, try evicting
        await this.evictOldest();
        try {
          await this.diskCache.setItem(key, entry);
        } catch (e2) {
          console.error('[EnhancedCache] Still failed after eviction');
        }
      }
    }
  }

  /**
   * Get from disk cache (IndexedDB)
   */
  private async getDiskCache<T>(key: string, ttl?: number): Promise<T | null> {
    try {
      const entry = await this.diskCache.getItem<DiskCacheEntry<T>>(key);
      if (!entry) return null;

      const effectiveTTL = ttl || entry.ttl;

      // Check if expired
      if (Date.now() - entry.timestamp > effectiveTTL) {
        await this.diskCache.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (e) {
      console.error('[EnhancedCache] Failed to read from IndexedDB:', e);
      return null;
    }
  }

  /**
   * Remove from cache
   */
  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.diskCache.removeItem(key);
    await this.calculateDiskSize();
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    await this.diskCache.clear();
    this.diskSize = 0;
    this.resetStats();
  }

  /**
   * Calculate current disk size from IndexedDB
   */
  private async calculateDiskSize(): Promise<void> {
    try {
      let total = 0;
      const keys = await this.diskCache.keys();
      
      for (const key of keys) {
        const entry = await this.diskCache.getItem<DiskCacheEntry<any>>(key);
        if (entry) {
          total += JSON.stringify(entry).length;
        }
      }
      
      this.diskSize = total;
      this.stats.diskBytes = total;
    } catch (e) {
      console.error('[EnhancedCache] Failed to calculate disk size:', e);
    }
  }

  /**
   * Evict oldest disk cache entries (20% of cache)
   */
  private async evictOldest(): Promise<void> {
    try {
      const entries: { key: string; timestamp: number; size: number }[] = [];
      const keys = await this.diskCache.keys();
      
      // Collect all entries with timestamps
      for (const key of keys) {
        try {
          const entry = await this.diskCache.getItem<DiskCacheEntry<any>>(key);
          if (entry) {
            const size = JSON.stringify(entry).length;
            entries.push({
              key,
              timestamp: entry.timestamp || 0,
              size,
            });
          }
        } catch (e) {
          // Invalid entry, remove it
          await this.diskCache.removeItem(key);
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 20%
      const toRemove = Math.ceil(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        await this.diskCache.removeItem(entries[i].key);
      }

      await this.calculateDiskSize();
      console.log('[EnhancedCache] Evicted oldest entries, new size:', this.diskSize);
    } catch (e) {
      console.error('[EnhancedCache] Failed to evict oldest:', e);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): CacheStats & { hitRate: string } {
    const totalHits = this.stats.memoryHits + this.stats.diskHits;
    const totalMisses = this.stats.memoryMisses + this.stats.diskMisses;
    const hitRate =
      totalHits + totalMisses > 0
        ? ((totalHits / (totalHits + totalMisses)) * 100).toFixed(1) + '%'
        : '0%';

    return {
      ...this.stats,
      hitRate,
    };
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      memorySize: 0,
      memoryBytes: 0,
      diskBytes: 0,
      memoryHits: 0,
      memoryMisses: 0,
      diskHits: 0,
      diskMisses: 0,
      totalRequests: 0,
    };
  }
}

export const enhancedCache = new EnhancedCache();
export type { CacheOptions };
