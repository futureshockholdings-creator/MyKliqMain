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
  statusCode?: number;
  endpoint?: string;
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

    console.log('[WebPush] Initializing with VAPID keys:', {
      hasPublicKey: !!vapidPublicKey,
      hasPrivateKey: !!vapidPrivateKey,
      publicKeyPreview: vapidPublicKey?.slice(0, 20) + '...'
    });

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

    let parsed: any;
    let endpointPreview = 'unknown';
    
    try {
      parsed = JSON.parse(token);
      endpointPreview = parsed.endpoint?.slice(0, 80) + '...';
      
      const pushSubscription = {
        endpoint: parsed.endpoint,
        keys: parsed.keys
      };

      // Standard Web Push payload format - iOS 16.4+ uses standard Web Push API
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-72x72.png',
        data: payload.data || {},
        tag: 'mykliq-notification',
        requireInteraction: false
      });

      // Options for web-push library
      const options: webPush.RequestOptions = {
        TTL: 60 * 60, // 1 hour TTL
        urgency: 'high' as any
      };
      
      console.log('[WebPush] Sending notification:', { 
        endpoint: endpointPreview,
        payloadLength: notificationPayload.length 
      });

      await webPush.sendNotification(pushSubscription, notificationPayload, options);
      console.log('✅ iOS Web Push sent successfully to:', endpointPreview);
      return { success: true, endpoint: endpointPreview };
    } catch (error: any) {
      const statusCode = error.statusCode || 0;
      const errorBody = error.body || error.message;
      
      console.error('❌ iOS Web Push error:', {
        statusCode,
        message: error.message,
        body: errorBody,
        endpoint: endpointPreview
      });
      
      if (statusCode === 410) {
        console.log('🗑️  Subscription expired (410 Gone) - token should be deactivated:', endpointPreview);
      } else if (statusCode === 404) {
        console.log('🗑️  Subscription not found (404) - token should be deactivated:', endpointPreview);
      } else if (statusCode === 401) {
        console.error('🔑 VAPID authentication failed (401) - check VAPID keys');
      } else if (statusCode === 403) {
        console.error('🔑 VAPID authorization failed (403) - VAPID key mismatch with subscription');
      }
      
      return { 
        success: false, 
        error: error.message,
        statusCode,
        endpoint: endpointPreview
      };
    }
  }

  async sendToMultipleDevices(
    tokens: string[],
    payload: WebPushPayload
  ): Promise<{ 
    successCount: number; 
    failureCount: number; 
    results: WebPushResult[];
    expiredTokens: string[];
  }> {
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, results: [], expiredTokens: [] };
    }

    const results: WebPushResult[] = [];
    const expiredTokens: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const token of tokens) {
      const result = await this.sendToDevice(token, payload);
      results.push(result);
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        if (result.statusCode === 410 || result.statusCode === 404) {
          expiredTokens.push(token);
        }
      }
    }

    console.log(`✅ iOS Web Push multicast: ${successCount} succeeded, ${failureCount} failed`);
    
    if (expiredTokens.length > 0) {
      console.log(`🗑️  ${expiredTokens.length} expired tokens should be cleaned up`);
    }
    
    return { successCount, failureCount, results, expiredTokens };
  }
}

export const webPushService = new WebPushService();
