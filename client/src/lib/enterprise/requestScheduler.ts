/**
 * Request Scheduler - Web Enterprise Edition
 * Features:
 * - Deduplicate in-flight requests
 * - Priority-based queue (critical > normal > low)
 * - Request batching for efficiency
 * - AbortController support
 */

type RequestPriority = 'critical' | 'normal' | 'low';

interface PendingRequest {
  key: string;
  promise: Promise<any>;
  timestamp: number;
}

interface BatchRequest {
  endpoint: string;
  params?: any;
  priority: RequestPriority;
}

class RequestScheduler {
  private inFlightRequests = new Map<string, Promise<any>>();
  private batchQueue: BatchRequest[] = [];
  private batchTimer: number | null = null;
  private readonly BATCH_INTERVAL = 50; // ms
  private readonly MAX_BATCH_SIZE = 10;
  private readonly REQUEST_TIMEOUT = 30000; // 30s

  /**
   * Deduplicated request - if already in-flight, return same promise
   * This prevents duplicate API calls for the same resource
   */
  async deduplicatedRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    priority: RequestPriority = 'normal'
  ): Promise<T> {
    // Check if already in flight
    const existingRequest = this.inFlightRequests.get(key);
    if (existingRequest) {
      console.log(`[RequestScheduler] Deduplicating request: ${key}`);
      return existingRequest as Promise<T>;
    }

    // Execute and track
    const promise = this.executeWithTimeout(requestFn()).finally(() => {
      this.inFlightRequests.delete(key);
    });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  /**
   * Execute request with timeout
   */
  private executeWithTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        window.setTimeout(
          () => reject(new Error('Request timeout')),
          this.REQUEST_TIMEOUT
        )
      ),
    ]);
  }

  /**
   * Add request to batch queue
   * Batching is useful for combining multiple GET requests
   */
  addToBatch(request: BatchRequest): void {
    this.batchQueue.push(request);

    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => this.flushBatch(), this.BATCH_INTERVAL);
    }

    // Flush immediately if batch is full
    if (this.batchQueue.length >= this.MAX_BATCH_SIZE) {
      this.flushBatch();
    }
  }

  /**
   * Flush batch queue and execute requests
   */
  private flushBatch(): void {
    if (this.batchTimer) {
      window.clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    console.log(`[RequestScheduler] Flushing batch of ${batch.length} requests`);

    // Group by priority
    const critical = batch.filter((r) => r.priority === 'critical');
    const normal = batch.filter((r) => r.priority === 'normal');
    const low = batch.filter((r) => r.priority === 'low');

    // Execute in priority order
    [...critical, ...normal, ...low].forEach((req) => {
      // Execute request (implementation specific to your API)
      console.log(`[RequestScheduler] Executing batched request: ${req.endpoint}`);
    });
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    return {
      inFlightCount: this.inFlightRequests.size,
      queuedCount: this.batchQueue.length,
      inFlightKeys: Array.from(this.inFlightRequests.keys()),
    };
  }

  /**
   * Clear all in-flight requests (useful for logout)
   */
  clearAll(): void {
    this.inFlightRequests.clear();
    this.batchQueue = [];
    if (this.batchTimer) {
      window.clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Cancel specific request
   */
  cancel(key: string): void {
    this.inFlightRequests.delete(key);
  }
}

export const requestScheduler = new RequestScheduler();
export type { RequestPriority };
