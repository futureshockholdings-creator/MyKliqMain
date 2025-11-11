import { queryClient } from './queryClient';

class FeedRealtimeService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // Start with 1 second
  private isSubscribed = false;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('📡 WebSocket already connected');
      return;
    }

    this.userId = userId;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log('📡 Connecting to WebSocket for feed updates...');
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Feed WebSocket connected');
        this.reconnectAttempts = 0;
        this.subscribe();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'feed:new-content') {
            console.log(`🔔 New ${message.contentType} posted! Refreshing feed...`);
            
            // Invalidate feed query to trigger refresh
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
        console.log('🔌 Feed WebSocket disconnected');
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
      console.log('📡 Subscribed to feed updates');
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('⚠️ Max reconnect attempts reached. Falling back to polling.');
      return;
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);

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

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.isSubscribed = false;
      this.ws.close();
      this.ws = null;
      console.log('🔌 Disconnected from feed WebSocket');
    }
  }

  pause() {
    // Pause connection when app goes to background (mobile battery optimization)
    this.disconnect();
    console.log('⏸️ Feed WebSocket paused');
  }

  resume(userId: string) {
    // Resume connection when app comes to foreground
    this.connect(userId);
    console.log('▶️ Feed WebSocket resumed');
  }
}

export const feedRealtimeService = new FeedRealtimeService();
