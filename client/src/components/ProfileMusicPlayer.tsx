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

export function ProfileMusicPlayer({ musicUrl, musicTitle, autoPlay = false }: ProfileMusicPlayerProps) {
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
    audio.addEventListener("ended", () => setIsPlaying(false));
    audio.addEventListener("error", handleError);

    // Reset error state when URL changes
    setHasError(false);

    // Auto-play if enabled (only for non-YouTube URLs)
    if (autoPlay && !isYT) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.log("Auto-play prevented:", error);
            setHasError(true);
          });
      }
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", () => setIsPlaying(false));
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
      <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg p-4 border border-red-500/30">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium flex-1 truncate">{musicTitle}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={openExternalUrl}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
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
                src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1`}
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
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-300 text-sm">
                <div className="font-medium mb-1">Invalid YouTube URL</div>
                <p>Cannot extract video ID from this URL. Please check the link.</p>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>YouTube Music Player</span>
            <span className="bg-red-500/20 px-2 py-1 rounded text-red-400">YOUTUBE</span>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <Music className="w-4 h-4" />
            <span className="text-sm">Unable to load audio file</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={openExternalUrl}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-xs text-red-300 mt-1">Try opening the link directly or check if the URL is accessible.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg p-4 border border-pink-500/30">
      <audio
        ref={audioRef}
        src={musicUrl}
        preload="metadata"
        onError={(e) => {
          console.log("Audio playback error for:", musicUrl, e);
          setIsPlaying(false);
          setHasError(true);
        }}
        onCanPlay={() => {
          setHasError(false);
        }}
      />
      
      <div className="flex items-center gap-3 mb-3">
        <Music className="w-5 h-5 text-pink-400" />
        <span className="text-pink-400 font-medium flex-1 truncate">
          {musicTitle}
        </span>
        {musicUrl.toLowerCase().endsWith('.m4p') && (
          <span className="text-xs text-amber-400 bg-amber-400/20 px-2 py-1 rounded">
            M4P
          </span>
        )}
      </div>
      
      {hasError && (
        <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
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
        <div className="flex justify-between text-xs text-gray-400 mt-1">
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
          className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/20"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/20"
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