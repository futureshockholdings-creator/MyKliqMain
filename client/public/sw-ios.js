/**
 * iOS Safari PWA Service Worker — v7
 * Handles Web Push (VAPID, no Firebase) and offline caching for iOS Safari.
 */

importScripts('/assets/app-badge.js');
const CACHE_NAME = 'mykliq-ios-v7';
const STATIC_CACHE = 'mykliq-ios-static-v7';
const DYNAMIC_CACHE = 'mykliq-ios-dynamic-v7';

async function boundedFetch(request, options = {}, timeout = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(request, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[iOS SW v7] Installing…');
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
          boundedFetch(url, { cache: 'no-store' })
            .then(res => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {})
        )
      );
      const cached = results.filter(r => r.status === 'fulfilled').length;
      console.log(`[iOS SW v7] Pre-cached ${cached}/${SHELL_URLS.length} shell assets`);
    })
    .then(() => self.skipWaiting())
    .catch(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[iOS SW v7] Activating…');
  event.waitUntil(
    caches.keys()
      .then(keys => {
        // Keep the previous generation's assets for already-open documents.
        // Never erase notification state or another worker's caches.
        const staleStatic = keys.filter(k => k.startsWith('mykliq-ios-static-') && k !== STATIC_CACHE);
        const staleDynamic = keys.filter(k => k.startsWith('mykliq-ios-dynamic-') && k !== DYNAMIC_CACHE);
        return Promise.all([...staleStatic.slice(0, -1), ...staleDynamic.slice(0, -1)]
          .map(k => caches.delete(k)));
      })
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // API requests: bypass SW — offline handled in-app via IndexedDB.
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) return;

  // Release metadata must never come from a service-worker cache.
  if (url.pathname === '/assets/app-release.json') return;

  // Navigation: bounded network-first. Cached HTML is an offline fallback,
  // not the default first opening after every Amplify deployment.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await boundedFetch(request, { cache: 'no-store' });
        if (res.ok && res.headers.get('content-type')?.includes('text/html')) {
          // Cache writes must not delay returning the online page.
          const copy = res.clone();
          event.waitUntil(caches.open(STATIC_CACHE)
            .then(cache => cache.put('/index.html', copy)).catch(() => {}));
          return res;
        }
        if (res.status >= 500) throw new Error('Page temporarily unavailable');
        return res;
      } catch {
        const cache = await caches.open(STATIC_CACHE);
        return (
          (await cache.match('/index.html', { ignoreVary: true })) ||
          (await cache.match('/offline.html', { ignoreVary: true })) ||
          new Response('<html><body>Offline</body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          })
        );
      }
    })());
    return;
  }

  // Content-hashed assets are immutable; unversioned helpers must be fresh.
  event.respondWith((async () => {
    const hashed = /\/assets\/.+-[\w-]{8,}\.(?:js|css)$/.test(url.pathname) &&
      !['/assets/startup-languages.js', '/assets/app-badge.js'].includes(url.pathname);
    const cacheFirst = hashed || /\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|mp4|webm)$/i.test(url.pathname);
    const dynamic = await caches.open(DYNAMIC_CACHE);
    const shell = await caches.open(STATIC_CACHE);
    const cached = (await dynamic.match(request, { ignoreVary: true })) ||
      (await shell.match(request, { ignoreVary: true })) ||
      (await caches.match(request, { ignoreVary: true }));
    if (cacheFirst && cached) return cached;
    try {
      const response = await boundedFetch(request, { cache: cacheFirst ? 'default' : 'no-store' }, 30000);
      if (response.ok && !(url.pathname.endsWith('.js') &&
          !/javascript|ecmascript/i.test(response.headers.get('content-type') || ''))) {
        const copy = response.clone();
        event.waitUntil(caches.open(DYNAMIC_CACHE)
          .then(cache => cache.put(request, copy)).catch(() => {}));
      }
      return response;
    } catch {
      return cached || Response.error();
    }
  })());
});

// ─── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[iOS SW v6] Push received');

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
    tag: data.data?.notificationId || data.tag || 'mykliq-notification',
    requireInteraction: false,
    data: { url: data.url || data.click_action || '/', ...data.data }
  };

  event.waitUntil(
    self.mykliqBadge.acceptPush(data)
      .then(accepted => accepted && self.registration.showNotification(title, options))
      .then(() => console.log('[iOS SW v6] Push processed'))
      .catch(err => console.error('[iOS SW v6] Notification failed:', err))
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
