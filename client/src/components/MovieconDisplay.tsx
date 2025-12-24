import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Moviecon } from '@shared/schema';
import { cn } from '@/lib/utils';
import { buildApiUrl } from '@/lib/apiConfig';

interface MovieconDisplayProps {
  moviecon: Moviecon;
  className?: string;
  autoPlay?: boolean;
}

// Get color scheme based on category/title for consistent theming  
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

export function MovieconDisplay({ moviecon, className, autoPlay = false }: MovieconDisplayProps) {
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Show actual video for uploaded moviecons, fallback to gradient for old ones
  if (moviecon.videoUrl && (moviecon.videoUrl.includes('storage.googleapis.com') || moviecon.videoUrl.startsWith('/objects/'))) {
    // Build full URL for cross-domain video loading (frontend on mykliq.app, API on api.mykliq.app)
    const videoSrc = buildApiUrl(moviecon.videoUrl);
    
    // This is a custom uploaded moviecon - show actual video
    return (
      <div className={cn('relative rounded-lg overflow-hidden min-h-[120px] bg-black border-2 border-primary/50', className)}>
        {!videoError ? (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-cover"
              muted={isMuted}
              onError={() => setVideoError(true)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
            
            {/* Play Button Overlay - show when not playing */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" 
                   onClick={() => videoRef.current?.play()}>
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-black ml-1" />
                </div>
              </div>
            )}

            {/* Mute/Unmute Button */}
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
            
            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="text-white text-sm font-medium">{moviecon.title}</div>
            </div>
          </>
        ) : (
          <div className={cn(`relative bg-gradient-to-br ${getMovieconColor(moviecon)} rounded-lg overflow-hidden min-h-[120px] flex flex-col items-center justify-center text-white`, className)}>
            <div className="text-center p-4">
              <div className="text-lg mb-2">🎬</div>
              <div className="text-sm font-bold mb-1">{moviecon.title}</div>
              <div className="text-xs opacity-90">Custom Clip</div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Fallback to gradient design for demo/default moviecons
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