/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications
 */

// Try to import Firebase scripts - handle failures gracefully
let firebaseInitialized = false;
let messaging = null;

try {
  importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-messaging-compat.js');

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

    const notificationTitle = payload.notification?.title || 'MyKliq';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-180x180.png',
      data: payload.data || {},
      tag: payload.data?.tag || 'mykliq-notification',
      requireInteraction: false,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
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
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
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
      const title = data.notification?.title || 'MyKliq';
      const options = {
        body: data.notification?.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-180x180.png',
        data: data.data || {},
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (error) {
      console.error('[firebase-messaging-sw.js] Error parsing push data:', error);
    }
  }
});
