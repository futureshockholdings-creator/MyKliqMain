/**
 * Web Push Notification Service
 * Handles Firebase Cloud Messaging for web push notifications
 */

import { messaging, getToken, onMessage, vapidKey } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';

export class WebPushNotificationService {
  private fcmToken: string | null = null;
  private permissionGranted: boolean = false;
  private lastError: string | null = null;

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
      }

      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      
      if (!this.permissionGranted) {
        console.log('Notification permission denied');
        return false;
      }

      console.log('Notification permission granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token for this device
   */
  async getToken(): Promise<string | null> {
    try {
      console.log('[WebPush] Starting getToken...');
      
      // Check if we already have a token
      if (this.fcmToken) {
        console.log('[WebPush] Using cached token');
        return this.fcmToken;
      }

      // Ensure we have permission
      if (!this.permissionGranted) {
        console.log('[WebPush] Permission not granted yet, requesting...');
        const hasPermission = await this.requestPermission();
        if (!hasPermission) {
          console.log('[WebPush] Permission denied by user');
          return null;
        }
      }

      if (!messaging) {
        console.error('[WebPush] Firebase messaging not initialized - check Firebase config');
        console.log('[WebPush] VAPID key present:', !!vapidKey);
        return null;
      }

      // Register service worker if not already registered
      console.log('[WebPush] Registering service worker...');
      await this.registerServiceWorker();
      console.log('[WebPush] Service worker registered, waiting for ready...');

      const swRegistration = await navigator.serviceWorker.ready;
      console.log('[WebPush] Service worker ready, getting FCM token...');
      console.log('[WebPush] Using VAPID key:', vapidKey ? vapidKey.slice(0, 20) + '...' : 'MISSING');

      // Get FCM token
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
    } catch (error: any) {
      console.error('[WebPush] Error getting FCM token:', error);
      console.error('[WebPush] Error details:', error?.message || error);
      console.error('[WebPush] Error code:', error?.code);
      this.lastError = `FCM Token Error: ${error?.message || error?.code || String(error)}`;
      return null;
    }
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
      
      // Register token with backend
      await apiRequest('POST', '/api/push/register-device', {
        token,
        platform: 'web',
        deviceId: this.getDeviceId()
      });

      console.log('[WebPush] Device registered successfully with backend!');
      return true;
    } catch (error: any) {
      this.lastError = error?.message || String(error);
      console.error('[WebPush] Error registering device:', error);
      console.error('[WebPush] Registration error details:', error?.message || error);
      return false;
    }
  }

  /**
   * Unregister device from push notifications
   */
  async unregisterDevice(): Promise<boolean> {
    try {
      if (!this.fcmToken) {
        return true; // Already unregistered
      }

      await apiRequest('DELETE', '/api/push/unregister-device', {
        token: this.fcmToken
      });

      this.fcmToken = null;
      console.log('Device unregistered from push notifications');
      return true;
    } catch (error) {
      console.error('Error unregistering device:', error);
      return false;
    }
  }

  /**
   * Setup foreground message listener
   * Handles notifications when app is in foreground
   */
  setupForegroundListener(onNotification: (payload: any) => void) {
    if (!messaging) {
      console.warn('Firebase messaging not initialized');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification using Notification API
      if (payload.notification) {
        new Notification(payload.notification.title || 'MyKliq', {
          body: payload.notification.body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-180x180.png',
          data: payload.data
        });
      }
      
      // Call custom handler
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
           (window.navigator as any).standalone === true; // iOS specific
  }

  /**
   * Check if notifications are supported and enabled
   * On iOS Safari, notifications only work in PWA standalone mode
   */
  isSupported(): boolean {
    const hasBasicSupport = 'Notification' in window && 'serviceWorker' in navigator;
    
    // On iOS, push notifications only work when installed as PWA
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
   * Register service worker for push notifications
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Firebase messaging service worker registered:', registration);
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
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
}

// Export singleton instance
export const webPushService = new WebPushNotificationService();
