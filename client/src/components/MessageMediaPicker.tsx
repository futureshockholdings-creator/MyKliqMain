import { useState } from 'react';
import { Camera, Image, Film, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MemePicker } from '@/components/MemePicker';
import { MovieconPicker } from '@/components/MovieconPicker';
import { buildApiUrl } from '@/lib/apiConfig';
import { useToast } from '@/hooks/use-toast';
import type { Meme, Moviecon } from '@shared/schema';

interface MessageMediaPickerProps {
  onSelectMeme: (meme: Meme) => void;
  onSelectMoviecon: (moviecon: Moviecon) => void;
  onSelectMedia: (mediaUrl: string, mediaType: "image" | "video") => void;
}

export function MessageMediaPicker({ onSelectMeme, onSelectMoviecon, onSelectMedia }: MessageMediaPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState("meme");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleMediaUpload = (mediaUrl: string, mediaType: "image" | "video") => {
    onSelectMedia(mediaUrl, mediaType);
    setShowPicker(false);
  };

  const handleMemeSelect = (meme: Meme) => {
    onSelectMeme(meme);
    setShowPicker(false);
  };

  const handleMovieconSelect = (moviecon: Moviecon) => {
    onSelectMoviecon(moviecon);
    setShowPicker(false);
  };

  const uploadFile = async (file: File, mediaType: "image" | "video") => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const arrayBuffer = await file.arrayBuffer();
      
      const response = await fetch(buildApiUrl('/api/media/upload-direct'), {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: arrayBuffer,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      handleMediaUpload(data.mediaUrl, mediaType);
      toast({
        title: "Upload successful",
        description: `Your ${mediaType} has been uploaded.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (accept: string, mediaType: "image" | "video") => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await uploadFile(file, mediaType);
      }
    };
    input.click();
  };

  const standardButtonStyle = "bg-white text-black border-2 border-black hover:bg-gray-100 px-6 py-2";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPicker(true)}
        className="bg-white border border-black hover:bg-gray-50"
        data-testid="button-media-picker"
      >
        <Image className="w-5 h-5 text-green-600" />
      </Button>

      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Media to Message</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose a meme, moviecon, or upload a photo or video to attach to your message
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="meme" className="flex items-center gap-2" data-testid="tab-meme">
                <MessageSquare className="w-4 h-4" />
                MEMEs
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
              <TabsContent value="meme" className="mt-0">
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Select a MEME to share in your message
                  </p>
                  <MemePicker 
                    onSelectMeme={handleMemeSelect} 
                    trigger={
                      <Button className={standardButtonStyle}>
                        Select Meme
                      </Button>
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="moviecon" className="mt-0">
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Select a Moviecon to share in your message
                  </p>
                  <MovieconPicker 
                    onSelectMoviecon={handleMovieconSelect}
                    trigger={
                      <Button className={standardButtonStyle}>
                        Select Moviecon
                      </Button>
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="photo" className="mt-0">
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Choose a photo from your device to share
                  </p>
                  <Button
                    onClick={() => handleFileSelect('image/*', 'image')}
                    className={standardButtonStyle}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload Photo'
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="video" className="mt-0">
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Choose a video from your device to share
                  </p>
                  <Button
                    onClick={() => handleFileSelect('video/*', 'video')}
                    className={standardButtonStyle}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload Video'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
