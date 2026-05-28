/**
 * iOS Safari PWA Service Worker — v4
 * Handles Web Push (VAPID, no Firebase) and offline caching for iOS Safari.
 */

const CACHE_NAME = 'mykliq-ios-v4';
const STATIC_CACHE = 'mykliq-ios-static-v4';
const DYNAMIC_CACHE = 'mykliq-ios-dynamic-v4';

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[iOS SW v4] Installing…');
  const SHELL_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-180x180.png'
  ];

  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const results = await Promise.allSettled(
        SHELL_URLS.map(url =>
          fetch(url, { cache: 'reload' })
            .then(res => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {})
        )
      );
      const cached = results.filter(r => r.status === 'fulfilled').length;
      console.log(`[iOS SW v4] Pre-cached ${cached}/${SHELL_URLS.length} shell assets`);
    })
    .then(() => self.skipWaiting())
    .catch(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[iOS SW v4] Activating…');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(k => {
          if (k !== STATIC_CACHE && k !== DYNAMIC_CACHE && k.startsWith('mykliq-ios')) {
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

  // API requests: bypass SW — offline handled in-app via IndexedDB.
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.mykliq')) return;

  // Navigation: cache-first — iOS users launch offline and see cached data.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const MATCH_OPTS = { ignoreVary: true, ignoreSearch: true };

      const cached =
        (await caches.match('/index.html', MATCH_OPTS)) ||
        (await caches.match('/', MATCH_OPTS)) ||
        (await caches.match(request, MATCH_OPTS));

      const networkRefresh = (async () => {
        try {
          const res = await fetch(request);
          if (res.ok) {
            const cache = await caches.open(STATIC_CACHE);
            await cache.put('/index.html', res.clone());
            await cache.put('/', res.clone());
          }
        } catch { /* offline — ignore */ }
      })();

      if (cached) {
        event.waitUntil(networkRefresh);
        return cached;
      }

      try {
        const res = await fetch(request);
        if (res.ok) {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put('/index.html', res.clone());
          await cache.put('/', res.clone());
        }
        return res;
      } catch {
        return (
          (await caches.match('/offline.html', { ignoreVary: true })) ||
          new Response('<html><body>Offline</body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          })
        );
      }
    })());
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then(cached => {
      const netFetch = fetch(request)
        .then(res => {
          if (res && res.status === 200) {
            caches.open(DYNAMIC_CACHE).then(c => c.put(request, res.clone()));
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
  console.log('[iOS SW v4] Push received');

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
      .then(() => console.log('[iOS SW v4] Notification shown'))
      .catch(err => console.error('[iOS SW v4] Notification failed:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
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
