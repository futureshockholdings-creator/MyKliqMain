import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Notification } from '@shared/schema';

interface PushNotificationHook {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (title: string, options?: NotificationOptions) => void;
  isSupported: boolean;
}

export function usePushNotifications(): PushNotificationHook {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  // Check if browser supports notifications
  const isSupported = 'Notification' in window;

  // Initialize permission state
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  // Watch for new notifications and show banner alerts
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 5000, // Check every 5 seconds for new notifications
    staleTime: 0, // Always refetch when invalidated (immediate updates)
    enabled: isSupported && permission === 'granted',
  });

  // Show banner notification for new unread notifications
  useEffect(() => {
    if (!isSupported || permission !== 'granted' || notifications.length === 0) {
      return;
    }

    // Find the most recent unread notification
    const unreadNotifications = notifications
      .filter((n: Notification) => !n.isRead && n.isVisible)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (unreadNotifications.length === 0) {
      return;
    }

    const latestNotification = unreadNotifications[0];

    // Only show notification if it's a new one (different from last shown)
    if (latestNotification.id !== lastNotificationId) {
      setLastNotificationId(latestNotification.id);
      
      // Create notification title and body based on type
      let title = 'MyKliq';
      let body = latestNotification.message;
      let icon = '/favicon.ico';
      
      switch (latestNotification.type) {
        case 'post_like':
          title = '❤️ New Like';
          break;
        case 'comment':
          title = '💬 New Comment';
          break;
        case 'friend_request':
          title = '👥 Friend Request';
          break;
        case 'event_invite':
          title = '📅 Event Invitation';
          break;
        case 'message':
          title = '📨 New Message';
          break;
        case 'birthday':
          title = '🎂 Birthday Reminder';
          break;
        case 'meetup_invite':
          title = '📍 Meetup Invitation';
          break;
        case 'live_stream':
          title = '🔴 Live Stream';
          break;
        default:
          title = '🔔 MyKliq Notification';
      }

      showNotification(title, {
        body,
        icon,
        badge: icon,
        tag: latestNotification.type, // Replace previous notifications of same type
        requireInteraction: false,
        silent: false,
        data: {
          notificationId: latestNotification.id,
          type: latestNotification.type,
          url: window.location.origin
        }
      });
    }
  }, [notifications, permission, isSupported, lastNotificationId]);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  const showNotification = (title: string, options: NotificationOptions = {}) => {
    if (!isSupported || permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        ...options,
        // Auto-close after 6 seconds
        ...(!options.requireInteraction && { 
          // Add timestamp to ensure uniqueness
          timestamp: Date.now()
        })
      });

      // Auto-close notification after 6 seconds if not set to require interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 6000);
      }

      // Handle notification click
      notification.onclick = () => {
        window.focus(); // Focus the browser window
        notification.close();
        
        // If there's URL data, navigate to it
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
      };

      // Handle notification close
      notification.onclose = () => {
        // Optional: Track notification interactions
        console.log('Notification closed');
      };

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported
  };
}