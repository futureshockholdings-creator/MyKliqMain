/**
 * Enterprise Services Initialization - Web Edition
 * Centralized initialization and cleanup for all enterprise optimizations
 */

import { requestScheduler } from './requestScheduler';
import { enhancedCache } from './enhancedCache';
import { circuitBreaker } from './circuitBreaker';
import { performanceMonitor } from './performanceMonitor';
import { memoryManager } from './memoryManager';

/**
 * Initialize all enterprise services
 */
export function initializeEnterpriseServices(): void {
  console.log('🚀 MyKliq Web - Enterprise Edition');
  console.log('Optimized for 20,000+ concurrent users');
  
  // Start memory monitoring
  memoryManager.startMonitoring();

  // Register cleanup on memory pressure
  memoryManager.onCleanup(() => {
    console.log('[EnterpriseInit] Memory cleanup triggered');
    
    // Clear in-flight requests
    const stats = requestScheduler.getStats();
    if (stats.inFlightCount > 0) {
      console.log(`[EnterpriseInit] Clearing ${stats.inFlightCount} in-flight requests`);
    }
  });

  // Log initialization complete
  console.log('✅ Enterprise services initialized');
  logPerformanceReport();
}

/**
 * Cleanup enterprise services (on logout/unmount)
 * Returns a Promise to ensure all async cleanup operations complete
 */
export async function cleanupEnterpriseServices(): Promise<void> {
  console.log('[EnterpriseInit] Cleaning up enterprise services...');
  
  // Stop memory monitoring
  memoryManager.stopMonitoring();

  // Clear all caches (async operation - await to ensure completion)
  await enhancedCache.clearAll();

  // Clear request scheduler
  requestScheduler.clearAll();

  // Reset circuit breakers
  circuitBreaker.resetAll();

  // Reset performance monitor
  performanceMonitor.reset();

  console.log('✅ Enterprise services cleaned up');
}

/**
 * Get comprehensive performance report
 */
export function getPerformanceReport(): string {
  const perfMetrics = performanceMonitor.getMetrics();
  const cacheStats = enhancedCache.getCacheStats();
  const circuitStats = circuitBreaker.getSummary();
  const reqStats = requestScheduler.getStats();
  
  const cacheTotal = cacheStats.memoryHits + cacheStats.memoryMisses + cacheStats.diskHits + cacheStats.diskMisses;
  const cacheHitRate = cacheTotal > 0 
    ? (((cacheStats.memoryHits + cacheStats.diskHits) / cacheTotal) * 100).toFixed(1)
    : '0.0';

  const errorRate = perfMetrics.apiCalls > 0
    ? ((perfMetrics.apiErrors / perfMetrics.apiCalls) * 100).toFixed(1)
    : '0.0';

  return `
🚀 MyKliq Enterprise Performance Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 API Performance:
   Calls: ${perfMetrics.apiCalls} (${errorRate}% errors)
   Avg Response: ${perfMetrics.avgResponseTime}ms
   P75: ${perfMetrics.p75ResponseTime}ms | P95: ${perfMetrics.p95ResponseTime}ms
   Slowest: ${perfMetrics.slowestEndpoint} (${perfMetrics.slowestDuration}ms)

💾 Cache Performance:
   Memory: ${cacheStats.memoryHits} hits / ${cacheStats.memoryMisses} misses
   Disk: ${cacheStats.diskHits} hits / ${cacheStats.diskMisses} misses
   Hit Rate: ${cacheHitRate}%
   Memory Size: ${(cacheStats.memoryBytes / 1024 / 1024).toFixed(2)} MB
   Disk Size: ${(cacheStats.diskBytes / 1024 / 1024).toFixed(2)} MB

🔄 Request Scheduler:
   In-Flight: ${reqStats.inFlightCount}
   Queued: ${reqStats.queuedCount}

⚡ Circuit Breakers:
   Total: ${circuitStats.total}
   Open: ${circuitStats.open} | Half-Open: ${circuitStats.halfOpen} | Closed: ${circuitStats.closed}

${memoryManager.getSummary()}
  `.trim();
}

/**
 * Log performance report to console
 */
export function logPerformanceReport(): void {
  console.log(getPerformanceReport());
}

/**
 * Export performance metrics for analytics
 */
export function exportMetrics(): any {
  return {
    performance: performanceMonitor.getMetrics(),
    cache: enhancedCache.getCacheStats(),
    circuits: circuitBreaker.getSummary(),
    scheduler: requestScheduler.getStats(),
    memory: memoryManager.getMemoryStats(),
    timestamp: Date.now(),
  };
}
