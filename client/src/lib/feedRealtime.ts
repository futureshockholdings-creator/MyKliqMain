import { queryClient } from './queryClient';

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

  connect(userId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.userId = userId;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.stopPolling();
        this.subscribe();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'feed:new-content') {
            queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPolling();

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
}

export const feedRealtimeService = new FeedRealtimeService();
