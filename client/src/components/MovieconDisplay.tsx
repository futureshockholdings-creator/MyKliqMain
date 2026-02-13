import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Moviecon } from '@shared/schema';
import { cn } from '@/lib/utils';
import { buildApiUrl } from '@/lib/apiConfig';

interface MovieconDisplayProps {
  moviecon: Moviecon;
  className?: string;
  autoPlay?: boolean;
}

function getMovieconColor(moviecon: Moviecon): string {
  const colors = {
    'Epic Explosion': 'from-red-500 to-red-600',
    'Dramatic Gasp': 'from-teal-500 to-teal-600', 
    'Comedy Gold': 'from-yellow-500 to-yellow-600',
    'Romantic Kiss': 'from-pink-500 to-pink-600',
    'Horror Scream': 'from-gray-500 to-gray-600',
    'Sci-Fi Portal': 'from-blue-500 to-blue-600',
    'Epic Battle': 'from-orange-500 to-orange-600',
    'Funny Dance': 'from-green-500 to-green-600',
    'Emotional Cry': 'from-amber-500 to-amber-600',
    'Magic Spell': 'from-purple-500 to-purple-600',
  };
  return colors[moviecon.title as keyof typeof colors] || 'from-slate-500 to-slate-600';
}

function useVideoThumbnail(videoSrc: string, posterUrl?: string) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(posterUrl || null);
  const thumbnailVideoRef = useRef<HTMLVideoElement | null>(null);
  const listenersRef = useRef<{ event: string; handler: () => void }[]>([]);

  const generate = useCallback(() => {
    if (posterUrl) return;

    const video = document.createElement("video");
    thumbnailVideoRef.current = video;
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.src = "";
      video.load();
    };

    const onLoadedData = () => {
      video.currentTime = 0.5;
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          if (dataUrl && dataUrl !== "data:,") {
            setThumbnailUrl(dataUrl);
          }
        }
      } catch (e) {
        // CORS prevented canvas capture
      }
      cleanup();
    };

    const onError = () => {
      cleanup();
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);

    listenersRef.current = [
      { event: "loadeddata", handler: onLoadedData },
      { event: "seeked", handler: onSeeked },
      { event: "error", handler: onError },
    ];

    video.src = videoSrc;
    video.load();
  }, [videoSrc, posterUrl]);

  useEffect(() => {
    generate();
    return () => {
      if (thumbnailVideoRef.current) {
        listenersRef.current.forEach(({ event, handler }) => {
          thumbnailVideoRef.current?.removeEventListener(event, handler);
        });
        thumbnailVideoRef.current.src = "";
        thumbnailVideoRef.current.load();
        thumbnailVideoRef.current = null;
      }
      listenersRef.current = [];
    };
  }, [generate]);

  return thumbnailUrl;
}

export function MovieconDisplay({ moviecon, className, autoPlay = false }: MovieconDisplayProps) {
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (moviecon.videoUrl && (moviecon.videoUrl.includes('storage.googleapis.com') || moviecon.videoUrl.startsWith('/objects/'))) {
    const videoSrc = buildApiUrl(moviecon.videoUrl);
    const posterUrl = moviecon.thumbnailUrl ? buildApiUrl(moviecon.thumbnailUrl) : undefined;

    return (
      <MovieconVideoPlayer
        moviecon={moviecon}
        videoSrc={videoSrc}
        posterUrl={posterUrl}
        className={className}
      />
    );
  }
  
  return (
    <div className={cn(`relative bg-gradient-to-br ${getMovieconColor(moviecon)} rounded-lg overflow-hidden min-h-[120px] flex flex-col items-center justify-center text-white border-2 border-primary/50`, className)}>
      <div className="text-center p-4">
        <div className="text-lg mb-2">🎬</div>
        <div className="text-sm font-bold mb-1">{moviecon.title}</div>
        <div className="text-xs opacity-90">{moviecon.movieSource}</div>
        <div className="text-xs opacity-75 mt-1">{moviecon.duration}s moviecon</div>
      </div>
    </div>
  );
}

function MovieconVideoPlayer({ moviecon, videoSrc, posterUrl, className }: {
  moviecon: Moviecon;
  videoSrc: string;
  posterUrl?: string;
  className?: string;
}) {
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const generatedThumbnail = useVideoThumbnail(videoSrc, posterUrl);

  if (videoError) {
    return (
      <div className={cn(`relative bg-gradient-to-br ${getMovieconColor(moviecon)} rounded-lg overflow-hidden min-h-[120px] flex flex-col items-center justify-center text-white`, className)}>
        <div className="text-center p-4">
          <div className="text-lg mb-2">🎬</div>
          <div className="text-sm font-bold mb-1">{moviecon.title}</div>
          <div className="text-xs opacity-90">Custom Clip</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-lg overflow-hidden min-h-[120px] bg-black border-2 border-primary/50', className)}>
      {isPlaying ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          playsInline
          autoPlay
          muted={isMuted}
          onError={() => setVideoError(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      ) : (
        <div
          className="w-full h-full cursor-pointer"
          onClick={() => {
            setIsPlaying(true);
          }}
        >
          {generatedThumbnail ? (
            <img
              src={generatedThumbnail}
              alt={moviecon.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full aspect-video bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <Video className="w-10 h-10 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
             onClick={() => setIsPlaying(true)}>
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-black ml-1" />
          </div>
        </div>
      )}

      {isPlaying && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="text-white text-sm font-medium">{moviecon.title}</div>
      </div>
    </div>
  );
}
