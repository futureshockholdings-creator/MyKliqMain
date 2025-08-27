// Advanced memory optimization and garbage collection management
import { performance } from 'perf_hooks';

interface MemoryPool<T> {
  available: T[];
  inUse: Set<T>;
  factory: () => T;
  reset: (obj: T) => void;
  maxSize: number;
}

class MemoryOptimizer {
  private pools: Map<string, MemoryPool<any>> = new Map();
  private gcMetrics = {
    lastGC: Date.now(),
    gcCount: 0,
    memoryBeforeGC: 0,
    memoryAfterGC: 0
  };

  // Create object pool to reduce memory allocation
  createPool<T>(
    name: string,
    factory: () => T,
    reset: (obj: T) => void,
    maxSize = 100
  ): void {
    this.pools.set(name, {
      available: [],
      inUse: new Set(),
      factory,
      reset,
      maxSize
    });
  }

  // Get object from pool
  acquire<T>(poolName: string): T {
    const pool = this.pools.get(poolName) as MemoryPool<T>;
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    let obj: T;
    if (pool.available.length > 0) {
      obj = pool.available.pop()!;
    } else {
      obj = pool.factory();
    }

    pool.inUse.add(obj);
    return obj;
  }

  // Return object to pool
  release<T>(poolName: string, obj: T): void {
    const pool = this.pools.get(poolName) as MemoryPool<T>;
    if (!pool) return;

    pool.inUse.delete(obj);
    
    if (pool.available.length < pool.maxSize) {
      pool.reset(obj);
      pool.available.push(obj);
    }
  }

  // Force garbage collection when memory is high
  forceGarbageCollection(): void {
    const memBefore = process.memoryUsage().heapUsed;
    
    if (global.gc) {
      global.gc();
      
      const memAfter = process.memoryUsage().heapUsed;
      const freed = Math.round((memBefore - memAfter) / 1024 / 1024);
      
      this.gcMetrics = {
        lastGC: Date.now(),
        gcCount: this.gcMetrics.gcCount + 1,
        memoryBeforeGC: Math.round(memBefore / 1024 / 1024),
        memoryAfterGC: Math.round(memAfter / 1024 / 1024)
      };

      if (freed > 50) { // Only log if significant memory freed
        console.log(`🗑️ GC freed ${freed}MB (${this.gcMetrics.memoryBeforeGC}MB → ${this.gcMetrics.memoryAfterGC}MB)`);
      }
    }
  }

  // Optimize string operations to reduce memory usage
  createStringOptimizer() {
    const cache = new Map<string, string>();
    const maxCacheSize = 1000;

    return {
      intern(str: string): string {
        if (cache.has(str)) {
          return cache.get(str)!;
        }

        if (cache.size >= maxCacheSize) {
          // Remove oldest entry
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }

        cache.set(str, str);
        return str;
      },
      
      clear(): void {
        cache.clear();
      }
    };
  }

  // Memory-efficient array operations
  createArrayPool<T>(maxSize = 100): {
    get: () => T[];
    release: (arr: T[]) => void;
  } {
    const pool: T[][] = [];

    return {
      get: (): T[] => {
        return pool.pop() || [];
      },
      
      release: (arr: T[]): void => {
        if (pool.length < maxSize) {
          arr.length = 0; // Clear array efficiently
          pool.push(arr);
        }
      }
    };
  }

  // Monitor memory usage and trigger optimization
  monitorMemory(): void {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    // Trigger GC if memory usage is high
    if (heapUsedMB > 600) {
      console.warn(`🚨 High memory usage: ${heapUsedMB}MB/${heapTotalMB}MB`);
      this.forceGarbageCollection();
    }

    // Clear object pools if memory pressure is extreme
    if (heapUsedMB > 800) {
      this.clearAllPools();
      console.log('🧹 Cleared all object pools due to memory pressure');
    }
  }

  // Clear all object pools
  clearAllPools(): void {
    this.pools.forEach((pool, name) => {
      pool.available.length = 0;
      pool.inUse.clear();
    });
  }

  // Get memory statistics
  getMemoryStats() {
    const memUsage = process.memoryUsage();
    const poolStats = Array.from(this.pools.entries()).map(([name, pool]) => ({
      name,
      available: pool.available.length,
      inUse: pool.inUse.size,
      maxSize: pool.maxSize
    }));

    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      },
      pools: poolStats,
      gc: this.gcMetrics
    };
  }
}

export const memoryOptimizer = new MemoryOptimizer();

// Initialize common object pools
memoryOptimizer.createPool(
  'queryResults',
  () => [],
  (arr: any[]) => { arr.length = 0; },
  200
);

memoryOptimizer.createPool(
  'requestObjects',
  () => ({}),
  (obj: any) => {
    for (const key in obj) {
      delete obj[key];
    }
  },
  150
);

// Monitor memory every 60 seconds
setInterval(() => {
  memoryOptimizer.monitorMemory();
}, 60000);

// String optimizer for frequently used strings
export const stringOptimizer = memoryOptimizer.createStringOptimizer();

// Array pool for temporary arrays
export const arrayPool = memoryOptimizer.createArrayPool(50);