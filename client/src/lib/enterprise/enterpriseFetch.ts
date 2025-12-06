/**
 * Enterprise Fetch Pipeline
 * Composition: cacheKeyBuilder → enhancedCache → requestScheduler → circuitBreaker → performanceMonitor → fetch
 */

import { buildCacheKey } from './cacheKeyBuilder';
import { enhancedCache } from './enhancedCache';
import { requestScheduler } from './requestScheduler';
import { circuitBreaker } from './circuitBreaker';
import { performanceMonitor } from './performanceMonitor';
import { buildApiUrl } from '../apiConfig';

interface EnterpriseFetchOptions extends RequestInit {
  skipCache?: boolean;
  skipDisk?: boolean;
  cacheTTL?: number;
  priority?: 'critical' | 'normal' | 'low';
}

/**
 * Enterprise-optimized fetch wrapper
 * Integrates all optimization layers
 */
export async function enterpriseFetch<T = any>(
  url: string,
  options: EnterpriseFetchOptions = {}
): Promise<T> {
  const {
    skipCache = false,
    skipDisk = false,
    cacheTTL,
    priority = 'normal',
    ...fetchOptions
  } = options;

  // Build the full URL with API base for cross-origin requests (AWS Amplify → Replit backend)
  const fullUrl = url.startsWith('/api') ? buildApiUrl(url) : url;

  // Only cache GET requests
  const isGET = !fetchOptions.method || fetchOptions.method === 'GET';
  const shouldCache = isGET && !skipCache;

  // Build cache key (ensure method is included to prevent POST/DELETE/GET collisions)
  const cacheKey = buildCacheKey(url, {
    ...fetchOptions,
    method: fetchOptions.method || 'GET'
  });
  
  // Debug logging for cache key (only for auth/user endpoint)
  if (url.includes('/api/auth/user')) {
    console.log('[EnterpriseFetch] Cache key for', url, ':', cacheKey);
    console.log('[EnterpriseFetch] Fetch options:', fetchOptions);
  }

  // Define the actual fetch function
  const fetchFn = async (): Promise<T> => {
    // Use request scheduler for deduplication
    return requestScheduler.deduplicatedRequest(
      cacheKey,
      async () => {
        // Use circuit breaker for resilience
        return circuitBreaker.execute(
          url,
          async () => {
            // Use performance monitor for tracking
            return performanceMonitor.trackApiCall(
              url,
              async () => {
                const res = await fetch(fullUrl, {
                  ...fetchOptions,
                  credentials: fetchOptions.credentials || 'include',
                });

                if (!res.ok) {
                  const text = (await res.text()) || res.statusText;
                  throw new Error(`${res.status}: ${text}`);
                }

                return await res.json();
              },
              { expectedDuration: 1000 }
            );
          },
          // Fallback: try to get from cache if circuit is open
          shouldCache
            ? async () => {
                const cached = await enhancedCache.get<T>(cacheKey);
                // Check for undefined (missing) vs falsy but valid (0, false, [], etc.)
                if (cached !== undefined) {
                  console.log(`[EnterpriseFetch] Using cache fallback for ${url}`);
                  performanceMonitor.trackCacheHit(true);
                  return cached;
                }
                throw new Error('No cache fallback available');
              }
            : undefined
        );
      },
      priority
    );
  };

  // Use enhanced cache with SWR pattern for GET requests
  if (shouldCache) {
    return enhancedCache.swr(
      cacheKey,
      fetchFn,
      {
        diskTTL: cacheTTL,
        skipDisk: skipDisk,
      }
    );
  }

  // For non-GET requests, just execute
  return fetchFn();
}

/**
 * API request wrapper with enterprise optimizations
 * Compatible with existing apiRequest signature
 */
export async function enterpriseApiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  return enterpriseFetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    skipCache: method !== 'GET', // Only cache GET requests
    priority: method === 'GET' ? 'normal' : 'critical', // Mutations are critical
  });
}
