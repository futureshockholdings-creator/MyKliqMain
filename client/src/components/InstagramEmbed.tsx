import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Play, RotateCcw } from 'lucide-react';
import { SiInstagram } from 'react-icons/si';
import { instagramEmbedTarget } from '@shared/instagram';
import { uiText, useUiLanguage } from '@/i18n/interfaceText';

/** Instagram owns the content and controls; no scraping or media rehosting. */
export function InstagramEmbed({ url, className = '' }: { url: string; className?: string }) {
  useUiLanguage();
  const target = instagramEmbedTarget(url);
  const container = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const dismissed = useRef(false);
  const [nearby, setNearby] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [attempt, setAttempt] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.target === element);
      if (entry) setNearby(entry.isIntersecting);
    }, { rootMargin: '300px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (nearby && !started.current && !dismissed.current) {
      started.current = true;
      setPhase('loading');
      setSlow(false);
    } else if (!nearby && started.current) {
      started.current = false;
      setPhase('idle');
      setSlow(false);
    }
  }, [nearby]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(timer);
  }, [phase, attempt]);

  if (!target) return null;
  const active = phase === 'loading' || phase === 'loaded';
  return (
    <div ref={container}
      className={`min-w-0 overflow-hidden rounded-lg border border-pink-500/30 bg-white text-black ${className}`}
      onClick={event => event.stopPropagation()}>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-3 text-white">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <SiInstagram className="h-6 w-6 shrink-0" aria-hidden="true" />
          Instagram
        </span>
        <a href={target.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 py-2 text-sm underline">
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          {uiText('View on {{name}}', { name: 'Instagram' })}
        </a>
      </div>
      {active ? (
        <>
          {phase === 'loading' && <p role="status" className="p-2 text-center text-sm">
            {slow
              ? uiText('Instagram is taking longer to load. You can use View on Instagram instead.')
              : uiText('Loading...')}
          </p>}
          <iframe key={`${target.url}-${attempt}`} title={uiText('Instagram post')}
            src={`${target.url}embed/`} width="100%" height={target.reel ? 780 : 700}
            className="block w-full border-0" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
            allow="fullscreen; picture-in-picture; encrypted-media; autoplay 'none'"
            allowFullScreen
            onLoad={() => { setPhase('loaded'); setSlow(false); }}
            onError={() => { setPhase('error'); setSlow(false); }} />
          <p className="px-3 pt-2 text-center text-xs text-gray-600">
            {uiText('If this content is unavailable here, use View on Instagram.')}
          </p>
          <button type="button" className="mx-auto block px-4 py-3 text-sm underline"
            onClick={() => {
              dismissed.current = true;
              setPhase('idle');
              setSlow(false);
            }}>{uiText('Close')}</button>
        </>
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm" role={phase === 'error' ? 'status' : undefined}>
            {phase === 'error'
              ? uiText('This content could not be loaded here. You can still view it on Instagram.')
              : uiText('Instagram content loads here. This connects to Instagram.')}
          </p>
          <button type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-3 text-sm font-medium text-white"
            onClick={() => {
              started.current = true;
              setSlow(false);
              setAttempt(value => value + 1);
              setPhase('loading');
            }}>
            {phase === 'error'
              ? <RotateCcw className="h-5 w-5" aria-hidden="true" />
              : <Play className="h-5 w-5" aria-hidden="true" />}
            {phase === 'error' ? uiText('Try again') : uiText('Load Instagram post')}
          </button>
        </div>
      )}
    </div>
  );
}
