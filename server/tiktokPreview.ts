import type { RequestHandler } from 'express';
import { isTikTokShortLink, tikTokVideoId } from '../shared/tiktok';
import type { TikTokPreview } from '../shared/tiktokPreview';
import { cachedTikTokVideoUrl } from './tiktokEmbed';

const cache = new Map<string, { preview: TikTokPreview | null; expires: number }>();
const pending = new Map<string, Promise<TikTokPreview | null>>();

function safeThumbnail(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 8192) return null;
  try {
    const url = new URL(value);
    const allowed = ['tiktokcdn.com', 'tiktokcdn-us.com', 'tiktok.com',
      'byteoversea.com', 'ibytedtos.com', 'byteimg.com', 'muscdn.com'];
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      allowed.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))
      ? url.href : null;
  } catch {
    return null;
  }
}

async function fetchPreview(input: string): Promise<TikTokPreview | null> {
  const canonical = await cachedTikTokVideoUrl(input);
  const videoId = canonical ? tikTokVideoId(canonical) : null;
  if (!canonical || !videoId) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    // Only request TikTok's fixed public metadata endpoint. Never execute or
    // return its embed HTML, or forward member text, tokens or cookies.
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(canonical)}`, {
      redirect: 'error',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
      await response.body?.cancel();
      return null;
    }
    const reader = response.body?.getReader();
    if (!reader) return null;
    const decoder = new TextDecoder();
    let text = '';
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 131072) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const data = JSON.parse(text);
    return {
      videoId,
      title: typeof data.title === 'string' ? data.title.slice(0, 500) : '',
      authorName: typeof data.author_name === 'string' ? data.author_name.slice(0, 120) : '',
      thumbnailUrl: safeThumbnail(data.thumbnail_url),
    };
  } finally {
    clearTimeout(timer);
  }
}

export const getTikTokPreview: RequestHandler = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const input = req.body?.url;
  if (typeof input !== 'string' || input.length > 2048 ||
      (!tikTokVideoId(input) && !isTikTokShortLink(input))) {
    res.status(400).json({ message: 'A TikTok video or share link is required.' });
    return;
  }
  const key = new URL(input);
  key.search = '';
  key.hash = '';
  // Full links sharing a video ID share metadata even with different handles.
  const cacheKey = tikTokVideoId(input) || key.href;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    res.json({ preview: cached.preview });
    return;
  }
  if (!pending.has(cacheKey) && pending.size >= 20) {
    res.status(503).json({ message: 'Preview service is busy. Posting is still available.' });
    return;
  }
  let work = pending.get(cacheKey);
  if (!work) {
    work = fetchPreview(input).catch(() => null).then(preview => {
      if (cache.size >= 1000) cache.delete(cache.keys().next().value!);
      cache.set(cacheKey, { preview, expires: Date.now() + (preview ? 3600000 : 120000) });
      return preview;
    }).finally(() => pending.delete(cacheKey));
    pending.set(cacheKey, work);
  }
  res.json({ preview: await work });
};
