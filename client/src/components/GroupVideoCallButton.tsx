import { useState } from 'react';
import { Video, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { resolveAssetUrl } from '@/lib/apiConfig';
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
}

export function GroupVideoCallButton({
  participants,
  currentUserId,
  groupName,
}: GroupVideoCallButtonProps) {
  const { callState, initiateCall } = useVideoCall();
  const [isOpen, setIsOpen] = useState(false);
  
  const isDisabled = callState !== 'idle';

  const otherParticipants = participants.filter(p => p.id !== currentUserId);

  const getDisplayName = (user: Participant) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email?.split("@")[0] || "Unknown User";
  };

  const getInitials = (user: Participant) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const handleCallMember = async (participant: Participant) => {
    try {
      setIsOpen(false);
      await initiateCall(
        participant.id,
        getDisplayName(participant),
        participant.profileImageUrl
      );
    } catch (error: any) {
      toast({
        title: 'Call Failed',
        description: error.message || 'Unable to start video call. Please check your camera and microphone permissions.',
        variant: 'destructive',
      });
    }
  };

  if (otherParticipants.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={isDisabled}
          className="gap-2"
          data-testid="button-group-video-call"
          title={isDisabled ? 'Already in a call' : 'Video call a member'}
        >
          {callState === 'calling' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Video className="w-4 h-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-sm font-medium">
          Call a member from {groupName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {otherParticipants.map((participant) => (
          <DropdownMenuItem
            key={participant.id}
            onClick={() => handleCallMember(participant)}
            className="flex items-center gap-3 cursor-pointer py-2"
            data-testid={`call-member-${participant.id}`}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={resolveAssetUrl(participant.profileImageUrl)} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                {getInitials(participant)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm truncate block">
                {getDisplayName(participant)}
              </span>
            </div>
            <Video className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
