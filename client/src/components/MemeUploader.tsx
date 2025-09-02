import { useState } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, Upload, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Meme } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

interface MemeUploaderProps {
  memes: Meme[];
  onRefresh: () => void;
}

export function MemeUploader({ memes, onRefresh }: MemeUploaderProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Filter memes based on search query
  const filteredMemes = memes.filter(meme =>
    meme.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meme.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        const imageUrl = uploadedFile.uploadURL;
        const fileName = uploadedFile.name || `Meme ${index + 1}`;
        
        // Use title if provided, otherwise use filename without extension
        let memeTitle;
        if (title.trim()) {
          memeTitle = (result.successful?.length || 0) > 1 ? `${title.trim()} ${index + 1}` : title.trim();
        } else {
          memeTitle = fileName.replace(/\.[^/.]+$/, ""); // Remove file extension
        }

        // Create the meme record
        return apiRequest("POST", "/api/memes", {
          title: memeTitle,
          description: description.trim() || undefined,
          imageUrl: imageUrl,
          category: "general",
          isAnimated: fileName.toLowerCase().includes('.gif'),
        });
      }) || [];

      await Promise.all(uploadPromises);

      toast({
        title: "Success!",
        description: `${result.successful?.length || 0} meme${(result.successful?.length || 0) > 1 ? 's' : ''} uploaded successfully`,
      });

      setTitle("");
      setDescription("");
      onRefresh();
    } catch (error) {
      console.error("Error creating meme records:", error);
      toast({
        title: "Upload failed",
        description: "Failed to create meme records",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMeme = async (memeId: string) => {
    try {
      await apiRequest("DELETE", `/api/memes/${memeId}`);
      toast({
        title: "Success",
        description: "Meme deleted successfully",
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting meme:", error);
      toast({
        title: "Error",
        description: "Failed to delete meme",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card data-testid="meme-upload-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload New Meme
          </CardTitle>
          <CardDescription>
            Add new memes to your collection. Supports JPEG, PNG, GIF, and WebP formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="meme-title" className="text-sm font-medium">
                Title (optional)
              </label>
              <Input
                id="meme-title"
                placeholder="Enter meme title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-meme-title"
              />
            </div>
            <div>
              <label htmlFor="meme-description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="meme-description"
                placeholder="Enter meme description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                data-testid="input-meme-description"
              />
            </div>
          </div>

          <ObjectUploader
            maxNumberOfFiles={50}
            maxFileSize={50 * 1024 * 1024} // 50MB
            allowedFileTypes={['image/*']}
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="w-full"
          >
            <div className="flex items-center justify-center gap-2 p-4">
              <Image className="w-5 h-5" />
              {isUploading ? "Uploading..." : "Select Meme Files"}
            </div>
          </ObjectUploader>
        </CardContent>
      </Card>

      {/* Existing Memes Section */}
      <Card data-testid="meme-list-card">
        <CardHeader>
          <CardTitle>Your Memes ({memes.length})</CardTitle>
          <CardDescription>
            Manage your existing memes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search memes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-memes"
              />
            </div>
          </div>

          {/* Memes Grid */}
          {filteredMemes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {memes.length === 0 ? "No memes uploaded yet" : "No memes match your search"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMemes.map((meme) => (
                <div
                  key={meme.id}
                  className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                  data-testid={`meme-card-${meme.id}`}
                >
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={meme.imageUrl}
                      alt={meme.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate" title={meme.title}>
                          {meme.title}
                        </h3>
                        {meme.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2" title={meme.description}>
                            {meme.description}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteMeme(meme.id)}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0 flex-shrink-0"
                        data-testid={`button-delete-meme-${meme.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-1 flex-wrap">
                      {meme.category && (
                        <Badge variant="secondary" className="text-xs">
                          {meme.category}
                        </Badge>
                      )}
                      {meme.isAnimated && (
                        <Badge variant="outline" className="text-xs">
                          GIF
                        </Badge>
                      )}
                    </div>
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