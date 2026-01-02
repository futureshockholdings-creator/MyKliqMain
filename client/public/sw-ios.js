/**
 * iOS Safari PWA Service Worker
 * Native Web Push API - No Firebase dependencies
 * This bypasses Firebase FCM compatibility issues on iOS Safari
 */

self.addEventListener('push', (event) => {
  console.log('[iOS SW] Push event received');
  
  let data = { title: 'MyKliq', body: 'New notification' };
  
  try {
    if (event.data) {
      data = event.data.json();
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
    data: {
      url: data.url || data.click_action || '/',
      ...data.data
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
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
  console.log('[iOS SW] Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[iOS SW] Service worker activated');
  event.waitUntil(clients.claim());
});

// Handle fetch events - skip API requests entirely to avoid iOS Safari issues
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip API requests entirely - let browser handle them directly
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.')) {
    return; // Don't call respondWith - let the request pass through
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation and other requests, use network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
