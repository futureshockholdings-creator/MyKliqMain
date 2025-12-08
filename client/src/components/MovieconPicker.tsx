import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Play } from 'lucide-react';
import type { Moviecon } from '@shared/schema';

// Force video loading with proper error handling
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

function MovieconThumbnail({ moviecon, className }: { moviecon: Moviecon; className?: string }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const thumbnailSrc = moviecon.thumbnailUrl || null;
  
  if (!thumbnailSrc || imageError) {
    return (
      <div className={`${className} relative h-24 overflow-hidden moviecon-container cursor-pointer border-2 border-primary rounded-lg bg-gray-800`}>
        <div className="w-full h-full flex items-center justify-center">
          <Play className="w-8 h-8 text-white/50" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative h-24 overflow-hidden moviecon-container cursor-pointer border-2 border-primary rounded-lg bg-black`}>
      <img
        src={thumbnailSrc}
        alt={moviecon.title}
        className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="eager"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
          <Play className="w-5 h-5 text-white ml-0.5" />
        </div>
      </div>
    </div>
  );
}

interface MovieconPickerProps {
  onSelectMoviecon: (moviecon: Moviecon) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MovieconPicker({ 
  onSelectMoviecon, 
  trigger, 
  isOpen, 
  onOpenChange 
}: MovieconPickerProps) {
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

  // Reset search when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setSearchQuery('');
    }
  }, [dialogOpen]);

  // Prefetch base moviecons data on component mount (before dialog opens)
  const { data: prefetchedMoviecons = [], isPending: isPrefetching } = useQuery<Moviecon[]>({
    queryKey: ['/api/moviecons', ''],
    queryFn: async () => {
      const response = await fetch('/api/moviecons', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Search query - only fetch when searching and dialog is open
  const { data: searchedMoviecons = [], isPending: isSearching } = useQuery<Moviecon[]>({
    queryKey: ['/api/moviecons', searchQuery],
    queryFn: async () => {
      const url = `/api/moviecons?q=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: dialogOpen && searchQuery.length > 0,
    staleTime: 60 * 1000, // Cache search results for 1 minute
  });

  // Use searched moviecons if searching, otherwise use prefetched
  const moviecons = searchQuery ? searchedMoviecons : prefetchedMoviecons;
  const isLoading = searchQuery ? isSearching : isPrefetching;

  const handleMovieconClick = (moviecon: Moviecon) => {
    onSelectMoviecon(moviecon);
    handleOpenChange(false);
  };

  const defaultTrigger = (
    <Button 
      size="sm" 
      variant="ghost" 
      className="text-mykliq-purple hover:bg-mykliq-purple/10"
    >
      <span className="text-xs font-bold">CLIP</span>
    </Button>
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-primary">Choose a Moviecon</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Search and select a movie clip reaction to add to your message
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search movie clips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input border-border text-foreground placeholder-muted-foreground"
            />
          </div>

          {/* Moviecons grid */}
          <div className="gif-scrollbar overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Loading moviecons...</div>
              </div>
            ) : moviecons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <div className="text-sm">No moviecons found</div>
                {searchQuery && (
                  <div className="text-xs mt-1">Try a different search term</div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-2">
                {moviecons.map((moviecon: Moviecon) => (
                  <div
                    key={moviecon.id}
                    onClick={() => handleMovieconClick(moviecon)}
                    className="moviecon-item group cursor-pointer flex flex-col gap-1"
                  >
                    <MovieconThumbnail 
                      moviecon={moviecon} 
                      className="rounded-lg hover:scale-105 transition-transform duration-200 shadow-sm hover:shadow-md"
                    />
                    <div className="text-xs text-center text-black dark:text-white font-medium line-clamp-2 px-1">
                      {moviecon.title}
                    </div>
                    {moviecon.movieSource && (
                      <div className="text-xs text-center text-gray-600 dark:text-gray-400 line-clamp-1 px-1">
                        {moviecon.movieSource}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}