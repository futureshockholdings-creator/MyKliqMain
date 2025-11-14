/**
 * MyKliq Mobile API Client
 * Connects to 107+ mobile-optimized backend endpoints
 */

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

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
    options: RequestInit = {}
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

    return response.json();
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
}

export const apiClient = new ApiClient();
