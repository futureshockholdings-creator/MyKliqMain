const CACHE_NAME = 'mykliq-v19';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-180x180.png'
];

// ── Install: pre-cache the app shell ───────────────────────────────────────
// Each asset is cached individually so one failure doesn't abort the install.
// cache.addAll() is all-or-nothing — a single slow/failed fetch kills the
// entire install event, leaving the old (possibly broken) SW in control.
self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          cache.add(url).catch(err =>
            console.warn(`[SW] Failed to precache ${url}:`, err)
          )
        )
      );
      await self.skipWaiting();
    })()
  );
});

// ── Activate: remove stale caches ─────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: Cache-First for static assets, Network-Only for API ─────────────
// API calls (/api/*) must NEVER be cached by the service worker — they are
// handled by React Query / enterpriseFetch with their own TTL logic.
// Caching them here caused stale API responses (e.g. empty event lists) to be
// served indefinitely with no request ever reaching the server.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-only: all API calls, non-GET requests, cross-origin requests
  if (
    url.pathname.startsWith('/api/') ||
    e.request.method !== 'GET' ||
    url.origin !== self.location.origin
  ) {
    return; // let the browser handle it — no service worker interception
  }

  // Cache-First for static assets (HTML shell, JS, CSS, images, icons)
  e.respondWith(
    (async () => {
      // 1. Cache hit → return immediately (works offline)
      const r = await caches.match(e.request);
      if (r) return r;

      // 2. Cache miss → fetch from network and cache for next time
      try {
        const response = await fetch(e.request);
        if (response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(e.request, response.clone());
        }
        return response;
      } catch (_err) {
        // Network failed (offline) — return offline page for navigation
        if (e.request.mode === 'navigate') {
          const offline = await caches.match('/offline.html');
          if (offline) return offline;
        }
        throw _err;
      }
    })()
  );
});

// ── Push notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  if (!e.data) return;
  let data = { title: 'MyKliq', body: 'You have a new notification' };
  try { data = e.data.json(); } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'MyKliq', {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: data.tag || 'mykliq-notification',
      data
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(clients.openWindow(url));
});

// ── Background sync ────────────────────────────────────────────────────────
self.addEventListener('sync', (e) => {
  if (e.tag === 'background-sync') {
    e.waitUntil(Promise.resolve());
  }
});

self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'content-sync' || e.tag === 'periodic-sync') {
    e.waitUntil(Promise.resolve());
  }
});

// ── Messages ───────────────────────────────────────────────────────────────
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'CHECK_VERSION') {
    e.source?.postMessage({ type: 'VERSION_INFO', version: CACHE_NAME });
  }
});
