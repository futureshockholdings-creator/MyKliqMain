/**
 * API Configuration
 * Detects environment and returns the correct API base URL
 * 
 * When deployed on AWS Amplify (mykliq.app), API calls go to Replit backend
 * When on Replit, API calls go to same origin
 * 
 * Configuration priority:
 * 1. VITE_API_BASE_URL environment variable (if set at build time)
 * 2. Auto-detection based on hostname
 */

const AWS_DOMAINS = ['mykliq.app', 'www.mykliq.app'];

// Hardcoded backend URL - bypasses environment variable issues
// This URL is baked into the production build
// Using api.mykliq.app subdomain for same-site cookies (Safari ITP compatibility)
const REPLIT_BACKEND_URL = 'https://api.mykliq.app';

let cachedApiBaseUrl: string | null = null;

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  // Return cached value if available
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  const hostname = window.location.hostname;

  // Check if we're on AWS Amplify (custom domain)
  if (AWS_DOMAINS.includes(hostname)) {
    cachedApiBaseUrl = REPLIT_BACKEND_URL;
    console.log('✅ Global API base set to:', cachedApiBaseUrl);
    return cachedApiBaseUrl;
  }

  // Same origin for Replit environments
  cachedApiBaseUrl = '';
  return cachedApiBaseUrl;
}

export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  return baseUrl + path;
}

export function isAwsEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return AWS_DOMAINS.includes(window.location.hostname);
}

/**
 * Resolves asset URLs (images, uploads) to absolute URLs pointing to the backend
 * In production (AWS Amplify), assets are served from Replit backend
 * Relative paths like /objects/uploads/... need to be prefixed with backend URL
 */
export function resolveAssetUrl(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  
  // Already an absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Relative path starting with / - prefix with backend URL
  if (url.startsWith('/')) {
    return getApiBaseUrl() + url;
  }
  
  // Return as-is for other cases
  return url;
}
