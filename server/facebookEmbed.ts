import type { RequestHandler } from 'express';
import { facebookEmbedTarget, isFacebookShareUrl, parseFacebookUrl,
  type FacebookEmbedTarget } from '../shared/facebook';

const cache = new Map<string, { target: FacebookEmbedTarget | null; expires: number }>();
const pending = new Map<string, Promise<FacebookEmbedTarget | null>>();

function canonicalFromHtml(html: string): FacebookEmbedTarget | null {
  // Read public canonical URLs only. No remote HTML is rendered or returned.
  for (const tag of html.match(/<(?:meta|link)\b[^>]*>/gi) || []) {
    const attrs: Record<string, string> = {};
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)) {
      attrs[match[1].toLowerCase()] = match[3];
    }
    const value = attrs.property?.toLowerCase() === 'og:url' ? attrs.content :
      attrs.rel?.toLowerCase() === 'canonical' ? attrs.href : null;
    if (value) {
      const target = facebookEmbedTarget(value.replace(/&amp;/g, '&'));
      if (target) return target;
    }
  }
  return null;
}

async function resolveShare(input: string): Promise<FacebookEmbedTarget | null> {
  let current = parseFacebookUrl(input)!;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    for (let hop = 0; hop < 5; hop++) {
      const direct = facebookEmbedTarget(current.href);
      if (direct) return direct;
      // Login redirects sometimes contain the public permalink. Extract it
      // without logging in; the official plugin still enforces visibility.
      if (current.pathname.startsWith('/login')) {
        return facebookEmbedTarget(current.searchParams.get('next') || '');
      }
      const response = await fetch(current.href, {
        redirect: 'manual', signal: controller.signal, headers: { Accept: 'text/html' },
      });
      const location = response.headers.get('location');
      if ([301, 302, 303, 307, 308].includes(response.status) && location) {
        await response.body?.cancel();
        const next = parseFacebookUrl(new URL(location, current).href);
        if (!next) return null;
        current = next;
        continue;
      }
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        await response.body?.cancel();
        return null;
      }
      const reader = response.body?.getReader();
      if (!reader) return null;
      const decoder = new TextDecoder();
      let html = '';
      let bytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 131072) {
          await reader.cancel();
          return canonicalFromHtml(html);
        }
        html += decoder.decode(value, { stream: true });
      }
      return canonicalFromHtml(html + decoder.decode());
    }
    return facebookEmbedTarget(current.href);
  } finally {
    clearTimeout(timer);
  }
}

export const resolveFacebookEmbed: RequestHandler = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const input = req.body?.url;
  if (typeof input !== 'string' || input.length > 2048 || !isFacebookShareUrl(input)) {
    res.status(400).json({ message: 'A Facebook share link is required.' });
    return;
  }
  const key = parseFacebookUrl(input)!;
  key.search = '';
  key.hash = '';
  const cached = cache.get(key.href);
  if (cached && cached.expires > Date.now()) {
    res.json({ target: cached.target });
    return;
  }
  let work = pending.get(key.href);
  if (!work) {
    if (pending.size >= 20) {
      res.status(503).json({ message: 'Please try again shortly.' });
      return;
    }
    work = resolveShare(input).catch(() => null).then(target => {
      if (cache.size >= 1000) cache.delete(cache.keys().next().value!);
      cache.set(key.href, { target, expires: Date.now() + (target ? 3600000 : 60000) });
      return target;
    }).finally(() => pending.delete(key.href));
    pending.set(key.href, work);
  }
  res.json({ target: await work });
};
