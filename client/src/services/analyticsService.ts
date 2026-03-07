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

  /**
   * Initialize Google Analytics 4
   * Users grant consent during sign-up when accepting Terms & Privacy Policy
   * This is recorded in the database as termsAcceptedAt
   */
  init() {
    // Use env variable if provided, otherwise fall back to the hardcoded ID in index.html
    this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-Q3VCE04DVT';

    if (this.initialized) {
      console.log('[Analytics] GA4 already initialized');
      return;
    }

    try {
      // gtag script is loaded directly in index.html — no dynamic injection needed.
      // Just configure consent and settings via the already-available window.gtag.
      if (window.gtag) {
        window.gtag('consent', 'default', {
          analytics_storage: 'granted',
          ad_storage: 'denied',
        });

        window.gtag('config', this.measurementId, {
          send_page_view: true,
          anonymize_ip: true,
          cookie_flags: 'SameSite=None;Secure',
          cookie_expires: 63072000,
        });

        this.initialized = true;
        console.log('[Analytics] GA4 initialized with user consent');
      } else {
        console.warn('[Analytics] gtag not available yet — will retry on next call');
      }
    } catch (error) {
      console.error('[Analytics] Failed to initialize GA4:', error);
    }
  }

  /**
   * Revoke analytics consent and disable tracking
   * Called when user opts out of analytics in Settings
   */
  revokeConsent() {
    if (window.gtag) {
      // Update consent to denied
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
      
      console.log('[Analytics] User revoked analytics consent - tracking disabled');
    }
    
    this.initialized = false;
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
