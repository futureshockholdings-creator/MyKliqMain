const CACHE_NAME = 'mykliq-v12';
const STATIC_CACHE = 'mykliq-static-v12';
const DYNAMIC_CACHE = 'mykliq-dynamic-v12';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-180x180.png',
  '/manifest.json',
  '/offline.html'
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW v12] Installing…');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('[SW v12] Pre-cache failed:', err);
        return self.skipWaiting();
      })
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW v12] Activating…');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(k => {
          if (k !== STATIC_CACHE && k !== DYNAMIC_CACHE) {
            console.log('[SW v12] Deleting old cache:', k);
            return caches.delete(k);
          }
        })
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll())
      .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME })))
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // API requests: bypass SW entirely — offline fallback handled in-app via IndexedDB.
  if (request.url.includes('/api/') || request.url.includes('api.mykliq')) return;

  // Navigation (page loads): cache-first so the React app shell loads offline.
  // The app's IndexedDB store then provides cached feed/stories/messages.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      // Check cache first — enables offline launch without any network wait
      const cached =
        (await caches.match(request, { ignoreSearch: true })) ||
        (await caches.match('/index.html')) ||
        (await caches.match('/'));

      // Always background-refresh the shell so it stays current
      const networkFetch = fetch(request)
        .then(async (res) => {
          if (res && res.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            await cache.put('/index.html', res.clone());
          }
          return res;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(networkFetch);
        return cached;
      }

      // Nothing cached yet (first ever launch) — wait for network
      const netRes = await networkFetch;
      return netRes || (await caches.match('/offline.html'));
    })());
    return;
  }

  // Static assets (JS bundles, CSS, images): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then(cached => {
      const netFetch = fetch(request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() => null);
      return cached || netFetch;
    })
  );
});

// ─── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});

// ─── Background Sync ─────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(Promise.resolve());
  }
});

// ─── Periodic Background Sync ─────────────────────────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-sync' || event.tag === 'content-sync') {
    event.waitUntil(Promise.resolve());
  }
});

// ─── Messages ────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CHECK_VERSION') {
    event.source.postMessage({ type: 'VERSION_INFO', version: CACHE_NAME });
  }
});
