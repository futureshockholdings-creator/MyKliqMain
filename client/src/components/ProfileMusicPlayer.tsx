import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Music, ExternalLink, AlertTriangle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileMusicPlayerProps {
  musicUrl: string;
  musicTitle: string;
  autoPlay?: boolean;
}

export function ProfileMusicPlayer({ musicUrl, musicTitle, autoPlay = true }: ProfileMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isYouTubeUrl, setIsYouTubeUrl] = useState(false);
  const [showEmbedPlayer, setShowEmbedPlayer] = useState(false);

  useEffect(() => {
    // Check if URL is YouTube
    const isYT = musicUrl.includes('youtube.com') || musicUrl.includes('youtu.be');
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
    
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", () => {
      // Auto-restart playback for seamless looping
      audio.currentTime = 0;
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    });
    audio.addEventListener("error", handleError);
    
    // Enable looping
    audio.loop = true;

    // Reset error state when URL changes
    setHasError(false);

    // Auto-play for non-YouTube URLs
    if (!isYT) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.log("Auto-play prevented:", error);
            // Don't set error state, just wait for user interaction
          });
      }
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("error", handleError);
    };
  }, [musicUrl, autoPlay]);

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
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.log("Playback failed:", error);
            setHasError(true);
          });
      }
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
    if (audio) {
      audio.currentTime = newTime;
    }
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
    window.open(musicUrl, '_blank', 'noopener,noreferrer');
  };

  if (isYouTubeUrl) {
    const videoId = getYouTubeVideoId(musicUrl);
    
    return (
      <div className="bg-card border-border rounded-lg p-4 border">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium flex-1 truncate">{musicTitle}</span>
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

          {/* Always show the YouTube embed player for better integration */}
          {videoId && (
            <div className="relative">
              <iframe
                width="100%"
                height="300"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&rel=0&modestbranding=1&mute=0`}
                title={musicTitle}
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
        src={musicUrl}
        preload="metadata"
        loop
        autoPlay
        onError={(e) => {
          console.log("Audio playback error for:", musicUrl, e);
          setIsPlaying(false);
          setHasError(true);
        }}
        onCanPlay={() => {
          setHasError(false);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      <div className="flex items-center gap-3 mb-3">
        <Music className="w-5 h-5 text-primary" />
        <span className="text-primary font-medium flex-1 truncate">
          {musicTitle}
        </span>
        {musicUrl.toLowerCase().endsWith('.m4p') && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            M4P
          </span>
        )}
      </div>
      
      {hasError && (
        <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
          {musicUrl.toLowerCase().endsWith('.m4p') ? 
            "M4P files may have playback restrictions. Some protected iTunes files cannot be played in browsers." :
            "Unable to play this audio file. The format may not be supported."
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
          className="text-primary hover:text-primary/80"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
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