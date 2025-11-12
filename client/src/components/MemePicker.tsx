import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Image as ImageIcon } from 'lucide-react';
import type { Meme } from '@shared/schema';

// Get color scheme based on category for consistent theming
function getMemeColor(meme: Meme): string {
  const colors = {
    'funny': 'from-yellow-500 to-yellow-600',
    'reaction': 'from-blue-500 to-blue-600', 
    'celebration': 'from-green-500 to-green-600',
    'sad': 'from-gray-500 to-gray-600',
    'shocked': 'from-purple-500 to-purple-600',
    'angry': 'from-red-500 to-red-600',
    'love': 'from-pink-500 to-pink-600',
    'thinking': 'from-teal-500 to-teal-600',
    'party': 'from-orange-500 to-orange-600',
    'general': 'from-slate-500 to-slate-600',
  };
  return colors[meme.category as keyof typeof colors] || 'from-slate-500 to-slate-600';
}

function MemeImage({ meme, className }: { meme: Meme; className?: string }) {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    // Fallback to gradient design if image fails to load
    return (
      <div className={`${className} relative h-32 overflow-hidden meme-container cursor-pointer border-2 border-primary rounded-lg`}>
        <div className={`relative w-full h-full bg-gradient-to-br ${getMemeColor(meme)} flex flex-col items-center justify-center text-white`}>
          <ImageIcon className="w-8 h-8 mb-1 opacity-70" />
          <div className="text-xs font-bold text-center px-2">{meme.title}</div>
        </div>
      </div>
    );
  }
  
  // Convert Google Cloud Storage URLs to local object serving URLs
  const imageUrl = meme.imageUrl.startsWith('https://storage.googleapis.com/') 
    ? meme.imageUrl.replace(/^https:\/\/storage\.googleapis\.com\/[^\/]+\/\.private\//, '/objects/')
    : meme.imageUrl;

  return (
    <div className={`${className} relative h-32 overflow-hidden meme-container cursor-pointer border-2 border-primary rounded-lg bg-black`}>
      <img
        src={imageUrl}
        alt={meme.title}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
      {meme.isAnimated && (
        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
          GIF
        </div>
      )}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
        <ImageIcon className="w-6 h-6 text-white drop-shadow-lg" />
      </div>
    </div>
  );
}

interface MemePickerProps {
  onSelectMeme: (meme: Meme) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MemePicker({ 
  onSelectMeme, 
  trigger, 
  isOpen, 
  onOpenChange 
}: MemePickerProps) {
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

  const { data: memes = [], isLoading } = useQuery<Meme[]>({
    queryKey: ['/api/memes', searchQuery],
    queryFn: async () => {
      const url = searchQuery ? `/api/memes?q=${encodeURIComponent(searchQuery)}` : '/api/memes';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: dialogOpen, // Only fetch when dialog is open
  });

  const handleMemeClick = (meme: Meme) => {
    onSelectMeme(meme);
    handleOpenChange(false);
  };

  const defaultTrigger = (
    <Button 
      size="sm" 
      variant="ghost" 
      className="text-mykliq-purple hover:bg-mykliq-purple/10"
    >
      <span className="text-xs font-bold">MEME</span>
    </Button>
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-primary">Choose a Meme</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Search and select a meme to add to your message
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search memes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input border-border text-foreground placeholder-muted-foreground"
            />
          </div>

          {/* Memes grid */}
          <div className="gif-scrollbar overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-muted-foreground">Loading memes...</div>
              </div>
            ) : memes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <div className="text-sm">No memes found</div>
                {searchQuery && (
                  <div className="text-xs mt-1">Try a different search term</div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-2">
                {memes.map((meme: Meme) => (
                  <div
                    key={meme.id}
                    onClick={() => handleMemeClick(meme)}
                    className="meme-item group cursor-pointer"
                  >
                    <MemeImage 
                      meme={meme} 
                      className="rounded-lg hover:scale-105 transition-transform duration-200 shadow-sm hover:shadow-md"
                    />
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