import { QueryClient } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";

interface OptimisticNotificationParams {
  queryClient: QueryClient;
  type: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export function addOptimisticNotification({
  queryClient,
  type,
  message,
  relatedEntityId,
  relatedEntityType,
}: OptimisticNotificationParams): { previousNotifications: Notification[] | undefined; tempId: string } {
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const previousNotifications = queryClient.getQueryData<Notification[]>(["/api/notifications"]);
  
  const optimisticNotification: Notification = {
    id: tempId,
    userId: "",
    type,
    message,
    relatedEntityId: relatedEntityId || null,
    relatedEntityType: relatedEntityType || null,
    isRead: false,
    isVisible: true,
    createdAt: new Date(),
  };
  
  queryClient.setQueryData<Notification[]>(["/api/notifications"], (old) => {
    if (!old) return [optimisticNotification];
    return [optimisticNotification, ...old];
  });
  
  return { previousNotifications, tempId };
}

export function rollbackOptimisticNotification(
  queryClient: QueryClient,
  previousNotifications: Notification[] | undefined
) {
  if (previousNotifications !== undefined) {
    queryClient.setQueryData(["/api/notifications"], previousNotifications);
  }
}

export function removeOptimisticNotification(
  queryClient: QueryClient,
  tempId: string
) {
  queryClient.setQueryData<Notification[]>(["/api/notifications"], (old) => {
    if (!old) return old;
    return old.filter(n => n.id !== tempId);
  });
}
