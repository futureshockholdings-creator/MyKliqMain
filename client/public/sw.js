const CACHE_NAME = 'mykliq-v14';
const STATIC_CACHE = 'mykliq-static-v14';
const DYNAMIC_CACHE = 'mykliq-dynamic-v14';

// Minimal HTML shell stored synthetically — no network needed.
// This guarantees a status-200 response for offline navigation even on first
// install, before any real page has been fetched and cached.
const OFFLINE_SHELL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#2ae149">
  <title>MyKliq</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
         display:flex;flex-direction:column;align-items:center;justify-content:center;
         min-height:100vh;gap:16px;color:#333}
    .logo{width:80px;height:80px;border-radius:20px;background:#2ae149;
          display:flex;align-items:center;justify-content:center;font-size:36px}
    h1{font-size:24px;font-weight:700}
    p{font-size:15px;color:#666;text-align:center;max-width:280px}
  </style>
</head>
<body>
  <div class="logo">&#128101;</div>
  <h1>MyKliq</h1>
  <p id="msg">Connecting&hellip;</p>
  <script>
    var m = document.getElementById('msg');
    function tryReload() { if (navigator.onLine) { location.reload(); } }
    if (navigator.onLine) {
      m.textContent = 'Loading your kliq\u2026';
      setTimeout(tryReload, 800);
    } else {
      m.textContent = 'You\u2019re offline. We\u2019ll reload when your connection is back.';
      window.addEventListener('online', tryReload);
    }
  </script>
</body>
</html>`;

const SYNTHETIC_RESPONSE = () => new Response(OFFLINE_SHELL_HTML, {
  status: 200,
  headers: { 'Content-Type': 'text/html; charset=utf-8' }
});

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW v14] Installing…');

  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // 1. Store the synthetic shell immediately — guaranteed, no network.
      await cache.put('/__offline-shell', SYNTHETIC_RESPONSE());
      console.log('[SW v14] Synthetic offline shell stored');

      // 2. Best-effort: also pre-fetch real assets from the network.
      //    We use Promise.allSettled so a single failure never blocks activation.
      const SHELL_URLS = [
        '/',
        '/index.html',
        '/offline.html',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
      ];

      const results = await Promise.allSettled(
        SHELL_URLS.map(url =>
          fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' }))
            .then(res => {
              if (res.ok && res.status === 200) {
                return cache.put(url, res);
              }
            })
            .catch(() => { /* skip — synthetic shell covers offline */ })
        )
      );
      const cached = results.filter(r => r.status === 'fulfilled').length;
      console.log(`[SW v14] Pre-cached ${cached}/${SHELL_URLS.length} shell assets`);
    })
    .then(() => self.skipWaiting())
    .catch(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW v14] Activating…');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(k => {
          if (k !== STATIC_CACHE && k !== DYNAMIC_CACHE) {
            console.log('[SW v14] Removing old cache:', k);
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

  // API calls: bypass SW entirely — offline data comes from IndexedDB.
  if (request.url.includes('/api/') || request.url.includes('api.mykliq')) return;

  // ── Navigation (page loads) ───────────────────────────────────────────────
  // Network-first: serve fresh content when online and update the cache.
  // Fallback chain on failure: real cached HTML → synthetic shell → inline 200.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // 1. Try the network first.
        const res = await fetch(request);
        if (res.ok) {
          // Cache the real response for future offline use.
          const cache = await caches.open(STATIC_CACHE);
          await cache.put('/index.html', res.clone());
          await cache.put('/', res.clone());
        }
        return res;
      } catch {
        // Network is offline — work through the fallback chain.
        const OPTS = { ignoreVary: true, ignoreSearch: true };

        const cached =
          (await caches.match('/index.html', OPTS)) ||
          (await caches.match('/', OPTS)) ||
          (await caches.match(request, OPTS)) ||
          (await caches.match('/offline.html', OPTS)) ||
          (await caches.match('/__offline-shell', OPTS));

        // Always return a valid 200 — the synthetic shell is the last resort.
        return cached || SYNTHETIC_RESPONSE();
      }
    })());
    return;
  }

  // ── Static assets (JS, CSS, images, fonts) ───────────────────────────────
  // Stale-while-revalidate: serve from cache immediately, refresh in background.
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
