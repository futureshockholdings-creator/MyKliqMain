import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import type { Meme } from '@shared/schema';
import { resolveAssetUrl } from '@/lib/apiConfig';

interface MemeDisplayProps {
  meme: Meme | { url: string; title: string; isAnimated?: boolean };
  className?: string;
  variant?: 'default' | 'feed';
}

export function MemeDisplay({ meme, className = "", variant = 'default' }: MemeDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const isFeed = variant === 'feed';
  
  // Support both 'imageUrl' (from memes table) and 'url' (from gifs table)
  const sourceUrl = 'imageUrl' in meme ? meme.imageUrl : meme.url;
  
  // Convert Google Cloud Storage URLs to local object serving URLs
  // Then resolve to absolute URL for cross-domain (AWS Amplify -> Replit backend)
  const relativeUrl = sourceUrl.startsWith('https://storage.googleapis.com/') 
    ? sourceUrl.replace(/^https:\/\/storage\.googleapis\.com\/[^\/]+\/\.private\//, '/objects/')
    : sourceUrl;
  const imageUrl = resolveAssetUrl(relativeUrl) || relativeUrl;
  
  if (imageError) {
    // Fallback display if image fails to load
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm ${className}`}>
        <ImageIcon className="w-4 h-4" />
        <span>😂 MEME: {meme.title}</span>
      </div>
    );
  }
  
  return (
    <div className={`${isFeed ? 'flex w-full justify-center' : 'inline-block'} ${className}`}>
      <div className={`relative ${isFeed ? 'w-full' : 'max-w-xs'}`}>
        <img
          src={imageUrl}
          alt={meme.title}
          className={isFeed ? 'h-auto w-full rounded-lg object-contain' : 'rounded-lg max-h-48 object-contain'}
          onError={() => setImageError(true)}
        />
        {meme.isAnimated && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            GIF
          </div>
        )}
      </div>
    </div>
  );
}