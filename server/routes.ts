import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { notificationService } from "./notificationService";
import { insertPostSchema, insertStorySchema, insertCommentSchema, insertContentFilterSchema, insertUserThemeSchema, insertMessageSchema, insertEventSchema, insertActionSchema, insertMeetupSchema, insertMeetupCheckInSchema, insertGifSchema, insertMovieconSchema, insertPollSchema, insertPollVoteSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";

// Extend WebSocket interface for custom properties
interface ExtendedWebSocket extends WebSocket {
  action_id?: string;
  user_id?: string;
  call_id?: string;
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

  // Public user profile endpoint (for viewing other users' profiles)
  app.get('/api/user/profile/:userId', async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return public profile info (excluding sensitive data)
      const publicProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        kliqName: user.kliqName,
        birthdate: user.birthdate,
        profileMusicUrl: user.profileMusicUrl,
        profileMusicTitle: user.profileMusicTitle,
        createdAt: user.createdAt,
      };
      
      res.json(publicProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Unified profile endpoint (basic info + details)
  app.put("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = req.body;

      // Validate and clean the data
      const cleanedData: any = {};
      
      // Handle basic profile fields
      if (profileData.bio !== undefined) cleanedData.bio = profileData.bio;
      if (profileData.phoneNumber !== undefined) cleanedData.phoneNumber = profileData.phoneNumber;
      if (profileData.kliqName !== undefined) cleanedData.kliqName = profileData.kliqName;
      if (profileData.birthdate !== undefined) cleanedData.birthdate = profileData.birthdate;
      
      // Handle array fields (filter out empty strings)
      if (profileData.interests) cleanedData.interests = profileData.interests.filter((item: string) => item.trim());
      if (profileData.favoriteLocations) cleanedData.favoriteLocations = profileData.favoriteLocations.filter((item: string) => item.trim());
      if (profileData.favoriteFoods) cleanedData.favoriteFoods = profileData.favoriteFoods.filter((item: string) => item.trim());
      if (profileData.musicGenres) cleanedData.musicGenres = profileData.musicGenres.filter((item: string) => item.trim());
      if (profileData.hobbies) cleanedData.hobbies = profileData.hobbies.filter((item: string) => item.trim());
      if (profileData.favoriteMovies) cleanedData.favoriteMovies = profileData.favoriteMovies.filter((item: string) => item.trim());
      if (profileData.favoriteBooks) cleanedData.favoriteBooks = profileData.favoriteBooks.filter((item: string) => item.trim());
      
      // Handle string fields
      if (profileData.relationshipStatus !== undefined) cleanedData.relationshipStatus = profileData.relationshipStatus;
      if (profileData.petPreferences !== undefined) cleanedData.petPreferences = profileData.petPreferences;
      if (profileData.lifestyle !== undefined) cleanedData.lifestyle = profileData.lifestyle;

      await storage.updateUser(userId, cleanedData);

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Profile music endpoints
  app.put("/api/user/profile-music", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { musicUrl, musicTitle } = req.body;

      if (!musicUrl || !musicTitle) {
        return res.status(400).json({ message: "Music URL and title are required" });
      }

      // Handle different types of URLs
      let finalMusicUrl = musicUrl;
      
      // For URLs from object storage, normalize the path
      if (musicUrl.includes('storage.googleapis.com') || musicUrl.startsWith('/objects/')) {
        try {
          const objectStorageService = new ObjectStorageService();
          finalMusicUrl = objectStorageService.normalizeObjectEntityPath(musicUrl);
        } catch (error) {
          console.log("Error normalizing object path, using original URL:", error);
          finalMusicUrl = musicUrl;
        }
      }
      // For external URLs (YouTube, SoundCloud, etc.), use them directly
      else {
        finalMusicUrl = musicUrl;
      }

      await storage.updateUser(userId, {
        profileMusicUrl: finalMusicUrl,
        profileMusicTitle: musicTitle,
      });

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile music:", error);
      res.status(500).json({ message: "Failed to update profile music" });
    }
  });

  app.delete("/api/user/profile-music", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      await storage.updateUser(userId, {
        profileMusicUrl: null,
        profileMusicTitle: null,
      });

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error removing profile music:", error);
      res.status(500).json({ message: "Failed to remove profile music" });
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
      
      // Check if invite code has already been used
      const isCodeUsed = await storage.isInviteCodeUsed(inviteCode);
      if (isCodeUsed) {
        return res.status(400).json({ message: "This invite code has already been used" });
      }
      
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

      // Mark the invite code as used before creating the friendship
      await storage.markInviteCodeAsUsed(inviteCode, userId, inviter.id);

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

  // Get aggregated kliq feed with posts, polls, events, and actions from all kliq members
  app.get('/api/kliq-feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filters = await storage.getContentFilters(userId);
      const filterKeywords = filters.map(f => f.keyword);
      const feed = await storage.getKliqFeed(userId, filterKeywords);
      res.json(feed);
    } catch (error) {
      console.error("Error fetching kliq feed:", error);
      res.status(500).json({ message: "Failed to fetch kliq feed" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Convert numeric coordinates to strings if present and handle address
      const processedBody = { ...req.body, userId };
      if (processedBody.latitude !== undefined && typeof processedBody.latitude === 'number') {
        processedBody.latitude = processedBody.latitude.toString();
      }
      if (processedBody.longitude !== undefined && typeof processedBody.longitude === 'number') {
        processedBody.longitude = processedBody.longitude.toString();
      }
      // Ensure address field is included
      if (processedBody.address === undefined) {
        processedBody.address = null;
      }
      
      let postData = insertPostSchema.parse(processedBody);
      
      // Normalize media URL if provided
      if (postData.mediaUrl) {
        const objectStorage = new ObjectStorageService();
        postData.mediaUrl = objectStorage.normalizeObjectEntityPath(postData.mediaUrl);
      }
      
      const post = await storage.createPost(postData);
      
      // Create notifications for post likes (for future likes)
      // Note: Actual like notifications will be created when someone likes the post
      
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
      
      // Get post details to notify the author
      const post = await storage.getPostById(postId);
      console.log("Post like notification check:", { postUserId: post?.userId, currentUserId: userId, shouldNotify: post && post.userId !== userId });
      
      if (post) {
        const user = await storage.getUser(userId);
        if (user) {
          console.log("Creating like notification for:", post.userId, "from:", user.firstName);
          await notificationService.notifyPostLike(
            post.userId,
            user.firstName || "Someone",
            postId
          );
        }
      }
      
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
      
      // Get post details to notify the author
      const post = await storage.getPostById(postId);
      if (post) {
        const user = await storage.getUser(userId);
        if (user) {
          const commentPreview = comment.content.slice(0, 50) + (comment.content.length > 50 ? "..." : "");
          await notificationService.notifyComment(
            post.userId,
            user.firstName || "Someone",
            postId,
            commentPreview
          );
        }
      }
      
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
        return res.json({ id: participantId });
      }

      // Create new conversation
      const conversation = await storage.createConversation({
        participantIds: [userId, participantId]
      });

      // Return the participant ID so the frontend can navigate correctly
      res.json({ id: participantId });
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
      const { receiverId, content, mediaUrl, mediaType, gifId, movieconId } = req.body;

      // Validate that we have at least one type of content
      if (!receiverId || (!content?.trim() && !mediaUrl && !gifId && !movieconId)) {
        console.log("Validation failed:", { receiverId, content: content?.trim(), mediaUrl, gifId, movieconId });
        return res.status(400).json({ message: "receiverId and at least one content type (text, media, gif, or moviecon) are required" });
      }

      // Validate that both sender and receiver exist in the database
      const [sender, receiver] = await Promise.all([
        storage.getUser(userId),
        storage.getUser(receiverId)
      ]);

      if (!sender) {
        console.log("Sender not found:", userId);
        return res.status(400).json({ message: "Sender user not found" });
      }

      if (!receiver) {
        console.log("Receiver not found:", receiverId);
        return res.status(400).json({ message: "Receiver user not found" });
      }

      const messageData = {
        senderId: userId,
        receiverId,
        content: content?.trim() || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        gifId: gifId || null,
        movieconId: movieconId || null,
      };

      const message = await storage.sendMessage(messageData);
      
      // Send notification to the receiver
      if (receiverId !== userId) {
        const sender = await storage.getUser(userId);
        if (sender) {
          let messagePreview = "";
          if (content?.trim()) {
            messagePreview = content.trim().slice(0, 30) + (content.trim().length > 30 ? "..." : "");
          } else if (mediaUrl) {
            messagePreview = mediaType === "image" ? "📷 Photo" : "🎥 Video";
          } else if (gifId) {
            messagePreview = "🎭 GIF";
          } else if (movieconId) {
            messagePreview = "🎬 Moviecon";
          }
          
          await notificationService.notifyNewMessage(
            receiverId,
            userId,
            sender.firstName || "Someone",
            messagePreview
          );
        }
      }
      
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

  // Manual cleanup endpoint for testing
  app.post('/api/messages/cleanup-expired', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteExpiredMessages();
      res.json({ success: true, message: "Expired messages cleaned up" });
    } catch (error) {
      console.error("Error cleaning up expired messages:", error);
      res.status(500).json({ message: "Failed to cleanup expired messages" });
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
      
      // Auto-post to headlines when live stream starts
      const postContent = `🔴 LIVE: Streaming "${action.title}" right now! ${action.description ? action.description : ''}`;
      
      // Create the auto-post
      const autoPost = await storage.createPost({
        userId: userId,
        content: postContent.trim(),
        mediaUrl: null,
        mediaType: null,
        gifId: null,
        movieconId: null
      });
      
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

  // GPS Check-in route - create a post with location
  app.post("/api/checkin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { latitude, longitude, locationName, address, emoji } = req.body;

      // Create post with location info
      const post = await storage.createPost({
        userId,
        content: `${emoji ? emoji + ' ' : ''}Checked in at ${locationName}`,
        latitude: latitude?.toString(),
        longitude: longitude?.toString(), 
        locationName,
        address,
      });

      res.json(post);
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  // GIF API routes
  
  // Get all GIFs
  app.get('/api/gifs', async (req, res) => {
    try {
      const gifs = await storage.getAllGifs();
      res.json(gifs);
    } catch (error) {
      console.error("Error fetching gifs:", error);
      res.status(500).json({ message: "Failed to fetch gifs" });
    }
  });

  // Get GIFs by category
  app.get('/api/gifs/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const gifs = await storage.getGifsByCategory(category);
      res.json(gifs);
    } catch (error) {
      console.error("Error fetching gifs by category:", error);
      res.status(500).json({ message: "Failed to fetch gifs by category" });
    }
  });

  // Get trending GIFs
  app.get('/api/gifs/trending', async (req, res) => {
    try {
      const gifs = await storage.getTrendingGifs();
      res.json(gifs);
    } catch (error) {
      console.error("Error fetching trending gifs:", error);
      res.status(500).json({ message: "Failed to fetch trending gifs" });
    }
  });

  // Get featured GIFs
  app.get('/api/gifs/featured', async (req, res) => {
    try {
      const gifs = await storage.getFeaturedGifs();
      res.json(gifs);
    } catch (error) {
      console.error("Error fetching featured gifs:", error);
      res.status(500).json({ message: "Failed to fetch featured gifs" });
    }
  });

  // Search GIFs
  app.get('/api/gifs/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      const gifs = await storage.searchGifs(q);
      res.json(gifs);
    } catch (error) {
      console.error("Error searching gifs:", error);
      res.status(500).json({ message: "Failed to search gifs" });
    }
  });

  // Get GIF by ID
  app.get('/api/gifs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const gif = await storage.getGifById(id);
      if (!gif) {
        return res.status(404).json({ message: "GIF not found" });
      }
      res.json(gif);
    } catch (error) {
      console.error("Error fetching gif:", error);
      res.status(500).json({ message: "Failed to fetch gif" });
    }
  });

  // Create new GIF (admin only)
  app.post('/api/gifs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gifData = insertGifSchema.parse({ 
        ...req.body, 
        uploadedBy: userId 
      });
      
      const gif = await storage.createGif(gifData);
      res.json(gif);
    } catch (error) {
      console.error("Error creating gif:", error);
      res.status(500).json({ message: "Failed to create gif" });
    }
  });

  // Update GIF (admin only)
  app.put('/api/gifs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const gif = await storage.updateGif(id, updates);
      res.json(gif);
    } catch (error) {
      console.error("Error updating gif:", error);
      res.status(500).json({ message: "Failed to update gif" });
    }
  });

  // Delete GIF (admin only)
  app.delete('/api/gifs/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGif(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting gif:", error);
      res.status(500).json({ message: "Failed to delete gif" });
    }
  });

  // Moviecon API routes
  
  // Get all Moviecons
  app.get('/api/moviecons', async (req, res) => {
    try {
      const { q } = req.query;
      let moviecons;
      
      if (q && typeof q === 'string') {
        // If search query provided, search moviecons
        moviecons = await storage.searchMoviecons(q);
      } else {
        // Otherwise get all moviecons
        moviecons = await storage.getAllMoviecons();
      }
      
      res.json(moviecons);
    } catch (error) {
      console.error("Error fetching moviecons:", error);
      res.status(500).json({ message: "Failed to fetch moviecons" });
    }
  });

  // Get Moviecons by category
  app.get('/api/moviecons/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const moviecons = await storage.getMovieconsByCategory(category);
      res.json(moviecons);
    } catch (error) {
      console.error("Error fetching moviecons by category:", error);
      res.status(500).json({ message: "Failed to fetch moviecons by category" });
    }
  });

  // Get trending Moviecons
  app.get('/api/moviecons/trending', async (req, res) => {
    try {
      const moviecons = await storage.getTrendingMoviecons();
      res.json(moviecons);
    } catch (error) {
      console.error("Error fetching trending moviecons:", error);
      res.status(500).json({ message: "Failed to fetch trending moviecons" });
    }
  });

  // Get featured Moviecons
  app.get('/api/moviecons/featured', async (req, res) => {
    try {
      const moviecons = await storage.getFeaturedMoviecons();
      res.json(moviecons);
    } catch (error) {
      console.error("Error fetching featured moviecons:", error);
      res.status(500).json({ message: "Failed to fetch featured moviecons" });
    }
  });

  // Search Moviecons
  app.get('/api/moviecons/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      const moviecons = await storage.searchMoviecons(q);
      res.json(moviecons);
    } catch (error) {
      console.error("Error searching moviecons:", error);
      res.status(500).json({ message: "Failed to search moviecons" });
    }
  });

  // Get Moviecon by ID
  app.get('/api/moviecons/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const moviecon = await storage.getMovieconById(id);
      if (!moviecon) {
        return res.status(404).json({ message: "Moviecon not found" });
      }
      res.json(moviecon);
    } catch (error) {
      console.error("Error fetching moviecon:", error);
      res.status(500).json({ message: "Failed to fetch moviecon" });
    }
  });

  // Create new Moviecon (admin only)
  app.post('/api/moviecons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, url, videoUrl } = req.body;
      
      // Accept either 'url' or 'videoUrl' for backward compatibility
      const videoUrlValue = videoUrl || url;
      
      if (!title || !videoUrlValue) {
        return res.status(400).json({ message: "Title and video URL are required" });
      }

      // Handle object storage URL and set ACL policy
      const objectStorageService = new ObjectStorageService();
      let normalizedUrl = videoUrlValue;
      
      // If it's an object storage URL, normalize path
      if (videoUrlValue.includes('storage.googleapis.com') || videoUrlValue.startsWith('/objects/')) {
        normalizedUrl = objectStorageService.normalizeObjectEntityPath(videoUrlValue);
      }

      const moviecon = await storage.createMoviecon({
        id: `mv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        videoUrl: normalizedUrl,
        duration: 0, // Will be determined later if needed
        uploadedBy: userId,
      });
      
      res.json(moviecon);
    } catch (error) {
      console.error("Error creating moviecon:", error);
      res.status(500).json({ message: "Failed to create moviecon" });
    }
  });

  // Update Moviecon (admin only)
  app.put('/api/moviecons/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const moviecon = await storage.updateMoviecon(id, updates);
      res.json(moviecon);
    } catch (error) {
      console.error("Error updating moviecon:", error);
      res.status(500).json({ message: "Failed to update moviecon" });
    }
  });

  // Delete Moviecon (admin only)
  app.delete('/api/moviecons/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMoviecon(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting moviecon:", error);
      res.status(500).json({ message: "Failed to delete moviecon" });
    }
  });

  // Poll routes
  app.get('/api/polls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const polls = await storage.getPolls(userId);
      res.json(polls);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ message: "Failed to fetch polls" });
    }
  });

  app.post('/api/polls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { expiresAt, ...otherData } = req.body;
      
      const pollData = insertPollSchema.parse({
        ...otherData,
        userId,
        expiresAt: new Date(expiresAt), // Convert string to Date object
      });

      const poll = await storage.createPoll(pollData);
      res.json(poll);
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ message: "Failed to create poll" });
    }
  });

  app.get('/api/polls/:pollId', isAuthenticated, async (req, res) => {
    try {
      const { pollId } = req.params;
      const poll = await storage.getPollById(pollId);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      res.json(poll);
    } catch (error) {
      console.error("Error fetching poll:", error);
      res.status(500).json({ message: "Failed to fetch poll" });
    }
  });

  app.post('/api/polls/:pollId/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pollId } = req.params;
      const { selectedOption } = req.body;

      if (typeof selectedOption !== 'number') {
        return res.status(400).json({ message: "Selected option must be a number" });
      }

      const voteData = insertPollVoteSchema.parse({
        pollId,
        userId,
        selectedOption,
      });

      const vote = await storage.votePoll(voteData);
      console.log(`User ${userId} voted ${selectedOption} on poll ${pollId}`);
      
      // Get fresh poll results after the vote
      const updatedResults = await storage.getPollResults(pollId);
      console.log(`Updated poll results for ${pollId}:`, updatedResults);
      
      res.json({ vote, results: updatedResults });
    } catch (error) {
      console.error("Error voting on poll:", error);
      res.status(500).json({ message: "Failed to vote on poll" });
    }
  });

  app.get('/api/polls/:pollId/results', isAuthenticated, async (req, res) => {
    try {
      const { pollId } = req.params;
      const results = await storage.getPollResults(pollId);
      
      // Set cache headers to prevent caching of poll results for real-time updates
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      console.log(`Poll ${pollId} results:`, results);
      res.json(results);
    } catch (error) {
      console.error("Error fetching poll results:", error);
      res.status(500).json({ message: "Failed to fetch poll results" });
    }
  });

  // Video call routes
  app.post('/api/video-calls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { participantIds } = req.body;
      
      if (!participantIds || !Array.isArray(participantIds)) {
        return res.status(400).json({ message: "Invalid participant IDs" });
      }

      // Create video call
      const call = await storage.createVideoCall({
        initiatorId: userId,
        status: "pending"
      });

      // Add initiator as participant
      await storage.addCallParticipant({
        callId: call.id,
        userId: userId,
        status: "joined"
      });

      // Add other participants
      for (const participantId of participantIds) {
        if (participantId !== userId) {
          await storage.addCallParticipant({
            callId: call.id,
            userId: participantId,
            status: "invited"
          });
        }
      }

      // Get call with participants
      const callWithParticipants = {
        ...call,
        participants: await storage.getCallParticipants(call.id)
      };

      res.json(callWithParticipants);
    } catch (error) {
      console.error("Error creating video call:", error);
      res.status(500).json({ message: "Failed to create video call" });
    }
  });

  app.post('/api/video-calls/:callId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { callId } = req.params;

      await storage.updateParticipantStatus(callId, userId, "joined", new Date());
      res.json({ message: "Joined call successfully" });
    } catch (error) {
      console.error("Error joining video call:", error);
      res.status(500).json({ message: "Failed to join video call" });
    }
  });

  app.post('/api/video-calls/:callId/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { callId } = req.params;

      await storage.updateParticipantStatus(callId, userId, "left", undefined, new Date());
      res.json({ message: "Left call successfully" });
    } catch (error) {
      console.error("Error leaving video call:", error);
      res.status(500).json({ message: "Failed to leave video call" });
    }
  });

  app.post('/api/video-calls/:callId/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { callId } = req.params;

      // Check if user is the initiator
      const call = await storage.getVideoCall(callId);
      if (!call || call.initiatorId !== userId) {
        return res.status(403).json({ message: "Only call initiator can end the call" });
      }

      await storage.updateVideoCallStatus(callId, "ended", undefined, new Date());
      res.json({ message: "Call ended successfully" });
    } catch (error) {
      console.error("Error ending video call:", error);
      res.status(500).json({ message: "Failed to end video call" });
    }
  });

  app.get('/api/video-calls/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeCalls = await storage.getUserActiveCalls(userId);
      res.json(activeCalls);
    } catch (error) {
      console.error("Error fetching active calls:", error);
      res.status(500).json({ message: "Failed to fetch active calls" });
    }
  });

  // Birthday routes
  app.get("/api/birthdays/today", isAuthenticated, async (req: any, res) => {
    try {
      const birthdayUsers = await storage.getUsersWithBirthdayToday();
      res.json(birthdayUsers);
    } catch (error) {
      console.error("Error fetching birthday users:", error);
      res.status(500).json({ message: "Failed to fetch birthday users" });
    }
  });

  // Update user birthdate
  app.patch("/api/user/birthdate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { birthdate } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { birthdate });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating birthdate:", error);
      res.status(500).json({ message: "Failed to update birthdate" });
    }
  });

  // Send birthday message (creates automatic birthday post)
  app.post("/api/birthdays/send-message", isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { birthdayUserId, message } = req.body;
      
      const currentYear = new Date().getFullYear();
      
      // Check if message already sent this year
      const existingMessages = await storage.getBirthdayMessagesSentThisYear(birthdayUserId, currentYear);
      const alreadySent = existingMessages.some(msg => msg.senderUserId === senderId);
      
      if (alreadySent) {
        return res.status(400).json({ message: "Birthday message already sent this year" });
      }
      
      // Get birthday user info
      const birthdayUser = await storage.getUser(birthdayUserId);
      if (!birthdayUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create post for birthday message
      const post = await storage.createPost({
        userId: senderId,
        content: `🎉 Happy Birthday ${birthdayUser.firstName}! ${message}`
      });
      
      // Save birthday message record
      const birthdayMessage = await storage.createBirthdayMessage({
        birthdayUserId,
        senderUserId: senderId,
        message,
        year: currentYear,
        postId: post.id
      });
      
      res.json({ success: true, post, birthdayMessage });
    } catch (error) {
      console.error("Error sending birthday message:", error);
      res.status(500).json({ message: "Failed to send birthday message" });
    }
  });

  // Notification API routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type } = req.query;
      const notifications = await notificationService.getUserNotifications(userId, type);
      console.log("Fetching notifications for user:", userId, "type:", type, "count:", notifications.length);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark all notifications as read - must come BEFORE the :id route
  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type } = req.body;
      const notifications = await notificationService.markAllAsRead(userId, type);
      res.json(notifications);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  // Delete all notifications - must come BEFORE the :id route
  app.delete('/api/notifications/delete-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type } = req.body;
      const notifications = await notificationService.deleteAllNotifications(userId, type);
      res.json(notifications);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      res.status(500).json({ message: "Failed to delete all notifications" });
    }
  });

  app.patch('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { isRead } = req.body;

      if (isRead) {
        const notification = await notificationService.markAsRead(id, userId);
        res.json(notification);
      } else {
        res.status(400).json({ message: "Invalid update operation" });
      }
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const notification = await notificationService.deleteNotification(id, userId);
      res.json(notification);
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Test endpoint to create a demo notification
  app.post('/api/notifications/demo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, title, message } = req.body;
      console.log("Creating demo notification for user:", userId, "type:", type);
      
      const actionUrls = {
        message: '/messages',
        event_invite: '/events', 
        friend_request: '/kliq',
        post_like: '/bulletin'
      };
      
      const notification = await notificationService.createNotification({
        userId: userId,
        type: type || 'post_like',
        title: title || 'Demo Notification',
        message: message || 'This is a test notification to verify the system works!',
        actionUrl: actionUrls[type as keyof typeof actionUrls] || '/bulletin',
        relatedId: `demo-${type}-id`,
        relatedType: type === 'message' ? 'conversation' : type === 'event_invite' ? 'event' : type === 'friend_request' ? 'user' : 'post',
        priority: 'normal',
      });
      
      console.log("Demo notification created successfully:", notification);
      res.json(notification);
    } catch (error) {
      console.error("Error creating demo notification:", error);
      res.status(500).json({ message: "Failed to create demo notification" });
    }
  });

  // Test endpoint to create IM notification
  app.post('/api/notifications/test-im', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const notification = await notificationService.createNotification({
        userId,
        type: 'message' as const,
        title: 'New IM from Alex',
        message: 'Alex: Hey! How was your day? Want to hang out later?',
        actionUrl: '/messages',
        relatedId: 'mock-conversation-id',
        relatedType: 'conversation',
        priority: 'medium' as const,
      });

      console.log("Test IM notification created:", notification);
      res.json({ success: true, notification });
    } catch (error) {
      console.error("Error creating test IM notification:", error);
      res.status(500).json({ message: "Failed to create test IM notification" });
    }
  });

  // Test endpoint to create sample notifications of different types
  app.post('/api/notifications/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const testNotifications = [
        {
          userId,
          type: 'message' as const,
          title: 'New Message',
          message: 'Alex sent you a message',
          actionUrl: '/messages',
          priority: 'medium' as const,
        },
        {
          userId,
          type: 'friend_request' as const,
          title: 'Friend Request',
          message: 'Jordan wants to join your kliq',
          actionUrl: '/kliq',
          priority: 'high' as const,
        },
        {
          userId,
          type: 'event_invite' as const,
          title: 'Event Invitation',
          message: 'You are invited to Movie Night',
          actionUrl: '/events',
          priority: 'medium' as const,
        },
      ];

      const createdNotifications = [];
      for (const notificationData of testNotifications) {
        const notification = await notificationService.createNotification(notificationData);
        createdNotifications.push(notification);
      }

      res.json({ 
        success: true, 
        created: createdNotifications.length,
        notifications: createdNotifications 
      });
    } catch (error) {
      console.error("Error creating test notifications:", error);
      res.status(500).json({ message: "Failed to create test notifications" });
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
            
          case 'join-call-signaling':
            // Join user to call signaling
            ws.user_id = data.userId;
            break;
            
          case 'video-call-invite':
            // Send call invite to specific users
            const { callId, invitedUsers } = data;
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  invitedUsers.includes(client.user_id)) {
                client.send(JSON.stringify({
                  type: 'call-invite',
                  callId: callId,
                  from: data.userId
                }));
              }
            });
            break;
            
          case 'video-call-response':
            // Handle call response (accept/decline)
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  client.call_id === data.callId) {
                client.send(JSON.stringify({
                  type: 'call-response',
                  callId: data.callId,
                  userId: data.userId,
                  response: data.response // 'accept' or 'decline'
                }));
              }
            });
            break;
            
          case 'webrtc-signal':
            // Forward WebRTC signaling messages
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  client.call_id === data.callId &&
                  client.user_id === data.targetUserId) {
                client.send(JSON.stringify({
                  type: 'webrtc-signal',
                  callId: data.callId,
                  from: data.fromUserId,
                  signal: data.signal
                }));
              }
            });
            break;
            
          case 'audio-toggle':
          case 'video-toggle':
            // Broadcast media toggle state
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  client.call_id === data.callId) {
                client.send(JSON.stringify({
                  type: data.type,
                  callId: data.callId,
                  userId: data.userId || ws.user_id,
                  enabled: data.enabled
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
