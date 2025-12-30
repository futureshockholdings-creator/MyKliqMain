/**
 * Firebase Web SDK Configuration
 * Used for web push notifications via Firebase Cloud Messaging
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log Firebase config (without exposing full values)
console.log('[Firebase] Config check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  hasSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId || 'MISSING'
});

// Initialize Firebase
let app;
let messaging: Messaging | null = null;

try {
  app = initializeApp(firebaseConfig);
  console.log('[Firebase] App initialized successfully');
  
  // Initialize Firebase Cloud Messaging
  // Only initialize if in browser environment
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
    console.log('[Firebase] Messaging initialized successfully');
  } else {
    console.log('[Firebase] Messaging not initialized - not in browser or no service worker support');
  }
} catch (error) {
  console.error('[Firebase] Error initializing Firebase:', error);
}

export { messaging, getToken, onMessage };
export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
