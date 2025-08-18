/**
 * Utility functions for dynamic text color adaptation based on background colors
 */

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  // Convert RGB to relative luminance
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determine if a color is dark (closer to black)
 */
function isDarkColor(color: string): boolean {
  // Handle hex colors
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (!rgb) return false;
    
    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    return luminance < 0.5;
  }
  
  // Handle RGB/RGBA colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    
    const luminance = getLuminance(r, g, b);
    return luminance < 0.5;
  }
  
  // Handle named colors - assume common dark colors
  const darkColors = [
    'black', 'darkblue', 'darkgreen', 'darkred', 'darkgray', 'darkgrey',
    'maroon', 'navy', 'olive', 'purple', 'teal', 'dimgray', 'dimgrey'
  ];
  
  return darkColors.includes(color.toLowerCase());
}

/**
 * Get appropriate text color based on background color
 */
export function getTextColorForBackground(backgroundColor: string): string {
  if (isDarkColor(backgroundColor)) {
    return '#ffffff'; // White text for dark backgrounds
  }
  return '#000000'; // Black text for light backgrounds
}

/**
 * Get appropriate text color class for Tailwind based on background color
 */
export function getTextColorClassForBackground(backgroundColor: string): string {
  if (isDarkColor(backgroundColor)) {
    return 'text-white'; // White text for dark backgrounds
  }
  return 'text-black'; // Black text for light backgrounds
}

/**
 * Check if background is approximately black
 */
export function isBlackBackground(backgroundColor: string): boolean {
  // Handle hex colors
  if (backgroundColor.startsWith('#')) {
    const rgb = hexToRgb(backgroundColor);
    if (!rgb) return false;
    
    // Consider black if all RGB values are very low
    return rgb.r < 30 && rgb.g < 30 && rgb.b < 30;
  }
  
  // Handle RGB/RGBA colors
  const rgbMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    
    return r < 30 && g < 30 && b < 30;
  }
  
  // Handle named colors
  return backgroundColor.toLowerCase() === 'black';
}