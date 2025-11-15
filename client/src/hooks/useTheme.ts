import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UserTheme } from "@shared/schema";
import { getAccessibleForeground } from "@/lib/colorUtils";

// Helper function to convert hex to HSL
const hexToHsl = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
};

// Safe helper to convert accessible foreground color with validation
const safeAccessibleForeground = (bgColor: string): string | null => {
  try {
    const foregroundHex = getAccessibleForeground(bgColor);
    // Validate: must be 6-digit hex color
    if (foregroundHex && /^#[0-9A-Fa-f]{6}$/.test(foregroundHex)) {
      return hexToHsl(foregroundHex);
    }
  } catch (error) {
    console.warn(`Failed to calculate accessible foreground for ${bgColor}`, error);
  }
  return null;
};

// Apply theme to document root
const applyTheme = (theme: Partial<UserTheme>) => {
  const root = document.documentElement;
  
  if (theme.primaryColor) {
    root.style.setProperty('--primary', `hsl(${hexToHsl(theme.primaryColor)})`);
    root.style.setProperty('--mykliq-pink', `hsl(${hexToHsl(theme.primaryColor)})`);
    
    // Auto-calculate accessible foreground color for primary
    const primaryForegroundHsl = safeAccessibleForeground(theme.primaryColor);
    if (primaryForegroundHsl) {
      root.style.setProperty('--primary-foreground', `hsl(${primaryForegroundHsl})`);
    }
  }
  
  if (theme.secondaryColor) {
    root.style.setProperty('--secondary', `hsl(${hexToHsl(theme.secondaryColor)})`);
    root.style.setProperty('--mykliq-blue', `hsl(${hexToHsl(theme.secondaryColor)})`);
    
    // Auto-calculate accessible foreground color for secondary
    const secondaryForegroundHsl = safeAccessibleForeground(theme.secondaryColor);
    if (secondaryForegroundHsl) {
      root.style.setProperty('--secondary-foreground', `hsl(${secondaryForegroundHsl})`);
    }
  }
  
  // Auto-calculate navigation colors if navBgColor is set
  if (theme.navBgColor) {
    root.style.setProperty('--sidebar', `hsl(${hexToHsl(theme.navBgColor)})`);
    const navForegroundHsl = safeAccessibleForeground(theme.navBgColor);
    if (navForegroundHsl) {
      root.style.setProperty('--sidebar-foreground', `hsl(${navForegroundHsl})`);
    }
  }
  
  // Auto-calculate card foreground if card background is customizable
  if (theme.backgroundColor) {
    const cardForegroundHsl = safeAccessibleForeground(theme.backgroundColor);
    if (cardForegroundHsl) {
      root.style.setProperty('--card-foreground', `hsl(${cardForegroundHsl})`);
      root.style.setProperty('--foreground', `hsl(${cardForegroundHsl})`);
    }
  }
  
  // Auto-calculate muted-foreground based on hardcoded muted background
  // --muted is always hsl(0, 0%, 9.4%) (dark), so foreground must be light for WCAG AA
  const mutedBg = '#171717'; // RGB equivalent of hsl(0, 0%, 9.4%)
  const mutedForegroundHsl = safeAccessibleForeground(mutedBg);
  if (mutedForegroundHsl) {
    root.style.setProperty('--muted-foreground', `hsl(${mutedForegroundHsl})`);
  }
  // Otherwise keep the base CSS value (white) which is already WCAG AA compliant
  
  if (theme.fontFamily) {
    const fontMap = {
      comic: 'Comic Neue, Comic Sans MS, cursive',
      retro: 'Courier Prime, Courier New, monospace',
      helvetica: 'Helvetica, sans-serif',
      times: 'Times New Roman, serif',
      impact: 'Impact, sans-serif'
    };
    root.style.setProperty('--font-sans', fontMap[theme.fontFamily as keyof typeof fontMap] || fontMap.comic);
  }

  // Apply background customization
  if (theme.backgroundType && theme.backgroundType === 'solid' && theme.backgroundColor) {
    root.style.setProperty('--background', `hsl(${hexToHsl(theme.backgroundColor)})`);
    root.style.removeProperty('background-image');
  } else if (theme.backgroundType === 'gradient' && theme.backgroundGradientStart && theme.backgroundGradientEnd) {
    const startHsl = hexToHsl(theme.backgroundGradientStart);
    const endHsl = hexToHsl(theme.backgroundGradientEnd);
    root.style.setProperty('--background', `linear-gradient(135deg, hsl(${startHsl}), hsl(${endHsl}))`);
    root.style.setProperty('background-image', `linear-gradient(135deg, hsl(${startHsl}), hsl(${endHsl}))`);
  } else if (theme.backgroundType === 'pattern' && theme.backgroundPattern) {
    // Apply pattern backgrounds
    const patterns = {
      dots: `radial-gradient(circle, hsl(${theme.primaryColor ? hexToHsl(theme.primaryColor) : '328, 100%, 54%'}) 1px, transparent 1px)`,
      lines: `linear-gradient(45deg, hsl(${theme.primaryColor ? hexToHsl(theme.primaryColor) : '328, 100%, 54%'}) 1px, transparent 1px)`,
      waves: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20c0-11 9-20 20-20s20 9 20 20-9 20-20 20-20-9-20-20z' fill='%23${theme.primaryColor?.replace('#', '') || 'FF1493'}' opacity='0.1'/%3E%3C/svg%3E")`,
      geometric: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${theme.primaryColor?.replace('#', '') || 'FF1493'}' opacity='0.1'%3E%3Cpath d='M30 30l15-15v30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
    };
    root.style.setProperty('background-image', patterns[theme.backgroundPattern as keyof typeof patterns] || patterns.dots);
    root.style.setProperty('background-size', theme.backgroundPattern === 'dots' ? '20px 20px' : '40px 40px');
  }
};

export function useTheme() {
  const { data: theme, isLoading } = useQuery({
    queryKey: ["/api/user/theme"],
    enabled: true, // Re-enabled with proper caching
    retry: false,
    staleTime: Infinity, // Never consider data stale
    gcTime: Infinity, // Never garbage collect
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchInterval: false, // Disable automatic refetching
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Apply theme when it loads or changes
  useEffect(() => {
    if (theme) {
      applyTheme(theme);
    }
  }, [theme]);

  return {
    theme,
    isLoading,
    applyTheme,
  };
}