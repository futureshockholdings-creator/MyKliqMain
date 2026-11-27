import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { enterpriseFetch } from '@/lib/enterprise/enterpriseFetch';
import type { TikTokPreview } from '@shared/tiktokPreview';

export function useTikTokPreview(url: string, enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(false);
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !enabled) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNearby(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNearby(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [url, enabled]);

  const query = useQuery({
    queryKey: ['tiktok-preview', url],
    enabled: nearby && enabled,
    queryFn: ({ signal }) => enterpriseFetch<{ preview: TikTokPreview | null }>('/api/tiktok/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal,
      skipCache: true,
      skipDisk: true,
      priority: 'low',
    }),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return { containerRef, preview: enabled ? query.data?.preview ?? null : null };
}
