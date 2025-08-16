import { useState } from 'react';
import { Camera, Image, Film, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GifPicker } from '@/components/GifPicker';
import { MovieconPicker } from '@/components/MovieconPicker';
import { MediaUpload } from '@/components/MediaUpload';
import type { Gif, Moviecon } from '@shared/schema';

interface MessageMediaPickerProps {
  onSelectGif: (gif: Gif) => void;
  onSelectMoviecon: (moviecon: Moviecon) => void;
  onSelectMedia: (mediaUrl: string, mediaType: "image" | "video") => void;
}

export function MessageMediaPicker({ onSelectGif, onSelectMoviecon, onSelectMedia }: MessageMediaPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState("gif");

  const handleMediaUpload = (mediaUrl: string, mediaType: "image" | "video") => {
    onSelectMedia(mediaUrl, mediaType);
    setShowPicker(false);
  };

  const handleGifSelect = (gif: Gif) => {
    onSelectGif(gif);
    setShowPicker(false);
  };

  const handleMovieconSelect = (moviecon: Moviecon) => {
    onSelectMoviecon(moviecon);
    setShowPicker(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPicker(true)}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        data-testid="button-media-picker"
      >
        <Image className="w-5 h-5" />
      </Button>

      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Add Media to Message</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPicker(false)}
                data-testid="button-close-media-picker"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="gif" className="flex items-center gap-2" data-testid="tab-gif">
                <MessageSquare className="w-4 h-4" />
                GIFs
              </TabsTrigger>
              <TabsTrigger value="moviecon" className="flex items-center gap-2" data-testid="tab-moviecon">
                <Film className="w-4 h-4" />
                Moviecons
              </TabsTrigger>
              <TabsTrigger value="photo" className="flex items-center gap-2" data-testid="tab-photo">
                <Image className="w-4 h-4" />
                Photos
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2" data-testid="tab-video">
                <Camera className="w-4 h-4" />
                Videos
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 max-h-[60vh] overflow-y-auto">
              <TabsContent value="gif" className="mt-0">
                <GifPicker onSelectGif={handleGifSelect} />
              </TabsContent>

              <TabsContent value="moviecon" className="mt-0">
                <MovieconPicker onSelectMoviecon={handleMovieconSelect} />
              </TabsContent>

              <TabsContent value="photo" className="mt-0">
                <div className="text-center py-6">
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          // For now, create a temporary URL for demo
                          const url = URL.createObjectURL(file);
                          handleMediaUpload(url, "image");
                        }
                      };
                      input.click();
                    }}
                    className="mx-auto"
                  >
                    Upload Photo
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    Choose a photo from your device to share
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="video" className="mt-0">
                <div className="text-center py-6">
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'video/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          // For now, create a temporary URL for demo
                          const url = URL.createObjectURL(file);
                          handleMediaUpload(url, "video");
                        }
                      };
                      input.click();
                    }}
                    className="mx-auto"
                  >
                    Upload Video
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    Choose a video from your device to share
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}