import { db } from './db';
import { 
  users, 
  friendships, 
  userInteractionAnalytics, 
  friendRankingSuggestions,
  contentEngagements,
  postLikes,
  posts,
  commentLikes,
  comments,
  messages,
  stories,
  storyViews,
  actions,
  actionViewers,
  meetupCheckIns,
  eventAttendees,
  type InsertUserInteractionAnalytics,
  type InsertFriendRankingSuggestion,
  type InsertContentEngagement
} from '@shared/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';

// Smart Friend Ranking Intelligence System
export class FriendRankingIntelligence {
  
  async ensureDbConstraints(): Promise<void> {
    try {
      await db.execute(sql`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'user_interaction_analytics_user_friend_unique'
          ) THEN
            ALTER TABLE user_interaction_analytics 
            ADD CONSTRAINT user_interaction_analytics_user_friend_unique 
            UNIQUE (user_id, friend_id);
          END IF;
        END $$;
      `);
    } catch (e) {
      console.log("[SmartRanking] Could not ensure DB constraints (non-critical):", (e as any)?.message);
    }
  }
  
  // Weighted scoring factors (adjustable based on analysis)
  private static readonly SCORING_WEIGHTS = {
    messagesSent: 3.0,
    messagesReceived: 2.5,
    postLikesGiven: 1.5,
    postLikesReceived: 2.0,
    commentsGiven: 2.5,
    commentsReceived: 3.0,
    commentLikesGiven: 1.0,
    commentLikesReceived: 1.5,
    storyViewsGiven: 1.0,
    storyViewsReceived: 1.2,
    videoCalls: 8.0,           // High weight - indicates close friendship
    liveStreamViews: 2.0,
    meetupAttendanceTogether: 5.0,  // High weight - in-person interactions
    eventAttendanceTogether: 3.0,
    totalInteractionTime: 0.001,    // Per second (converted to reasonable scale)
    averageResponseTime: -0.01,     // Negative weight (faster response = higher score)
  };

  private static readonly CONSISTENCY_DECAY_DAYS = 7; // Days without interaction start reducing consistency score
  private static readonly MAX_CALCULATION_PERIOD_DAYS = 30;

  /**
   * Calculate comprehensive interaction analytics for a user-friend pair
   */
  async calculateInteractionAnalytics(userId: string, friendId: string): Promise<InsertUserInteractionAnalytics> {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - FriendRankingIntelligence.MAX_CALCULATION_PERIOD_DAYS);

    // Get all interaction data in parallel for efficiency
    const [
      messageData,
      postLikeData,
      commentData,
      commentLikeData,
      storyViewData,
      liveStreamData,
      meetupData,
      eventData,
      contentEngagementData,
      currentFriendship
    ] = await Promise.all([
      // Messages exchanged
      this.getMessageInteractions(userId, friendId, periodStart),
      // Post likes given/received
      this.getPostLikeInteractions(userId, friendId, periodStart),
      // Comments given/received
      this.getCommentInteractions(userId, friendId, periodStart),
      // Comment likes given/received
      this.getCommentLikeInteractions(userId, friendId, periodStart),
      // Story views given/received
      this.getStoryViewInteractions(userId, friendId, periodStart),
      // Live stream viewing
      this.getLiveStreamInteractions(userId, friendId, periodStart),
      // Meetup attendance together
      this.getMeetupInteractions(userId, friendId, periodStart),
      // Event attendance together
      this.getEventInteractions(userId, friendId, periodStart),
      // Content engagement time
      this.getContentEngagementData(userId, friendId, periodStart),
      // Current friendship rank
      this.getCurrentFriendshipRank(userId, friendId)
    ]);

    // Calculate scores
    const interactionScore = this.calculateInteractionScore({
      messagesSent: messageData.sent,
      messagesReceived: messageData.received,
      postLikesGiven: postLikeData.given,
      postLikesReceived: postLikeData.received,
      commentsGiven: commentData.given,
      commentsReceived: commentData.received,
      commentLikesGiven: commentLikeData.given,
      commentLikesReceived: commentLikeData.received,
      storyViewsGiven: storyViewData.given,
      storyViewsReceived: storyViewData.received,
      videoCalls: 0, // TODO: Implement video call tracking
      liveStreamViews: liveStreamData.views,
      meetupAttendanceTogether: meetupData.together,
      eventAttendanceTogether: eventData.together,
      totalInteractionTime: contentEngagementData.totalTime,
      averageResponseTime: messageData.avgResponseTime,
    });

