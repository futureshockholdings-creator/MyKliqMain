import { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  SwitchCamera,
  X,
  Minimize2,
  Maximize2,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function VideoCallScreen() {
  const {
    callState,
    currentCallInfo,
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    endCall,
    toggleAudio,
    toggleVideo,
    switchCamera,
    error,
    clearError,
  } = useVideoCall();
  const { user } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const isCurrentUserCaller = currentCallInfo?.callerId === user?.id;
  const remoteUserAvatar = isCurrentUserCaller 
    ? currentCallInfo?.recipientAvatar 
    : currentCallInfo?.callerAvatar;

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (callState === 'connected' && currentCallInfo?.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(currentCallInfo.startTime!).getTime()) / 1000);
        setCallDuration(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState, currentCallInfo?.startTime]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callState === 'idle' || callState === 'ringing') {
    return null;
  }

  const remoteName = callState === 'connected' 
    ? (currentCallInfo?.callerId === currentCallInfo?.recipientId 
        ? currentCallInfo?.callerName 
        : currentCallInfo?.recipientName || currentCallInfo?.callerName)
    : currentCallInfo?.recipientName || 'Connecting...';

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-20 right-4 z-50 w-32 h-24 rounded-xl overflow-hidden shadow-2xl border-2 border-primary cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Avatar className="w-12 h-12">
              <AvatarImage src={remoteUserAvatar} />
              <AvatarFallback>{remoteName?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        )}
        <div className="absolute bottom-1 left-1 bg-black/50 px-1 rounded text-[10px] text-white">
          {formatDuration(callDuration)}
        </div>
        <Button
          size="icon"
          variant="destructive"
          className="absolute top-1 right-1 w-6 h-6 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            endCall();
          }}
        >
          <PhoneOff className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg flex items-center gap-2">
          <span>{error}</span>
          <Button size="icon" variant="ghost" onClick={clearError} className="w-6 h-6">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="relative w-full h-full">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
            <Avatar className="w-32 h-32 mb-6 border-4 border-primary">
              <AvatarImage src={remoteUserAvatar} />
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                {remoteName?.[0]?.toUpperCase() || <User className="w-16 h-16" />}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-semibold text-white mb-2">{remoteName}</h2>
            <p className="text-gray-400 animate-pulse">
              {callState === 'calling' ? 'Calling...' : 'Connecting...'}
            </p>
          </div>
        )}

        {localStream && (
          <div className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
            {isVideoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg bg-primary text-primary-foreground">You</AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-black/50 px-1 rounded text-[10px] text-white">
              You
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(true)}
            className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <Minimize2 className="w-5 h-5" />
          </Button>
          {callState === 'connected' && (
            <div className="bg-white/10 px-3 py-1 rounded-full text-white text-sm">
              {formatDuration(callDuration)}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              variant={isAudioEnabled ? 'secondary' : 'destructive'}
              onClick={toggleAudio}
              className="rounded-full w-14 h-14 p-0"
              data-testid="button-toggle-audio"
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            <Button
              size="lg"
              variant={isVideoEnabled ? 'secondary' : 'destructive'}
              onClick={toggleVideo}
              className="rounded-full w-14 h-14 p-0"
              data-testid="button-toggle-video"
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>

            <Button
              size="lg"
              variant="secondary"
              onClick={switchCamera}
              className="rounded-full w-14 h-14 p-0"
              data-testid="button-switch-camera"
            >
              <SwitchCamera className="w-6 h-6" />
            </Button>

            <Button
              size="lg"
              variant="destructive"
              onClick={endCall}
              className="rounded-full w-14 h-14 p-0"
              data-testid="button-end-call"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
