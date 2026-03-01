import { useState, useEffect } from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { buildApiUrl } from '@/lib/apiConfig';

interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string;
  favicon: string | null;
  url: string;
}

const CACHE_TTL = 24 * 60 * 60 * 1000;
const sessionCache = new Map<string, LinkPreviewData | null>();

function getStoredPreview(url: string): LinkPreviewData | null {
  try {
    const raw = localStorage.getItem(`lp:${url}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(`lp:${url}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function storePreview(url: string, data: LinkPreviewData) {
  try {
    localStorage.setItem(`lp:${url}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Storage quota exceeded or unavailable — skip silently
  }
}

async function fetchPreview(url: string): Promise<LinkPreviewData | null> {
  const sessionHit = sessionCache.get(url);
  if (sessionHit !== undefined) return sessionHit;

  const stored = getStoredPreview(url);
  if (stored) {
    sessionCache.set(url, stored);
    return stored;
  }

  try {
    const res = await fetch(buildApiUrl(`/api/link-preview?url=${encodeURIComponent(url)}`));
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!data.siteName && !data.title && !data.description && !data.image) {
      return null;
    }
    sessionCache.set(url, data);
    storePreview(url, data);
    return data;
  } catch {
    return null;
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

interface LinkPreviewProps {
  url: string;
  className?: string;
}

export function LinkPreview({ url, className = "" }: LinkPreviewProps) {
  const cached = getStoredPreview(url) ?? sessionCache.get(url) ?? null;
  const sessionHit = sessionCache.has(url) ? sessionCache.get(url)! : null;
  const initial = cached ?? sessionHit;

  const [preview, setPreview] = useState<LinkPreviewData | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    setLoading(true);
    setImgError(false);
    setFaviconError(false);

    fetchPreview(url).then((data) => {
      if (!cancelled) {
        setPreview(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <div className={`rounded-lg border border-border bg-card overflow-hidden animate-pulse ${className}`}>
        <div className="flex">
          <div className="w-28 h-24 bg-muted shrink-0" />
          <div className="p-3 flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <a
        href={url.startsWith('http') ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 hover:border-primary/50 transition-colors no-underline ${className}`}
      >
        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground truncate">{getDomain(url)}</span>
        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 ml-auto" />
      </a>
    );
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors no-underline ${className}`}
    >
      <div className="flex">
        {preview.image && !imgError ? (
          <div className="w-28 sm:w-36 shrink-0 bg-muted">
            <img
              src={preview.image}
              alt=""
              className="w-full h-full object-cover min-h-[96px]"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          </div>
        ) : null}
        <div className="p-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {preview.favicon && !faviconError ? (
              <img
                src={preview.favicon}
                alt=""
                className="w-4 h-4 rounded-sm shrink-0"
                onError={() => setFaviconError(true)}
                loading="lazy"
              />
            ) : (
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-xs text-muted-foreground truncate">{preview.siteName}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 ml-auto" />
          </div>
          {preview.title && (
            <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">{preview.title}</p>
          )}
          {preview.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>
          )}
        </div>
      </div>
    </a>
  );
}

interface LinkPreviewListProps {
  urls: string[];
  className?: string;
}

export function LinkPreviewList({ urls, className = "" }: LinkPreviewListProps) {
  if (!urls || urls.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {urls.slice(0, 3).map((url) => (
        <LinkPreview key={url} url={url} className="max-w-2xl" />
      ))}
    </div>
  );
}
