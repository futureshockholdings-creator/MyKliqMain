import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Music, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MusicUploaderProps {
  currentMusicUrl?: string;
  currentMusicTitle?: string;
  userId: string;
}

export function MusicUploader({ currentMusicUrl, currentMusicTitle, userId }: MusicUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [musicTitle, setMusicTitle] = useState(currentMusicTitle || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file (MP3, WAV, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      if (!musicTitle) {
        setMusicTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !musicTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a file and enter a title",
        variant: "destructive",
      });
      return;
    }
    
    uploadMusicMutation.mutate({ file: selectedFile, title: musicTitle.trim() });
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
            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
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
            className="w-full border-pink-500 text-pink-400 hover:bg-pink-500/20"
            data-testid="button-upload-music"
          >
            <Music className="w-4 h-4 mr-2" />
            {currentMusicUrl ? "Change Music" : "Add Profile Music"}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-pink-400">Upload Profile Music</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="music-title" className="text-gray-300">
                Song Title
              </Label>
              <Input
                id="music-title"
                value={musicTitle}
                onChange={(e) => setMusicTitle(e.target.value)}
                placeholder="Enter song title"
                className="bg-gray-700 border-gray-600 text-white"
                data-testid="input-music-title"
              />
            </div>
            
            <div>
              <Label htmlFor="music-file" className="text-gray-300">
                Audio File (MP3, WAV, etc.)
              </Label>
              <div className="mt-2">
                <Input
                  id="music-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="bg-gray-700 border-gray-600 text-white file:bg-pink-500 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
                  data-testid="input-music-file"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-400 mt-1">
                    Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !musicTitle.trim() || isUploading}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
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
                    Upload Music
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedFile(null);
                  setMusicTitle(currentMusicTitle || "");
                }}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}