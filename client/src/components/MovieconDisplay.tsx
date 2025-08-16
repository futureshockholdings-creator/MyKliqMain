import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Moviecon } from '@shared/schema';
import { cn } from '@/lib/utils';

interface MovieconDisplayProps {
  moviecon: Moviecon;
  className?: string;
  autoPlay?: boolean;
}

export function MovieconDisplay({ moviecon, className, autoPlay = false }: MovieconDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = () => {
    togglePlay();
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (autoPlay && videoRef.current) {
      // Auto-replay for short clips
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoError = () => {
    setHasError(true);
    setIsLoading(false);
    console.error('Video failed to load:', moviecon.videoUrl);
  };

  const handleVideoLoaded = () => {
    setIsLoading(false);
    setHasError(false);
  };

  if (hasError) {
    return (
      <div className={cn("relative bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg overflow-hidden min-h-[120px] flex flex-col items-center justify-center text-white", className)}>
        <div className="text-center p-4">
          <div className="text-sm font-medium mb-1">{moviecon.title}</div>
          <div className="text-xs opacity-75">{moviecon.movieSource}</div>
          <div className="text-xs opacity-50 mt-1">{moviecon.duration}s clip</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn("relative bg-black rounded-lg overflow-hidden min-h-[120px]", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 rounded-lg flex items-center justify-center text-white text-sm">
          Loading...
        </div>
      )}
      <video
        ref={videoRef}
        src={moviecon.videoUrl}
        poster={moviecon.thumbnailUrl || undefined}
        className="w-full h-full object-cover cursor-pointer"
        onClick={handleVideoClick}
        onEnded={handleVideoEnded}
        muted={isMuted}
        loop={autoPlay}
        preload="metadata"
        playsInline
        onLoadedMetadata={() => {
          handleVideoLoaded();
          // Set video to first frame when loaded
          if (videoRef.current) {
            videoRef.current.currentTime = 0.1;
          }
        }}
        onError={handleVideoError}
      />
      
      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <Button
            onClick={togglePlay}
            size="lg"
            variant="ghost"
            className="bg-black/50 hover:bg-black/70 text-white rounded-full w-16 h-16"
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      )}

      {/* Controls overlay */}
      {showControls && isPlaying && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-between p-2">
          <div className="flex gap-1">
            <Button
              onClick={togglePlay}
              size="sm"
              variant="ghost"
              className="bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 p-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            <Button
              onClick={toggleMute}
              size="sm"
              variant="ghost"
              className="bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 p-0"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
            {moviecon.duration}s
          </div>
        </div>
      )}

      {/* Duration badge (when not playing) */}
      {!isPlaying && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {moviecon.duration}s
        </div>
      )}

      {/* Title overlay */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded max-w-[80%] truncate">
        {moviecon.title}
        {moviecon.movieSource && (
          <div className="text-xs opacity-75">{moviecon.movieSource}</div>
        )}
      </div>
    </div>
  );
}