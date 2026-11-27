import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Play, RotateCcw } from 'lucide-react';
import { isTikTokShortLink, tikTokVideoId } from '@shared/tiktok';
import { apiRequest } from '@/lib/queryClient';
import { uiText, useUiLanguage } from '@/i18n/interfaceText';
import { useTikTokPreview } from '@/hooks/useTikTokPreview';

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
  const { containerRef, preview } = useTikTokPreview(url, autoPreview);
  const [imageFailed, setImageFailed] = useState(false);
  const showThumbnail = !!preview?.thumbnailUrl && !imageFailed;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

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

  async function loadPlayer() {
    if (busy.current) return;
    busy.current = true;
    setPhase('resolving');
    setSlow(false);
    setVideoId(null);
    try {
      let id = tikTokVideoId(url) || preview?.videoId;
      if (!id && isTikTokShortLink(url)) {
        const result = await apiRequest('POST', '/api/tiktok/resolve', { url });
        // enterpriseApiRequest returns parsed JSON, not a fetch Response.
        id = typeof result?.videoId === 'string' && /^\d{10,25}$/.test(result.videoId)
          ? result.videoId : null;
      }
      if (!id) throw new Error('Video unavailable');
      if (mounted.current) {
        setVideoId(id);
        setPhase('loading');
      }
    } catch {
      if (mounted.current) setPhase('error');
    } finally {
      busy.current = false;
    }
  }

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
            src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=0&controls=1`}
            className="block w-full aspect-[9/16] border-0 bg-black"
            allow="fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen referrerPolicy="no-referrer"
            onError={() => setPhase('error')} />
          <button type="button" className="block mx-auto underline text-sm px-4 py-3"
            onClick={() => { setVideoId(null); setPhase('idle'); }}>
            {uiText('Close')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-3 p-6">
          {showThumbnail && (
            <button type="button" onClick={loadPlayer} disabled={phase === 'resolving'}
              aria-label={uiText('Load video')}
              className="relative block w-full max-w-[400px] overflow-hidden rounded-lg bg-black disabled:opacity-60">
              <img src={preview!.thumbnailUrl!} alt={preview?.title || uiText('TikTok video preview')}
                loading="lazy" referrerPolicy="no-referrer"
                className="block w-full max-h-[420px] object-contain"
                onError={() => setImageFailed(true)} />
              <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-white">
                  <Play className="w-8 h-8" />
                </span>
              </span>
            </button>
          )}
          {(preview?.title || preview?.authorName) && (
            <div className="w-full min-w-0 text-left">
              {preview.title && <p className="text-sm font-medium line-clamp-2 break-words">{preview.title}</p>}
              {preview.authorName && <p className="mt-1 text-xs text-white/70 break-words">{preview.authorName}</p>}
            </div>
          )}
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
