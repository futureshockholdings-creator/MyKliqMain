import localforage from 'localforage';
import { getUserIdFromToken } from './tokenStorage';

const OFFLINE_DB_NAME = 'MyKliq_Offline';
const OFFLINE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface OfflineEntry<T> {
  data: T;
  timestamp: number;
  endpoint: string;
  userId: string | null;
}

const CACHEABLE_ENDPOINTS = [
  '/api/kliq-feed',
  '/api/auth/user',
  '/api/friends',
  '/api/stories',
  '/api/user/theme',
  '/api/filters',
  '/api/mood-boost/posts',
  '/api/memes',
  '/api/moviecons',
  '/api/conversations',
  '/api/group-chats',
  '/api/notifications',
  '/api/sports/updates',
  '/api/ads/targeted',
];

class OfflineStore {
  private store = localforage.createInstance({
    name: OFFLINE_DB_NAME,
    storeName: 'offline_data',
    description: 'Offline data cache for MyKliq PWA',
  });

  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setOnline(true));
      window.addEventListener('offline', () => this.setOnline(false));
    }
  }

  private setOnline(online: boolean) {
    this.isOnline = online;
    this.listeners.forEach((cb) => cb(online));
  }

  markOffline() {
    this.setOnline(false);
  }

  markOnline() {
    this.setOnline(true);
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  shouldCache(url: string): boolean {
    return CACHEABLE_ENDPOINTS.some((ep) => url.includes(ep));
  }

  async saveForOffline<T>(url: string, data: T): Promise<void> {
    if (!this.shouldCache(url)) return;

    try {
      const userId = getUserIdFromToken();
      const key = this.buildKey(url, userId);
      const entry: OfflineEntry<T> = {
        data,
        timestamp: Date.now(),
        endpoint: url,
        userId,
      };
      await this.store.setItem(key, entry);
    } catch (e) {
      // silently fail - offline cache is best-effort
    }
  }

  async getOfflineData<T>(url: string): Promise<T | null> {
    try {
      const userId = getUserIdFromToken();
      const key = this.buildKey(url, userId);
      const entry = await this.store.getItem<OfflineEntry<T>>(key);
      if (!entry) return null;

      if (entry.userId !== userId) return null;

      if (Date.now() - entry.timestamp > OFFLINE_TTL) {
        await this.store.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (e) {
      return null;
    }
  }

  async getLastUpdated(url: string): Promise<number | null> {
    try {
      const userId = getUserIdFromToken();
      const key = this.buildKey(url, userId);
      const entry = await this.store.getItem<OfflineEntry<any>>(key);
      return entry ? entry.timestamp : null;
    } catch {
      return null;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await this.store.clear();
    } catch (e) {
      // silently fail
    }
  }

  private buildKey(url: string, userId: string | null): string {
    const cleanUrl = url.replace(/https?:\/\/[^/]+/, '');
    return `offline:${userId || 'anon'}:${cleanUrl}`;
  }
}

export const offlineStore = new OfflineStore();
