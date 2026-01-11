import { useEffect, useState, useRef } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { cn } from '@/lib/utils';
import { resolveAssetUrl } from '@/lib/apiConfig';
import { playRingtone } from '@/lib/audioManager';

export function IncomingCallOverlay() {
  const { callState, currentCallInfo, acceptCall, declineCall } = useVideoCall();
  const [isVisible, setIsVisible] = useState(false);
  const ringtoneRef = useRef<{ stop: () => void } | null>(null);

  // Handle ringing sound
  useEffect(() => {
    if (callState === 'ringing') {
      setIsVisible(true);
      ringtoneRef.current = playRingtone();
    } else {
      ringtoneRef.current?.stop();
      ringtoneRef.current = null;
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
    
    return () => {
      ringtoneRef.current?.stop();
      ringtoneRef.current = null;
    };
  }, [callState]);

  if (!isVisible || callState !== 'ringing' || !currentCallInfo) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-green-500/20 animate-ping" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-green-500/30 animate-pulse" />
          </div>
          <Avatar className="relative w-24 h-24 mx-auto border-4 border-green-500 shadow-lg">
            <AvatarImage src={resolveAssetUrl(currentCallInfo.callerAvatar)} alt={currentCallInfo.callerName} />
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
              {currentCallInfo.callerName?.[0]?.toUpperCase() || <User className="w-10 h-10" />}
            </AvatarFallback>
          </Avatar>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-2">
          {currentCallInfo.callerName}
        </h2>
        <p className="text-muted-foreground mb-8 animate-pulse">
          Incoming video call...
        </p>

        <div className="flex justify-center gap-6">
          <Button
            variant="destructive"
            size="lg"
            onClick={declineCall}
            className="rounded-full w-16 h-16 p-0 shadow-lg hover:scale-110 transition-transform"
            data-testid="button-decline-call"
          >
            <PhoneOff className="w-7 h-7" />
          </Button>

          <Button
            size="lg"
            onClick={acceptCall}
            className={cn(
              "rounded-full w-16 h-16 p-0 shadow-lg hover:scale-110 transition-transform",
              "bg-green-500 hover:bg-green-600 text-white"
            )}
            data-testid="button-accept-call"
          >
            <Phone className="w-7 h-7" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Swipe or tap to answer
        </p>
      </div>

      <style>{`
        @keyframes ring {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
        }
        
        .animate-ring {
          animation: ring 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
