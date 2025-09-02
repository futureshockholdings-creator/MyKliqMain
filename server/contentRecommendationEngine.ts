import { db } from './db.js';
import { users, posts, friendships } from '@shared/schema';
import { eq, sql, and, or, inArray, desc, asc } from 'drizzle-orm';

interface UserProfileData {
  interests: string[];
  hobbies: string[];
  favoriteMusic: string[];
  favoriteMovies: string[];
  favoriteBooks: string[];
  favoriteFoods: string[];
  currentLocation: string;
  hometown: string;
  lifestyle: string;
  relationshipStatus: string;
  occupation: string;
  education: string;
}

interface ContentRecommendation {
  type: 'interest_match' | 'hobby_match' | 'location_match' | 'lifestyle_match' | 'entertainment_match';
  score: number;
  reason: string;
  category: string;
  keywords: string[];
}

interface EngagementPattern {
  timeOfDay: number;
  dayOfWeek: number;
  contentTypes: string[];
  interactionRate: number;
  sessionDuration: number;
}

export class ContentRecommendationEngine {
  private profileCache = new Map<string, UserProfileData>();
  private engagementCache = new Map<string, EngagementPattern[]>();

  /**
   * Generate personalized content recommendations for a user
   */
  async generateRecommendations(userId: string): Promise<ContentRecommendation[]> {
    const userProfile = await this.getUserProfileData(userId);
    const engagementPatterns = await this.getUserEngagementPatterns(userId);
    
    const recommendations: ContentRecommendation[] = [];

    // Interest-based recommendations
    const interestRecommendations = this.generateInterestRecommendations(userProfile);
    recommendations.push(...interestRecommendations);

    // Hobby-based recommendations
    const hobbyRecommendations = this.generateHobbyRecommendations(userProfile);
    recommendations.push(...hobbyRecommendations);

    // Location-based recommendations
    const locationRecommendations = this.generateLocationRecommendations(userProfile);
    recommendations.push(...locationRecommendations);

    // Entertainment-based recommendations (music, movies, books)
    const entertainmentRecommendations = this.generateEntertainmentRecommendations(userProfile);
    recommendations.push(...entertainmentRecommendations);

    // Food and lifestyle recommendations
    const lifestyleRecommendations = this.generateLifestyleRecommendations(userProfile);
    recommendations.push(...lifestyleRecommendations);

    // Sort by engagement score and apply timing optimization
    return this.optimizeRecommendationTiming(recommendations, engagementPatterns);
  }

