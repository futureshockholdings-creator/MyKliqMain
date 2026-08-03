import "./setupApi"; // 👈 must be first
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ── Version-keyed cache bust ──────────────────────────────────────────────
// Bump CACHE_VERSION whenever a fix that requires clearing stale IndexedDB
// data is deployed. On first load after a version change, both the
// enterprise_cache and offline_data IndexedDB stores are wiped before React
// renders — so no stale data can ever be served by the SWR fallback.
const CACHE_VERSION = "v3";
const CACHE_VERSION_KEY = "mykliq_cache_version";

async function bustCacheIfNeeded() {
  try {
    const stored = localStorage.getItem(CACHE_VERSION_KEY);
    if (stored !== CACHE_VERSION) {
      // Dynamically import to avoid bloating the critical path normally
      const localforage = (await import("localforage")).default;
      // Clear enterprise disk cache (MyKliq / enterprise_cache)
      const enterpriseCache = localforage.createInstance({ name: "MyKliq", storeName: "enterprise_cache" });
      await enterpriseCache.clear();
      // Clear offline store (MyKliq_Offline / offline_data)
      const offlineCache = localforage.createInstance({ name: "MyKliq_Offline", storeName: "offline_data" });
      await offlineCache.clear();
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
      console.log(`[CacheBust] Cleared all IndexedDB caches — updated to ${CACHE_VERSION}`);
    }
  } catch (e) {
    // Never block the app from loading
    console.warn("[CacheBust] Could not clear caches:", e);
  }
}


// Aggressive favicon update
function updateFavicon() {
  // Remove all existing favicon links
  const links = document.querySelectorAll("link[rel*='icon']");
  links.forEach(link => link.remove());
  
  // Clear browser favicon cache by adding timestamp
  const timestamp = Date.now();
  
  // Add multiple favicon formats (updated to MyKliq brand pink)
  const favicons = [
    { rel: 'icon', type: 'image/x-icon', href: `/favicon.ico?t=${timestamp}` },
    { rel: 'shortcut icon', type: 'image/x-icon', href: `/favicon.ico?t=${timestamp}` },
    { rel: 'icon', type: 'image/svg+xml', href: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' fill='%23000'/><g fill='%23FF1B8D'><circle cx='8' cy='6' r='2'/><rect x='7' y='8' width='2' height='3'/><rect x='5' y='9' width='6' height='1'/><rect x='7' y='3' width='2' height='1'/><rect x='5' y='4' width='6' height='1'/></g></svg>` }
  ];
  
  favicons.forEach(favicon => {
    const link = document.createElement('link');
    link.rel = favicon.rel;
    link.type = favicon.type;
    link.href = favicon.href;
    document.head.appendChild(link);
  });
  
  // Force browser to refresh the favicon by manipulating the address bar
  const currentTitle = document.title;
  document.title = '[MK] ' + currentTitle;
  setTimeout(() => {
    document.title = currentTitle;
  }, 100);
}



// Update favicon when app loads and periodically
updateFavicon();

// Try updating favicon again after a short delay
setTimeout(updateFavicon, 1000);
setTimeout(updateFavicon, 3000);

// Register Service Worker for PWA
import { registerServiceWorker } from "./utils/registerServiceWorker";
registerServiceWorker();

// NOTE: Google Analytics is NOT initialized here for GDPR compliance
// It will only be initialized for authenticated users in App.tsx
// after verifying they accepted Terms & Privacy during sign-up (termsAcceptedAt)

if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  document.documentElement.classList.add('touch-device');
  document.addEventListener('touchend', (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button, [role="button"], a');
    if (button && button instanceof HTMLElement) {
      setTimeout(() => {
        button.blur();
      }, 100);
    }
  }, { passive: true });
}

// Block rendering until cache bust completes (typically <50ms)
// Using .then() instead of top-level await for broadest PWA compatibility
bustCacheIfNeeded().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
