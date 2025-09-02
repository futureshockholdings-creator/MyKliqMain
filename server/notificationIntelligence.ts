import { db } from './db';
import { notifications, users, userInteractionAnalytics, posts, postLikes, comments, stories, polls, events, actions } from '@shared/schema';
import { eq, and, desc, gte, count, avg, sql } from 'drizzle-orm';

interface NotificationTiming {
  userId: string;
  optimalHours: number[];
  timezone: string;
  averageResponseTime: number;
  lastActiveTime: Date;
}

interface PushNotificationPayload {
  userId: string;
  type: 'like' | 'comment' | 'mention' | 'friend_activity' | 'new_content' | 'conversation_starter';
  title: string;
  body: string;
  data: any;
  priority: 'high' | 'normal' | 'low';
  scheduledFor?: Date;
}

export class NotificationIntelligence {
  /**
   * Analyze user activity patterns to determine optimal notification timing
   */
  async analyzeUserActivityPatterns(userId: string): Promise<NotificationTiming> {
    // Get user's recent activity patterns (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Analyze when user is most active (posts, likes, comments, opens app)
    const [activityData] = await Promise.all([
      this.getUserActivityHours(userId, thirtyDaysAgo),
    ]);

    // Calculate optimal notification hours based on activity patterns
    const optimalHours = this.calculateOptimalHours(activityData);
    
    // Get user timezone from profile or default to EST
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const timezone = 'America/New_York'; // Default timezone (timezone not in user schema)

    return {
      userId,
      optimalHours,
      timezone,
      averageResponseTime: this.calculateAverageResponseTime(activityData),
      lastActiveTime: activityData.length > 0 ? activityData[0].timestamp : new Date()
    };
  }

  /**
   * Get user activity hours from various interactions
   */
  private async getUserActivityHours(userId: string, since: Date): Promise<Array<{hour: number, timestamp: Date, type: string}>> {
    const activities: Array<{hour: number, timestamp: Date, type: string}> = [];

    // Get posting activity
    const postsData: any[] = await db
      .select({ createdAt: posts.createdAt })
      .from(posts)
      .where(and(eq(posts.userId, userId), gte(posts.createdAt, since)));

    postsData.forEach((post: any) => {
      activities.push({
        hour: post.createdAt.getHours(),
        timestamp: post.createdAt,
        type: 'post'
      });
    });

    // Get liking activity
    const likes = await db
      .select({ createdAt: postLikes.createdAt })
      .from(postLikes)
      .where(and(eq(postLikes.userId, userId), gte(postLikes.createdAt, since)));

    likes.forEach(like => {
      activities.push({
        hour: (like.createdAt || new Date()).getHours(),
        timestamp: like.createdAt || new Date(),
        type: 'like'
      });
    });

    // Get commenting activity
    const commentsData: any[] = await db
      .select({ createdAt: comments.createdAt })
      .from(comments)
      .where(and(eq(comments.userId, userId), gte(comments.createdAt, since)));

    commentsData.forEach((comment: any) => {
      activities.push({
        hour: comment.createdAt.getHours(),
        timestamp: comment.createdAt,
        type: 'comment'
      });
    });

    // Sort by most recent first
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Calculate optimal notification hours based on activity patterns
   */
  private calculateOptimalHours(activities: Array<{hour: number, timestamp: Date, type: string}>): number[] {
    if (activities.length === 0) {
      // Default optimal hours if no data: morning, lunch, evening
      return [9, 12, 18, 20];
    }

    // Count activity by hour
    const hourCounts = new Map<number, number>();
    activities.forEach(activity => {
      const current = hourCounts.get(activity.hour) || 0;
      hourCounts.set(activity.hour, current + 1);
    });

    // Find top 4 most active hours
    const sortedHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([hour]) => hour)
      .sort((a, b) => a - b);

    // Ensure we have at least 2 hours, with sensible defaults
    if (sortedHours.length < 2) {
      return [9, 18, ...sortedHours].slice(0, 4);
    }

    return sortedHours;
  }

