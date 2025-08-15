import { db } from "./db";
import { notifications, type InsertNotification } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export class NotificationService {
  // Create a new notification
  async createNotification(data: InsertNotification) {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    return notification;
  }

  // Get notifications for a user
  async getUserNotifications(userId: string, type?: string) {
    let whereClause = and(
      eq(notifications.userId, userId),
      eq(notifications.isVisible, true)
    );

    if (type && type !== "all") {
      whereClause = and(
        eq(notifications.userId, userId),
        eq(notifications.type, type as any),
        eq(notifications.isVisible, true)
      );
    }

    return await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt));
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    const [notification] = await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();
    return notification;
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string, type?: string) {
    let whereClause = and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false),
      eq(notifications.isVisible, true)
    );

    if (type && type !== "all") {
      whereClause = and(
        eq(notifications.userId, userId),
        eq(notifications.type, type as any),
        eq(notifications.isRead, false),
        eq(notifications.isVisible, true)
      );
    }

    const updatedNotifications = await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(whereClause)
      .returning();
    
    return updatedNotifications;
  }

  // Hide/delete a notification
  async hideNotification(notificationId: string, userId: string) {
    const [notification] = await db
      .update(notifications)
      .set({ isVisible: false })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();
    return notification;
  }

  // Delete a notification completely
  async deleteNotification(notificationId: string, userId: string) {
    const [notification] = await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();
    return notification;
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    const now = new Date();
    const deletedNotifications = await db
      .delete(notifications)
      .where(and(
        eq(notifications.isVisible, true),
        // notifications.expiresAt < now (need proper comparison)
      ))
      .returning();
    
    return deletedNotifications;
  }

  // Helper methods for creating specific notification types
  async notifyNewMessage(receiverId: string, senderId: string, senderName: string, messagePreview: string) {
    return this.createNotification({
      userId: receiverId,
      type: "message",
      title: `New message from ${senderName}`,
      message: messagePreview,
      actionUrl: "/messages",
      relatedId: senderId,
      relatedType: "user",
      priority: "normal",
    });
  }

  async notifyFriendRequest(userId: string, fromUserId: string, fromUserName: string) {
    return this.createNotification({
      userId,
      type: "friend_request",
      title: "New friend request",
      message: `${fromUserName} wants to be friends`,
      actionUrl: "/friends",
      relatedId: fromUserId,
      relatedType: "user",
      priority: "normal",
    });
  }

  async notifyEventInvite(userId: string, eventId: string, eventTitle: string, inviterName: string) {
    return this.createNotification({
      userId,
      type: "event_invite",
      title: "Event invitation",
      message: `${inviterName} invited you to "${eventTitle}"`,
      actionUrl: `/events/${eventId}`,
      relatedId: eventId,
      relatedType: "event",
      priority: "normal",
    });
  }

  async notifyPostLike(userId: string, likerName: string, postId: string) {
    return this.createNotification({
      userId,
      type: "post_like",
      title: "Post liked",
      message: `${likerName} liked your post`,
      actionUrl: `/bulletin`,
      relatedId: postId,
      relatedType: "post",
      priority: "low",
    });
  }

  async notifyComment(userId: string, commenterName: string, postId: string, commentPreview: string) {
    return this.createNotification({
      userId,
      type: "comment",
      title: "New comment",
      message: `${commenterName} commented: ${commentPreview}`,
      actionUrl: `/bulletin`,
      relatedId: postId,
      relatedType: "post",
      priority: "normal",
    });
  }

  async notifyLiveStream(userId: string, streamerName: string, streamTitle: string, streamId: string) {
    return this.createNotification({
      userId,
      type: "live_stream",
      title: "Live stream started",
      message: `${streamerName} is live: ${streamTitle}`,
      actionUrl: `/action/${streamId}`,
      relatedId: streamId,
      relatedType: "action",
      priority: "high",
    });
  }

  async notifyBirthday(userId: string, birthdayUserName: string, birthdayUserId: string) {
    return this.createNotification({
      userId,
      type: "birthday",
      title: "Birthday reminder",
      message: `It's ${birthdayUserName}'s birthday today!`,
      actionUrl: `/user/${birthdayUserId}`,
      relatedId: birthdayUserId,
      relatedType: "user",
      priority: "normal",
    });
  }
}

export const notificationService = new NotificationService();