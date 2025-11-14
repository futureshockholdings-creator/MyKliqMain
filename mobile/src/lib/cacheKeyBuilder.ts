/**
 * Safe cache key builder for API requests
 * Handles non-serializable objects like Headers, AbortController, etc.
 */

/**
 * Build a safe cache key from endpoint and request options
 * Extracts only serializable parts (method, headers, body)
 */
export function buildCacheKey(endpoint: string, options: RequestInit = {}): string {
  const parts: string[] = [endpoint];

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
