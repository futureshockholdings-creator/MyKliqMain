const CACHE_NAME = 'mykliq-v17';

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
self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_ASSETS);
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

// ── Fetch: Cache-First strategy ────────────────────────────────────────────
// Matches the pattern described in PWABuilder / MDN service worker docs:
// search the cache first; if found return it; if not, fetch from network,
// cache the response, and return it.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    (async () => {
      // 1. Cache hit → return immediately (works offline)
      const r = await caches.match(e.request);
      if (r) return r;

      // 2. Cache miss → go to the network
      try {
        const response = await fetch(e.request);
        // Only cache successful GET responses (cache.put rejects non-GET)
        if (e.request.method === 'GET' && response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(e.request, response.clone());
        }
        return response;
      } catch (_err) {
        // Network failed (offline) and nothing in cache.
        // Return the pre-cached offline page for navigation requests.
        if (e.request.mode === 'navigate') {
          const offline = await caches.match('/offline.html');
          if (offline) return offline;
        }
        // For non-navigation requests (images, scripts, etc.) just let it fail.
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
