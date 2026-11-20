import { useRef, useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadSinglePart } from "@/lib/singlePartUpload";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ObjectUploadResult = UploadResult<Record<string, unknown>, Record<string, unknown>>;

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onGetUploadParameters: (file: { name: string; type: string; size: number }) => Promise<{
    method: "PUT";
    url: string;
    headers?: Record<string, string>;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void | Promise<unknown>;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  allowedFileTypes,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const [retry, setRetry] = useState<{ result?: ObjectUploadResult } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const latest = useRef({ onGetUploadParameters, onComplete });
  latest.current = { onGetUploadParameters, onComplete };
  const completing = useRef(false);
  const retryLock = useRef(false);

  const finishUpload = async (result: ObjectUploadResult) => {
    if (completing.current) return;
    completing.current = true;
    setIsRetrying(true);
    try {
      if (result.failed?.length) {
        setRetry({});
        return; // Keep all files so retryAll can resume the failed transfer.
      }
      if (!result.successful?.length) return;
      await latest.current.onComplete?.(result);
      setRetry(null);
      setShowModal(false);
      // Only discard files after BOTH transfer and profile/media save succeed.
      uppy.cancelAll();
    } catch {
      setRetry({ result }); // Retry saving the uploaded URL; don't re-upload.
    } finally {
      completing.current = false;
      retryLock.current = false;
      setIsRetrying(false);
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const [uppy] = useState<Uppy>(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: allowedFileTypes || ['*'], // Use provided types or allow all
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        uploadPartBytes: uploadSinglePart,
        getUploadParameters: async (file) => {
          const params = await latest.current.onGetUploadParameters({
            name: file.name || 'file',
            type: file.type || 'application/octet-stream',
            size: file.size || 0,
          });
          return {
            ...params,
            headers: { "Content-Type": file.type || "application/octet-stream", ...params.headers },
          };
        },
      })
      .on("restriction-failed", (file, error) => {
        console.error("Upload restriction failed:", error);
        
        let errorMessage = "Upload failed";
        let description = error.message;
        
        if (file) {
          const fileSize = formatFileSize(file.size || 0);
          const maxSize = formatFileSize(maxFileSize);
          
          if (error.message.includes("exceeds maximum allowed size")) {
            errorMessage = "File too large";
            description = `"${file.name}" is ${fileSize}, but the maximum size is ${maxSize}. Please choose a smaller file.`;
          } else if (error.message.includes("type is not allowed")) {
            errorMessage = "Unsupported file type";
            const fileExt = file.name?.split('.').pop()?.toUpperCase() || "this type";
            description = `${fileExt} files are not supported. Please choose a different file format.`;
          } else if (error.message.includes("maximum number of files")) {
            errorMessage = "Too many files";
            description = `You can only upload ${maxNumberOfFiles} file${maxNumberOfFiles > 1 ? 's' : ''} at a time.`;
          }
        }
        
        toast({
          title: errorMessage,
          description,
          variant: "destructive",
        });
      })
      .on("upload-error", (file, error) => {
        // The completion handler presents a retry action and retains the file.
        // Never log presigned storage URLs or the full upload error payload.
        console.warn("[ObjectUploader] Transfer interrupted");
      })
      .on("complete", (result) => {
        void finishUpload(result);
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0" aria-describedby={undefined}>
          <DialogHeader className="px-4 pt-4 pb-2 pr-12 text-left">
            <DialogTitle>Upload files</DialogTitle>
          </DialogHeader>
          <Dashboard
            uppy={uppy}
            width="100%"
            height="min(650px, calc(100dvh - 8rem))"
            proudlyDisplayPoweredByUppy={false}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog open={retry !== null} onOpenChange={open => { if (!open && !isRetrying) setRetry(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Try that again</AlertDialogTitle>
            <AlertDialogDescription>
              {retry?.result
                ? "Your file uploaded, but the change hasn’t been saved yet. We’ve kept it ready so you can try again."
                : "Your upload couldn’t be finished yet. We’ve kept your selection so you can try again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRetrying}>Not now</AlertDialogCancel>
            <Button
              data-testid="button-retry-upload"
              disabled={isRetrying}
              onClick={() => {
                if (!retry || isRetrying || retryLock.current) return;
                retryLock.current = true;
                if (retry.result) {
                  void finishUpload(retry.result);
                } else {
                  setIsRetrying(true);
                  void uppy.retryAll().catch(() => {
                    retryLock.current = false;
                    setIsRetrying(false);
                  });
                }
              }}
            >
              {isRetrying ? "Trying again…" : "Try again"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}