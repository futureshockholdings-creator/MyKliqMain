import webPush from 'web-push';

export interface WebPushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  badge?: string;
}

export interface WebPushResult {
  success: boolean;
  error?: string;
}

class WebPushService {
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:support@mykliq.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('⚠️  VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars for iOS Web Push.');
      return;
    }

    try {
      webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
      this.initialized = true;
      console.log('✅ Web Push (VAPID) initialized successfully for iOS Safari');
    } catch (error) {
      console.error('❌ Failed to initialize Web Push:', error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isIOSWebPushToken(token: string): boolean {
    try {
      const parsed = JSON.parse(token);
      return parsed.platform === 'ios-web-push' && parsed.endpoint && parsed.keys;
    } catch {
      return false;
    }
  }

  async sendToDevice(token: string, payload: WebPushPayload): Promise<WebPushResult> {
    if (!this.initialized) {
      console.log('📱 Web Push simulated (VAPID not configured):', { tokenPreview: token.slice(0, 50), ...payload });
      return { success: false, error: 'Web Push not initialized' };
    }

    try {
      const parsed = JSON.parse(token);
      
      const pushSubscription = {
        endpoint: parsed.endpoint,
        keys: parsed.keys
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-72x72.png',
        data: payload.data || {}
      });

      await webPush.sendNotification(pushSubscription, notificationPayload);
      console.log('✅ iOS Web Push sent successfully to:', parsed.endpoint.slice(0, 50) + '...');
      return { success: true };
    } catch (error: any) {
      console.error('❌ iOS Web Push error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendToMultipleDevices(
    tokens: string[],
    payload: WebPushPayload
  ): Promise<{ successCount: number; failureCount: number; results: WebPushResult[] }> {
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, results: [] };
    }

    const results: WebPushResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const token of tokens) {
      const result = await this.sendToDevice(token, payload);
      results.push(result);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    console.log(`✅ iOS Web Push multicast: ${successCount} succeeded, ${failureCount} failed`);
    return { successCount, failureCount, results };
  }
}

export const webPushService = new WebPushService();
