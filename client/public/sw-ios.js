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
      const rawData = event.data.json();
      console.log('[iOS SW] Raw push data:', JSON.stringify(rawData));
      
      // iOS Safari may deliver via APNs structure - check for aps.alert first
      if (rawData.aps && rawData.aps.alert) {
        data.title = rawData.aps.alert.title || rawData.title || 'MyKliq';
        data.body = rawData.aps.alert.body || rawData.body || 'New notification';
        data.icon = rawData.icon;
        data.data = rawData.data;
        data.url = rawData.url || rawData.click_action;
        data.tag = rawData.tag;
      } else {
        // Standard Web Push payload
        data = rawData;
      }
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
