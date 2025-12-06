const TOKEN_KEY = 'mykliq_auth_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
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
