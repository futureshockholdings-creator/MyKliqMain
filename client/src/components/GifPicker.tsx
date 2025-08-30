import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Smile } from 'lucide-react';
import type { Gif } from '@shared/schema';

// Force image loading with proper error handling
function GifImage({ gif, className }: { gif: Gif; className?: string }) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  if (hasError) {
    return (
      <div className={`${className} relative h-24 bg-muted overflow-hidden gif-container cursor-pointer border border-border flex items-center justify-center`}>
        <span className="text-xs text-muted-foreground">Content not available</span>
      </div>
    );
  }

  return (
    <div className={`${className} relative h-24 bg-muted overflow-hidden gif-container cursor-pointer border border-border`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      )}
      <img
        src={gif.url}
        alt=""
        className={`w-full h-full object-cover transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

interface GifPickerProps {
  onSelectGif: (gif: Gif) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GifPicker({ 
  onSelectGif, 
  trigger, 
  isOpen, 
  onOpenChange 
}: GifPickerProps) {
  const [open, setOpen] = useState(false);

  // Control dialog state
  const dialogOpen = isOpen !== undefined ? isOpen : open;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setOpen(newOpen);
    }
  };

  // Fetch all GIFs
  const { data: allGifs = [], isLoading: isLoadingAll } = useQuery<Gif[]>({
    queryKey: ['/api/gifs']
  });

  const handleGifSelect = (gif: Gif) => {
    onSelectGif(gif);
    handleOpenChange(false);
  };

  const renderGifGrid = (gifs: Gif[]) => (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 p-4 pb-6">
      {gifs.map((gif) => (
        <div
          key={gif.id}
          className="relative cursor-pointer group rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
          onClick={() => handleGifSelect(gif)}
          data-testid={`gif-item-${gif.id}`}
        >
          <GifImage 
            gif={gif} 
            className="w-full h-24 object-cover group-hover:scale-105 transition-transform" 
          />
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            size="sm"
            data-testid="gif-picker-trigger"
          >
            <Smile className="h-4 w-4 mr-2" />
            GIF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[650px] bg-card text-foreground overflow-hidden" aria-describedby="gif-picker-description">
        <DialogHeader>
          <DialogTitle>Choose a GIF</DialogTitle>
          <div id="gif-picker-description" className="sr-only">
            Browse and select animated GIFs to add to your post or message
          </div>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div 
              className="h-full pr-2 gif-scrollbar" 
              style={{ 
                overflowY: 'scroll',
                maxHeight: '500px'
              }}
            >
              <div className="pr-2">
                {isLoadingAll ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Loading GIFs...</p>
                  </div>
                ) : allGifs.length > 0 ? (
                  <>
                    <div className="mb-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Browse all {allGifs.length} GIFs
                      </p>
                    </div>
                    {renderGifGrid(allGifs)}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">No GIFs available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}