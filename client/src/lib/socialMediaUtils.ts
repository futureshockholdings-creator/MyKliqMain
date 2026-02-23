export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok';

export interface SocialMediaUrl {
  platform: SocialPlatform;
  url: string;
  contentType: string;
}

const platformPatterns: Record<SocialPlatform, RegExp[]> = {
  instagram: [
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reel\/[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reels\/[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/stories\/[\w.-]+\/\d+/,
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/tv\/[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[\w.-]+\/?(?:\?[^\s]*)?/,
  ],
  facebook: [
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:watch\/?\?v=\d+|[\w.-]+\/videos\/\d+)/,
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/reel\/\d+/,
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/share\/[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[\w.-]+\/posts\/[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/photo(?:\.php\?fbid=\d+|\/?\?fbid=\d+)/,
    /(?:https?:\/\/)?fb\.watch\/[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[\w.-]+\/?(?:\?[^\s]*)?/,
  ],
  tiktok: [
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/photo\/\d+/,
    /(?:https?:\/\/)?vm\.tiktok\.com\/[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/t\/[\w-]+/,
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/?(?:\?[^\s]*)?/,
  ],
};

const contentTypeDetectors: Record<SocialPlatform, (url: string) => string> = {
  instagram: (url: string) => {
    if (/\/reel(s)?\//.test(url)) return 'Reel';
    if (/\/stories\//.test(url)) return 'Story';
    if (/\/tv\//.test(url)) return 'IGTV';
    if (/\/p\//.test(url)) return 'Post';
    return 'Profile';
  },
  facebook: (url: string) => {
    if (/\/videos\/|watch/.test(url) || /fb\.watch/.test(url)) return 'Video';
    if (/\/reel\//.test(url)) return 'Reel';
    if (/\/photo/.test(url)) return 'Photo';
    if (/\/posts\//.test(url)) return 'Post';
    if (/\/share\//.test(url)) return 'Post';
    return 'Link';
  },
  tiktok: (url: string) => {
    if (/\/video\//.test(url)) return 'Video';
    if (/\/photo\//.test(url)) return 'Photo';
    if (/vm\.tiktok\.com|\/t\//.test(url)) return 'Video';
    return 'Profile';
  },
};

export function detectSocialPlatform(url: string): SocialMediaUrl | null {
  if (!url) return null;

  for (const [platform, patterns] of Object.entries(platformPatterns) as [SocialPlatform, RegExp[]][]) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return {
          platform,
          url,
          contentType: contentTypeDetectors[platform](url),
        };
      }
    }
  }

  return null;
}

const combinedPattern = new RegExp(
  'https?:\\/\\/(?:www\\.)?(?:' +
    'instagram\\.com\\/[^\\s]+|' +
    'facebook\\.com\\/[^\\s]+|' +
    'fb\\.watch\\/[^\\s]+|' +
    'tiktok\\.com\\/[^\\s]+|' +
    'vm\\.tiktok\\.com\\/[^\\s]+' +
  ')',
  'gi'
);

export function findSocialMediaUrls(text: string): SocialMediaUrl[] {
  if (!text) return [];

  const matches = text.match(combinedPattern) || [];
  const results: SocialMediaUrl[] = [];

  for (const match of matches) {
    const cleaned = match.replace(/[)}\]>,;]+$/, '');
    const detected = detectSocialPlatform(cleaned);
    if (detected) {
      results.push(detected);
    }
  }

  return results;
}

export function extractSocialMediaUrlsFromText(text: string): {
  cleanText: string;
  socialUrls: SocialMediaUrl[];
} {
  const socialUrls = findSocialMediaUrls(text);
  let cleanText = text;

  socialUrls.forEach(({ url }) => {
    const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanText = cleanText.replace(new RegExp(escapedUrl, 'g'), '');
  });

  cleanText = cleanText
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return { cleanText, socialUrls };
}
