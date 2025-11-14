import { useMemo } from 'react';
import { useAccessibleColors } from './useAccessibleColors';

/**
 * Hook that provides accessible text and UI styles as React Native style objects
 * Use these style objects to override className-based colors for high contrast mode
 * 
 * Usage:
 * const styles = useAccessibleTextStyles();
 * <Text className="text-sm" style={styles.muted}>Secondary text</Text>
 * <View className="border rounded" style={styles.border}>...</View>
 */
export function useAccessibleTextStyles() {
  const colors = useAccessibleColors();

  return useMemo(
    () => ({
      // Text colors
      muted: { color: colors.mutedText },
      placeholder: { color: colors.placeholder },
      
      // Border colors
      border: { borderColor: colors.border },
      borderTop: { borderTopColor: colors.border },
      borderBottom: { borderBottomColor: colors.border },
      
      // Background colors
      cardBg: { backgroundColor: colors.card },
      mutedBg: { backgroundColor: colors.muted },
    }),
    [colors]
  );
}
