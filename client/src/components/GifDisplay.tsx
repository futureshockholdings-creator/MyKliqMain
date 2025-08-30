import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Gif } from '@shared/schema';

interface GifDisplayProps {
  gif: Gif;
  className?: string;
  autoPlay?: boolean;
  showTitle?: boolean;
  onClick?: () => void;
}

export function GifDisplay({ 
  gif, 
  className, 
  autoPlay = true, 
  showTitle = false,
  onClick 
}: GifDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg border border-border",
          "min-h-[120px] text-muted-foreground",
          className
        )}
      >
        <p className="text-sm">Failed to load GIF</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative rounded-lg overflow-hidden border border-border bg-card",
        onClick && "cursor-pointer hover:border-primary transition-colors",
        className
      )}
      onClick={onClick}
      data-testid={`gif-display-${gif.id}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      )}
      
      <img
        src={autoPlay ? gif.url : (gif.thumbnailUrl || gif.url)}
        alt=""
        className={cn(
          "w-full h-auto object-cover",
          isLoading && "opacity-0"
        )}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          maxWidth: gif.width ? `${gif.width}px` : '100%',
          maxHeight: gif.height ? `${gif.height}px` : 'auto'
        }}
      />
      
      {showTitle && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p className="text-white text-xs font-medium truncate">{gif.title}</p>
        </div>
      )}
    </div>
  );
}