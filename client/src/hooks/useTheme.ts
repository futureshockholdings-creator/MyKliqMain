import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
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
};

export function useTheme() {
  const { data: theme, isLoading } = useQuery({
    queryKey: ["/api/user/theme"],
    retry: false,
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