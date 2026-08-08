
// Use the same dynamic base URL logic as apiConfig.ts so that:
//   - On mykliq.app (production)  → https://api.mykliq.app
//   - On Replit / dev             → '' (same origin, no rewrite)
//
// The old hardcoded Replit dev-tunnel URL caused every /api/ request to land
// on a specific Replit preview origin that had its own service worker with a
// stale cached [] response for /api/nearby-activities. Bumping the app SW
// never affected that foreign origin, so the cache was permanent.
import { getApiBaseUrl } from './lib/apiConfig';

const API_BASE = getApiBaseUrl();

const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  let url = typeof input === "string" ? input : input.toString();

  if (url.startsWith("/api/")) {
    url = `${API_BASE}${url}`;
  }

  // Ensure cookies + credentials are sent on every request
  init.credentials = "include";

  console.log("📡 Fetching:", url);
  return originalFetch(url, init);
};

console.log("✅ Global API base set to:", API_BASE || "(same origin)");
