/** Only canonical public media links become frames; never embed arbitrary URLs. */
export function instagramEmbedTarget(value: string): { url: string; reel: boolean } | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' ||
        !['instagram.com', 'www.instagram.com', 'm.instagram.com'].includes(url.hostname) ||
        url.username || url.password || url.port) return null;
    const match = url.pathname.match(/^\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)\/?$/);
    if (!match) return null;
    const kind = match[1] === 'reels' ? 'reel' : match[1];
    return {
      url: `https://www.instagram.com/${kind}/${match[2]}/`,
      reel: kind === 'reel' || kind === 'tv',
    };
  } catch {
    return null;
  }
}
