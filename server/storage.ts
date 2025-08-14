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
  events,
  eventAttendees,
  actions,
  actionViewers,
  actionChatMessages,
  meetups,
  meetupCheckIns,
  birthdayMessages,
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
  type Event,
  type InsertEvent,
  type EventAttendee,
  type InsertEventAttendee,
  type Action,
  type InsertAction,
  type ActionViewer,
  type InsertActionViewer,
  type ActionChatMessage,
  type InsertActionChatMessage,
  type Meetup,
  type InsertMeetup,
  type MeetupCheckIn,
  type InsertMeetupCheckIn,
  type BirthdayMessage,
  type InsertBirthdayMessage,
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
  
  // Event operations
  getEvents(userId: string): Promise<(Event & { author: User; attendees: (EventAttendee & { user: User })[] })[]>;
  getEventById(eventId: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(eventId: string, updates: Partial<InsertEvent>): Promise<Event>;
  updateEventAttendance(eventId: string, userId: string, status: string): Promise<void>;

  // Action (Live Stream) operations
  getActions(): Promise<(Action & { author: User; viewers: ActionViewer[]; viewerCount: number })[]>;
  getActionById(actionId: string): Promise<Action | undefined>;
  createAction(action: InsertAction): Promise<Action>;
  endAction(actionId: string): Promise<Action>;
  joinAction(actionId: string, userId: string): Promise<void>;
  leaveAction(actionId: string, userId: string): Promise<void>;
  addActionChatMessage(message: InsertActionChatMessage): Promise<ActionChatMessage>;
  getActionChatMessages(actionId: string): Promise<(ActionChatMessage & { user: User })[]>;

  // Meetup operations
  getMeetups(userId: string): Promise<(Meetup & { organizer: User; checkIns: (MeetupCheckIn & { user: User })[] })[]>;
  getMeetupById(meetupId: string): Promise<Meetup | undefined>;
  createMeetup(meetup: InsertMeetup): Promise<Meetup>;
  endMeetup(meetupId: string): Promise<Meetup>;
  checkInToMeetup(checkIn: InsertMeetupCheckIn): Promise<MeetupCheckIn>;
  checkOutFromMeetup(meetupId: string, userId: string): Promise<void>;
  getNearbyMeetups(latitude: number, longitude: number, radiusKm: number): Promise<(Meetup & { organizer: User; checkIns: (MeetupCheckIn & { user: User })[] })[]>;
  verifyLocationCheckIn(meetupId: string, userId: string, latitude: number, longitude: number): Promise<boolean>;
  
  // Utility operations
  generateInviteCode(): Promise<string>;
  getUserByInviteCode(inviteCode: string): Promise<User | undefined>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  deleteExpiredMessages(): Promise<void>;
  
  // Birthday operations
  getUsersWithBirthdayToday(): Promise<User[]>;
  createBirthdayMessage(message: InsertBirthdayMessage): Promise<BirthdayMessage>;
  getBirthdayMessagesSentThisYear(birthdayUserId: string, year: number): Promise<BirthdayMessage[]>;
  getAllUsers(): Promise<User[]>;
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
        sql`LOWER(${posts.content}) LIKE LOWER(${'%' + filter + '%'})`
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
        latitude: posts.latitude,
        longitude: posts.longitude,
        locationName: posts.locationName,
        address: posts.address,
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
          latitude: post.latitude,
          longitude: post.longitude,
          locationName: post.locationName,
          address: post.address,
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
        user2Id: userId2
      })
      .returning();

    return { id: conversation.id };
  }

  async deleteExpiredMessages(): Promise<void> {
    const now = new Date();
    await db.delete(messages).where(sql`${messages.expiresAt} < ${now}`);
  }

  // Event operations
  async getEvents(userId: string): Promise<(Event & { author: User; attendees: (EventAttendee & { user: User })[] })[]> {
    // Get friends of the user to filter events
    const userFriends = await this.getFriends(userId);
    const friendIds = userFriends.map(f => f.friendId);
    const userIds = [...friendIds, userId]; // Include user's own events

    // Get all events from user and friends
    const eventsData = await db
      .select({
        event: events,
        author: users,
      })
      .from(events)
      .innerJoin(users, eq(events.userId, users.id))
      .where(inArray(events.userId, userIds))
      .orderBy(events.eventDate);

    // Get attendees for all events
    const eventsWithAttendees = await Promise.all(
      eventsData.map(async ({ event, author }) => {
        const attendeesData = await db
          .select({
            attendee: eventAttendees,
            user: users,
          })
          .from(eventAttendees)
          .innerJoin(users, eq(eventAttendees.userId, users.id))
          .where(eq(eventAttendees.eventId, event.id));

        const attendees = attendeesData.map(({ attendee, user }) => ({
          ...attendee,
          user,
        }));

        return {
          ...event,
          author,
          attendees,
        };
      })
    );

    return eventsWithAttendees;
  }

  async getEventById(eventId: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    
    // Auto-add creator as "going"
    await db.insert(eventAttendees).values({
      eventId: newEvent.id,
      userId: event.userId,
      status: "going",
    });

    // Update attendee count
    await db
      .update(events)
      .set({ attendeeCount: 1 })
      .where(eq(events.id, newEvent.id));

    return newEvent;
  }

  async updateEvent(eventId: string, updates: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning();
    return updatedEvent;
  }

  async updateEventAttendance(eventId: string, userId: string, status: string): Promise<void> {
    // Check if attendance record exists
    const [existingAttendance] = await db
      .select()
      .from(eventAttendees)
      .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)))
      .limit(1);

    if (existingAttendance) {
      // Update existing attendance
      await db
        .update(eventAttendees)
        .set({ status })
        .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)));
    } else {
      // Create new attendance record
      await db.insert(eventAttendees).values({
        eventId,
        userId,
        status,
      });
    }

    // Update attendee count
    const attendeeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventAttendees)
      .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.status, "going")))
      .then(result => Number(result[0]?.count) || 0);

    await db
      .update(events)
      .set({ attendeeCount })
      .where(eq(events.id, eventId));
  }

  // Action (Live Stream) operations
  async getActions(): Promise<(Action & { author: User; viewers: ActionViewer[]; viewerCount: number })[]> {
    const allActions = await db
      .select({
        action: actions,
        author: users,
      })
      .from(actions)
      .leftJoin(users, eq(actions.userId, users.id))
      .where(eq(actions.status, "live"))
      .orderBy(desc(actions.createdAt));

    // Get viewers for each action
    const actionsWithViewers = await Promise.all(
      allActions.map(async ({ action, author }) => {
        const viewers = await db
          .select()
          .from(actionViewers)
          .where(and(eq(actionViewers.actionId, action.id), sql`left_at IS NULL`));

        return {
          ...action,
          author: author!,
          viewers,
          viewerCount: viewers.length,
        };
      })
    );

    return actionsWithViewers;
  }

  async getActionById(actionId: string): Promise<Action | undefined> {
    const [action] = await db.select().from(actions).where(eq(actions.id, actionId));
    return action;
  }

  async createAction(action: InsertAction): Promise<Action> {
    // Generate unique stream key
    const streamKey = randomUUID();
    
    const [newAction] = await db.insert(actions).values({
      ...action,
      streamKey,
    }).returning();
    
    return newAction;
  }

  async endAction(actionId: string): Promise<Action> {
    // Mark all viewers as left
    await db
      .update(actionViewers)
      .set({ leftAt: new Date() })
      .where(and(eq(actionViewers.actionId, actionId), sql`left_at IS NULL`));

    // End the action
    const [endedAction] = await db
      .update(actions)
      .set({ 
        status: "ended",
        endedAt: new Date(),
        viewerCount: 0,
      })
      .where(eq(actions.id, actionId))
      .returning();

    return endedAction;
  }

  async joinAction(actionId: string, userId: string): Promise<void> {
    // Check if user is already viewing
    const [existingViewer] = await db
      .select()
      .from(actionViewers)
      .where(and(
        eq(actionViewers.actionId, actionId),
        eq(actionViewers.userId, userId),
        sql`left_at IS NULL`
      ))
      .limit(1);

    if (!existingViewer) {
      // Add new viewer
      await db.insert(actionViewers).values({
        actionId,
        userId,
      });

      // Update viewer count
      const viewerCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(actionViewers)
        .where(and(eq(actionViewers.actionId, actionId), sql`left_at IS NULL`))
        .then(result => Number(result[0]?.count) || 0);

      await db
        .update(actions)
        .set({ viewerCount })
        .where(eq(actions.id, actionId));
    }
  }

  async leaveAction(actionId: string, userId: string): Promise<void> {
    // Mark viewer as left
    await db
      .update(actionViewers)
      .set({ leftAt: new Date() })
      .where(and(
        eq(actionViewers.actionId, actionId),
        eq(actionViewers.userId, userId),
        sql`left_at IS NULL`
      ));

    // Update viewer count
    const viewerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(actionViewers)
      .where(and(eq(actionViewers.actionId, actionId), sql`left_at IS NULL`))
      .then(result => Number(result[0]?.count) || 0);

    await db
      .update(actions)
      .set({ viewerCount })
      .where(eq(actions.id, actionId));
  }

  async addActionChatMessage(message: InsertActionChatMessage): Promise<ActionChatMessage> {
    const [newMessage] = await db.insert(actionChatMessages).values(message).returning();
    return newMessage;
  }

  async getActionChatMessages(actionId: string): Promise<(ActionChatMessage & { user: User })[]> {
    const messages = await db
      .select({
        message: actionChatMessages,
        user: users,
      })
      .from(actionChatMessages)
      .leftJoin(users, eq(actionChatMessages.userId, users.id))
      .where(eq(actionChatMessages.actionId, actionId))
      .orderBy(actionChatMessages.createdAt);

    return messages.map(({ message, user }) => ({
      ...message,
      user: user!,
    }));
  }

  // Meetup operations
  async getMeetups(userId: string): Promise<(Meetup & { organizer: User; checkIns: (MeetupCheckIn & { user: User })[] })[]> {
    // Get friends of the user to filter meetups
    const userFriends = await this.getFriends(userId);
    const friendIds = userFriends.map(f => f.friendId);
    const userIds = [...friendIds, userId]; // Include user's own meetups

    const meetupsData = await db
      .select({
        meetup: meetups,
        organizer: users,
      })
      .from(meetups)
      .innerJoin(users, eq(meetups.userId, users.id))
      .where(inArray(meetups.userId, userIds))
      .orderBy(desc(meetups.meetupTime));

    // Get check-ins for all meetups
    const meetupsWithCheckIns = await Promise.all(
      meetupsData.map(async ({ meetup, organizer }) => {
        const checkInsData = await db
          .select({
            checkIn: meetupCheckIns,
            user: users,
          })
          .from(meetupCheckIns)
          .innerJoin(users, eq(meetupCheckIns.userId, users.id))
          .where(eq(meetupCheckIns.meetupId, meetup.id));

        const checkIns = checkInsData.map(({ checkIn, user }) => ({
          ...checkIn,
          user,
        }));

        return {
          ...meetup,
          organizer,
          checkIns,
        };
      })
    );

    return meetupsWithCheckIns;
  }

  async getMeetupById(meetupId: string): Promise<Meetup | undefined> {
    const [meetup] = await db.select().from(meetups).where(eq(meetups.id, meetupId));
    return meetup;
  }

  async createMeetup(meetup: InsertMeetup): Promise<Meetup> {
    const [newMeetup] = await db.insert(meetups).values({
      ...meetup,
      isActive: true,
    }).returning();
    return newMeetup;
  }

  async endMeetup(meetupId: string): Promise<Meetup> {
    const [updatedMeetup] = await db
      .update(meetups)
      .set({ 
        isActive: false, 
        endedAt: new Date() 
      })
      .where(eq(meetups.id, meetupId))
      .returning();
    return updatedMeetup;
  }

  async checkInToMeetup(checkIn: InsertMeetupCheckIn): Promise<MeetupCheckIn> {
    const [newCheckIn] = await db.insert(meetupCheckIns).values({
      ...checkIn,
      checkInTime: new Date(),
      isVerified: false, // Will be verified separately based on location
    }).returning();
    return newCheckIn;
  }

  async checkOutFromMeetup(meetupId: string, userId: string): Promise<void> {
    await db
      .update(meetupCheckIns)
      .set({ checkOutTime: new Date() })
      .where(and(
        eq(meetupCheckIns.meetupId, meetupId),
        eq(meetupCheckIns.userId, userId),
        sql`check_out_time IS NULL`
      ));
  }

  async getNearbyMeetups(latitude: number, longitude: number, radiusKm: number): Promise<(Meetup & { organizer: User; checkIns: (MeetupCheckIn & { user: User })[] })[]> {
    // Use Haversine formula to find nearby meetups
    const nearbyMeetupsData = await db
      .select({
        meetup: meetups,
        organizer: users,
      })
      .from(meetups)
      .innerJoin(users, eq(meetups.userId, users.id))
      .where(and(
        eq(meetups.isActive, true),
        sql`(
          6371 * acos(
            cos(radians(${latitude})) * 
            cos(radians(${meetups.latitude})) * 
            cos(radians(${meetups.longitude}) - radians(${longitude})) + 
            sin(radians(${latitude})) * 
            sin(radians(${meetups.latitude}))
          )
        ) <= ${radiusKm}`
      ))
      .orderBy(desc(meetups.meetupTime));

    // Get check-ins for nearby meetups
    const nearbyMeetupsWithCheckIns = await Promise.all(
      nearbyMeetupsData.map(async ({ meetup, organizer }) => {
        const checkInsData = await db
          .select({
            checkIn: meetupCheckIns,
            user: users,
          })
          .from(meetupCheckIns)
          .innerJoin(users, eq(meetupCheckIns.userId, users.id))
          .where(eq(meetupCheckIns.meetupId, meetup.id));

        const checkIns = checkInsData.map(({ checkIn, user }) => ({
          ...checkIn,
          user,
        }));

        return {
          ...meetup,
          organizer,
          checkIns,
        };
      })
    );

    return nearbyMeetupsWithCheckIns;
  }

  async verifyLocationCheckIn(meetupId: string, userId: string, latitude: number, longitude: number): Promise<boolean> {
    // Get meetup location
    const meetup = await this.getMeetupById(meetupId);
    if (!meetup) return false;

    // Calculate distance using Haversine formula (allowing 100m radius for check-in)
    const radiusKm = 0.1; // 100 meters
    const distance = await db
      .select({
        distance: sql<number>`(
          6371 * acos(
            cos(radians(${latitude})) * 
            cos(radians(${meetup.latitude})) * 
            cos(radians(${meetup.longitude}) - radians(${longitude})) + 
            sin(radians(${latitude})) * 
            sin(radians(${meetup.latitude}))
          )
        )`
      })
      .from(meetups)
      .where(eq(meetups.id, meetupId));

    const isWithinRange = distance[0]?.distance <= radiusKm;

    if (isWithinRange) {
      // Update check-in to verified
      await db
        .update(meetupCheckIns)
        .set({ isVerified: true })
        .where(and(
          eq(meetupCheckIns.meetupId, meetupId),
          eq(meetupCheckIns.userId, userId)
        ));
    }

    return isWithinRange;
  }

  // Birthday operations
  async getUsersWithBirthdayToday(): Promise<User[]> {
    const today = new Date();
    const monthDay = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    return await db
      .select()
      .from(users)
      .where(sql`to_char(${users.birthdate}, 'MM-DD') = ${monthDay}`);
  }

  async createBirthdayMessage(message: InsertBirthdayMessage): Promise<BirthdayMessage> {
    const [birthdayMessage] = await db
      .insert(birthdayMessages)
      .values(message)
      .returning();
    return birthdayMessage;
  }

  async getBirthdayMessagesSentThisYear(birthdayUserId: string, year: number): Promise<BirthdayMessage[]> {
    return await db
      .select()
      .from(birthdayMessages)
      .where(and(
        eq(birthdayMessages.birthdayUserId, birthdayUserId),
        eq(birthdayMessages.year, year)
      ));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
}

export const storage = new DatabaseStorage();
