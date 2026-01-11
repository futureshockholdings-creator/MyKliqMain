import { useEffect, useState, useRef, useCallback } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { cn } from '@/lib/utils';
import { resolveAssetUrl } from '@/lib/apiConfig';

// Generate a pleasant ringtone using Web Audio API
function createRingtone(audioContext: AudioContext): { start: () => void; stop: () => void } {
  let oscillator1: OscillatorNode | null = null;
  let oscillator2: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;
  let intervalId: number | null = null;
  let isPlaying = false;

  const playTone = () => {
    if (!audioContext || audioContext.state === 'closed') return;
    
    // Create oscillators for a dual-tone ringtone (similar to phone ring)
    oscillator1 = audioContext.createOscillator();
    oscillator2 = audioContext.createOscillator();
    gainNode = audioContext.createGain();

    // Use frequencies that create a pleasant ring sound
    oscillator1.frequency.setValueAtTime(440, audioContext.currentTime); // A4
    oscillator2.frequency.setValueAtTime(480, audioContext.currentTime); // B4
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    // Connect to gain for volume control
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set volume (not too loud)
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);

    // Start and stop after 1 second (ring pattern: 1s on, 2s off)
    oscillator1.start();
    oscillator2.start();

    setTimeout(() => {
      if (oscillator1 && oscillator2 && gainNode) {
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        setTimeout(() => {
          oscillator1?.stop();
          oscillator2?.stop();
        }, 100);
      }
    }, 800);
  };

  return {
    start: () => {
      if (isPlaying) return;
      isPlaying = true;
      
      // Resume audio context if suspended (required for autoplay policies)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Play immediately, then repeat every 3 seconds
      playTone();
      intervalId = window.setInterval(playTone, 3000);
    },
    stop: () => {
      isPlaying = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (oscillator1) {
        try { oscillator1.stop(); } catch (e) {}
        oscillator1 = null;
      }
      if (oscillator2) {
        try { oscillator2.stop(); } catch (e) {}
        oscillator2 = null;
      }
    }
  };
}

export function IncomingCallOverlay() {
  const { callState, currentCallInfo, acceptCall, declineCall } = useVideoCall();
  const [isVisible, setIsVisible] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  // Initialize audio context and ringtone
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      ringtoneRef.current = createRingtone(audioContextRef.current);
    }
  }, []);

  // Handle ringing sound
  useEffect(() => {
    if (callState === 'ringing') {
      setIsVisible(true);
      initAudio();
      ringtoneRef.current?.start();
    } else {
      ringtoneRef.current?.stop();
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
    
    return () => {
      ringtoneRef.current?.stop();
    };
  }, [callState, initAudio]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      ringtoneRef.current?.stop();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

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
