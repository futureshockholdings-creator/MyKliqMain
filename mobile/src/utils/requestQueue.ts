/**
 * Offline Request Queue
 * 
 * Queues failed API requests when offline and automatically retries them
 * when network connection is restored. Ensures data integrity and user
 * actions are not lost due to connectivity issues.
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Priority queue support
 * - Persistent storage across app restarts
 * - Background sync when connection restores
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://c7dd138c-576d-4490-a426-c0be6e6124ca-00-1u3lut3kqrgq6.kirk.replit.dev';

const QUEUE_KEY = 'request_queue';
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000; // 1 second

/**
 * Queued request interface
 */
export interface QueuedRequest {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  timestamp: number;
  retryCount: number;
  nextRetryAt: number; // Timestamp when next retry should be attempted
  priority: 'high' | 'normal' | 'low';
  description?: string; // User-friendly description for debugging
}

/**
 * Request Queue Manager
 */
class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private listeners: Array<(queue: QueuedRequest[]) => void> = [];

  constructor() {
    this.loadQueue();
  }

  /**
   * Load queue from persistent storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        const loadedQueue: QueuedRequest[] = JSON.parse(stored);
        
        // Backfill nextRetryAt for legacy queue entries
        this.queue = loadedQueue.map(request => {
          if (request.nextRetryAt === undefined || request.nextRetryAt === null) {
            // Calculate next retry time based on current retry count
            if (request.retryCount === 0) {
              // First attempt can retry immediately
              request.nextRetryAt = Date.now();
            } else {
              // Subsequent attempts: apply exponential backoff from now
              const backoffDelay = BASE_RETRY_DELAY * Math.pow(2, request.retryCount);
              request.nextRetryAt = Date.now() + backoffDelay;
            }
            console.log(`[RequestQueue] Backfilled nextRetryAt for legacy request: ${request.description || request.endpoint} (retry ${request.retryCount}/${MAX_RETRIES})`);
          }
          return request;
        });
        
        // Save updated queue with backfilled timestamps
        await this.saveQueue();
        this.notifyListeners();
      }
    } catch (error) {
      console.error('[RequestQueue] Failed to load queue:', error);
    }
  }

  /**
   * Save queue to persistent storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('[RequestQueue] Failed to save queue:', error);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Add request to queue
   */
  async add(
    endpoint: string,
    method: QueuedRequest['method'],
    body?: any,
    priority: QueuedRequest['priority'] = 'normal',
    description?: string
  ): Promise<string> {
    const request: QueuedRequest = {
      id: this.generateId(),
      endpoint,
      method,
      body,
      timestamp: Date.now(),
      retryCount: 0,
      nextRetryAt: Date.now(), // Can retry immediately on first attempt
      priority,
      description,
    };

    // Check for duplicate requests
    const isDuplicate = this.queue.some(
      r => r.endpoint === endpoint && r.method === method && JSON.stringify(r.body) === JSON.stringify(body)
    );

    if (!isDuplicate) {
      this.queue.push(request);
      await this.saveQueue();
      console.log(`[RequestQueue] Added request: ${description || endpoint}`);
    }

    return request.id;
  }

  /**
   * Remove request from queue
   */
  async remove(id: string): Promise<void> {
    this.queue = this.queue.filter(r => r.id !== id);
    await this.saveQueue();
  }

  /**
   * Clear entire queue
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Get all queued requests
   */
  getAll(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  getSize(): number {
    return this.queue.length;
  }

  /**
   * Process queue (retry all failed requests)
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`[RequestQueue] Processing ${this.queue.length} queued requests...`);

    // Sort by priority (high → normal → low) and timestamp (oldest first)
    const sortedQueue = [...this.queue].sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    for (const request of sortedQueue) {
      try {
        // Skip if max retries exceeded
        if (request.retryCount >= MAX_RETRIES) {
          console.warn(`[RequestQueue] Max retries exceeded for: ${request.description || request.endpoint}`);
          await this.remove(request.id);
          results.skipped++;
          continue;
        }

        // Skip if not yet time to retry (respect exponential backoff)
        const now = Date.now();
        if (now < request.nextRetryAt) {
          console.log(`[RequestQueue] Skipping ${request.description || request.endpoint} - retry scheduled for ${new Date(request.nextRetryAt).toISOString()}`);
          results.skipped++;
          continue;
        }

        // Get auth token
        const token = await SecureStore.getItemAsync('jwt_token');
        
        // Direct HTTP call to avoid circular dependency with apiClient
        const response = await fetch(`${API_URL}${request.endpoint}`, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        console.log(`[RequestQueue] ✅ Successfully retried: ${request.description || request.endpoint}`);
        await this.remove(request.id);
        results.success++;
      } catch (error) {
        console.error(`[RequestQueue] ❌ Failed to retry: ${request.description || request.endpoint}`, error);
        
        // Calculate next retry time with exponential backoff
        const index = this.queue.findIndex(r => r.id === request.id);
        if (index !== -1) {
          const newRetryCount = this.queue[index].retryCount + 1;
          const backoffDelay = BASE_RETRY_DELAY * Math.pow(2, newRetryCount);
          
          this.queue[index].retryCount = newRetryCount;
          this.queue[index].nextRetryAt = Date.now() + backoffDelay;
          
          console.log(`[RequestQueue] Will retry ${request.description || request.endpoint} in ${backoffDelay}ms (attempt ${newRetryCount}/${MAX_RETRIES})`);
          await this.saveQueue();
        }
        
        results.failed++;
      }
    }

    this.isProcessing = false;
    console.log(`[RequestQueue] Processing complete:`, results);
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: QueuedRequest[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.queue]));
  }
}

// Export singleton instance
export const requestQueue = new RequestQueue();

/**
 * Convenience functions for common operations
 */

// Add like action to queue
export const queueLike = (postId: string): Promise<string> => {
  return requestQueue.add(
    `/api/mobile/posts/${postId}/like`,
    'POST',
    undefined,
    'high',
    `Like post ${postId}`
  );
};

// Add comment to queue
export const queueComment = (postId: string, content: string): Promise<string> => {
  return requestQueue.add(
    `/api/mobile/posts/${postId}/comments`,
    'POST',
    { content },
    'high',
    `Comment on post ${postId}`
  );
};

// Add post to queue
export const queuePost = (content: string, mediaUrl?: string): Promise<string> => {
  return requestQueue.add(
    '/api/mobile/posts',
    'POST',
    { content, mediaUrl },
    'high',
    'Create post'
  );
};

// Add message to queue
export const queueMessage = (friendId: string, content: string, mediaUrl?: string): Promise<string> => {
  return requestQueue.add(
    `/api/mobile/messages/${friendId}`,
    'POST',
    { content, mediaUrl },
    'high',
    `Message to friend ${friendId}`
  );
};

// Add streak check-in to queue
export const queueStreakCheckIn = (): Promise<string> => {
  return requestQueue.add(
    '/api/mobile/streak/checkin',
    'POST',
    undefined,
    'high',
    'Streak check-in'
  );
};
