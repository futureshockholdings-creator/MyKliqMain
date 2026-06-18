import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: 'wifi' | 'cellular' | 'none' | 'unknown';
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: (state.type as NetworkStatus['type']) ?? 'unknown',
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
};

export const useIsOffline = (): boolean => {
  const { isConnected } = useNetworkStatus();
  return !isConnected;
};

export const useIsOnline = (): boolean => {
  const { isConnected } = useNetworkStatus();
  return isConnected;
};
