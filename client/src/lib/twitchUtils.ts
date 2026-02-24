export type TwitchContentType = 'stream' | 'clip' | 'video' | 'channel';

export interface TwitchUrl {
  url: string;
  contentType: TwitchContentType;
  identifier: string;
}

const twitchPatterns: { pattern: RegExp; type: TwitchContentType; extract: (match: RegExpMatchArray) => string }[] = [
  {
    pattern: /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/(\w+)\/clip\/([\w-]+)/,
    type: 'clip',
    extract: (m) => m[2],
  },
  {
    pattern: /(?:https?:\/\/)?clips\.twitch\.tv\/([\w-]+)/,
    type: 'clip',
    extract: (m) => m[1],
  },
  {
    pattern: /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/(\d+)/,
    type: 'video',
    extract: (m) => m[1],
  },
  {
    pattern: /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/(\w+)\/?(?:\?[^\s]*)?$/,
    type: 'stream',
    extract: (m) => m[1],
  },
];

export function detectTwitchUrl(url: string): TwitchUrl | null {
  if (!url) return null;

  for (const { pattern, type, extract } of twitchPatterns) {
    const match = url.match(pattern);
    if (match) {
      return { url, contentType: type, identifier: extract(match) };
    }
  }

  return null;
}

const combinedTwitchPattern = /https?:\/\/(?:www\.)?(?:twitch\.tv\/[^\s]+|clips\.twitch\.tv\/[^\s]+)/gi;

export function findTwitchUrls(text: string): string[] {
  if (!text) return [];
  return text.match(combinedTwitchPattern) || [];
}

export function getTwitchStreamThumbnail(username: string): string {
  return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${username.toLowerCase()}-640x360.jpg`;
}

export function getTwitchEmbedUrl(twitchUrl: TwitchUrl): string {
  const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  switch (twitchUrl.contentType) {
    case 'stream':
      return `https://player.twitch.tv/?channel=${twitchUrl.identifier}&parent=${parent}&muted=true`;
    case 'clip':
      return `https://clips.twitch.tv/embed?clip=${twitchUrl.identifier}&parent=${parent}`;
    case 'video':
      return `https://player.twitch.tv/?video=v${twitchUrl.identifier}&parent=${parent}&muted=true`;
    default:
      return twitchUrl.url;
  }
}

export function extractTwitchUrlsFromText(text: string): {
  cleanText: string;
  twitchUrls: TwitchUrl[];
} {
  const rawUrls = findTwitchUrls(text);
  const twitchUrls: TwitchUrl[] = [];
  let cleanText = text;

  for (const rawUrl of rawUrls) {
    const cleaned = rawUrl.replace(/[)}\]>,;]+$/, '');
    const detected = detectTwitchUrl(cleaned);
    if (detected) {
      twitchUrls.push(detected);
      const escapedUrl = cleaned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleanText = cleanText.replace(new RegExp(escapedUrl, 'g'), '');
    }
  }

  cleanText = cleanText
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return { cleanText, twitchUrls };
}
