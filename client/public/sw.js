const CACHE_NAME = 'mykliq-v11';
const STATIC_CACHE = 'mykliq-static-v11';
const DYNAMIC_CACHE = 'mykliq-dynamic-v11';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-180x180.png',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing v11...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching app shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('[ServiceWorker] Pre-cache failed:', err);
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating v11...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
      return self.clients.matchAll();
    }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  // Skip API requests — let them go directly to the network.
  // Offline fallback for API data is handled at the app level via IndexedDB (offlineStore).
  if (request.url.includes('/api/') || request.url.includes('api.mykliq')) {
    return;
  }

  // Navigation requests (page loads): cache-first, network update in background.
  // Serving the cached React app shell immediately lets the app load offline and
  // display cached feed/stories/messages from IndexedDB without waiting for the network.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(cachedShell => {
        // Kick off a background refresh so the shell stays fresh
        const networkUpdate = fetch(request)
          .then(response => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then(cache => cache.put('/index.html', clone));
            }
            return response;
          })
          .catch(() => null);

        // Serve the cached shell immediately if we have it (offline-capable).
        // Fall through to the network response or offline page if nothing is cached yet.
        if (cachedShell) {
          return cachedShell;
        }
        return networkUpdate.then(res => res || caches.match('/offline.html'));
      })
    );
    return;
  }

  // Static assets (JS bundles, CSS, images, fonts): stale-while-revalidate.
  // Return cached version immediately and update the cache in the background.
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

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CHECK_VERSION') {
    event.source.postMessage({ type: 'VERSION_INFO', version: CACHE_NAME });
  }
});
