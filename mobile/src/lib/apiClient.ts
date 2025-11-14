/**
 * MyKliq Mobile API Client - Enterprise Edition
 * Connects to 107+ mobile-optimized backend endpoints
 * 
 * Features:
 * - Automatic JWT authentication
 * - Offline request queueing
 * - Enterprise optimizations for 20k+ users:
 *   * Request deduplication
 *   * Performance monitoring
 *   * Circuit breaker for resilience
 *   * Enhanced caching with SWR
 */

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { requestQueue } from '@/utils/requestQueue';
import { requestScheduler } from './requestScheduler';
import { performanceMonitor } from './performanceMonitor';
import { circuitBreaker } from './circuitBreaker';
import { enhancedCache } from './enhancedCache';
import { buildCacheKey } from './cacheKeyBuilder';

// API Configuration
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://c7dd138c-576d-4490-a426-c0be6e6124ca-00-1u3lut3kqrgq6.kirk.replit.dev';

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('jwt_token');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  async setAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('jwt_token', token);
    } catch (error) {
      console.error('Failed to set auth token:', error);
    }
  }

  async clearAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('jwt_token');
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    enableOfflineQueue: boolean = true
  ): Promise<T> {
    const method = options.method || 'GET';
    const isGetRequest = method === 'GET';

    // For GET requests, use request deduplication and circuit breaker
    if (isGetRequest) {
      // Build safe cache key (handles non-serializable objects)
      const cacheKey = buildCacheKey(endpoint, options);
      
      return requestScheduler.deduplicatedRequest(
        cacheKey,
        () =>
          circuitBreaker.execute(
            endpoint,
            () => performanceMonitor.trackApiCall(
              endpoint,
              () => this.executeRequest<T>(endpoint, options, false, cacheKey)
            ),
            // Fallback: try cache if circuit is open (with full cache key)
            async () => {
              console.log(`[ApiClient] Circuit open, trying cache for ${endpoint}`);
              const cached = await enhancedCache.get<T>(cacheKey);
              if (cached) {
                console.log(`[ApiClient] Cache hit (circuit open fallback)`);
                return cached;
              }
              throw new Error('Service temporarily unavailable');
            }
          ),
        'normal'
      );
    }

    // For mutating requests, use circuit breaker and performance tracking
    return circuitBreaker.execute(
      endpoint,
      () => performanceMonitor.trackApiCall(
        endpoint,
        () => this.executeRequest<T>(endpoint, options, enableOfflineQueue)
      )
    );
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    enableOfflineQueue: boolean = true,
    cacheKey?: string
  ): Promise<T> {
    const token = await this.getAuthToken();
    const isFormData = options.body instanceof FormData;
    
    const headers: HeadersInit = {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear it
          await this.clearAuthToken();
          throw new Error('Session expired. Please log in again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Cache GET responses with safe cache key
      if (!options.method || options.method === 'GET') {
        const finalCacheKey = cacheKey || buildCacheKey(endpoint, options);
        await enhancedCache.set(finalCacheKey, data, {
          memoryTTL: 5 * 60 * 1000, // 5 minutes in memory
          diskTTL: 60 * 60 * 1000, // 1 hour on disk
        });
      }

      return data;
    } catch (error) {
      // Queue mutating requests if offline
      if (enableOfflineQueue && this.isMutatingRequest(options.method)) {
        // Treat all TypeErrors from fetch as network errors (covers all offline scenarios)
        // This includes: "Network request failed", "Failed to fetch", localized variants, etc.
        const isNetworkError = error instanceof TypeError;
        
        if (isNetworkError) {
          console.log(`[ApiClient] Network error (${error.message}), queueing request: ${endpoint}`);
          
          // Parse body for queueing
          let body;
          try {
            body = options.body ? JSON.parse(options.body as string) : undefined;
          } catch {
            body = options.body;
          }
          
          await requestQueue.add(
            endpoint,
            options.method as any,
            body,
            'normal',
            `${options.method} ${endpoint}`
          );
          
          // Throw a user-friendly error
          throw new Error('No internet connection. Your action will be synced when you\'re back online.');
        }
      }
      
      throw error;
    }
  }

  private isMutatingRequest(method?: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method?.toUpperCase() || '');
  }

  // Authentication
  async login(phoneNumber: string, password: string) {
    return this.request('/api/mobile/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password }),
    });
  }

  async signup(data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    password: string;
    birthdate: string;
    inviteCode?: string;
  }) {
    return this.request('/api/mobile/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    await this.clearAuthToken();
  }

  // Feed & Posts
  async getFeed(cursor?: string, limit: number = 20) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append('cursor', cursor);
    return this.request(`/api/mobile/feed?${params}`);
  }

  async createPost(data: {
    content?: string;
    mediaUrl?: string;
    videoUrl?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
  }) {
    return this.request('/api/mobile/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async likePost(postId: string) {
    return this.request(`/api/mobile/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async commentOnPost(postId: string, content: string) {
    return this.request(`/api/mobile/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getComments(postId: string) {
    return this.request(`/api/mobile/posts/${postId}/comments`);
  }

  async likeComment(commentId: string) {
    return this.request(`/api/mobile/comments/${commentId}/like`, {
      method: 'POST',
    });
  }

  async unlikeComment(commentId: string) {
    return this.request(`/api/mobile/comments/${commentId}/like`, {
      method: 'DELETE',
    });
  }

  async replyToComment(commentId: string, content: string) {
    return this.request(`/api/mobile/comments/${commentId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Stories
  async getStories() {
    return this.request('/api/mobile/stories');
  }

  async createStory(data: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    duration?: number;
  }) {
    return this.request('/api/mobile/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async viewStory(storyId: string) {
    return this.request(`/api/mobile/stories/${storyId}/view`, {
      method: 'POST',
    });
  }

  // Messages
  async getConversations() {
    return this.request('/api/mobile/messages/conversations');
  }

  async getMessages(friendId: string, cursor?: string) {
    const params = new URLSearchParams({ limit: '50' });
    if (cursor) params.append('cursor', cursor);
    return this.request(`/api/mobile/messages/${friendId}?${params}`);
  }

  async sendMessage(friendId: string, content: string) {
    return this.request(`/api/mobile/messages/${friendId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async sendMediaMessage(friendId: string, formData: FormData) {
    return this.request(`/api/mobile/messages/${friendId}/media`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  async sendGifMessage(friendId: string, gifUrl: string) {
    return this.request(`/api/mobile/messages/${friendId}/gif`, {
      method: 'POST',
      body: JSON.stringify({ gifUrl }),
    });
  }

  // Kliq Koin
  async getKliqKoinStats() {
    return this.request('/api/mobile/kliq-koin/stats');
  }

  async checkIn() {
    return this.request('/api/mobile/kliq-koin/check-in', {
      method: 'POST',
    });
  }

  // Polls
  async createPoll(data: {
    question: string;
    options: string[];
    duration: number;
  }) {
    return this.request('/api/mobile/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async votePoll(pollId: string, optionIndex: number) {
    return this.request(`/api/mobile/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionIndex }),
    });
  }

  // Events
  async getEvents() {
    return this.request('/api/mobile/calendar/events');
  }

  async createEvent(data: {
    title: string;
    description?: string;
    eventDate: string;
    location?: string;
    mediaUrl?: string;
  }) {
    return this.request('/api/mobile/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Live Streaming
  async getActions() {
    return this.request('/api/mobile/actions');
  }

  async createAction(data: {
    title: string;
    description?: string;
    thumbnailUrl?: string;
  }) {
    return this.request('/api/mobile/actions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinAction(actionId: string) {
    return this.request(`/api/mobile/actions/${actionId}/join`, {
      method: 'POST',
    });
  }

  // Daily Content
  async getHoroscope(timezone?: string) {
    const params = timezone ? `?timezone=${timezone}` : '';
    return this.request(`/api/mobile/daily/horoscope${params}`);
  }

  async getBibleVerse(timezone?: string) {
    const params = timezone ? `?timezone=${timezone}` : '';
    return this.request(`/api/mobile/daily/bible-verse${params}`);
  }

  // AI Mood Boost
  async getMoodBoostPosts() {
    return this.request('/api/mobile/mood-boost/posts');
  }

  // Profile
  async getProfile() {
    return this.request('/api/mobile/profile');
  }

  async updateProfile(data: any) {
    return this.request('/api/mobile/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Notifications
  async getNotifications() {
    return this.request('/api/mobile/notifications');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/api/mobile/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  // Real-time Updates
  async checkUpdates(lastChecked: string) {
    return this.request(`/api/mobile/updates/check?lastChecked=${lastChecked}`);
  }

  // User Theme
  async getUserTheme() {
    return this.request('/api/mobile/user/theme');
  }

  async updateUserTheme(theme: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    fontColor?: string;
    navBgColor?: string;
    navActiveColor?: string;
    borderStyle?: string;
    enableSparkles?: boolean;
  }) {
    return this.request('/api/mobile/user/theme', {
      method: 'POST',
      body: JSON.stringify(theme),
    });
  }
}

export const apiClient = new ApiClient();
