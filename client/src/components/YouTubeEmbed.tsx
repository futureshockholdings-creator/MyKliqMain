import { useState } from 'react';
import { Play } from 'lucide-react';
import { extractYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/youtubeUtils';

interface YouTubeEmbedProps {
  url: string;
  className?: string;
  autoplay?: boolean;
}

export function YouTubeEmbed({ url, className = "", autoplay = false }: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const videoId = extractYouTubeVideoId(url);
  
  if (!videoId) {
    return null;
  }
  
  const embedUrl = getYouTubeEmbedUrl(videoId) + (autoplay ? '&autoplay=1' : '');
  const thumbnailUrl = getYouTubeThumbnailUrl(videoId, 'high');
  
  if (!isPlaying) {
    return (
      <div 
        className={`relative cursor-pointer group rounded-lg overflow-hidden bg-black ${className}`}
        onClick={() => setIsPlaying(true)}
        data-testid="youtube-thumbnail"
      >
        <img 
          src={thumbnailUrl}
          alt="YouTube video thumbnail"
          className="w-full aspect-video object-cover"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="bg-red-600 hover:bg-red-700 transition-colors rounded-full p-4 group-hover:scale-110 transform transition-transform">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>
        </div>
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          YouTube
        </div>
      </div>
    );
  }
  
  return (
    <div className={`rounded-lg overflow-hidden ${className}`} data-testid="youtube-embed">
      <iframe
        src={embedUrl}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full aspect-video"
      />
    </div>
  );
}

interface YouTubeEmbedListProps {
  urls: string[];
  className?: string;
}

export function YouTubeEmbedList({ urls, className = "" }: YouTubeEmbedListProps) {
  if (!urls || urls.length === 0) {
    return null;
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {urls.map((url, index) => (
        <YouTubeEmbed 
          key={`${url}-${index}`} 
          url={url} 
          className="w-full max-w-2xl"
        />
      ))}
    </div>
  );
}