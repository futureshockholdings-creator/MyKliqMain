import { useState } from "react";
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Trash2, Upload } from "lucide-react";

interface Moviecon {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
}

interface MovieconUploaderProps {
  moviecons: Moviecon[];
  onRefresh: () => void;
}

export function MovieconUploader({ moviecons, onRefresh }: MovieconUploaderProps) {
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload parameters:", error);
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (!result.successful || result.successful.length === 0) {
      toast({
        title: "Upload failed",
        description: "No files were uploaded successfully",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Process all uploaded files
      const uploadPromises = result.successful?.map(async (uploadedFile, index) => {
        const videoUrl = uploadedFile.uploadURL;
        const fileName = uploadedFile.name || `Video ${index + 1}`;
        
        // Use title if provided, otherwise use filename without extension
        let movieconTitle;
        if (title.trim()) {
          movieconTitle = (result.successful?.length || 0) > 1 ? `${title.trim()} ${index + 1}` : title.trim();
        } else {
          movieconTitle = fileName.replace(/\.[^/.]+$/, ""); // Remove file extension
        }

        // Create the moviecon record
        return apiRequest("POST", "/api/moviecons", {
          title: movieconTitle,
          url: videoUrl,
        });
      }) || [];

      await Promise.all(uploadPromises);

      toast({
        title: "Success!",
        description: `${result.successful?.length || 0} moviecon${(result.successful?.length || 0) > 1 ? 's' : ''} uploaded successfully`,
      });

      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["/api/moviecons"] });
      onRefresh();
    } catch (error) {
      console.error("Error creating moviecons:", error);
      toast({
        title: "Upload failed",
        description: "Failed to save moviecon details",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (movieconId: string, movieconTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${movieconTitle}"?`)) {
      return;
    }

    try {
      await apiRequest("DELETE", `/api/moviecons/${movieconId}`);

      toast({
        title: "Deleted",
        description: `Moviecon "${movieconTitle}" has been deleted`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/moviecons"] });
      onRefresh();
    } catch (error) {
      console.error("Error deleting moviecon:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete moviecon",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6" data-testid="moviecon-uploader">
      {/* Upload Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Upload New Moviecon</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload multiple MP4 video files (up to 50 files, 100MB each). Supported format: .mp4
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="moviecon-title" className="text-foreground">
              Moviecon Title (Optional)
            </Label>
            <Input
              id="moviecon-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title (optional - will use filename if empty)"
              className="bg-background border-border text-foreground"
              data-testid="input-moviecon-title"
            />
          </div>

          <ObjectUploader
            maxNumberOfFiles={50} // Allow up to 50 files at once
            maxFileSize={100 * 1024 * 1024} // 100MB limit per MP4 video file
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            allowedFileTypes={['.mp4', 'video/mp4']}
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>📹 Upload MP4 Video Files (up to 50)</span>
            </div>
          </ObjectUploader>

          {isUploading && (
            <div className="text-muted-foreground text-sm">
              Processing upload...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Moviecons */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Your Moviecons ({moviecons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {moviecons.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              No moviecons uploaded yet. Upload your first video above!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {moviecons.map((moviecon) => (
                <div
                  key={moviecon.id}
                  className="relative group bg-muted/30 rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
                  data-testid={`moviecon-item-${moviecon.id}`}
                >
                  {/* Video Thumbnail */}
                  <div className="aspect-video relative bg-black">
                    <video
                      src={moviecon.url}
                      className="w-full h-full object-cover"
                      data-testid={`video-${moviecon.id}`}
                      preload="metadata"
                      muted
                    />
                    {/* Delete Button Overlay */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 shadow-lg"
                      onClick={() => handleDelete(moviecon.id, moviecon.title)}
                      data-testid={`button-delete-${moviecon.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-black border-y-[4px] border-y-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Title at Bottom */}
                  <div className="p-3 bg-card">
                    <h3 className="text-sm font-medium text-foreground truncate" title={moviecon.title}>
                      {moviecon.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}