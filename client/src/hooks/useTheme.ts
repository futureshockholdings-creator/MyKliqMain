import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UserTheme } from "@shared/schema";

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

// Apply theme to document root
const applyTheme = (theme: Partial<UserTheme>) => {
  const root = document.documentElement;
  
  if (theme.primaryColor) {
    root.style.setProperty('--primary', `hsl(${hexToHsl(theme.primaryColor)})`);
    root.style.setProperty('--mykliq-pink', `hsl(${hexToHsl(theme.primaryColor)})`);
  }
  
  if (theme.secondaryColor) {
    root.style.setProperty('--secondary', `hsl(${hexToHsl(theme.secondaryColor)})`);
    root.style.setProperty('--mykliq-blue', `hsl(${hexToHsl(theme.secondaryColor)})`);
  }
  
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
    enabled: false, // Temporarily disable this query to stop API spam
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