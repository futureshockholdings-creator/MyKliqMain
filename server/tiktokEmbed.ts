import type { RequestHandler } from 'express';
import { isTikTokShortLink, parseTikTokUrl, tikTokVideoId } from '../shared/tiktok';

// Public video IDs only, not user credentials or page HTML. Bound both memory
// and external requests; shared link resolution runs only after a viewer taps.
const cache = new Map<string, { videoId: string | null; expires: number }>();
const inFlight = new Map<string, Promise<string | null>>();

async function resolveVideoId(input: string): Promise<string | null> {
  let current = parseTikTokUrl(input)!;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    for (let redirects = 0; redirects < 5; redirects++) {
      const id = tikTokVideoId(current.href);
      if (id) return id;
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
    return tikTokVideoId(current.href);
  } finally {
    clearTimeout(timeout);
  }
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
  const key = new URL(input);
  key.search = '';
  key.hash = '';
  const cached = cache.get(key.href);
  if (cached && cached.expires > Date.now()) {
    res.json({ videoId: cached.videoId });
    return;
  }
  try {
    let pending = inFlight.get(key.href);
    if (!pending) {
      if (inFlight.size >= 20) {
        res.status(503).json({ message: 'Please try again shortly.' });
        return;
      }
      pending = resolveVideoId(input).catch(() => null).then(videoId => {
        if (cache.size >= 1000) cache.delete(cache.keys().next().value!);
        cache.set(key.href, { videoId, expires: Date.now() + (videoId ? 86400000 : 60000) });
        return videoId;
      }).finally(() => inFlight.delete(key.href));
      inFlight.set(key.href, pending);
    }
    res.json({ videoId: await pending });
  } catch {
    res.status(502).json({ message: 'TikTok could not be reached.' });
  }
};
