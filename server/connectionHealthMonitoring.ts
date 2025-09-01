import { db } from './db';
import { friendships, posts, postLikes, comments, messages, users, conversations } from '@shared/schema';
import { eq, and, desc, gte, lt, count, sql } from 'drizzle-orm';

interface ConnectionHealth {
  friendId: string;
  friendName: string;
  ranking: number;
  lastInteraction: Date | null;
  daysSinceInteraction: number;
  interactionStrength: number;
  healthStatus: 'strong' | 'moderate' | 'weak' | 'dormant';
  recommendations: string[];
}

interface ConversationSuggestion {
  friendId: string;
  friendName: string;
  suggestionType: 'shared_interest' | 'recent_activity' | 'milestone' | 'follow_up';
  suggestion: string;
  context: string;
  priority: number;
}

interface GroupDynamics {
  totalMembers: number;
  activeMembers: number;
  dominantPosters: string[];
  quietMembers: string[];
  engagementBalance: number;
  recommendations: string[];
}

export class ConnectionHealthMonitoring {
  /**
   * Analyze connection health for all friendships
   */
  async analyzeConnectionHealth(userId: string): Promise<ConnectionHealth[]> {
    const friendsList = await this.getUserFriends(userId);
    const healthAnalysis: ConnectionHealth[] = [];

    for (const friendship of friendsList) {
      const health = await this.analyzeSingleConnection(userId, friendship);
      healthAnalysis.push(health);
    }

    // Sort by health priority (dormant connections first, then by ranking)
    return healthAnalysis.sort((a, b) => {
      if (a.healthStatus === 'dormant' && b.healthStatus !== 'dormant') return -1;
      if (b.healthStatus === 'dormant' && a.healthStatus !== 'dormant') return 1;
      return a.ranking - b.ranking; // Higher ranking friends first
    });
  }

  /**
   * Get user's friends with rankings
   */
  private async getUserFriends(userId: string): Promise<Array<{friendId: string, ranking: number, friend: any}>> {
    const friends = await db
      .select({
        friendId: friendships.friendId,
        ranking: friendships.rank,
        friend: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.friendId, users.id))
      .where(eq(friendships.userId, userId));

    return friends;
  }

  /**
   * Analyze health of a single connection
   */
  private async analyzeSingleConnection(userId: string, friendship: any): Promise<ConnectionHealth> {
    const friendId = friendship.friendId;
    const friendName = `${friendship.friend.firstName} ${friendship.friend.lastName}`;
    
    // Get interaction data
    const [lastInteraction, interactionStrength] = await Promise.all([
      this.getLastInteractionDate(userId, friendId),
      this.calculateInteractionStrength(userId, friendId)
    ]);

    const daysSinceInteraction = lastInteraction 
      ? Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const healthStatus = this.determineHealthStatus(daysSinceInteraction, interactionStrength, friendship.ranking);
    const recommendations = this.generateHealthRecommendations(healthStatus, daysSinceInteraction, friendName, friendship.ranking);

    return {
      friendId,
      friendName,
      ranking: friendship.ranking,
      lastInteraction,
      daysSinceInteraction,
      interactionStrength,
      healthStatus,
      recommendations
    };
  }

  /**
   * Get date of last meaningful interaction between two users
   */
  private async getLastInteractionDate(userId: string, friendId: string): Promise<Date | null> {
    const interactions: Date[] = [];

    // Check likes on friend's posts
    const lastLike = await db
      .select({ createdAt: postLikes.createdAt })
      .from(postLikes)
      .innerJoin(posts, eq(postLikes.postId, posts.id))
      .where(and(
        eq(postLikes.userId, userId),
        eq(posts.userId, friendId)
      ))
      .orderBy(desc(postLikes.createdAt))
      .limit(1);

    if (lastLike[0]) interactions.push(lastLike[0].createdAt);

    // Check comments on friend's posts
    const lastComment = await db
      .select({ createdAt: comments.createdAt })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(and(
        eq(comments.userId, userId),
        eq(posts.userId, friendId)
      ))
      .orderBy(desc(comments.createdAt))
      .limit(1);

    if (lastComment[0]) interactions.push(lastComment[0].createdAt);

    // Check direct messages
    const lastMessage = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(
        eq(messages.senderId, userId),
        sql`${conversations.participantIds}::text LIKE '%${friendId}%'`
      ))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    if (lastMessage[0]) interactions.push(lastMessage[0].createdAt);

