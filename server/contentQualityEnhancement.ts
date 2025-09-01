import { db } from './db';
import { posts, postLikes, comments, users, polls, events, actions } from '@shared/schema';
import { eq, and, count, desc, sql, gte } from 'drizzle-orm';

interface ConversationStarterSignals {
  hasQuestion: boolean;
  hasEmoji: boolean;
  hasControversialKeywords: boolean;
  hasPersonalStory: boolean;
  hasCallToAction: boolean;
  mentionsMultiplePeople: boolean;
  isTimely: boolean;
  hasMediaContent: boolean;
}

interface ContentQualityScore {
  conversationScore: number;
  engagementPotential: number;
  qualityFactors: string[];
  recommendations: string[];
}

interface MediaOptimization {
  originalSize?: number;
  optimizedSize?: number;
  compressionApplied: boolean;
  format: string;
  recommendations: string[];
}

export class ContentQualityEnhancement {
  /**
   * Analyze content for conversation-starting potential
   */
  async analyzeConversationPotential(content: string, mediaUrl?: string): Promise<ContentQualityScore> {
    const signals = this.detectConversationSignals(content, mediaUrl);
    const conversationScore = this.calculateConversationScore(signals);
    const engagementPotential = this.predictEngagementPotential(content, signals);
    
    const qualityFactors = this.identifyQualityFactors(signals);
    const recommendations = this.generateContentRecommendations(signals, conversationScore);

    return {
      conversationScore,
      engagementPotential,
      qualityFactors,
      recommendations
    };
  }

  /**
   * Detect conversation starter signals in content
   */
  private detectConversationSignals(content: string, mediaUrl?: string): ConversationStarterSignals {
    const text = content.toLowerCase();
    
    return {
      hasQuestion: this.detectQuestions(text),
      hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(content),
      hasControversialKeywords: this.detectControversialContent(text),
      hasPersonalStory: this.detectPersonalStory(text),
      hasCallToAction: this.detectCallToAction(text),
      mentionsMultiplePeople: this.detectMultiplePeopleMentions(text),
      isTimely: this.detectTimelyContent(text),
      hasMediaContent: !!mediaUrl
    };
  }

