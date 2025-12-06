const TOKEN_KEY = 'mykliq_auth_token';
const COOKIE_TOKEN_KEY = 'mykliq_jwt';

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
    return false;
  }
}

/**
 * Check if sessionStorage is available
 */
function isSessionStorageAvailable(): boolean {
  try {
    const testKey = '__session_test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Cookie-based storage for maximum browser compatibility
 * Uses SameSite=Lax for same-origin requests
 */
function setCookieToken(token: string): void {
  try {
    // Set cookie with 7-day expiry, SameSite=Lax for security
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_TOKEN_KEY}=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Lax`;
    console.log('[TokenStorage] Token stored in cookie');
  } catch (e) {
    console.warn('[TokenStorage] Failed to store in cookie:', e);
  }
}

function getCookieToken(): string | null {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === COOKIE_TOKEN_KEY && value) {
        return decodeURIComponent(value);
      }
    }
  } catch (e) {
    console.warn('[TokenStorage] Failed to read cookie:', e);
  }
  return null;
}

function removeCookieToken(): void {
  try {
    document.cookie = `${COOKIE_TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('[TokenStorage] Failed to remove cookie:', e);
  }
}

// Fallback in-memory storage
let memoryToken: string | null = null;

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Priority 1: localStorage (most persistent)
  if (isLocalStorageAvailable()) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return token;
    }
  }
  
  // Priority 2: sessionStorage (survives page refreshes in same tab)
  if (isSessionStorageAvailable()) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      console.log('[TokenStorage] Token retrieved from sessionStorage');
      return token;
    }
  }
  
  // Priority 3: Cookie (survives Safari ITP restrictions)
  const cookieToken = getCookieToken();
  if (cookieToken) {
    console.log('[TokenStorage] Token retrieved from cookie');
    return cookieToken;
  }
  
  // Priority 4: Memory (last resort)
  if (memoryToken) {
    console.log('[TokenStorage] Token retrieved from memory');
  }
  return memoryToken;
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  console.log('[TokenStorage] Storing token in all available storage mechanisms');
  
  // Always store in memory as fallback
  memoryToken = token;
  
  // Store in localStorage if available
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('[TokenStorage] localStorage failed:', e);
    }
  }
  
  // Store in sessionStorage if available (backup for same-tab navigation)
  if (isSessionStorageAvailable()) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('[TokenStorage] sessionStorage failed:', e);
    }
  }
  
  // Always store in cookie for maximum Safari/Silk compatibility
  setCookieToken(token);
}

export function removeAuthToken(): void {
  // Clear all storage mechanisms
  memoryToken = null;
  
  if (typeof window === 'undefined') {
    return;
  }
  
  // Clear localStorage
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* ignore */ }
  }
  
  // Clear sessionStorage
  if (isSessionStorageAvailable()) {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* ignore */ }
  }
  
  // Clear cookie
  removeCookieToken();
  
  console.log('[TokenStorage] Token cleared from all storage');
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
