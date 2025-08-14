import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { insertPostSchema, insertStorySchema, insertCommentSchema, insertContentFilterSchema, insertUserThemeSchema, insertMessageSchema, insertEventSchema, insertActionSchema, insertMeetupSchema, insertMeetupCheckInSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";

// Extend WebSocket interface for custom properties
interface ExtendedWebSocket extends WebSocket {
  action_id?: string;
  user_id?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const user = await storage.updateUser(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/user/generate-invite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inviteCode = await storage.generateInviteCode();
      await storage.updateUser(userId, { inviteCode });
      res.json({ inviteCode });
    } catch (error) {
      console.error("Error generating invite code:", error);
      res.status(500).json({ message: "Failed to generate invite code" });
    }
  });

  // Object storage upload endpoint
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Serve uploaded objects (profile pictures, etc.)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Profile picture update endpoint
  app.put("/api/user/profile-picture", isAuthenticated, async (req: any, res) => {
    if (!req.body.profileImageURL) {
      return res.status(400).json({ error: "profileImageURL is required" });
    }

    const userId = req.user.claims.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.profileImageURL
      );

      // Update user's profile image URL in database
      await storage.updateUser(userId, { profileImageUrl: objectPath });

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Theme routes
  app.get('/api/user/theme', async (req: any, res) => {
    try {
      // For debugging - use a default user ID if not authenticated
      const userId = req.user?.claims?.sub || "46297180"; // Use the logged-in user's ID as fallback
      const theme = await storage.getUserTheme(userId);
      res.json(theme);
    } catch (error) {
      console.error("Error fetching theme:", error);
      res.status(500).json({ message: "Failed to fetch theme" });
    }
  });

  app.post('/api/user/theme', async (req: any, res) => {
    try {
      // For debugging - use a default user ID if not authenticated
      const userId = req.user?.claims?.sub || "46297180"; // Use the logged-in user's ID as fallback
      const themeData = insertUserThemeSchema.parse({ ...req.body, userId });
      const theme = await storage.upsertUserTheme(themeData);
      res.json(theme);
    } catch (error) {
      console.error("Error saving theme:", error);
      res.status(500).json({ message: "Failed to save theme" });
    }
  });

  // Friend routes
  app.get('/api/friends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.post('/api/friends/invite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { inviteCode } = req.body;
      
      const inviter = await storage.getUserByInviteCode(inviteCode);
      if (!inviter) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      // Check if friendship already exists
      const existingFriends = await storage.getFriends(inviter.id);
      if (existingFriends.find(f => f.friendId === userId)) {
        return res.status(400).json({ message: "Already friends with this user" });
      }

      // Check friend limit
      if (existingFriends.length >= 15) {
        return res.status(400).json({ message: "User has reached maximum friend limit" });
      }

      const rank = existingFriends.length + 1;
      const friendship = await storage.addFriend({
        userId: inviter.id,
        friendId: userId,
        rank,
        status: "accepted"
      });

      res.json(friendship);
    } catch (error) {
      console.error("Error joining kliq:", error);
      res.status(500).json({ message: "Failed to join kliq" });
    }
  });

  app.put('/api/friends/:friendId/rank', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.params;
      const { rank } = req.body;
      
      await storage.updateFriendRank(userId, friendId, rank);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating friend rank:", error);
      res.status(500).json({ message: "Failed to update friend rank" });
    }
  });

  app.delete('/api/friends/:friendId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.params;
      
      await storage.removeFriend(userId, friendId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  // Post routes
  app.get('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filters = await storage.getContentFilters(userId);
      const filterKeywords = filters.map(f => f.keyword);
      const posts = await storage.getPosts(userId, filterKeywords);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let postData = insertPostSchema.parse({ ...req.body, userId });
      
      // Normalize media URL if provided
      if (postData.mediaUrl) {
        const objectStorage = new ObjectStorageService();
        postData.mediaUrl = objectStorage.normalizeObjectEntityPath(postData.mediaUrl);
      }
      
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      await storage.likePost(postId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      await storage.unlikePost(postId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  app.post('/api/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      const commentData = insertCommentSchema.parse({ ...req.body, userId, postId });
      const comment = await storage.addComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Content filter routes
  app.get('/api/filters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filters = await storage.getContentFilters(userId);
      res.json(filters);
    } catch (error) {
      console.error("Error fetching filters:", error);
      res.status(500).json({ message: "Failed to fetch filters" });
    }
  });

  app.post('/api/filters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filterData = insertContentFilterSchema.parse({ ...req.body, userId });
      const filter = await storage.addContentFilter(filterData);
      res.json(filter);
    } catch (error) {
      console.error("Error adding filter:", error);
      res.status(500).json({ message: "Failed to add filter" });
    }
  });

  app.delete('/api/filters/:filterId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { filterId } = req.params;
      
      await storage.removeContentFilter(userId, filterId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing filter:", error);
      res.status(500).json({ message: "Failed to remove filter" });
    }
  });

  // Media upload routes
  app.post('/api/media/upload', isAuthenticated, async (req: any, res) => {
    try {
      const objectStorage = new ObjectStorageService();
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Media serving route
  app.get('/objects/:objectPath(*)', async (req: any, res) => {
    try {
      const objectStorage = new ObjectStorageService();
      const objectFile = await objectStorage.getObjectEntityFile(req.path);
      objectStorage.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving media:", error);
      res.status(404).json({ message: "Media not found" });
    }
  });

  // Stories routes
  app.get('/api/stories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stories = await storage.getActiveStories(userId);
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.post('/api/stories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let storyData = insertStorySchema.parse({ ...req.body, userId });
      
      // Normalize media URL if provided
      if (storyData.mediaUrl) {
        const objectStorage = new ObjectStorageService();
        storyData.mediaUrl = objectStorage.normalizeObjectEntityPath(storyData.mediaUrl);
      }
      
      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  app.post('/api/stories/:storyId/view', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId } = req.params;
      
      await storage.viewStory(storyId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error viewing story:", error);
      res.status(500).json({ message: "Failed to view story" });
    }
  });

  // Auto-cleanup expired messages every 5 minutes
  setInterval(async () => {
    try {
      await storage.deleteExpiredMessages();
      console.log("Cleaned up expired messages");
    } catch (error) {
      console.error("Error cleaning up expired messages:", error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Incognito Messages (IM) routes
  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { participantId } = req.body;

      if (!participantId) {
        return res.status(400).json({ message: "Participant ID is required" });
      }

      // Check if conversation already exists between these users
      const conversations = await storage.getConversations(userId);
      const existingConversation = conversations.find(conv => 
        conv.otherUser.id === participantId
      );

      if (existingConversation) {
        return res.json(existingConversation);
      }

      // Create new conversation
      const conversation = await storage.createConversation({
        participantIds: [userId, participantId]
      });

      res.json({ id: conversation.id });
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/messages/conversation/:otherUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { otherUserId } = req.params;
      const conversation = await storage.getConversation(userId, otherUserId);
      
      if (!conversation) {
        return res.json({ messages: [] });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post('/api/messages/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { receiverId, content } = req.body;

      if (!receiverId || !content?.trim()) {
        console.log("Validation failed:", { receiverId, content: content?.trim() });
        return res.status(400).json({ message: "receiverId and content are required" });
      }

      const messageData = {
        senderId: userId,
        receiverId,
        content: content.trim(),
      };

      const message = await storage.sendMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.put('/api/messages/:messageId/read', isAuthenticated, async (req: any, res) => {
    try {
      const { messageId } = req.params;
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.put('/api/messages/conversation/:conversationId/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId } = req.params;
      await storage.markConversationAsRead(conversationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      res.status(500).json({ message: "Failed to mark conversation as read" });
    }
  });

  // Event routes
  app.get('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventData = insertEventSchema.parse({ ...req.body, userId });
      
      // Normalize media URL if provided
      if (eventData.mediaUrl) {
        const objectStorage = new ObjectStorageService();
        eventData.mediaUrl = objectStorage.normalizeObjectEntityPath(eventData.mediaUrl);
      }
      
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put('/api/events/:eventId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventId } = req.params;
      
      // Validate ownership
      const existingEvent = await storage.getEventById(eventId);
      if (!existingEvent || existingEvent.userId !== userId) {
        return res.status(403).json({ message: "You can only edit your own events" });
      }
      
      const eventData = insertEventSchema.partial().parse(req.body);
      
      // Normalize media URL if provided
      if (eventData.mediaUrl) {
        const objectStorage = new ObjectStorageService();
        eventData.mediaUrl = objectStorage.normalizeObjectEntityPath(eventData.mediaUrl);
      }
      
      const updatedEvent = await storage.updateEvent(eventId, eventData);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.put('/api/events/:eventId/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventId } = req.params;
      const { status } = req.body;
      
      if (!['going', 'maybe', 'not_going'].includes(status)) {
        return res.status(400).json({ message: "Invalid attendance status" });
      }
      
      await storage.updateEventAttendance(eventId, userId, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(500).json({ message: "Failed to update attendance" });
    }
  });

  // Action (Live Stream) routes
  
  // Get all live actions
  app.get('/api/actions', isAuthenticated, async (req: any, res) => {
    try {
      const actions = await storage.getActions();
      res.json(actions);
    } catch (error) {
      console.error("Error fetching actions:", error);
      res.status(500).json({ message: "Failed to fetch actions" });
    }
  });

  // Get specific action details
  app.get('/api/actions/:actionId', isAuthenticated, async (req: any, res) => {
    try {
      const { actionId } = req.params;
      const action = await storage.getActionById(actionId);
      
      if (!action) {
        return res.status(404).json({ message: "Action not found" });
      }
      
      res.json(action);
    } catch (error) {
      console.error("Error fetching action:", error);
      res.status(500).json({ message: "Failed to fetch action" });
    }
  });

  // Create new action (start live stream)
  app.post('/api/actions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { insertActionSchema } = await import("@shared/schema");
      
      // Generate stream key if not provided
      const streamKey = req.body.streamKey || `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const actionData = insertActionSchema.parse({ 
        ...req.body, 
        userId,
        streamKey
      });
      
      const action = await storage.createAction(actionData);
      res.json(action);
    } catch (error) {
      console.error("Error creating action:", error);
      res.status(500).json({ message: "Failed to create action" });
    }
  });

  // End action (stop live stream)
  app.put('/api/actions/:actionId/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { actionId } = req.params;
      
      // Verify user owns this action
      const action = await storage.getActionById(actionId);
      if (!action || action.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to end this action" });
      }
      
      const endedAction = await storage.endAction(actionId);
      res.json(endedAction);
    } catch (error) {
      console.error("Error ending action:", error);
      res.status(500).json({ message: "Failed to end action" });
    }
  });

  // Join action (start watching stream)
  app.post('/api/actions/:actionId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { actionId } = req.params;
      
      await storage.joinAction(actionId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error joining action:", error);
      res.status(500).json({ message: "Failed to join action" });
    }
  });

  // Leave action (stop watching stream)
  app.post('/api/actions/:actionId/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { actionId } = req.params;
      
      await storage.leaveAction(actionId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving action:", error);
      res.status(500).json({ message: "Failed to leave action" });
    }
  });

  // Get action chat messages
  app.get('/api/actions/:actionId/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { actionId } = req.params;
      const messages = await storage.getActionChatMessages(actionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching action chat:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Send action chat message
  app.post('/api/actions/:actionId/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { actionId } = req.params;
      const { insertActionChatMessageSchema } = await import("@shared/schema");
      const messageData = insertActionChatMessageSchema.parse({
        ...req.body,
        actionId,
        userId
      });
      
      const message = await storage.addActionChatMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send chat message" });
    }
  });

  // SMS verification routes (mocked for MVP)
  app.post('/api/auth/send-verification', async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      // Mock SMS sending - in production, integrate with SMS service
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`Mock SMS to ${phoneNumber}: Your verification code is ${verificationCode}`);
      
      res.json({ 
        success: true, 
        message: "Verification code sent",
        mockCode: verificationCode // Remove in production
      });
    } catch (error) {
      console.error("Error sending verification:", error);
      res.status(500).json({ message: "Failed to send verification" });
    }
  });

  app.post('/api/auth/verify-phone', async (req, res) => {
    try {
      const { phoneNumber, verificationCode } = req.body;
      // Mock verification - in production, verify against SMS service
      res.json({ success: true, verified: true });
    } catch (error) {
      console.error("Error verifying phone:", error);
      res.status(500).json({ message: "Failed to verify phone" });
    }
  });

  // Meetup (Location check-in) routes
  
  // Get all meetups for user's kliq
  app.get('/api/meetups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetups = await storage.getMeetups(userId);
      res.json(meetups);
    } catch (error) {
      console.error("Error fetching meetups:", error);
      res.status(500).json({ message: "Failed to fetch meetups" });
    }
  });

  // Get nearby meetups based on user location
  app.get('/api/meetups/nearby', isAuthenticated, async (req: any, res) => {
    try {
      const { lat, lng, radius = 5 } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusKm = parseFloat(radius as string);
      
      const nearbyMeetups = await storage.getNearbyMeetups(latitude, longitude, radiusKm);
      res.json(nearbyMeetups);
    } catch (error) {
      console.error("Error fetching nearby meetups:", error);
      res.status(500).json({ message: "Failed to fetch nearby meetups" });
    }
  });

  // Get specific meetup details
  app.get('/api/meetups/:meetupId', isAuthenticated, async (req: any, res) => {
    try {
      const { meetupId } = req.params;
      const meetup = await storage.getMeetupById(meetupId);
      
      if (!meetup) {
        return res.status(404).json({ message: "Meetup not found" });
      }
      
      res.json(meetup);
    } catch (error) {
      console.error("Error fetching meetup:", error);
      res.status(500).json({ message: "Failed to fetch meetup" });
    }
  });

  // Create new meetup
  app.post('/api/meetups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetupData = insertMeetupSchema.parse({ 
        ...req.body, 
        userId: userId
      });
      
      const meetup = await storage.createMeetup(meetupData);
      res.json(meetup);
    } catch (error) {
      console.error("Error creating meetup:", error);
      res.status(500).json({ message: "Failed to create meetup" });
    }
  });

  // End meetup
  app.put('/api/meetups/:meetupId/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { meetupId } = req.params;
      
      // Verify user owns this meetup
      const meetup = await storage.getMeetupById(meetupId);
      if (!meetup || meetup.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to end this meetup" });
      }
      
      const endedMeetup = await storage.endMeetup(meetupId);
      res.json(endedMeetup);
    } catch (error) {
      console.error("Error ending meetup:", error);
      res.status(500).json({ message: "Failed to end meetup" });
    }
  });

  // Check in to meetup
  app.post('/api/meetups/:meetupId/checkin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { meetupId } = req.params;
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Location coordinates are required" });
      }
      
      // Create check-in record
      const checkInData = insertMeetupCheckInSchema.parse({
        meetupId,
        userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });
      
      const checkIn = await storage.checkInToMeetup(checkInData);
      
      // Verify location is within acceptable range
      const isVerified = await storage.verifyLocationCheckIn(
        meetupId, 
        userId, 
        parseFloat(latitude), 
        parseFloat(longitude)
      );
      
      res.json({ 
        checkIn, 
        verified: isVerified,
        message: isVerified 
          ? "Successfully checked in!" 
          : "Check-in recorded, but location verification failed. You may be too far from the meetup location."
      });
    } catch (error) {
      console.error("Error checking in to meetup:", error);
      res.status(500).json({ message: "Failed to check in to meetup" });
    }
  });

  // Check out from meetup
  app.post('/api/meetups/:meetupId/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { meetupId } = req.params;
      
      await storage.checkOutFromMeetup(meetupId, userId);
      res.json({ success: true, message: "Successfully checked out!" });
    } catch (error) {
      console.error("Error checking out from meetup:", error);
      res.status(500).json({ message: "Failed to check out from meetup" });
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket server for real-time Action features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'join_action':
            // Join action room for real-time updates
            ws.action_id = data.actionId;
            ws.user_id = data.userId;
            
            // Broadcast to other viewers that someone joined
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client !== ws && 
                  client.readyState === WebSocket.OPEN && 
                  client.action_id === data.actionId) {
                client.send(JSON.stringify({
                  type: 'viewer_joined',
                  actionId: data.actionId,
                  userId: data.userId
                }));
              }
            });
            break;
            
          case 'leave_action':
            // Leave action room
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client !== ws && 
                  client.readyState === WebSocket.OPEN && 
                  client.action_id === data.actionId) {
                client.send(JSON.stringify({
                  type: 'viewer_left',
                  actionId: data.actionId,
                  userId: data.userId
                }));
              }
            });
            break;
            
          case 'action_chat':
            // Broadcast chat message to all viewers
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  client.action_id === data.actionId) {
                client.send(JSON.stringify({
                  type: 'action_chat',
                  actionId: data.actionId,
                  message: data.message,
                  userId: data.userId,
                  userName: data.userName,
                  timestamp: new Date().toISOString()
                }));
              }
            });
            break;
            
          case 'action_ended':
            // Broadcast that action has ended
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  client.action_id === data.actionId) {
                client.send(JSON.stringify({
                  type: 'action_ended',
                  actionId: data.actionId
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      if (ws.action_id && ws.user_id) {
        // Notify other viewers that someone left
        wss.clients.forEach((client: ExtendedWebSocket) => {
          if (client.readyState === WebSocket.OPEN && 
              client.action_id === ws.action_id) {
            client.send(JSON.stringify({
              type: 'viewer_left',
              actionId: ws.action_id,
              userId: ws.user_id
            }));
          }
        });
      }
    });
  });

  return httpServer;
}
