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

// Use environment variable if available, otherwise fall back to the deployed Replit URL
// Update this URL when you deploy the Replit backend to production
const REPLIT_BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'https://my-kliq-futureshock.replit.app';

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
