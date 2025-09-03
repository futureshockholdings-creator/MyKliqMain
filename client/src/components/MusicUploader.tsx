import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Music, Trash2, Loader2, Settings, Info, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MusicUploaderProps {
  currentMusicUrls?: string[];
  currentMusicTitles?: string[];
  userId: string;
}

interface MusicTrack {
  url: string;
  title: string;
}

const MAX_TRACKS = 10;

export function MusicUploader({ currentMusicUrls = [], currentMusicTitles = [], userId }: MusicUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tracks, setTracks] = useState<MusicTrack[]>(() => {
    // Initialize tracks from current data
    const initialTracks: MusicTrack[] = [];
    for (let i = 0; i < Math.max(currentMusicUrls.length, currentMusicTitles.length); i++) {
      initialTracks.push({
        url: currentMusicUrls[i] || "",
        title: currentMusicTitles[i] || ""
      });
    }
    return initialTracks.length > 0 ? initialTracks : [{ url: "", title: "" }];
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addTrack = () => {
    if (tracks.length < MAX_TRACKS) {
      setTracks([...tracks, { url: "", title: "" }]);
    }
  };

  const removeTrack = (index: number) => {
    if (tracks.length > 1) {
      setTracks(tracks.filter((_, i) => i !== index));
    }
  };

  const updateTrack = (index: number, field: 'url' | 'title', value: string) => {
    const newTracks = [...tracks];
    newTracks[index][field] = value;
    setTracks(newTracks);
  };

  const isValidYouTubeUrl = (url: string) => {
    if (!url || !url.trim()) return false;
    const trimmedUrl = url.trim();
    // More flexible YouTube URL patterns
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];
    
    return patterns.some(pattern => pattern.test(trimmedUrl));
  };

  const saveMusicMutation = useMutation({
    mutationFn: async (tracksToSave: MusicTrack[]) => {
      // Filter out empty tracks and validate YouTube URLs
      const validTracks = tracksToSave.filter(track => {
        const hasUrl = track.url.trim();
        const isValidUrl = hasUrl ? isValidYouTubeUrl(track.url) : false;
        return hasUrl && isValidUrl;
      });
      
      if (validTracks.length === 0) {
        throw new Error("Please enter at least one valid YouTube URL");
      }
      
      const musicUrls = validTracks.map(track => track.url);
      const musicTitles = validTracks.map(track => track.title || `YouTube Track ${validTracks.indexOf(track) + 1}`);
      
      return await apiRequest("PUT", "/api/user/profile-music", {
        musicUrls,
        musicTitles,
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile music updated",
        description: "Your music playlist has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "There was an error updating your profile music.",
      });
    },
  });

  const deleteMusicMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/user/profile-music", {});
    },
    onSuccess: () => {
      toast({
        title: "Profile music removed",
        description: "All music has been removed from your profile.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setTracks([{ url: "", title: "" }]);
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Removal failed",
        description: error.message || "There was an error removing your profile music.",
      });
    },
  });

  const handleSave = () => {
    saveMusicMutation.mutate(tracks);
  };

  const handleRemoveAll = () => {
    deleteMusicMutation.mutate();
  };

  // Check if we have at least one valid track (only URL required)
  const hasValidTracks = tracks.some(track => {
    const hasUrl = track.url && track.url.trim();
    const isValidUrl = hasUrl ? isValidYouTubeUrl(track.url) : false;
    return hasUrl && isValidUrl;
  });

  const hasChanges = JSON.stringify(tracks) !== JSON.stringify(
    currentMusicUrls.map((url, i) => ({ url, title: currentMusicTitles[i] || "" }))
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" data-testid="button-music-settings">
          <Settings className="w-4 h-4 mr-2" />
          {currentMusicUrls.length > 0 ? `Manage Music (${currentMusicUrls.length} tracks)` : "Add Profile Music"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Profile Music Playlist
          </DialogTitle>
          <DialogDescription>
            Add 1-10 YouTube songs that will play randomly when people visit your profile. Only YouTube links are supported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">YouTube Music Tracks</Label>
            {tracks.length < MAX_TRACKS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTrack}
                className="flex items-center gap-1 text-foreground"
                data-testid="button-add-track"
              >
                <Plus className="w-4 h-4" />
                Add Track ({tracks.length}/{MAX_TRACKS})
              </Button>
            )}
          </div>

          {tracks.map((track, index) => (
            <div key={index} className="flex gap-2 items-start p-3 border border-border rounded-lg bg-card">
              <div className="flex-1 space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">YouTube URL</Label>
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={track.url}
                    onChange={(e) => updateTrack(index, 'url', e.target.value)}
                    data-testid={`input-url-${index}`}
                    className={track.url && !isValidYouTubeUrl(track.url) ? "border-destructive" : ""}
                  />
                  {track.url && !isValidYouTubeUrl(track.url) && (
                    <p className="text-xs text-destructive mt-1">Please enter a valid YouTube URL</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Song Title (Optional)</Label>
                  <Input
                    placeholder="Optional - will auto-generate if empty"
                    value={track.title}
                    onChange={(e) => updateTrack(index, 'title', e.target.value)}
                    data-testid={`input-title-${index}`}
                  />
                </div>
              </div>
              {tracks.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTrack(index)}
                  className="text-destructive hover:text-destructive bg-transparent"
                  data-testid={`button-remove-${index}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}

          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Add YouTube music links for your profile playlist. Songs will play randomly when people visit your profile. Only YouTube URL is required - song titles are optional and will auto-generate if empty. You can add 1-10 tracks maximum.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div className="space-x-2">
            {currentMusicUrls.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleRemoveAll}
                disabled={deleteMusicMutation.isPending}
                className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                data-testid="button-remove-all"
              >
                {deleteMusicMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove All
                  </>
                )}
              </Button>
            )}
          </div>
          
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              className="text-foreground border-border hover:bg-accent hover:text-accent-foreground"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasValidTracks || saveMusicMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-save"
            >
              {saveMusicMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Playlist"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}