/**
 * Memory Manager - Enterprise Edition
 * Features:
 * - Memory usage monitoring
 * - Component cleanup helpers
 * - Memory pressure detection
 * - Automatic garbage collection triggers
 */

import { useEffect, useRef } from 'react';

interface CleanupHelper {
  signal: AbortSignal;
  addTimer: (timer: NodeJS.Timeout) => void;
  addListener: (cleanup: () => void) => void;
  cleanup: () => void;
}

class MemoryManager {
  private readonly WARNING_THRESHOLD_MB = 300; // 300MB
  private readonly CRITICAL_THRESHOLD_MB = 450; // 450MB
  private monitoringInterval: NodeJS.Timeout | null = null;
  private memoryWarnings = 0;
  private memoryPeakMB = 0;

  /**
   * Start monitoring memory usage
   */
  startMonitoring(): void {
    if (this.monitoringInterval) return;

    console.log('[MemoryManager] Starting memory monitoring...');

    this.monitoringInterval = setInterval(() => {
      const stats = this.getMemoryStats();

      // Track peak usage
      if (stats.usedMB > this.memoryPeakMB) {
        this.memoryPeakMB = stats.usedMB;
      }

      // Warning threshold
      if (stats.usedMB > this.WARNING_THRESHOLD_MB) {
        this.memoryWarnings++;
        console.warn(
          `⚠️ High memory usage: ${stats.usedMB.toFixed(0)}MB (Peak: ${this.memoryPeakMB.toFixed(0)}MB)`
        );
      }

      // Critical threshold - trigger cleanup
      if (stats.usedMB > this.CRITICAL_THRESHOLD_MB) {
        console.error(
          `🚨 CRITICAL memory usage: ${stats.usedMB.toFixed(0)}MB - triggering cleanup`
        );
        this.triggerMemoryCleanup();
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): {
    usedMB: number;
    totalMB: number;
    limitMB: number;
    peakMB: number;
    warnings: number;
  } {
    let usedMB = 0;
    let totalMB = 0;
    let limitMB = 0;

    // Try to get performance.memory (available in some environments)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      usedMB = memory.usedJSHeapSize / 1024 / 1024;
      totalMB = memory.totalJSHeapSize / 1024 / 1024;
      limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
    }

    return {
      usedMB,
      totalMB,
      limitMB,
      peakMB: this.memoryPeakMB,
      warnings: this.memoryWarnings,
    };
  }

  /**
   * Trigger memory cleanup actions
   */
  private triggerMemoryCleanup(): void {
    console.log('[MemoryManager] Triggering memory cleanup...');

    // Clear caches if available
    if (global.__ENHANCED_CACHE__) {
      console.log('[MemoryManager] Clearing memory cache...');
      global.__ENHANCED_CACHE__.memoryCache?.clear();
    }

    // Force garbage collection if available
    if (global.gc) {
      console.log('[MemoryManager] Running garbage collection...');
      global.gc();
    }
  }

  /**
   * Create cleanup helper for components
   */
  createCleanup(): CleanupHelper {
    const abortController = new AbortController();
    const timers: NodeJS.Timeout[] = [];
    const listeners: Array<() => void> = [];

    return {
      signal: abortController.signal,

      addTimer: (timer: NodeJS.Timeout) => {
        timers.push(timer);
      },

      addListener: (cleanup: () => void) => {
        listeners.push(cleanup);
      },

      cleanup: () => {
        // Abort ongoing requests
        abortController.abort();

        // Clear all timers
        timers.forEach((timer) => clearTimeout(timer));
        timers.length = 0;

        // Run custom cleanup functions
        listeners.forEach((fn) => {
          try {
            fn();
          } catch (error) {
            console.error('[MemoryManager] Cleanup function failed:', error);
          }
        });
        listeners.length = 0;
      },
    };
  }

  /**
   * Get monitoring summary
   */
  getSummary() {
    const stats = this.getMemoryStats();
    return {
      ...stats,
      isMonitoring: this.monitoringInterval !== null,
      status:
        stats.usedMB > this.CRITICAL_THRESHOLD_MB
          ? 'CRITICAL'
          : stats.usedMB > this.WARNING_THRESHOLD_MB
          ? 'WARNING'
          : 'OK',
    };
  }
}

export const memoryManager = new MemoryManager();

/**
 * React Hook for automatic component cleanup
 * Usage in functional components:
 * 
 * const cleanup = useMemoryCleanup();
 * 
 * useEffect(() => {
 *   // Fetch with abort signal
 *   fetch(url, { signal: cleanup.signal });
 *   
 *   // Track timer
 *   const timer = setInterval(() => {...}, 1000);
 *   cleanup.addTimer(timer);
 *   
 *   // Custom cleanup
 *   cleanup.addListener(() => unsubscribe());
 * }, []);
 */
export function useMemoryCleanup(): CleanupHelper {
  const cleanupRef = useRef(memoryManager.createCleanup());

  useEffect(() => {
    return () => {
      cleanupRef.current.cleanup();
    };
  }, []);

  return cleanupRef.current;
}
