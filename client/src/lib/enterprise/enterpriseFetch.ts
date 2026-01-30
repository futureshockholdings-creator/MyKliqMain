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
import { getAuthToken, removeAuthToken, isTokenExpired, getUserIdFromToken } from '../tokenStorage';

interface EnterpriseFetchOptions extends Omit<RequestInit, 'priority'> {
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

  // Get userId from token for user-specific cache keys (prevents cross-user cache leakage)
  const userId = getUserIdFromToken();

  // Build cache key (ensure method is included to prevent POST/DELETE/GET collisions)
  // Include userId for user-specific endpoints to prevent cross-user data leakage
  const cacheKey = buildCacheKey(url, {
    ...fetchOptions,
    method: fetchOptions.method || 'GET'
  }, userId);
  
  // Debug logging for cache key (only for auth/user endpoint)
  if (url.includes('/api/auth/user')) {
    console.log('[EnterpriseFetch] Cache key for', url, ':', cacheKey);
    console.log('[EnterpriseFetch] Fetch options:', fetchOptions);
  }

  // Define the core fetch logic (without deduplication wrapper)
  const coreFetch = async (): Promise<T> => {
    // Use circuit breaker for resilience
    return circuitBreaker.execute(
      url,
      async () => {
        // Use performance monitor for tracking
        return performanceMonitor.trackApiCall(
          url,
          async () => {
            // Include Authorization header if we have a valid token (for cross-domain auth)
            const token = getAuthToken();
            const headers = new Headers(fetchOptions.headers as HeadersInit || {});
            
            // Only attach token if it's not expired
            if (token && !isTokenExpired(token) && !headers.has('Authorization')) {
              headers.set('Authorization', `Bearer ${token}`);
            } else if (token && isTokenExpired(token)) {
              // Token is expired, clear it
              console.log('[EnterpriseFetch] Clearing expired token');
              removeAuthToken();
            }
            
            // Disable browser HTTP cache for feed and user endpoints to ensure fresh data
            const shouldBypassBrowserCache = url.includes('/api/kliq-feed') || 
                                              url.includes('/api/posts') ||
                                              url.includes('/api/notifications') ||
                                              url.includes('/api/auth/user');
            
            const res = await fetch(fullUrl, {
              ...fetchOptions,
              headers,
              credentials: fetchOptions.credentials || 'include',
              cache: shouldBypassBrowserCache ? 'no-store' : (fetchOptions.cache || 'default'),
            });

            if (!res.ok) {
              // Handle 401 by clearing invalid token
              if (res.status === 401) {
                const currentToken = getAuthToken();
                if (currentToken) {
                  console.log('[EnterpriseFetch] Received 401, clearing invalid token');
                  removeAuthToken();
                }
              }
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
  };

  // Define the actual fetch function with optional deduplication
  const fetchFn = async (): Promise<T> => {
    // Only deduplicate GET requests - POST/PUT/DELETE should never be deduplicated
    // as they create new resources (e.g., upload URLs must be unique per file)
    if (isGET) {
      return requestScheduler.deduplicatedRequest(cacheKey, coreFetch, priority);
    }
    // For mutations, skip deduplication entirely
    return coreFetch();
  };

  // Use enhanced cache with SWR pattern for GET requests
  if (shouldCache) {
    // Notifications need real-time updates, skip memory cache (5 min TTL too long)
    // This ensures alerts show within 15-25 seconds instead of up to 5 minutes
    const isNotificationEndpoint = url.includes('/api/notifications');
    
    return enhancedCache.swr(
      cacheKey,
      fetchFn,
      {
        diskTTL: cacheTTL,
        skipDisk: skipDisk,
        skipMemory: isNotificationEndpoint, // Skip 5-minute memory cache for notifications
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
