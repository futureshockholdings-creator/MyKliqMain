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
      const response = await apiRequest("/api/objects/upload", "POST");
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
      const uploadPromises = result.successful.map(async (uploadedFile, index) => {
        const videoUrl = uploadedFile.uploadURL;
        const fileName = uploadedFile.name || `Video ${index + 1}`;
        
        // Use title if provided, otherwise use filename without extension
        let movieconTitle;
        if (title.trim()) {
          movieconTitle = result.successful.length > 1 ? `${title.trim()} ${index + 1}` : title.trim();
        } else {
          movieconTitle = fileName.replace(/\.[^/.]+$/, ""); // Remove file extension
        }

        // Create the moviecon record
        return apiRequest("/api/moviecons", "POST", {
          title: movieconTitle,
          url: videoUrl,
        });
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Success!",
        description: `${result.successful.length} moviecon${result.successful.length > 1 ? 's' : ''} uploaded successfully`,
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
      await apiRequest(`/api/moviecons/${movieconId}`, "DELETE");

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
            Upload multiple MP4 video files (up to 10 files, 100MB each). Supported format: .mp4
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
            maxNumberOfFiles={10} // Allow up to 10 files at once
            maxFileSize={100 * 1024 * 1024} // 100MB limit per MP4 video file
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            allowedFileTypes={['.mp4', 'video/mp4']}
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>📹 Upload MP4 Video Files (up to 10)</span>
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
            Current Moviecons ({moviecons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {moviecons.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              No moviecons uploaded yet. Upload your first video above!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {moviecons.map((moviecon) => (
                <div
                  key={moviecon.id}
                  className="bg-background border border-border rounded-lg p-4 space-y-3"
                  data-testid={`moviecon-item-${moviecon.id}`}
                >
                  <video
                    src={moviecon.url}
                    className="w-full h-32 object-cover rounded bg-muted"
                    controls
                    preload="metadata"
                  />
                  <div className="space-y-2">
                    <h3 className="font-medium text-foreground truncate">
                      {moviecon.title}
                    </h3>
                    <Button
                      onClick={() => handleDelete(moviecon.id, moviecon.title)}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      data-testid={`button-delete-${moviecon.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
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