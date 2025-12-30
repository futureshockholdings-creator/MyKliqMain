/**
 * Firebase Web SDK Configuration
 * Used for web push notifications via Firebase Cloud Messaging
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging as getFirebaseMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('[Firebase] Config check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  hasSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId || 'MISSING'
});

let app: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;
let messagingInitAttempted = false;

function initializeFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  
  try {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] App initialized successfully');
    return app;
  } catch (error) {
    console.error('[Firebase] Error initializing Firebase app:', error);
    return null;
  }
}

/**
 * Lazy getter for Firebase Messaging
 * Only initializes messaging when explicitly called in browser context
 */
export function getMessaging(): Messaging | null {
  if (messagingInstance) {
    return messagingInstance;
  }
  
  if (messagingInitAttempted) {
    return null;
  }
  
  messagingInitAttempted = true;
  
  if (typeof window === 'undefined') {
    console.log('[Firebase] getMessaging called in non-browser context');
    return null;
  }
  
  if (!('serviceWorker' in navigator)) {
    console.log('[Firebase] Service workers not supported');
    return null;
  }
  
  const firebaseApp = initializeFirebaseApp();
  if (!firebaseApp) {
    console.error('[Firebase] Cannot initialize messaging - app not initialized');
    return null;
  }
  
  try {
    messagingInstance = getFirebaseMessaging(firebaseApp);
    console.log('[Firebase] Messaging initialized successfully');
    return messagingInstance;
  } catch (error) {
    console.error('[Firebase] Error initializing messaging:', error);
    return null;
  }
}

export function isMessagingSupported(): boolean {
  return typeof window !== 'undefined' && 
         'serviceWorker' in navigator && 
         'PushManager' in window &&
         'Notification' in window;
}

initializeFirebaseApp();

export { getToken, onMessage };
export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const messaging = null;
