import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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
        const response = await fetch("/api/kliq-koins/login", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          // Always update localStorage and invalidate queries on success, regardless of response body
          localStorage.setItem(LAST_CHECKIN_KEY, today);
          queryClient.invalidateQueries({ queryKey: ['/api/kliq-koins/wallet'] });
          queryClient.invalidateQueries({ queryKey: ['/api/kliq-koins/streak'] });
          queryClient.invalidateQueries({ queryKey: ['/api/kliq-koins/my-borders'] });
          
          // Check if response has JSON content before parsing
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await response.json();
              
              // Only show notifications if user actually earned something today
              if (data.koinsAwarded > 0) {
                // Show streak update toast
                toast({
                  title: `Day ${data.streak.currentStreak} Streak! 🔥`,
                  description: `You earned ${data.koinsAwarded} Kliq Koin${data.koinsAwarded > 1 ? 's' : ''}!`,
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
            } catch (jsonError) {
              // JSON parsing failed but check-in was successful (localStorage already updated)
              console.warn("Check-in succeeded but response parsing failed:", jsonError);
            }
          }
        } else {
          // Retry failed check-ins (e.g., network issues)
          const statusText = `${response.status} ${response.statusText}`;
          console.warn(`Check-in failed (${statusText}), will retry on next app load`);
        }
      } catch (error) {
        // Log error but don't update localStorage so we retry on next load
        console.error("Daily check-in failed:", error);
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
