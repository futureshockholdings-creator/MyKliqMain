const FACEBOOK_HOSTS = new Set([
  'facebook.com', 'www.facebook.com', 'm.facebook.com',
  'mbasic.facebook.com', 'web.facebook.com', 'fb.watch', 'www.fb.watch',
]);

export interface FacebookEmbedTarget {
  url: string;
  kind: 'video' | 'post';
  portrait: boolean;
}

export function parseFacebookUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !FACEBOOK_HOSTS.has(url.hostname) ||
        url.username || url.password || url.port) return null;
    return url;
  } catch {
    return null;
  }
}

export function isFacebookShareUrl(value: string): boolean {
  const url = parseFacebookUrl(value);
  if (!url) return false;
  return ((url.hostname === 'fb.watch' || url.hostname === 'www.fb.watch') &&
    /^\/[\w-]+\/?$/.test(url.pathname)) ||
    /^\/share\/(?:(?:v|r|p)\/)?[\w-]+\/?$/.test(url.pathname);
}

export function facebookEmbedTarget(value: string): FacebookEmbedTarget | null {
  const url = parseFacebookUrl(value);
  if (!url || url.hostname.endsWith('fb.watch')) return null;
  const path = url.pathname;
  const result = new URL(`https://www.facebook.com${path}`);
  const videoId = url.searchParams.get('v');
  const photoId = url.searchParams.get('fbid');
  const storyId = url.searchParams.get('story_fbid');
  if (/^\/(?:watch\/?|video\.php)$/.test(path) && videoId && /^\d+$/.test(videoId)) {
    result.pathname = '/watch/';
    result.searchParams.set('v', videoId);
    return { url: result.href, kind: 'video', portrait: false };
  }
  if (/^\/(?:[\w.-]+\/)?videos\/(?:[\w.-]+\/)?\d+\/?$/.test(path)) {
    return { url: result.href, kind: 'video', portrait: false };
  }
  if (/^\/reels?\/\d+\/?$/.test(path)) {
    return { url: result.href, kind: 'video', portrait: true };
  }
  if (/^\/[\w.-]+\/posts\/[\w.-]+\/?$/.test(path) ||
      /^\/[\w.-]+\/photos\/(?:[\w.-]+\/)?\d+\/?$/.test(path)) {
    return { url: result.href, kind: 'post', portrait: false };
  }
  if (/^\/(?:permalink|story)\.php$/.test(path) && storyId && /^[\w.-]+$/.test(storyId)) {
    result.searchParams.set('story_fbid', storyId);
    const owner = url.searchParams.get('id');
    if (owner && /^\d+$/.test(owner)) result.searchParams.set('id', owner);
    return { url: result.href, kind: 'post', portrait: false };
  }
  if (/^\/photo(?:\.php|\/?)$/.test(path) && photoId && /^\d+$/.test(photoId)) {
    result.searchParams.set('fbid', photoId);
    return { url: result.href, kind: 'post', portrait: false };
  }
  return null;
}
