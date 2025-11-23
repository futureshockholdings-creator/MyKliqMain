/**
 * Google Analytics 4 (GA4) Service
 * Handles analytics tracking and event reporting
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

class AnalyticsService {
  private initialized = false;
  private measurementId: string | null = null;
  private scriptLoaded = false;

  /**
   * Initialize Google Analytics 4
   * Users grant consent during sign-up when accepting Terms & Privacy Policy
   * This is recorded in the database as termsAcceptedAt
   */
  init() {
    // Get GA4 measurement ID from environment variable
    this.measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

    if (!this.measurementId) {
      console.log('[Analytics] GA4 measurement ID not configured - analytics disabled');
      return;
    }

    if (this.initialized) {
      console.log('[Analytics] GA4 already initialized');
      return;
    }

    try {
      // Grant consent (users accepted terms during sign-up)
      if (window.gtag) {
        window.gtag('consent', 'default', {
          analytics_storage: 'granted',
          ad_storage: 'denied', // We don't use ads
        });
      }

      // Only load script if not already loaded
      if (!this.scriptLoaded) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
        document.head.appendChild(script);
        this.scriptLoaded = true;
      }

      // Configure GA4 with privacy-focused settings
      window.gtag('config', this.measurementId, {
        send_page_view: true,
        anonymize_ip: true, // GDPR compliance - anonymize IP addresses
        cookie_flags: 'SameSite=None;Secure', // Cookie security
        cookie_expires: 63072000, // 2 years in seconds
      });

      this.initialized = true;
      console.log('[Analytics] GA4 initialized (users consented during sign-up via termsAcceptedAt)');
    } catch (error) {
      console.error('[Analytics] Failed to initialize GA4:', error);
    }
  }

  /**
   * Track page view
   * @param path - Page path (e.g., '/home', '/settings')
   * @param title - Page title
   */
  trackPageView(path: string, title?: string) {
    if (!this.initialized) return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }

  /**
   * Track custom event
   * @param eventName - Name of the event
   * @param parameters - Event parameters
   */
  trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (!this.initialized) return;

    window.gtag('event', eventName, parameters);
  }

  /**
   * Track user engagement events
   */
  trackEngagement = {
    postCreated: (type: 'text' | 'image' | 'video' | 'poll') => {
      this.trackEvent('post_created', { post_type: type });
    },

    storyViewed: () => {
      this.trackEvent('story_viewed');
    },

    commentAdded: () => {
      this.trackEvent('comment_added');
    },

    postLiked: () => {
      this.trackEvent('post_liked');
    },

    messageSent: () => {
      this.trackEvent('message_sent');
    },

    friendAdded: () => {
      this.trackEvent('friend_added');
    },

    eventCreated: () => {
      this.trackEvent('event_created');
    },

    pollVoted: () => {
      this.trackEvent('poll_voted');
    },

    themeChanged: (themeName: string) => {
      this.trackEvent('theme_changed', { theme: themeName });
    },

    koinEarned: (amount: number, source: string) => {
      this.trackEvent('kliq_koin_earned', { amount, source });
    },

    borderPurchased: (borderId: string, cost: number) => {
      this.trackEvent('border_purchased', { border_id: borderId, cost });
    },

    socialAccountConnected: (platform: string) => {
      this.trackEvent('social_account_connected', { platform });
    },

    pwaInstalled: () => {
      this.trackEvent('pwa_installed');
    },

    pushNotificationsEnabled: () => {
      this.trackEvent('push_notifications_enabled');
    },
  };

  /**
   * Set user properties
   * @param properties - User properties to set
   */
  setUserProperties(properties: Record<string, any>) {
    if (!this.initialized) return;

    window.gtag('set', 'user_properties', properties);
  }

  /**
   * Track user ID (for authenticated users)
   * @param userId - User ID
   */
  setUserId(userId: string) {
    if (!this.initialized) return;

    window.gtag('set', { user_id: userId });
  }

  /**
   * Track conversion events (optional for future monetization)
   * @param value - Conversion value
   * @param currency - Currency code (default: USD)
   */
  trackConversion(value: number, currency: string = 'USD') {
    if (!this.initialized) return;

    window.gtag('event', 'conversion', {
      value,
      currency,
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
