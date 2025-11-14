/**
 * Performance Monitor - Enterprise Edition
 * Tracks:
 * - API response times (TTFB, total)
 * - Cache hit rates
 * - Memory warnings
 * - Network errors
 * - Screen render times
 */

interface ApiCallMetric {
  endpoint: string;
  duration: number;
  success: boolean;
  timestamp: number;
  statusCode?: number;
}

interface PerformanceMetrics {
  apiCalls: number;
  apiErrors: number;
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number;
  p75ResponseTime: number;
  p95ResponseTime: number;
  slowestEndpoint: string;
  slowestDuration: number;
}

class PerformanceMonitor {
  private apiCallHistory: ApiCallMetric[] = [];
  private readonly MAX_HISTORY = 1000;
  
  private metrics = {
    apiCalls: 0,
    apiErrors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalResponseTime: 0,
    slowestEndpoint: '',
    slowestDuration: 0,
  };

  /**
   * Track API call with timing
   */
  async trackApiCall<T>(
    endpoint: string,
    callFn: () => Promise<T>,
    options: { expectedDuration?: number } = {}
  ): Promise<T> {
    const start = Date.now();
    let success = true;
    let statusCode: number | undefined;

    try {
      const result = await callFn();
      const duration = Date.now() - start;

      // Record success
      this.recordApiCall(endpoint, duration, true, statusCode);

      // Warn if slow
      const threshold = options.expectedDuration || 1000;
      if (duration > threshold) {
        console.warn(`⚠️ Slow API call: ${endpoint} took ${duration}ms (expected <${threshold}ms)`);
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - start;
      success = false;
      statusCode = error.statusCode;

      // Record failure
      this.recordApiCall(endpoint, duration, false, statusCode);
      
      throw error;
    }
  }

  /**
   * Record API call metrics
   */
  private recordApiCall(
    endpoint: string,
    duration: number,
    success: boolean,
    statusCode?: number
  ): void {
    // Update counters
    this.metrics.apiCalls++;
    if (!success) {
      this.metrics.apiErrors++;
    }
    this.metrics.totalResponseTime += duration;

    // Track slowest
    if (duration > this.metrics.slowestDuration) {
      this.metrics.slowestDuration = duration;
      this.metrics.slowestEndpoint = endpoint;
    }

    // Add to history
    this.apiCallHistory.push({
      endpoint,
      duration,
      success,
      timestamp: Date.now(),
      statusCode,
    });

    // Trim history if too large
    if (this.apiCallHistory.length > this.MAX_HISTORY) {
      this.apiCallHistory = this.apiCallHistory.slice(-this.MAX_HISTORY);
    }
  }

  /**
   * Track cache hit/miss
   */
  trackCacheHit(hit: boolean): void {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Calculate percentile response time
   */
  private calculatePercentile(percentile: number): number {
    if (this.apiCallHistory.length === 0) return 0;

    const durations = this.apiCallHistory
      .filter(call => call.success)
      .map(call => call.duration)
      .sort((a, b) => a - b);

    if (durations.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * durations.length) - 1;
    return durations[index] || 0;
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): PerformanceMetrics {
    const avgResponseTime =
      this.metrics.apiCalls > 0
        ? this.metrics.totalResponseTime / this.metrics.apiCalls
        : 0;

    const cacheTotal = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate =
      cacheTotal > 0 ? (this.metrics.cacheHits / cacheTotal) * 100 : 0;

    const errorRate =
      this.metrics.apiCalls > 0
        ? (this.metrics.apiErrors / this.metrics.apiCalls) * 100
        : 0;

    return {
      apiCalls: this.metrics.apiCalls,
      apiErrors: this.metrics.apiErrors,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      avgResponseTime: Math.round(avgResponseTime),
      p75ResponseTime: Math.round(this.calculatePercentile(75)),
      p95ResponseTime: Math.round(this.calculatePercentile(95)),
      slowestEndpoint: this.metrics.slowestEndpoint,
      slowestDuration: this.metrics.slowestDuration,
    };
  }

  /**
   * Get metrics summary as formatted string
   */
  getSummary(): string {
    const metrics = this.getMetrics();
    const cacheTotal = metrics.cacheHits + metrics.cacheMisses;
    const cacheHitRate =
      cacheTotal > 0 ? ((metrics.cacheHits / cacheTotal) * 100).toFixed(1) : '0.0';
    const errorRate =
      metrics.apiCalls > 0
        ? ((metrics.apiErrors / metrics.apiCalls) * 100).toFixed(1)
        : '0.0';

    return `
📊 Performance Metrics
━━━━━━━━━━━━━━━━━━━━━━━━━━
API Calls: ${metrics.apiCalls} (${errorRate}% errors)
Avg Response: ${metrics.avgResponseTime}ms
P75: ${metrics.p75ResponseTime}ms | P95: ${metrics.p95ResponseTime}ms
Slowest: ${metrics.slowestEndpoint} (${metrics.slowestDuration}ms)
Cache Hit Rate: ${cacheHitRate}%
    `.trim();
  }

  /**
   * Get endpoint-specific metrics
   */
  getEndpointMetrics(endpoint: string): {
    calls: number;
    avgDuration: number;
    errorRate: number;
  } {
    const endpointCalls = this.apiCallHistory.filter(
      (call) => call.endpoint === endpoint
    );

    if (endpointCalls.length === 0) {
      return { calls: 0, avgDuration: 0, errorRate: 0 };
    }

    const totalDuration = endpointCalls.reduce(
      (sum, call) => sum + call.duration,
      0
    );
    const errors = endpointCalls.filter((call) => !call.success).length;

    return {
      calls: endpointCalls.length,
      avgDuration: Math.round(totalDuration / endpointCalls.length),
      errorRate: (errors / endpointCalls.length) * 100,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.apiCallHistory = [];
    this.metrics = {
      apiCalls: 0,
      apiErrors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalResponseTime: 0,
      slowestEndpoint: '',
      slowestDuration: 0,
    };
  }

  /**
   * Export metrics for logging/analytics
   */
  exportMetrics(): any {
    return {
      summary: this.getMetrics(),
      history: this.apiCallHistory,
      timestamp: Date.now(),
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
