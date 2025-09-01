// Firebase Analytics for React Native Mobile App
// This replaces the web Google Analytics for mobile-first approach

interface MobileAnalyticsEvent {
  name: string;
  parameters?: { [key: string]: any };
}

interface UserProperties {
  userId?: string;
  kliqSize?: number;
  userRank?: number;
  engagementLevel?: 'high' | 'medium' | 'low';
}

/**
 * Mobile Analytics Service for React Native
 * This will integrate with Firebase Analytics when building the React Native app
 */
export class MobileAnalytics {
  private isInitialized = false;
  
  /**
   * Initialize Firebase Analytics for React Native
   * This will be called once when the app starts
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // For React Native implementation:
      // import analytics from '@react-native-firebase/analytics';
      // await analytics().setAnalyticsCollectionEnabled(true);
      
      console.log('🔥 Firebase Analytics initialized for mobile app');
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize mobile analytics:', error);
    }
  }

  /**
   * Track screen views in React Native app
   */
  async trackScreen(screenName: string, screenClass?: string): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    
    try {
      // For React Native implementation:
      // import analytics from '@react-native-firebase/analytics';
      // await analytics().logScreenView({
      //   screen_name: screenName,
      //   screen_class: screenClass
      // });
      
      console.log(`📱 Screen View: ${screenName}`, { screenClass });
    } catch (error) {
      console.warn('Failed to track screen view:', error);
    }
  }

  /**
   * Track custom events optimized for mobile social app
   */
  async trackEvent(event: MobileAnalyticsEvent): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    
    try {
      // For React Native implementation:
      // import analytics from '@react-native-firebase/analytics';
      // await analytics().logEvent(event.name, event.parameters);
      
      console.log(`📊 Event: ${event.name}`, event.parameters);
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }

  /**
   * Set user properties for segmentation
   */
  async setUserProperties(properties: UserProperties): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    
    try {
      // For React Native implementation:
      // import analytics from '@react-native-firebase/analytics';
      // await analytics().setUserProperties(properties);
      
      console.log('👤 User Properties Set:', properties);
    } catch (error) {
      console.warn('Failed to set user properties:', error);
    }
  }

  // Social Media Specific Tracking Methods

  /**
   * Track post creation with engagement prediction
   */
  async trackPostCreated(postType: string, hasMedia: boolean, conversationScore: number): Promise<void> {
    await this.trackEvent({
      name: 'post_created',
      parameters: {
        post_type: postType,
        has_media: hasMedia,
        conversation_score: conversationScore,
        predicted_engagement: conversationScore > 60 ? 'high' : conversationScore > 30 ? 'medium' : 'low'
      }
    });
  }

  /**
   * Track social interactions with engagement analytics
   */
  async trackSocialInteraction(action: 'like' | 'comment' | 'share', targetUserId: string, contentType: string): Promise<void> {
    await this.trackEvent({
      name: 'social_interaction',
      parameters: {
        interaction_type: action,
        content_type: contentType,
        target_user_rank: 'unknown' // Will be populated from friend ranking system
      }
    });
  }

  /**
   * Track friend ranking changes
   */
  async trackFriendRankingChange(friendId: string, oldRank: number, newRank: number): Promise<void> {
    await this.trackEvent({
      name: 'friend_ranking_changed',
      parameters: {
        direction: newRank < oldRank ? 'promoted' : 'demoted',
        rank_change: Math.abs(newRank - oldRank),
        new_rank: newRank,
        old_rank: oldRank
      }
    });
  }

  /**
   * Track intelligent notification effectiveness
   */
  async trackNotificationEngagement(notificationType: string, wasOptimalTime: boolean, engagementDelay: number): Promise<void> {
    await this.trackEvent({
      name: 'notification_engagement',
      parameters: {
        notification_type: notificationType,
        was_optimal_time: wasOptimalTime,
        engagement_delay_minutes: Math.round(engagementDelay / 60000), // Convert ms to minutes
        timing_effectiveness: wasOptimalTime && engagementDelay < 300000 ? 'high' : 'low' // 5 min threshold
      }
    });
  }

  /**
   * Track connection health insights usage
   */
  async trackConnectionHealthAction(action: 'viewed_insights' | 'followed_suggestion' | 'reached_out', friendId?: string): Promise<void> {
    await this.trackEvent({
      name: 'connection_health_action',
      parameters: {
        action_type: action,
        has_friend_context: !!friendId
      }
    });
  }

  /**
   * Track app performance and user experience
   */
  async trackPerformance(screen: string, loadTime: number, cacheHit: boolean): Promise<void> {
    await this.trackEvent({
      name: 'app_performance',
      parameters: {
        screen_name: screen,
        load_time_ms: loadTime,
        cache_hit: cacheHit,
        performance_tier: loadTime < 1000 ? 'excellent' : loadTime < 3000 ? 'good' : 'needs_improvement'
      }
    });
  }

  /**
   * Track feed curation effectiveness
   */
  async trackFeedEngagement(totalPosts: number, engagedPosts: number, curationApplied: boolean): Promise<void> {
    const engagementRate = totalPosts > 0 ? (engagedPosts / totalPosts) * 100 : 0;
    
    await this.trackEvent({
      name: 'feed_engagement',
      parameters: {
        total_posts_shown: totalPosts,
        posts_engaged_with: engagedPosts,
        engagement_rate: Math.round(engagementRate),
        curation_applied: curationApplied,
        feed_quality: engagementRate > 20 ? 'high' : engagementRate > 10 ? 'medium' : 'low'
      }
    });
  }
}

// Create singleton instance for app-wide use
export const mobileAnalytics = new MobileAnalytics();

// Helper functions for common tracking scenarios
export const trackMobileScreen = (screenName: string) => mobileAnalytics.trackScreen(screenName);
export const trackMobileEvent = (name: string, parameters?: any) => mobileAnalytics.trackEvent({ name, parameters });
export const setMobileUserProperties = (properties: UserProperties) => mobileAnalytics.setUserProperties(properties);

/**
 * React Native Integration Instructions:
 * 
 * 1. Install Firebase SDK:
 *    npm install @react-native-firebase/app @react-native-firebase/analytics
 * 
 * 2. Configure Firebase project:
 *    - Create Firebase project at https://console.firebase.google.com
 *    - Add iOS and Android apps to project
 *    - Download GoogleService-Info.plist (iOS) and google-services.json (Android)
 * 
 * 3. Platform-specific setup:
 *    iOS: Add GoogleService-Info.plist to Xcode project
 *    Android: Add google-services.json to android/app/ directory
 * 
 * 4. Enable Analytics in Firebase Console:
 *    - Go to Analytics > Events to see real-time data
 *    - Set up conversion events for key actions
 * 
 * 5. Replace console.log statements with actual Firebase calls
 *    - Uncomment the analytics().logEvent() calls
 *    - Test on device (analytics won't work in simulator)
 */