import { queryClient } from './queryClient';
import { buildWebSocketUrl } from './apiConfig';
import { refreshMessageData, refreshConnectionData } from './liveMemberData';

class FeedRealtimeService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // Start with 1 second
  private pollingDelay = 30000; // 30 seconds
  private isSubscribed = false;
  private userId: string | null = null;
  private isFallbackMode = false;
  private isPaused = false; // Flag to prevent reconnection while paused
  private stopWatchingNotifications: (() => void) | null = null;
  private knownMessageAlerts = new Set<string>();
  private messageRefresh: Promise<void> | null = null;
  private messageRefreshQueued = false;

  connect(userId: string) {
    if (this.userId === userId && this.ws &&
        (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.ws) this.disconnect();
    this.userId = userId;
    this.isPaused = false;
    this.watchMessageAlerts();
    // Use buildWebSocketUrl to correctly route to backend (api.mykliq.app) in production
    const wsUrl = buildWebSocketUrl('/ws');
    
    try {
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket || this.isPaused) return;
        this.reconnectAttempts = 0;
        this.stopPolling();
        this.subscribe();
        void this.refreshMessages();
        void refreshConnectionData(queryClient).catch(() => {});
        void queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
      };

      socket.onmessage = (event) => {
        if (this.ws !== socket || this.isPaused) return;
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'feed:new-content') {
            queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
          } else if (message.type === 'notification:new') {
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          } else if (message.type === 'message:new') {
            void this.refreshMessages();
            void queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          } else if (message.type === 'kliq:updated') {
            void refreshConnectionData(queryClient).catch(() => {});
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onerror = (error) => {
        if (this.ws !== socket) return;
        console.error('❌ WebSocket error:', error);
      };

      socket.onclose = () => {
        if (this.ws !== socket) return;
        this.ws = null;
        this.isSubscribed = false;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private watchMessageAlerts() {
    if (this.stopWatchingNotifications) return;
    const alertIds = (data: unknown) => new Set<string>(
      Array.isArray(data)
        ? data.filter(item => item?.type === 'incognito_message').map(item => String(item.id))
        : []
    );
    this.knownMessageAlerts = alertIds(queryClient.getQueryData(['/api/notifications']));
    this.stopWatchingNotifications = queryClient.getQueryCache().subscribe(event => {
      if (event.type !== 'updated' || event.query.queryKey.length !== 1 ||
          event.query.queryKey[0] !== '/api/notifications' || event.action.type !== 'success') return;
      const ids = alertIds(event.query.state.data);
      const hasNewMessage = [...ids].some(id => !this.knownMessageAlerts.has(id));
      this.knownMessageAlerts = ids;
      // Also synchronize content when an alert arrives through polling or a
      // different server instance, rather than waiting for the next chat poll.
      if (hasNewMessage && !this.isPaused) void this.refreshMessages();
    });
  }

  private refreshMessages(): Promise<void> {
    this.messageRefreshQueued = true;
    if (this.messageRefresh) return this.messageRefresh;
    this.messageRefresh = (async () => {
      do {
        this.messageRefreshQueued = false;
        await refreshMessageData(queryClient);
      } while (this.messageRefreshQueued && !this.isPaused);
    })().catch(() => {
      console.warn('[Realtime] Message refresh unavailable; polling remains enabled');
    }).finally(() => {
      this.messageRefresh = null;
      if (this.messageRefreshQueued && !this.isPaused) void this.refreshMessages();
    });
    return this.messageRefresh;
  }

  private subscribe() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.userId && !this.isSubscribed) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_feed',
        userId: this.userId
      }));
      this.isSubscribed = true;
    }
  }

  private attemptReconnect() {
    if (this.isPaused) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.startPolling();
      return;
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.userId) {
        this.connect(this.userId);
      }
    }, delay);
  }

  private startPolling() {
    if (this.isPaused) {
      return;
    }

    if (this.pollingInterval) {
      return;
    }

    this.isFallbackMode = true;

    this.pollingInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
    }, this.pollingDelay);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isFallbackMode = false;
    }
  }

  disconnect() {
    this.isPaused = true;
    this.userId = null;
    this.messageRefreshQueued = false;
    this.stopWatchingNotifications?.();
    this.stopWatchingNotifications = null;
    this.knownMessageAlerts.clear();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPolling();

    const socket = this.ws;
    this.ws = null;
    if (socket) {
      this.isSubscribed = false;
      socket.close();
    }
  }

  pause() {
    this.isPaused = true;
    this.disconnect();
  }

  resume(userId: string) {
    this.isPaused = false;
    this.reconnectAttempts = 0;
    this.connect(userId);
  }
}

export const feedRealtimeService = new FeedRealtimeService();
