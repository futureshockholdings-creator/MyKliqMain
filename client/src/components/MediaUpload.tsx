import { useState } from "react";
import { SmartVideoUploader } from "./SmartVideoUploader";
import { ObjectUploader } from "./ObjectUploader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Video, X, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (uploadedObject?: any) => void;
  type: "post" | "story" | "event";
  userId: string;
}

export function MediaUpload({ open, onOpenChange, onSuccess, type, userId }: MediaUploadProps) {
  const [content, setContent] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: "image" | "video"; fileName?: string; fileSize?: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/media/upload");
      console.log("Upload parameters response:", response);
      
      if (!response?.uploadURL) {
        console.error("Invalid response:", response);
        throw new Error("No upload URL received from server");
      }
      
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload parameters:", error);
      toast({
        title: "Upload Error",
        description: "Failed to get upload URL. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: any) => {
    console.log("Upload complete result:", result);
    
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileType = uploadedFile.type;
      const mediaType = fileType.startsWith('image/') ? 'image' : 'video';
      
      // The URL should be the upload URL that was used
      const mediaUrl = uploadedFile.uploadURL || uploadedFile.response?.uploadURL;
      
      setUploadedMedia({
        url: mediaUrl,
        type: mediaType,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size
      });

      const sizeWarning = uploadedFile.size > 80 * 1024 * 1024; // Warn if over 80MB (close to 100MB limit)
      
      toast({
        title: "Media uploaded!",
        description: sizeWarning 
          ? `File uploaded successfully (${formatFileSize(uploadedFile.size)}). Note: This is a large file.`
          : "Your media file has been uploaded successfully."
      });
    } else if (result.failed && result.failed.length > 0) {
      console.error("Upload failed:", result.failed);
      toast({
        title: "Upload failed",
        description: "Failed to upload media. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (type === "event") {
      // For events, just pass the media data back to parent
      if (!uploadedMedia) {
        toast({
          title: "Error",
          description: "Please upload media for your event",
          variant: "destructive"
        });
        return;
      }
      
      const uploadedObject = {
        objectURL: uploadedMedia.url,
        type: uploadedMedia.type,
      };
      
      onSuccess(uploadedObject);
      onOpenChange(false);
      setContent("");
      setUploadedMedia(null);
      return;
    }

    if (!uploadedMedia && !content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content or media to your " + type,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const payload: any = {
        userId,
        content: content.trim() || null,
        mediaUrl: uploadedMedia?.url || null,
        mediaType: uploadedMedia?.type || null,
      };

      if (type === "story") {
        // Stories expire after 24 hours
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        payload.expiresAt = expiresAt.toISOString();
      }

      await apiRequest("POST", `/api/${type === "post" ? "posts" : "stories"}`, payload);
      
      toast({
        title: `${type === "post" ? "Post" : "Story"} created!`,
        description: `Your ${type} has been shared with your kliq on the Headlines`
      });

      onSuccess();
      onOpenChange(false);
      setContent("");
      setUploadedMedia(null);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create ${type}`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = () => {
    setUploadedMedia(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {type === "event" ? "Add Media to Event" : `Create ${type === "post" ? "Post" : "Story"}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {type !== "event" && (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's happening in your ${type === "post" ? "kliq" : "story"}?`}
              className="bg-input text-foreground placeholder-muted-foreground border-border"
              rows={3}
            />
          )}

          {uploadedMedia && (
            <>
              <Card className="relative bg-muted border-border">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {uploadedMedia.type === "image" ? (
                        <ImageIcon className="w-8 h-8 text-green-400" />
                      ) : (
                        <Video className="w-8 h-8 text-blue-400" />
                      )}
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {uploadedMedia.type === "image" ? "Image" : "Video"} uploaded
                        </p>
                        {uploadedMedia.fileName && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {uploadedMedia.fileName}
                          </p>
                        )}
                        {uploadedMedia.fileSize && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadedMedia.fileSize)}
                            {uploadedMedia.fileSize > 80 * 1024 * 1024 && " ⚠️ Large file"}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={removeMedia}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {uploadedMedia.fileSize && uploadedMedia.fileSize > 80 * 1024 * 1024 && uploadedMedia.type === "video" && (
                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-3">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      💡 <strong>Tip:</strong> Large videos may take longer to upload and view. Consider compressing your video before uploading for faster sharing and better compatibility.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={104857600} // 100MB
                allowedFileTypes={[
                  // Image formats
                  'image/*',
                  '.jpg', '.jpeg', '.png', '.gif', '.webp',
                  '.heic', '.heif', '.bmp', '.tiff', '.tif',
                  // Video formats  
                  'video/*',
                  '.mp4', '.mov', '.hevc', '.h265', '.avi',
                  '.mkv', '.3gp', '.webm'
                ]}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="bg-white text-black border-2 border-black hover:bg-gray-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                📸📹 Add Photos & Videos
              </ObjectUploader>
              <p className="text-xs text-muted-foreground text-center">
                Supports: JPEG, PNG, GIF, WebP, HEIC, MP4, MOV, HEVC, 3GP, WebM + more (max 100MB)
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-border text-muted-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
{type === "event" 
                  ? (isUploading ? "Uploading..." : "Upload Media")
                  : (isUploading ? "Sharing..." : `Share ${type === "post" ? "Post" : "Story"}`)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}