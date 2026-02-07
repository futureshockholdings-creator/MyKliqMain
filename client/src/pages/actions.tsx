import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { buildApiUrl, buildWebSocketUrl, resolveAssetUrl } from "@/lib/apiConfig";
import fixWebmDuration from "fix-webm-duration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, 
  Users, 
  MessageCircle, 
  Send, 
  Play, 
  Square, 
  Eye,
  Settings,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Trash2
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
}

interface Action {
  id: string;
  title: string;
  description: string;
  status: "live" | "ended";
  viewerCount: number;
  thumbnailUrl?: string;
  recordingUrl?: string;
  recordingDuration?: number; // Duration in seconds
  streamKey: string;
  chatEnabled: boolean;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  viewers: any[];
}

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function Actions() {
  const [showCreateAction, setShowCreateAction] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [showStreamControls, setShowStreamControls] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingMimeTypeRef = useRef<string>('video/webm');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newAction, setNewAction] = useState({
    title: "",
    description: "",
    chatEnabled: true,
  });

  // Get current user
  const { data: userData } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Get all live actions
  const { data: actions, isLoading } = useQuery<Action[]>({
    queryKey: ["/api/actions"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Get user's saved recordings (max 10)
  const { data: myRecordings, isLoading: recordingsLoading } = useQuery<Action[]>({
    queryKey: ["/api/actions/my-recordings"],
    enabled: !!userData,
  });

  // Create action mutation
  const createActionMutation = useMutation({
    mutationFn: async (actionData: any) => {
      const response = await apiRequest("POST", "/api/actions", actionData);
      return response;
    },
    onSuccess: async (newAction) => {
      // Clear enterprise cache first to prevent stale data
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/actions');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear error (non-critical):', e);
      }
      // Wait for actions list to refresh before showing the new action
      await queryClient.refetchQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] }); // Refresh posts to show the auto-post
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-koins/wallet"] });
      // Refetch kliq-feed so action appears on headlines immediately
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
      setShowCreateAction(false);
      
      // Find the fully populated action from the refetched list
      const fullAction = queryClient.getQueryData<Action[]>(["/api/actions"])?.find(a => a.id === newAction.id);
      if (fullAction) {
        setSelectedAction(fullAction);
      }
      
      setNewAction({ title: "", description: "", chatEnabled: true });
      toast({
        title: "Action started!",
        description: "Your live stream is active and posted to headlines",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start action",
        variant: "destructive",
      });
    },
  });

  const endActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      await apiRequest("PUT", `/api/actions/${actionId}/end`);
    },
    onSuccess: async () => {
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/actions');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear error (non-critical):', e);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
      setSelectedAction(null);
      setIsStreaming(false);
      stopStream();
      if (ws) {
        ws.close();
        setWs(null);
      }
      toast({
        title: "Action ended",
        description: "Your live stream has ended.",
      });
    },
  });

  // Delete action mutation
  const deleteActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      await apiRequest("DELETE", `/api/actions/${actionId}`);
    },
    onSuccess: async () => {
      // Clear enterprise cache first to prevent stale data
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/actions');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear error (non-critical):', e);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/actions/my-recordings"] }); // Refresh recordings list
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] }); // Remove auto-generated post
      // Refetch kliq-feed so action is removed from headlines immediately
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.refetchQueries({ queryKey: ["/api/actions/my-recordings"] });
      setSelectedAction(null);
      setIsStreaming(false);
      stopStream();
      if (ws) {
        ws.close();
        setWs(null);
      }
      toast({
        title: "Stream deleted",
        description: "Your live stream has been permanently removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete stream",
        variant: "destructive",
      });
    },
  });

  // Join action mutation
  const joinActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      await apiRequest("POST", `/api/actions/${actionId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
    },
  });

  // Leave action mutation
  const leaveActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      await apiRequest("POST", `/api/actions/${actionId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
    },
  });

  // Setup WebSocket connection
  const setupWebSocket = (actionId: string) => {
    // Use buildWebSocketUrl for cross-domain production (AWS Amplify → Replit backend)
    const wsUrl = buildWebSocketUrl('/ws');
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      if (userData?.id) {
        websocket.send(JSON.stringify({
          type: 'join_action',
          actionId,
          userId: userData.id
        }));
      }
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'action_chat':
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            message: data.message,
            createdAt: data.timestamp,
            user: {
              id: data.userId,
              firstName: data.userName,
              lastName: ""
            }
          }]);
          break;
        case 'viewer_joined':
        case 'viewer_left':
          queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
          break;
        case 'action_ended':
          setSelectedAction(null);
          setIsStreaming(false);
          toast({
            title: "Stream ended",
            description: "The live stream has ended",
          });
          break;
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    setWs(websocket);
  };

  // Start camera stream for broadcasting with recording
  const startStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')
        ? 'video/mp4;codecs=avc1,mp4a.40.2'
        : MediaRecorder.isTypeSupported('video/mp4')
          ? 'video/mp4'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
            ? 'video/webm;codecs=vp8,opus'
            : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
              ? 'video/webm;codecs=vp9,opus'
              : MediaRecorder.isTypeSupported('video/webm')
                ? 'video/webm'
                : '';
      
      if (!mimeType) {
        toast({
          title: "Recording not supported",
          description: "Your browser doesn't support video recording. The stream will work but won't be saved.",
          variant: "destructive",
        });
        setIsStreaming(true);
        return;
      }
      
      console.log('MediaRecorder using mimeType:', mimeType);
      recordingMimeTypeRef.current = mimeType;
      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      recordingStartTimeRef.current = Date.now();
      
      setIsStreaming(true);
      
      toast({
        title: "Camera started",
        description: "Your camera is now active and recording",
      });
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to start streaming",
        variant: "destructive",
      });
    }
  };

  // Stop camera stream and recorder
  const stopStream = () => {
    // Stop the MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setIsStreaming(false);
  };
  
  const uploadRecording = async (actionId: string): Promise<string | null> => {
    const chunks = recordedChunksRef.current;
    console.log(`[RecUpload] Starting upload for action ${actionId}, chunks: ${chunks.length}`);
    
    if (chunks.length === 0) {
      console.log('[RecUpload] No recorded chunks to upload');
      return null;
    }
    
    try {
      setIsUploading(true);
      
      const detectedType = recordingMimeTypeRef.current || 'video/webm';
      console.log(`[RecUpload] Using MIME type from MediaRecorder: ${detectedType}`);
      
      let blob = new Blob(chunks, { type: detectedType });
      const blobSizeMB = (blob.size / 1024 / 1024).toFixed(2);
      console.log(`[RecUpload] Blob created: ${blobSizeMB}MB, type: ${detectedType}`);
      
      if (blob.size === 0) {
        console.warn('[RecUpload] Blob is empty, skipping upload');
        return null;
      }
      
      const recordingDurationMs = recordingStartTimeRef.current 
        ? (Date.now() - recordingStartTimeRef.current) 
        : 0;
      const recordingDuration = Math.round(recordingDurationMs / 1000);
      
      if (detectedType.includes('webm') && recordingDurationMs > 0) {
        try {
          console.log(`[RecUpload] Fixing WebM duration metadata: ${recordingDurationMs}ms, original size: ${blob.size}`);
          const fixedBlob = await fixWebmDuration(blob, recordingDurationMs, { logger: false });
          if (fixedBlob && fixedBlob.size > 0) {
            blob = fixedBlob;
            console.log(`[RecUpload] WebM duration fixed successfully, new size: ${blob.size}`);
          } else {
            console.warn('[RecUpload] fix-webm-duration returned empty blob, using original');
          }
        } catch (e) {
          console.warn('[RecUpload] fix-webm-duration failed, using original blob:', e);
        }
      }
      
      const { getAuthToken } = await import('@/lib/tokenStorage');
      const token = getAuthToken();
      console.log(`[RecUpload] Auth token present: ${!!token}, length: ${token?.length || 0}`);
      
      if (!token) {
        throw new Error('No auth token available');
      }
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const CHUNK_SIZE = 384 * 1024; // 384KB raw = ~512KB base64 per chunk
      const arrayBuffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const totalChunks = Math.ceil(uint8.length / CHUNK_SIZE);
      
      console.log(`[RecUpload] Using chunked upload: ${totalChunks} chunks of ~${(CHUNK_SIZE / 1024).toFixed(0)}KB`);
      
      // Step 1: Initialize upload session
      const initUrl = buildApiUrl('/api/actions/upload-recording/init');
      console.log(`[RecUpload] Init: ${initUrl}`);
      const initRes = await fetch(initUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ actionId, totalChunks, mimeType: detectedType, duration: recordingDuration }),
      });
      
      if (!initRes.ok) {
        const errText = await initRes.text().catch(() => '');
        throw new Error(`Init failed (${initRes.status}): ${errText}`);
      }
      
      const { uploadId } = await initRes.json();
      console.log(`[RecUpload] Upload session: ${uploadId}`);
      
      // Step 2: Send chunks sequentially
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, uint8.length);
        const chunkData = uint8.slice(start, end);
        
        // Convert to base64
        let binary = '';
        const chunkArray = new Uint8Array(chunkData);
        for (let j = 0; j < chunkArray.length; j++) {
          binary += String.fromCharCode(chunkArray[j]);
        }
        const base64 = btoa(binary);
        
        const chunkUrl = buildApiUrl('/api/actions/upload-recording/chunk');
        const chunkRes = await fetch(chunkUrl, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ uploadId, chunkIndex: i, data: base64 }),
        });
        
        if (!chunkRes.ok) {
          const errText = await chunkRes.text().catch(() => '');
          throw new Error(`Chunk ${i + 1}/${totalChunks} failed (${chunkRes.status}): ${errText}`);
        }
        
        console.log(`[RecUpload] Chunk ${i + 1}/${totalChunks} sent`);
      }
      
      // Step 3: Complete upload
      const completeUrl = buildApiUrl('/api/actions/upload-recording/complete');
      const completeRes = await fetch(completeUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ uploadId, duration: recordingDuration, expectedSize: uint8.length }),
      });
      
      if (!completeRes.ok) {
        const errText = await completeRes.text().catch(() => '');
        throw new Error(`Complete failed (${completeRes.status}): ${errText}`);
      }
      
      const data = await completeRes.json();
      console.log('[RecUpload] SUCCESS:', data.recordingUrl);
      
      recordedChunksRef.current = [];
      
      toast({
        title: "Recording saved!",
        description: "Your stream recording has been saved.",
      });
      
      return data.recordingUrl;
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      console.error('[RecUpload] FAILED:', errMsg, error?.name, error?.stack?.substring(0, 300));
      toast({
        title: "Upload failed",
        description: `Recording upload error: ${errMsg.substring(0, 100)}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Handle action selection
  const handleSelectAction = (action: Action) => {
    setSelectedAction(action);
    setupWebSocket(action.id);
    
    // Join action if not the creator
    if (userData && action.author.id !== userData.id) {
      joinActionMutation.mutate(action.id);
    }
  };

  // Handle create action
  const handleCreateAction = () => {
    if (!newAction.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a title for your action",
        variant: "destructive",
      });
      return;
    }

    createActionMutation.mutate(newAction);
  };

  const handleEndAction = async () => {
    if (selectedAction) {
      const actionId = selectedAction.id;
      const recorder = mediaRecorderRef.current;
      const hasRecording = recorder && recorder.state !== 'inactive';
      
      toast({
        title: "Stream ended!",
        description: hasRecording ? "Your recording is being saved..." : "Your live stream has ended.",
      });
      
      if (ws) {
        ws.send(JSON.stringify({
          type: 'action_ended',
          actionId
        }));
      }
      
      if (hasRecording) {
        console.log('[EndAction] Has recording, waiting for MediaRecorder to stop...');
        mediaRecorderRef.current = null;
        
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('[EndAction] MediaRecorder onstop timeout after 5s');
            resolve();
          }, 5000);
          
          recorder.onstop = () => {
            console.log(`[EndAction] MediaRecorder stopped, chunks: ${recordedChunksRef.current.length}, total size: ${recordedChunksRef.current.reduce((s, c) => s + c.size, 0)} bytes`);
            clearTimeout(timeout);
            resolve();
          };
          
          try {
            if (recorder.state === 'recording') {
              recorder.requestData();
            }
            recorder.stop();
          } catch (e) {
            console.warn('[EndAction] MediaRecorder.stop() error:', e);
            clearTimeout(timeout);
            resolve();
          }
        });
        
        try {
          await apiRequest("PUT", `/api/actions/${actionId}/end`);
          console.log('[EndAction] Action ended via API');
        } catch (e) {
          console.error('[EndAction] Error ending action:', e);
        }
        
        await uploadRecording(actionId);
        
        try {
          const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
          await enhancedCache.removeByPattern('/api/actions');
          await enhancedCache.removeByPattern('/api/kliq-feed');
        } catch (e) {}
        queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/actions/my-recordings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
        await queryClient.refetchQueries({ queryKey: ["/api/actions/my-recordings"] });
        await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
        
        stopStream();
        setSelectedAction(null);
        setIsStreaming(false);
        if (ws) {
          ws.close();
          setWs(null);
        }
      } else {
        endActionMutation.mutate(actionId);
      }
    }
  };

  // Send chat message
  const handleSendMessage = () => {
    if (!chatMessage.trim() || !selectedAction || !ws || !userData) return;

    ws.send(JSON.stringify({
      type: 'action_chat',
      actionId: selectedAction.id,
      message: chatMessage,
      userId: userData.id,
      userName: `${userData.firstName} ${userData.lastName}`.trim()
    }));

    setChatMessage("");
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (ws) ws.close();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (isLoading || !userData) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-800">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (selectedAction) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main video area */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-xl">{selectedAction.title}</CardTitle>
                    <p className="text-gray-400 text-sm">{selectedAction.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-red-600 text-white">
                      <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                      LIVE
                    </Badge>
                    <Badge variant="secondary">
                      <Eye className="w-3 h-3 mr-1" />
                      {selectedAction.viewerCount}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="relative bg-black aspect-video">
                  {userData && selectedAction.author.id === userData.id ? (
                    // Streamer view
                    <div className="relative w-full h-full">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        data-testid="video-stream"
                      />
                      
                      {!isVideoEnabled && (
                        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                          <CameraOff className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Stream controls */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {!isStreaming ? (
                          <Button
                            onClick={startStream}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            data-testid="button-start-stream"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Streaming
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={toggleVideo}
                              variant={isVideoEnabled ? "secondary" : "destructive"}
                              size="sm"
                              data-testid="button-toggle-video"
                            >
                              {isVideoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                            </Button>
                            <Button
                              onClick={toggleAudio}
                              variant={isAudioEnabled ? "secondary" : "destructive"}
                              size="sm"
                              data-testid="button-toggle-audio"
                            >
                              {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                            </Button>
                            <Button
                              onClick={handleEndAction}
                              variant="destructive"
                              size="sm"
                              data-testid="button-end-stream"
                            >
                              <Square className="w-4 h-4 mr-2" />
                              End Stream
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Viewer view
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg mb-2">Watching {selectedAction.author.firstName}'s stream</p>
                        <p className="text-gray-400">Live video stream would appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-4 flex justify-between">
              <Button
                onClick={() => setSelectedAction(null)}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                data-testid="button-back-to-actions"
              >
                Back to Actions
              </Button>
              
              <div className="flex gap-2">
                {userData && selectedAction.author.id === userData.id && (
                  <Button
                    onClick={() => deleteActionMutation.mutate(selectedAction.id)}
                    variant="destructive"
                    disabled={deleteActionMutation.isPending}
                    data-testid="button-delete-stream"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteActionMutation.isPending ? "Deleting..." : "Delete Stream"}
                  </Button>
                )}
                
                {userData && selectedAction.author.id !== userData.id && (
                  <Button
                    onClick={() => leaveActionMutation.mutate(selectedAction.id)}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900"
                    data-testid="button-leave-stream"
                  >
                    Leave Stream
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Chat sidebar */}
          {selectedAction.chatEnabled && (
            <div>
              <Card className="bg-gray-800 border-gray-700 h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Live Chat
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-4">
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-2">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                          <span className="font-semibold text-pink-400">
                            {msg.user.firstName}:
                          </span>
                          <span className="text-gray-300 ml-2">{msg.message}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex space-x-2">
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-gray-700 border-gray-600 text-white"
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="sm"
                      className="bg-pink-600 hover:bg-pink-700"
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Action</h1>
            <p className="text-gray-400">Live streams from your kliq</p>
          </div>
        
        <Dialog open={showCreateAction} onOpenChange={setShowCreateAction}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
              <Video className="w-4 h-4 mr-2" />
              Start Action
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-black">Start New Action</DialogTitle>
              <DialogDescription className="text-gray-600">
                Start a live stream to share with your kliq
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Title</Label>
                <Input
                  value={newAction.title}
                  onChange={(e) => setNewAction(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What's your action about?"
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  data-testid="input-action-title"
                />
              </div>
              
              <div>
                <Label className="text-gray-700">Description</Label>
                <Textarea
                  value={newAction.description}
                  onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell your kliq what to expect"
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400 resize-none"
                  rows={3}
                  data-testid="input-action-description"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newAction.chatEnabled}
                  onCheckedChange={(checked) => setNewAction(prev => ({ ...prev, chatEnabled: checked }))}
                  data-testid="switch-chat-enabled"
                />
                <Label className="text-gray-700">Enable live chat</Label>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleCreateAction}
                  disabled={createActionMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white"
                  data-testid="button-create-action"
                >
                  {createActionMutation.isPending ? "Starting..." : "Start Action"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateAction(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Live Actions Grid */}
      {actions && Array.isArray(actions) && actions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action: Action) => (
            <Card
              key={action.id}
              className="bg-gray-800 border-gray-700 hover:border-pink-500 transition-colors cursor-pointer"
              onClick={() => handleSelectAction(action)}
              data-testid={`card-action-${action.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-red-600 text-white">
                    <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                    LIVE
                  </Badge>
                  <Badge variant="secondary">
                    <Eye className="w-3 h-3 mr-1" />
                    {action.viewerCount}
                  </Badge>
                </div>
                <CardTitle className="text-white text-lg">{action.title}</CardTitle>
                <p className="text-gray-400 text-sm">{action.description}</p>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {action.author.profileImageUrl ? (
                      <img
                        src={resolveAssetUrl(action.author.profileImageUrl)}
                        alt={`${action.author.firstName}'s profile`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {action.author.firstName?.[0] || '?'}
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm">
                        {action.author.firstName} {action.author.lastName}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Started {new Date(action.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  {action.chatEnabled && (
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (!myRecordings || myRecordings.length === 0) && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="py-16 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-white mb-2">No live actions</h3>
            <p className="text-gray-400 mb-4">
              Be the first to start a live stream in your kliq!
            </p>
              <Button
                onClick={() => setShowCreateAction(true)}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white"
              >
                <Video className="w-4 h-4 mr-2" />
                Start Your First Action
              </Button>
            </CardContent>
          </Card>
        )}

      {/* My Recordings Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">My Recordings</h2>
        <p className="text-gray-400 text-sm mb-4">Your last 10 recorded streams (oldest auto-deleted when limit reached)</p>
        
        {recordingsLoading ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-8 text-center">
              <p className="text-gray-400">Loading recordings...</p>
            </CardContent>
          </Card>
        ) : myRecordings && myRecordings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRecordings.map((recording) => (
              <Card
                key={recording.id}
                className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-purple-600 text-white">
                      <Play className="w-3 h-3 mr-1" />
                      REPLAY
                    </Badge>
                    <span className="text-gray-400 text-xs">
                      {new Date(recording.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-white text-base">{recording.title}</CardTitle>
                  {recording.description && (
                    <p className="text-gray-400 text-sm line-clamp-2">{recording.description}</p>
                  )}
                </CardHeader>
                
                <CardContent className="pt-2">
                  {recording.recordingUrl && (
                    <video
                      controls
                      playsInline
                      webkit-playsinline="true"
                      className="w-full rounded-lg aspect-video bg-black"
                      preload="auto"
                      src={resolveAssetUrl(recording.recordingUrl)}
                    >
                      Your browser does not support video playback.
                    </video>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-400 text-xs">
                        {new Date(recording.createdAt).toLocaleTimeString()}
                      </p>
                      {recording.recordingDuration && recording.recordingDuration > 0 && (
                        <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs">
                          {recording.recordingDuration >= 60 
                            ? `${Math.floor(recording.recordingDuration / 60)}m ${recording.recordingDuration % 60}s`
                            : `${recording.recordingDuration}s`}
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => deleteActionMutation.mutate(recording.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-8 text-center">
              <Video className="w-12 h-12 mx-auto mb-3 text-gray-500" />
              <p className="text-gray-400">No recordings yet</p>
              <p className="text-gray-500 text-sm mt-1">Your completed streams will appear here</p>
            </CardContent>
          </Card>
        )}
      </div>

      </div>
    </PageWrapper>
  );
}