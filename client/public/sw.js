const CACHE_NAME = 'mykliq-v13';
const STATIC_CACHE = 'mykliq-static-v13';
const DYNAMIC_CACHE = 'mykliq-dynamic-v13';

// ─── Install ─────────────────────────────────────────────────────────────────
// Use individual fetch + put (not cache.addAll) so one failing URL can't
// silently wipe the entire pre-cache.  Promise.allSettled ensures we always
// advance to activation even when an asset is temporarily unavailable.
self.addEventListener('install', (event) => {
  console.log('[SW v13] Installing…');
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
              if (res.ok) {
                return cache.put(url, res);
              }
            })
            .catch(() => { /* individual URL fail — skip silently */ })
        )
      );
      const cached = results.filter(r => r.status === 'fulfilled').length;
      console.log(`[SW v13] Pre-cached ${cached}/${SHELL_URLS.length} shell assets`);
    })
    .then(() => self.skipWaiting())
    .catch(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW v13] Activating…');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(k => {
          if (k !== STATIC_CACHE && k !== DYNAMIC_CACHE) {
            console.log('[SW v13] Removing old cache:', k);
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

  // API calls: bypass SW — offline fallback is handled in-app via IndexedDB.
  if (request.url.includes('/api/') || request.url.includes('api.mykliq')) return;

  // ── Navigation requests ────────────────────────────────────────────────────
  // Cache-first strategy: serve the React app shell from cache immediately so
  // the app launches offline and shows IndexedDB-cached data (feed, stories,
  // messages).  Always attempt a background network refresh to keep it current.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      // ignoreVary bypasses Vary-header mismatches (common with CDN responses)
      const MATCH_OPTS = { ignoreVary: true, ignoreSearch: true };

      const cached =
        (await caches.match('/index.html', MATCH_OPTS)) ||
        (await caches.match('/', MATCH_OPTS)) ||
        (await caches.match(request, MATCH_OPTS));

      // Background refresh — update the shell without blocking the response
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
        // Return instantly from cache; refresh in background
        event.waitUntil(networkRefresh);
        return cached;
      }

      // Nothing in cache yet (very first launch).  Fetch from network and
      // store it so the NEXT offline visit succeeds.
      try {
        const res = await fetch(request);
        if (res.ok) {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put('/index.html', res.clone());
          await cache.put('/', res.clone());
        }
        return res;
      } catch {
        // Truly offline and nothing cached — serve the offline placeholder
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

  // ── Static assets (JS bundles, CSS, images, fonts) ────────────────────────
  // Stale-while-revalidate: return cached immediately, update in background.
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
