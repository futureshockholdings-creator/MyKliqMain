/**
 * iOS Safari PWA Service Worker
 * Native Web Push API - No Firebase dependencies
 * Handles push notifications and offline caching for iOS Safari PWA users.
 */

const CACHE_NAME = 'mykliq-ios-v2';
const STATIC_CACHE = 'mykliq-ios-static-v2';
const DYNAMIC_CACHE = 'mykliq-ios-dynamic-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-180x180.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('[iOS SW] Installing v2...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[iOS SW] Pre-caching app shell for offline use');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[iOS SW] App shell cached — offline launch enabled');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[iOS SW] Pre-cache failed:', err);
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[iOS SW] Activating v2...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName.startsWith('mykliq-ios')) {
            console.log('[iOS SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[iOS SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Skip API requests — offline fallback handled at app level via IndexedDB (offlineStore).
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.mykliq')) {
    return;
  }

  // Navigation requests: cache-first, background network update.
  // Serving the cached React app shell immediately lets iOS users launch the app
  // offline and see their previously loaded feed/stories/messages from IndexedDB.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(cachedShell => {
        // Background refresh to keep the shell current
        const networkUpdate = fetch(request)
          .then(response => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then(cache => cache.put('/index.html', clone));
            }
            return response;
          })
          .catch(() => null);

        if (cachedShell) {
          return cachedShell;
        }
        return networkUpdate.then(res => res || caches.match('/offline.html'));
      })
    );
    return;
  }

  // Static assets (JS bundles, CSS, images): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const networkFetch = fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => null);

      return cachedResponse || networkFetch;
    })
  );
});

self.addEventListener('push', (event) => {
  console.log('[iOS SW] Push event received');

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
    if (event.data) {
      data = event.data.json();
    }
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
      .then(() => console.log('[iOS SW] Notification shown'))
      .catch(err => console.error('[iOS SW] Notification failed:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[iOS SW] Notification clicked');
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CHECK_VERSION') {
    event.source.postMessage({ type: 'VERSION_INFO', version: CACHE_NAME });
  }
});
