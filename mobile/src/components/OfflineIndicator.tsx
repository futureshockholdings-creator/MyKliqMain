import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useIsOffline } from '../hooks/useNetworkStatus';

/**
 * Offline Indicator Component
 * 
 * Shows a banner when the device loses internet connection
 * Automatically detects network status and displays warning
 */

interface OfflineIndicatorProps {
  message?: string;
  showIcon?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  message = 'No internet connection',
  showIcon = true,
}) => {
  const isOffline = useIsOffline();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline]);

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
      data-testid="offline-indicator"
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={message}
    >
      <View style={styles.content}>
        {showIcon && (
          <WifiOff 
            size={16} 
            color="#FFFFFF" 
            style={styles.icon}
          />
        )}
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#EF4444',
    paddingTop: 50, // Account for status bar
    paddingBottom: 8,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