  /**
   * Get comprehensive user profile data for recommendations
   */
  private async getUserProfileData(userId: string): Promise<UserProfileData> {
    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId)!;
    }

    const userProfileResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userProfileResult.length === 0) {
      const emptyProfile: UserProfileData = {
        interests: [],
        hobbies: [],
        favoriteMusic: [],
        favoriteMovies: [],
        favoriteBooks: [],
        favoriteFoods: [],
        currentLocation: '',
        hometown: '',
        lifestyle: '',
        relationshipStatus: '',
        occupation: '',
        education: ''
      };
      return emptyProfile;
    }

    const profile = userProfileResult[0];
    const profileData: UserProfileData = {
      interests: profile.interests || [],
      hobbies: profile.hobbies || [],
      favoriteMusic: profile.musicGenres || [],
      favoriteMovies: profile.favoriteMovies || [],
      favoriteBooks: profile.favoriteBooks || [],
      favoriteFoods: profile.favoriteFoods || [],
      currentLocation: profile.favoriteLocations?.[0] || '',
      hometown: profile.favoriteLocations?.[1] || '',
      lifestyle: profile.lifestyle || '',
      relationshipStatus: profile.relationshipStatus || '',
      occupation: '', // Not in schema
      education: ''  // Not in schema
    };

    this.profileCache.set(userId, profileData);
    return profileData;
  }

  /**
   * Analyze user engagement patterns for optimal content timing
   */
  private async getUserEngagementPatterns(userId: string): Promise<EngagementPattern[]> {
    if (this.engagementCache.has(userId)) {
      return this.engagementCache.get(userId)!;
    }

    // Analyze user's interaction history for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const engagementData = await db
      .select({
        createdAt: posts.createdAt,
        likes: posts.likes,
        content: posts.content,
        mediaUrl: posts.mediaUrl,
        type: sql<string>`CASE 
          WHEN ${posts.mediaUrl} IS NOT NULL THEN 'media'
          WHEN LENGTH(${posts.content}) > 200 THEN 'long_text'
          ELSE 'short_text'
        END`.as('type')
      })
      .from(posts)
      .where(and(
        eq(posts.userId, userId),
        sql`${posts.createdAt} >= ${thirtyDaysAgo.toISOString()}`
      ))
      .orderBy(desc(posts.createdAt));

    // Process engagement patterns by time
    const patterns: EngagementPattern[] = [];
    const hourlyData = new Map<number, any[]>();
    const dailyData = new Map<number, any[]>();

    engagementData.forEach((post: any) => {
      const date = new Date(post.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      if (!hourlyData.has(hour)) hourlyData.set(hour, []);
      if (!dailyData.has(dayOfWeek)) dailyData.set(dayOfWeek, []);

      hourlyData.get(hour)!.push(post);
      dailyData.get(dayOfWeek)!.push(post);
    });

    // Calculate engagement rates for different times
    for (let hour = 0; hour < 24; hour++) {
      const hourPosts = hourlyData.get(hour) || [];
      if (hourPosts.length > 0) {
        const avgLikes = hourPosts.reduce((sum, post) => sum + (post.likes || 0), 0) / hourPosts.length;
        const contentTypes = [...new Set(hourPosts.map(post => post.type))];
        
        patterns.push({
          timeOfDay: hour,
          dayOfWeek: -1, // All days
          contentTypes,
          interactionRate: avgLikes,
          sessionDuration: hourPosts.length * 2 // Estimated minutes
        });
      }
    }

    this.engagementCache.set(userId, patterns);
    return patterns;
  }

  /**
   * Generate recommendations based on user interests
   */
  private generateInterestRecommendations(profile: UserProfileData): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    profile.interests.forEach(interest => {
      const score = this.calculateInterestScore(interest, profile);
      
      recommendations.push({
        type: 'interest_match',
        score,
        reason: `Based on your interest in ${interest}`,
        category: 'interests',
        keywords: [interest, ...this.getRelatedKeywords(interest, 'interests')]
      });
    });

    return recommendations.filter(r => r.score > 60);
  }

  /**
   * Generate recommendations based on user hobbies
   */
  private generateHobbyRecommendations(profile: UserProfileData): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    profile.hobbies.forEach(hobby => {
      const score = this.calculateHobbyScore(hobby, profile);
      
      recommendations.push({
        type: 'hobby_match',
        score,
        reason: `Perfect for your ${hobby} hobby`,
        category: 'hobbies',
        keywords: [hobby, ...this.getRelatedKeywords(hobby, 'hobbies')]
      });
    });

    return recommendations.filter(r => r.score > 65);
  }

  /**
   * Generate location-based recommendations
   */
  private generateLocationRecommendations(profile: UserProfileData): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    if (profile.currentLocation) {
      recommendations.push({
        type: 'location_match',
        score: 75,
        reason: `Events and activities in ${profile.currentLocation}`,
        category: 'location',
        keywords: [profile.currentLocation, 'local events', 'nearby activities']
      });
    }

    if (profile.hometown && profile.hometown !== profile.currentLocation) {
      recommendations.push({
        type: 'location_match',
        score: 60,
        reason: `Nostalgia content from ${profile.hometown}`,
        category: 'hometown',
        keywords: [profile.hometown, 'hometown memories', 'local culture']
      });
    }

    return recommendations;
  }

  /**
   * Generate entertainment-based recommendations (music, movies, books)
   */
  private generateEntertainmentRecommendations(profile: UserProfileData): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    // Music recommendations
    profile.favoriteMusic.forEach(music => {
      recommendations.push({
        type: 'entertainment_match',
        score: this.calculateMusicScore(music, profile),
        reason: `New releases similar to ${music}`,
        category: 'music',
        keywords: [music, 'music recommendations', 'new releases']
      });
    });

    // Movie recommendations
    profile.favoriteMovies.forEach(movie => {
      recommendations.push({
        type: 'entertainment_match',
        score: this.calculateMovieScore(movie, profile),
        reason: `Movies like ${movie}`,
        category: 'movies',
        keywords: [movie, 'movie recommendations', 'similar films']
      });
    });

    // Book recommendations
    profile.favoriteBooks.forEach(book => {
      recommendations.push({
        type: 'entertainment_match',
        score: this.calculateBookScore(book, profile),
        reason: `Books similar to ${book}`,
        category: 'books',
        keywords: [book, 'book recommendations', 'reading list']
      });
    });

    return recommendations.filter(r => r.score > 55);
  }

  /**
   * Generate lifestyle-based recommendations
   */
  private generateLifestyleRecommendations(profile: UserProfileData): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    // Food recommendations
    profile.favoriteFoods.forEach(food => {
      recommendations.push({
        type: 'lifestyle_match',
        score: this.calculateFoodScore(food, profile),
        reason: `New ${food} recipes and restaurants`,
        category: 'food',
        keywords: [food, 'recipes', 'restaurants', 'cooking']
      });
    });

    // Lifestyle content
    if (profile.lifestyle) {
      recommendations.push({
        type: 'lifestyle_match',
        score: 70,
        reason: `Content matching your ${profile.lifestyle} lifestyle`,
        category: 'lifestyle',
        keywords: [profile.lifestyle, 'lifestyle tips', 'wellness']
      });
    }

    // Career/education content
    if (profile.occupation) {
      recommendations.push({
        type: 'lifestyle_match',
        score: 65,
        reason: `Professional content for ${profile.occupation}`,
        category: 'career',
        keywords: [profile.occupation, 'career development', 'professional growth']
      });
    }

    return recommendations.filter(r => r.score > 50);
  }

  /**
   * Calculate engagement score for interests
   */
  private calculateInterestScore(interest: string, profile: UserProfileData): number {
    let score = 70; // Base score

    // Boost score if interest appears in multiple categories
    const relatedCount = this.countRelatedMentions(interest, profile);
    score += relatedCount * 10;

    // Apply lifestyle multiplier
    if (this.isLifestyleRelated(interest, profile.lifestyle)) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate engagement score for hobbies
   */
  private calculateHobbyScore(hobby: string, profile: UserProfileData): number {
    let score = 75; // Higher base score for hobbies

    // Check if hobby aligns with interests
    const alignmentBonus = this.getHobbyInterestAlignment(hobby, profile.interests);
    score += alignmentBonus;

    // Location bonus for outdoor hobbies
    if (this.isOutdoorHobby(hobby) && profile.currentLocation) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate engagement scores for entertainment content
   */
  private calculateMusicScore(music: string, profile: UserProfileData): number {
    return this.calculateEntertainmentScore(music, profile.favoriteMusic, 65);
  }

  private calculateMovieScore(movie: string, profile: UserProfileData): number {
    return this.calculateEntertainmentScore(movie, profile.favoriteMovies, 60);
  }

  private calculateBookScore(book: string, profile: UserProfileData): number {
    return this.calculateEntertainmentScore(book, profile.favoriteBooks, 70);
  }

  private calculateFoodScore(food: string, profile: UserProfileData): number {
    let score = 55;
    
    // Cultural food preferences
    if (this.isCulturalFood(food, profile.hometown)) {
      score += 20;
    }

    // Health-conscious bonus
    if (this.isHealthyFood(food) && this.isHealthConscious(profile.lifestyle)) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  /**
   * Optimize recommendation timing based on engagement patterns
   */
  private optimizeRecommendationTiming(
    recommendations: ContentRecommendation[], 
    patterns: EngagementPattern[]
  ): ContentRecommendation[] {
    const currentHour = new Date().getHours();
    
    return recommendations
      .map(rec => {
        // Find matching engagement pattern
        const pattern = patterns.find(p => 
          p.timeOfDay === currentHour || 
          p.contentTypes.includes(rec.category)
        );

        if (pattern) {
          // Boost score based on timing optimization
          rec.score += pattern.interactionRate * 0.1;
        }

        return rec;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Return top 10 recommendations
  }

  /**
   * Helper methods for scoring calculations
   */
  private countRelatedMentions(item: string, profile: UserProfileData): number {
    let count = 0;
    const allItems = [
      ...(profile.interests || []),
      ...(profile.hobbies || []),
      ...(profile.favoriteMusic || []),
      ...(profile.favoriteMovies || []),
      ...(profile.favoriteBooks || []),
      ...(profile.favoriteFoods || [])
    ];

    allItems.forEach(profileItem => {
      if (this.areRelated(item, profileItem)) {
        count++;
      }
    });

    return count;
  }

  private isLifestyleRelated(interest: string, lifestyle: string): boolean {
    const lifestyleMap: Record<string, string[]> = {
      'active': ['fitness', 'sports', 'hiking', 'running', 'yoga'],
      'creative': ['art', 'music', 'writing', 'photography', 'design'],
      'social': ['networking', 'events', 'parties', 'community'],
      'intellectual': ['reading', 'science', 'technology', 'learning']
    };

    return lifestyleMap[lifestyle?.toLowerCase()] 
      ?.some(keyword => interest.toLowerCase().includes(keyword)) || false;
  }

  private getHobbyInterestAlignment(hobby: string, interests: string[]): number {
    const alignmentScore = interests.reduce((score, interest) => {
      return this.areRelated(hobby, interest) ? score + 5 : score;
    }, 0);

    return Math.min(alignmentScore, 20);
  }

  private isOutdoorHobby(hobby: string): boolean {
    const outdoorKeywords = ['hiking', 'camping', 'fishing', 'cycling', 'running', 'photography', 'gardening'];
    return outdoorKeywords.some(keyword => hobby.toLowerCase().includes(keyword));
  }

  private calculateEntertainmentScore(item: string, category: string[], baseScore: number): number {
    let score = baseScore;
    
    // Genre similarity bonus
    const similarItems = category.filter(catItem => this.areRelated(item, catItem));
    score += similarItems.length * 5;

    return Math.min(score, 100);
  }

  private isCulturalFood(food: string, hometown: string): boolean {
    // Simple cultural food mapping
    const culturalMap: Record<string, string[]> = {
      'italian': ['pizza', 'pasta', 'gelato'],
      'mexican': ['tacos', 'burritos', 'salsa'],
      'asian': ['sushi', 'ramen', 'curry'],
      'american': ['burger', 'bbq', 'steak']
    };

    return Object.entries(culturalMap).some(([culture, foods]) =>
      hometown?.toLowerCase().includes(culture) && 
      foods.some(culturalFood => food.toLowerCase().includes(culturalFood))
    );
  }

  private isHealthyFood(food: string): boolean {
    const healthyKeywords = ['salad', 'smoothie', 'quinoa', 'avocado', 'kale', 'organic'];
    return healthyKeywords.some(keyword => food.toLowerCase().includes(keyword));
  }

  private isHealthConscious(lifestyle: string): boolean {
    const healthKeywords = ['active', 'fitness', 'wellness', 'healthy'];
    return healthKeywords.some(keyword => lifestyle?.toLowerCase().includes(keyword));
  }

  private areRelated(item1: string, item2: string): boolean {
    const item1Lower = item1.toLowerCase();
    const item2Lower = item2.toLowerCase();
    
    // Simple relatedness check - can be enhanced with ML
    return item1Lower.includes(item2Lower) || 
           item2Lower.includes(item1Lower) ||
           this.shareCommonWords(item1Lower, item2Lower);
  }

  private shareCommonWords(text1: string, text2: string): boolean {
    const words1 = text1.split(' ').filter(w => w.length > 3);
    const words2 = text2.split(' ').filter(w => w.length > 3);
    
    return words1.some(word => words2.includes(word));
  }

  private getRelatedKeywords(item: string, category: string): string[] {
    const keywordMap: Record<string, Record<string, string[]>> = {
      'interests': {
        'fitness': ['workout', 'gym', 'health', 'exercise'],
        'music': ['concerts', 'albums', 'artists', 'streaming'],
        'travel': ['destinations', 'culture', 'adventure', 'exploration'],
        'technology': ['gadgets', 'innovation', 'programming', 'apps']
      },
      'hobbies': {
        'photography': ['cameras', 'editing', 'portraits', 'landscapes'],
        'cooking': ['recipes', 'ingredients', 'techniques', 'cuisine'],
        'reading': ['books', 'authors', 'genres', 'reviews'],
        'gaming': ['video games', 'consoles', 'esports', 'streaming']
      }
    };

    const categoryMap = keywordMap[category] || {};
    const matchingKey = Object.keys(categoryMap).find(key => 
      item.toLowerCase().includes(key) || key.includes(item.toLowerCase())
    );

    return matchingKey ? categoryMap[matchingKey] : [];
  }

  /**
   * Clear caches to refresh recommendations
   */
  clearCache(): void {
    this.profileCache.clear();
    this.engagementCache.clear();
  }

  /**
   * Get recommendation statistics for analytics
   */
  async getRecommendationStats(userId: string): Promise<any> {
    const recommendations = await this.generateRecommendations(userId);
    
    return {
      totalRecommendations: recommendations.length,
      byType: recommendations.reduce((acc, rec) => {
        acc[rec.type] = (acc[rec.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageScore: recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length,
      topCategories: recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(rec => rec.category)
    };
  }
}

// Export singleton instance
export const contentRecommendationEngine = new ContentRecommendationEngine();