import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const LAST_CHECKIN_PREFIX = "mykliq_last_checkin_";

export function useDailyCheckIn() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const checkInAttempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Use user.id as the canonical identifier (matches backend user table)
    const userId = (user as any).id;
    
    if (!userId) {
      console.error("useDailyCheckIn: user.id is undefined, cannot perform check-in");
      return;
    }
    
    const LAST_CHECKIN_KEY = `${LAST_CHECKIN_PREFIX}${userId}`;

    const performDailyCheckIn = async () => {
      // Prevent multiple simultaneous check-in attempts
      if (checkInAttempted.current) {
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const lastCheckIn = localStorage.getItem(LAST_CHECKIN_KEY);

      // Skip if we already checked in today
      if (lastCheckIn === today) {
        return;
      }

      checkInAttempted.current = true;

      try {
        // Use apiRequest to include JWT auth header
        const data = await apiRequest("POST", "/api/kliq-koins/login");

        // Always update localStorage and invalidate queries on success
        localStorage.setItem(LAST_CHECKIN_KEY, today);
        queryClient.invalidateQueries({ queryKey: ['/api/kliq-koins/wallet'] });
        queryClient.invalidateQueries({ queryKey: ['/api/kliq-koins/streak'] });
        queryClient.invalidateQueries({ queryKey: ['/api/kliq-koins/my-borders'] });
        
        // Only show notifications if user actually earned something today
        if (data && data.koinsAwarded > 0) {
          // Show streak update toast
          toast({
            title: "Streaking 🔥",
            description: `You earned ${data.koinsAwarded} Kliq Koin${data.koinsAwarded > 1 ? 's' : ''} 🪙`,
            duration: 5000,
          });

          // If a tier was unlocked, show special celebration
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
        // Log error but don't update localStorage so we retry on next load
        console.warn("Check-in failed, will retry on next app load");
      } finally {
        checkInAttempted.current = false;
      }
    };

    performDailyCheckIn();

    // Set up interval to check for date changes (for long-lived sessions)
    const intervalId = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      const lastCheckIn = localStorage.getItem(LAST_CHECKIN_KEY);
      
      // If the date changed, perform check-in
      if (lastCheckIn !== today) {
        performDailyCheckIn();
      }
    }, 60000); // Check every minute

    // Cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, user, toast]);
}
