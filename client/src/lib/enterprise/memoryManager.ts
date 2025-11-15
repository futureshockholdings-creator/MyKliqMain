/**
 * Memory Manager - Web Enterprise Edition
 * Monitors browser memory using Performance API
 * Triggers cleanup on low memory conditions
 */

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

class MemoryManager {
  private readonly WARNING_THRESHOLD = 0.85; // Warn at 85% usage
  private readonly CRITICAL_THRESHOLD = 0.95; // Critical at 95% usage
  private monitorInterval: number | null = null;
  private readonly MONITOR_INTERVAL_MS = 30000; // 30s
  private cleanupCallbacks: Array<() => void> = [];
  
  /**
   * Start monitoring memory usage
   */
  startMonitoring(): void {
    if (this.monitorInterval) return;

    this.monitorInterval = window.setInterval(() => {
      this.checkMemory();
    }, this.MONITOR_INTERVAL_MS);

    console.log('[MemoryManager] Started monitoring');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      window.clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log('[MemoryManager] Stopped monitoring');
    }
  }

  /**
   * Check current memory usage
   */
  private checkMemory(): void {
    const stats = this.getMemoryStats();
    if (!stats) return;

    const { usagePercentage, usedJSHeapSize, jsHeapSizeLimit } = stats;

    if (usagePercentage >= this.CRITICAL_THRESHOLD) {
      console.error(
        `🚨 CRITICAL memory usage: ${usagePercentage.toFixed(1)}% (${this.formatBytes(usedJSHeapSize)}/${this.formatBytes(jsHeapSizeLimit)})`
      );
      this.triggerCleanup('critical');
    } else if (usagePercentage >= this.WARNING_THRESHOLD) {
      console.warn(
        `⚠️ HIGH memory usage: ${usagePercentage.toFixed(1)}% (${this.formatBytes(usedJSHeapSize)}/${this.formatBytes(jsHeapSizeLimit)})`
      );
      this.triggerCleanup('warning');
    }
  }

  /**
   * Get memory statistics (browser-specific)
   */
  getMemoryStats(): MemoryStats | null {
    // Check if performance.memory is available (Chrome/Edge)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage,
      };
    }

    // Fallback: estimate based on deviceMemory if available
    if ('deviceMemory' in navigator) {
      const deviceMemory = (navigator as any).deviceMemory; // GB
      console.log(`[MemoryManager] Device has ~${deviceMemory}GB RAM`);
    }

    return null;
  }

  /**
   * Register cleanup callback
   */
  onCleanup(callback: () => void): () => void {
    this.cleanupCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.cleanupCallbacks = this.cleanupCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Trigger cleanup callbacks
   */
  private triggerCleanup(severity: 'warning' | 'critical'): void {
    console.log(`[MemoryManager] Triggering ${severity} cleanup (${this.cleanupCallbacks.length} callbacks)`);
    this.cleanupCallbacks.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('[MemoryManager] Cleanup callback failed:', e);
      }
    });
  }

  /**
   * Format bytes to human-readable
   */
  private formatBytes(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  }

  /**
   * Get summary for monitoring
   */
  getSummary(): string {
    const stats = this.getMemoryStats();
    if (!stats) {
      return 'Memory monitoring not available in this browser';
    }

    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit, usagePercentage } = stats;

    return `
💾 Memory Usage
━━━━━━━━━━━━━━━━━━━━━━━━━━
Used: ${this.formatBytes(usedJSHeapSize)}
Total: ${this.formatBytes(totalJSHeapSize)}
Limit: ${this.formatBytes(jsHeapSizeLimit)}
Usage: ${usagePercentage.toFixed(1)}%
Status: ${usagePercentage >= this.CRITICAL_THRESHOLD ? 'CRITICAL' : usagePercentage >= this.WARNING_THRESHOLD ? 'WARNING' : 'OK'}
    `.trim();
  }
}

export const memoryManager = new MemoryManager();

/**
 * React hook for automatic cleanup on unmount
 */
export function useMemoryCleanup(cleanup?: () => void): () => void {
  // Register cleanup callback
  const unsubscribe = cleanup ? memoryManager.onCleanup(cleanup) : () => {};

  // Return cleanup function that component can call on unmount
  return () => {
    unsubscribe();
    if (cleanup) cleanup();
  };
}
