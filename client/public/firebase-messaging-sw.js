/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications — badge-aware v2
 */

importScripts('/app-badge.js');

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Try to import Firebase scripts - handle failures gracefully
let firebaseInitialized = false;
let messaging = null;

try {
  // Use local copies for iOS Safari PWA compatibility (iOS blocks CDN importScripts)
  importScripts('/firebase-sw/firebase-app-compat.js');
  importScripts('/firebase-sw/firebase-messaging-compat.js');

  // Firebase configuration - all required fields for FCM
  const firebaseConfig = {
    apiKey: "AIzaSyBSLE2s6Vzyqd05-YjnMFq-SS45ZyvDagw",
    authDomain: "mykliq-ea8a3.firebaseapp.com",
    projectId: "mykliq-ea8a3",
    storageBucket: "mykliq-ea8a3.firebasestorage.app",
    messagingSenderId: "728126819544",
    appId: "1:728126819544:web:69edebba0789ee6ea21bad"
  };

  // Initialize Firebase in service worker
  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();
  firebaseInitialized = true;
  console.log('[firebase-messaging-sw.js] Firebase initialized successfully');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Failed to initialize Firebase:', error);
}

// Handle background messages - only if Firebase initialized
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    // Firebase automatically displays notification-payload messages. Only our
    // data-only PWA messages need manual display here.
    if (payload.notification) return;
    const notificationTitle = payload.data?.title || 'MyKliq';
    const notificationOptions = {
      body: payload.data?.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-180x180.png',
      data: payload.data || {},
      tag: payload.data?.notificationId || payload.data?.tag || 'mykliq-notification',
      requireInteraction: false,
    };

    return self.mykliqBadge.acceptPush(payload)
      .then(accepted => accepted && self.registration.showNotification(notificationTitle, notificationOptions));
  });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
  
  event.notification.close();

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => client.navigate?.(event.notification.data?.url || '/'));
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});

// Handle push event (backup handler)
self.addEventListener('push', (event) => {
  if (event.data) {
    console.log('[firebase-messaging-sw.js] Push event received:', event.data.text());
    
    try {
      const data = event.data.json();
      const title = data.notification?.title || data.title || data.data?.title || 'MyKliq';
      const options = {
        body: data.notification?.body || data.body || data.data?.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-180x180.png',
        data: data.data || {},
        tag: data.data?.notificationId || data.data?.tag || 'mykliq-notification',
      };

      event.waitUntil(
        self.mykliqBadge.acceptPush(data).then(accepted => {
          // Do not also display messages already owned by Firebase's listener.
          const ownedByFirebase = firebaseInitialized && (data.from || data.fcmMessageId);
          if (accepted && !ownedByFirebase) return self.registration.showNotification(title, options);
        })
      );
    } catch (error) {
      console.error('[firebase-messaging-sw.js] Error parsing push data:', error);
    }
  }
});
