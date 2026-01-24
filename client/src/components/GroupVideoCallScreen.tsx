import { useEffect, useRef, useMemo } from 'react';
import { Phone, Mic, MicOff, Video, VideoOff, Users, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useGroupVideoCall } from '@/contexts/GroupVideoCallContext';
import { resolveAssetUrl } from '@/lib/apiConfig';
import { useState } from 'react';

interface VideoTileProps {
  stream: MediaStream | null;
  name: string;
  avatar?: string;
  isLocal?: boolean;
  isMuted?: boolean;
}

function VideoTile({ stream, name, avatar, isLocal = false, isMuted = false }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const getInitials = (displayName: string) => {
    const parts = displayName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isMuted}
          className={`w-full h-full object-cover ${isLocal ? 'transform scale-x-[-1]' : ''}`}
        />
      ) : (
        <Avatar className="w-20 h-20">
          <AvatarImage src={resolveAssetUrl(avatar)} />
          <AvatarFallback className="bg-blue-600 text-white text-2xl">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-sm flex items-center gap-2">
        {isLocal && <span className="text-xs text-mykliq-green">(You)</span>}
        <span className="truncate max-w-[100px]">{name}</span>
        {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
      </div>
    </div>
  );
}

export function GroupVideoCallScreen() {
  const {
    callState,
    currentCallInfo,
    localStream,
    remoteStreams,
    participants,
    isAudioEnabled,
    isVideoEnabled,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useGroupVideoCall();

  const [isMinimized, setIsMinimized] = useState(false);

  const activeParticipants = useMemo(() => {
    return participants.filter(p => p.status === 'connected' || p.status === 'pending');
  }, [participants]);

  const getGridClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const totalParticipants = activeParticipants.length + 1;

  if (callState === 'idle' || callState === 'ringing') {
    return null;
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-900 rounded-lg shadow-2xl p-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            <span className="text-white text-sm font-medium">
              {currentCallInfo?.groupName || 'Group Call'}
            </span>
            <span className="text-gray-400 text-xs">
              ({activeParticipants.filter(p => p.status === 'connected').length + 1} in call)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-700 h-8 w-8"
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-400" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-700 h-8 w-8"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={endCall}
            >
              <Phone className="w-4 h-4 rotate-[135deg]" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-800">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-green-400" />
          <div>
            <h2 className="text-white font-semibold">
              {currentCallInfo?.groupName || 'Group Call'}
            </h2>
            <p className="text-gray-400 text-sm">
              {callState === 'calling' ? 'Calling...' :
               callState === 'ringing' ? 'Incoming call...' :
               `${activeParticipants.filter(p => p.status === 'connected').length + 1} participants`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-gray-700"
          onClick={() => setIsMinimized(true)}
        >
          <Minimize2 className="w-5 h-5" />
        </Button>
      </div>

      <div className={`flex-1 p-4 grid ${getGridClass(totalParticipants)} gap-4 auto-rows-fr`}>
        <VideoTile
          stream={localStream}
          name="You"
          isLocal={true}
          isMuted={!isAudioEnabled}
        />
        
        {activeParticipants.map((participant) => (
          <VideoTile
            key={participant.id}
            stream={remoteStreams.get(participant.id) || null}
            name={participant.name}
            avatar={participant.avatar}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 p-6 bg-gray-800">
        <Button
          variant={isAudioEnabled ? "secondary" : "destructive"}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={toggleAudio}
        >
          {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>
        
        <Button
          variant={isVideoEnabled ? "secondary" : "destructive"}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={toggleVideo}
        >
          {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={endCall}
        >
          <Phone className="w-6 h-6 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
}
