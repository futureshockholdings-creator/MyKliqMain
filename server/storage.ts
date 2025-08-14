import {
  users,
  userThemes,
  friendships,
  posts,
  stories,
  storyViews,
  comments,
  postLikes,
  contentFilters,
  messages,
  conversations,
  type User,
  type UpsertUser,
  type UserTheme,
  type InsertUserTheme,
  type Friendship,
  type InsertFriendship,
  type Post,
  type InsertPost,
  type Story,
  type InsertStory,
  type StoryView,
  type Comment,
  type InsertComment,
  type PostLike,
  type ContentFilter,
  type InsertContentFilter,
  type Message,
  type InsertMessage,
  type Conversation,
  type InsertConversation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray, like, or } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User theme operations
  getUserTheme(userId: string): Promise<UserTheme | undefined>;
  upsertUserTheme(theme: InsertUserTheme): Promise<UserTheme>;
  
  // Friend operations
  getFriends(userId: string): Promise<(Friendship & { friend: User })[]>;
  addFriend(friendship: InsertFriendship): Promise<Friendship>;
  updateFriendRank(userId: string, friendId: string, rank: number): Promise<void>;
  acceptFriendship(userId: string, friendId: string): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  
  // Post operations
  getPosts(userId: string, filters: string[]): Promise<(Omit<Post, 'likes'> & { author: User; likes: PostLike[]; comments: (Comment & { author: User })[] })[]>;
  createPost(post: InsertPost): Promise<Post>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  
  // Story operations
  getActiveStories(userId: string): Promise<(Story & { author: User; viewCount: number; hasViewed: boolean })[]>;
  createStory(story: InsertStory): Promise<Story>;
  viewStory(storyId: string, userId: string): Promise<void>;
  deleteExpiredStories(): Promise<void>;
  
  // Comment operations
  addComment(comment: InsertComment): Promise<Comment>;
  
  // Filter operations
  getContentFilters(userId: string): Promise<ContentFilter[]>;
  addContentFilter(filter: InsertContentFilter): Promise<ContentFilter>;
  removeContentFilter(userId: string, filterId: string): Promise<void>;

  // Message operations
  getConversations(userId: string): Promise<(Conversation & { otherUser: User; lastMessage?: Message; unreadCount: number })[]>;
  getConversation(userId: string, otherUserId: string): Promise<(Conversation & { messages: (Message & { sender: User; receiver: User })[] }) | undefined>;
  createConversation(data: { participantIds: string[] }): Promise<{ id: string }>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<void>;
  markConversationAsRead(conversationId: string, userId: string): Promise<void>;
  
  // Utility operations
  generateInviteCode(): Promise<string>;
  getUserByInviteCode(inviteCode: string): Promise<User | undefined>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  deleteExpiredMessages(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const inviteCode = await this.generateInviteCode();
    const [user] = await db
      .insert(users)
      .values({ ...userData, inviteCode })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // User theme operations
  async getUserTheme(userId: string): Promise<UserTheme | undefined> {
    const [theme] = await db.select().from(userThemes).where(eq(userThemes.userId, userId));
    return theme;
  }

  async upsertUserTheme(theme: InsertUserTheme): Promise<UserTheme> {
    const [userTheme] = await db
      .insert(userThemes)
      .values(theme)
      .onConflictDoUpdate({
        target: userThemes.userId,
        set: {
          ...theme,
          updatedAt: new Date(),
        },
      })
      .returning();
    return userTheme;
  }

  // Friend operations
  async getFriends(userId: string): Promise<(Friendship & { friend: User })[]> {
    const friends = await db
      .select({
        id: friendships.id,
        userId: friendships.userId,
        friendId: friendships.friendId,
        rank: friendships.rank,
        status: friendships.status,
        createdAt: friendships.createdAt,
        updatedAt: friendships.updatedAt,
        friend: users,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.friendId, users.id))
      .where(and(eq(friendships.userId, userId), eq(friendships.status, "accepted")))
      .orderBy(friendships.rank);
    
    return friends;
  }

  async addFriend(friendship: InsertFriendship): Promise<Friendship> {
    const [newFriendship] = await db
      .insert(friendships)
      .values(friendship)
      .returning();
    return newFriendship;
  }

  async updateFriendRank(userId: string, friendId: string, rank: number): Promise<void> {
    await db
      .update(friendships)
      .set({ rank, updatedAt: new Date() })
      .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)));
  }

  async acceptFriendship(userId: string, friendId: string): Promise<void> {
    await db
      .update(friendships)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)));
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await db
      .delete(friendships)
      .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)));
  }

  // Post operations
  async getPosts(userId: string, filters: string[]): Promise<(Omit<Post, 'likes'> & { author: User; likes: PostLike[]; comments: (Comment & { author: User })[] })[]> {
    // Get user's friends first
    const userFriends = await this.getFriends(userId);
    const friendIds = userFriends.map(f => f.friendId);
    friendIds.push(userId); // Include user's own posts

    // Apply content filters
    let whereConditions = [inArray(posts.userId, friendIds)];
    
    if (filters.length > 0) {
      const filterConditions = filters.map(filter => 
        like(posts.content, `%${filter}%`)
      );
      whereConditions.push(sql`NOT (${or(...filterConditions)})`);
    }

    const postsQuery = db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        mediaUrl: posts.mediaUrl,
        mediaType: posts.mediaType,
        likes: posts.likes,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(posts.createdAt));

    const postsData = await postsQuery;

    // Get likes and comments for each post
    const postsWithDetails = await Promise.all(
      postsData.map(async (post) => {
        const [likesData, commentsData] = await Promise.all([
          db.select().from(postLikes).where(eq(postLikes.postId, post.id)),
          db
            .select({
              id: comments.id,
              postId: comments.postId,
              userId: comments.userId,
              content: comments.content,
              createdAt: comments.createdAt,
              author: users,
            })
            .from(comments)
            .innerJoin(users, eq(comments.userId, users.id))
            .where(eq(comments.postId, post.id))
            .orderBy(comments.createdAt),
        ]);

        return {
          id: post.id,
          userId: post.userId,
          content: post.content,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
          likes: likesData,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          author: post.author,
          comments: commentsData,
        };
      })
    );

    return postsWithDetails;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async likePost(postId: string, userId: string): Promise<void> {
    await db.insert(postLikes).values({ postId, userId });
    await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId));
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    await db
      .update(posts)
      .set({ likes: sql`${posts.likes} - 1` })
      .where(eq(posts.id, postId));
  }

  // Comment operations
  async addComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  // Filter operations
  async getContentFilters(userId: string): Promise<ContentFilter[]> {
    return await db.select().from(contentFilters).where(eq(contentFilters.userId, userId));
  }

  async addContentFilter(filter: InsertContentFilter): Promise<ContentFilter> {
    const [newFilter] = await db.insert(contentFilters).values(filter).returning();
    return newFilter;
  }

  async removeContentFilter(userId: string, filterId: string): Promise<void> {
    await db
      .delete(contentFilters)
      .where(and(eq(contentFilters.userId, userId), eq(contentFilters.id, filterId)));
  }

  // Utility operations
  async generateInviteCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    
    while (!isUnique) {
      code = `KLIQ-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const existing = await db.select().from(users).where(eq(users.inviteCode, code));
      isUnique = existing.length === 0;
    }
    
    return code!;
  }

  async getUserByInviteCode(inviteCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.inviteCode, inviteCode));
    return user;
  }

  // Story operations
  async getActiveStories(userId: string): Promise<(Story & { author: User; viewCount: number; hasViewed: boolean })[]> {
    // Get user's friends first
    const userFriends = await this.getFriends(userId);
    const friendIds = userFriends.map(f => f.friendId);
    friendIds.push(userId); // Include user's own stories

    const now = new Date();
    const storiesData = await db
      .select({
        id: stories.id,
        userId: stories.userId,
        content: stories.content,
        mediaUrl: stories.mediaUrl,
        mediaType: stories.mediaType,
        viewCount: stories.viewCount,
        createdAt: stories.createdAt,
        expiresAt: stories.expiresAt,
        author: users,
      })
      .from(stories)
      .innerJoin(users, eq(stories.userId, users.id))
      .where(and(inArray(stories.userId, friendIds), sql`${stories.expiresAt} > ${now}`))
      .orderBy(desc(stories.createdAt));

    // Check if user has viewed each story
    const storiesWithViewStatus = await Promise.all(
      storiesData.map(async (story) => {
        const [hasViewed] = await db
          .select()
          .from(storyViews)
          .where(and(eq(storyViews.storyId, story.id), eq(storyViews.userId, userId)))
          .limit(1);

        return {
          id: story.id,
          userId: story.userId,
          content: story.content,
          mediaUrl: story.mediaUrl,
          mediaType: story.mediaType,
          viewCount: story.viewCount || 0,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt,
          author: story.author,
          hasViewed: !!hasViewed,
        };
      })
    );

    return storiesWithViewStatus;
  }

  async createStory(story: InsertStory): Promise<Story> {
    const [newStory] = await db.insert(stories).values(story).returning();
    return newStory;
  }

  async viewStory(storyId: string, userId: string): Promise<void> {
    // Check if user has already viewed this story
    const [existingView] = await db
      .select()
      .from(storyViews)
      .where(and(eq(storyViews.storyId, storyId), eq(storyViews.userId, userId)))
      .limit(1);

    if (!existingView) {
      // Add view record
      await db.insert(storyViews).values({ storyId, userId });
      // Increment view count
      await db
        .update(stories)
        .set({ viewCount: sql`${stories.viewCount} + 1` })
        .where(eq(stories.id, storyId));
    }
  }

  async deleteExpiredStories(): Promise<void> {
    const now = new Date();
    await db.delete(stories).where(sql`${stories.expiresAt} < ${now}`);
  }

  // Message operations
  async getConversations(userId: string): Promise<(Conversation & { otherUser: User; lastMessage?: Message; unreadCount: number })[]> {
    // Get all conversations for the user
    const userConversations = await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)))
      .orderBy(desc(conversations.lastActivity));

    const conversationsWithDetails = await Promise.all(
      userConversations.map(async (conv) => {
        // Determine the other user
        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        
        // Get other user info
        const [otherUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, otherUserId));

        // Get last message if exists
        let lastMessage: Message | undefined;
        if (conv.lastMessageId) {
          const [msg] = await db
            .select()
            .from(messages)
            .where(eq(messages.id, conv.lastMessageId));
          lastMessage = msg;
        }

        // Count unread, non-expired messages
        const now = new Date();
        const unreadCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.receiverId, userId),
              or(eq(messages.senderId, otherUserId), eq(messages.receiverId, otherUserId)),
              eq(messages.isRead, false),
              or(
                sql`${messages.expiresAt} IS NULL`,
                sql`${messages.expiresAt} > ${now}`
              )
            )
          )
          .then(result => Number(result[0]?.count) || 0);

        return {
          ...conv,
          otherParticipant: otherUser, // Use otherParticipant to match route expectation
          otherUser,
          lastMessage,
          unreadCount,
        };
      })
    );

    return conversationsWithDetails.filter(conv => conv.otherUser);
  }

  async getConversation(userId: string, otherUserId: string): Promise<(Conversation & { messages: (Message & { sender: User; receiver: User })[] }) | undefined> {
    // Find existing conversation between users
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.user1Id, userId), eq(conversations.user2Id, otherUserId)),
          and(eq(conversations.user1Id, otherUserId), eq(conversations.user2Id, userId))
        )
      );

    if (!conversation) {
      return undefined;
    }

    // Get all non-expired messages in this conversation with sender/receiver info
    const now = new Date();
    const conversationMessages = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          or(
            and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
            and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
          ),
          or(
            sql`${messages.expiresAt} IS NULL`,
            sql`${messages.expiresAt} > ${now}`
          )
        )
      )
      .orderBy(desc(messages.createdAt));

    // Get receiver info for each message
    const messagesWithUsers = await Promise.all(
      conversationMessages.map(async ({ message, sender }) => {
        const [receiver] = await db
          .select()
          .from(users)
          .where(eq(users.id, message.receiverId));
        
        return {
          ...message,
          sender,
          receiver,
        };
      })
    );

    return {
      ...conversation,
      messages: messagesWithUsers,
    };
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    // First, create or find conversation
    const [existingConversation] = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.user1Id, message.senderId), eq(conversations.user2Id, message.receiverId)),
          and(eq(conversations.user1Id, message.receiverId), eq(conversations.user2Id, message.senderId))
        )
      );

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // Create new conversation
      const [newConversation] = await db
        .insert(conversations)
        .values({
          user1Id: message.senderId,
          user2Id: message.receiverId,
        })
        .returning();
      conversationId = newConversation.id;
    }

    // Insert the message
    const [newMessage] = await db.insert(messages).values(message).returning();

    // Update conversation with last message and activity
    await db
      .update(conversations)
      .set({
        lastMessageId: newMessage.id,
        lastActivity: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    return newMessage;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const readAt = new Date();
    const expiresAt = new Date(readAt.getTime() + 3 * 60 * 1000); // 3 minutes after being read
    
    await db
      .update(messages)
      .set({ 
        isRead: true, 
        readAt,
        expiresAt 
      })
      .where(eq(messages.id, messageId));
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    // Mark all unread messages in this conversation as read for the user
    const readAt = new Date();
    const expiresAt = new Date(readAt.getTime() + 3 * 60 * 1000); // 3 minutes after being read
    
    await db
      .update(messages)
      .set({ 
        isRead: true,
        readAt,
        expiresAt 
      })
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );
  }

  async createConversation(data: { participantIds: string[] }): Promise<{ id: string }> {
    const [userId1, userId2] = data.participantIds;
    
    // Create conversation with proper user IDs
    const [conversation] = await db
      .insert(conversations)
      .values({
        user1Id: userId1,
        user2Id: userId2,
        participantIds: data.participantIds
      })
      .returning();

    return { id: conversation.id };
  }

  async deleteExpiredMessages(): Promise<void> {
    const now = new Date();
    await db.delete(messages).where(sql`${messages.expiresAt} < ${now}`);
  }
}

export const storage = new DatabaseStorage();
