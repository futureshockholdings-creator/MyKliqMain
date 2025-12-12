/**
 * Safe cache key builder for API requests - Web Edition
 * Handles non-serializable objects like Headers, AbortController, etc.
 */

// User-specific endpoints that should include userId in cache key to prevent cross-user data leakage
// This list should include ANY endpoint that returns user-specific data
const USER_SPECIFIC_ENDPOINTS = [
  '/api/kliq-feed',
  '/api/posts',
  '/api/notifications',
  '/api/stories',
  '/api/friends',
  '/api/messages',
  '/api/events',
  '/api/polls',
  '/api/user',
  '/api/filters',
  '/api/ads/targeted',
  '/api/mood-boost',
  '/api/sports/updates',
  '/api/kliq-koins',
  '/api/social/accounts',
  '/api/calendar',
  '/api/auth/user',
  '/api/scrapbook',
  '/api/meetups',
  '/api/actions',
  '/api/highlights',
  '/api/invite',
  '/api/profile',
];

// Endpoints that are public/non-user-specific and should NOT include userId in cache key
const PUBLIC_ENDPOINTS = [
  '/api/memes',
  '/api/moviecons',
  '/api/gifs',
  '/api/health',
  '/api/version',
];

/**
 * Check if an endpoint is user-specific (requires userId in cache key)
 * Uses a combination of explicit lists and heuristics
 */
function isUserSpecificEndpoint(endpoint: string): boolean {
  // If explicitly marked as public, skip userId
  if (PUBLIC_ENDPOINTS.some(pattern => endpoint.startsWith(pattern))) {
    return false;
  }
  
  // If explicitly marked as user-specific, include userId
  if (USER_SPECIFIC_ENDPOINTS.some(pattern => endpoint.startsWith(pattern))) {
    return true;
  }
  
  // Default heuristic: any /api/ endpoint that's not explicitly public is user-specific
  // This is a safety measure to prevent accidental data leakage
  if (endpoint.startsWith('/api/')) {
    return true;
  }
  
  return false;
}

/**
 * Build a safe cache key from endpoint and request options
 * Extracts only serializable parts (method, headers, body)
 * Includes userId for user-specific endpoints to prevent cross-user cache leakage
 */
export function buildCacheKey(endpoint: string, options: RequestInit = {}, userId?: string | null): string {
  const parts: string[] = [endpoint];
  
  // Include userId in cache key for user-specific endpoints to prevent cross-user data leakage
  if (isUserSpecificEndpoint(endpoint) && userId) {
    parts.push(`uid:${userId}`);
  }

  // Add method if present
  if (options.method) {
    parts.push(`method:${options.method}`);
  }

  // Add serializable headers (convert Headers object to plain object)
  if (options.headers) {
    try {
      const headers: Record<string, string> = {};
      
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (typeof options.headers === 'object') {
        Object.assign(headers, options.headers);
      }

      // Sort keys for consistent cache keys
      const sortedHeaders = Object.keys(headers)
        .sort()
        .map((key) => `${key}:${headers[key]}`)
        .join(',');

      if (sortedHeaders) {
        parts.push(`headers:${sortedHeaders}`);
      }
    } catch (error) {
      // If header extraction fails, skip it
      console.warn('[CacheKeyBuilder] Failed to extract headers:', error);
    }
  }

  // Add body if present (only for POST/PUT/PATCH)
  if (options.body && typeof options.body === 'string') {
    try {
      // Parse and re-stringify to normalize formatting
      const parsed = JSON.parse(options.body);
      parts.push(`body:${JSON.stringify(parsed)}`);
    } catch {
      // If not JSON, use as-is
      parts.push(`body:${options.body}`);
    }
  }

  // Skip non-serializable fields: signal, credentials, mode, cache, etc.
  // These don't affect the response data

  return parts.join('|');
}
