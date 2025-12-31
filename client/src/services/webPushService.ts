/**
 * Web Push Notification Service
 * Handles Firebase Cloud Messaging for web push notifications
 */

import { getMessaging, getToken, onMessage, vapidKey, isMessagingSupported } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';

export class WebPushNotificationService {
  private fcmToken: string | null = null;
  private permissionGranted: boolean = false;
  private lastError: string | null = null;
  private registrationInProgress: boolean = false;

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.log('[WebPush] This browser does not support notifications');
        return false;
      }

      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      
      if (!this.permissionGranted) {
        console.log('[WebPush] Notification permission denied');
        return false;
      }

      console.log('[WebPush] Notification permission granted');
      return true;
    } catch (error) {
      console.error('[WebPush] Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token for this device with retry logic
   */
  async getToken(): Promise<string | null> {
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[WebPush] getToken attempt ${attempt}/${maxRetries}...`);
        const token = await this.getTokenInternal();
        if (token) {
          return token;
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`[WebPush] Attempt ${attempt} failed:`, error?.message || error);
        
        if (attempt < maxRetries) {
          const delay = 1000 * attempt;
          console.log(`[WebPush] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    this.lastError = `FCM Token Error: ${lastError?.message || lastError?.code || 'Failed after retries'}`;
    console.error('[WebPush] All retry attempts failed:', this.lastError);
    return null;
  }

  /**
   * Internal method to get FCM token
   */
  private async getTokenInternal(): Promise<string | null> {
    console.log('[WebPush] Starting getTokenInternal...');
    
    if (this.fcmToken) {
      console.log('[WebPush] Using cached token');
      return this.fcmToken;
    }

    if (!this.permissionGranted) {
      console.log('[WebPush] Permission not granted yet, requesting...');
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('[WebPush] Permission denied by user');
        return null;
      }
    }

    // iOS Safari: Use native Web Push API instead of Firebase
    // Firebase has known compatibility issues with iOS Safari service workers
    if (this.isIOS()) {
      console.log('[WebPush] iOS detected, using native Web Push API...');
      return await this.getIOSNativeToken();
    }

    const messaging = getMessaging();
    if (!messaging) {
      console.error('[WebPush] Firebase messaging not initialized');
      console.log('[WebPush] VAPID key present:', !!vapidKey);
      console.log('[WebPush] Messaging supported:', isMessagingSupported());
      throw new Error('Firebase messaging not initialized - ensure you are in a browser with service worker support');
    }

    console.log('[WebPush] Registering service worker...');
    const swRegistration = await this.registerAndWaitForServiceWorker();
    console.log('[WebPush] Service worker active, getting FCM token...');
    console.log('[WebPush] Using VAPID key:', vapidKey ? vapidKey.slice(0, 20) + '...' : 'MISSING');

    const token = await getToken(messaging, { 
      vapidKey: vapidKey,
      serviceWorkerRegistration: swRegistration
    });

    if (token) {
      this.fcmToken = token;
      console.log('[WebPush] FCM token obtained successfully:', token.slice(0, 20) + '...');
      return token;
    } else {
      console.log('[WebPush] No registration token available from Firebase');
      return null;
    }
  }

  /**
   * Get native Web Push subscription for iOS Safari
   * iOS Safari supports standard Web Push API
   * Uses Firebase's VAPID key for compatibility with existing backend
   */
  private async getIOSNativeToken(): Promise<string | null> {
    console.log('[WebPush] iOS: Starting native Web Push subscription...');
    
    try {
      // Wait for iOS to sync permission state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Register service worker - use the standard Firebase one
      console.log('[WebPush] iOS: Registering service worker...');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[WebPush] iOS: Service worker ready');
      
      // Check if PushManager is available
      if (!registration.pushManager) {
        throw new Error('Push notifications not supported - ensure PWA is installed to home screen');
      }
      
      // Use Firebase's VAPID key (imported from firebase.ts)
      const pushVapidKey = vapidKey;
      if (!pushVapidKey) {
        console.error('[WebPush] iOS: Firebase VAPID key not available');
        throw new Error('Push notification configuration error');
      }
      
      console.log('[WebPush] iOS: Using VAPID key:', pushVapidKey.slice(0, 20) + '...');
      
      // Subscribe using native Web Push API with Firebase VAPID key
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(pushVapidKey)
      });
      
      console.log('[WebPush] iOS: Got native push subscription');
      
      // Convert subscription to a token-like string for our backend
      const subscriptionJson = subscription.toJSON();
      const token = JSON.stringify({
        endpoint: subscriptionJson.endpoint,
        keys: subscriptionJson.keys,
        platform: 'ios-web-push'
      });
      
      this.fcmToken = token;
      console.log('[WebPush] iOS: Native token created successfully');
      return token;
      
    } catch (error: any) {
      console.error('[WebPush] iOS: Native Web Push failed:', error);
      throw error;
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array for Web Push API
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Get the last error that occurred
   */
  getLastError(): string | null {
    return this.lastError;
  }

  /**
   * Register device token with backend
   */
  async registerDevice(): Promise<boolean> {
    if (this.registrationInProgress) {
      console.log('[WebPush] Registration already in progress, skipping...');
      return false;
    }
    
    this.registrationInProgress = true;
    this.lastError = null;
    
    try {
      console.log('[WebPush] Starting device registration...');
      const token = await this.getToken();
      
      if (!token) {
        this.lastError = this.lastError || 'Failed to get FCM token - check browser console for details';
        console.log('[WebPush] No FCM token available, skipping registration');
        return false;
      }

      console.log('[WebPush] Got FCM token, registering with backend...');
      
      // Determine platform - iOS Safari uses native Web Push, others use FCM
      const platform = this.isIOS() ? 'ios' : 'web';
      console.log(`[WebPush] Registering as platform: ${platform}`);
      
      const response = await apiRequest('POST', '/api/push/register-device', {
        token,
        platform,
        deviceId: this.getDeviceId()
      });

      console.log('[WebPush] Device registered successfully with backend!', response);
      return true;
    } catch (error: any) {
      this.lastError = error?.message || String(error);
      console.error('[WebPush] Error registering device:', error);
      console.error('[WebPush] Registration error details:', error?.message || error);
      return false;
    } finally {
      this.registrationInProgress = false;
    }
  }

  /**
   * Unregister device from push notifications
   */
  async unregisterDevice(): Promise<boolean> {
    try {
      if (!this.fcmToken) {
        return true;
      }

      await apiRequest('DELETE', '/api/push/unregister-device', {
        token: this.fcmToken
      });

      this.fcmToken = null;
      console.log('[WebPush] Device unregistered from push notifications');
      return true;
    } catch (error) {
      console.error('[WebPush] Error unregistering device:', error);
      return false;
    }
  }

  /**
   * Setup foreground message listener
   */
  setupForegroundListener(onNotification: (payload: any) => void) {
    const messaging = getMessaging();
    if (!messaging) {
      console.warn('[WebPush] Firebase messaging not initialized for foreground listener');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('[WebPush] Foreground message received:', payload);
      
      if (payload.notification) {
        new Notification(payload.notification.title || 'MyKliq', {
          body: payload.notification.body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-180x180.png',
          data: payload.data
        });
      }
      
      onNotification(payload);
    });
  }

  /**
   * Check if we're on iOS/Safari
   */
  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  /**
   * Check if app is running in PWA standalone mode
   */
  isPWAMode(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Check if notifications are supported and enabled
   */
  isSupported(): boolean {
    const hasBasicSupport = isMessagingSupported();
    
    if (this.isIOS()) {
      return hasBasicSupport && this.isPWAMode();
    }
    
    return hasBasicSupport;
  }

  /**
   * Check if we need to show PWA install instructions
   */
  needsPWAInstall(): boolean {
    return this.isIOS() && !this.isPWAMode();
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Check if device is registered with backend
   */
  async checkBackendRegistration(): Promise<boolean> {
    try {
      const response = await apiRequest('GET', '/api/push/status');
      return response?.registered === true;
    } catch (error) {
      console.error('[WebPush] Error checking backend registration:', error);
      return false;
    }
  }

  /**
   * Register service worker and wait for it to be fully active
   */
  private async registerAndWaitForServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }

    try {
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      let registration = existingRegistrations.find(
        reg => reg.active?.scriptURL.includes('firebase-messaging-sw.js')
      );
      
      if (registration && registration.active) {
        console.log('[WebPush] Using existing active Firebase service worker');
        return registration;
      }
      
      if (!registration) {
        console.log('[WebPush] Registering firebase-messaging-sw.js...');
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[WebPush] Service worker registered:', registration.scope);
      }

      console.log('[WebPush] Waiting for service worker to be ready...');
      
      if (registration.active) {
        console.log('[WebPush] Service worker already active');
        return registration;
      }
      
      const workerToWatch = registration.installing || registration.waiting;
      if (workerToWatch) {
        console.log('[WebPush] Service worker state:', workerToWatch.state);
        await this.waitForServiceWorkerActive(workerToWatch);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[WebPush] Service worker fully active');
      return registration;
    } catch (error) {
      console.error('[WebPush] Service worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Wait for a service worker to become active
   */
  private waitForServiceWorkerActive(worker: ServiceWorker): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[WebPush] waitForServiceWorkerActive - current state:', worker.state);
      
      if (worker.state === 'activated' || worker.state === 'activating') {
        console.log('[WebPush] Service worker already activated/activating');
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        console.log('[WebPush] Timeout reached, current state:', worker.state);
        if (worker.state === 'installed' || worker.state === 'activating' || worker.state === 'activated') {
          resolve();
        } else {
          reject(new Error(`ServiceWorker activation timeout (state: ${worker.state})`));
        }
      }, 15000);

      const handleStateChange = () => {
        console.log('[WebPush] Service worker state changed:', worker.state);
        if (worker.state === 'activated') {
          clearTimeout(timeout);
          worker.removeEventListener('statechange', handleStateChange);
          resolve();
        } else if (worker.state === 'redundant') {
          clearTimeout(timeout);
          worker.removeEventListener('statechange', handleStateChange);
          reject(new Error('Service worker became redundant'));
        }
      };

      worker.addEventListener('statechange', handleStateChange);
    });
  }

  /**
   * Generate unique device ID
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('mykliq_device_id');
    
    if (!deviceId) {
      deviceId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('mykliq_device_id', deviceId);
    }
    
    return deviceId;
  }

  /**
   * Get cached FCM token (if available)
   */
  getCachedToken(): string | null {
    return this.fcmToken;
  }
}

export const webPushService = new WebPushNotificationService();
