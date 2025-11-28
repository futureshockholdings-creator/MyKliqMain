import { queryClient } from './queryClient';

class FeedRealtimeService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private reconnectProbeInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000;
  private pollingDelay = 2000; // 2 seconds for near-immediate updates
  private reconnectProbeDelay = 15000; // Try to reconnect WebSocket every 15 seconds
  private isSubscribed = false;
  private userId: string | null = null;
  private isFallbackMode = false;
  private isPaused = false;
  private lastFeedCheck = 0;
  private lastContentHash = '';

  connect(userId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.userId = userId;
    
    const realtimeUrl = import.meta.env.VITE_REALTIME_URL;
    let wsUrl: string;
    
    if (realtimeUrl) {
      wsUrl = realtimeUrl;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected - real-time updates active');
        this.reconnectAttempts = 0;
        this.isFallbackMode = false;
        this.stopPolling();
        this.stopReconnectProbe();
        this.subscribe();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleRealtimeMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = () => {
        // Silent error - will handle in onclose
      };

      this.ws.onclose = () => {
        this.isSubscribed = false;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private handleRealtimeMessage(message: { type: string; postId?: string; commentId?: string }) {
    switch (message.type) {
      case 'feed:new-content':
      case 'post:created':
      case 'post:updated':
      case 'post:deleted':
        queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        break;
        
      case 'like:updated':
      case 'like:created':
      case 'like:deleted':
        queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
        if (message.postId) {
          queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId] });
          queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId, 'likes'] });
        }
        break;
        
      case 'comment:created':
      case 'comment:updated':
      case 'comment:deleted':
        queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
        if (message.postId) {
          queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId] });
          queryClient.invalidateQueries({ queryKey: ['/api/posts', message.postId, 'comments'] });
          queryClient.invalidateQueries({ queryKey: ['/api/comments', message.postId] });
        }
        break;
        
      case 'story:created':
      case 'story:deleted':
        queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
        break;
        
      case 'notification:new':
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        break;
        
      default:
        queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
    }
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
      console.log('⚡ Switching to fast polling mode (2-second updates)');
      this.startPolling();
      this.startReconnectProbe();
      return;
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      10000
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
      this.pollForUpdates();
    }, this.pollingDelay);
    
    this.pollForUpdates();
  }

  private pollForUpdates() {
    const now = Date.now();
    if (now - this.lastFeedCheck < 1000) {
      return;
    }
    this.lastFeedCheck = now;

    queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
  }

  private startReconnectProbe() {
    if (this.reconnectProbeInterval) {
      return;
    }

    this.reconnectProbeInterval = setInterval(() => {
      if (this.isFallbackMode && this.userId && !this.isPaused) {
        console.log('🔄 Probing WebSocket reconnection...');
        this.reconnectAttempts = 0;
        this.connect(this.userId);
      }
    }, this.reconnectProbeDelay);
  }

  private stopReconnectProbe() {
    if (this.reconnectProbeInterval) {
      clearInterval(this.reconnectProbeInterval);
      this.reconnectProbeInterval = null;
    }
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isFallbackMode = false;
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPolling();
    this.stopReconnectProbe();

    if (this.ws) {
      this.isSubscribed = false;
      this.ws.close();
      this.ws = null;
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

  isInFallbackMode() {
    return this.isFallbackMode;
  }

  forceRefresh() {
    queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
  }
}

export const feedRealtimeService = new FeedRealtimeService();
