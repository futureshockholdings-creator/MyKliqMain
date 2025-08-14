import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Volume2,
  VolumeX,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { type User, type VideoCall, type CallParticipant } from "@shared/schema";

interface VideoCallProps {
  call: VideoCall & { participants: (CallParticipant & { user: User })[] };
  onEndCall: () => void;
  onToggleAudio: (enabled: boolean) => void;
  onToggleVideo: (enabled: boolean) => void;
}

export function VideoCallComponent({ call, onEndCall, onToggleAudio, onToggleVideo }: VideoCallProps) {
  const { user } = useAuth();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // WebRTC setup would go here in a real implementation
  useEffect(() => {
    // Initialize local video stream
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: isVideoEnabled, 
          audio: isAudioEnabled 
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initializeMedia();
  }, [isVideoEnabled, isAudioEnabled]);

  const handleToggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    onToggleAudio(newState);
  };

  const handleToggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    onToggleVideo(newState);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const otherParticipants = call.participants.filter(p => p.userId !== (user as User)?.id);

  return (
    <Card className="w-full h-full bg-card text-foreground">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Group Call ({call.participants.length} participants)
          </CardTitle>
          <Badge variant={call.status === 'active' ? 'default' : 'secondary'}>
            {call.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Local video */}
          <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
            <video 
              ref={localVideoRef}
              autoPlay 
              muted 
              playsInline
              className={cn(
                "w-full h-full object-cover",
                !isVideoEnabled && "hidden"
              )}
              data-testid="video-local"
            />
            {!isVideoEnabled && (
              <div className="flex items-center justify-center w-full h-full bg-muted/50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-bold text-primary-foreground">
                      {(user as User)?.firstName?.[0]}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{(user as User)?.firstName} (You)</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
              You
            </div>
          </div>

          {/* Remote participants */}
          {otherParticipants.map((participant) => (
            <div key={participant.userId} className="relative bg-muted rounded-lg overflow-hidden aspect-video">
              <video
                ref={(el) => {
                  remoteVideoRefs.current[participant.userId] = el;
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                data-testid={`video-participant-${participant.userId}`}
              />
              <div className="flex items-center justify-center w-full h-full bg-muted/50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-bold text-secondary-foreground">
                      {participant.user.firstName?.[0]}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{participant.user.firstName}</p>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
                {participant.user.firstName}
              </div>
              <Badge 
                className="absolute top-2 right-2"
                variant={participant.status === 'joined' ? 'default' : 'secondary'}
              >
                {participant.status}
              </Badge>
            </div>
          ))}
        </div>

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={handleToggleAudio}
            className="rounded-full w-12 h-12 p-0"
            data-testid="button-toggle-audio"
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          <Button
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={handleToggleVideo}
            className="rounded-full w-12 h-12 p-0"
            data-testid="button-toggle-video"
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            variant={isMuted ? "destructive" : "default"}
            size="lg"
            onClick={handleToggleMute}
            className="rounded-full w-12 h-12 p-0"
            data-testid="button-toggle-mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="rounded-full w-12 h-12 p-0"
            data-testid="button-end-call"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>

        {/* Participants List */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Participants ({call.participants.length})</h4>
          <div className="grid grid-cols-2 gap-2">
            {call.participants.map((participant) => (
              <div key={participant.userId} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-xs">
                  {participant.user.firstName?.[0]}
                </div>
                <span className="text-sm truncate flex-1">
                  {participant.user.firstName}
                  {participant.userId === (user as User)?.id && " (You)"}
                </span>
                <Badge variant={participant.status === 'joined' ? 'default' : 'secondary'}>
                  {participant.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}