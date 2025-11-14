/**
 * Simple LRU Cache Implementation
 * No external dependencies - pure JavaScript
 */

interface CacheEntry<T> {
  value: T;
  size: number;
  timestamp: number;
}

export class SimpleLRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private currentSize: number = 0;
  private ttl: number;

  constructor(options: {
    maxSize: number; // in bytes
    ttl: number; // in milliseconds
  }) {
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
  }

  /**
   * Get item from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    // Move to end (mark as recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set item in cache
   */
  set(key: string, value: T): void {
    // Calculate size
    const size = this.calculateSize(value);

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Evict old entries if necessary
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictOldest();
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      value,
      size,
      timestamp: Date.now(),
    };

    this.cache.set(key, entry);
    this.currentSize += size;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get total bytes used
   */
  get calculatedSize(): number {
    return this.currentSize;
  }

  /**
   * Evict oldest (least recently used) entry
   */
  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.delete(firstKey);
    }
  }

  /**
   * Calculate size of value in bytes
   */
  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 1000; // Default size if can't stringify
    }
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }
}
