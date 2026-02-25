const youtubePattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\//i;
const twitchPattern = /(?:https?:\/\/)?(?:www\.)?(?:twitch\.tv|clips\.twitch\.tv)\//i;
const instagramPattern = /(?:https?:\/\/)?(?:www\.)?instagram\.com\//i;
const facebookPattern = /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.watch)\//i;
const tiktokPattern = /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com)\//i;

const urlPattern = /https?:\/\/[^\s<>"')\]]+/gi;

function isAlreadyHandled(url: string): boolean {
  return (
    youtubePattern.test(url) ||
    twitchPattern.test(url) ||
    instagramPattern.test(url) ||
    facebookPattern.test(url) ||
    tiktokPattern.test(url)
  );
}

export function extractGenericUrls(text: string): string[] {
  if (!text) return [];

  const matches = text.match(urlPattern) || [];
  const generic: string[] = [];
  const seen = new Set<string>();

  for (const rawUrl of matches) {
    const cleaned = rawUrl.replace(/[)}\]>,;.!?]+$/, '');
    if (!isAlreadyHandled(cleaned) && !seen.has(cleaned)) {
      seen.add(cleaned);
      generic.push(cleaned);
    }
  }

  return generic;
}

export function extractGenericUrlsFromText(text: string): {
  cleanText: string;
  genericUrls: string[];
} {
  if (!text) return { cleanText: text, genericUrls: [] };

  const matches = text.match(urlPattern) || [];
  const genericUrls: string[] = [];
  const seen = new Set<string>();
  let cleanText = text;

  for (const rawUrl of matches) {
    const cleaned = rawUrl.replace(/[)}\]>,;.!?]+$/, '');
    if (!isAlreadyHandled(cleaned) && !seen.has(cleaned)) {
      seen.add(cleaned);
      genericUrls.push(cleaned);
      const escapedUrl = cleaned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleanText = cleanText.replace(new RegExp(escapedUrl, 'g'), '');
    }
  }

  cleanText = cleanText
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return { cleanText, genericUrls };
}
