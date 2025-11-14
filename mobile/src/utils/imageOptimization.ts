/**
 * Image Optimization Utilities for MyKliq
 * 
 * Provides image caching, lazy loading, and performance optimization
 * for feed images, stories, and profile pictures.
 */

import { Image } from 'react-native';

/**
 * Image cache configuration
 */
export const IMAGE_CACHE_CONFIG = {
  // Maximum cache size in MB
  maxCacheSize: 100,
  
  // Cache expiration in days
  cacheExpiration: 7,
  
  // Prefetch priority
  prefetchPriority: 'low' as const,
};

/**
 * Prefetch images for better performance
 * Use this to preload images before they're displayed
 */
export const prefetchImage = async (uri: string): Promise<boolean> => {
  try {
    await Image.prefetch(uri);
    return true;
  } catch (error) {
    console.error('Image prefetch failed:', uri, error);
    return false;
  }
};

/**
 * Prefetch multiple images in parallel
 */
export const prefetchImages = async (uris: string[]): Promise<void> => {
  const prefetchPromises = uris.map(uri => prefetchImage(uri));
  await Promise.allSettled(prefetchPromises);
};

/**
 * Get optimized image URL with query parameters for server-side resizing
 * Assumes backend supports image transformation
 */
export const getOptimizedImageUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number; // 1-100
    format?: 'jpg' | 'png' | 'webp';
  } = {}
): string => {
  if (!url) return url;
  
  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format) params.append('f', options.format);
  
  const separator = url.includes('?') ? '&' : '?';
  return params.toString() ? `${url}${separator}${params.toString()}` : url;
};

/**
 * Image size presets for common use cases
 */
export const IMAGE_PRESETS = {
  thumbnail: { width: 150, height: 150, quality: 70 },
  profilePicture: { width: 300, height: 300, quality: 80 },
  feedImage: { width: 800, height: 800, quality: 85 },
  storyImage: { width: 1080, height: 1920, quality: 90 },
  fullscreen: { width: 1920, height: 1920, quality: 95 },
} as const;

/**
 * Get image URL for specific preset
 */
export const getImageForPreset = (
  url: string,
  preset: keyof typeof IMAGE_PRESETS
): string => {
  return getOptimizedImageUrl(url, IMAGE_PRESETS[preset]);
};

/**
 * Clear image cache
 * Note: React Native doesn't expose native cache clearing API
 * This is a placeholder for expo-image or react-native-fast-image
 */
export const clearImageCache = async (): Promise<void> => {
  console.warn('Image cache clearing not implemented for standard React Native Image');
  // TODO: Implement with expo-image or react-native-fast-image
  //  await Image.clearDiskCache();
  //  await Image.clearMemoryCache();
};

/**
 * Get cache size
 * Note: Placeholder - requires expo-image or react-native-fast-image
 */
export const getCacheSize = async (): Promise<number> => {
  console.warn('Cache size retrieval not implemented for standard React Native Image');
  // TODO: Implement with expo-image or react-native-fast-image
  return 0;
};

/**
 * Progressive image loading helper
 * Returns thumbnail URL for initial load, then full URL
 */
export const getProgressiveImageUrls = (
  url: string
): { thumbnail: string; full: string } => {
  return {
    thumbnail: getImageForPreset(url, 'thumbnail'),
    full: getImageForPreset(url, 'feedImage'),
  };
};

/**
 * Calculate optimal image dimensions based on screen size
 */
export const getOptimalImageDimensions = (
  screenWidth: number,
  aspectRatio: number = 1
): { width: number; height: number } => {
  const width = Math.min(screenWidth, 1080); // Max width for mobile
  const height = Math.round(width / aspectRatio);
  
  return { width, height };
};

/**
 * Image optimization best practices
 */
export const IMAGE_OPTIMIZATION_TIPS = {
  caching: 'Use Image.prefetch() for critical images',
  sizing: 'Request images at exact display size, not larger',
  format: 'Use WebP format when possible for better compression',
  lazyLoading: 'Load images only when they enter viewport',
  progressive: 'Load low-quality placeholder first, then full image',
  compression: 'Balance quality (85%) vs file size for best UX',
};

/**
 * Debug: Log image loading performance
 */
export const logImagePerformance = (uri: string, startTime: number) => {
  const loadTime = Date.now() - startTime;
  
  if (loadTime > 1000) {
    console.warn(`Slow image load: ${uri} took ${loadTime}ms`);
  } else if (__DEV__) {
    console.log(`Image loaded: ${uri} in ${loadTime}ms`);
  }
};
