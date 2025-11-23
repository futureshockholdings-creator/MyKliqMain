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

// Initialize Firebase
let app;
let messaging: Messaging | null = null;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Cloud Messaging
  // Only initialize if in browser environment
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export { messaging, getToken, onMessage };
export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
