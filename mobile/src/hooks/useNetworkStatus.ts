import { useState, useEffect } from 'react';

/**
 * Network Status Hook
 * 
 * Detects online/offline status using browser/React Native APIs
 * 
 * For production, install @react-native-community/netinfo:
 * npx expo install @react-native-community/netinfo
 * 
 * Then replace this implementation with:
 * import NetInfo from '@react-native-community/netinfo';
 */

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: 'wifi' | 'cellular' | 'none' | 'unknown';
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  });

  useEffect(() => {
    // Fallback implementation using window.navigator (works in development)
    const updateOnlineStatus = () => {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      setNetworkStatus({
        isConnected: isOnline,
        isInternetReachable: isOnline,
        type: isOnline ? 'wifi' : 'none',
      });
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }

    /* 
    PRODUCTION IMPLEMENTATION:
    
    import NetInfo from '@react-native-community/netinfo';
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
    */
  }, []);

  return networkStatus;
};

/**
 * Hook to check if device is offline
 */
export const useIsOffline = (): boolean => {
  const { isConnected } = useNetworkStatus();
  return !isConnected;
};

/**
 * Hook to check if device is online
 */
export const useIsOnline = (): boolean => {
  const { isConnected } = useNetworkStatus();
  return isConnected;
};
