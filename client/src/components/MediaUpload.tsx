import { useState, useRef, useEffect } from "react";
import { SmartVideoUploader } from "./SmartVideoUploader";
import { ObjectUploader } from "./ObjectUploader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Video, X, Upload, Camera, StopCircle, Circle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UploadResult = any;

interface UploadedMediaObject {
  objectURL: string;
  type: "image" | "video";
}

interface MediaUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (uploadedObject?: UploadedMediaObject) => void;
  type: "post" | "story" | "event";
  userId: string;
}

export function MediaUpload({ open, onOpenChange, onSuccess, type, userId }: MediaUploadProps) {
  const [content, setContent] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: "image" | "video"; fileName?: string; fileSize?: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  // Camera state
  const [cameraMode, setCameraMode] = useState<"off" | "preview" | "photo" | "video">("off");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<{ blob: Blob; type: "image" | "video" } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      
      setStream(mediaStream);
      setCameraMode("preview");
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      toast({
        title: "Camera ready!",
        description: "Choose to take a photo or record a video"
      });
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to capture photos and videos",
        variant: "destructive"
      });
    }
  };

  const stopCamera = (preserveCaptured = false) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraMode("off");
    setIsRecording(false);
    setRecordingTime(0);
    
    // Only clear captured media if we're not preserving it
    if (!preserveCaptured) {
      setCapturedMedia(null);
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedMedia({ blob, type: "image" });
        setCameraMode("off");
        stopCamera(true); // Preserve the captured photo
        
        toast({
          title: "Photo captured!",
          description: "Review your photo and upload when ready"
        });
      }
    }, 'image/jpeg', 0.95);
  };

  const startVideoRecording = () => {
    if (!stream) return;
    
    recordedChunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      setCapturedMedia({ blob, type: "video" });
      setCameraMode("off");
      stopCamera(true); // Preserve the captured video
      
      toast({
        title: "Video recorded!",
        description: "Review your video and upload when ready"
      });
    };
    
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingTime(0);
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const uploadCapturedMedia = async () => {
    if (!capturedMedia) return;
    
    try {
      const fileName = `camera-${Date.now()}.${capturedMedia.type === "image" ? "jpg" : "webm"}`;
      const file = new File([capturedMedia.blob], fileName, {
        type: capturedMedia.type === "image" ? "image/jpeg" : "video/webm"
      });
      
      const uploadParams = await handleGetUploadParameters();
      
      const uploadResponse = await fetch(uploadParams.url, {
        method: uploadParams.method,
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const mediaUrl = uploadParams.url.split('?')[0];
      
      setUploadedMedia({
        url: mediaUrl,
        type: capturedMedia.type,
        fileName: fileName,
        fileSize: capturedMedia.blob.size
      });
      
      setCapturedMedia(null);
      
      toast({
        title: "Media uploaded!",
        description: "Your captured media has been uploaded successfully."
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload captured media. Please try again.",
        variant: "destructive"
      });
    }
  };

  const retakeCapturedMedia = () => {
    setCapturedMedia(null);
    startCamera();
  };

  // Cleanup on unmount or dialog close
  useEffect(() => {
    if (!open) {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open]);

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/media/upload");
      
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

  const handleUploadComplete = async (result: UploadResult) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileType = uploadedFile.type || '';
      const mediaType = fileType.startsWith('image/') ? 'image' : 'video';
      
      const mediaUrl = uploadedFile.uploadURL || uploadedFile.response?.uploadURL || '';
      
      setUploadedMedia({
        url: mediaUrl,
        type: mediaType,
        fileName: uploadedFile.name || 'uploaded-file',
        fileSize: uploadedFile.size || 0
      });

      const sizeWarning = (uploadedFile.size || 0) > 200 * 1024 * 1024;
      
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
        description: result.failed[0]?.error || "Failed to upload media. Please try again.",
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
      const payload: {
        userId: string;
        content: string | null;
        mediaUrl: string | null;
        mediaType: "image" | "video" | null;
        expiresAt?: string;
      } = {
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
      <DialogContent className="sm:max-w-xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {type === "event" ? "Add Media to Event" : `Create ${type === "post" ? "Post" : "Story"}`}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {type === "event" 
              ? "Upload photos or videos for your event (max 250MB)" 
              : `Share photos or videos with your kliq (max 250MB)`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {type !== "event" && (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's happening in your ${type === "post" ? "kliq" : "story"}?`}
              className="bg-white text-black placeholder-gray-500 border-gray-300"
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
                            {uploadedMedia.fileSize > 200 * 1024 * 1024 && " ⚠️ Large file"}
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
              
              {uploadedMedia.fileSize && uploadedMedia.fileSize > 200 * 1024 * 1024 && uploadedMedia.type === "video" && (
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

          {/* Camera Preview */}
          {cameraMode === "preview" && (
            <Card className="relative bg-black border-border overflow-hidden">
              <CardContent className="p-0">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto max-h-96 object-cover"
                  data-testid="camera-preview"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex justify-center items-center space-x-4">
                    <Button
                      onClick={takePhoto}
                      className="bg-white hover:bg-gray-100 text-black"
                      size="lg"
                      data-testid="button-take-photo"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Take Photo
                    </Button>
                    
                    {!isRecording ? (
                      <Button
                        onClick={startVideoRecording}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="lg"
                        data-testid="button-start-recording"
                      >
                        <Circle className="w-5 h-5 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        onClick={stopVideoRecording}
                        className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        size="lg"
                        data-testid="button-stop-recording"
                      >
                        <StopCircle className="w-5 h-5 mr-2" />
                        Stop ({formatTime(recordingTime)})
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => stopCamera()}
                      variant="outline"
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                      data-testid="button-close-camera"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Captured Media Preview */}
          {capturedMedia && (
            <Card className="relative bg-muted border-border">
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {capturedMedia.type === "image" ? (
                        <ImageIcon className="w-8 h-8 text-green-400" />
                      ) : (
                        <Video className="w-8 h-8 text-blue-400" />
                      )}
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {capturedMedia.type === "image" ? "Photo" : "Video"} captured
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(capturedMedia.blob.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={uploadCapturedMedia}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-upload-captured"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button
                      onClick={retakeCapturedMedia}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-retake"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Retake
                    </Button>
                    <Button
                      onClick={() => setCapturedMedia(null)}
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      data-testid="button-discard-captured"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Options */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={262144000} // 250MB
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
                buttonClassName="bg-white text-black border-2 border-black hover:bg-gray-50 w-full sm:w-auto"
              >
                <Upload className="w-4 h-4 mr-2" />
                📸 Add Photos & Videos
              </ObjectUploader>
              
              <Button
                onClick={startCamera}
                disabled={cameraMode !== "off" || !!capturedMedia || !!uploadedMedia}
                className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700 w-full sm:w-auto"
                data-testid="button-access-camera"
              >
                <Camera className="w-4 h-4 mr-2" />
                📷 Access Camera
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-border text-muted-foreground hover:bg-muted w-full sm:w-auto"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                data-testid="button-submit-post"
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