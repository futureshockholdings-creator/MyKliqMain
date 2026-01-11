import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { videoCallService, CallState, CallInfo } from '@/lib/videoCallService';
import { useAuth } from '@/hooks/useAuth';

interface VideoCallContextType {
  callState: CallState;
  currentCallInfo: CallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  initiateCall: (recipientId: string, recipientName: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  error: string | null;
  clearError: () => void;
}

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export function VideoCallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>('idle');
  const [currentCallInfo, setCurrentCallInfo] = useState<CallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (user?.id && !isInitialized.current) {
      const userName = (user as any).firstName || (user as any).username || 'User';
      const userAvatar = (user as any).profilePicture;

      videoCallService.initialize(user.id, {
        onCallStateChange: (state) => {
          setCallState(state);
        },
        onIncomingCall: (callInfo) => {
          setCurrentCallInfo(callInfo);
        },
        onCallAccepted: (callInfo) => {
          setCurrentCallInfo(callInfo);
        },
        onCallDeclined: () => {
          setError('Call was declined');
          setTimeout(() => setError(null), 3000);
        },
        onCallEnded: () => {
          setLocalStream(null);
          setRemoteStream(null);
          setCurrentCallInfo(null);
        },
        onCallFailed: (errorMessage) => {
          setError(errorMessage);
          setLocalStream(null);
          setRemoteStream(null);
          setCurrentCallInfo(null);
        },
        onLocalStream: (stream) => {
          setLocalStream(stream);
        },
        onRemoteStream: (stream) => {
          setRemoteStream(stream);
        },
      });

      isInitialized.current = true;
    }

    return () => {
      if (isInitialized.current) {
        videoCallService.destroy();
        isInitialized.current = false;
      }
    };
  }, [user?.id]);

  const initiateCall = useCallback(async (recipientId: string, recipientName: string) => {
    if (!user) {
      setError('You must be logged in to make calls');
      return;
    }

    try {
      setError(null);
      const callerName = (user as any).firstName || (user as any).username || 'User';
      const callerAvatar = (user as any).profilePicture;
      await videoCallService.initiateCall(recipientId, recipientName, callerName, callerAvatar);
      setCurrentCallInfo(videoCallService.getCurrentCallInfo());
    } catch (err: any) {
      setError(err.message);
    }
  }, [user]);

  const acceptCall = useCallback(async () => {
    try {
      setError(null);
      await videoCallService.acceptCall();
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const declineCall = useCallback(() => {
    videoCallService.declineCall();
    setCurrentCallInfo(null);
  }, []);

  const endCall = useCallback(() => {
    videoCallService.endCall();
    setLocalStream(null);
    setRemoteStream(null);
    setCurrentCallInfo(null);
  }, []);

  const toggleAudio = useCallback(() => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    videoCallService.toggleAudio(newState);
  }, [isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    videoCallService.toggleVideo(newState);
  }, [isVideoEnabled]);

  const switchCamera = useCallback(() => {
    videoCallService.switchCamera();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <VideoCallContext.Provider
      value={{
        callState,
        currentCallInfo,
        localStream,
        remoteStream,
        isAudioEnabled,
        isVideoEnabled,
        initiateCall,
        acceptCall,
        declineCall,
        endCall,
        toggleAudio,
        toggleVideo,
        switchCamera,
        error,
        clearError,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
}

export function useVideoCall() {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
}
