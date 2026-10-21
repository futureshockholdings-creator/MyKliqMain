import { and, count, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "./db";
import { deviceTokens, notificationPreferences, notifications, type Notification, type NotificationPreference } from "@shared/schema";
import { webPushService } from "./webPushService";
import { firebaseNotificationService } from "./firebase-notifications";

export function allowsPwaPush(notification: Pick<Notification, "type" | "isRead" | "isVisible">, preferences?: NotificationPreference): boolean {
  // Incognito messages intentionally have only their existing in-app alert.
  if (!notification.isVisible || notification.isRead || notification.type === "incognito_message") return false;
  if (!preferences) return true;
  if (!preferences.pushEnabled || preferences.deliveryPreference !== "immediate") return false;
  if (preferences.snoozedUntil && preferences.snoozedUntil.getTime() > Date.now()) return false;
  switch (notification.type) {
    case "post_like":
    case "comment_like": return preferences.likes;
    case "comment": return preferences.comments;
    case "message": return preferences.messages;
    case "friend_request": return preferences.newFriends;
    case "event_invite":
    case "meetup_invite": return preferences.events;
    default: return true;
  }
}

/**
 * Only registered PWA subscriptions are used here. Native Expo/FCM delivery is
 * deliberately unchanged. Counts include exactly the visible unread alerts
 * counted by the web bell (including other notification types).
 */
export async function sendPwaNotification(notification: Notification): Promise<void> {
  if (!notification.isVisible || notification.isRead || notification.type === "incognito_message") return;
  const [preferences] = await db.select().from(notificationPreferences)
    .where(eq(notificationPreferences.userId, notification.userId));
  if (!allowsPwaPush(notification, preferences)) return;

  const tokens = await db.select().from(deviceTokens).where(and(
    eq(deviceTokens.userId, notification.userId),
    eq(deviceTokens.isActive, true),
  ));
  const iosTokens = Array.from(new Set(tokens
    .filter(t => webPushService.isIOSWebPushToken(t.token))
    .map(t => t.token)));
  const webTokens = Array.from(new Set(tokens
    .filter(t => t.platform === "web" && !webPushService.isIOSWebPushToken(t.token)
      && !/^(ExponentPushToken|ExpoPushToken)\[/.test(t.token))
    .map(t => t.token)));
  if (!iosTokens.length && !webTokens.length) return;

  const [badge] = await db.select({
    unreadCount: count(),
    // Server ordering, not a device clock, prevents older pushes rolling back
    // newer counts. No per-notification increments or client auth in the worker.
    updatedAt: sql<string>`floor(extract(epoch from statement_timestamp()) * 1000)::bigint`,
  }).from(notifications).where(and(
    eq(notifications.userId, notification.userId),
    or(eq(notifications.isRead, false), isNull(notifications.isRead)),
    eq(notifications.isVisible, true),
  ));
  // The recipient may have read it while delivery was being prepared. Avoid a
  // silent zero-count push (Safari requires user-visible push notifications).
  if (badge.unreadCount === 0) return;
  const payload = {
    title: notification.title,
    body: notification.message,
    data: {
      unreadCount: String(badge.unreadCount),
      badgeUpdatedAt: String(badge.updatedAt),
      badgeUserId: notification.userId,
      notificationId: notification.id,
      // Post alerts used an obsolete /bulletin destination.
      url: notification.relatedType === "post" && notification.relatedId
        ? `/post/${notification.relatedId}`
        : notification.actionUrl || "/",
    },
  };
  const results = await Promise.all([
    iosTokens.length ? webPushService.sendToMultipleDevices(iosTokens, payload) : null,
    webTokens.length ? firebaseNotificationService.sendPwaToMultipleDevices(webTokens, payload) : null,
  ]);
  for (const result of results) {
    if (result?.failureCount) {
      console.warn("[PWA Push] Some registered subscriptions could not receive the alert:", result.failureCount);
    }
  }
}
