import { Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGroupVideoCall } from '@/contexts/GroupVideoCallContext';
import { toast } from '@/hooks/use-toast';

interface Participant {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface GroupVideoCallButtonProps {
  participants: Participant[];
  currentUserId: string;
  groupName: string;
  groupId: string;
}

export function GroupVideoCallButton({
  participants,
  currentUserId,
  groupName,
  groupId,
}: GroupVideoCallButtonProps) {
  const { callState, initiateGroupCall } = useGroupVideoCall();
  
  const isDisabled = callState !== 'idle';

  const otherParticipants = participants.filter(p => p.id !== currentUserId);

  const getDisplayName = (user: Participant) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email?.split("@")[0] || "Unknown User";
  };

  const handleStartGroupCall = async () => {
    try {
      const participantsList = otherParticipants.map(p => ({
        id: p.id,
        name: getDisplayName(p),
        avatar: p.profileImageUrl
      }));
      
      await initiateGroupCall(groupId, groupName, participantsList);
    } catch (error: any) {
      toast({
        title: 'Call Failed',
        description: error.message || 'Unable to start group video call. Please check your camera and microphone permissions.',
        variant: 'destructive',
      });
    }
  };

  if (otherParticipants.length === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      disabled={isDisabled}
      onClick={handleStartGroupCall}
      data-testid="button-group-video-call"
      title={isDisabled ? 'Already in a call' : `Video call all ${otherParticipants.length} members`}
    >
      {callState === 'calling' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Video className="w-4 h-4" />
      )}
    </Button>
  );
}
