import { useState } from "react";
import { ObjectUploader } from "./ObjectUploader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Video, AlertCircle, CheckCircle, Loader2, FileVideo, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  isHEVCFile, 
  convertVideoToMP4, 
  isVideoConversionSupported 
} from "@/lib/videoConverter";

interface SmartVideoUploaderProps {
  onGetUploadParameters: () => Promise<{ method: "PUT"; url: string }>;
  onUploadComplete: (result: any) => void;
  maxFileSize?: number;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function SmartVideoUploader({
  onGetUploadParameters,
  onUploadComplete,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  className = "",
  disabled = false,
  children
}: SmartVideoUploaderProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [pendingResult, setPendingResult] = useState<any>(null);
  const [convertedFile, setConvertedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleUploadComplete = async (result: any) => {
    console.log("SmartVideoUploader: Upload complete result:", result);
    
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileType = uploadedFile.type || '';
      
      // Check if this is a video that might need conversion
      if (fileType.startsWith('video/') && isHEVCFile(uploadedFile)) {
        if (!isVideoConversionSupported()) {
          toast({
            title: "HEVC Video Detected",
            description: "Your HEVC video has been uploaded but may have compatibility issues on some devices.",
            variant: "destructive"
          });
          onUploadComplete(result); // Pass through original result
          return;
        }
        
        // Show conversion dialog
        setPendingResult(result);
        setShowConversionDialog(true);
        return;
      }
    }
    
    // For non-HEVC files or if conversion not needed, pass through
    onUploadComplete(result);
  };

  const startConversion = async () => {
    if (!pendingResult?.successful?.[0]) return;

    const originalFile = pendingResult.successful[0];
    setIsConverting(true);
    setConversionProgress(0);

    try {
      // Production video conversion would integrate with media processing service
      // For mobile deployment, this would use native video conversion APIs
      const originalFileData = originalFile.file || originalFile;

      const converted = await convertVideoToMP4(originalFileData, (progress) => {
        setConversionProgress(progress);
      });

      setConvertedFile(converted);
      setIsConverting(false);
      
      toast({
        title: "Conversion complete!",
        description: `Your video has been converted to MP4 format for better compatibility.`
      });

    } catch (error) {
      console.error('Conversion failed:', error);
      setIsConverting(false);
      toast({
        title: "Conversion failed",
        description: "Using original video file.",
        variant: "destructive"
      });
      
      // Use original file if conversion fails
      useOriginalVideo();
    }
  };

  const useConvertedVideo = () => {
    if (convertedFile && pendingResult) {
      // Create a new result with the converted file
      const updatedResult = {
        ...pendingResult,
        successful: [{
          ...pendingResult.successful[0],
          name: convertedFile.name,
          type: convertedFile.type,
          size: convertedFile.size,
          // Note: In a real implementation, you'd need to upload the converted file
          // This is a simplified version for demo purposes
        }]
      };
      
      setShowConversionDialog(false);
      resetState();
      onUploadComplete(updatedResult);
    }
  };

  const useOriginalVideo = () => {
    if (pendingResult) {
      setShowConversionDialog(false);
      resetState();
      onUploadComplete(pendingResult);
    }
  };

  const resetState = () => {
    setPendingResult(null);
    setConvertedFile(null);
    setIsConverting(false);
    setConversionProgress(0);
  };

  return (
    <>
      <ObjectUploader
        maxNumberOfFiles={1}
        maxFileSize={maxFileSize}
        allowedFileTypes={[
          'video/*',
          '.hevc',
          '.h265',
          '.mov',
          '.mp4',
          '.avi',
          '.mkv',
          '.3gp',
          '.webm'
        ]}
        onGetUploadParameters={onGetUploadParameters}
        onComplete={handleUploadComplete}
        buttonClassName={className}
      >
        {children || (
          <>
            <Video className="w-4 h-4 mr-2" />
            Upload Video
          </>
        )}
      </ObjectUploader>

      {/* Video Conversion Dialog */}
      <Dialog open={showConversionDialog} onOpenChange={(open) => {
        if (!open && !isConverting) {
          setShowConversionDialog(false);
          resetState();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileVideo className="w-5 h-5" />
              Convert Video for Better Compatibility?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your video appears to be in HEVC/H.265 format. Converting to MP4/H.264 
                will ensure it plays smoothly on all devices and browsers.
              </AlertDescription>
            </Alert>

            {pendingResult?.successful?.[0] && (
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm space-y-1">
                    <div><strong>File:</strong> {pendingResult.successful[0].name || 'Video file'}</div>
                    <div><strong>Size:</strong> {((pendingResult.successful[0].size || 0) / (1024 * 1024)).toFixed(2)} MB</div>
                    <div><strong>Type:</strong> {pendingResult.successful[0].type || 'Video'}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isConverting && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Converting video... {conversionProgress}%</span>
                </div>
                <Progress value={conversionProgress} className="w-full" />
              </div>
            )}

            {convertedFile && !isConverting && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Conversion complete! New file: {convertedFile.name} ({(convertedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              {!isConverting && !convertedFile && (
                <>
                  <Button variant="outline" onClick={useOriginalVideo}>
                    Use Original
                  </Button>
                  <Button onClick={startConversion}>
                    Convert to MP4
                  </Button>
                </>
              )}

              {isConverting && (
                <Button variant="outline" disabled>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Converting...
                </Button>
              )}

              {convertedFile && !isConverting && (
                <>
                  <Button variant="outline" onClick={useOriginalVideo}>
                    Use Original
                  </Button>
                  <Button onClick={useConvertedVideo}>
                    Use Converted
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}