importScripts('/assets/app-badge.js');
const CACHE_NAME = 'mykliq-v27-startup-recovery';
const LOCALE_CACHE = 'mykliq-notification-language-v1';
const LOCALE_KEY = '/__mykliq_notification_language__';

async function boundedFetch(request, options = {}, timeout = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(request, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function localizePushText(data) {
  // Only app-owned wording is stored here, never API responses or member data.
  try {
    const cache = await caches.open(LOCALE_CACHE);
    const saved = await cache.match(LOCALE_KEY);
    if (!saved) return data;
    const { messages, language } = await saved.json();
    const translate = value => {
      if (typeof value !== 'string') return value;
      if (typeof messages[value] === 'string') return messages[value];
      for (const [source, translated] of Object.entries(messages)) {
        if (!source.includes('{{') || typeof translated !== 'string') continue;
        const names = [];
        const pattern = source.split(/(\{\{\w+\}\})/g).map(part => {
          const placeholder = /^\{\{(\w+)\}\}$/.exec(part);
          if (placeholder) { names.push(placeholder[1]); return '([\\s\\S]*?)'; }
          return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('');
        const match = new RegExp(`^${pattern}$`).exec(value);
        if (match) {
          const values = Object.fromEntries(names.map((name, index) => [name, match[index + 1]]));
          return translated.replace(/\{\{(\w+)\}\}/g, (token, name) => values[name] ?? token);
        }
      }
      return value;
    };
    return {
      ...data,
      title: translate(data.title),
      body: /message from/i.test(data.title || '') ? data.body : translate(data.body),
      lang: language,
      dir: language?.split('-')[0] === 'ar' ? 'rtl' : 'ltr',
    };
  } catch (_error) {
    // Localization storage must never prevent alert or badge delivery.
    return data;
  }
}

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-180x180.png',
  '/assets/startup-languages.js'
];

// ── Install: pre-cache the app shell ───────────────────────────────────────
// Each asset is cached individually so one failure doesn't abort the install.
// cache.addAll() is all-or-nothing — a single slow/failed fetch kills the
// entire install event, leaving the old (possibly broken) SW in control.
self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          boundedFetch(url, { cache: 'no-store' })
            .then(response => {
              if (response.ok) return cache.put(url, response);
            }).catch(err =>
            console.warn(`[SW] Failed to precache ${url}:`, err)
          )
        )
      );
      await self.skipWaiting();
    })()
  );
});

// ── Activate: remove stale caches + purge any /api/ entries old SWs stored ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => {
        const stale = keys.filter(key => /^mykliq-v/.test(key) && key !== CACHE_NAME);
        return Promise.all(stale.slice(0, -1).map(key => caches.delete(key)));
      })
      // Purge private API responses even in the retained older asset cache.
      .then(() => caches.keys())
      .then(keys => Promise.all(keys.filter(key => /^mykliq-v/.test(key)).map(async key => {
        const cache = await caches.open(key);
        const requests = await cache.keys();
        await Promise.all(requests
          .filter(request => new URL(request.url).pathname.startsWith('/api/'))
          .map(request => cache.delete(request)));
      })))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: Cache-First for static assets, Network-Only for API ─────────────
// API calls (/api/*) must NEVER be cached by the service worker — they are
// handled by React Query / enterpriseFetch with their own TTL logic.
// Caching them here caused stale API responses (e.g. empty event lists) to be
// served indefinitely with no request ever reaching the server.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-only: all API calls, non-GET requests, cross-origin requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/assets/app-release.json' ||
    e.request.method !== 'GET' ||
    url.origin !== self.location.origin
  ) {
    return; // let the browser handle it — no service worker interception
  }

  // Always check the network for pages. Cache-first navigation can keep an
  // older HTML shell (and its old asset URLs) in use after a publish.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      (async () => {
        try {
          const response = await boundedFetch(e.request, { cache: 'no-store' });
          if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
            const copy = response.clone();
            e.waitUntil(caches.open(CACHE_NAME)
              .then(cache => cache.put('/index.html', copy)).catch(() => {}));
          }
          if (response.status >= 500) throw new Error('Page temporarily unavailable');
          return response;
        } catch (_err) {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match('/index.html'))
            || (await cache.match('/offline.html'))
            || Response.error();
        }
      })()
    );
    return;
  }

  // Cache-First for versioned static assets (JS, CSS, images, icons)
  e.respondWith(
    (async () => {
      // 1. Cache hit → return immediately (works offline)
      const hashed = /\/assets\/.+-[\w-]{8,}\.(?:js|css)$/.test(url.pathname) &&
        !['/assets/startup-languages.js', '/assets/app-badge.js'].includes(url.pathname);
      const cacheFirst = hashed || /\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|mp4|webm)$/i.test(url.pathname);
      const cache = await caches.open(CACHE_NAME);
      const r = (await cache.match(e.request)) || (await caches.match(e.request));
      if (cacheFirst && r) return r;

      // 2. Cache miss → fetch from network and cache for next time
      try {
        const response = await boundedFetch(e.request, { cache: cacheFirst ? 'default' : 'no-store' }, 30000);
        if (response.status === 200 && !(url.pathname.endsWith('.js') &&
            !/javascript|ecmascript/i.test(response.headers.get('content-type') || ''))) {
          const copy = response.clone();
          e.waitUntil(caches.open(CACHE_NAME)
            .then(cache => cache.put(e.request, copy)).catch(() => {}));
        }
        return response;
      } catch (_err) {
        if (r) return r;
        // Network failed (offline) — return offline page for navigation
        if (e.request.mode === 'navigate') {
          const offline = await caches.match('/offline.html');
          if (offline) return offline;
        }
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
    self.mykliqBadge.acceptPush(data).then(async accepted => {
      if (!accepted) return;
      const localized = await localizePushText(data);
      return self.registration.showNotification(localized.title || 'MyKliq', {
        body: localized.body || 'You have a new notification',
        lang: localized.lang,
        dir: localized.dir || 'auto',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: data.data?.notificationId || data.tag || 'mykliq-notification',
        data: { ...data, ...data.data }
      });
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
  if (e.data?.type === 'SET_INTERFACE_LANGUAGE' && e.data.messages && typeof e.data.language === 'string') {
    const messages = Object.fromEntries(Object.entries(e.data.messages)
      .filter(([key, value]) => key.length < 300 && typeof value === 'string' && value.length < 2000));
    e.waitUntil(caches.open(LOCALE_CACHE).then(cache => cache.put(LOCALE_KEY, new Response(
      JSON.stringify({ language: e.data.language, messages }),
      { headers: { 'Content-Type': 'application/json' } },
    ))));
  }
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'CHECK_VERSION') {
    e.source?.postMessage({ type: 'VERSION_INFO', version: CACHE_NAME });
  }
});
