import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Music, Trash2, Loader2, AlertTriangle, Settings, Info, Link, ExternalLink, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { convertToMP3, getFileRecommendations, isDRMProtected, getAudioFileInfo, type ConversionResult } from "@/lib/audioConverter";
import { ConversionGuide } from "./ConversionGuide";

interface MusicUploaderProps {
  currentMusicUrls?: string[];
  currentMusicTitles?: string[];
  userId: string;
}

interface MusicTrack {
  url: string;
  title: string;
}

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
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileRecommendations, setFileRecommendations] = useState<any>(null);
  const [showConversionGuide, setShowConversionGuide] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [activeTab, setActiveTab] = useState("url");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addTrack = () => {
    setTracks([...tracks, { url: "", title: "" }]);
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

  const uploadMusicMutation = useMutation({
    mutationFn: async ({ file, title }: { file: File; title: string }) => {
      setIsUploading(true);
      
      try {
        // Get presigned upload URL
        const uploadResponse = await fetch("/api/objects/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to get upload URL");
        }
        
        const uploadData = await uploadResponse.json();
        const { uploadURL } = uploadData;
        
        // Upload file to object storage
        const response = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });
        
        if (!response.ok) {
          throw new Error("Failed to upload music file");
        }
        
        // Add the uploaded track to the current tracks
        const uploadedUrl = uploadURL.split("?")[0]; // Remove query params from URL
        const newTracks = [...tracks];
        
        // Find first empty track or add new one
        const emptyIndex = newTracks.findIndex(track => !track.url);
        if (emptyIndex >= 0) {
          newTracks[emptyIndex] = { url: uploadedUrl, title };
        } else {
          newTracks.push({ url: uploadedUrl, title });
        }
        
        setTracks(newTracks);
        
        toast({
          title: "Upload successful",
          description: "Your music file has been uploaded. Click Save to apply changes.",
        });
        
        return { url: uploadedUrl, title };
      } finally {
        setIsUploading(false);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "There was an error uploading your music file.",
      });
    },
  });

  const saveMusicMutation = useMutation({
    mutationFn: async (tracksToSave: MusicTrack[]) => {
      // Filter out empty tracks
      const validTracks = tracksToSave.filter(track => track.url.trim() && track.title.trim());
      
      const musicUrls = validTracks.map(track => track.url);
      const musicTitles = validTracks.map(track => track.title);
      
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setProcessedFile(null);
    setConversionResult(null);

    const fileInfo = await getAudioFileInfo(file);
    setFileRecommendations(fileInfo);

    // Check for DRM protection
    if (isDRMProtected(file)) {
      toast({
        variant: "destructive",
        title: "DRM Protected File",
        description: "This file appears to be DRM protected and may not play properly. Consider using a different format.",
      });
    }
  };

  const processFileConversion = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const result = await convertToMP3(selectedFile);
      setConversionResult(result);
      
      if (result.success && result.convertedFile) {
        setProcessedFile(result.convertedFile);
        toast({
          title: "Conversion successful",
          description: "Your audio file has been converted to MP3 format.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Conversion failed",
          description: result.error || "Failed to convert audio file.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Conversion error",
        description: "An unexpected error occurred during conversion.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = () => {
    const fileToUpload = processedFile || selectedFile;
    if (!fileToUpload) return;

    // Use filename without extension as default title if not provided
    const defaultTitle = fileToUpload.name.replace(/\.[^/.]+$/, "");
    
    uploadMusicMutation.mutate({
      file: fileToUpload,
      title: defaultTitle,
    });
  };

  const handleSave = () => {
    saveMusicMutation.mutate(tracks);
  };

  const handleRemoveAll = () => {
    deleteMusicMutation.mutate();
  };

  const hasValidTracks = tracks.some(track => track.url.trim() && track.title.trim());
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Profile Music Playlist
          </DialogTitle>
          <DialogDescription>
            Add multiple songs that will play randomly when people visit your profile. Supports YouTube links and audio file uploads.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">YouTube Links</TabsTrigger>
            <TabsTrigger value="upload">Upload Audio</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Music Tracks</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTrack}
                  className="flex items-center gap-1"
                  data-testid="button-add-track"
                >
                  <Plus className="w-4 h-4" />
                  Add Track
                </Button>
              </div>

              {tracks.map((track, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Song Title</Label>
                      <Input
                        placeholder="Enter song title"
                        value={track.title}
                        onChange={(e) => updateTrack(index, 'title', e.target.value)}
                        data-testid={`input-title-${index}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">YouTube URL</Label>
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={track.url}
                        onChange={(e) => updateTrack(index, 'url', e.target.value)}
                        data-testid={`input-url-${index}`}
                      />
                    </div>
                  </div>
                  {tracks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTrack(index)}
                      className="text-destructive hover:text-destructive"
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
                  Add YouTube music links for your profile playlist. Songs will play randomly when people visit your profile.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Upload Audio File</Label>
                <Input
                  type="file"
                  accept="audio/*,.mp3,.m4a,.wav,.flac,.aac,.ogg,.wma"
                  onChange={handleFileChange}
                  className="mt-1"
                  data-testid="input-audio-file"
                />
              </div>

              {selectedFile && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>

                  {fileRecommendations && (
                    <Alert className={fileRecommendations.hasIssues ? "border-yellow-500" : "border-green-500"}>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        <div className="font-medium">File Analysis:</div>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {fileRecommendations.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    {!processedFile && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={processFileConversion}
                        disabled={isProcessing}
                        data-testid="button-convert"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          <>
                            <Settings className="w-4 h-4 mr-2" />
                            Convert to MP3
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      type="button"
                      onClick={handleUpload}
                      disabled={isUploading || (!selectedFile && !processedFile)}
                      data-testid="button-upload-file"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload {processedFile ? "Converted" : ""} File
                        </>
                      )}
                    </Button>
                  </div>

                  {conversionResult && !conversionResult.success && (
                    <Alert variant="destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        Conversion failed: {conversionResult.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <Button
                type="button"
                variant="link"
                onClick={() => setShowConversionGuide(true)}
                className="text-sm"
                data-testid="button-conversion-guide"
              >
                <Info className="w-4 h-4 mr-1" />
                Need help with audio formats?
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <div className="space-x-2">
            {currentMusicUrls.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleRemoveAll}
                disabled={deleteMusicMutation.isPending}
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
            <Button variant="outline" onClick={() => setIsOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasValidTracks || !hasChanges || saveMusicMutation.isPending}
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

        {showConversionGuide && (
          <ConversionGuide
            isOpen={showConversionGuide}
            onClose={() => setShowConversionGuide(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}