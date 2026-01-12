/**
 * iOS Safari PWA Service Worker
 * Native Web Push API - No Firebase dependencies
 * This bypasses Firebase FCM compatibility issues on iOS Safari
 * 
 * Also handles offline caching for iOS PWA users
 */

const CACHE_NAME = 'mykliq-ios-v1';
const STATIC_CACHE = 'mykliq-ios-static-v1';
const DYNAMIC_CACHE = 'mykliq-ios-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-180x180.png',
  '/manifest.json'
];

self.addEventListener('push', (event) => {
  console.log('[iOS SW] Push event received');
  
  // Send debug log to server
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
      const rawData = event.data.json();
      console.log('[iOS SW] Raw push data:', JSON.stringify(rawData));
      
      // Standard Web Push payload
      data = rawData;
    }
  } catch (e) {
    console.log('[iOS SW] Could not parse push data:', e);
    if (event.data) {
      data.body = event.data.text();
    }
  }
  
  const title = data.title || 'MyKliq';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-180x180.png',
    tag: data.tag || 'mykliq-notification',
    requireInteraction: false,
    data: {
      url: data.url || data.click_action || '/',
      ...data.data
    }
  };
  
  console.log('[iOS SW] Showing notification:', title, options);
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[iOS SW] Notification shown successfully'))
      .catch((err) => console.error('[iOS SW] Failed to show notification:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[iOS SW] Notification clicked');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              if ('navigate' in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('install', (event) => {
  console.log('[iOS SW] Service worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[iOS SW] Caching static assets for offline use');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[iOS SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[iOS SW] Failed to cache static assets:', err);
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[iOS SW] Service worker activating...');
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

// Handle fetch events - skip API requests entirely to avoid iOS Safari issues
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip API requests entirely - let browser handle them directly (critical for iOS)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.')) {
    return; // Don't call respondWith - let the request pass through
  }
  
  // Handle navigation requests (page loads)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful navigation responses
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Try to serve from cache first, then offline page
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Serve offline page as fallback
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // For other static assets, use stale-while-revalidate strategy
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        const fetchPromise = fetch(request)
          .then(response => {
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => null);
        
        return cachedResponse || fetchPromise;
      })
  );
});
