import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Music, ExternalLink, AlertTriangle, SkipForward } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileMusicPlayerProps {
  musicUrls: string[];
  musicTitles: string[];
  autoPlay?: boolean;
}

function detectSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua) && !/Android/.test(ua);
}

export function ProfileMusicPlayer({ musicUrls, musicTitles, autoPlay = true }: ProfileMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const unlockListenerAttached = useRef(false);
  const isSafari = useRef(detectSafari());

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isYouTubeUrl, setIsYouTubeUrl] = useState(false);
  const [showEmbedPlayer, setShowEmbedPlayer] = useState(false);
  const [waitingForTouch, setWaitingForTouch] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    return musicUrls.length > 0 ? Math.floor(Math.random() * musicUrls.length) : 0;
  });

  const currentMusicUrl = musicUrls[currentTrackIndex] || '';
  const currentMusicTitle = musicTitles[currentTrackIndex] || 'Unknown Track';

  const selectRandomTrack = useCallback(() => {
    if (musicUrls.length <= 1) return;
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * musicUrls.length);
    } while (newIndex === currentTrackIndex);
    setCurrentTrackIndex(newIndex);
  }, [musicUrls.length, currentTrackIndex]);

  // Attach/detach the first-touch document unlock listener
  const attachUnlockListener = useCallback(() => {
    if (unlockListenerAttached.current) return;
    unlockListenerAttached.current = true;

    const unlock = () => {
      const audio = audioRef.current;
      if (!audio) return;
      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          setIsPlaying(true);
          setWaitingForTouch(false);
        }).catch(() => {
          setWaitingForTouch(false);
        });
      }
      document.removeEventListener("touchstart", unlock, true);
      document.removeEventListener("click", unlock, true);
      unlockListenerAttached.current = false;
    };

    // Use capture phase so the event fires before anything else on the page
    document.addEventListener("touchstart", unlock, { capture: true, once: true });
    document.addEventListener("click", unlock, { capture: true, once: true });

    return () => {
      document.removeEventListener("touchstart", unlock, true);
      document.removeEventListener("click", unlock, true);
      unlockListenerAttached.current = false;
    };
  }, []);

  useEffect(() => {
    const isYT = currentMusicUrl.includes('youtube.com') || currentMusicUrl.includes('youtu.be');
    setIsYouTubeUrl(isYT);
    setHasError(false);

    const audio = audioRef.current;
    if (!audio || isYT) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleError = () => {
      setHasError(true);
      setIsPlaying(false);
    };
    const handleEnded = () => selectRandomTrack();

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.loop = false;
    setHasError(false);

    if (autoPlay && currentMusicUrl) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setWaitingForTouch(false);
          })
          .catch(() => {
            // Autoplay was blocked — set up first-touch unlock
            setIsPlaying(false);
            setWaitingForTouch(true);
            attachUnlockListener();
          });
      }
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [currentMusicUrl, autoPlay, attachUnlockListener, selectRandomTrack]);

  // Auto-play when track changes (if already unlocked / non-Safari)
  useEffect(() => {
    if (isYouTubeUrl || !currentMusicUrl) return;
    const audio = audioRef.current;
    if (audio && isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex]);

  // Clean up unlock listeners on unmount
  useEffect(() => {
    return () => {
      unlockListenerAttached.current = false;
    };
  }, []);

  const togglePlay = () => {
    if (isYouTubeUrl) {
      setShowEmbedPlayer(!showEmbedPlayer);
      return;
    }
    const audio = audioRef.current;
    if (!audio || hasError) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setWaitingForTouch(false);
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setWaitingForTouch(false);
        })
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
      if (newVolume > 0 && isMuted) {
        audio.muted = false;
        setIsMuted(false);
      }
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

  const openExternalUrl = () => {
    window.open(currentMusicUrl, '_blank', 'noopener,noreferrer');
  };

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
            <Button
              variant="ghost"
              size="sm"
              onClick={openExternalUrl}
              className="text-muted-foreground hover:text-foreground"
              title="Open on YouTube"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {videoId && (
            <div className="relative">
              <iframe
                width="100%"
                height="300"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&rel=0&modestbranding=1&mute=0`}
                title={currentMusicTitle}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="rounded-lg shadow-lg"
                style={{
                  background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)',
                  minHeight: '300px'
                }}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={openExternalUrl}
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-xs text-destructive/80 mt-1">Try opening the link directly or check if the URL is accessible.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-border rounded-lg p-4 border">
      <audio
        ref={audioRef}
        src={currentMusicUrl}
        preload="metadata"
        onError={() => {
          setIsPlaying(false);
          setHasError(true);
        }}
        onCanPlay={() => setHasError(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-3 mb-3">
        <Music className="w-5 h-5 text-primary" />
        <span className="text-primary font-medium flex-1 truncate">
          {currentMusicTitle}
        </span>
        {musicUrls.length > 1 && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
            {currentTrackIndex + 1}/{musicUrls.length}
          </span>
        )}
        {currentMusicUrl.toLowerCase().endsWith('.m4p') && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">M4P</span>
        )}
      </div>

      {/* Safari first-touch nudge */}
      {waitingForTouch && (
        <div className="mb-3 flex items-center gap-2 text-xs text-primary/70 animate-pulse">
          <Music className="w-3 h-3" />
          <span>Tap anywhere to start music</span>
        </div>
      )}

      {hasError && (
        <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
          {currentMusicUrl.toLowerCase().endsWith('.m4p')
            ? "M4P files may have playback restrictions. Some protected iTunes files cannot be played in browsers."
            : "Unable to play this audio file. The format may not be supported."
          }
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={handleSeek}
          className="w-full"
          data-testid="slider-progress"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          className={`text-primary hover:text-primary/80 relative ${waitingForTouch ? 'animate-pulse' : ''}`}
          data-testid="button-play-pause"
          title={waitingForTouch ? "Tap to start music" : undefined}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {/* Ripple ring shown while waiting for first touch */}
          {waitingForTouch && (
            <span className="absolute inset-0 rounded-md ring-2 ring-primary/50 animate-ping pointer-events-none" />
          )}
        </Button>

        {musicUrls.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={selectRandomTrack}
            className="text-primary hover:text-primary/80"
            title="Next random track"
            data-testid="button-next-track"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="text-primary hover:text-primary/80"
          data-testid="button-mute"
        >
          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>

        <div className="flex-1 mx-2">
          <Slider
            value={[volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-full"
            data-testid="slider-volume"
          />
        </div>
      </div>
    </div>
  );
}