  /**
   * Calculate average response time for user
   */
  private calculateAverageResponseTime(activities: Array<{hour: number, timestamp: Date, type: string}>): number {
    if (activities.length < 2) return 4; // Default 4 hours

    // Calculate time between activities
    const timeDiffs: number[] = [];
    for (let i = 0; i < activities.length - 1; i++) {
      const diff = activities[i].timestamp.getTime() - activities[i + 1].timestamp.getTime();
      const hours = diff / (1000 * 60 * 60);
      if (hours > 0 && hours < 48) { // Only consider reasonable gaps
        timeDiffs.push(hours);
      }
    }

    if (timeDiffs.length === 0) return 4;

    // Return median response time
    timeDiffs.sort((a, b) => a - b);
    const mid = Math.floor(timeDiffs.length / 2);
    return timeDiffs.length % 2 === 0 
      ? (timeDiffs[mid - 1] + timeDiffs[mid]) / 2 
      : timeDiffs[mid];
  }

  /**
   * Determine if now is a good time to send notification to user
   */
  async shouldSendNotificationNow(userId: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<boolean> {
    const timing = await this.analyzeUserActivityPatterns(userId);
    const now = new Date();
    const currentHour = now.getHours();

    // High priority notifications can always be sent (but respect quiet hours)
    if (priority === 'high') {
      return !this.isQuietHour(currentHour);
    }

    // Check if current hour is in optimal hours
    const isOptimalTime = timing.optimalHours.includes(currentHour);
    
    // Check if user was recently active (within average response time)
    const timeSinceLastActive = (now.getTime() - timing.lastActiveTime.getTime()) / (1000 * 60 * 60);
    const wasRecentlyActive = timeSinceLastActive <= timing.averageResponseTime;

    // Send if optimal time OR recently active (but not both required for normal priority)
    return isOptimalTime || (priority === 'normal' && wasRecentlyActive);
  }

  /**
   * Check if current hour is a quiet hour (late night/early morning)
   */
  private isQuietHour(hour: number): boolean {
    // Quiet hours: 11 PM to 7 AM
    return hour >= 23 || hour <= 7;
  }

  /**
   * Create intelligent push notification with optimal timing
   */
  async createIntelligentNotification(payload: PushNotificationPayload): Promise<void> {
    const timing = await this.analyzeUserActivityPatterns(payload.userId);
    
    // Determine when to send based on priority and user patterns
    let scheduledFor = new Date();
    
    if (!await this.shouldSendNotificationNow(payload.userId, payload.priority)) {
      // Schedule for next optimal time
      scheduledFor = this.getNextOptimalTime(timing);
    }

    // Store notification for processing (simplified for schema compatibility)
    try {
      await db.insert(notifications).values({
        userId: payload.userId,
        type: payload.type as any,
        title: payload.title,
        message: payload.body,
        priority: payload.priority as any
      });
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  /**
   * Get next optimal time for notification
   */
  private getNextOptimalTime(timing: NotificationTiming): Date {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find next optimal hour today or tomorrow
    let nextHour = timing.optimalHours.find(hour => hour > currentHour);
    
    if (!nextHour) {
      // Use first optimal hour tomorrow
      nextHour = timing.optimalHours[0];
      now.setDate(now.getDate() + 1);
    }
    
    now.setHours(nextHour, 0, 0, 0);
    return now;
  }

  /**
   * Process pending notifications (called by background service)
   */
  async processPendingNotifications(): Promise<void> {
    const now = new Date();
    
    // Get notifications ready to be sent
    const pendingNotifications = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.isRead, false),
        sql`${notifications.createdAt} <= ${now}`
      ))
      .limit(50);

    for (const notification of pendingNotifications) {
      try {
        // Send push notification (placeholder for actual implementation)
        await this.sendPushNotification(notification);
        
        // Mark as sent
        await db
          .update(notifications)
          .set({ isRead: true, readAt: new Date() })
          .where(eq(notifications.id, notification.id));
          
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  }

  /**
   * Send actual push notification (integrate with FCM/APNS)
   */
  private async sendPushNotification(notification: any): Promise<void> {
    // This would integrate with Firebase Cloud Messaging (Android) and Apple Push Notifications (iOS)
    // For now, this is a placeholder that logs the notification
    
    console.log(`📱 Smart Notification Sent:`, {
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      scheduledFor: notification.scheduledFor,
      sentAt: new Date()
    });

    // TODO: Implement actual push notification sending
    // Example using Firebase Admin SDK:
    /*
    const message = {
      token: userDeviceToken,
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: JSON.parse(notification.data),
      android: {
        priority: notification.priority === 'high' ? 'high' : 'normal'
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default'
          }
        }
      }
    };
    
    await admin.messaging().send(message);
    */
  }

  /**
   * Generate smart notifications for various events
   */
  async generateSmartNotifications(event: {
    type: 'new_post' | 'new_like' | 'new_comment' | 'friend_activity' | 'conversation_starter';
    userId: string;
    targetUserId?: string;
    data: any;
  }): Promise<void> {
    const notifications: PushNotificationPayload[] = [];

    switch (event.type) {
      case 'new_like':
        if (event.targetUserId) {
          notifications.push({
            userId: event.targetUserId,
            type: 'like',
            title: '👍 New Like!',
            body: `${event.data.liker} liked your post`,
            data: { postId: event.data.postId },
            priority: 'normal'
          });
        }
        break;

      case 'new_comment':
        if (event.targetUserId) {
          notifications.push({
            userId: event.targetUserId,
            type: 'comment',
            title: '💬 New Comment!',
            body: `${event.data.commenter} commented on your post`,
            data: { postId: event.data.postId, commentId: event.data.commentId },
            priority: 'normal'
          });
        }
        break;

      case 'friend_activity':
        // Notify close friends about new posts from high-ranked friends
        const closefriendsToNotify = await this.getCloseFriendsForNotification(event.data.authorId);
        
        for (const friendId of closefriendsToNotify) {
          notifications.push({
            userId: friendId,
            type: 'friend_activity',
            title: '🎉 Friend Update!',
            body: `${event.data.authorName} shared something new`,
            data: { postId: event.data.postId },
            priority: 'low'
          });
        }
        break;

      case 'conversation_starter':
        // Notify about posts that are likely to start conversations
        const engagedFriends = await this.getEngagedFriendsForConversation(event.data.postId);
        
        for (const friendId of engagedFriends) {
          notifications.push({
            userId: friendId,
            type: 'conversation_starter',
            title: '🗣️ Join the Conversation!',
            body: `${event.data.authorName} posted something that might interest you`,
            data: { postId: event.data.postId },
            priority: 'low'
          });
        }
        break;
    }

    // Send all generated notifications
    for (const notification of notifications) {
      await this.createIntelligentNotification(notification);
    }
  }

  /**
   * Get close friends who should be notified about activity
   */
  private async getCloseFriendsForNotification(userId: string): Promise<string[]> {
    // Only notify friends ranked 1-5 (closest friends)
    const { friendships } = await import('@shared/schema');
    
    const closeFriends = await db
      .select({ friendId: friendships.friendId })
      .from(friendships)
      .where(and(
        eq(friendships.userId, userId),
        sql`${friendships.rank} <= 5`
      ));

    return closeFriends.map(f => f.friendId);
  }

  /**
   * Get friends who are likely to engage with conversation-starting content
   */
  private async getEngagedFriendsForConversation(postId: string): Promise<string[]> {
    // This would analyze who typically engages with similar content
    // For now, return empty array (placeholder)
    return [];
  }
}