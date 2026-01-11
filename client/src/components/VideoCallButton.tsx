import { Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface VideoCallButtonProps {
  recipientId: string;
  recipientName: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function VideoCallButton({
  recipientId,
  recipientName,
  variant = 'outline',
  size = 'icon',
  className,
  showLabel = false,
}: VideoCallButtonProps) {
  const { callState, initiateCall } = useVideoCall();
  
  const isDisabled = callState !== 'idle';

  const handleClick = async () => {
    try {
      await initiateCall(recipientId, recipientName);
    } catch (error: any) {
      toast({
        title: 'Call Failed',
        description: error.message || 'Unable to start video call. Please check your camera and microphone permissions.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isDisabled}
      className={cn('gap-2', className)}
      data-testid="button-video-call"
      title={isDisabled ? 'Already in a call' : `Video call ${recipientName}`}
    >
      {callState === 'calling' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Video className="w-4 h-4" />
      )}
      {showLabel && <span>Video Call</span>}
    </Button>
  );
}
