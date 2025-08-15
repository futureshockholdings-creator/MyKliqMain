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

  const { data: funGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/fun'],
    enabled: activeTab === 'fun'
  });

  const { data: disapprovalGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/disapproval'],
    enabled: activeTab === 'disapproval'
  });

  const { data: surpriseGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/surprise'],
    enabled: activeTab === 'surprise'
  });

  const { data: yesGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/yes'],
    enabled: activeTab === 'yes'
  });

  const { data: noGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/no'],
    enabled: activeTab === 'no'
  });

  const { data: gratitudeGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/gratitude'],
    enabled: activeTab === 'gratitude'
  });

  const { data: birthdayGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/birthday'],
    enabled: activeTab === 'birthday'
  });

  const { data: congratulationsGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/congratulations'],
    enabled: activeTab === 'congratulations'
  });

  const { data: anniversaryGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/anniversary'],
    enabled: activeTab === 'anniversary'
  });

  const { data: christmasGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/christmas'],
    enabled: activeTab === 'christmas'
  });

  const { data: halloweenGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/halloween'],
    enabled: activeTab === 'halloween'
  });

  const { data: thanksgivingGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/thanksgiving'],
    enabled: activeTab === 'thanksgiving'
  });

  const { data: newYearGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/new-year'],
    enabled: activeTab === 'new-year'
  });

  const { data: valentinesGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/valentines'],
    enabled: activeTab === 'valentines'
  });

  const { data: easterGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/easter'],
    enabled: activeTab === 'easter'
  });

  const { data: fourthJulyGifs = [] } = useQuery<Gif[]>({
    queryKey: ['/api/gifs/category/fourth-july'],
    enabled: activeTab === 'fourth-july'
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
    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 p-4">
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
      <DialogContent className="max-w-4xl h-[700px] bg-card text-foreground">
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
                <ScrollArea className="w-full mb-4">
                  <div className="flex gap-2 p-2 min-w-max">
                    <Button
                      variant={activeTab === 'trending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('trending')}
                      className="flex items-center gap-2 whitespace-nowrap"
                      data-testid="tab-trending"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Trending
                    </Button>
                    <Button
                      variant={activeTab === 'featured' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('featured')}
                      className="flex items-center gap-2 whitespace-nowrap"
                      data-testid="tab-featured"
                    >
                      <Star className="h-4 w-4" />
                      Featured
                    </Button>
                    <Button
                      variant={activeTab === 'emotions' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('emotions')}
                      className="whitespace-nowrap"
                      data-testid="tab-emotions"
                    >
                      Emotions
                    </Button>
                    <Button
                      variant={activeTab === 'reactions' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('reactions')}
                      className="whitespace-nowrap"
                      data-testid="tab-reactions"
                    >
                      Reactions
                    </Button>
                    <Button
                      variant={activeTab === 'fun' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('fun')}
                      className="whitespace-nowrap"
                      data-testid="tab-fun"
                    >
                      Fun
                    </Button>
                    <Button
                      variant={activeTab === 'disapproval' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('disapproval')}
                      className="whitespace-nowrap"
                      data-testid="tab-disapproval"
                    >
                      Disapproval
                    </Button>
                    <Button
                      variant={activeTab === 'surprise' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('surprise')}
                      className="whitespace-nowrap"
                      data-testid="tab-surprise"
                    >
                      Surprise
                    </Button>
                    <Button
                      variant={activeTab === 'yes' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('yes')}
                      className="whitespace-nowrap"
                      data-testid="tab-yes"
                    >
                      Yes
                    </Button>
                    <Button
                      variant={activeTab === 'no' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('no')}
                      className="whitespace-nowrap"
                      data-testid="tab-no"
                    >
                      No
                    </Button>
                    <Button
                      variant={activeTab === 'gratitude' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('gratitude')}
                      className="whitespace-nowrap"
                      data-testid="tab-gratitude"
                    >
                      Thank You
                    </Button>
                    <Button
                      variant={activeTab === 'birthday' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('birthday')}
                      className="whitespace-nowrap"
                      data-testid="tab-birthday"
                    >
                      Birthday
                    </Button>
                    <Button
                      variant={activeTab === 'congratulations' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('congratulations')}
                      className="whitespace-nowrap"
                      data-testid="tab-congratulations"
                    >
                      Congrats
                    </Button>
                    <Button
                      variant={activeTab === 'anniversary' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('anniversary')}
                      className="whitespace-nowrap"
                      data-testid="tab-anniversary"
                    >
                      Anniversary
                    </Button>
                    <Button
                      variant={activeTab === 'christmas' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('christmas')}
                      className="whitespace-nowrap"
                      data-testid="tab-christmas"
                    >
                      Christmas
                    </Button>
                    <Button
                      variant={activeTab === 'halloween' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('halloween')}
                      className="whitespace-nowrap"
                      data-testid="tab-halloween"
                    >
                      Halloween
                    </Button>
                    <Button
                      variant={activeTab === 'thanksgiving' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('thanksgiving')}
                      className="whitespace-nowrap"
                      data-testid="tab-thanksgiving"
                    >
                      Thanksgiving
                    </Button>
                    <Button
                      variant={activeTab === 'new-year' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('new-year')}
                      className="whitespace-nowrap"
                      data-testid="tab-new-year"
                    >
                      New Year
                    </Button>
                    <Button
                      variant={activeTab === 'valentines' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('valentines')}
                      className="whitespace-nowrap"
                      data-testid="tab-valentines"
                    >
                      Valentine's
                    </Button>
                    <Button
                      variant={activeTab === 'easter' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('easter')}
                      className="whitespace-nowrap"
                      data-testid="tab-easter"
                    >
                      Easter
                    </Button>
                    <Button
                      variant={activeTab === 'fourth-july' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab('fourth-july')}
                      className="whitespace-nowrap"
                      data-testid="tab-fourth-july"
                    >
                      4th of July
                    </Button>
                  </div>
                </ScrollArea>

                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full pr-4">
                    <div className="pr-2">
                      {activeTab === 'trending' && (
                        trendingGifs.length > 0 ? renderGifGrid(trendingGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No trending GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'featured' && (
                        featuredGifs.length > 0 ? renderGifGrid(featuredGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No featured GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'emotions' && (
                        emotionGifs.length > 0 ? renderGifGrid(emotionGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No emotion GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'reactions' && (
                        reactionGifs.length > 0 ? renderGifGrid(reactionGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No reaction GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'fun' && (
                        funGifs.length > 0 ? renderGifGrid(funGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No fun GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'disapproval' && (
                        disapprovalGifs.length > 0 ? renderGifGrid(disapprovalGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No disapproval GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'surprise' && (
                        surpriseGifs.length > 0 ? renderGifGrid(surpriseGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No surprise GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'yes' && (
                        yesGifs.length > 0 ? renderGifGrid(yesGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No yes GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'no' && (
                        noGifs.length > 0 ? renderGifGrid(noGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No no GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'gratitude' && (
                        gratitudeGifs.length > 0 ? renderGifGrid(gratitudeGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No gratitude GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'birthday' && (
                        birthdayGifs.length > 0 ? renderGifGrid(birthdayGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No birthday GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'congratulations' && (
                        congratulationsGifs.length > 0 ? renderGifGrid(congratulationsGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No congratulations GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'anniversary' && (
                        anniversaryGifs.length > 0 ? renderGifGrid(anniversaryGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No anniversary GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'christmas' && (
                        christmasGifs.length > 0 ? renderGifGrid(christmasGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No Christmas GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'halloween' && (
                        halloweenGifs.length > 0 ? renderGifGrid(halloweenGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No Halloween GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'thanksgiving' && (
                        thanksgivingGifs.length > 0 ? renderGifGrid(thanksgivingGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No Thanksgiving GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'new-year' && (
                        newYearGifs.length > 0 ? renderGifGrid(newYearGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No New Year GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'valentines' && (
                        valentinesGifs.length > 0 ? renderGifGrid(valentinesGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No Valentine's GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'easter' && (
                        easterGifs.length > 0 ? renderGifGrid(easterGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No Easter GIFs available</p>
                          </div>
                        )
                      )}

                      {activeTab === 'fourth-july' && (
                        fourthJulyGifs.length > 0 ? renderGifGrid(fourthJulyGifs) : (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">No 4th of July GIFs available</p>
                          </div>
                        )
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </Tabs>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}