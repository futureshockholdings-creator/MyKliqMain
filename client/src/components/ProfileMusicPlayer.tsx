import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Music, ExternalLink, AlertTriangle, SkipForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Extend Window to hold the YT IFrame API globals
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface ProfileMusicPlayerProps {
  musicUrls: string[];
  musicTitles: string[];
  autoPlay?: boolean;
}

// ---------------------------------------------------------------------------
// YouTube sub-component — uses IFrame Player API so we have JS control.
// Strategy for iOS Safari (which blocks iframe autoplay):
//   1. Start the player with mute:1 — iOS allows muted autoplay.
//   2. Call player.unMute() inside onReady while the audio session is already
//      active. iOS 15+ honours this because the session was opened by the
//      muted playback, so no extra gesture is needed.
//   3. If the device still blocks unmute, a 🔊 button lets the user tap once.
// ---------------------------------------------------------------------------
interface YTPlayerProps {
  videoId: string;
  title: string;
  onExternalOpen: () => void;
  showNext: boolean;
  onNext: () => void;
  trackLabel: string;
}

function YouTubeMusicPlayer({ videoId, title, onExternalOpen, showNext, onNext, trackLabel }: YTPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef    = useRef<any>(null);
  const [muted, setMuted]     = useState(true);   // optimistic — clears in onReady
  const [ready, setReady]     = useState(false);

  const destroyPlayer = useCallback(() => {
    try { playerRef.current?.destroy(); } catch (_) {}
    playerRef.current = null;
  }, []);

  const createPlayer = useCallback(() => {
    if (!containerRef.current || !window.YT?.Player) return;

    destroyPlayer();

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      width:  "100%",
      height: "300",
      playerVars: {
        autoplay:      1,
        mute:          1,   // start muted so iOS allows autoplay
        loop:          1,
        playlist:      videoId,
        rel:           0,
        modestbranding: 1,
        playsinline:   1,   // critical for iOS — prevents fullscreen takeover
      },
      events: {
        onReady: (event: any) => {
          setReady(true);
          // Attempt unmute while the audio session is already open.
          // On iOS 15+ PWA this typically succeeds because muted playback
          // already activated the WebKit audio context.
          try {
            event.target.unMute();
            event.target.setVolume(70);
            setMuted(false);
          } catch (_) {
            // Older iOS — user will tap the 🔊 button
          }
        },
        onError: () => {
          // Silently ignore YT player errors (unavailable video, region block, etc.)
        },
      },
    });
  }, [videoId, destroyPlayer]);

  // Load the YT IFrame API script once per page, then create the player
  useEffect(() => {
    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      createPlayer();
    };

    if (window.YT?.Player) {
      init();
    } else {
      // Chain onto any existing callback so multiple players on one page don't clash
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        init();
      };

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      destroyPlayer();
    };
  }, [videoId, createPlayer, destroyPlayer]);

  const handleUnmute = () => {
    try {
      playerRef.current?.unMute();
      playerRef.current?.setVolume(70);
      setMuted(false);
    } catch (_) {}
  };

  return (
    <div className="bg-card border-border rounded-lg p-4 border">
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-5 h-5 text-primary" />
          <span className="text-primary font-medium flex-1 truncate">{title}</span>
          {trackLabel && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
              {trackLabel}
            </span>
          )}
          {ready && muted && (
            <Button variant="ghost" size="sm" onClick={handleUnmute}
              className="text-amber-500 hover:text-amber-400" title="Tap to unmute">
              <VolumeX className="w-4 h-4" />
            </Button>
          )}
          {showNext && (
            <Button variant="ghost" size="sm" onClick={onNext}
              className="text-primary hover:text-primary/80" title="Next track">
              <SkipForward className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onExternalOpen}
            className="text-muted-foreground hover:text-foreground" title="Open on YouTube">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {/* IFrame API replaces this div with the actual iframe */}
        <div ref={containerRef}
          style={{ background: "linear-gradient(45deg,#1a1a1a,#2a2a2a)", minHeight: 300, borderRadius: 8 }}
        />

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>YouTube Music Player</span>
          <span className="bg-primary/20 px-2 py-1 rounded text-primary">YOUTUBE</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ProfileMusicPlayer({ musicUrls, musicTitles, autoPlay = true }: ProfileMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying,       setIsPlaying]       = useState(false);
  const [isMuted,         setIsMuted]         = useState(false);
  const [volume,          setVolume]          = useState(0.7);
  const [currentTime,     setCurrentTime]     = useState(0);
  const [duration,        setDuration]        = useState(0);
  const [hasError,        setHasError]        = useState(false);
  const [isYouTubeUrl,    setIsYouTubeUrl]    = useState(false);
  const [blockedByPolicy, setBlockedByPolicy] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() =>
    musicUrls.length > 0 ? Math.floor(Math.random() * musicUrls.length) : 0
  );

  const currentMusicUrl   = musicUrls[currentTrackIndex]  || "";
  const currentMusicTitle = musicTitles[currentTrackIndex] || "Unknown Track";

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match?.[1] || null;
  };

  const selectRandomTrack = () => {
    if (musicUrls.length <= 1) return;
    let newIndex;
    do { newIndex = Math.floor(Math.random() * musicUrls.length); }
    while (newIndex === currentTrackIndex);
    setCurrentTrackIndex(newIndex);
  };

  useEffect(() => {
    setBlockedByPolicy(false);
    const isYT = currentMusicUrl.includes("youtube.com") || currentMusicUrl.includes("youtu.be");
    setIsYouTubeUrl(isYT);
    setHasError(false);

    const audio = audioRef.current;
    if (!audio || isYT || !currentMusicUrl) return;

    const updateTime     = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleError    = () => { setHasError(true); setIsPlaying(false); };
    const handleEnded    = () => {
      if (musicUrls.length > 1) {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * musicUrls.length); }
        while (newIndex === currentTrackIndex);
        setCurrentTrackIndex(newIndex);
      }
    };

    audio.addEventListener("timeupdate",     updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended",          handleEnded);
    audio.addEventListener("error",          handleError);
    audio.loop = false;

    if (autoPlay) {
      audio.play()
        .then(() => { setIsPlaying(true); setBlockedByPolicy(false); })
        .catch(() => { setIsPlaying(false); setBlockedByPolicy(true); });
    }

    return () => {
      audio.removeEventListener("timeupdate",     updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended",          handleEnded);
      audio.removeEventListener("error",          handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMusicUrl, autoPlay]);

  useEffect(() => {
    if (isYouTubeUrl || !currentMusicUrl) return;
    const audio = audioRef.current;
    if (audio && isPlaying) audio.play().catch(() => setIsPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex]);

  const togglePlay = () => {
    if (isYouTubeUrl) return;
    const audio = audioRef.current;
    if (!audio || hasError) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => { setIsPlaying(true); setBlockedByPolicy(false); })
        .catch((err) => { console.warn("[MusicPlayer] play() rejected:", err?.name, err?.message); });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const v = value[0];
    setVolume(v);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = v;
      if (v > 0 && isMuted) { audio.muted = false; setIsMuted(false); }
    }
  };

  const handleSeek = (value: number[]) => {
    const t = value[0];
    setCurrentTime(t);
    const audio = audioRef.current;
    if (audio) audio.currentTime = t;
  };

  const formatTime = (t: number) => {
    if (isNaN(t)) return "0:00";
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  };

  const openExternalUrl = () => window.open(currentMusicUrl, "_blank", "noopener,noreferrer");

  if (!musicUrls.length || !currentMusicUrl) {
    return (
      <div className="bg-card border-border rounded-lg p-4 border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Music className="w-5 h-5" />
          <span className="text-sm">No music URLs configured</span>
        </div>
      </div>
    );
  }

  // YouTube — hand off to the dedicated IFrame API sub-component
  if (isYouTubeUrl) {
    const videoId = getYouTubeVideoId(currentMusicUrl);
    if (!videoId) {
      return (
        <div className="bg-card border-border rounded-lg p-4 border">
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <AlertDescription className="text-destructive text-sm">
              <div className="font-medium mb-1">Invalid YouTube URL</div>
              <p>Cannot extract video ID from this URL. Please check the link.</p>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return (
      <YouTubeMusicPlayer
        key={videoId}
        videoId={videoId}
        title={currentMusicTitle}
        onExternalOpen={openExternalUrl}
        showNext={musicUrls.length > 1}
        onNext={selectRandomTrack}
        trackLabel={musicUrls.length > 1 ? `${currentTrackIndex + 1}/${musicUrls.length}` : ""}
      />
    );
  }

  if (hasError) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive">
            <Music className="w-4 h-4" />
            <span className="text-sm">Unable to load audio file</span>
          </div>
          <Button variant="ghost" size="sm" onClick={openExternalUrl}
            className="text-muted-foreground hover:text-foreground">
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-xs text-destructive/80 mt-1">
          Try opening the link directly or check if the URL is accessible.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border-border rounded-lg p-4 border">
      <audio
        ref={audioRef}
        src={currentMusicUrl}
        preload="auto"
        playsInline
        onError={() => { setIsPlaying(false); setHasError(true); }}
        onCanPlay={() => setHasError(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-3 mb-3">
        <Music className="w-5 h-5 text-primary" />
        <span className="text-primary font-medium flex-1 truncate">{currentMusicTitle}</span>
        {musicUrls.length > 1 && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
            {currentTrackIndex + 1}/{musicUrls.length}
          </span>
        )}
      </div>

      {blockedByPolicy && !isPlaying && (
        <p className="text-xs text-muted-foreground mb-2 text-center animate-pulse">
          Tap ▶ to start playing
        </p>
      )}

      <div className="mb-3">
        <Slider value={[currentTime]} max={duration || 100} step={1}
          onValueChange={handleSeek} className="w-full" data-testid="slider-progress" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={togglePlay}
          className="text-primary hover:text-primary/80" data-testid="button-play-pause">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        {musicUrls.length > 1 && (
          <Button variant="ghost" size="sm" onClick={selectRandomTrack}
            className="text-primary hover:text-primary/80" title="Next random track"
            data-testid="button-next-track">
            <SkipForward className="w-4 h-4" />
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={toggleMute}
          className="text-primary hover:text-primary/80" data-testid="button-mute">
          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>

        <div className="flex-1 mx-2">
          <Slider value={[volume]} max={1} step={0.1}
            onValueChange={handleVolumeChange} className="w-full" data-testid="slider-volume" />
        </div>
      </div>
    </div>
  );
}
