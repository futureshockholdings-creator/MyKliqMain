import type { RequestHandler } from 'express';
import { isTikTokShortLink, parseTikTokUrl, tikTokVideoId } from '../shared/tiktok';

// Public video IDs only, not user credentials or page HTML. Bound both memory
// and external requests; shared link resolution runs only after a viewer taps.
const cache = new Map<string, { canonicalUrl: string | null; expires: number }>();
const inFlight = new Map<string, Promise<string | null>>();

async function resolveVideoUrl(input: string): Promise<string | null> {
  let current = parseTikTokUrl(input)!;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    for (let redirects = 0; redirects < 5; redirects++) {
      const id = tikTokVideoId(current.href);
      if (id) {
        current.search = '';
        current.hash = '';
        return current.href;
      }
      // Validate every hop before fetching: never follow an arbitrary Location.
      if (!parseTikTokUrl(current.href)) return null;
      const response = await fetch(current.href, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { Accept: 'text/html' },
      });
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (![301, 302, 303, 307, 308].includes(response.status) || !location) return null;
      const next = parseTikTokUrl(new URL(location, current).href);
      if (!next) return null;
      current = next;
    }
    if (!tikTokVideoId(current.href)) return null;
    current.search = '';
    current.hash = '';
    return current.href;
  } finally {
    clearTimeout(timeout);
  }
}

export async function cachedTikTokVideoUrl(input: string): Promise<string | null> {
  if (!tikTokVideoId(input) && !isTikTokShortLink(input)) return null;
  const key = new URL(input);
  key.search = '';
  key.hash = '';
  const cached = cache.get(key.href);
  if (cached && cached.expires > Date.now()) return cached.canonicalUrl;
  let pending = inFlight.get(key.href);
  if (!pending) {
    if (inFlight.size >= 20) throw new Error('TikTok resolver busy');
    pending = resolveVideoUrl(input).catch(() => null).then(canonicalUrl => {
      if (cache.size >= 1000) cache.delete(cache.keys().next().value!);
      cache.set(key.href, { canonicalUrl, expires: Date.now() + (canonicalUrl ? 86400000 : 60000) });
      return canonicalUrl;
    }).finally(() => inFlight.delete(key.href));
    inFlight.set(key.href, pending);
  }
  return pending;
}

export const resolveTikTokEmbed: RequestHandler = async (req, res) => {
  const input = req.body?.url;
  if (typeof input !== 'string' || input.length > 2048 ||
      (!tikTokVideoId(input) && !isTikTokShortLink(input))) {
    res.status(400).json({ message: 'A TikTok video or share link is required.' });
    return;
  }
  // POST bodies avoid adding shared-link query strings to request logs/caches.
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    const url = await cachedTikTokVideoUrl(input);
    res.json({ videoId: url ? tikTokVideoId(url) : null });
  } catch {
    res.status(502).json({ message: 'TikTok could not be reached.' });
  }
};