  /**
   * Detect questions in content
   */
  private detectQuestions(text: string): boolean {
    const questionPatterns = [
      /\?/,
      /\bwhat\b.*\b(do|did|does|will|would|should|could|can)\b/,
      /\bhow\b.*\b(do|did|does|will|would|should|could|can)\b/,
      /\bwhere\b.*\b(do|did|does|will|would|should|could|can)\b/,
      /\bwhen\b.*\b(do|did|does|will|would|should|could|can)\b/,
      /\bwhy\b.*\b(do|did|does|will|would|should|could|can)\b/,
      /\bwho\b.*\b(do|did|does|will|would|should|could|can)\b/,
      /\b(do|did|does|will|would|should|could|can)\b.*\byou\b/,
      /\bwhat.*think/,
      /\bhow.*feel/,
      /\banyone\b.*\b(know|tried|been|heard)/
    ];
    
    return questionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Detect controversial or debate-worthy content
   */
  private detectControversialContent(text: string): boolean {
    const controversialKeywords = [
      'unpopular opinion', 'hot take', 'controversial', 'debate', 'disagree',
      'best vs worst', 'overrated', 'underrated', 'change my mind',
      'vs', 'better than', 'preference', 'favorite', 'least favorite'
    ];
    
    return controversialKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Detect personal stories or experiences
   */
  private detectPersonalStory(text: string): boolean {
    const personalStoryPatterns = [
      /\b(i|my|me)\b.*\b(remember|experienced|happened|went|tried|learned|realized)/,
      /\bjust\b.*\b(happened|experienced|tried|learned|realized|discovered)/,
      /\btoday\b.*\b(i|my|me)\b/,
      /\byesterday\b.*\b(i|my|me)\b/,
      /\blast\b.*\b(week|month|year)\b.*\b(i|my|me)\b/,
      /\bfunny story/,
      /\bthis happened/,
      /\bguess what/
    ];
    
    return personalStoryPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Detect call-to-action phrases
   */
  private detectCallToAction(text: string): boolean {
    const ctaPatterns = [
      /\blet me know\b/,
      /\btell me\b/,
      /\bshare your\b/,
      /\bwhat about you\b/,
      /\byour thoughts\b/,
      /\bcomment below\b/,
      /\blove to hear\b/,
      /\banyone else\b/,
      /\bwho agrees\b/,
      /\bthoughts\?/
    ];
    
    return ctaPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Detect mentions of multiple people or groups
   */
  private detectMultiplePeopleMentions(text: string): boolean {
    const groupPatterns = [
      /\beveryone\b/,
      /\banyone\b/,
      /\bwe\b.*\ball\b/,
      /\byou guys\b/,
      /\bfriends\b/,
      /\bkliq\b/,
      /\bgroup\b/,
      /\btogether\b/
    ];
    
    return groupPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Detect timely or trending content
   */
  private detectTimelyContent(text: string): boolean {
    const timelyPatterns = [
      /\btoday\b/,
      /\bthis week\b/,
      /\brecently\b/,
      /\bjust saw\b/,
      /\bbreaking\b/,
      /\btrending\b/,
      /\bnew\b.*\b(movie|song|show|game|app)/,
      /\bcurrent events\b/,
      /\bin the news\b/
    ];
    
    return timelyPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Calculate conversation score based on signals
   */
  private calculateConversationScore(signals: ConversationStarterSignals): number {
    let score = 0;
    
    // Weight different signals based on their conversation-starting power
    if (signals.hasQuestion) score += 30;
    if (signals.hasCallToAction) score += 25;
    if (signals.hasPersonalStory) score += 20;
    if (signals.mentionsMultiplePeople) score += 15;
    if (signals.hasControversialKeywords) score += 15;
    if (signals.isTimely) score += 10;
    if (signals.hasEmoji) score += 8;
    if (signals.hasMediaContent) score += 7;
    
    // Bonus for multiple signals
    const signalCount = Object.values(signals).filter(Boolean).length;
    if (signalCount >= 3) score += 10;
    if (signalCount >= 5) score += 15;
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Predict engagement potential based on content analysis
   */
  private predictEngagementPotential(content: string, signals: ConversationStarterSignals): number {
    let potential = 50; // Base potential
    
    // Content length optimization
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 10 && wordCount <= 50) potential += 10; // Sweet spot
    else if (wordCount < 5) potential -= 15; // Too short
    else if (wordCount > 100) potential -= 10; // Too long
    
    // Readability factors
    if (content.includes('\n')) potential += 5; // Good formatting
    if (/[.!?]/.test(content)) potential += 5; // Proper punctuation
    
    // Engagement signals boost
    const conversationScore = this.calculateConversationScore(signals);
    potential += conversationScore * 0.3; // 30% of conversation score
    
    return Math.min(Math.max(potential, 0), 100); // Keep between 0-100
  }

  /**
   * Identify quality factors in content
   */
  private identifyQualityFactors(signals: ConversationStarterSignals): string[] {
    const factors: string[] = [];
    
    if (signals.hasQuestion) factors.push('Contains question');
    if (signals.hasCallToAction) factors.push('Encourages responses');
    if (signals.hasPersonalStory) factors.push('Personal experience');
    if (signals.mentionsMultiplePeople) factors.push('Group-oriented');
    if (signals.hasControversialKeywords) factors.push('Discussion-worthy');
    if (signals.isTimely) factors.push('Timely content');
    if (signals.hasMediaContent) factors.push('Visual content');
    if (signals.hasEmoji) factors.push('Expressive');
    
    return factors;
  }

  /**
   * Generate recommendations for improving content
   */
  private generateContentRecommendations(signals: ConversationStarterSignals, score: number): string[] {
    const recommendations: string[] = [];
    
    if (score < 30) {
      if (!signals.hasQuestion) recommendations.push('Try adding a question to encourage responses');
      if (!signals.hasCallToAction) recommendations.push('Add "What do you think?" or similar phrase');
      if (!signals.hasEmoji) recommendations.push('Consider adding emojis for better engagement');
    }
    
    if (score < 50) {
      if (!signals.hasPersonalStory) recommendations.push('Share a personal experience to make it more relatable');
      if (!signals.mentionsMultiplePeople) recommendations.push('Address the group to encourage participation');
    }
    
    if (score >= 70) {
      recommendations.push('Great conversation starter! This should get good engagement');
    }
    
    return recommendations;
  }

  /**
   * Analyze media for optimization opportunities
   */
  async analyzeMediaOptimization(mediaUrl: string, mediaType?: string): Promise<MediaOptimization> {
    // This would typically integrate with image/video processing services
    // For now, provide basic analysis based on URL patterns
    
    const optimization: MediaOptimization = {
      compressionApplied: false,
      format: this.detectMediaFormat(mediaUrl),
      recommendations: []
    };

    // Basic recommendations based on format
    if (optimization.format === 'image') {
      optimization.recommendations.push('Consider WebP format for better compression');
      optimization.recommendations.push('Optimize image size for mobile viewing');
    } else if (optimization.format === 'video') {
      optimization.recommendations.push('Use MP4 format for best compatibility');
      optimization.recommendations.push('Consider adding video thumbnail');
      optimization.recommendations.push('Keep videos under 2 minutes for mobile');
    }

    return optimization;
  }

  /**
   * Detect media format from URL
   */
  private detectMediaFormat(url: string): string {
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    
    const lowerUrl = url.toLowerCase();
    
    if (imageExts.some(ext => lowerUrl.includes(ext))) return 'image';
    if (videoExts.some(ext => lowerUrl.includes(ext))) return 'video';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    
    return 'unknown';
  }

  /**
   * Get historical engagement data for similar content
   */
  async getHistoricalEngagementData(contentType: string, userId: string): Promise<{
    averageLikes: number;
    averageComments: number;
    successRate: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get user's recent posts with engagement
    const recentPosts = await db
      .select({
        id: posts.id,
        likeCount: count(postLikes.id),
        commentCount: count(comments.id)
      })
      .from(posts)
      .leftJoin(postLikes, eq(posts.id, postLikes.postId))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(and(
        eq(posts.userId, userId),
        gte(posts.createdAt, thirtyDaysAgo)
      ))
      .groupBy(posts.id)
      .limit(20);

    if (recentPosts.length === 0) {
      return { averageLikes: 0, averageComments: 0, successRate: 0 };
    }

    const totalLikes = recentPosts.reduce((sum, post) => sum + post.likeCount, 0);
    const totalComments = recentPosts.reduce((sum, post) => sum + post.commentCount, 0);
    const successfulPosts = recentPosts.filter(post => post.likeCount > 0 || post.commentCount > 0).length;

    return {
      averageLikes: totalLikes / recentPosts.length,
      averageComments: totalComments / recentPosts.length,
      successRate: (successfulPosts / recentPosts.length) * 100
    };
  }

  /**
   * Generate content enhancement suggestions for feed curation
   */
  async enhanceContentForFeed(posts: any[]): Promise<any[]> {
    const enhancedPosts = await Promise.all(
      posts.map(async (post) => {
        try {
          // Analyze conversation potential
          const qualityScore = await this.analyzeConversationPotential(
            post.content, 
            post.mediaUrl
          );

          // Add quality enhancement metadata
          return {
            ...post,
            conversationScore: qualityScore.conversationScore,
            engagementPotential: qualityScore.engagementPotential,
            qualityFactors: qualityScore.qualityFactors,
            isConversationStarter: qualityScore.conversationScore >= 60,
            
            // Mobile optimization flags
            isOptimizedForMobile: post.mediaUrl ? await this.isMediaOptimizedForMobile(post.mediaUrl) : true,
            loadPriority: qualityScore.engagementPotential > 70 ? 'high' : 
                         qualityScore.engagementPotential > 40 ? 'medium' : 'low'
          };
        } catch (error) {
          console.warn('Failed to enhance post content:', error);
          return post;
        }
      })
    );

    // Sort by quality and engagement potential
    return enhancedPosts.sort((a, b) => {
      const scoreA = (a.conversationScore || 0) + (a.engagementPotential || 0);
      const scoreB = (b.conversationScore || 0) + (b.engagementPotential || 0);
      return scoreB - scoreA;
    });
  }

  /**
   * Check if media is optimized for mobile viewing
   */
  private async isMediaOptimizedForMobile(mediaUrl: string): Promise<boolean> {
    // This would typically check file size, dimensions, format
    // For now, return true as placeholder
    return true;
  }

  /**
   * Generate smart hashtag suggestions based on content
   */
  generateHashtagSuggestions(content: string): string[] {
    const suggestions: string[] = [];
    const text = content.toLowerCase();
    
    // Topic-based hashtags
    if (text.includes('food') || text.includes('eating') || text.includes('cooking')) {
      suggestions.push('#KliqEats', '#FoodieLife');
    }
    if (text.includes('travel') || text.includes('vacation') || text.includes('trip')) {
      suggestions.push('#KliqTravel', '#Adventures');
    }
    if (text.includes('work') || text.includes('job') || text.includes('career')) {
      suggestions.push('#WorkLife', '#KliqProfessional');
    }
    if (text.includes('weekend') || text.includes('friday') || text.includes('saturday')) {
      suggestions.push('#WeekendVibes', '#KliqFun');
    }
    
    // Mood-based hashtags
    if (text.includes('happy') || text.includes('excited') || text.includes('amazing')) {
      suggestions.push('#GoodVibes', '#KliqPositivity');
    }
    if (text.includes('tired') || text.includes('stressed') || text.includes('busy')) {
      suggestions.push('#RealTalk', '#KliqSupport');
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }
}