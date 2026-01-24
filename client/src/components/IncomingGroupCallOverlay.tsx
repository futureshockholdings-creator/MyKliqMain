import { Phone, PhoneOff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useGroupVideoCall } from '@/contexts/GroupVideoCallContext';
import { resolveAssetUrl } from '@/lib/apiConfig';

export function IncomingGroupCallOverlay() {
  const {
    callState,
    currentCallInfo,
    participants,
    acceptCall,
    declineCall,
  } = useGroupVideoCall();

  if (callState !== 'ringing' || !currentCallInfo) {
    return null;
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-mykliq-green/20 flex items-center justify-center">
            <Users className="w-10 h-10 text-mykliq-green" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Group Video Call
          </h2>
          <p className="text-gray-400 mb-2">
            {currentCallInfo.groupName || 'Group Chat'}
          </p>
          <p className="text-gray-500 text-sm">
            {currentCallInfo.initiatorName} is calling...
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {participants.slice(0, 5).map((participant) => (
            <Avatar key={participant.id} className="w-10 h-10 border-2 border-gray-700">
              <AvatarImage src={resolveAssetUrl(participant.avatar)} />
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {getInitials(participant.name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {participants.length > 5 && (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs">
              +{participants.length - 5}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-8">
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full h-16 w-16"
            onClick={declineCall}
          >
            <PhoneOff className="w-8 h-8" />
          </Button>
          
          <Button
            variant="default"
            size="lg"
            className="rounded-full h-16 w-16 bg-green-600 hover:bg-green-700"
            onClick={acceptCall}
          >
            <Phone className="w-8 h-8" />
          </Button>
        </div>
      </div>
    </div>
  );
}
