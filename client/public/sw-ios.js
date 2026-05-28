/**
 * iOS Safari PWA Service Worker — v3
 * Handles Web Push (VAPID, no Firebase) and offline caching for iOS Safari.
 */

const CACHE_NAME = 'mykliq-ios-v3';
const STATIC_CACHE = 'mykliq-ios-static-v3';
const DYNAMIC_CACHE = 'mykliq-ios-dynamic-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-180x180.png',
  '/manifest.json'
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[iOS SW v3] Installing…');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => {
        console.log('[iOS SW v3] App shell cached — offline launch enabled');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[iOS SW v3] Pre-cache failed:', err);
        return self.skipWaiting();
      })
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[iOS SW v3] Activating…');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(k => {
          if (k !== STATIC_CACHE && k !== DYNAMIC_CACHE && k.startsWith('mykliq-ios')) {
            console.log('[iOS SW v3] Deleting old cache:', k);
            return caches.delete(k);
          }
        })
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // API requests: bypass SW — offline handled in-app via IndexedDB (critical for iOS).
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.mykliq')) return;

  // Navigation: cache-first so iOS users can launch the app offline and see
  // their cached feed/stories/messages from the app's IndexedDB store.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cached =
        (await caches.match(request, { ignoreSearch: true })) ||
        (await caches.match('/index.html')) ||
        (await caches.match('/'));

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

      const netRes = await networkFetch;
      return netRes || (await caches.match('/offline.html'));
    })());
    return;
  }

  // Static assets: stale-while-revalidate
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
  console.log('[iOS SW v3] Push received');

  fetch('https://api.mykliq.app/api/push/debug-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'push_received',
      data: event.data ? event.data.text() : null,
      timestamp: Date.now(),
      userAgent: self.navigator?.userAgent || 'unknown'
    })
  }).catch(() => {});

  let data = { title: 'MyKliq', body: 'New notification' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const title = data.title || 'MyKliq';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-180x180.png',
    tag: data.tag || 'mykliq-notification',
    requireInteraction: false,
    data: { url: data.url || data.click_action || '/', ...data.data }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[iOS SW v3] Notification shown'))
      .catch(err => console.error('[iOS SW v3] Notification failed:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[iOS SW v3] Notification clicked');
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              if ('navigate' in client) return client.navigate(urlToOpen);
            });
          }
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
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
