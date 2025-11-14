import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from '../lib/apiClient';
import type { RegisterDeviceRequest } from '@shared/api-contracts';

const DEVICE_TOKEN_KEY = 'expo_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class PushNotificationService {
  private deviceToken: string | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting push notification permissions:', error);
      return false;
    }
  }

  async getDeviceToken(): Promise<string | null> {
    try {
      // Check if we have a cached token
      if (this.deviceToken) {
        return this.deviceToken;
      }

      // Try to load from secure storage
      const storedToken = await SecureStore.getItemAsync(DEVICE_TOKEN_KEY);
      if (storedToken) {
        this.deviceToken = storedToken;
        return storedToken;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get Expo push token - projectId is optional for Expo Go
      const tokenData = await Notifications.getExpoPushTokenAsync();

      this.deviceToken = tokenData.data;
      
      // Persist token to secure storage
      await SecureStore.setItemAsync(DEVICE_TOKEN_KEY, tokenData.data);
      
      console.log('Device push token obtained:', this.deviceToken);
      return this.deviceToken;
    } catch (error) {
      console.error('Error getting device token:', error);
      return null;
    }
  }

  async registerDeviceToken(): Promise<boolean> {
    try {
      const token = await this.getDeviceToken();
      if (!token) {
        console.log('No device token available, skipping registration');
        return false;
      }

      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      
      const request: RegisterDeviceRequest = {
        token,
        platform,
      };

      const response = await apiClient.post<{ success: boolean }>(
        '/api/mobile/push/register-device',
        request
      );

      if (response.success) {
        console.log('Device token registered successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error registering device token:', error);
      return false;
    }
  }

  async unregisterDeviceToken(): Promise<boolean> {
    try {
      // Get token from memory or secure storage
      let token = this.deviceToken;
      if (!token) {
        token = await SecureStore.getItemAsync(DEVICE_TOKEN_KEY);
      }

      if (!token) {
        console.log('No device token to unregister');
        return true; // Consider it a success if there's nothing to unregister
      }

      // Send DELETE request with token in body
      await apiClient.request('/api/mobile/push/unregister-device', {
        method: 'DELETE',
        body: JSON.stringify({ token }),
      });

      // Clear from memory and storage
      this.deviceToken = null;
      await SecureStore.deleteItemAsync(DEVICE_TOKEN_KEY);
      
      console.log('Device token unregistered successfully');
      return true;
    } catch (error) {
      console.error('Error unregistering device token:', error);
      return false;
    }
  }

  setupNotificationListeners() {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }
}

export const pushNotificationService = new PushNotificationService();
