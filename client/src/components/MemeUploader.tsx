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
import { buildApiUrl } from "@/lib/apiConfig";
import type { Meme } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

interface MemeUploaderProps {
  memes: Meme[];
  onRefresh: () => void;
  adminPassword?: string;
}

export function MemeUploader({ memes, onRefresh, adminPassword }: MemeUploaderProps) {
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

  const handleGetUploadParameters = async (file: { name: string; type: string; size: number }) => {
    try {
      console.log(`Requesting upload URL for file: ${file.name}`);
      // Try public upload first for better visibility
      let response;
      try {
        response = await apiRequest("POST", "/api/objects/upload-public-meme");
      } catch (publicError) {
        console.warn("Public upload not available, falling back to private upload:", publicError);
        // Fallback to regular upload if public is not configured
        response = await apiRequest("POST", "/api/objects/upload");
      }
      
      console.log(`Got unique upload URL for: ${file.name}`);
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
    const totalFiles = result.successful?.length || 0;
    let successCount = 0;
    let failCount = 0;

    try {
      // Process uploads in batches of 5 to avoid overwhelming the server
      const BATCH_SIZE = 5;
      const files = result.successful || [];
      
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (uploadedFile, batchIndex) => {
          const index = i + batchIndex;
          try {
            const presignedUrl = uploadedFile.uploadURL || '';
            const imageUrl = presignedUrl.split('?')[0];
            
            console.log(`File ${index + 1}/${totalFiles}: processing...`);
            
            const fileName = uploadedFile.name || `Meme ${index + 1}`;
            
            let memeTitle;
            if (title.trim()) {
              memeTitle = totalFiles > 1 ? `${title.trim()} ${index + 1}` : title.trim();
            } else {
              memeTitle = fileName.replace(/\.[^/.]+$/, "");
            }

            await apiRequest("POST", "/api/memes", {
              title: memeTitle,
              description: description.trim() || undefined,
              imageUrl: imageUrl,
              category: "general",
              isAnimated: fileName.toLowerCase().includes('.gif') || fileName.toLowerCase().includes('.webp'),
            });
            
            successCount++;
            return { success: true };
          } catch (error) {
            console.error(`Failed to save meme ${index + 1}:`, error);
            failCount++;
            return { success: false, error };
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches to let the server breathe
        if (i + BATCH_SIZE < files.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (failCount === 0) {
        toast({
          title: "Success!",
          description: `${successCount} meme${successCount > 1 ? 's' : ''} uploaded successfully`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: `${successCount} uploaded, ${failCount} failed. Try uploading failed files again.`,
          variant: failCount > successCount ? "destructive" : "default",
        });
      }

      setTitle("");
      setDescription("");
      onRefresh();
    } catch (error) {
      console.error("Error creating meme records:", error);
      toast({
        title: "Upload failed",
        description: `Uploaded ${successCount} of ${totalFiles}. Try again for remaining files.`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMeme = async (memeId: string) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (adminPassword) {
        headers['x-admin-password'] = adminPassword;
      }
      
      const response = await fetch(buildApiUrl(`/api/memes/${memeId}`), {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Delete failed');
      }
      
      toast({
        title: "Success",
        description: "Meme deleted successfully",
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting meme:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete meme",
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
            Add new memes to your collection. Supports all popular formats: JPEG, JPG, PNG, GIF, WebP, HEIC, HEIF, BMP, TIFF from iOS and Android devices.
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
            maxNumberOfFiles={500}
            maxFileSize={250 * 1024 * 1024} // 250MB per file
            allowedFileTypes={[
              'image/*',
              '.jpg',
              '.jpeg',
              '.png',
              '.gif',
              '.webp',
              '.heic',
              '.heif',
              '.bmp',
              '.tiff',
              '.tif'
            ]}
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="w-full"
          >
            <div className="flex items-center justify-center gap-2 p-4">
              <Image className="w-5 h-5" />
              {isUploading ? "Uploading..." : "📸 Select Image Files (JPEG, PNG, GIF, WebP, HEIC, etc.)"}
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