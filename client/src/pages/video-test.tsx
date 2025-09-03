import { useState } from "react";
import { SmartVideoUploader } from "@/components/SmartVideoUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Video, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isVideoConversionSupported } from "@/lib/videoConverter";

export default function VideoTest() {
  const [uploadResults, setUploadResults] = useState<any[]>([]);
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

  const handleUploadComplete = (result: any) => {
    console.log("Upload complete:", result);
    
    setUploadResults(prev => [...prev, {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      result
    }]);

    if (result.successful && result.successful.length > 0) {
      toast({
        title: "Upload successful!",
        description: `${result.successful[0].name || 'Video'} has been uploaded.`
      });
    }
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
          <Video className="w-8 h-8" />
          Video Conversion Test
        </h1>
        <p className="text-muted-foreground">
          Test HEVC to MP4 video conversion functionality
        </p>
      </div>

      {/* Browser Support Status */}
      <Alert>
        {isVideoConversionSupported() ? (
          <>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Your browser supports video conversion! You can upload HEVC files and convert them to MP4.
            </AlertDescription>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ Your browser doesn't support video conversion (requires SharedArrayBuffer). 
              HEVC files will be uploaded without conversion.
            </AlertDescription>
          </>
        )}
      </Alert>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Upload Video File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Supported formats: MP4, MOV, HEVC, H.265, AVI, MKV</p>
            <p>• HEVC/H.265 files will prompt for conversion to MP4</p>
            <p>• Maximum file size: 50MB</p>
          </div>
          
          <SmartVideoUploader
            onGetUploadParameters={handleGetUploadParameters}
            onUploadComplete={handleUploadComplete}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          />
        </CardContent>
      </Card>

      {/* Results Section */}
      {uploadResults.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upload Results</CardTitle>
            <button
              onClick={clearResults}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadResults.map((upload) => (
              <div key={upload.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {upload.timestamp}
                  </span>
                  <Badge variant={upload.result.successful?.length > 0 ? "default" : "destructive"}>
                    {upload.result.successful?.length > 0 ? "Success" : "Failed"}
                  </Badge>
                </div>
                
                {upload.result.successful?.map((file: any, idx: number) => (
                  <div key={idx} className="text-sm space-y-1 bg-muted p-2 rounded">
                    <div><strong>Name:</strong> {file.name || 'Unknown'}</div>
                    <div><strong>Type:</strong> {file.type || 'Unknown'}</div>
                    <div><strong>Size:</strong> {file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown'}</div>
                    {file.uploadURL && (
                      <div className="text-xs text-muted-foreground break-all">
                        <strong>URL:</strong> {file.uploadURL}
                      </div>
                    )}
                  </div>
                ))}
                
                {upload.result.failed?.length > 0 && (
                  <div className="text-sm text-destructive">
                    <strong>Failed files:</strong> {upload.result.failed.length}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong>
          <br />
          1. Upload any video file using the button above
          <br />
          2. If the file is HEVC/H.265 format, you'll be prompted to convert it
          <br />
          3. Choose to convert for better compatibility or use the original file
          <br />
          4. The file will be uploaded to your object storage
        </AlertDescription>
      </Alert>
    </div>
  );
}