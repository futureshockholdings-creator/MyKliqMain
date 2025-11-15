import admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import type { DeviceToken } from '@shared/schema';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class FirebaseNotificationService {
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Check if Firebase Admin SDK credentials are configured
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (!serviceAccountJson) {
        console.warn('⚠️  Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT env var to enable push notifications.');
        return;
      }

      // Parse service account JSON
      const serviceAccount = JSON.parse(serviceAccountJson);

      // Initialize Firebase Admin SDK
      // Check if already initialized (admin.apps is an array)
      if (!admin.apps || admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as any)
        });
        console.log('✅ Firebase Admin SDK initialized successfully');
      } else {
        console.log('ℹ️  Firebase Admin SDK already initialized');
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(
    token: string,
    payload: NotificationPayload
  ): Promise<SendNotificationResult> {
    if (!this.initialized) {
      console.log('📱 Push notification simulated (Firebase not configured):', { token: token.slice(0, 20) + '...', ...payload });
      return {
        success: false,
        error: 'Firebase Admin SDK not initialized'
      };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data || {},
        token: token
      };

      const messageId = await getMessaging().send(message);
      
      console.log('✅ Notification sent successfully:', messageId);
      return {
        success: true,
        messageId
      };
    } catch (error: any) {
      console.error('❌ Error sending notification:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<{
    successCount: number;
    failureCount: number;
    results: SendNotificationResult[];
  }> {
    if (!this.initialized) {
      console.log('📱 Multicast notification simulated (Firebase not configured):', { deviceCount: tokens.length, ...payload });
      return {
        successCount: 0,
        failureCount: tokens.length,
        results: tokens.map(() => ({
          success: false,
          error: 'Firebase Admin SDK not initialized'
        }))
      };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, results: [] };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data || {},
        tokens: tokens
      };

      const response = await getMessaging().sendEachForMulticast(message);
      
      console.log(`✅ Multicast sent: ${response.successCount} succeeded, ${response.failureCount} failed`);
      
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        results: response.responses.map(r => ({
          success: r.success,
          messageId: r.messageId,
          error: r.error?.message
        }))
      };
    } catch (error: any) {
      console.error('❌ Error sending multicast notification:', error.message);
      return {
        successCount: 0,
        failureCount: tokens.length,
        results: tokens.map(() => ({
          success: false,
          error: error.message
        }))
      };
    }
  }

  /**
   * Send data-only message (no notification UI)
   */
  async sendDataMessage(
    token: string,
    data: Record<string, string>
  ): Promise<SendNotificationResult> {
    if (!this.initialized) {
      console.log('📱 Data message simulated (Firebase not configured):', { token: token.slice(0, 20) + '...', data });
      return {
        success: false,
        error: 'Firebase Admin SDK not initialized'
      };
    }

    try {
      const message = {
        data: data,
        token: token
      };

      const messageId = await getMessaging().send(message);
      
      console.log('✅ Data message sent successfully:', messageId);
      return {
        success: true,
        messageId
      };
    } catch (error: any) {
      console.error('❌ Error sending data message:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(
    topic: string,
    payload: NotificationPayload
  ): Promise<SendNotificationResult> {
    if (!this.initialized) {
      console.log('📱 Topic notification simulated (Firebase not configured):', { topic, ...payload });
      return {
        success: false,
        error: 'Firebase Admin SDK not initialized'
      };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data || {},
        topic: topic
      };

      const messageId = await getMessaging().send(message);
      
      console.log('✅ Topic notification sent successfully:', messageId);
      return {
        success: true,
        messageId
      };
    } catch (error: any) {
      console.error('❌ Error sending topic notification:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper: Send notification to all devices for a specific user
   */
  async sendToUser(
    deviceTokens: DeviceToken[],
    payload: NotificationPayload
  ): Promise<{
    successCount: number;
    failureCount: number;
  }> {
    const activeTokens = deviceTokens
      .filter(dt => dt.isActive && dt.token)
      .map(dt => dt.token);

    if (activeTokens.length === 0) {
      console.log('⚠️  No active device tokens found for user');
      return { successCount: 0, failureCount: 0 };
    }

    const result = await this.sendToMultipleDevices(activeTokens, payload);
    return {
      successCount: result.successCount,
      failureCount: result.failureCount
    };
  }

  /**
   * Check if Firebase is initialized and ready
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const firebaseNotificationService = new FirebaseNotificationService();
