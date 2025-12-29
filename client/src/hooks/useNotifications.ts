import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";

export function useNotifications(type?: string) {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all notifications for calculating totals
  const { data: allNotifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Changed from 2000ms to 30000ms (30 seconds)
    staleTime: 15000, // Changed from 1000ms to 15000ms (15 seconds)
  });

  // Get specific type notifications if requested
  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", type === "all" ? undefined : type],
    refetchInterval: 30000, // Changed from 2000ms to 30000ms (30 seconds)
    staleTime: 15000, // Changed from 1000ms to 15000ms (15 seconds)
    enabled: !!type,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}`, {
        isRead: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async (notificationType?: string) => {
      await apiRequest("PATCH", "/api/notifications/mark-all-read", {
        type: notificationType,
      });
    },
    onMutate: async (notificationType?: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/notifications"] });
      const previousNotifications = queryClient.getQueryData<Notification[]>(["/api/notifications"]);
      
      queryClient.setQueryData<Notification[]>(["/api/notifications"], (old) => {
        if (!old) return old;
        return old.map((n) => {
          if (notificationType && notificationType !== "all" && n.type !== notificationType) return n;
          return { ...n, isRead: true };
        });
      });
      
      return { previousNotifications };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (_, __, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(["/api/notifications"], context.previousNotifications);
      }
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  // Helper functions for getting specific notification counts from all notifications
  const getUnreadCount = (notificationType?: string) => {
    return allNotifications.filter((n: Notification) => {
      if (!n.isRead && n.isVisible) {
        if (!notificationType || notificationType === "all") return true;
        return n.type === notificationType;
      }
      return false;
    }).length;
  };

  const getTotalUnreadCount = () => getUnreadCount();
  const getMessageCount = () => getUnreadCount("message");
  const getFriendRequestCount = () => getUnreadCount("friend_request");
  const getEventInviteCount = () => getUnreadCount("event_invite");
  const getPostLikeCount = () => getUnreadCount("post_like");
  const getCommentCount = () => getUnreadCount("comment");
  const getLiveStreamCount = () => getUnreadCount("live_stream");
  const getMeetupInviteCount = () => getUnreadCount("meetup_invite");
  const getBirthdayCount = () => getUnreadCount("birthday");

  // Navigation handlers
  const openNotificationPanel = () => setIsNotificationPanelOpen(true);
  const closeNotificationPanel = () => setIsNotificationPanelOpen(false);
  const toggleNotificationPanel = () => setIsNotificationPanelOpen(!isNotificationPanelOpen);

  // Manual refresh function
  const refreshNotifications = () => refetch();

  return {
    notifications,
    isLoading,
    isNotificationPanelOpen,
    
    // Counts
    getTotalUnreadCount,
    getMessageCount,
    getFriendRequestCount,
    getEventInviteCount,
    getPostLikeCount,
    getCommentCount,
    getLiveStreamCount,
    getMeetupInviteCount,
    getBirthdayCount,
    
    // Actions
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    
    // Panel controls
    openNotificationPanel,
    closeNotificationPanel,
    toggleNotificationPanel,
    
    // Manual refresh
    refreshNotifications,
    
    // Loading states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
  };
}