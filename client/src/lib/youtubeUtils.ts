// YouTube URL detection and embed utilities

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * @param url - The YouTube URL to parse
 * @returns The video ID or null if not a valid YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Common YouTube URL patterns
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Checks if a string contains any YouTube URLs
 * @param text - The text to check
 * @returns Array of YouTube URLs found in the text
 */
export function findYouTubeUrls(text: string): string[] {
  if (!text) return [];
  
  // More comprehensive pattern to capture full YouTube URLs including query parameters
  const urlPattern = /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w-]+(?:[^\s]*)?/g;
  return text.match(urlPattern) || [];
}

/**
 * Generates a YouTube embed URL from a video ID
 * @param videoId - The YouTube video ID
 * @returns The embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
}

/**
 * Generates a YouTube thumbnail URL from a video ID
 * @param videoId - The YouTube video ID
 * @param quality - Thumbnail quality (default, medium, high, maxres)
 * @returns The thumbnail URL
 */
export function getYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Removes YouTube URLs from text and returns the cleaned text and found URLs
 * @param text - The original text
 * @returns Object with cleaned text and array of YouTube URLs
 */
export function extractYouTubeUrlsFromText(text: string): { cleanText: string; youtubeUrls: string[] } {
  const youtubeUrls = findYouTubeUrls(text);
  let cleanText = text;
  
  // Remove YouTube URLs from the text - use global replace to catch all occurrences
  youtubeUrls.forEach(url => {
    // Escape special regex characters in the URL and replace globally
    const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanText = cleanText.replace(new RegExp(escapedUrl, 'g'), '');
  });
  
  // Additional cleanup for any remaining URL fragments
  // Remove common URL patterns that might be left behind
  cleanText = cleanText
    .replace(/https?:\/\/[^\s]*/g, '')  // Remove any remaining URLs
    .replace(/www\.[^\s]*/g, '')  // Remove www fragments
    .replace(/youtube\.com[^\s]*/g, '')  // Remove youtube.com fragments
    .replace(/youtu\.be[^\s]*/g, '')  // Remove youtu.be fragments
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/^\s+|\s+$/g, '')  // Trim leading/trailing spaces
    .replace(/\n\s*\n/g, '\n')  // Remove empty lines
    .trim();
  
  return { cleanText, youtubeUrls };
}