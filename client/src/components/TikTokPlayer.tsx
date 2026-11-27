import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Play, RotateCcw } from 'lucide-react';
import { isTikTokShortLink, tikTokVideoId } from '@shared/tiktok';
import { apiRequest } from '@/lib/queryClient';
import { uiText, useUiLanguage } from '@/i18n/interfaceText';

interface Props {
  url: string;
  className?: string;
  autoPreview?: boolean;
}

// The parent keys this by URL so an edited link never retains the old player.
export function TikTokPlayer({ url, className = '', autoPreview = true }: Props) {
  useUiLanguage();
  const [phase, setPhase] = useState<'idle' | 'resolving' | 'loading' | 'ready' | 'error'>('idle');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const iframe = useRef<HTMLIFrameElement>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  const failed = phase === 'error';
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(false);
  const autoStarted = useRef(false);
  const dismissed = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current++;
      busy.current = false;
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    // On older browsers without IntersectionObserver retain manual loading,
    // rather than loading every player in the feed.
    if (!autoPreview || !element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.target === element);
      if (entry) setNearby(entry.isIntersecting);
    }, { rootMargin: '300px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [autoPreview]);

  useEffect(() => {
    if (!videoId || failed) return;
    let timer: ReturnType<typeof setTimeout>;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.tiktok.com' ||
          event.source !== iframe.current?.contentWindow ||
          !event.data || event.data['x-tiktok-player'] !== true) return;
      if (event.data.type === 'onPlayerReady') {
        clearTimeout(timer);
        setSlow(false);
        setPhase('ready');
      }
      if (['onError', 'onPlayerError'].includes(event.data.type)) {
        clearTimeout(timer);
        setPhase('error');
      }
    };
    window.addEventListener('message', onMessage);
    // A cross-origin iframe's load event alone does not prove it can play.
    // Allow manual playback/fallback even when ready messages are blocked.
    timer = setTimeout(() => setSlow(true), 15000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
    };
  }, [videoId, failed]);

  const loadPlayer = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    if (autoPreview) autoStarted.current = true;
    const requestGeneration = ++generation.current;
    setPhase('resolving');
    setSlow(false);
    setVideoId(null);
    try {
      let id = tikTokVideoId(url);
      if (!id && isTikTokShortLink(url)) {
        const result = await apiRequest('POST', '/api/tiktok/resolve', { url });
        // enterpriseApiRequest returns parsed JSON, not a fetch Response.
        id = typeof result?.videoId === 'string' && /^\d{10,25}$/.test(result.videoId)
          ? result.videoId : null;
      }
      if (!id) throw new Error('Video unavailable');
      if (mounted.current && requestGeneration === generation.current) {
        setVideoId(id);
        setPhase('loading');
      }
    } catch {
      if (mounted.current && requestGeneration === generation.current) setPhase('error');
    } finally {
      if (requestGeneration === generation.current) busy.current = false;
    }
  }, [url, autoPreview]);

  useEffect(() => {
    if (!autoPreview) return;
    if (nearby && !dismissed.current && !autoStarted.current) {
      void loadPlayer();
    } else if (!nearby && autoStarted.current) {
      // Unmount distant frames to stop playback and release their resources.
      // Ignore a short-link response that arrives after its card left view.
      generation.current++;
      busy.current = false;
      autoStarted.current = false;
      setVideoId(null);
      setPhase('idle');
      setSlow(false);
    }
  }, [autoPreview, nearby, loadPlayer]);

  return (
    <div ref={containerRef} className={`rounded-lg overflow-hidden bg-black text-white ${className}`}
      onClick={event => event.stopPropagation()}>
      <div className="flex items-center justify-between gap-3 p-3 border-b border-white/20">
        <span className="font-semibold text-sm">TikTok</span>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 underline text-sm py-2">
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
          {uiText('View on {{name}}', { name: 'TikTok' })}
        </a>
      </div>
      {videoId && phase !== 'error' ? (
        <div className="relative mx-auto w-full max-w-[400px]">
          {phase === 'loading' && (
            <p role="status" className="text-center text-sm p-2">
              {slow
                ? uiText('TikTok is taking longer to load. You can use View on TikTok instead.')
                : uiText('Loading...')}
            </p>
          )}
          <iframe ref={iframe} title="TikTok video"
            src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=0${autoPreview ? '&muted=1' : ''}&controls=1`}
            className="block w-full aspect-[9/16] border-0 bg-black"
            loading={autoPreview ? 'lazy' : undefined}
            allow={autoPreview
              ? "fullscreen; picture-in-picture; encrypted-media; autoplay 'none'"
              : 'fullscreen; picture-in-picture; encrypted-media'}
            allowFullScreen referrerPolicy="no-referrer"
            onError={() => setPhase('error')} />
          <button type="button" className="block mx-auto underline text-sm px-4 py-3"
            onClick={() => {
              dismissed.current = true;
              generation.current++;
              busy.current = false;
              setVideoId(null);
              setPhase('idle');
              setSlow(false);
            }}>
            {uiText('Close')}
          </button>
        </div>
      ) : (
        <div className={`flex flex-col justify-center items-center text-center gap-3 p-6 ${
          autoPreview ? 'mx-auto w-full max-w-[400px] aspect-[9/16]' : ''
        }`}>
          {phase === 'error' ? (
            <p role="status" className="text-sm">
              {uiText('This video could not be loaded here. You can still view it on TikTok.')}
            </p>
          ) : (
            <p className="text-sm text-white/80">
              {uiText('Load the TikTok player to watch here. This connects to TikTok.')}
            </p>
          )}
          <button type="button" onClick={loadPlayer} disabled={phase === 'resolving'}
            className="inline-flex items-center gap-2 rounded-lg bg-white/15 hover:bg-white/25 px-4 py-3 text-sm font-medium disabled:opacity-60">
            {phase === 'error'
              ? <RotateCcw className="w-5 h-5" aria-hidden="true" />
              : <Play className="w-5 h-5" aria-hidden="true" />}
            {phase === 'resolving' ? uiText('Loading...') :
              phase === 'error' ? uiText('Try again') : uiText('Load video')}
          </button>
        </div>
      )}
    </div>
  );
}