    // Return most recent interaction
    return interactions.length > 0 
      ? new Date(Math.max(...interactions.map(d => d.getTime())))
      : null;
  }

  /**
   * Calculate interaction strength based on frequency and recency
   */
  private async calculateInteractionStrength(userId: string, friendId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count interactions in last 30 days
    const [likesCount, commentsCount, messagesCount] = await Promise.all([
      this.countRecentLikes(userId, friendId, thirtyDaysAgo),
      this.countRecentComments(userId, friendId, thirtyDaysAgo),
      this.countRecentMessages(userId, friendId, thirtyDaysAgo)
    ]);

    // Weight different interaction types
    const strength = (likesCount * 1) + (commentsCount * 3) + (messagesCount * 5);
    
    // Normalize to 0-100 scale
    return Math.min(strength * 2, 100);
  }

  /**
   * Count recent likes on friend's posts
   */
  private async countRecentLikes(userId: string, friendId: string, since: Date): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(postLikes)
      .innerJoin(posts, eq(postLikes.postId, posts.id))
      .where(and(
        eq(postLikes.userId, userId),
        eq(posts.userId, friendId),
        gte(postLikes.createdAt, since)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Count recent comments on friend's posts
   */
  private async countRecentComments(userId: string, friendId: string, since: Date): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(and(
        eq(comments.userId, userId),
        eq(posts.userId, friendId),
        gte(comments.createdAt, since)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Count recent direct messages
   */
  private async countRecentMessages(userId: string, friendId: string, since: Date): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(
        eq(messages.senderId, userId),
        sql`${conversations.participantIds}::text LIKE '%${friendId}%'`,
        gte(messages.createdAt, since)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Determine health status based on metrics
   */
  private determineHealthStatus(daysSinceInteraction: number, strength: number, ranking: number): 'strong' | 'moderate' | 'weak' | 'dormant' {
    // Adjust thresholds based on friend ranking (closer friends should interact more frequently)
    const isCloseFriend = ranking <= 5;
    const isGoodFriend = ranking <= 10;
    
    if (daysSinceInteraction >= 21) return 'dormant';
    if (daysSinceInteraction >= 14 && (isCloseFriend || strength < 20)) return 'weak';
    if (daysSinceInteraction >= 7 && isCloseFriend && strength < 30) return 'weak';
    if (daysSinceInteraction >= 10 && strength < 15) return 'moderate';
    if (strength >= 40 && daysSinceInteraction <= 3) return 'strong';
    if (strength >= 20 && daysSinceInteraction <= 7) return 'strong';
    
    return 'moderate';
  }

  /**
   * Generate recommendations for improving connection health
   */
  private generateHealthRecommendations(status: string, daysSince: number, friendName: string, ranking: number): string[] {
    const recommendations: string[] = [];
    const firstName = friendName.split(' ')[0];

    switch (status) {
      case 'dormant':
        recommendations.push(`It's been ${daysSince} days since you connected with ${firstName}`);
        recommendations.push(`Send ${firstName} a message to catch up`);
        if (ranking <= 5) {
          recommendations.push(`${firstName} is one of your closest friends - reach out soon!`);
        }
        break;

      case 'weak':
        recommendations.push(`Your connection with ${firstName} could use some attention`);
        recommendations.push(`Like or comment on ${firstName}'s recent posts`);
        recommendations.push(`Send a quick message to see how ${firstName} is doing`);
        break;

      case 'moderate':
        recommendations.push(`Keep up the good connection with ${firstName}`);
        recommendations.push(`Consider starting a conversation about shared interests`);
        break;

      case 'strong':
        recommendations.push(`Great connection with ${firstName}!`);
        recommendations.push(`Your friendship with ${firstName} is thriving`);
        break;
    }

    return recommendations;
  }

  /**
   * Generate conversation suggestions based on shared interests and recent activity
   */
  async generateConversationSuggestions(userId: string, friendId: string): Promise<ConversationSuggestion[]> {
    const suggestions: ConversationSuggestion[] = [];
    const friend = await this.getFriendInfo(friendId);
    const friendName = `${friend.firstName} ${friend.lastName}`;

    // Get recent activity for context
    const recentPosts = await this.getFriendRecentPosts(friendId, 5);
    
    // Generate different types of suggestions
    suggestions.push(...await this.generateActivityBasedSuggestions(friendName, friendId, recentPosts));
    suggestions.push(...this.generateInterestBasedSuggestions(friendName, friendId));
    suggestions.push(...this.generateMilestoneSuggestions(friendName, friendId));

    // Sort by priority and return top suggestions
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }

  /**
   * Get friend information
   */
  private async getFriendInfo(friendId: string): Promise<any> {
    const friend = await db
      .select()
      .from(users)
      .where(eq(users.id, friendId))
      .limit(1);

    return friend[0];
  }

  /**
   * Get friend's recent posts
   */
  private async getFriendRecentPosts(friendId: string, limit: number): Promise<any[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, friendId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  /**
   * Generate suggestions based on recent activity
   */
  private async generateActivityBasedSuggestions(friendName: string, friendId: string, recentPosts: any[]): Promise<ConversationSuggestion[]> {
    const suggestions: ConversationSuggestion[] = [];
    const firstName = friendName.split(' ')[0];

    for (const post of recentPosts.slice(0, 2)) {
      const content = post.content.substring(0, 50);
      suggestions.push({
        friendId,
        friendName,
        suggestionType: 'recent_activity',
        suggestion: `Ask ${firstName} about their recent post`,
        context: `"${content}${post.content.length > 50 ? '...' : ''}"`,
        priority: 80
      });
    }

    return suggestions;
  }

  /**
   * Generate suggestions based on shared interests
   */
  private generateInterestBasedSuggestions(friendName: string, friendId: string): ConversationSuggestion[] {
    const firstName = friendName.split(' ')[0];
    const interests = [
      'movies', 'music', 'travel', 'food', 'hobbies', 'work', 'weekend plans'
    ];
    
    const randomInterest = interests[Math.floor(Math.random() * interests.length)];
    
    return [{
      friendId,
      friendName,
      suggestionType: 'shared_interest',
      suggestion: `Chat about ${randomInterest}`,
      context: `Start a conversation about ${randomInterest} with ${firstName}`,
      priority: 60
    }];
  }

  /**
   * Generate milestone-based suggestions
   */
  private generateMilestoneSuggestions(friendName: string, friendId: string): ConversationSuggestion[] {
    const firstName = friendName.split(' ')[0];
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Weekend check-in
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return [{
        friendId,
        friendName,
        suggestionType: 'milestone',
        suggestion: `Ask ${firstName} about weekend plans`,
        context: 'Weekend check-in',
        priority: 70
      }];
    }
    
    // Monday motivation
    if (dayOfWeek === 1) {
      return [{
        friendId,
        friendName,
        suggestionType: 'milestone',
        suggestion: `Send ${firstName} some Monday motivation`,
        context: 'Start the week positively',
        priority: 65
      }];
    }

    return [];
  }

  /**
   * Analyze group dynamics in the kliq
   */
  async analyzeGroupDynamics(userId: string): Promise<GroupDynamics> {
    const friends = await this.getUserFriends(userId);
    const totalMembers = friends.length + 1; // Include the user
    
    // Get posting activity for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const allUserIds = [userId, ...friends.map(f => f.friendId)];
    const activityStats = await this.getUserActivityStats(allUserIds, thirtyDaysAgo);
    
    const activeMembers = activityStats.filter(stat => stat.totalActivity > 0).length;
    const dominantPosters = activityStats
      .filter(stat => stat.totalActivity > 10)
      .map(stat => stat.userId)
      .slice(0, 3);
    
    const quietMembers = activityStats
      .filter(stat => stat.totalActivity === 0)
      .map(stat => stat.userId)
      .slice(0, 3);

    const engagementBalance = this.calculateEngagementBalance(activityStats);
    const recommendations = this.generateGroupRecommendations(activeMembers, totalMembers, dominantPosters.length, quietMembers.length);

    return {
      totalMembers,
      activeMembers,
      dominantPosters,
      quietMembers,
      engagementBalance,
      recommendations
    };
  }

  /**
   * Get user activity statistics
   */
  private async getUserActivityStats(userIds: string[], since: Date): Promise<Array<{userId: string, totalActivity: number}>> {
    const stats = await Promise.all(
      userIds.map(async (userId) => {
        const [postsCount, likesCount, commentsCount] = await Promise.all([
          this.countUserPosts(userId, since),
          this.countUserLikes(userId, since),
          this.countUserComments(userId, since)
        ]);

        return {
          userId,
          totalActivity: postsCount + likesCount + commentsCount
        };
      })
    );

    return stats;
  }

  /**
   * Count user posts since date
   */
  private async countUserPosts(userId: string, since: Date): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(posts)
      .where(and(
        eq(posts.userId, userId),
        gte(posts.createdAt, since)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Count user likes since date
   */
  private async countUserLikes(userId: string, since: Date): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(postLikes)
      .where(and(
        eq(postLikes.userId, userId),
        gte(postLikes.createdAt, since)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Count user comments since date
   */
  private async countUserComments(userId: string, since: Date): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(comments)
      .where(and(
        eq(comments.userId, userId),
        gte(comments.createdAt, since)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Calculate engagement balance score
   */
  private calculateEngagementBalance(stats: Array<{userId: string, totalActivity: number}>): number {
    if (stats.length === 0) return 0;

    const activities = stats.map(s => s.totalActivity);
    const max = Math.max(...activities);
    const min = Math.min(...activities);
    const average = activities.reduce((sum, a) => sum + a, 0) / activities.length;

    // Calculate balance (lower variance = better balance)
    const variance = activities.reduce((sum, a) => sum + Math.pow(a - average, 2), 0) / activities.length;
    const balance = Math.max(0, 100 - (variance / Math.max(average, 1)) * 10);

    return Math.round(balance);
  }

  /**
   * Generate group dynamic recommendations
   */
  private generateGroupRecommendations(activeMembers: number, totalMembers: number, dominantCount: number, quietCount: number): string[] {
    const recommendations: string[] = [];
    const participationRate = (activeMembers / totalMembers) * 100;

    if (participationRate < 50) {
      recommendations.push('Consider reaching out to inactive members');
      recommendations.push('Share content that encourages group participation');
    }

    if (quietCount > 2) {
      recommendations.push('Some friends haven\'t been active lately - check in with them');
    }

    if (dominantCount > 3) {
      recommendations.push('Great engagement from active members!');
    }

    if (participationRate >= 80) {
      recommendations.push('Excellent kliq engagement - everyone is participating!');
    }

    return recommendations;
  }

  /**
   * Get priority connection health alerts for user
   */
  async getConnectionAlerts(userId: string): Promise<ConnectionHealth[]> {
    const healthAnalysis = await this.analyzeConnectionHealth(userId);
    
    // Return dormant and weak connections that need attention
    return healthAnalysis.filter(health => 
      health.healthStatus === 'dormant' || 
      (health.healthStatus === 'weak' && health.ranking <= 10)
    );
  }
}