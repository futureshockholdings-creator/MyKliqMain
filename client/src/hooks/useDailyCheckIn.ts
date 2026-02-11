import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const LAST_CHECKIN_PREFIX = "mykliq_last_checkin_";

function getEstLoginDay(): string {
  const now = new Date();
  const estStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const estTime = new Date(estStr);
  const hour = estTime.getHours();
  const loginDay = new Date(estTime);
  if (hour < 12) {
    loginDay.setDate(loginDay.getDate() - 1);
  }
  const y = loginDay.getFullYear();
  const m = String(loginDay.getMonth() + 1).padStart(2, '0');
  const d = String(loginDay.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useDailyCheckIn() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const checkInAttempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const userId = (user as any).id;
    
    if (!userId) {
      console.error("useDailyCheckIn: user.id is undefined, cannot perform check-in");
      return;
    }
    
    const LAST_CHECKIN_KEY = `${LAST_CHECKIN_PREFIX}${userId}`;

    const performDailyCheckIn = async () => {
      if (checkInAttempted.current) {
        return;
      }

      const today = getEstLoginDay();
      const lastCheckIn = localStorage.getItem(LAST_CHECKIN_KEY);

      if (lastCheckIn === today) {
        return;
      }

      checkInAttempted.current = true;

      try {
        const data = await apiRequest("POST", "/api/kliq-koins/login");

        localStorage.setItem(LAST_CHECKIN_KEY, today);
        queryClient.invalidateQueries({ queryKey: ['/api/kliq-koins/wallet'] });
        queryClient.invalidateQueries({ queryKey: ['/api/kliq-koins/streak'] });
        queryClient.invalidateQueries({ queryKey: ['/api/kliq-koins/my-borders'] });
        
        if (data && data.koinsAwarded > 0) {
          toast({
            title: "Streaking 🔥",
            description: `You earned ${data.koinsAwarded} Kliq Koin${data.koinsAwarded > 1 ? 's' : ''} 🪙`,
            duration: 5000,
          });

          if (data.tierUnlocked) {
            setTimeout(() => {
              toast({
                title: "🎉 New Border Unlocked!",
                description: `Congratulations! You unlocked the ${data.tierUnlocked.name}!`,
                duration: 7000,
              });
            }, 1500);
          }
        }
      } catch (error) {
        console.warn("Check-in failed, will retry on next app load");
      } finally {
        checkInAttempted.current = false;
      }
    };

    performDailyCheckIn();

    const intervalId = setInterval(() => {
      const today = getEstLoginDay();
      const lastCheckIn = localStorage.getItem(LAST_CHECKIN_KEY);
      
      if (lastCheckIn !== today) {
        performDailyCheckIn();
      }
    }, 60000);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, user, toast]);
}
