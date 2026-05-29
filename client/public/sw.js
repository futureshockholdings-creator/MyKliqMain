const CACHE_NAME = 'mykliq-v16';

// Assets pre-cached during install so the app works offline from first load.
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-180x180.png'
];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_ASSETS);
    await self.skipWaiting();
  })());
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Remove stale caches from previous versions.
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Let API calls go straight to the network — never cache them.
  const url = event.request.url;
  if (url.includes('/api/') || url.includes('api.mykliq.app')) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Cache-First: return cached response immediately if available.
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse !== undefined) {
      return cachedResponse;
    }

    // Cache miss — fetch from network, cache the result, then return it.
    try {
      const networkResponse = await fetch(event.request);
      if (networkResponse && networkResponse.status === 200) {
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    } catch {
      // Offline and not in cache — return the offline fallback page.
      const offline = await cache.match('/offline.html');
      return offline || new Response('Offline', { status: 503 });
    }
  })());
});

// ── Push notifications ─────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  let data = { title: 'MyKliq', body: 'You have a new notification' };
  try { data = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'MyKliq', {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: data.tag || 'mykliq-notification',
      data: data
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});

// ── Background sync ────────────────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-sync' || event.tag === 'periodic-sync') {
    event.waitUntil(Promise.resolve());
  }
});

// ── Messages ───────────────────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CHECK_VERSION') {
    event.source?.postMessage({ type: 'VERSION_INFO', version: CACHE_NAME });
  }
});
