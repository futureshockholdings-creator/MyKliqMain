import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Notification } from "@shared/schema";
import { syncAppBadge } from "@/lib/appBadge";

declare global {
  interface Navigator {
    setAppBadge?(count?: number): Promise<void>;
    clearAppBadge?(): Promise<void>;
  }
}

export function useAppBadge() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const { data: notifications, isSuccess } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000,
    staleTime: 10000,
    enabled: isAuthenticated && !isLoading,
  });

  const unreadCount = isAuthenticated 
    ? (notifications ?? []).filter((n: Notification) => !n.isRead && n.isVisible).length
    : 0;

  const isSupported = typeof navigator !== "undefined" && "setAppBadge" in navigator;

  const setBadge = useCallback(async (count: number) => {
    if (user?.id) await syncAppBadge(count, user.id);
  }, [user?.id]);

  const clearBadge = useCallback(async () => {
    await setBadge(0);
  }, [setBadge]);

  useEffect(() => {
    // Undefined data is not an authoritative zero. Preserve the icon while
    // authentication/notifications load or fail (including offline startup).
    if (isAuthenticated && !isLoading && isSuccess && notifications) {
      setBadge(unreadCount);
    }
    // No cleanup clear: backgrounding, closing and worker updates are not logout.
  }, [unreadCount, setBadge, isAuthenticated, isLoading, isSuccess, notifications]);

  return {
    unreadCount,
    setBadge,
    clearBadge,
    isSupported,
  };
}
