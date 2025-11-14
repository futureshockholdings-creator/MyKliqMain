/**
 * Enterprise Initialization
 * Start all enterprise monitoring and optimization services
 */

import { memoryManager } from './memoryManager';
import { backgroundScheduler } from './backgroundScheduler';
import { performanceMonitor } from './performanceMonitor';

/**
 * Initialize all enterprise services
 * Call this once when the app starts
 */
export function initializeEnterpriseServices(): void {
  console.log('[Enterprise] Initializing optimization services for 20k+ users...');

  // Start memory monitoring
  memoryManager.startMonitoring();
  console.log('[Enterprise] ✅ Memory manager initialized');

  // Initialize background scheduler explicitly
  backgroundScheduler.initialize();
  console.log('[Enterprise] ✅ Background scheduler initialized');

  // Performance monitor is passive, initialized on first use
  console.log('[Enterprise] ✅ Performance monitor initialized');

  // Log initial stats
  setTimeout(() => {
    console.log('[Enterprise] Initial Stats:');
    console.log(memoryManager.getSummary());
    console.log(backgroundScheduler.getStats());
    console.log(performanceMonitor.getSummary());
  }, 5000);
}

/**
 * Get comprehensive performance report
 */
export function getPerformanceReport(): string {
  const memory = memoryManager.getSummary();
  const background = backgroundScheduler.getStats();
  const performance = performanceMonitor.getMetrics();

  return `
🚀 MyKliq Enterprise Performance Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 API Performance:
   Calls: ${performance.apiCalls} (${performance.apiErrors} errors)
   Avg Response: ${performance.avgResponseTime}ms
   P75: ${performance.p75ResponseTime}ms | P95: ${performance.p95ResponseTime}ms
   Slowest: ${performance.slowestEndpoint} (${performance.slowestDuration}ms)

💾 Memory Usage:
   Current: ${memory.usedMB.toFixed(1)}MB / ${memory.limitMB.toFixed(1)}MB
   Peak: ${memory.peakMB.toFixed(1)}MB
   Status: ${memory.status}
   Warnings: ${memory.warnings}

🔄 Background Tasks:
   Total: ${background.totalTasks}
   Running: ${background.runningTasks}
   App State: ${background.isBackground ? 'Background' : 'Foreground'}

Cache Performance:
   Hits: ${performance.cacheHits}
   Misses: ${performance.cacheMisses}
   Hit Rate: ${((performance.cacheHits / (performance.cacheHits + performance.cacheMisses || 1)) * 100).toFixed(1)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: ${new Date().toLocaleString()}
  `.trim();
}

/**
 * Cleanup on app exit
 */
export function cleanupEnterpriseServices(): void {
  console.log('[Enterprise] Cleaning up services...');
  memoryManager.stopMonitoring();
  backgroundScheduler.destroy();
}
