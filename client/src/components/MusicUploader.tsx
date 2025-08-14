import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Music, Trash2, Loader2, AlertTriangle, Settings, Info, Link, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { convertToMP3, getFileRecommendations, isDRMProtected, getAudioFileInfo, type ConversionResult } from "@/lib/audioConverter";
import { ConversionGuide } from "./ConversionGuide";

interface MusicUploaderProps {
  currentMusicUrl?: string;
  currentMusicTitle?: string;
  userId: string;
}

export function MusicUploader({ currentMusicUrl, currentMusicTitle, userId }: MusicUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [musicTitle, setMusicTitle] = useState(currentMusicTitle || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [musicUrl, setMusicUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileRecommendations, setFileRecommendations] = useState<any>(null);
  const [showConversionGuide, setShowConversionGuide] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        
        // Update user profile with music info
        return await apiRequest("PUT", "/api/user/profile-music", {
          musicUrl: uploadURL.split("?")[0], // Remove query params from URL
          musicTitle: title,
        });
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Music uploaded!",
        description: "Your profile music has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsOpen(false);
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload music file",
        variant: "destructive",
      });
    },
  });

  // URL-based music upload mutation
  const uploadUrlMusicMutation = useMutation({
    mutationFn: async ({ url, title }: { url: string; title: string }) => {
      return await apiRequest("PUT", "/api/user/profile-music", {
        musicUrl: url,
        musicTitle: title,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile music updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsOpen(false);
      setMusicUrl("");
      setMusicTitle("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile music",
        variant: "destructive",
      });
    },
  });

  const removeMusicMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/user/profile-music");
    },
    onSuccess: () => {
      toast({
        title: "Music removed",
        description: "Your profile music has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Remove failed",
        description: error.message || "Failed to remove music",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (audio files only, including .m4p)
    const validAudioTypes = [
      'audio/',
      'application/x-m4p', // For .m4p files
    ];
    
    const validExtensions = ['.mp3', '.wav', '.m4a', '.m4p', '.aac', '.ogg', '.flac'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    const isValidType = validAudioTypes.some(type => file.type.startsWith(type)) || 
                       validExtensions.includes(fileExtension);
    
    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file (MP3, WAV, M4A, M4P, AAC, OGG, FLAC)",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 15 * 1024 * 1024) { // Increased to 15MB to allow for conversion
      toast({
        title: "File too large",
        description: "Please select a file smaller than 15MB",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
    setProcessedFile(null);
    setConversionResult(null);
    
    // Get file recommendations (async)
    const recommendations = await getFileRecommendations(file);
    setFileRecommendations(recommendations);
    
    if (!musicTitle) {
      setMusicTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    
    // Auto-process file if it needs conversion
    if (recommendations.canProcess && recommendations.recommendation !== "File ready to use") {
      await handleFileConversion(file);
    }
  };

  const handleFileConversion = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const result = await convertToMP3(file);
      setConversionResult(result);
      
      if (result.success && result.blob) {
        // Create a new File object from the blob
        const convertedFile = new File([result.blob], 
          file.name.replace(/\.[^/.]+$/, '.wav'), 
          { type: 'audio/wav' }
        );
        setProcessedFile(convertedFile);
        
        toast({
          title: "Conversion successful",
          description: `File converted from ${result.originalFormat} to optimized format`,
        });
      } else {
        toast({
          title: "Conversion failed",
          description: result.error || "Unable to convert file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Processing error",
        description: "An unexpected error occurred during conversion",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    const fileToUpload = processedFile || selectedFile;
    
    if (!fileToUpload || !musicTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a file and enter a title",
        variant: "destructive",
      });
      return;
    }
    
    const isDRM = await isDRMProtected(selectedFile!);
    if (isDRM && !processedFile) {
      toast({
        title: "Cannot upload DRM-protected file",
        description: "Please convert this file using desktop software first",
        variant: "destructive",
      });
      return;
    }
    
    uploadMusicMutation.mutate({ file: fileToUpload, title: musicTitle.trim() });
  };

  const handleUrlUpload = () => {
    if (!musicUrl.trim() || !musicTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both a URL and title",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(musicUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    uploadUrlMusicMutation.mutate({ url: musicUrl.trim(), title: musicTitle.trim() });
  };

  const extractTitleFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      
      // YouTube URL handling
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        const urlParams = new URLSearchParams(urlObj.search);
        let videoId = '';
        
        if (urlObj.hostname.includes('youtube.com')) {
          videoId = urlParams.get('v') || '';
        } else if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.split('/').pop() || '';
        }
        
        if (videoId) {
          // Try to get title from YouTube API or provide a default
          return `YouTube Music - ${videoId}`;
        }
        return 'YouTube Music';
      }
      
      // SoundCloud URL handling
      if (urlObj.hostname.includes('soundcloud.com')) {
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        if (pathSegments.length >= 2) {
          return decodeURIComponent(pathSegments[pathSegments.length - 1].replace(/-/g, ' '));
        }
        return 'SoundCloud Track';
      }
      
      // Generic URL handling - extract filename or last segment
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];
      
      if (lastSegment && lastSegment.includes('.')) {
        // Remove file extension and decode URI
        return decodeURIComponent(lastSegment.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      
      return `Music from ${urlObj.hostname}`;
    } catch {
      return '';
    }
  };

  const handleUrlChange = (url: string) => {
    setMusicUrl(url);
    
    // Auto-fill title if empty
    if (!musicTitle && url) {
      const extractedTitle = extractTitleFromUrl(url);
      if (extractedTitle) {
        setMusicTitle(extractedTitle);
      }
    }
  };

  return (
    <div className="space-y-2">
      {currentMusicUrl && (
        <div className="flex items-center gap-2 p-2 bg-pink-500/20 rounded-lg">
          <Music className="w-4 h-4 text-pink-400" />
          <span className="text-sm text-pink-400 flex-1 truncate">
            {currentMusicTitle || "Profile Music"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeMusicMutation.mutate()}
            disabled={removeMusicMutation.isPending}
            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            data-testid="button-remove-music"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary text-primary hover:bg-primary/10"
            data-testid="button-upload-music"
          >
            <Music className="w-4 h-4 mr-2" />
            {currentMusicUrl ? "Change Music" : "Add Profile Music"}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-primary">Add Profile Music</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Upload a music file or paste a web URL to set your profile music
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Upload className="w-4 h-4 mr-1" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="url" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Link className="w-4 h-4 mr-1" />
                Web URL
              </TabsTrigger>
            </TabsList>

            {/* Shared Title Input */}
            <div className="mt-4">
              <Label htmlFor="music-title" className="text-foreground">
                Song Title
              </Label>
              <Input
                id="music-title"
                value={musicTitle}
                onChange={(e) => setMusicTitle(e.target.value)}
                placeholder="Enter song title"
                className="bg-input border-border text-foreground"
                data-testid="input-music-title"
              />
            </div>

            <TabsContent value="upload" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="music-file" className="text-foreground">
                  Audio File (MP3, WAV, M4A, M4P, AAC, OGG, FLAC)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Note: M4P files with DRM protection may not play in web browsers
                </p>
                <div className="mt-2">
                  <Input
                    id="music-file"
                    type="file"
                    accept="audio/*,.m4p,.m4a,.mp3,.wav,.aac,.ogg,.flac"
                    onChange={handleFileSelect}
                    className="bg-gray-700 border-gray-600 text-white file:bg-pink-500 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
                    data-testid="input-music-file"
                  />
                {selectedFile && (
                  <div className="mt-2 space-y-2">
                    <div className="p-3 bg-muted rounded border">
                      <p className="text-sm text-foreground font-medium">
                        Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                      </p>
                      
                      {isProcessing && (
                        <div className="flex items-center gap-2 mt-2 text-primary">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Processing file...</span>
                        </div>
                      )}
                      
                      {processedFile && (
                        <div className="flex items-center gap-2 mt-2 text-primary">
                          <Settings className="w-4 h-4" />
                          <span className="text-sm">
                            Converted: {processedFile.name} ({Math.round(processedFile.size / 1024)}KB)
                          </span>
                        </div>
                      )}
                      
                      {fileRecommendations && (
                        <Alert className={`mt-2 ${
                          fileRecommendations.canProcess 
                            ? fileRecommendations.recommendation === "File ready to use" 
                              ? "border-primary/30 bg-primary/10" 
                              : "border-secondary/30 bg-secondary/10"
                            : "border-destructive/30 bg-destructive/10"
                        }`}>
                          <div className="flex items-start gap-2">
                            {fileRecommendations.canProcess ? (
                              fileRecommendations.recommendation === "File ready to use" ? (
                                <Info className="w-4 h-4 text-primary mt-0.5" />
                              ) : (
                                <Settings className="w-4 h-4 text-secondary-foreground mt-0.5" />
                              )
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${
                                fileRecommendations.canProcess 
                                  ? fileRecommendations.recommendation === "File ready to use"
                                    ? "text-primary" 
                                    : "text-secondary-foreground"
                                  : "text-destructive"
                              }`}>
                                {fileRecommendations.recommendation}
                              </div>
                              <AlertDescription className="text-xs text-muted-foreground mt-1">
                                {fileRecommendations.message}
                              </AlertDescription>
                              {fileRecommendations.suggestedTools.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium text-muted-foreground mb-1">Suggestions:</div>
                                  <ul className="text-xs text-foreground space-y-1">
                                    {fileRecommendations.suggestedTools.map((tool: string, index: number) => (
                                      <li key={index} className="flex items-start gap-1">
                                        <span className="text-muted-foreground">•</span>
                                        <span>{tool}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {!fileRecommendations.canProcess && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowConversionGuide(true)}
                                      className="mt-2 text-xs border-muted-foreground text-muted-foreground hover:bg-muted"
                                    >
                                      <Info className="w-3 h-3 mr-1" />
                                      View Detailed Guide
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* DRM Detection and Guide Button */}
            {selectedFile && fileRecommendations && !fileRecommendations.canProcess && (
              <Alert className="border-muted bg-muted/10">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <AlertDescription className="text-muted-foreground">
                  <div className="font-medium mb-2">DRM-Protected File Detected</div>
                  <div className="text-sm space-y-2">
                    <p>This file contains copy protection that prevents web playback.</p>
                    <Button
                      onClick={() => setShowConversionGuide(true)}
                      variant="outline"
                      size="sm"
                      className="border-muted-foreground text-muted-foreground hover:bg-muted"
                    >
                      <Info className="w-4 h-4 mr-2" />
                      View Conversion Guide
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Manual Conversion Button for large files */}
            {selectedFile && !processedFile && fileRecommendations?.canProcess && 
             fileRecommendations?.recommendation === "Convert to compressed format" && (
              <Button
                onClick={() => handleFileConversion(selectedFile)}
                disabled={isProcessing}
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/10"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Convert to Optimized Format
                  </>
                )}
              </Button>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={
                  !selectedFile || 
                  !musicTitle.trim() || 
                  isUploading || 
                  isProcessing ||
                  (!fileRecommendations?.canProcess && !processedFile)
                }
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                data-testid="button-confirm-upload"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {processedFile ? "Converted " : ""}Music
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedFile(null);
                  setProcessedFile(null);
                  setFileRecommendations(null);
                  setConversionResult(null);
                  setMusicTitle(currentMusicTitle || "");
                }}
                disabled={isUploading || isProcessing}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
            </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="music-url" className="text-foreground">
                  Music URL
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Paste a YouTube link for embedded player or direct audio file URL
                </p>
                <div className="mt-2">
                  <Input
                    id="music-url"
                    type="url"
                    value={musicUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or direct audio URL"
                    className="bg-input border-border text-foreground"
                    data-testid="input-music-url"
                  />
                </div>
                
                {musicUrl && (
                  <div className="mt-2 p-3 bg-muted rounded border">
                    <div className="flex items-start gap-2">
                      <ExternalLink className="w-4 h-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">URL Preview</p>
                        <p className="text-xs text-primary break-all">{musicUrl}</p>
                      </div>
                    </div>
                    
                    {musicUrl.includes('youtube.com') || musicUrl.includes('youtu.be') ? (
                      <Alert className="mt-2 border-primary/30 bg-primary/10">
                        <Music className="w-4 h-4 text-primary" />
                        <AlertDescription className="text-foreground text-xs">
                          <div className="font-medium mb-1">YouTube Music Detected</div>
                          <p>Perfect! This will show as a YouTube embed player on your profile for easy music sharing.</p>
                        </AlertDescription>
                      </Alert>
                    ) : musicUrl.includes('soundcloud.com') ? (
                      <Alert className="mt-2 border-secondary/30 bg-secondary/10">
                        <Info className="w-4 h-4 text-secondary-foreground" />
                        <AlertDescription className="text-foreground text-xs">
                          <div className="font-medium mb-1">SoundCloud Link</div>
                          <p>SoundCloud links should work well for profile music playback.</p>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="mt-2 border-muted/30 bg-muted/10">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <AlertDescription className="text-muted-foreground text-xs">
                          <div className="font-medium mb-1">Direct Audio URL</div>
                          <p>Make sure this URL directly points to an audio file (MP3, WAV, etc.) for best compatibility.</p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUrlUpload}
                  disabled={
                    !musicUrl.trim() || 
                    !musicTitle.trim() || 
                    uploadUrlMusicMutation.isPending
                  }
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                  data-testid="button-save-url"
                >
                  {uploadUrlMusicMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      Save Music URL
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsOpen(false);
                    setMusicUrl("");
                    setMusicTitle(currentMusicTitle || "");
                  }}
                  disabled={uploadUrlMusicMutation.isPending}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  data-testid="button-cancel-url"
                >
                  Cancel
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Conversion Guide Modal */}
      {showConversionGuide && selectedFile && (
        <ConversionGuide
          fileName={selectedFile.name}
          fileFormat={selectedFile.name.substring(selectedFile.name.lastIndexOf('.'))}
          onClose={() => setShowConversionGuide(false)}
        />
      )}
    </div>
  );
}