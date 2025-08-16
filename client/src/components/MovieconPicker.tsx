import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Play } from 'lucide-react';
import type { Moviecon } from '@shared/schema';

// Force video loading with proper error handling
function MovieconVideo({ moviecon, className }: { moviecon: Moviecon; className?: string }) {
  // Always show fallback for placeholder videos, or show thumbnail if available
  const [hasError, setHasError] = useState(moviecon.videoUrl.includes('placeholder'));
  const [isLoaded, setIsLoaded] = useState(!!moviecon.thumbnailUrl);

  // Since all videos are placeholders, just show thumbnails directly
  return (
    <div className={`${className} relative h-24 bg-muted overflow-hidden moviecon-container cursor-pointer border border-border rounded-lg`}>
      <div className="relative w-full h-full">
        {moviecon.thumbnailUrl ? (
          <img
            src={moviecon.thumbnailUrl}
            alt={moviecon.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-500 flex flex-col items-center justify-center text-white">
            <div className="text-xs font-medium text-center px-2">{moviecon.title}</div>
            <div className="text-xs opacity-75 mt-1">{moviecon.duration}s</div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Play className="w-6 h-6 text-white" />
        </div>
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
          {moviecon.duration}s
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

  const { data: moviecons = [], isLoading } = useQuery<Moviecon[]>({
    queryKey: ['/api/moviecons', searchQuery],
    enabled: dialogOpen, // Only fetch when dialog is open
  });

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
              <div className="grid grid-cols-4 gap-2 p-2">
                {moviecons.map((moviecon: Moviecon) => (
                  <div
                    key={moviecon.id}
                    onClick={() => handleMovieconClick(moviecon)}
                    className="moviecon-item group"
                  >
                    <MovieconVideo 
                      moviecon={moviecon} 
                      className="rounded-lg hover:scale-105 transition-transform duration-200"
                    />
                    <div className="text-xs text-center mt-1 text-muted-foreground group-hover:text-foreground transition-colors truncate">
                      {moviecon.title}
                    </div>
                    {moviecon.movieSource && (
                      <div className="text-xs text-center text-muted-foreground/70 truncate">
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