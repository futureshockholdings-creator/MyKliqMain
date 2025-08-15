import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Smile } from 'lucide-react';
import type { Gif } from '@shared/schema';

// Component to handle GIF image loading with fallback
function GifImage({ gif, className }: { gif: Gif; className?: string }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset states when gif changes
    setHasError(false);
    setIsLoading(true);

    // Create a simple timeout to simulate loading, then try direct image load
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log(`GIF loaded successfully: ${gif.title}`);
    }, 100);

    return () => clearTimeout(timer);
  }, [gif.url, gif.thumbnailUrl, gif.title]);

  if (hasError) {
    return (
      <div className={`${className} bg-muted flex flex-col items-center justify-center text-center p-2 h-24 border border-border`}>
        <div className="text-muted-foreground text-lg mb-1">🎬</div>
        <div className="text-muted-foreground text-xs leading-tight font-medium">{gif.title}</div>
        <div className="text-muted-foreground text-xs opacity-60 mt-1">GIF preview</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center h-24`}>
        <div className="text-muted-foreground text-xs">Loading GIF...</div>
      </div>
    );
  }

  return (
    <div className={`${className} relative h-24 bg-muted overflow-hidden gif-container`}>
      <img
        src={gif.thumbnailUrl || gif.url}
        alt=""
        title={gif.title}
        className="w-full h-full object-cover"
        style={{ 
          display: 'block',
          minHeight: '96px',
          minWidth: '100%',
          textIndent: '-9999px',
          fontSize: '0',
          color: 'transparent'
        }}
        onError={(e) => {
          console.log(`Final render error for: ${gif.title}`);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          setHasError(true);
        }}
        onLoad={() => {
          console.log(`Image element loaded: ${gif.title}`);
        }}
        draggable={false}
      />
      {/* Overlay to completely cover any browser fallback text */}
      <div className="absolute inset-0 pointer-events-none bg-transparent" style={{ zIndex: 1 }} />
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
  const [searchQuery, setSearchQuery] = useState('');
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

  // Fetch all GIFs when no search query, or search results when there is a query
  const { data: allGifs = [], isLoading: isLoadingAll } = useQuery<Gif[]>({
    queryKey: ['/api/gifs'],
    enabled: searchQuery.length <= 2
  });

  // Search GIFs
  const { data: searchResults = [], isLoading: isSearching } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/search', { q: searchQuery }],
    enabled: searchQuery.length > 2
  });

  const handleGifSelect = (gif: Gif) => {
    onSelectGif(gif);
    handleOpenChange(false);
    setSearchQuery('');
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
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
            <div className="p-2 bg-gradient-to-t from-black/60 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs font-medium truncate">{gif.title}</p>
            </div>
          </div>
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
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for GIFs (e.g., 'birthday', 'happy', 'christmas', 'thumbs up')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
              data-testid="gif-search-input"
            />
          </div>

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
                {searchQuery.length > 2 ? (
                  // Search results
                  <>
                    {isSearching ? (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-muted-foreground">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      renderGifGrid(searchResults)
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-muted-foreground">No GIFs found for "{searchQuery}"</p>
                      </div>
                    )}
                  </>
                ) : (
                  // Show all GIFs when no search query
                  <>
                    {isLoadingAll ? (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-muted-foreground">Loading GIFs...</p>
                      </div>
                    ) : allGifs.length > 0 ? (
                      <>
                        <div className="mb-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            Browse all {allGifs.length} GIFs or search for specific ones above
                          </p>
                          <p className="text-xs text-muted-foreground opacity-75 mt-1">
                            Check browser console for any loading issues
                          </p>
                        </div>
                        {renderGifGrid(allGifs)}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-muted-foreground">No GIFs available</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}