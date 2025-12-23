import { useState } from "react";
import { ObjectUploader } from "./ObjectUploader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Video, FileVideo, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  isHEVCFile, 
  convertVideoToMP4, 
  isVideoConversionSupported 
} from "@/lib/videoConverter";

interface VideoConversionUploadProps {
  onGetUploadParameters: (file: { name: string; type: string; size: number }) => Promise<{ method: "PUT"; url: string }>;
  onUploadComplete: (result: any) => void;
  maxFileSize?: number;
  className?: string;
  disabled?: boolean;
}

export function VideoConversionUpload({
  onGetUploadParameters,
  onUploadComplete,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  className = "",
  disabled = false
}: VideoConversionUploadProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'complete' | 'error'>('idle');
  const [convertedFile, setConvertedFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const { toast } = useToast();

  const handleFileSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setOriginalFile(file);

    // Check if the file needs conversion
    if (isHEVCFile(file)) {
      if (!isVideoConversionSupported()) {
        toast({
          title: "Conversion not supported",
          description: "Your browser doesn't support video conversion. Please convert the file manually or use a different browser.",
          variant: "destructive"
        });
        return;
      }

      setShowConversionDialog(true);
      setConversionStatus('idle');
    } else {
      // File doesn't need conversion, proceed directly
      proceedWithUpload(file);
    }
  };

  const startConversion = async () => {
    if (!originalFile) return;

    setIsConverting(true);
    setConversionStatus('converting');
    setConversionProgress(0);

    try {
      const converted = await convertVideoToMP4(originalFile, (progress) => {
        setConversionProgress(progress);
      });

      setConvertedFile(converted);
      setConversionStatus('complete');
      
      toast({
        title: "Conversion complete!",
        description: `Your ${originalFile.name} has been converted to MP4 format.`
      });

    } catch (error) {
      console.error('Conversion failed:', error);
      setConversionStatus('error');
      toast({
        title: "Conversion failed",
        description: "Failed to convert video. You can try uploading the original file or convert it manually.",
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };

  const proceedWithUpload = (file: File) => {
    setShowConversionDialog(false);
    // Trigger the upload with the file (original or converted)
    // This would integrate with your existing upload system
    onUploadComplete({ successful: [{ file }] });
  };

  const handleUploadConverted = () => {
    if (convertedFile) {
      proceedWithUpload(convertedFile);
    }
  };

  const handleUploadOriginal = () => {
    if (originalFile) {
      proceedWithUpload(originalFile);
    }
  };

  return (
    <>
      {/* File selector that checks for HEVC */}
      <input
        type="file"
        accept="video/*"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleFileSelected(files);
        }}
        className={className}
        disabled={disabled}
        style={{ display: 'none' }}
        id="video-upload-input"
      />
      
      <Button 
        onClick={() => document.getElementById('video-upload-input')?.click()}
        disabled={disabled}
        className={className}
      >
        <Video className="w-4 h-4 mr-2" />
        Upload Video
      </Button>

      {/* Conversion Dialog */}
      <Dialog open={showConversionDialog} onOpenChange={setShowConversionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileVideo className="w-5 h-5" />
              Video Conversion Required
            </DialogTitle>
            <DialogDescription>
              Convert your HEVC/H.265 video to MP4/H.264 format for better compatibility across all devices
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your video appears to be in HEVC/H.265 format. For better compatibility, 
                we recommend converting it to MP4/H.264 format.
              </AlertDescription>
            </Alert>

            {originalFile && (
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm space-y-1">
                    <div><strong>File:</strong> {originalFile.name}</div>
                    <div><strong>Size:</strong> {(originalFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                    <div><strong>Type:</strong> {originalFile.type || 'Unknown'}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {conversionStatus === 'converting' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Converting video... {conversionProgress}%</span>
                </div>
                <Progress value={conversionProgress} className="w-full" />
              </div>
            )}

            {conversionStatus === 'complete' && convertedFile && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Conversion complete! New file size: {(convertedFile.size / (1024 * 1024)).toFixed(2)} MB
                </AlertDescription>
              </Alert>
            )}

            {conversionStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Conversion failed. You can still upload the original file, but it may not play on all devices.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              {conversionStatus === 'idle' && (
                <>
                  <Button variant="outline" onClick={handleUploadOriginal}>
                    Upload Original
                  </Button>
                  <Button onClick={startConversion} disabled={isConverting}>
                    Convert to MP4
                  </Button>
                </>
              )}

              {conversionStatus === 'converting' && (
                <Button variant="outline" onClick={() => setShowConversionDialog(false)}>
                  Cancel
                </Button>
              )}

              {conversionStatus === 'complete' && (
                <>
                  <Button variant="outline" onClick={handleUploadOriginal}>
                    Upload Original
                  </Button>
                  <Button onClick={handleUploadConverted}>
                    Upload Converted
                  </Button>
                </>
              )}

              {conversionStatus === 'error' && (
                <>
                  <Button variant="outline" onClick={handleUploadOriginal}>
                    Upload Original
                  </Button>
                  <Button onClick={startConversion}>
                    Try Again
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