    const consistencyScore = this.calculateConsistencyScore(contentEngagementData.lastInteraction);
    const engagementScore = this.calculateEngagementScore(contentEngagementData.totalTime, contentEngagementData.interactions);
    const overallScore = (interactionScore + consistencyScore + engagementScore) / 3;

    return {
      userId,
      friendId,
      messagesSent: messageData.sent,
      messagesReceived: messageData.received,
      postLikesGiven: postLikeData.given,
      postLikesReceived: postLikeData.received,
      commentsGiven: commentData.given,
      commentsReceived: commentData.received,
      commentLikesGiven: commentLikeData.given,
      commentLikesReceived: commentLikeData.received,
      storyViewsGiven: storyViewData.given,
      storyViewsReceived: storyViewData.received,
      videoCalls: 0, // TODO: Implement
      liveStreamViews: liveStreamData.views,
      meetupAttendanceTogether: meetupData.together,
      eventAttendanceTogether: eventData.together,
      totalInteractionTime: contentEngagementData.totalTime,
      averageResponseTime: messageData.avgResponseTime,
      lastInteractionAt: contentEngagementData.lastInteraction,
      interactionScore: interactionScore.toString(),
      consistencyScore: consistencyScore.toString(),
      engagementScore: engagementScore.toString(),
      overallScore: overallScore.toString(),
      currentRank: currentFriendship?.rank || null,
      calculationPeriodDays: FriendRankingIntelligence.MAX_CALCULATION_PERIOD_DAYS,
    };
  }

  /**
   * Generate ranking suggestions based on interaction analytics
   */
  async generateRankingSuggestions(userId: string): Promise<InsertFriendRankingSuggestion[]> {
    // Get all current friendships with their analytics
    const userFriendships = await db
      .select({
        friendId: friendships.friendId,
        currentRank: friendships.rank,
        analytics: userInteractionAnalytics,
      })
      .from(friendships)
      .leftJoin(
        userInteractionAnalytics,
        and(
          eq(userInteractionAnalytics.userId, userId),
          eq(userInteractionAnalytics.friendId, friendships.friendId)
        )
      )
      .where(eq(friendships.userId, userId))
      .orderBy(desc(userInteractionAnalytics.overallScore));

    const suggestions: InsertFriendRankingSuggestion[] = [];

    // Early return if user has no friends
    if (userFriendships.length === 0) {
      return suggestions;
    }

    // Analyze each friendship for ranking optimization opportunities
    for (const friendship of userFriendships) {
      if (!friendship.analytics) continue;

      const overallScore = parseFloat(friendship.analytics.overallScore || '0');
      const currentRank = friendship.currentRank;
      
      const suggestedRank = this.calculateSuggestedRank(overallScore, userFriendships);
      
      const rankDifference = Math.abs(suggestedRank - currentRank);
      if (rankDifference >= 1) {
        
        const suggestion = await this.buildRankingSuggestion(
          userId,
          friendship.friendId,
          currentRank,
          suggestedRank,
          friendship.analytics,
          rankDifference
        );
        
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  }

  /**
   * Store or update interaction analytics for a user-friend pair
   */
  async updateInteractionAnalytics(userId: string, friendId: string): Promise<void> {
    const analytics = await this.calculateInteractionAnalytics(userId, friendId);
    
    // Manual upsert: check if record exists, then update or insert
    const existing = await db
      .select({ id: userInteractionAnalytics.id })
      .from(userInteractionAnalytics)
      .where(and(
        eq(userInteractionAnalytics.userId, userId),
        eq(userInteractionAnalytics.friendId, friendId)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userInteractionAnalytics)
        .set({
          ...analytics,
          updatedAt: new Date(),
        })
        .where(eq(userInteractionAnalytics.id, existing[0].id));
    } else {
      await db
        .insert(userInteractionAnalytics)
        .values(analytics);
    }
  }

  /**
   * Store ranking suggestions for a user
   */
  async storeRankingSuggestions(suggestions: InsertFriendRankingSuggestion[]): Promise<void> {
    if (suggestions.length === 0) return;

    // Remove existing pending suggestions for these friends
    for (const suggestion of suggestions) {
      await db
        .delete(friendRankingSuggestions)
        .where(
          and(
            eq(friendRankingSuggestions.userId, suggestion.userId),
            eq(friendRankingSuggestions.friendId, suggestion.friendId),
            eq(friendRankingSuggestions.status, 'pending')
          )
        );
    }

    // Insert new suggestions
    await db.insert(friendRankingSuggestions).values(suggestions);
  }

  /**
   * Track content engagement (time spent viewing content)
   */
  async trackContentEngagement(engagement: InsertContentEngagement): Promise<void> {
    await db.insert(contentEngagements).values(engagement);
  }

  /**
   * Get pending ranking suggestions for a user
   */
  async getPendingRankingSuggestions(userId: string): Promise<any[]> {
    return await db
      .select({
        id: friendRankingSuggestions.id,
        friendId: friendRankingSuggestions.friendId,
        currentRank: friendRankingSuggestions.currentRank,
        suggestedRank: friendRankingSuggestions.suggestedRank,
        confidence: friendRankingSuggestions.confidence,
        primaryReason: friendRankingSuggestions.primaryReason,
        justificationMessage: friendRankingSuggestions.justificationMessage,
        supportingMetrics: friendRankingSuggestions.supportingMetrics,
        createdAt: friendRankingSuggestions.createdAt,
        expiresAt: friendRankingSuggestions.expiresAt,
        friend: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(friendRankingSuggestions)
      .innerJoin(users, eq(users.id, friendRankingSuggestions.friendId))
      .where(
        and(
          eq(friendRankingSuggestions.userId, userId),
          eq(friendRankingSuggestions.status, 'pending'),
          gte(friendRankingSuggestions.expiresAt, new Date())
        )
      )
      .orderBy(desc(friendRankingSuggestions.confidence));
  }

  /**
   * Calculate interaction score based on weighted metrics
   */
  private calculateInteractionScore(metrics: any): number {
    let score = 0;
    
    for (const [key, value] of Object.entries(metrics)) {
      const weight = FriendRankingIntelligence.SCORING_WEIGHTS[key as keyof typeof FriendRankingIntelligence.SCORING_WEIGHTS];
      if (weight && typeof value === 'number') {
        score += value * weight;
      }
    }
    
    return Math.max(0, score); // Ensure non-negative score
  }

  /**
   * Calculate consistency score based on recent interaction patterns
   */
  private calculateConsistencyScore(lastInteraction: Date | null): number {
    if (!lastInteraction) return 0;
    
    const daysSinceLastInteraction = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastInteraction <= FriendRankingIntelligence.CONSISTENCY_DECAY_DAYS) {
      return 100; // Maximum consistency
    }
    
    // Exponential decay after the threshold
    const decayFactor = Math.exp(-(daysSinceLastInteraction - FriendRankingIntelligence.CONSISTENCY_DECAY_DAYS) / 14);
    return Math.max(0, 100 * decayFactor);
  }

  /**
   * Calculate engagement score based on time spent and interaction quality
   */
  private calculateEngagementScore(totalTime: number, interactionCount: number): number {
    if (totalTime === 0 || interactionCount === 0) return 0;
    
    // Average time per interaction (quality metric)
    const avgTimePerInteraction = totalTime / interactionCount;
    
    // Score based on both total time and average interaction quality
    const timeScore = Math.min(100, totalTime / 3600); // Cap at 1 hour = 100 points
    const qualityScore = Math.min(100, avgTimePerInteraction / 30); // Cap at 30 seconds per interaction = 100 points
    
    return (timeScore + qualityScore) / 2;
  }

  // ... [Helper methods for data collection would continue here]
  // These would implement the specific queries for messages, likes, comments, etc.
  
  private async getMessageInteractions(userId: string, friendId: string, since: Date) {
    try {
      const [sentResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(and(
          eq(messages.senderId, userId),
          eq(messages.receiverId, friendId),
          gte(messages.createdAt, since)
        ));
      const [receivedResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(and(
          eq(messages.senderId, friendId),
          eq(messages.receiverId, userId),
          gte(messages.createdAt, since)
        ));
      return {
        sent: sentResult?.count || 0,
        received: receivedResult?.count || 0,
        avgResponseTime: 0,
      };
    } catch (e) {
      console.error("Error getting message interactions:", e);
      return { sent: 0, received: 0, avgResponseTime: 0 };
    }
  }

  private async getPostLikeInteractions(userId: string, friendId: string, since: Date) {
    try {
      const [givenResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(postLikes)
        .innerJoin(posts, eq(posts.id, postLikes.postId))
        .where(and(
          eq(postLikes.userId, userId),
          eq(posts.userId, friendId),
          gte(postLikes.createdAt, since)
        ));
      const [receivedResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(postLikes)
        .innerJoin(posts, eq(posts.id, postLikes.postId))
        .where(and(
          eq(postLikes.userId, friendId),
          eq(posts.userId, userId),
          gte(postLikes.createdAt, since)
        ));
      return {
        given: givenResult?.count || 0,
        received: receivedResult?.count || 0,
      };
    } catch (e) {
      console.error("Error getting post like interactions:", e);
      return { given: 0, received: 0 };
    }
  }

  private async getCommentInteractions(userId: string, friendId: string, since: Date) {
    try {
      const [givenResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .innerJoin(posts, eq(posts.id, comments.postId))
        .where(and(
          eq(comments.userId, userId),
          eq(posts.userId, friendId),
          gte(comments.createdAt, since)
        ));
      const [receivedResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .innerJoin(posts, eq(posts.id, comments.postId))
        .where(and(
          eq(comments.userId, friendId),
          eq(posts.userId, userId),
          gte(comments.createdAt, since)
        ));
      return {
        given: givenResult?.count || 0,
        received: receivedResult?.count || 0,
      };
    } catch (e) {
      console.error("Error getting comment interactions:", e);
      return { given: 0, received: 0 };
    }
  }

  private async getCommentLikeInteractions(userId: string, friendId: string, since: Date) {
    try {
      const [givenResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(commentLikes)
        .innerJoin(comments, eq(comments.id, commentLikes.commentId))
        .where(and(
          eq(commentLikes.userId, userId),
          eq(comments.userId, friendId),
          gte(commentLikes.createdAt, since)
        ));
      const [receivedResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(commentLikes)
        .innerJoin(comments, eq(comments.id, commentLikes.commentId))
        .where(and(
          eq(commentLikes.userId, friendId),
          eq(comments.userId, userId),
          gte(commentLikes.createdAt, since)
        ));
      return {
        given: givenResult?.count || 0,
        received: receivedResult?.count || 0,
      };
    } catch (e) {
      console.error("Error getting comment like interactions:", e);
      return { given: 0, received: 0 };
    }
  }

  private async getStoryViewInteractions(userId: string, friendId: string, since: Date) {
    try {
      const [givenResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(storyViews)
        .innerJoin(stories, eq(stories.id, storyViews.storyId))
        .where(and(
          eq(storyViews.userId, userId),
          eq(stories.userId, friendId),
          gte(storyViews.viewedAt, since)
        ));
      const [receivedResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(storyViews)
        .innerJoin(stories, eq(stories.id, storyViews.storyId))
        .where(and(
          eq(storyViews.userId, friendId),
          eq(stories.userId, userId),
          gte(storyViews.viewedAt, since)
        ));
      return {
        given: givenResult?.count || 0,
        received: receivedResult?.count || 0,
      };
    } catch (e) {
      console.error("Error getting story view interactions:", e);
      return { given: 0, received: 0 };
    }
  }

  private async getLiveStreamInteractions(userId: string, friendId: string, since: Date) {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(actionViewers)
        .innerJoin(actions, eq(actions.id, actionViewers.actionId))
        .where(and(
          eq(actionViewers.userId, userId),
          eq(actions.userId, friendId),
          gte(actionViewers.joinedAt, since)
        ));
      return { views: result?.count || 0 };
    } catch (e) {
      console.error("Error getting live stream interactions:", e);
      return { views: 0 };
    }
  }

  private async getMeetupInteractions(userId: string, friendId: string, since: Date) {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(meetupCheckIns)
        .where(and(
          eq(meetupCheckIns.userId, userId),
          gte(meetupCheckIns.checkInTime, since),
          sql`${meetupCheckIns.meetupId} IN (
            SELECT ${meetupCheckIns.meetupId} FROM ${meetupCheckIns} 
            WHERE ${meetupCheckIns.userId} = ${friendId}
          )`
        ));
      return { together: result?.count || 0 };
    } catch (e) {
      console.error("Error getting meetup interactions:", e);
      return { together: 0 };
    }
  }

  private async getEventInteractions(userId: string, friendId: string, since: Date) {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(eventAttendees)
        .where(and(
          eq(eventAttendees.userId, userId),
          gte(eventAttendees.createdAt, since),
          sql`${eventAttendees.eventId} IN (
            SELECT ${eventAttendees.eventId} FROM ${eventAttendees}
            WHERE ${eventAttendees.userId} = ${friendId}
          )`
        ));
      return { together: result?.count || 0 };
    } catch (e) {
      console.error("Error getting event interactions:", e);
      return { together: 0 };
    }
  }

  private async getContentEngagementData(userId: string, friendId: string, since: Date) {
    try {
      const [result] = await db
        .select({
          totalTime: sql<number>`COALESCE(SUM(${contentEngagements.viewDuration})::int, 0)`,
          interactions: sql<number>`count(*)::int`,
          lastInteraction: sql<Date | null>`MAX(${contentEngagements.createdAt})`,
        })
        .from(contentEngagements)
        .where(and(
          eq(contentEngagements.userId, userId),
          eq(contentEngagements.contentOwnerId, friendId),
          gte(contentEngagements.createdAt, since)
        ));

      const lastMsgDate = await db
        .select({ latest: sql<Date | null>`MAX(${messages.createdAt})` })
        .from(messages)
        .where(and(
          sql`(${messages.senderId} = ${userId} AND ${messages.receiverId} = ${friendId}) OR (${messages.senderId} = ${friendId} AND ${messages.receiverId} = ${userId})`,
          gte(messages.createdAt, since)
        ));

      const engagementLast = result?.lastInteraction;
      const msgLast = lastMsgDate[0]?.latest;
      let lastInteraction: Date | null = null;
      if (engagementLast && msgLast) {
        lastInteraction = engagementLast > msgLast ? engagementLast : msgLast;
      } else {
        lastInteraction = engagementLast || msgLast || null;
      }

      return {
        totalTime: result?.totalTime || 0,
        interactions: result?.interactions || 0,
        lastInteraction,
      };
    } catch (e) {
      console.error("Error getting content engagement data:", e);
      return { totalTime: 0, interactions: 0, lastInteraction: null as Date | null };
    }
  }

  private async getCurrentFriendshipRank(userId: string, friendId: string) {
    const friendship = await db
      .select({ rank: friendships.rank })
      .from(friendships)
      .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)))
      .limit(1);
    
    return friendship[0] || null;
  }

  private calculateSuggestedRank(score: number, allFriendships: any[]): number {
    // Sort by score to determine suggested ranking
    const sortedScores = allFriendships
      .map(f => parseFloat(f.analytics?.overallScore || '0'))
      .sort((a, b) => b - a);
    
    const position = sortedScores.findIndex(s => s <= score);
    return position === -1 ? sortedScores.length + 1 : position + 1;
  }

  private async buildRankingSuggestion(
    userId: string,
    friendId: string,
    currentRank: number,
    suggestedRank: number,
    analytics: any,
    rankDifference: number
  ): Promise<InsertFriendRankingSuggestion | null> {
    
    const confidence = Math.min(95, 50 + (rankDifference * 10)); // Higher confidence for bigger differences
    const isMovingUp = suggestedRank < currentRank;
    
    // Determine primary reason based on analytics
    let primaryReason = 'general_activity';
    let justificationMessage = '';
    
    const totalMessages = (analytics.messagesSent || 0) + (analytics.messagesReceived || 0);
    const totalLikesComments = (analytics.postLikesGiven || 0) + (analytics.postLikesReceived || 0) + (analytics.commentsGiven || 0) + (analytics.commentsReceived || 0);
    
    if (totalMessages > 0) {
      primaryReason = 'frequent_communication';
      justificationMessage = `You and this friend have exchanged ${totalMessages} message${totalMessages !== 1 ? 's' : ''} recently, indicating an active connection.`;
    } else if (totalLikesComments > 0) {
      primaryReason = 'high_engagement';
      justificationMessage = `This friend has ${totalLikesComments} interaction${totalLikesComments !== 1 ? 's' : ''} (likes/comments) with your content recently.`;
    } else if ((analytics.totalInteractionTime || 0) > 0) {
      primaryReason = 'high_engagement';
      justificationMessage = `You spend time viewing this friend's content (${Math.round((analytics.totalInteractionTime || 0) / 60)} minutes), suggesting interest.`;
    } else if ((analytics.meetupAttendanceTogether || 0) > 0) {
      primaryReason = 'in_person_connection';
      justificationMessage = `You've attended ${analytics.meetupAttendanceTogether} meetup(s) together, showing real-world friendship.`;
    } else if (isMovingUp) {
      justificationMessage = `Based on your recent interactions, consider ranking this friend higher to see more of their content.`;
    } else {
      justificationMessage = `Your interaction patterns suggest this friend might be ranked higher than your current engagement level.`;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Suggestions expire in 7 days

    return {
      userId,
      friendId,
      currentRank,
      suggestedRank,
      confidence: confidence.toString(),
      primaryReason,
      justificationMessage,
      supportingMetrics: {
        totalInteractions: analytics.messagesSent + analytics.messagesReceived + analytics.commentsGiven + analytics.commentsReceived,
        interactionScore: analytics.interactionScore,
        consistencyScore: analytics.consistencyScore,
        engagementScore: analytics.engagementScore,
        overallScore: analytics.overallScore,
      },
      status: 'pending',
      expiresAt,
    };
  }
}

// Export singleton instance
export const friendRankingIntelligence = new FriendRankingIntelligence();