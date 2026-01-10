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
    // Optimized: Build conditions array for better index usage
    const conditions = [
      eq(notifications.userId, userId),
      eq(notifications.isVisible, true)
    ];

    // Only filter by type if it's specified and not "all"
    if (type && type !== "all" && type !== "undefined") {
      conditions.push(eq(notifications.type, type as any));
    }

    return await db
      .select()
      .from(notifications)
      .where(and(...conditions))
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
    // Optimized: Build conditions array for better performance
    const conditions = [
      eq(notifications.userId, userId),
      eq(notifications.isRead, false),
      eq(notifications.isVisible, true)
    ];

    // Only filter by type if it's specified and not "all" or undefined
    if (type && type !== "all" && type !== "undefined") {
      conditions.push(eq(notifications.type, type as any));
    }
    
    const whereClause = and(...conditions);
    
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

  // Delete all notifications for a user (optionally filtered by type)
  async deleteAllNotifications(userId: string, type?: string) {
    // Optimized: Build conditions array for better performance
    const conditions = [
      eq(notifications.userId, userId),
      eq(notifications.isVisible, true)
    ];

    // Only filter by type if it's specified and not "all" or undefined
    if (type && type !== "all" && type !== "undefined") {
      conditions.push(eq(notifications.type, type as any));
    }
    
    const whereClause = and(...conditions);
    
    const deletedNotifications = await db
      .delete(notifications)
      .where(whereClause)
      .returning();
    
    return deletedNotifications;
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

  // Create dual notifications for incognito messages (both alert and message notifications)
  async notifyIncognitoMessage(receiverId: string, senderId: string, senderName: string, messagePreview: string) {
    // Create the alert notification (yellow bubble)
    const alertNotification = await this.createNotification({
      userId: receiverId,
      type: "incognito_message",
      title: `🔒 Incognito message from ${senderName}`,
      message: messagePreview,
      actionUrl: "/messages",
      relatedId: senderId,
      relatedType: "user",
      priority: "high",
    });

    // Create the regular message notification (for messages tab)
    const messageNotification = await this.createNotification({
      userId: receiverId,
      type: "message",
      title: `New message from ${senderName}`,
      message: messagePreview,
      actionUrl: "/messages",
      relatedId: senderId,
      relatedType: "user",
      priority: "normal",
    });

    return { alertNotification, messageNotification };
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

  async notifyPostShare(userId: string, sharerName: string, postId: string) {
    return this.createNotification({
      userId,
      type: "post_share",
      title: "Post shared",
      message: `${sharerName} shared your post to their Headlines`,
      actionUrl: `/bulletin`,
      relatedId: postId,
      relatedType: "post",
      priority: "medium",
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

  async notifyCommentLike(userId: string, likerName: string, commentId: string, commentPreview: string) {
    return this.createNotification({
      userId,
      type: "comment_like",
      title: "Comment liked",
      message: `${likerName} liked your comment: ${commentPreview}`,
      actionUrl: `/bulletin`,
      relatedId: commentId,
      relatedType: "comment",
      priority: "low",
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

  async notifyPostRemoved(userId: string, reason: string, actionTaken: string, adminNotes?: string) {
    const actionDescriptions: Record<string, string> = {
      "post_removed": "Your post has been removed for violating community guidelines.",
      "warning": "You have received a warning for content that may violate community guidelines.",
      "none": "Your reported post has been reviewed and no action was taken.",
    };

    const description = actionDescriptions[actionTaken] || "Your post has been reviewed by our moderation team.";
    
    let message = `${description} Reason reported: ${reason}.`;
    if (actionTaken === "post_removed" || actionTaken === "warning") {
      message += " Repeated violations may result in account suspension. Please review our community guidelines.";
    }

    return this.createNotification({
      userId,
      type: "system",
      title: "Content Moderation Notice",
      message,
      actionUrl: "/community-guidelines",
      priority: "high",
    });
  }
}

export const notificationService = new NotificationService();