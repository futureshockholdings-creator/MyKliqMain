import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Music, ExternalLink, AlertTriangle, SkipForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileMusicPlayerProps {
  musicUrls: string[];
  musicTitles: string[];
  autoPlay?: boolean;
}

export function ProfileMusicPlayer({ musicUrls, musicTitles, autoPlay = true }: ProfileMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  // Stored so we can remove exactly the listener we added
  const unlockFnRef = useRef<(() => void) | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isYouTubeUrl, setIsYouTubeUrl] = useState(false);
  const [waitingForTouch, setWaitingForTouch] = useState(false); // tracks state only; no UI shown
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() =>
    musicUrls.length > 0 ? Math.floor(Math.random() * musicUrls.length) : 0
  );

  const currentMusicUrl = musicUrls[currentTrackIndex] || '';
  const currentMusicTitle = musicTitles[currentTrackIndex] || 'Unknown Track';

  // Remove document-level unlock listeners (called on success, track change, unmount)
  const removeUnlockListeners = () => {
    if (unlockFnRef.current) {
      document.removeEventListener("touchstart", unlockFnRef.current, true);
      document.removeEventListener("touchend",   unlockFnRef.current, true);
      document.removeEventListener("click",      unlockFnRef.current, true);
      unlockFnRef.current = null;
    }
  };

  const selectRandomTrack = () => {
    if (musicUrls.length <= 1) return;
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * musicUrls.length);
    } while (newIndex === currentTrackIndex);
    setCurrentTrackIndex(newIndex);
  };

  // Main audio setup effect — runs whenever the track URL changes
  useEffect(() => {
    // Clear any pending unlock listeners from the previous track
    removeUnlockListeners();
    setWaitingForTouch(false);

    const isYT = currentMusicUrl.includes('youtube.com') || currentMusicUrl.includes('youtu.be');
    setIsYouTubeUrl(isYT);
    setHasError(false);

    const audio = audioRef.current;
    if (!audio || isYT || !currentMusicUrl) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleError = () => { setHasError(true); setIsPlaying(false); };
    const handleEnded = () => {
      // pick next random track
      if (musicUrls.length > 1) {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * musicUrls.length); }
        while (newIndex === currentTrackIndex);
        setCurrentTrackIndex(newIndex);
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.loop = false;

    if (autoPlay) {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setWaitingForTouch(false);
        })
        .catch(() => {
          // Autoplay was blocked (Safari, or browsers with strict policy).
          // Register a one-shot listener on the document so the very first
          // real user gesture — anywhere on the page — starts the music.
          setIsPlaying(false);
          setWaitingForTouch(true);

          const unlockAudio = () => {
            removeUnlockListeners();

            // Prime the iOS audio subsystem via AudioContext before calling play().
            // This is necessary on some iOS versions where play() alone can still
            // be rejected even inside a valid gesture handler.
            try {
              const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx() as AudioContext;
                // Create a silent buffer and play it — this fully unlocks the audio stack.
                const buf = ctx.createBuffer(1, 1, 22050);
                const src = ctx.createBufferSource();
                src.buffer = buf;
                src.connect(ctx.destination);
                src.start(0);
                ctx.resume().catch(() => {});
              }
            } catch (_) {}

            // Now call play() — iOS will honour it because we're still inside the gesture.
            audio.play()
              .then(() => {
                setIsPlaying(true);
                setWaitingForTouch(false);
              })
              .catch(() => {
                setWaitingForTouch(false);
              });
          };

          unlockFnRef.current = unlockAudio;
          // Howler.js pattern: all three events in capture phase so scroll
          // containers cannot swallow them before they reach this handler.
          document.addEventListener("touchstart", unlockAudio, true);
          document.addEventListener("touchend",   unlockAudio, true);
          document.addEventListener("click",      unlockAudio, true);
        });
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMusicUrl, autoPlay]);

  // Cleanup unlock listeners when the component unmounts
  useEffect(() => {
    return () => { removeUnlockListeners(); };
  }, []);

  // Resume playback when track index changes (user clicked Next)
  useEffect(() => {
    if (isYouTubeUrl || !currentMusicUrl) return;
    const audio = audioRef.current;
    if (audio && isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
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
        .then(() => { setIsPlaying(true); setWaitingForTouch(false); })
        .catch(() => setHasError(true));
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
      if (newVolume > 0 && isMuted) { audio.muted = false; setIsMuted(false); }
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    const audio = audioRef.current;
    if (audio) audio.currentTime = newTime;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match?.[1] || null;
  };

  const openExternalUrl = () => window.open(currentMusicUrl, '_blank', 'noopener,noreferrer');

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

  if (isYouTubeUrl) {
    const videoId = getYouTubeVideoId(currentMusicUrl);
    return (
      <div className="bg-card border-border rounded-lg p-4 border">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium flex-1 truncate">{currentMusicTitle}</span>
            {musicUrls.length > 1 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                {currentTrackIndex + 1}/{musicUrls.length}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={openExternalUrl}
              className="text-muted-foreground hover:text-foreground" title="Open on YouTube">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          {videoId && (
            <div className="relative">
              <iframe
                width="100%" height="300"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&rel=0&modestbranding=1&mute=0`}
                title={currentMusicTitle} frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen className="rounded-lg shadow-lg"
                style={{ background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)', minHeight: '300px' }}
              />
            </div>
          )}
          {!videoId && (
            <Alert className="border-destructive bg-destructive/10">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                <div className="font-medium mb-1">Invalid YouTube URL</div>
                <p>Cannot extract video ID from this URL. Please check the link.</p>
              </AlertDescription>
            </Alert>
          )}
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>YouTube Music Player</span>
            <span className="bg-primary/20 px-2 py-1 rounded text-primary">YOUTUBE</span>
          </div>
        </div>
      </div>
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

  // Direct handler on the card element — absolute fallback if document-level
  // listeners are swallowed by scroll containers on iOS Safari.
  const handleCardInteraction = () => {
    if (!isPlaying && !isYouTubeUrl && !hasError && audioRef.current) {
      if (unlockFnRef.current) {
        unlockFnRef.current();
      }
    }
  };

  return (
    <div
      className="bg-card border-border rounded-lg p-4 border"
      onTouchStart={handleCardInteraction}
      onClick={handleCardInteraction}
    >
      <audio
        ref={audioRef}
        src={currentMusicUrl}
        preload="auto"
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
        {currentMusicUrl.toLowerCase().endsWith('.m4p') && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">M4P</span>
        )}
      </div>

      {hasError && (
        <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
          {currentMusicUrl.toLowerCase().endsWith('.m4p')
            ? "M4P files may have playback restrictions. Some protected iTunes files cannot be played in browsers."
            : "Unable to play this audio file. The format may not be supported."}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <Slider value={[currentTime]} max={duration || 100} step={1}
          onValueChange={handleSeek} className="w-full" data-testid="slider-progress" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost" size="sm" onClick={togglePlay}
          className="text-primary hover:text-primary/80 relative"
          data-testid="button-play-pause"
        >
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
