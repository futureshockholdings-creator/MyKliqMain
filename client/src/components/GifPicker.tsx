import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Smile, TrendingUp, Star } from 'lucide-react';
import type { Gif } from '@shared/schema';

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
  const [activeTab, setActiveTab] = useState('trending');
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

  // Fetch trending GIFs
  const { data: trendingGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/trending'],
    enabled: activeTab === 'trending'
  });

  // Fetch featured GIFs
  const { data: featuredGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/featured'],
    enabled: activeTab === 'featured'
  });

  // Fetch all GIFs by category
  const { data: emotionGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/emotions'],
    enabled: activeTab === 'emotions'
  });

  const { data: reactionGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/reactions'],
    enabled: activeTab === 'reactions'
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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
      {gifs.map((gif) => (
        <div
          key={gif.id}
          className="relative cursor-pointer group rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
          onClick={() => handleGifSelect(gif)}
          data-testid={`gif-item-${gif.id}`}
        >
          <img
            src={gif.thumbnailUrl || gif.url}
            alt={gif.title}
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
      <DialogContent className="max-w-2xl h-[600px] bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Choose a GIF</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for GIFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
              data-testid="gif-search-input"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {searchQuery.length > 2 ? (
              // Search results
              <ScrollArea className="h-full">
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
              </ScrollArea>
            ) : (
              // Categorized GIFs
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 bg-muted">
                  <TabsTrigger value="trending" className="flex items-center gap-2" data-testid="tab-trending">
                    <TrendingUp className="h-4 w-4" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="featured" className="flex items-center gap-2" data-testid="tab-featured">
                    <Star className="h-4 w-4" />
                    Featured
                  </TabsTrigger>
                  <TabsTrigger value="emotions" data-testid="tab-emotions">Emotions</TabsTrigger>
                  <TabsTrigger value="reactions" data-testid="tab-reactions">Reactions</TabsTrigger>
                </TabsList>

                <div className="flex-1 mt-4 overflow-hidden">
                  <TabsContent value="trending" className="h-full mt-0">
                    <ScrollArea className="h-full">
                      {trendingGifs.length > 0 ? (
                        renderGifGrid(trendingGifs)
                      ) : (
                        <div className="flex items-center justify-center h-32">
                          <p className="text-muted-foreground">No trending GIFs available</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="featured" className="h-full mt-0">
                    <ScrollArea className="h-full">
                      {featuredGifs.length > 0 ? (
                        renderGifGrid(featuredGifs)
                      ) : (
                        <div className="flex items-center justify-center h-32">
                          <p className="text-muted-foreground">No featured GIFs available</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="emotions" className="h-full mt-0">
                    <ScrollArea className="h-full">
                      {emotionGifs.length > 0 ? (
                        renderGifGrid(emotionGifs)
                      ) : (
                        <div className="flex items-center justify-center h-32">
                          <p className="text-muted-foreground">No emotion GIFs available</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="reactions" className="h-full mt-0">
                    <ScrollArea className="h-full">
                      {reactionGifs.length > 0 ? (
                        renderGifGrid(reactionGifs)
                      ) : (
                        <div className="flex items-center justify-center h-32">
                          <p className="text-muted-foreground">No reaction GIFs available</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}