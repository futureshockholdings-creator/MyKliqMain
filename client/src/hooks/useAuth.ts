import { useQuery } from "@tanstack/react-query";
import { enterpriseFetch } from "@/lib/enterprise/enterpriseFetch";
import { circuitBreaker } from "@/lib/enterprise/circuitBreaker";
import { withDeadline } from "@/lib/withDeadline";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  backgroundImageUrl?: string;
  phoneNumber?: string;
  bio?: string;
  inviteCode?: string;
  kliqName?: string;
  isAdmin?: boolean;
  analyticsConsent?: boolean;
  termsAcceptedAt?: string;
  equippedBorderId?: string;
}

export function useAuth() {
  const { data: user, isPending, isFetching, error, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async ({ signal }) => {
      const controller = new AbortController();
      const cancel = () => controller.abort();
      if (signal.aborted) cancel();
      else signal.addEventListener("abort", cancel, { once: true });
      try {
        return await withDeadline(enterpriseFetch<User>("/api/auth/user", {
          credentials: "include",
          skipCache: true,
          skipDisk: true,
          priority: "critical",
          signal: controller.signal,
        }), 12000, "Sign-in check timed out. Please try again.", cancel);
      } catch (error) {
        // Only a confirmed expired/missing session means signed out. Network
        // failures and server errors must not masquerade as missing routes.
        if (error instanceof Error && /^401:/.test(error.message)) return null;
        throw error;
      } finally {
        signal.removeEventListener("abort", cancel);
      }
    },
    retry: false,
  });

  return {
    user,
    // Pending also covers an initial request paused while the device is offline.
    // Background refreshes never turn a mounted page into a loading screen.
    isLoading: isPending,
    isFetching,
    error,
    retryAuth: () => {
      // A deliberate Retry should reach the server even if earlier failures
      // opened the automatic request cooldown. No background retry loop.
      circuitBreaker.reset("/api/auth/user");
      return refetch({ cancelRefetch: false });
    },
    isAuthenticated: !!user,
  };
}
