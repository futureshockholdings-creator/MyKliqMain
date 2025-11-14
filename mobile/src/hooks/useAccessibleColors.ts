import { useTheme } from '../providers/ThemeProvider';

/**
 * Hook that provides WCAG AA compliant colors
 * Automatically returns high contrast colors when highContrastMode is enabled
 * 
 * Usage:
 * const colors = useAccessibleColors();
 * <Text style={{ color: colors.mutedText }}>Secondary text</Text>
 * <TextInput placeholderTextColor={colors.placeholder} />
 */
export function useAccessibleColors() {
  const { resolvedColors } = useTheme();
  return resolvedColors;
}
