import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Play, RotateCcw } from 'lucide-react';
import { SiFacebook } from 'react-icons/si';
import { facebookEmbedTarget, type FacebookEmbedTarget } from '@shared/facebook';
import { apiRequest } from '@/lib/queryClient';
import { uiText, useUiLanguage } from '@/i18n/interfaceText';

export function FacebookEmbed({ url, className = '' }: { url: string; className?: string }) {
  useUiLanguage();
  const container = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(false);
  const [width, setWidth] = useState(350);
  const [target, setTarget] = useState<FacebookEmbedTarget | null>(null);
  const [phase, setPhase] = useState<'idle' | 'resolving' | 'loading' | 'loaded' | 'error'>('idle');
  const [slow, setSlow] = useState(false);
  const started = useRef(false);
  const dismissed = useRef(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const generation = useRef(0);

  useEffect(() => {
    mounted.current = true;
    const element = container.current;
    if (!element) return;
    const measure = () => setWidth(Math.max(220, Math.min(750, Math.round(element.clientWidth))));
    measure();
    const size = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    size?.observe(element);
    const visibility = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(entries => {
        const entry = entries.find(item => item.target === element);
        if (entry) setNearby(entry.isIntersecting);
      }, { rootMargin: '300px' }) : null;
    visibility?.observe(element);
    return () => {
      mounted.current = false;
      generation.current++;
      busy.current = false;
      started.current = false;
      size?.disconnect();
      visibility?.disconnect();
    };
  }, []);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    started.current = true;
    const request = ++generation.current;
    setSlow(false);
    setPhase('resolving');
    try {
      let resolved = facebookEmbedTarget(url);
      if (!resolved) {
        const result = await apiRequest('POST', '/api/facebook/resolve', { url });
        // Revalidate server results before placing a URL in the official plugin.
        resolved = typeof result?.target?.url === 'string'
          ? facebookEmbedTarget(result.target.url) : null;
      }
      if (!resolved) throw new Error('Embed unavailable');
      if (mounted.current && request === generation.current) {
        setTarget(resolved);
        setPhase('loading');
      }
    } catch {
      if (mounted.current && request === generation.current) {
        setTarget(null);
        setPhase('error');
      }
    } finally {
      if (request === generation.current) busy.current = false;
    }
  }, [url]);

  useEffect(() => {
    if (nearby && !started.current && !dismissed.current) void load();
    else if (!nearby && started.current) {
      generation.current++;
      busy.current = false;
      started.current = false;
      setTarget(null);
      setPhase('idle');
      setSlow(false);
    }
  }, [nearby, load]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(timer);
  }, [phase, target]);

  const portrait = target?.portrait || /\/(?:reels?|share\/r)\//.test(url);
  const video = target?.kind === 'video';
  const height = target?.kind === 'post' ? 680 :
    Math.round(portrait ? width * 16 / 9 : width * 9 / 16);
  const plugin = new URL(`https://www.facebook.com/plugins/${video ? 'video' : 'post'}.php`);
  if (target) plugin.searchParams.set('href', target.url);
  plugin.searchParams.set('width', String(width));
  plugin.searchParams.set('height', String(height));
  plugin.searchParams.set('show_text', video ? 'false' : 'true');
  plugin.searchParams.set('autoplay', 'false');
  plugin.searchParams.set('allowfullscreen', 'true');

  return (
    <div ref={container} className={`min-w-0 overflow-hidden rounded-lg border border-[#1877F2]/30 bg-white text-black ${className}`}
      onClick={event => event.stopPropagation()}>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1877F2] p-3 text-white">
        <span className="inline-flex items-center gap-2 font-semibold text-sm">
          <SiFacebook className="h-6 w-6 shrink-0" aria-hidden="true" />
          Facebook
        </span>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 py-2 text-sm underline">
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          {uiText('View on {{name}}', { name: 'Facebook' })}
        </a>
      </div>
      {target && phase !== 'error' ? (
        <>
          {phase === 'loading' && <p role="status" className="p-2 text-center text-sm">
            {slow ? uiText('Facebook is taking longer to load. You can use View on Facebook instead.') : uiText('Loading...')}
          </p>}
          <iframe key={target.url} title={uiText('Facebook post')}
            src={plugin.href} width={width} height={height}
            className="block w-full border-0" style={{ height }}
            loading="lazy" referrerPolicy="no-referrer"
            allow="fullscreen; picture-in-picture; encrypted-media; autoplay 'none'"
            allowFullScreen
            onLoad={() => { setPhase('loaded'); setSlow(false); }}
            onError={() => { setTarget(null); setPhase('error'); }} />
          <p className="px-3 pt-2 text-center text-xs text-gray-600">
            {uiText('If this content is unavailable here, use View on Facebook.')}
          </p>
          <button type="button" className="mx-auto block px-4 py-3 text-sm underline"
            onClick={() => {
              dismissed.current = true;
              generation.current++;
              busy.current = false;
              setTarget(null);
              setPhase('idle');
              setSlow(false);
            }}>{uiText('Close')}</button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center"
          style={{ minHeight: portrait ? width * 16 / 9 : 220 }}>
          <p className="text-sm" role={phase === 'error' ? 'status' : undefined}>
            {phase === 'error'
              ? uiText('This content could not be loaded here. You can still view it on Facebook.')
              : uiText('Facebook content loads here. This connects to Facebook.')}
          </p>
          <button type="button" disabled={phase === 'resolving'} onClick={load}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1877F2] px-4 py-3 text-sm font-medium text-white disabled:opacity-60">
            {phase === 'error' ? <RotateCcw className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
            {phase === 'resolving' ? uiText('Loading...') : phase === 'error' ? uiText('Try again') : uiText('Load Facebook post')}
          </button>
        </div>
      )}
    </div>
  );
}
