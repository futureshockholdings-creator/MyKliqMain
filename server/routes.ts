import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertStorySchema, insertCommentSchema, insertContentFilterSchema, insertUserThemeSchema } from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";
import { z } from "zod";

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

  // Theme routes
  app.get('/api/user/theme', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const theme = await storage.getUserTheme(userId);
      res.json(theme);
    } catch (error) {
      console.error("Error fetching theme:", error);
      res.status(500).json({ message: "Failed to fetch theme" });
    }
  });

  app.post('/api/user/theme', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
