import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Notification } from "@shared/schema";

declare global {
  interface Navigator {
    setAppBadge?(count?: number): Promise<void>;
    clearAppBadge?(): Promise<void>;
  }
}

export function useAppBadge() {
  const { isAuthenticated, isLoading } = useAuth();
  
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000,
    staleTime: 10000,
    enabled: isAuthenticated && !isLoading,
  });

  const unreadCount = isAuthenticated 
    ? notifications.filter((n: Notification) => !n.isRead && n.isVisible).length
    : 0;

  const isSupported = typeof navigator !== "undefined" && "setAppBadge" in navigator;

  const setBadge = useCallback(async (count: number) => {
    if (!isSupported) {
      return;
    }

    try {
      if (count > 0) {
        await navigator.setAppBadge?.(count);
      } else {
        if ("clearAppBadge" in navigator) {
          await navigator.clearAppBadge?.();
        } else {
          await navigator.setAppBadge?.(0);
        }
      }
    } catch (error) {
      console.log("[AppBadge] Failed to set badge:", error);
    }
  }, [isSupported]);

  const clearBadge = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    try {
      if ("clearAppBadge" in navigator) {
        await navigator.clearAppBadge?.();
      } else {
        await navigator.setAppBadge?.(0);
      }
    } catch (error) {
      console.log("[AppBadge] Failed to clear badge:", error);
    }
  }, [isSupported]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setBadge(unreadCount);
    } else {
      clearBadge();
    }
  }, [unreadCount, setBadge, clearBadge, isAuthenticated, isLoading]);

  useEffect(() => {
    return () => {
      clearBadge();
    };
  }, [clearBadge]);

  return {
    unreadCount,
    setBadge,
    clearBadge,
    isSupported,
  };
}
