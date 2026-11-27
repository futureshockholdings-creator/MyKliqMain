// Exact host checks are shared by the client and the redirect resolver.
const TIKTOK_HOSTS = new Set(['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com']);

export function parseTikTokUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !TIKTOK_HOSTS.has(url.hostname) ||
        url.username || url.password || url.port) return null;
    return url;
  } catch {
    return null;
  }
}

export function tikTokVideoId(value: string): string | null {
  const url = parseTikTokUrl(value);
  return url?.pathname.match(/^\/@[\w.-]+\/video\/(\d{10,25})\/?$/)?.[1] ?? null;
}

export function isTikTokShortLink(value: string): boolean {
  const url = parseTikTokUrl(value);
  if (!url) return false;
  return (['vm.tiktok.com', 'vt.tiktok.com'].includes(url.hostname) &&
    /^\/[\w-]+\/?$/.test(url.pathname)) ||
    /^\/t\/[\w-]+\/?$/.test(url.pathname);
}
