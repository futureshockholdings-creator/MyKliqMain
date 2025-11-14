/**
 * Offline Data Cache Service
 * 
 * Provides persistent caching for critical app data using AsyncStorage.
 * Enables offline access to feed, messages, profile, and other core features.
 * 
 * Features:
 * - Automatic cache invalidation based on TTL
 * - Type-safe cache operations
 * - Graceful error handling
 * - Cache size management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  // Cache keys
  KEYS: {
    FEED_POSTS: 'cache:feed_posts',
    USER_PROFILE: 'cache:user_profile',
    FRIENDS_LIST: 'cache:friends_list',
    MESSAGES: 'cache:messages',
    STORIES: 'cache:stories',
    NOTIFICATIONS: 'cache:notifications',
    THEME: 'cache:theme',
    STREAK: 'cache:streak',
  },
  
  // Time to live (TTL) in milliseconds
  TTL: {
    FEED_POSTS: 10 * 60 * 1000, // 10 minutes
    USER_PROFILE: 60 * 60 * 1000, // 1 hour
    FRIENDS_LIST: 30 * 60 * 1000, // 30 minutes
    MESSAGES: 5 * 60 * 1000, // 5 minutes
    STORIES: 24 * 60 * 60 * 1000, // 24 hours
    NOTIFICATIONS: 5 * 60 * 1000, // 5 minutes
    THEME: 7 * 24 * 60 * 60 * 1000, // 7 days
    STREAK: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Max items to cache
  MAX_ITEMS: {
    FEED_POSTS: 20,
    MESSAGES: 50,
    STORIES: 10,
    NOTIFICATIONS: 20,
  },
};

/**
 * Cached data wrapper with metadata
 */
interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Offline Cache Service
 */
class OfflineCache {
  /**
   * Store data in cache
   */
  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(cachedData));
    } catch (error) {
      console.error(`[OfflineCache] Failed to set ${key}:`, error);
    }
  }

  /**
   * Retrieve data from cache
   * Returns null if expired or not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cachedData: CachedData<T> = JSON.parse(cached);
      
      // Check if expired
      const age = Date.now() - cachedData.timestamp;
      if (age > cachedData.ttl) {
        // Data expired, remove it
        await this.remove(key);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.error(`[OfflineCache] Failed to get ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove item from cache
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[OfflineCache] Failed to remove ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache:'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('[OfflineCache] Failed to clear all:', error);
    }
  }

  /**
   * Get cache size in bytes (approximate)
   */
  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache:'));
      const items = await AsyncStorage.multiGet(cacheKeys);
      
      let totalSize = 0;
      items.forEach(([key, value]) => {
        if (value) {
          totalSize += key.length + value.length;
        }
      });
      
      return totalSize;
    } catch (error) {
      console.error('[OfflineCache] Failed to get cache size:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const offlineCache = new OfflineCache();
export { CACHE_CONFIG };

/**
 * Type-safe cache helpers for specific data types
 */

// Feed posts
export const cacheFeedPosts = async (posts: any[]): Promise<void> => {
  const limited = posts.slice(0, CACHE_CONFIG.MAX_ITEMS.FEED_POSTS);
  await offlineCache.set(
    CACHE_CONFIG.KEYS.FEED_POSTS,
    limited,
    CACHE_CONFIG.TTL.FEED_POSTS
  );
};

export const getCachedFeedPosts = async (): Promise<any[] | null> => {
  return offlineCache.get<any[]>(CACHE_CONFIG.KEYS.FEED_POSTS);
};

// User profile
export const cacheUserProfile = async (profile: any): Promise<void> => {
  await offlineCache.set(
    CACHE_CONFIG.KEYS.USER_PROFILE,
    profile,
    CACHE_CONFIG.TTL.USER_PROFILE
  );
};

export const getCachedUserProfile = async (): Promise<any | null> => {
  return offlineCache.get(CACHE_CONFIG.KEYS.USER_PROFILE);
};

// Friends list
export const cacheFriendsList = async (friends: any[]): Promise<void> => {
  await offlineCache.set(
    CACHE_CONFIG.KEYS.FRIENDS_LIST,
    friends,
    CACHE_CONFIG.TTL.FRIENDS_LIST
  );
};

export const getCachedFriendsList = async (): Promise<any[] | null> => {
  return offlineCache.get<any[]>(CACHE_CONFIG.KEYS.FRIENDS_LIST);
};

// Messages
export const cacheMessages = async (conversationId: string, messages: any[]): Promise<void> => {
  const key = `${CACHE_CONFIG.KEYS.MESSAGES}:${conversationId}`;
  const limited = messages.slice(0, CACHE_CONFIG.MAX_ITEMS.MESSAGES);
  await offlineCache.set(key, limited, CACHE_CONFIG.TTL.MESSAGES);
};

export const getCachedMessages = async (conversationId: string): Promise<any[] | null> => {
  const key = `${CACHE_CONFIG.KEYS.MESSAGES}:${conversationId}`;
  return offlineCache.get<any[]>(key);
};

// Stories
export const cacheStories = async (stories: any[]): Promise<void> => {
  const limited = stories.slice(0, CACHE_CONFIG.MAX_ITEMS.STORIES);
  await offlineCache.set(
    CACHE_CONFIG.KEYS.STORIES,
    limited,
    CACHE_CONFIG.TTL.STORIES
  );
};

export const getCachedStories = async (): Promise<any[] | null> => {
  return offlineCache.get<any[]>(CACHE_CONFIG.KEYS.STORIES);
};

// Notifications
export const cacheNotifications = async (notifications: any[]): Promise<void> => {
  const limited = notifications.slice(0, CACHE_CONFIG.MAX_ITEMS.NOTIFICATIONS);
  await offlineCache.set(
    CACHE_CONFIG.KEYS.NOTIFICATIONS,
    limited,
    CACHE_CONFIG.TTL.NOTIFICATIONS
  );
};

export const getCachedNotifications = async (): Promise<any[] | null> => {
  return offlineCache.get<any[]>(CACHE_CONFIG.KEYS.NOTIFICATIONS);
};

// Theme
export const cacheTheme = async (theme: any): Promise<void> => {
  await offlineCache.set(
    CACHE_CONFIG.KEYS.THEME,
    theme,
    CACHE_CONFIG.TTL.THEME
  );
};

export const getCachedTheme = async (): Promise<any | null> => {
  return offlineCache.get(CACHE_CONFIG.KEYS.THEME);
};

// Streak
export const cacheStreak = async (streak: any): Promise<void> => {
  await offlineCache.set(
    CACHE_CONFIG.KEYS.STREAK,
    streak,
    CACHE_CONFIG.TTL.STREAK
  );
};

export const getCachedStreak = async (): Promise<any | null> => {
  return offlineCache.get(CACHE_CONFIG.KEYS.STREAK);
};
