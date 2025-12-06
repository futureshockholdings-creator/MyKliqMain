const TOKEN_KEY = 'mykliq_auth_token';

/**
 * Check if localStorage is available (Safari ITP may block it in some contexts)
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('[TokenStorage] localStorage not available:', e);
    return false;
  }
}

// Fallback in-memory storage for when localStorage is blocked
let memoryToken: string | null = null;

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Try localStorage first, fall back to memory
  if (isLocalStorageAvailable()) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      console.log('[TokenStorage] Token retrieved from localStorage');
      return token;
    }
  }
  
  // Fall back to memory storage
  if (memoryToken) {
    console.log('[TokenStorage] Token retrieved from memory (localStorage blocked)');
  }
  return memoryToken;
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Always store in memory as fallback
  memoryToken = token;
  
  // Try to store in localStorage
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      console.log('[TokenStorage] Token stored in localStorage');
    } catch (e) {
      console.warn('[TokenStorage] Failed to store in localStorage, using memory:', e);
    }
  } else {
    console.warn('[TokenStorage] localStorage blocked, using memory storage only');
  }
}

export function removeAuthToken(): void {
  // Clear memory storage
  memoryToken = null;
  
  if (typeof window === 'undefined') {
    return;
  }
  
  // Try to clear localStorage
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(TOKEN_KEY);
      console.log('[TokenStorage] Token removed from localStorage');
    } catch (e) {
      console.warn('[TokenStorage] Failed to remove from localStorage:', e);
    }
  }
}

/**
 * Decode base64url to string (Safari-compatible)
 * JWTs use base64url encoding which differs from standard base64:
 * - Uses '-' instead of '+'
 * - Uses '_' instead of '/'
 * - May omit padding '='
 */
function base64UrlDecode(str: string): string {
  // Replace base64url characters with base64 equivalents
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed (base64 requires length to be multiple of 4)
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  
  return atob(base64);
}

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const exp = payload.exp;
    if (!exp) return true;
    return Date.now() >= exp * 1000;
  } catch (e) {
    console.error('[TokenStorage] Failed to parse token:', e);
    return true;
  }
}

export function hasValidToken(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  return !isTokenExpired(token);
}
