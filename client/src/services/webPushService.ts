/**
 * Web Push Notification Service
 * Handles Firebase Cloud Messaging for web push notifications
 */

import { messaging, getToken, onMessage, vapidKey } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';

export class WebPushNotificationService {
  private fcmToken: string | null = null;
  private permissionGranted: boolean = false;

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
      // Check if we already have a token
      if (this.fcmToken) {
        return this.fcmToken;
      }

      // Ensure we have permission
      if (!this.permissionGranted) {
        const hasPermission = await this.requestPermission();
        if (!hasPermission) {
          return null;
        }
      }

      if (!messaging) {
        console.error('Firebase messaging not initialized');
        return null;
      }

      // Register service worker if not already registered
      await this.registerServiceWorker();

      // Get FCM token
      const token = await getToken(messaging, { 
        vapidKey: vapidKey,
        serviceWorkerRegistration: await navigator.serviceWorker.ready
      });

      if (token) {
        this.fcmToken = token;
        console.log('FCM token obtained:', token.slice(0, 20) + '...');
        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register device token with backend
   */
  async registerDevice(): Promise<boolean> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        console.log('No FCM token available, skipping registration');
        return false;
      }

      // Register token with backend
      await apiRequest('POST', '/api/push/register-device', {
        token,
        platform: 'web',
        deviceId: this.getDeviceId()
      });

      console.log('Device registered for push notifications');
      return true;
    } catch (error) {
      console.error('Error registering device:', error);
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
