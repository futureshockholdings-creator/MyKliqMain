import {
  users,
  userThemes,
  friendships,
  usedInviteCodes,
  posts,
  stories,
  storyViews,
  comments,
  postLikes,
  commentLikes,
  contentFilters,
  scrapbookAlbums,
  scrapbookSaves,
  postHighlights,
  messages,
  conversations,
  events,
  eventAttendees,
  eventReminders,
  calendarNotes,
  actions,
  actionViewers,
  actionChatMessages,
  meetups,
  meetupCheckIns,
  birthdayMessages,
  videoCalls,
  callParticipants,
  socialCredentials,
  externalPosts,
  passwordResetTokens,
  passwordResetAttempts,
  rulesReports,
  moodBoostPosts,
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
  type ScrapbookAlbum,
  type InsertScrapbookAlbum,
  type ScrapbookSave,
  type InsertScrapbookSave,
  type PostHighlight,
  type InsertPostHighlight,
  type Message,
  type InsertMessage,
  type Conversation,
  type InsertConversation,
  type Event,
  type InsertEvent,
  type EventAttendee,
  type InsertEventAttendee,
  type EventReminder,
  type InsertEventReminder,
  type CalendarNote,
  type InsertCalendarNote,
  type Action,
  type InsertAction,
  type ActionViewer,
  type InsertActionViewer,
  type ActionChatMessage,
  type InsertActionChatMessage,
  type Meetup,
  type InsertMeetup,
  type SocialCredential,
  type InsertSocialCredential,
  type ExternalPost,
  type InsertExternalPost,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type PasswordResetAttempt,
  type InsertPasswordResetAttempt,
  type Report,
  type InsertReport,
  type MeetupCheckIn,
  type InsertMeetupCheckIn,
  type BirthdayMessage,
  type InsertBirthdayMessage,
  type VideoCall,
  type InsertVideoCall,
  type CallParticipant,
  type InsertCallParticipant,
  type MoodBoostPost,
  type InsertMoodBoostPost,
  gifs,
  type Gif,
  type InsertGif,
  memes,
  type Meme,
  type InsertMeme,
  moviecons,
  type Moviecon,
  type InsertMoviecon,
  polls,
  pollVotes,
  type Poll,
  type InsertPoll,
  type PollVote,
  type InsertPollVote,
  sponsoredAds,
  adInteractions,
  userAdPreferences,
  type SponsoredAd,
  type InsertSponsoredAd,
  type AdInteraction,
  type InsertAdInteraction,
  type UserAdPreferences,
  type InsertUserAdPreferences,
  friendRankingSuggestions,
  userInteractionAnalytics,
  type UserInteractionAnalytics,
  type InsertUserInteractionAnalytics,
  type FriendRankingSuggestion,
  type InsertFriendRankingSuggestion,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray, like, or, asc, lt, gt, lte, gte, count, isNull, isNotNull } from "drizzle-orm";
import { FeedCurationIntelligence } from './feedCurationIntelligence';
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  getUsersByPhone(phoneNumber: string): Promise<User[]>;
  getUserByName(firstName: string, lastName: string): Promise<User | undefined>;
  getUserByNameAndPhone(firstName: string, lastName: string, phoneNumber: string): Promise<User | undefined>;
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  getPasswordResetAttempts(userId: string): Promise<PasswordResetAttempt | undefined>;
  recordPasswordResetAttempt(userId: string): Promise<void>;
  lockPasswordReset(userId: string): Promise<void>;
  clearPasswordResetAttempts(userId: string): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  
  // User theme operations
  getUserTheme(userId: string): Promise<UserTheme | undefined>;
  upsertUserTheme(theme: InsertUserTheme): Promise<UserTheme>;
  
  // Friend operations
  getFriends(userId: string): Promise<(Friendship & { friend: User })[]>;
  addFriend(friendship: InsertFriendship): Promise<Friendship>;
  updateFriendRank(userId: string, friendId: string, rank: number): Promise<void>;
  acceptFriendship(userId: string, friendId: string): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  leaveKliq(userId: string): Promise<void>;
  
  // Post operations
  getPosts(userId: string, filters: string[]): Promise<(Omit<Post, 'likes'> & { author: User; likes: PostLike[]; comments: (Comment & { author: User })[] })[]>;
  getPostById(postId: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(postId: string, updates: Partial<Pick<Post, 'content'>>): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  getUserReflection(userId: string): Promise<{ posts: any[]; stats: any; message: string }>;
  
  // Feed operations
  getKliqFeed(userId: string, filters: string[], page?: number, limit?: number): Promise<{ items: any[], hasMore: boolean, totalPages: number } | any[]>;
  
  // Story operations
  getActiveStories(userId: string): Promise<(Story & { author: User; viewCount: number; hasViewed: boolean })[]>;
  createStory(story: InsertStory): Promise<Story>;
  viewStory(storyId: string, userId: string): Promise<void>;
  deleteExpiredStories(): Promise<void>;
  
  // Comment operations
  addComment(comment: InsertComment): Promise<Comment>;
  getCommentById(commentId: string): Promise<Comment | undefined>;
  likeComment(commentId: string, userId: string): Promise<void>;
  unlikeComment(commentId: string, userId: string): Promise<void>;
  
  // Filter operations
  getContentFilters(userId: string): Promise<ContentFilter[]>;
  addContentFilter(filter: InsertContentFilter): Promise<ContentFilter>;
  removeContentFilter(userId: string, filterId: string): Promise<void>;
  
  // GIF operations
  getAllGifs(): Promise<Gif[]>;
  getTrendingGifs(): Promise<Gif[]>;
  getFeaturedGifs(): Promise<Gif[]>;
  searchGifs(query: string): Promise<Gif[]>;
  getGifsByCategory(category: string): Promise<Gif[]>;
  getGifById(id: string): Promise<Gif | undefined>;
  createGif(gif: InsertGif): Promise<Gif>;
  updateGif(id: string, updates: Partial<Gif>): Promise<Gif>;
  deleteGif(id: string): Promise<void>;
  
  // Meme operations
  getAllMemes(): Promise<Meme[]>;
  getTrendingMemes(): Promise<Meme[]>;
  getFeaturedMemes(): Promise<Meme[]>;
  searchMemes(query: string): Promise<Meme[]>;
  getMemesByCategory(category: string): Promise<Meme[]>;
  getMemeById(id: string): Promise<Meme | undefined>;
  createMeme(meme: InsertMeme): Promise<Meme>;
  updateMeme(id: string, updates: Partial<Meme>): Promise<Meme>;
  deleteMeme(id: string): Promise<void>;
  
  // Moviecon operations
  getAllMoviecons(): Promise<Moviecon[]>;
  getTrendingMoviecons(): Promise<Moviecon[]>;
  getFeaturedMoviecons(): Promise<Moviecon[]>;
  searchMoviecons(query: string): Promise<Moviecon[]>;
  getMovieconsByCategory(category: string): Promise<Moviecon[]>;
  getMovieconById(id: string): Promise<Moviecon | undefined>;
  createMoviecon(moviecon: InsertMoviecon): Promise<Moviecon>;
  updateMoviecon(id: string, updates: Partial<Moviecon>): Promise<Moviecon>;
  deleteMoviecon(id: string): Promise<void>;

  // Message operations
  getConversations(userId: string): Promise<(Conversation & { otherUser: User; lastMessage?: Message; unreadCount: number })[]>;
  getConversation(userId: string, otherUserId: string): Promise<(Conversation & { messages: (Message & { sender: User; receiver: User })[] }) | undefined>;
  createConversation(data: { participantIds: string[] }): Promise<{ id: string }>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<void>;
  markConversationAsRead(conversationId: string, userId: string): Promise<void>;
  deleteExpiredMessages(): Promise<void>;
  deleteOldConversations(): Promise<void>;
  
  // Event operations
  getEvents(userId: string): Promise<(Event & { author: User; attendees: (EventAttendee & { user: User })[] })[]>;
  getEventById(eventId: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(eventId: string, updates: Partial<InsertEvent>): Promise<Event>;
  getUserEventAttendance(eventId: string, userId: string): Promise<{ status: string } | undefined>;
  updateEventAttendance(eventId: string, userId: string, status: string): Promise<void>;
  getEventAttendees(eventId: string): Promise<EventAttendee[]>;

  // Calendar note operations
  getKliqsForUser(userId: string): Promise<{ kliqId: string; kliqName: string; kliqOwner: User; isOwner: boolean }[]>;
  isUserInKliq(userId: string, kliqId: string): Promise<boolean>;
  getCalendarNotes(kliqId: string, startDate?: string, endDate?: string): Promise<(CalendarNote & { author: User })[]>;
  getCalendarNoteById(noteId: string): Promise<CalendarNote | undefined>;
  createCalendarNote(note: InsertCalendarNote): Promise<CalendarNote>;
  updateCalendarNote(noteId: string, updates: Partial<InsertCalendarNote>): Promise<CalendarNote>;
  deleteCalendarNote(noteId: string): Promise<void>;
  getTodaysCalendarReminders(): Promise<(CalendarNote & { author: User; kliqOwner: User })[]>;
  markReminderSent(noteId: string): Promise<void>;

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
  
  // Social media integration operations
  getSocialCredentials(userId: string): Promise<SocialCredential[]>;
  getSocialCredential(userId: string, platform: string): Promise<SocialCredential | undefined>;
  createSocialCredential(credential: InsertSocialCredential): Promise<SocialCredential>;
  updateSocialCredential(id: string, updates: Partial<SocialCredential>): Promise<SocialCredential>;
  deleteSocialCredential(id: string): Promise<void>;
  
  // External posts operations
  getExternalPosts(userId: string): Promise<(ExternalPost & { socialCredential: SocialCredential })[]>;
  createExternalPost(post: InsertExternalPost): Promise<ExternalPost>;
  createExternalPosts(posts: InsertExternalPost[]): Promise<ExternalPost[]>;
  deleteOldExternalPosts(platform: string, keepDays: number): Promise<void>;

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

  // Video call operations
  createVideoCall(call: InsertVideoCall): Promise<VideoCall>;
  getVideoCall(callId: string): Promise<VideoCall | undefined>;
  updateVideoCallStatus(callId: string, status: string, startedAt?: Date, endedAt?: Date): Promise<void>;
  addCallParticipant(participant: InsertCallParticipant): Promise<CallParticipant>;
  updateParticipantStatus(callId: string, userId: string, status: string, joinedAt?: Date, leftAt?: Date): Promise<void>;
  getCallParticipants(callId: string): Promise<(CallParticipant & { user: User })[]>;
  getUserActiveCalls(userId: string): Promise<(VideoCall & { participants: (CallParticipant & { user: User })[] })[]>;

  // Scrapbook operations
  createScrapbookAlbum(album: InsertScrapbookAlbum): Promise<ScrapbookAlbum>;
  getUserScrapbookAlbums(userId: string): Promise<(ScrapbookAlbum & { saveCount: number })[]>;
  updateScrapbookAlbum(albumId: string, updates: Partial<InsertScrapbookAlbum>): Promise<ScrapbookAlbum>;
  deleteScrapbookAlbum(albumId: string): Promise<void>;
  savePostToScrapbook(save: InsertScrapbookSave): Promise<ScrapbookSave>;
  unsavePostFromScrapbook(userId: string, postId: string): Promise<void>;
  getUserScrapbookSaves(userId: string, albumId?: string): Promise<(ScrapbookSave & { post: Post & { author: User } })[]>;
  updateScrapbookSaveNote(saveId: string, note: string): Promise<ScrapbookSave>;
  getScrapbookSaveCount(userId: string): Promise<number>;
  isPostSavedByUser(userId: string, postId: string): Promise<boolean>;

  // GIF operations
  getAllGifs(): Promise<Gif[]>;
  getGifsByCategory(category: string): Promise<Gif[]>;
  getTrendingGifs(): Promise<Gif[]>;
  getFeaturedGifs(): Promise<Gif[]>;
  searchGifs(query: string): Promise<Gif[]>;
  getGifById(id: string): Promise<Gif | undefined>;
  createGif(gif: InsertGif): Promise<Gif>;
  updateGif(id: string, updates: Partial<Gif>): Promise<Gif>;
  deleteGif(id: string): Promise<void>;

  // Poll operations
  getPolls(userId: string): Promise<(Poll & { author: User; votes: PollVote[]; totalVotes: number; userVote?: PollVote })[]>;
  getPollById(pollId: string): Promise<Poll | undefined>;
  createPoll(poll: InsertPoll): Promise<Poll>;
  votePoll(vote: InsertPollVote): Promise<PollVote>;
  getUserPollVote(pollId: string, userId: string): Promise<PollVote | undefined>;
  getPollResults(pollId: string): Promise<{ option: string; index: number; votes: number; percentage: number }[]>;

  // Sponsored Ads operations
  getTargetedAds(userId: string): Promise<SponsoredAd[]>;
  getAllAds(): Promise<SponsoredAd[]>;
  createAd(ad: InsertSponsoredAd): Promise<SponsoredAd>;
  updateAd(adId: string, updates: Partial<InsertSponsoredAd>): Promise<SponsoredAd>;
  updateAdStatus(adId: string, status: 'active' | 'paused'): Promise<SponsoredAd>;
  deleteAd(adId: string): Promise<void>;
  recordAdImpression(interaction: InsertAdInteraction): Promise<AdInteraction>;
  recordAdClick(interaction: InsertAdInteraction): Promise<AdInteraction>;
  getUserAdPreferences(userId: string): Promise<UserAdPreferences | undefined>;
  updateUserAdPreferences(userId: string, preferences: InsertUserAdPreferences): Promise<UserAdPreferences>;
  getAdAnalytics(adId: string): Promise<{ impressions: number; clicks: number; ctr: number }>;

  // Admin operations for customer service
  getAllUsersForAdmin(): Promise<User[]>;
  getUserDetailsForAdmin(userId: string): Promise<User | undefined>;
  checkAndUnsuspendExpiredUsers(): Promise<number>;

  // Smart Friend Ranking Intelligence
  getUserInteractionAnalytics(userId: string, friendId: string): Promise<UserInteractionAnalytics | undefined>;
  getFriendRankingSuggestion(suggestionId: string, userId: string): Promise<FriendRankingSuggestion | undefined>;
  updateRankingSuggestionStatus(suggestionId: string, status: string): Promise<void>;
  updateFriendshipRank(userId: string, friendId: string, rank: number): Promise<void>;
  getActiveUsersForRankingAnalysis(): Promise<User[]>;
  getUserFriendships(userId: string): Promise<Friendship[]>;

  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReports(filters: { status?: string; page?: number; limit?: number }): Promise<Report[]>;
  updateReport(reportId: string, updates: Partial<Report>): Promise<Report>;
  suspendUser(userId: string, suspensionData: { suspensionType: string; suspendedAt: string; suspensionExpiresAt: string | null }): Promise<void>;

  // Mood Boost Posts operations
  getMoodBoostPostsForUser(userId: string): Promise<MoodBoostPost[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user;
  }

  async getUsersByPhone(phoneNumber: string): Promise<User[]> {
    const userList = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return userList;
  }

  async getUserByName(firstName: string, lastName: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(sql`LOWER(${users.firstName})`, firstName.toLowerCase()),
        eq(sql`LOWER(${users.lastName})`, lastName.toLowerCase())
      )
    );
    return user;
  }

  async getUserByNameAndPhone(firstName: string, lastName: string, phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(sql`LOWER(${users.firstName})`, firstName.toLowerCase()),
        eq(sql`LOWER(${users.lastName})`, lastName.toLowerCase()),
        eq(users.phoneNumber, phoneNumber)
      )
    );
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

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
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

  async updateFriendRank(userId: string, friendId: string, newRank: number): Promise<void> {
    // Optimizing friend rank update for performance
    
    // Get all current friendships for this user
    const allFriends = await db
      .select()
      .from(friendships)
      .where(and(eq(friendships.userId, userId), eq(friendships.status, "accepted")))
      .orderBy(friendships.rank);

    // Friends loaded for rank optimization

    // Find the friend being moved
    const friendToMove = allFriends.find(f => f.friendId === friendId);
    if (!friendToMove) {
      // Friend validation failed
      return;
    }

    const oldRank = friendToMove.rank;
    // Processing rank change
    
    // If rank is the same, no need to update
    if (oldRank === newRank) {
      // Rank unchanged, optimization skip
      return;
    }

    // Simpler approach: reassign all ranks based on the new ordering
    await db.transaction(async (tx) => {
      // Create new ordering with the moved friend in the correct position
      const updatedFriends = [...allFriends];
      
      // Remove the friend from old position
      const movedFriend = updatedFriends.splice(oldRank - 1, 1)[0];
      
      // Insert at new position
      updatedFriends.splice(newRank - 1, 0, movedFriend);
      
      // Update all ranks sequentially
      for (let i = 0; i < updatedFriends.length; i++) {
        const friend = updatedFriends[i];
        const newRankForFriend = i + 1;
        
        // Batch updating friend rank
        
        await tx
          .update(friendships)
          .set({ rank: newRankForFriend, updatedAt: new Date() })
          .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friend.friendId)));
      }
    });
    
    // Friend rank update completed
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

  async leaveKliq(userId: string): Promise<void> {
    // Remove all friendships where the user is either the friend or the owner
    await db
      .delete(friendships)
      .where(or(eq(friendships.userId, userId), eq(friendships.friendId, userId)));
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

    // Debug logging removed for production performance

    const postsQuery = db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        mediaUrl: posts.mediaUrl,
        mediaType: posts.mediaType,
        gifId: posts.gifId,
        memeId: posts.memeId,
        movieconId: posts.movieconId,
        likes: posts.likes,
        latitude: posts.latitude,
        longitude: posts.longitude,
        locationName: posts.locationName,
        address: posts.address,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: users,
        gif: gifs,
        meme: memes,
        moviecon: moviecons,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .leftJoin(gifs, eq(posts.gifId, gifs.id))
      .leftJoin(memes, eq(posts.memeId, memes.id))
      .leftJoin(moviecons, eq(posts.movieconId, moviecons.id))
      .where(and(...whereConditions))
      .orderBy(desc(posts.createdAt));

    const postsData = await postsQuery;
    // Performance: Use indexed query with limit for better scaling
    // Consider implementing pagination for posts if count exceeds 100

    // Get likes and comments for each post
    // Optimize N+1 queries: batch fetch likes and comments
    const postIds = postsData.map(p => p.id);
    
    const [allLikes, allComments] = await Promise.all([
      // Batch fetch all likes
      postIds.length > 0 ? db.select().from(postLikes).where(inArray(postLikes.postId, postIds)) : [] as any[],
      // Batch fetch all comments with joins and like counts
      postIds.length > 0 ? db
        .select({
          id: comments.id,
          postId: comments.postId,
          userId: comments.userId,
          content: comments.content,
          gifId: comments.gifId,
          memeId: comments.memeId,
          movieconId: comments.movieconId,
          createdAt: comments.createdAt,
          author: users,
          gif: gifs,
          meme: memes,
          moviecon: moviecons,
          likes_count: sql<number>`COALESCE(COUNT(${commentLikes.id}), 0)`.as('likes_count'),
        })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .leftJoin(gifs, eq(comments.gifId, gifs.id))
        .leftJoin(memes, eq(comments.memeId, memes.id))
        .leftJoin(moviecons, eq(comments.movieconId, moviecons.id))
        .leftJoin(commentLikes, eq(comments.id, commentLikes.commentId))
        .where(inArray(comments.postId, postIds))
        .groupBy(comments.id, users.id, gifs.id, memes.id, moviecons.id)
        .orderBy(comments.createdAt) : [] as any[]
    ]);

    // Group likes and comments by postId for O(1) lookup
    const likesByPost = allLikes.reduce((acc, like) => {
      if (!acc[like.postId]) acc[like.postId] = [];
      acc[like.postId].push(like);
      return acc;
    }, {} as Record<string, any[]>);

    const commentsByPost = allComments.reduce((acc, comment: any) => {
      if (!acc[comment.postId]) acc[comment.postId] = [];
      acc[comment.postId].push(comment);
      return acc;
    }, {} as Record<string, any[]>);

    // Build posts with details using grouped data
    const postsWithDetails = postsData.map((post) => ({
      id: post.id,
      userId: post.userId,
      content: post.content,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      gifId: post.gifId,
      memeId: post.memeId,
      movieconId: post.movieconId,
      gif: post.gif,
      meme: post.meme,
      moviecon: post.moviecon,
      likes: likesByPost[post.id] || [],
      latitude: post.latitude,
      longitude: post.longitude,
      locationName: post.locationName,
      address: post.address,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      comments: commentsByPost[post.id] || [],
    }));

    return postsWithDetails;
  }

  // Get paginated aggregated kliq feed including posts, polls, events, and actions with intelligent curation
  async getKliqFeed(userId: string, filters: string[], page = 1, limit = 20): Promise<{ items: any[], hasMore: boolean, totalPages: number }> {
    // Get user's friends first
    const userFriends = await this.getFriends(userId);
    const friendIds = userFriends.map(f => f.friendId);
    friendIds.push(userId); // Include user's own content

    const feedItems: any[] = [];

    try {
      // Execute all queries in parallel for better performance
      const [postsData, pollsData, eventsData, externalPostsData] = await Promise.all([
        // 1. Get regular posts
        this.getPosts(userId, filters),
        
        // 2. Get polls from kliq members (optimized query)
        friendIds.length > 0 ? db
          .select({
            id: polls.id,
            userId: polls.userId,
            title: polls.title,
            description: polls.description,
            options: polls.options,
            expiresAt: polls.expiresAt,
            isActive: polls.isActive,
            createdAt: polls.createdAt,
            authorId: users.id,
            authorFirstName: users.firstName,
            authorLastName: users.lastName,
            authorProfileImageUrl: users.profileImageUrl,
            authorKliqName: users.kliqName,
          })
          .from(polls)
          .innerJoin(users, eq(polls.userId, users.id))
          .where(inArray(polls.userId, friendIds))
          .orderBy(desc(polls.createdAt))
          .limit(limit * 2) : [], // Get more to account for filtering
          
        // 3. Get events from kliq members (optimized query)
        friendIds.length > 0 ? db
          .select({
            id: events.id,
            userId: events.userId,
            title: events.title,
            description: events.description,
            location: events.location,
            eventDate: events.eventDate,
            mediaUrl: events.mediaUrl,
            mediaType: events.mediaType,
            isPublic: events.isPublic,
            attendeeCount: events.attendeeCount,
            createdAt: events.createdAt,
            authorId: users.id,
            authorFirstName: users.firstName,
            authorLastName: users.lastName,
            authorProfileImageUrl: users.profileImageUrl,
            authorKliqName: users.kliqName,
          })
          .from(events)
          .innerJoin(users, eq(events.userId, users.id))
          .where(inArray(events.userId, friendIds))
          .orderBy(desc(events.createdAt))
          .limit(limit * 2) : [], // Get more to account for filtering
          
        // 4. Get external posts from kliq members' social media (optimized query)
        friendIds.length > 0 ? db
          .select({
            id: externalPosts.id,
            platform: externalPosts.platform,
            platformPostId: externalPosts.platformPostId,
            platformUserId: externalPosts.platformUserId,
            platformUsername: externalPosts.platformUsername,
            content: externalPosts.content,
            thumbnailUrl: externalPosts.thumbnailUrl,
            postUrl: externalPosts.postUrl,
            platformCreatedAt: externalPosts.platformCreatedAt,
            createdAt: externalPosts.createdAt,
            credentialUserId: socialCredentials.userId,
            authorId: users.id,
            authorFirstName: users.firstName,
            authorLastName: users.lastName,
            authorProfileImageUrl: users.profileImageUrl,
            authorKliqName: users.kliqName,
          })
          .from(externalPosts)
          .innerJoin(socialCredentials, eq(externalPosts.socialCredentialId, socialCredentials.id))
          .innerJoin(users, eq(socialCredentials.userId, users.id))
          .where(inArray(socialCredentials.userId, friendIds))
          .orderBy(desc(externalPosts.platformCreatedAt))
          .limit(limit * 2) : [] // Get more to account for filtering
      ]);

      // Get actions separately to avoid query issues (paginated)
      const actionsData = friendIds.length > 0 ? await db
        .select({
          id: actions.id,
          userId: actions.userId,
          title: actions.title,
          description: actions.description,
          status: actions.status,
          viewerCount: actions.viewerCount,
          thumbnailUrl: actions.thumbnailUrl,
          createdAt: actions.createdAt,
          authorId: users.id,
          authorFirstName: users.firstName,
          authorLastName: users.lastName,
          authorProfileImageUrl: users.profileImageUrl,
          authorKliqName: users.kliqName,
        })
        .from(actions)
        .innerJoin(users, eq(actions.userId, users.id))
        .where(inArray(actions.userId, friendIds))
        .orderBy(desc(actions.createdAt))
        .limit(50) : [];

      console.log(`Feed: Got ${postsData.length} posts, latest:`, postsData[0]?.createdAt);
      
      // Get highlight status for all posts
      const postIds = postsData.map(p => p.id);
      const highlights = await this.getActiveHighlights(postIds);
      const highlightedPostIds = new Set(highlights.map(h => h.postId));
      
      // Add posts to feed with highlight status
      feedItems.push(...postsData.map(post => ({
        ...post,
        type: 'post',
        activityDate: post.createdAt,
        isHighlighted: highlightedPostIds.has(post.id),
      })));

      // Add polls to feed
      feedItems.push(...pollsData.map(poll => ({
        id: poll.id,
        userId: poll.userId,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        expiresAt: poll.expiresAt,
        isActive: poll.isActive,
        createdAt: poll.createdAt,
        author: {
          id: poll.authorId,
          firstName: poll.authorFirstName,
          lastName: poll.authorLastName,
          profileImageUrl: poll.authorProfileImageUrl,
          kliqName: poll.authorKliqName,
        },
        type: 'poll',
        activityDate: poll.createdAt,
        content: `🗳️ Created a poll: "${poll.title}"`,
      })));

      // Add events to feed
      feedItems.push(...eventsData.map(event => ({
        id: event.id,
        userId: event.userId,
        title: event.title,
        description: event.description,
        location: event.location,
        eventDate: event.eventDate,
        mediaUrl: event.mediaUrl,
        mediaType: event.mediaType,
        isPublic: event.isPublic,
        attendeeCount: event.attendeeCount,
        createdAt: event.createdAt,
        author: {
          id: event.authorId,
          firstName: event.authorFirstName,
          lastName: event.authorLastName,
          profileImageUrl: event.authorProfileImageUrl,
          kliqName: event.authorKliqName,
        },
        type: 'event',
        activityDate: event.createdAt,
        content: `📅 Created event: "${event.title}"`,
      })));

      // Add actions to feed
      feedItems.push(...actionsData.map(action => ({
        id: action.id,
        userId: action.userId,
        title: action.title,
        description: action.description,
        status: action.status,
        viewerCount: action.viewerCount,
        thumbnailUrl: action.thumbnailUrl,
        activityDate: action.createdAt,
        createdAt: action.createdAt,
        author: {
          id: action.authorId,
          firstName: action.authorFirstName,
          lastName: action.authorLastName,
          profileImageUrl: action.authorProfileImageUrl,
          kliqName: action.authorKliqName,
        },
        type: 'action',
        content: `🔴 ${action.status === 'live' ? 'Started a live stream' : 'Ended a live stream'}: "${action.title}"`,
      })));

      // Add external posts from social media platforms to feed
      feedItems.push(...externalPostsData.map(externalPost => ({
        id: externalPost.id,
        userId: externalPost.credentialUserId,
        platform: externalPost.platform,
        platformPostId: externalPost.platformPostId,
        platformUsername: externalPost.platformUsername,
        content: externalPost.content,
        mediaUrl: externalPost.thumbnailUrl,
        postUrl: externalPost.postUrl,
        platformCreatedAt: externalPost.platformCreatedAt,
        activityDate: externalPost.platformCreatedAt,
        createdAt: externalPost.createdAt,
        author: {
          id: externalPost.authorId,
          firstName: externalPost.authorFirstName,
          lastName: externalPost.authorLastName,
          profileImageUrl: externalPost.authorProfileImageUrl,
          kliqName: externalPost.authorKliqName,
        },
        type: 'external_post',
      })));
    } catch (error) {
      console.error('Error fetching kliq feed items:', error);
      // Return posts only if there are errors with other queries
    }

    // Apply intelligent feed curation instead of simple chronological sort
    const curationIntelligence = new FeedCurationIntelligence();
    
    // Convert feed items to the format expected by the curation engine
    const standardizedFeedItems = feedItems.map(item => ({
      id: item.id,
      userId: item.userId,
      type: item.type,
      content: item.content || item.title || item.description || '',
      createdAt: new Date(item.createdAt),
      activityDate: new Date(item.activityDate),
      author: item.author,
      ...item // Pass through all other properties
    }));

    // Apply intelligent curation with rank-weighting, engagement prediction, and content balancing
    const curatedResult = await curationIntelligence.getCuratedFeed(
      userId, 
      standardizedFeedItems, 
      page, 
      limit
    );

    return {
      items: curatedResult.items,
      hasMore: curatedResult.hasMore,
      totalPages: curatedResult.totalPages
    };
  }

  async getPostById(postId: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(postId: string, updates: Partial<Pick<Post, 'content'>>): Promise<Post> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, postId))
      .returning();
    return updatedPost;
  }

  async deletePost(postId: string): Promise<void> {
    // Delete associated data first (comments, likes)
    await db.delete(commentLikes).where(
      sql`${commentLikes.commentId} IN (SELECT ${comments.id} FROM ${comments} WHERE ${comments.postId} = ${postId})`
    );
    await db.delete(comments).where(eq(comments.postId, postId));
    await db.delete(postLikes).where(eq(postLikes.postId, postId));
    
    // Finally delete the post
    await db.delete(posts).where(eq(posts.id, postId));
  }

  async likePost(postId: string, userId: string): Promise<void> {
    await db.insert(postLikes).values({ postId, userId });
    await db
      .update(posts)
      .set({ likes: sql`COALESCE(${posts.likes}, 0) + 1` })
      .where(eq(posts.id, postId));
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    await db
      .update(posts)
      .set({ likes: sql`GREATEST(COALESCE(${posts.likes}, 0) - 1, 0)` })
      .where(eq(posts.id, postId));
  }

  async getUserReflection(userId: string): Promise<{ posts: any[]; stats: any; message: string }> {
    try {
      // Get user's posts from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Query for user's posts in last 30 days with engagement metrics
      const userPosts = await db
        .select({
          id: posts.id,
          content: posts.content,
          mediaUrl: posts.mediaUrl,
          mediaType: posts.mediaType,
          likes: posts.likes,
          createdAt: posts.createdAt,
          commentCount: count(comments.id),
        })
        .from(posts)
        .leftJoin(comments, eq(posts.id, comments.postId))
        .where(
          and(
            eq(posts.userId, userId),
            gte(posts.createdAt, thirtyDaysAgo)
          )
        )
        .groupBy(posts.id, posts.content, posts.mediaUrl, posts.mediaType, posts.likes, posts.createdAt)
        .orderBy(desc(posts.createdAt));

      if (userPosts.length === 0) {
        return {
          posts: [],
          stats: { totalPosts: 0, totalLikes: 0, totalComments: 0, avgEngagement: 0 },
          message: "No posts found in the last 30 days. Start sharing to build your reflection!"
        };
      }

      // Calculate engagement score (likes + comments * 2) for ranking
      const postsWithEngagement = userPosts.map(post => ({
        ...post,
        engagementScore: (post.likes || 0) + (post.commentCount * 2)
      }));

      // Sort by engagement score and get top posts
      const topPosts = postsWithEngagement
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 12); // Top 12 for collage

      // Calculate stats
      const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
      const totalComments = userPosts.reduce((sum, post) => sum + post.commentCount, 0);
      const avgEngagement = userPosts.length > 0 ? (totalLikes + totalComments) / userPosts.length : 0;

      const stats = {
        totalPosts: userPosts.length,
        totalLikes,
        totalComments,
        avgEngagement: Math.round(avgEngagement * 10) / 10,
        topEngagementScore: topPosts.length > 0 ? topPosts[0].engagementScore : 0
      };

      let reflectionMessage = "";
      if (topPosts.length >= 3) {
        reflectionMessage = `🌟 Your top ${topPosts.length} posts from the last 30 days! Your best post got ${topPosts[0].engagementScore} engagement points. Keep creating amazing content!`;
      } else if (topPosts.length > 0) {
        reflectionMessage = `✨ Here are your ${topPosts.length} posts from the last 30 days. Keep sharing to build your reflection collage!`;
      } else {
        reflectionMessage = "Start posting more to see your viral content reflection!";
      }

      return {
        posts: topPosts,
        stats,
        message: reflectionMessage
      };
    } catch (error) {
      console.error('Error generating user reflection:', error);
      throw new Error('Failed to generate reflection');
    }
  }

  // Comment operations
  async addComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning() as Comment[];
    if (!result || result.length === 0) {
      throw new Error('Failed to create comment');
    }
    return result[0];
  }

  async getCommentById(commentId: string): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, commentId));
    return comment as Comment | undefined;
  }

  async likeComment(commentId: string, userId: string): Promise<void> {
    // Check if already liked
    const [existingLike] = await db
      .select()
      .from(commentLikes)
      .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));

    if (!existingLike) {
      await db.insert(commentLikes).values({ commentId, userId });
    }
  }

  async unlikeComment(commentId: string, userId: string): Promise<void> {
    await db
      .delete(commentLikes)
      .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));
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
      // Generate KLIQ-XXXX-XXXX format with random alphanumeric characters
      const part1 = Math.random().toString(36).substr(2, 4).toUpperCase();
      const part2 = Math.random().toString(36).substr(2, 4).toUpperCase();
      code = `KLIQ-${part1}-${part2}`;
      
      // Check if code is already assigned to a user
      const existingUser = await db.select().from(users).where(eq(users.inviteCode, code));
      // Check if code has been used
      const usedCode = await db.select().from(usedInviteCodes).where(eq(usedInviteCodes.inviteCode, code));
      
      isUnique = existingUser.length === 0 && usedCode.length === 0;
    }
    
    return code!;
  }

  async getUserByInviteCode(inviteCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.inviteCode, inviteCode));
    return user;
  }

  async isInviteCodeUsed(inviteCode: string): Promise<boolean> {
    const [usedCode] = await db.select().from(usedInviteCodes).where(eq(usedInviteCodes.inviteCode, inviteCode));
    return !!usedCode;
  }

  async markInviteCodeAsUsed(inviteCode: string, usedBy: string, ownedBy: string): Promise<void> {
    await db.insert(usedInviteCodes).values({
      inviteCode,
      usedBy,
      ownedBy,
    });
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

    // Optimize N+1: batch fetch all story views for current user
    const storyIds = storiesData.map(s => s.id);
    const userStoryViews = storyIds.length > 0 ? await db
      .select({ storyId: storyViews.storyId })
      .from(storyViews)
      .where(and(inArray(storyViews.storyId, storyIds), eq(storyViews.userId, userId))) : [];

    const viewedStoryIds = new Set(userStoryViews.map(v => v.storyId));

    const storiesWithViewStatus = storiesData.map((story) => ({
      id: story.id,
      userId: story.userId,
      content: story.content,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      viewCount: story.viewCount || 0,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      author: story.author,
      hasViewed: viewedStoryIds.has(story.id),
    }));

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

  // Clean up expired polls
  async cleanUpExpiredPolls(): Promise<void> {
    const now = new Date();
    
    // First get expired poll IDs
    const expiredPolls = await db
      .select({ id: polls.id })
      .from(polls)
      .where(sql`${polls.expiresAt} < ${now}`);

    if (expiredPolls.length === 0) {
      console.log(`No expired polls to clean up at ${now.toISOString()}`);
      return;
    }

    const expiredPollIds = expiredPolls.map(p => p.id);

    // Delete poll votes first (foreign key constraint)
    await db.delete(pollVotes).where(inArray(pollVotes.pollId, expiredPollIds));
    
    // Delete expired polls
    const result = await db.delete(polls).where(sql`${polls.expiresAt} < ${now}`);
    
    console.log(`Cleaned up ${expiredPolls.length} expired polls and their votes at ${now.toISOString()}`);
  }

  // Clean up expired events
  async cleanUpExpiredEvents(): Promise<void> {
    const now = new Date();
    
    // First get expired event IDs  
    const expiredEvents = await db
      .select({ id: events.id })
      .from(events)
      .where(sql`${events.eventDate} < ${now}`);

    if (expiredEvents.length === 0) {
      console.log(`No expired events to clean up at ${now.toISOString()}`);
      return;
    }

    const expiredEventIds = expiredEvents.map(e => e.id);

    // Delete event attendees first (foreign key constraint)
    await db.delete(eventAttendees).where(inArray(eventAttendees.eventId, expiredEventIds));
    
    // Delete expired events
    const result = await db.delete(events).where(sql`${events.eventDate} < ${now}`);
    
    console.log(`Cleaned up ${expiredEvents.length} expired events and their attendees at ${now.toISOString()}`);
  }

  // Message operations
  async getConversations(userId: string): Promise<(Conversation & { otherUser: User; lastMessage?: Message; unreadCount: number })[]> {
    // Get all conversations for the user
    const userConversations = await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)))
      .orderBy(desc(conversations.lastActivity));

    // Optimize N+1: batch fetch all data needed
    const otherUserIds = userConversations.map(conv => 
      conv.user1Id === userId ? conv.user2Id : conv.user1Id
    );
    const lastMessageIds = userConversations
      .filter(conv => conv.lastMessageId)
      .map(conv => conv.lastMessageId!);

    const [allOtherUsers, allLastMessages, allUnreadCounts] = await Promise.all([
      // Batch fetch all other users
      otherUserIds.length > 0 ? db.select().from(users).where(inArray(users.id, otherUserIds)) : [],
      // Batch fetch all last messages
      lastMessageIds.length > 0 ? db.select().from(messages).where(inArray(messages.id, lastMessageIds)) : [],
      // Optimized: Single query for all unread counts using conditional aggregation
      userConversations.length > 0 ? db
        .select({ 
          conversationId: sql<string>`CASE 
            WHEN ${conversations.user1Id} = ${userId} THEN ${conversations.id}
            WHEN ${conversations.user2Id} = ${userId} THEN ${conversations.id}
            END`,
          count: sql<number>`count(${messages.id})`
        })
        .from(conversations)
        .leftJoin(messages, 
          and(
            eq(messages.receiverId, userId),
            eq(messages.isRead, false),
            or(
              and(eq(conversations.user1Id, userId), eq(messages.senderId, conversations.user2Id)),
              and(eq(conversations.user2Id, userId), eq(messages.senderId, conversations.user1Id))
            ),
            or(
              sql`${messages.expiresAt} IS NULL`,
              sql`${messages.expiresAt} > NOW()`
            )
          )
        )
        .where(or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)))
        .groupBy(conversations.id)
        : Promise.resolve([])
    ]);

    // Create lookup maps
    const userMap = allOtherUsers.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, typeof allOtherUsers[0]>);

    const messageMap = allLastMessages.reduce((acc, msg) => {
      acc[msg.id] = msg;
      return acc;
    }, {} as Record<string, typeof allLastMessages[0]>);

    const unreadMap = allUnreadCounts.reduce((acc, item) => {
      if (item.conversationId) {
        acc[item.conversationId] = Number(item.count) || 0;
      }
      return acc;
    }, {} as Record<string, number>);

    const conversationsWithDetails = userConversations.map((conv) => {
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      const otherUser = userMap[otherUserId];
      const lastMessage = conv.lastMessageId ? messageMap[conv.lastMessageId] : undefined;

      return {
        ...conv,
        otherParticipant: otherUser, // Use otherParticipant to match route expectation
        otherUser,
        lastMessage,
        unreadCount: unreadMap[conv.id] || 0,
      };
    });

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
        gif: gifs,
        moviecon: moviecons,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .leftJoin(gifs, eq(messages.gifId, gifs.id))
      .leftJoin(moviecons, eq(messages.movieconId, moviecons.id))
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
      conversationMessages.map(async ({ message, sender, gif, moviecon }) => {
        const [receiver] = await db
          .select()
          .from(users)
          .where(eq(users.id, message.receiverId));
        
        return {
          ...message,
          sender,
          receiver,
          gif,
          moviecon,
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
    // Get the conversation to find the other participant
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Determine the other participant
    const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

    // Mark all unread messages in this conversation as read for the user
    const readAt = new Date();
    const expiresAt = new Date(readAt.getTime() + 3 * 60 * 1000); // 3 minutes after being read
    
    const result = await db
      .update(messages)
      .set({ 
        isRead: true,
        readAt,
        expiresAt 
      })
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.senderId, otherUserId),
          eq(messages.isRead, false)
        )
      );
    
    console.log(`Marked messages as read in conversation ${conversationId} for user ${userId}.`);
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
    
    // First, get expired message IDs
    const expiredMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .where(sql`${messages.expiresAt} < ${now}`);
    
    if (expiredMessages.length === 0) {
      console.log(`No expired messages to clean up at ${now.toISOString()}`);
      return;
    }
    
    const expiredMessageIds = expiredMessages.map(m => m.id);
    
    // Update conversations to remove references to expired messages
    await db
      .update(conversations)
      .set({ lastMessageId: null })
      .where(inArray(conversations.lastMessageId, expiredMessageIds));
    
    // Delete expired messages
    const result = await db.delete(messages).where(sql`${messages.expiresAt} < ${now}`);
    
    console.log(`Cleaned up ${expiredMessages.length} expired messages at ${now.toISOString()}`);
  }

  async deleteOldConversations(): Promise<void> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Find conversations older than 7 days based on lastActivity
    const oldConversations = await db
      .select({ 
        id: conversations.id, 
        user1Id: conversations.user1Id, 
        user2Id: conversations.user2Id 
      })
      .from(conversations)
      .where(lt(conversations.lastActivity, sevenDaysAgo));
    
    if (oldConversations.length === 0) {
      console.log(`No old conversations to clean up at ${now.toISOString()}`);
      return;
    }
    
    const oldConversationIds = oldConversations.map(c => c.id);
    
    // First, clear last_message_id references for these conversations
    await db
      .update(conversations)
      .set({ lastMessageId: null })
      .where(inArray(conversations.id, oldConversationIds));
    
    let messagesDeletedCount = 0;
    
    // For each old conversation, delete all messages between those users
    for (const conv of oldConversations) {
      const messagesResult = await db
        .delete(messages)
        .where(
          or(
            and(eq(messages.senderId, conv.user1Id), eq(messages.receiverId, conv.user2Id)),
            and(eq(messages.senderId, conv.user2Id), eq(messages.receiverId, conv.user1Id))
          )
        );
      
      messagesDeletedCount += messagesResult.rowCount || 0;
    }
    
    // Delete the conversations
    const conversationsResult = await db
      .delete(conversations)
      .where(lt(conversations.lastActivity, sevenDaysAgo));
    
    console.log(`Cleaned up ${oldConversations.length} old conversations and ${messagesDeletedCount} messages at ${now.toISOString()}`);
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

    // Optimize N+1: batch fetch all event attendees
    const eventIds = eventsData.map(({ event }) => event.id);
    const allAttendees = eventIds.length > 0 ? await db
      .select({
        attendee: eventAttendees,
        user: users,
      })
      .from(eventAttendees)
      .innerJoin(users, eq(eventAttendees.userId, users.id))
      .where(inArray(eventAttendees.eventId, eventIds)) : [];

    // Group attendees by eventId
    const attendeesByEvent = allAttendees.reduce((acc, { attendee, user }) => {
      if (!acc[attendee.eventId]) acc[attendee.eventId] = [];
      acc[attendee.eventId].push({ ...attendee, user });
      return acc;
    }, {} as Record<string, any[]>);

    const eventsWithAttendees = eventsData.map(({ event, author }) => ({
      ...event,
      author,
      attendees: attendeesByEvent[event.id] || [],
    }));

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

    // Auto-post to kliq feed about event creation
    const eventDate = new Date(newEvent.eventDate);
    const formattedDate = eventDate.toLocaleDateString("en-US", { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      timeZone: 'America/New_York' // Use user's timezone - could be made configurable per user
    });
    const formattedTime = eventDate.toLocaleTimeString("en-US", { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York' // Use user's timezone - could be made configurable per user
    });
    
    let postContent = `📅 Created an event: "${newEvent.title}"`;
    if (newEvent.location) {
      postContent += `\n📍 ${newEvent.location}`;
    }
    postContent += `\n🕒 ${formattedDate} at ${formattedTime}`;
    if (newEvent.description) {
      postContent += `\n\n${newEvent.description}`;
    }

    await this.createPost({
      userId: event.userId,
      content: postContent,
      mediaUrl: newEvent.mediaUrl || null,
      mediaType: newEvent.mediaType || null,
    });

    // Create auto-reminder for the event (set to same time each day)
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours());
    reminderTime.setMinutes(reminderTime.getMinutes());
    reminderTime.setSeconds(0);
    reminderTime.setMilliseconds(0);

    await this.createEventReminder({
      eventId: newEvent.id,
      userId: event.userId,
      reminderTime: reminderTime,
      isActive: true,
    });

    return newEvent;
  }

  async updateEvent(eventId: string, updates: Partial<InsertEvent>): Promise<Event> {
    console.log(`Updating event ${eventId} with:`, updates);
    
    // Get the original event for comparison
    const originalEvent = await this.getEventById(eventId);
    console.log(`Original event found:`, originalEvent);
    
    const [updatedEvent] = await db
      .update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning();

    console.log(`Event updated successfully:`, updatedEvent);

    // Auto-post to kliq feed about event update
    if (originalEvent) {
      console.log(`Creating auto-post for event update...`);
      try {
        const eventDate = new Date(updatedEvent.eventDate);
        const formattedDate = eventDate.toLocaleDateString("en-US", { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
          timeZone: 'America/New_York' // Use user's timezone - could be made configurable per user
        });
        const formattedTime = eventDate.toLocaleTimeString("en-US", { 
          hour: 'numeric', 
          minute: '2-digit',
          timeZone: 'America/New_York' // Use user's timezone - could be made configurable per user
        });
        
        let postContent = `✏️ Updated event: "${updatedEvent.title}"`;
        if (updatedEvent.location) {
          postContent += `\n📍 ${updatedEvent.location}`;
        }
        postContent += `\n🕒 ${formattedDate} at ${formattedTime}`;
        if (updatedEvent.description) {
          postContent += `\n\n${updatedEvent.description}`;
        }

        console.log(`Auto-post content:`, postContent);

        const autoPost = await this.createPost({
          userId: updatedEvent.userId,
          content: postContent,
          mediaUrl: updatedEvent.mediaUrl || null,
          mediaType: updatedEvent.mediaType || null,
        });

        console.log(`Auto-post created successfully:`, autoPost);
      } catch (error) {
        console.error(`Error creating auto-post for event update:`, error);
      }
    } else {
      console.log(`No original event found, skipping auto-post`);
    }

    return updatedEvent;
  }

  async deleteEvent(eventId: string): Promise<void> {
    // Delete event reminders first (to maintain referential integrity)
    await db.delete(eventReminders).where(eq(eventReminders.eventId, eventId));
    
    // Delete event attendees
    await db.delete(eventAttendees).where(eq(eventAttendees.eventId, eventId));
    
    // Delete the event itself
    await db.delete(events).where(eq(events.id, eventId));
  }

  async getUserEventAttendance(eventId: string, userId: string): Promise<{ status: string } | undefined> {
    const [attendance] = await db
      .select()
      .from(eventAttendees)
      .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)))
      .limit(1);
    
    return attendance && attendance.status ? { status: attendance.status } : undefined;
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

  async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
    const attendees = await db
      .select()
      .from(eventAttendees)
      .where(eq(eventAttendees.eventId, eventId));
    return attendees;
  }

  // Event reminder operations
  async createEventReminder(reminder: InsertEventReminder): Promise<EventReminder> {
    const [newReminder] = await db.insert(eventReminders).values(reminder).returning();
    return newReminder;
  }

  async getActiveEventReminders(): Promise<{ reminder: EventReminder; event: Event; user: User }[]> {
    const now = new Date();
    
    // Get reminders that are active, for events that haven't passed, and it's time to send reminder
    return await db
      .select({
        reminder: eventReminders,
        event: events,
        user: users,
      })
      .from(eventReminders)
      .innerJoin(events, eq(eventReminders.eventId, events.id))
      .innerJoin(users, eq(eventReminders.userId, users.id))
      .where(
        and(
          eq(eventReminders.isActive, true),
          gt(events.eventDate, now), // Event hasn't passed
          lte(eventReminders.reminderTime, now), // It's time to send reminder
          or(
            isNull(eventReminders.lastReminderSent),
            lt(eventReminders.lastReminderSent, sql`${eventReminders.reminderTime} + INTERVAL '23 hours'`) // Haven't sent in last 23 hours
          )
        )
      );
  }

  async updateReminderSentTime(reminderId: string): Promise<void> {
    await db
      .update(eventReminders)
      .set({ lastReminderSent: new Date() })
      .where(eq(eventReminders.id, reminderId));
  }

  async deactivateEventReminder(reminderId: string): Promise<void> {
    await db
      .update(eventReminders)
      .set({ isActive: false })
      .where(eq(eventReminders.id, reminderId));
  }

  // Calendar note operations
  async getKliqsForUser(userId: string): Promise<{ kliqId: string; kliqName: string; kliqOwner: User; isOwner: boolean }[]> {
    const kliqs: { kliqId: string; kliqName: string; kliqOwner: User; isOwner: boolean }[] = [];
    
    // 1. Get user's own kliq (they are the owner)
    const user = await this.getUser(userId);
    if (user) {
      kliqs.push({
        kliqId: user.id,
        kliqName: user.kliqName || 'My Kliq',
        kliqOwner: user,
        isOwner: true,
      });
    }
    
    // 2. Get all kliqs where user is an accepted friend
    const friendshipResults = await db
      .select({
        friendship: friendships,
        kliqOwner: users,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.userId, users.id))
      .where(
        and(
          eq(friendships.friendId, userId),
          eq(friendships.status, 'accepted')
        )
      );
    
    for (const { friendship, kliqOwner } of friendshipResults) {
      kliqs.push({
        kliqId: friendship.userId, // The user who invited them is the kliq owner
        kliqName: kliqOwner.kliqName || 'My Kliq',
        kliqOwner,
        isOwner: false,
      });
    }
    
    return kliqs;
  }

  async isUserInKliq(userId: string, kliqId: string): Promise<boolean> {
    // User is in kliq if they are the owner
    if (userId === kliqId) {
      return true;
    }
    
    // Or if they are an accepted friend of the kliq owner
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, kliqId),
          eq(friendships.friendId, userId),
          eq(friendships.status, 'accepted')
        )
      )
      .limit(1);
    
    return !!friendship;
  }

  async getCalendarNotes(kliqId: string, startDate?: string, endDate?: string): Promise<(CalendarNote & { author: User })[]> {
    let query = db
      .select({
        note: calendarNotes,
        author: users,
      })
      .from(calendarNotes)
      .innerJoin(users, eq(calendarNotes.userId, users.id))
      .where(eq(calendarNotes.kliqId, kliqId))
      .$dynamic();

    if (startDate && endDate) {
      query = query.where(
        and(
          eq(calendarNotes.kliqId, kliqId),
          gte(calendarNotes.noteDate, startDate),
          lte(calendarNotes.noteDate, endDate)
        )
      );
    }

    const results = await query.orderBy(asc(calendarNotes.noteDate));
    
    return results.map(r => ({
      ...r.note,
      author: r.author,
    }));
  }

  async getCalendarNoteById(noteId: string): Promise<CalendarNote | undefined> {
    const [note] = await db.select().from(calendarNotes).where(eq(calendarNotes.id, noteId));
    return note;
  }

  async createCalendarNote(note: InsertCalendarNote): Promise<CalendarNote> {
    const [newNote] = await db.insert(calendarNotes).values(note).returning();
    return newNote;
  }

  async updateCalendarNote(noteId: string, updates: Partial<InsertCalendarNote>): Promise<CalendarNote> {
    const [updatedNote] = await db
      .update(calendarNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(calendarNotes.id, noteId))
      .returning();
    return updatedNote;
  }

  async deleteCalendarNote(noteId: string): Promise<void> {
    await db.delete(calendarNotes).where(eq(calendarNotes.id, noteId));
  }

  async getTodaysCalendarReminders(): Promise<(CalendarNote & { author: User; kliqOwner: User })[]> {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    const results = await db
      .select({
        note: calendarNotes,
        author: users,
        kliqOwner: {
          id: sql<string>`kliq_owner.id`,
          email: sql<string>`kliq_owner.email`,
          firstName: sql<string>`kliq_owner.first_name`,
          lastName: sql<string>`kliq_owner.last_name`,
          profileImageUrl: sql<string>`kliq_owner.profile_image_url`,
        },
      })
      .from(calendarNotes)
      .innerJoin(users, eq(calendarNotes.userId, users.id))
      .innerJoin(sql`users as kliq_owner`, sql`calendar_notes.kliq_id = kliq_owner.id`)
      .where(
        and(
          eq(calendarNotes.noteDate, today),
          eq(calendarNotes.remindKliq, true),
          eq(calendarNotes.reminderSent, false)
        )
      );

    return results.map(r => ({
      ...r.note,
      author: r.author,
      kliqOwner: r.kliqOwner as User,
    }));
  }

  async markReminderSent(noteId: string): Promise<void> {
    await db
      .update(calendarNotes)
      .set({ reminderSent: true })
      .where(eq(calendarNotes.id, noteId));
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

    // Optimize N+1: batch fetch all action viewers
    const actionIds = allActions.map(({ action }) => action.id);
    const allViewers = actionIds.length > 0 ? await db
      .select()
      .from(actionViewers)
      .where(and(inArray(actionViewers.actionId, actionIds), sql`left_at IS NULL`)) : [];

    // Group viewers by actionId
    const viewersByAction = allViewers.reduce((acc, viewer) => {
      if (!acc[viewer.actionId]) acc[viewer.actionId] = [];
      acc[viewer.actionId].push(viewer);
      return acc;
    }, {} as Record<string, any[]>);

    const actionsWithViewers = allActions.map(({ action, author }) => {
      const viewers = viewersByAction[action.id] || [];
      return {
        ...action,
        author: author!,
        viewers,
        viewerCount: viewers.length,
      };
    });

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

    // Optimize N+1: batch fetch all meetup check-ins
    const meetupIds = meetupsData.map(({ meetup }) => meetup.id);
    const allCheckIns = meetupIds.length > 0 ? await db
      .select({
        checkIn: meetupCheckIns,
        user: users,
      })
      .from(meetupCheckIns)
      .innerJoin(users, eq(meetupCheckIns.userId, users.id))
      .where(inArray(meetupCheckIns.meetupId, meetupIds)) : [];

    // Group check-ins by meetupId
    const checkInsByMeetup = allCheckIns.reduce((acc, { checkIn, user }) => {
      if (!acc[checkIn.meetupId]) acc[checkIn.meetupId] = [];
      acc[checkIn.meetupId].push({ ...checkIn, user });
      return acc;
    }, {} as Record<string, any[]>);

    const meetupsWithCheckIns = meetupsData.map(({ meetup, organizer }) => ({
      ...meetup,
      organizer,
      checkIns: checkInsByMeetup[meetup.id] || [],
    }));

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

  // Video call operations
  async createVideoCall(call: InsertVideoCall): Promise<VideoCall> {
    const [videoCall] = await db
      .insert(videoCalls)
      .values(call)
      .returning();
    return videoCall;
  }

  async getVideoCall(callId: string): Promise<VideoCall | undefined> {
    const [call] = await db
      .select()
      .from(videoCalls)
      .where(eq(videoCalls.id, callId));
    return call;
  }

  async updateVideoCallStatus(callId: string, status: string, startedAt?: Date, endedAt?: Date): Promise<void> {
    await db
      .update(videoCalls)
      .set({ 
        status: status as any,
        ...(startedAt && { startedAt }),
        ...(endedAt && { endedAt }),
        updatedAt: new Date()
      })
      .where(eq(videoCalls.id, callId));
  }

  async addCallParticipant(participant: InsertCallParticipant): Promise<CallParticipant> {
    const [callParticipant] = await db
      .insert(callParticipants)
      .values(participant)
      .returning();
    return callParticipant;
  }

  async updateParticipantStatus(callId: string, userId: string, status: string, joinedAt?: Date, leftAt?: Date): Promise<void> {
    await db
      .update(callParticipants)
      .set({
        status,
        ...(joinedAt && { joinedAt }),
        ...(leftAt && { leftAt })
      })
      .where(and(
        eq(callParticipants.callId, callId),
        eq(callParticipants.userId, userId)
      ));
  }

  async getCallParticipants(callId: string): Promise<(CallParticipant & { user: User })[]> {
    return await db
      .select({
        id: callParticipants.id,
        callId: callParticipants.callId,
        userId: callParticipants.userId,
        status: callParticipants.status,
        joinedAt: callParticipants.joinedAt,
        leftAt: callParticipants.leftAt,
        createdAt: callParticipants.createdAt,
        user: users,
      })
      .from(callParticipants)
      .innerJoin(users, eq(callParticipants.userId, users.id))
      .where(eq(callParticipants.callId, callId));
  }

  async getUserActiveCalls(userId: string): Promise<(VideoCall & { participants: (CallParticipant & { user: User })[] })[]> {
    // Get calls where user is a participant and call is not ended
    const callsQuery = await db
      .select({
        call: videoCalls,
      })
      .from(videoCalls)
      .innerJoin(callParticipants, eq(videoCalls.id, callParticipants.callId))
      .where(and(
        eq(callParticipants.userId, userId),
        inArray(videoCalls.status, ['pending', 'active'])
      ));

    // Optimize N+1: batch fetch all call participants
    const callIds = callsQuery.map(({ call }) => call.id);
    const allParticipants = callIds.length > 0 ? await db
      .select({
        participant: callParticipants,
        user: users,
      })
      .from(callParticipants)
      .innerJoin(users, eq(callParticipants.userId, users.id))
      .where(inArray(callParticipants.callId, callIds)) : [];

    // Group participants by callId
    const participantsByCall = allParticipants.reduce((acc, { participant, user }) => {
      if (!acc[participant.callId]) acc[participant.callId] = [];
      acc[participant.callId].push({ ...participant, user });
      return acc;
    }, {} as Record<string, any[]>);

    const callsWithParticipants = callsQuery.map(({ call }) => ({
      ...call,
      participants: participantsByCall[call.id] || [],
    }));

    return callsWithParticipants;
  }

  // Scrapbook operations
  async createScrapbookAlbum(album: InsertScrapbookAlbum): Promise<ScrapbookAlbum> {
    const [newAlbum] = await db
      .insert(scrapbookAlbums)
      .values(album)
      .returning();
    return newAlbum;
  }

  async getUserScrapbookAlbums(userId: string): Promise<(ScrapbookAlbum & { saveCount: number })[]> {
    const albums = await db
      .select({
        album: scrapbookAlbums,
        saveCount: sql<number>`count(${scrapbookSaves.id})::int`.as('saveCount'),
      })
      .from(scrapbookAlbums)
      .leftJoin(scrapbookSaves, eq(scrapbookAlbums.id, scrapbookSaves.albumId))
      .where(eq(scrapbookAlbums.userId, userId))
      .groupBy(scrapbookAlbums.id)
      .orderBy(desc(scrapbookAlbums.createdAt));

    return albums.map(({ album, saveCount }) => ({
      ...album,
      saveCount: saveCount || 0,
    }));
  }

  async updateScrapbookAlbum(albumId: string, updates: Partial<InsertScrapbookAlbum>): Promise<ScrapbookAlbum> {
    const [updatedAlbum] = await db
      .update(scrapbookAlbums)
      .set(updates)
      .where(eq(scrapbookAlbums.id, albumId))
      .returning();
    return updatedAlbum;
  }

  async deleteScrapbookAlbum(albumId: string): Promise<void> {
    await db.delete(scrapbookAlbums).where(eq(scrapbookAlbums.id, albumId));
  }

  async savePostToScrapbook(save: InsertScrapbookSave): Promise<ScrapbookSave> {
    const [newSave] = await db
      .insert(scrapbookSaves)
      .values(save)
      .returning();
    return newSave;
  }

  async unsavePostFromScrapbook(userId: string, postId: string): Promise<void> {
    await db
      .delete(scrapbookSaves)
      .where(and(
        eq(scrapbookSaves.userId, userId),
        eq(scrapbookSaves.postId, postId)
      ));
  }

  async getUserScrapbookSaves(userId: string, albumId?: string): Promise<(ScrapbookSave & { post: Post & { author: User } })[]> {
    const conditions = [eq(scrapbookSaves.userId, userId)];
    if (albumId) {
      conditions.push(eq(scrapbookSaves.albumId, albumId));
    }

    const saves = await db
      .select({
        save: scrapbookSaves,
        post: posts,
        author: users,
      })
      .from(scrapbookSaves)
      .innerJoin(posts, eq(scrapbookSaves.postId, posts.id))
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(scrapbookSaves.savedAt));

    return saves.map(({ save, post, author }) => ({
      ...save,
      post: {
        ...post,
        author,
      },
    }));
  }

  async updateScrapbookSaveNote(saveId: string, note: string): Promise<ScrapbookSave> {
    const [updatedSave] = await db
      .update(scrapbookSaves)
      .set({ note })
      .where(eq(scrapbookSaves.id, saveId))
      .returning();
    return updatedSave;
  }

  async getScrapbookSaveCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scrapbookSaves)
      .where(eq(scrapbookSaves.userId, userId));
    return result[0]?.count || 0;
  }

  async isPostSavedByUser(userId: string, postId: string): Promise<boolean> {
    const result = await db
      .select({ id: scrapbookSaves.id })
      .from(scrapbookSaves)
      .where(and(
        eq(scrapbookSaves.userId, userId),
        eq(scrapbookSaves.postId, postId)
      ))
      .limit(1);
    return result.length > 0;
  }

  // Post Highlight operations
  async addPostHighlight(highlight: InsertPostHighlight): Promise<PostHighlight> {
    await db
      .delete(postHighlights)
      .where(eq(postHighlights.postId, highlight.postId));
    
    const [newHighlight] = await db
      .insert(postHighlights)
      .values(highlight)
      .returning();
    return newHighlight;
  }

  async removePostHighlight(postId: string): Promise<void> {
    await db
      .delete(postHighlights)
      .where(eq(postHighlights.postId, postId));
  }

  async getActiveHighlights(postIds: string[]): Promise<PostHighlight[]> {
    if (postIds.length === 0) return [];
    
    return await db
      .select()
      .from(postHighlights)
      .where(and(
        inArray(postHighlights.postId, postIds),
        sql`${postHighlights.expiresAt} > NOW()`
      ));
  }

  async getUserLastHighlight(userId: string): Promise<PostHighlight | null> {
    const result = await db
      .select()
      .from(postHighlights)
      .where(eq(postHighlights.userId, userId))
      .orderBy(desc(postHighlights.highlightedAt))
      .limit(1);
    return result[0] || null;
  }

  async isPostHighlighted(postId: string): Promise<boolean> {
    const result = await db
      .select({ id: postHighlights.id })
      .from(postHighlights)
      .where(and(
        eq(postHighlights.postId, postId),
        sql`${postHighlights.expiresAt} > NOW()`
      ))
      .limit(1);
    return result.length > 0;
  }

  // GIF operations
  async getAllGifs(): Promise<Gif[]> {
    return await db.select().from(gifs).orderBy(desc(gifs.createdAt));
  }

  async getGifsByCategory(category: string): Promise<Gif[]> {
    return await db
      .select()
      .from(gifs)
      .where(eq(gifs.category, category))
      .orderBy(desc(gifs.createdAt));
  }

  async getTrendingGifs(): Promise<Gif[]> {
    return await db
      .select()
      .from(gifs)
      .where(eq(gifs.trending, true))
      .orderBy(desc(gifs.createdAt));
  }

  async getFeaturedGifs(): Promise<Gif[]> {
    return await db
      .select()
      .from(gifs)
      .where(eq(gifs.featured, true))
      .orderBy(desc(gifs.createdAt));
  }

  async searchGifs(query: string): Promise<Gif[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(gifs)
      .where(or(
        like(gifs.title, searchTerm),
        like(gifs.category, searchTerm)
      ))
      .orderBy(desc(gifs.createdAt));
  }

  async getGifById(id: string): Promise<Gif | undefined> {
    const [gif] = await db.select().from(gifs).where(eq(gifs.id, id));
    return gif;
  }

  async createGif(gif: InsertGif): Promise<Gif> {
    const [newGif] = await db.insert(gifs).values(gif).returning();
    return newGif;
  }

  async updateGif(id: string, updates: Partial<Gif>): Promise<Gif> {
    const [updatedGif] = await db
      .update(gifs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gifs.id, id))
      .returning();
    return updatedGif;
  }

  async deleteGif(id: string): Promise<void> {
    await db.delete(gifs).where(eq(gifs.id, id));
  }

  // Meme operations
  async getAllMemes(): Promise<Meme[]> {
    return await db.select().from(memes).orderBy(memes.title);
  }

  async getMemesByCategory(category: string): Promise<Meme[]> {
    return await db
      .select()
      .from(memes)
      .where(eq(memes.category, category))
      .orderBy(memes.title);
  }

  async getTrendingMemes(): Promise<Meme[]> {
    return await db
      .select()
      .from(memes)
      .where(eq(memes.trending, true))
      .orderBy(memes.title);
  }

  async getFeaturedMemes(): Promise<Meme[]> {
    return await db
      .select()
      .from(memes)
      .where(eq(memes.featured, true))
      .orderBy(memes.title);
  }

  async searchMemes(query: string): Promise<Meme[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(memes)
      .where(or(
        sql`LOWER(${memes.title}) LIKE ${searchTerm}`,
        sql`LOWER(${memes.category}) LIKE ${searchTerm}`,
        sql`LOWER(COALESCE(${memes.description}, '')) LIKE ${searchTerm}`
      ))
      .orderBy(memes.title);
  }

  async getMemeById(id: string): Promise<Meme | undefined> {
    const [meme] = await db.select().from(memes).where(eq(memes.id, id));
    return meme;
  }

  async createMeme(meme: InsertMeme): Promise<Meme> {
    const [newMeme] = await db.insert(memes).values(meme).returning();
    return newMeme;
  }

  async updateMeme(id: string, updates: Partial<Meme>): Promise<Meme> {
    const [updatedMeme] = await db
      .update(memes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(memes.id, id))
      .returning();
    return updatedMeme;
  }

  async deleteMeme(id: string): Promise<void> {
    await db.delete(memes).where(eq(memes.id, id));
  }

  // Moviecon operations
  async getAllMoviecons(): Promise<Moviecon[]> {
    return await db.select().from(moviecons).orderBy(moviecons.title);
  }

  async getMovieconsByCategory(category: string): Promise<Moviecon[]> {
    return await db
      .select()
      .from(moviecons)
      .where(eq(moviecons.category, category))
      .orderBy(moviecons.title);
  }

  async getTrendingMoviecons(): Promise<Moviecon[]> {
    return await db
      .select()
      .from(moviecons)
      .where(eq(moviecons.trending, true))
      .orderBy(moviecons.title);
  }

  async getFeaturedMoviecons(): Promise<Moviecon[]> {
    return await db
      .select()
      .from(moviecons)
      .where(eq(moviecons.featured, true))
      .orderBy(moviecons.title);
  }

  async searchMoviecons(query: string): Promise<Moviecon[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(moviecons)
      .where(or(
        like(moviecons.title, searchTerm),
        like(moviecons.category, searchTerm),
        like(moviecons.movieSource, searchTerm)
      ))
      .orderBy(moviecons.title);
  }

  async getMovieconById(id: string): Promise<Moviecon | undefined> {
    const [moviecon] = await db.select().from(moviecons).where(eq(moviecons.id, id));
    return moviecon;
  }

  async createMoviecon(moviecon: InsertMoviecon): Promise<Moviecon> {
    const [newMoviecon] = await db.insert(moviecons).values(moviecon).returning();
    return newMoviecon;
  }

  async updateMoviecon(id: string, updates: Partial<Moviecon>): Promise<Moviecon> {
    const [updatedMoviecon] = await db
      .update(moviecons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(moviecons.id, id))
      .returning();
    return updatedMoviecon;
  }

  async deleteMoviecon(id: string): Promise<void> {
    await db.delete(moviecons).where(eq(moviecons.id, id));
  }

  // Poll operations
  async getPolls(userId: string): Promise<(Poll & { author: User; votes: PollVote[]; totalVotes: number; userVote?: PollVote })[]> {
    const userPolls = await db
      .select({
        poll: polls,
        author: users,
      })
      .from(polls)
      .innerJoin(users, eq(polls.userId, users.id))
      .where(eq(polls.isActive, true))
      .orderBy(desc(polls.createdAt));

    // Optimize N+1: batch fetch all poll votes
    const pollIds = userPolls.map(({ poll }) => poll.id);
    const allVotes = pollIds.length > 0 ? await db.select().from(pollVotes).where(inArray(pollVotes.pollId, pollIds)) : [];

    // Group votes by pollId
    const votesByPoll = allVotes.reduce((acc, vote) => {
      if (!acc[vote.pollId]) acc[vote.pollId] = [];
      acc[vote.pollId].push(vote);
      return acc;
    }, {} as Record<string, any[]>);

    const pollsWithVotes = userPolls.map(({ poll, author }) => {
      const votes = votesByPoll[poll.id] || [];
      const userVote = votes.find(vote => vote.userId === userId);
      
      return {
        ...poll,
        author,
        votes,
        totalVotes: votes.length,
        userVote,
      };
    });

    return pollsWithVotes;
  }

  async getPollById(pollId: string): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId));
    return poll;
  }

  async createPoll(poll: InsertPoll): Promise<Poll> {
    const [newPoll] = await db.insert(polls).values(poll).returning();
    return newPoll;
  }

  async votePoll(vote: InsertPollVote): Promise<PollVote> {
    // First, check if user already voted on this poll
    const existingVote = await this.getUserPollVote(vote.pollId, vote.userId);
    if (existingVote) {
      // Update existing vote
      const [updatedVote] = await db
        .update(pollVotes)
        .set({ selectedOption: vote.selectedOption })
        .where(and(eq(pollVotes.pollId, vote.pollId), eq(pollVotes.userId, vote.userId)))
        .returning();
      return updatedVote;
    } else {
      // Create new vote
      const [newVote] = await db.insert(pollVotes).values(vote).returning();
      return newVote;
    }
  }

  async getUserPollVote(pollId: string, userId: string): Promise<PollVote | undefined> {
    const [vote] = await db
      .select()
      .from(pollVotes)
      .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId)));
    return vote;
  }

  async getPollResults(pollId: string): Promise<{ option: string; index: number; votes: number; percentage: number }[]> {
    const poll = await this.getPollById(pollId);
    if (!poll) return [];

    // Optimized: Single query aggregation instead of filtering in memory
    const voteCounts = await db
      .select({ 
        selectedOption: pollVotes.selectedOption, 
        count: sql<number>`count(*)` 
      })
      .from(pollVotes)
      .where(eq(pollVotes.pollId, pollId))
      .groupBy(pollVotes.selectedOption);
      
    const countMap = voteCounts.reduce((acc, item) => {
      acc[item.selectedOption] = Number(item.count);
      return acc;
    }, {} as Record<number, number>);
    
    const totalVoteCount = voteCounts.reduce((sum, item) => sum + Number(item.count), 0);

    const results = poll.options.map((option, index) => {
      const optionVotes = countMap[index] || 0;
      const percentage = totalVoteCount > 0 ? (optionVotes / totalVoteCount) * 100 : 0;
      
      return {
        option,
        index,
        votes: optionVotes,
        percentage: Math.round(percentage * 10) / 10,
      };
    });
    return results;
  }

  // Sponsored Ads operations
  async getAllAds(): Promise<SponsoredAd[]> {
    return await db.select().from(sponsoredAds).orderBy(desc(sponsoredAds.createdAt));
  }

  async createAd(adData: InsertSponsoredAd): Promise<SponsoredAd> {
    const [ad] = await db.insert(sponsoredAds).values(adData).returning();
    return ad;
  }

  async updateAd(id: string, adData: Partial<InsertSponsoredAd>): Promise<SponsoredAd> {
    const [ad] = await db
      .update(sponsoredAds)
      .set({ ...adData, updatedAt: new Date() })
      .where(eq(sponsoredAds.id, id))
      .returning();
    return ad;
  }

  async updateAdStatus(id: string, status: 'active' | 'paused'): Promise<SponsoredAd> {
    const [ad] = await db
      .update(sponsoredAds)
      .set({ status, updatedAt: new Date() })
      .where(eq(sponsoredAds.id, id))
      .returning();
    return ad;
  }

  async deleteAd(id: string): Promise<void> {
    await db.delete(sponsoredAds).where(eq(sponsoredAds.id, id));
  }

  async getTargetedAds(userId: string): Promise<SponsoredAd[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const userPrefs = await this.getUserAdPreferences(userId);
    if (userPrefs && !userPrefs.enableTargetedAds) {
      return [];
    }

    // Calculate user age if birthdate is available
    let userAge: number | undefined;
    if (user.birthdate) {
      const today = new Date();
      const birthDate = new Date(user.birthdate);
      userAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        userAge--;
      }
    }

    // Get all active ads
    const allAds = await db
      .select()
      .from(sponsoredAds)
      .where(
        and(
          eq(sponsoredAds.status, "active"),
          or(
            isNull(sponsoredAds.startDate),
            lte(sponsoredAds.startDate, new Date())
          ),
          or(
            isNull(sponsoredAds.endDate),
            gte(sponsoredAds.endDate, new Date())
          )
        )
      )
      .orderBy(desc(sponsoredAds.priority), desc(sponsoredAds.createdAt));

    // Filter ads based on user profile and preferences
    const targetedAds = allAds.filter(ad => {
      // Check blocked categories
      if (userPrefs?.blockedCategories?.includes(ad.category)) {
        return false;
      }

      let score = 0;

      // Age targeting (relaxed for testing - show ads even without user age)
      if (ad.targetAgeMin || ad.targetAgeMax) {
        if (userAge) {
          if (ad.targetAgeMin && userAge < ad.targetAgeMin) return false;
          if (ad.targetAgeMax && userAge > ad.targetAgeMax) return false;
          score += 2;
        } else {
          // If no user age, still show general audience ads (no strict filtering)
          score += 1;
        }
      }

      // Interest matching
      if (ad.targetInterests?.length && user.interests?.length) {
        const commonInterests = ad.targetInterests.filter(interest =>
          user.interests?.some(userInterest =>
            userInterest.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(userInterest.toLowerCase())
          )
        );
        if (commonInterests.length > 0) {
          score += commonInterests.length * 3;
        }
      }

      // Music genre matching
      if (ad.targetMusicGenres?.length && user.musicGenres?.length) {
        const commonGenres = ad.targetMusicGenres.filter(genre =>
          user.musicGenres?.some(userGenre =>
            userGenre.toLowerCase().includes(genre.toLowerCase()) ||
            genre.toLowerCase().includes(userGenre.toLowerCase())
          )
        );
        if (commonGenres.length > 0) {
          score += commonGenres.length * 2;
        }
      }

      // Hobby matching
      if (ad.targetHobbies?.length && user.hobbies?.length) {
        const commonHobbies = ad.targetHobbies.filter(hobby =>
          user.hobbies?.some(userHobby =>
            userHobby.toLowerCase().includes(hobby.toLowerCase()) ||
            hobby.toLowerCase().includes(userHobby.toLowerCase())
          )
        );
        if (commonHobbies.length > 0) {
          score += commonHobbies.length * 2;
        }
      }

      // Relationship status matching
      if (ad.targetRelationshipStatus?.length && user.relationshipStatus) {
        if (ad.targetRelationshipStatus.includes(user.relationshipStatus)) {
          score += 2;
        }
      }

      // Pet preferences matching
      if (ad.targetPetPreferences?.length && user.petPreferences) {
        if (ad.targetPetPreferences.includes(user.petPreferences)) {
          score += 1;
        }
      }

      // Lifestyle matching
      if (ad.targetLifestyle?.length && user.lifestyle) {
        if (ad.targetLifestyle.includes(user.lifestyle)) {
          score += 1;
        }
      }

      // Return ads with some targeting match or no targeting criteria
      return score > 0 || (
        !ad.targetInterests?.length &&
        !ad.targetMusicGenres?.length &&
        !ad.targetHobbies?.length &&
        !ad.targetRelationshipStatus?.length &&
        !ad.targetPetPreferences?.length &&
        !ad.targetLifestyle?.length &&
        !ad.targetAgeMin &&
        !ad.targetAgeMax
      );
    });

    // Limit ads per day based on user preferences
    const maxAdsPerDay = userPrefs?.maxAdsPerDay || 5;
    return targetedAds.slice(0, maxAdsPerDay);
  }

  async getAllActiveAds(): Promise<SponsoredAd[]> {
    return await db
      .select()
      .from(sponsoredAds)
      .where(eq(sponsoredAds.status, "active"))
      .orderBy(desc(sponsoredAds.priority), desc(sponsoredAds.createdAt));
  }

  async createSponsoredAd(ad: InsertSponsoredAd): Promise<SponsoredAd> {
    const [newAd] = await db.insert(sponsoredAds).values(ad).returning();
    return newAd;
  }

  async updateSponsoredAd(adId: string, updates: Partial<SponsoredAd>): Promise<SponsoredAd> {
    const [updatedAd] = await db
      .update(sponsoredAds)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sponsoredAds.id, adId))
      .returning();
    return updatedAd;
  }

  async deleteSponsoredAd(adId: string): Promise<void> {
    await db.delete(sponsoredAds).where(eq(sponsoredAds.id, adId));
  }

  async recordAdImpression(interaction: InsertAdInteraction): Promise<AdInteraction> {
    // Record the interaction
    const [newInteraction] = await db
      .insert(adInteractions)
      .values(interaction)
      .returning();

    // Update impression count on the ad
    await db
      .update(sponsoredAds)
      .set({
        impressions: sql`${sponsoredAds.impressions} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sponsoredAds.id, interaction.adId));

    return newInteraction;
  }

  async recordAdClick(interaction: InsertAdInteraction): Promise<AdInteraction> {
    // Record the interaction
    const [newInteraction] = await db
      .insert(adInteractions)
      .values(interaction)
      .returning();

    // Update click count on the ad
    await db
      .update(sponsoredAds)
      .set({
        clicks: sql`${sponsoredAds.clicks} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sponsoredAds.id, interaction.adId));

    return newInteraction;
  }

  async getUserAdPreferences(userId: string): Promise<UserAdPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userAdPreferences)
      .where(eq(userAdPreferences.userId, userId));
    return prefs;
  }

  async updateUserAdPreferences(userId: string, preferences: InsertUserAdPreferences): Promise<UserAdPreferences> {
    const [updatedPrefs] = await db
      .insert(userAdPreferences)
      .values({ ...preferences, userId })
      .onConflictDoUpdate({
        target: userAdPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return updatedPrefs;
  }

  async getAdAnalytics(adId: string): Promise<{ impressions: number; clicks: number; ctr: number }> {
    const [ad] = await db
      .select({
        impressions: sponsoredAds.impressions,
        clicks: sponsoredAds.clicks,
      })
      .from(sponsoredAds)
      .where(eq(sponsoredAds.id, adId));

    if (!ad) {
      return { impressions: 0, clicks: 0, ctr: 0 };
    }

    const ctr = (ad.impressions || 0) > 0 ? ((ad.clicks || 0) / (ad.impressions || 0)) * 100 : 0;
    return {
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
      ctr: Math.round(ctr * 100) / 100, // Round to 2 decimal places
    };
  }

  // Social media integration operations
  async getSocialCredentials(userId: string): Promise<SocialCredential[]> {
    return await db
      .select()
      .from(socialCredentials)
      .where(eq(socialCredentials.userId, userId))
      .orderBy(socialCredentials.platform);
  }

  async getSocialCredential(userId: string, platform: string): Promise<SocialCredential | undefined> {
    const [credential] = await db
      .select()
      .from(socialCredentials)
      .where(and(
        eq(socialCredentials.userId, userId),
        eq(socialCredentials.platform, platform)
      ));
    return credential;
  }

  async createSocialCredential(credential: InsertSocialCredential): Promise<SocialCredential> {
    const [newCredential] = await db
      .insert(socialCredentials)
      .values(credential)
      .returning();
    return newCredential;
  }

  async updateSocialCredential(id: string, updates: Partial<SocialCredential>): Promise<SocialCredential> {
    const [updatedCredential] = await db
      .update(socialCredentials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(socialCredentials.id, id))
      .returning();
    return updatedCredential;
  }

  async deleteSocialCredential(id: string): Promise<void> {
    await db
      .delete(socialCredentials)
      .where(eq(socialCredentials.id, id));
  }

  // External posts operations
  async getExternalPosts(userId: string): Promise<(ExternalPost & { socialCredential: SocialCredential })[]> {
    const postsData = await db
      .select({
        post: externalPosts,
        socialCredential: socialCredentials,
      })
      .from(externalPosts)
      .innerJoin(socialCredentials, eq(externalPosts.socialCredentialId, socialCredentials.id))
      .where(eq(socialCredentials.userId, userId))
      .orderBy(desc(externalPosts.platformCreatedAt))
      .limit(50); // Limit to recent posts

    return postsData.map(({ post, socialCredential }) => ({
      ...post,
      socialCredential,
    }));
  }

  async createExternalPost(post: InsertExternalPost): Promise<ExternalPost> {
    const [newPost] = await db
      .insert(externalPosts)
      .values(post)
      .returning();
    return newPost;
  }

  async createExternalPosts(posts: InsertExternalPost[]): Promise<ExternalPost[]> {
    if (posts.length === 0) return [];
    
    const newPosts = await db
      .insert(externalPosts)
      .values(posts)
      .returning();
    return newPosts;
  }

  async deleteOldExternalPosts(platform: string, keepDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    
    await db
      .delete(externalPosts)
      .where(and(
        eq(externalPosts.platform, platform),
        sql`${externalPosts.platformCreatedAt} < ${cutoffDate}`
      ));
  }

  // Password reset token methods
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({
        userId,
        token,
        expiresAt
      })
      .returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
  }

  // Password reset attempt tracking methods
  async getPasswordResetAttempts(userId: string): Promise<PasswordResetAttempt | undefined> {
    const [attempts] = await db
      .select()
      .from(passwordResetAttempts)
      .where(eq(passwordResetAttempts.userId, userId));
    return attempts;
  }

  async recordPasswordResetAttempt(userId: string): Promise<void> {
    const existing = await this.getPasswordResetAttempts(userId);
    
    if (existing) {
      // Increment attempt count
      await db
        .update(passwordResetAttempts)
        .set({ 
          attemptCount: existing.attemptCount + 1,
          lastAttemptAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(passwordResetAttempts.userId, userId));
    } else {
      // Create new attempt record
      await db
        .insert(passwordResetAttempts)
        .values({
          userId,
          attemptCount: 1,
          lastAttemptAt: new Date()
        });
    }
  }

  async lockPasswordReset(userId: string): Promise<void> {
    const lockUntil = new Date();
    lockUntil.setHours(lockUntil.getHours() + 24); // 24 hour lockout

    const existing = await this.getPasswordResetAttempts(userId);
    
    if (existing) {
      await db
        .update(passwordResetAttempts)
        .set({ 
          lockedUntil: lockUntil,
          updatedAt: new Date()
        })
        .where(eq(passwordResetAttempts.userId, userId));
    } else {
      await db
        .insert(passwordResetAttempts)
        .values({
          userId,
          attemptCount: 10, // Mark as locked with max attempts
          lastAttemptAt: new Date(),
          lockedUntil: lockUntil
        });
    }
  }

  async clearPasswordResetAttempts(userId: string): Promise<void> {
    await db
      .delete(passwordResetAttempts)
      .where(eq(passwordResetAttempts.userId, userId));
  }

  // Admin operations for customer service
  async getAllUsersForAdmin(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(users.firstName, users.lastName);
    // Don't decrypt data for the list view - only basic info needed
    return allUsers;
  }

  async getUserDetailsForAdmin(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;
    
    // Decrypt sensitive data for admin view
    const { decryptFromStorage } = await import('./cryptoService');
    
    // Decrypt password if it exists and isn't an old bcrypt hash
    if (user.password && !user.password.startsWith('$2b$')) {
      try {
        user.password = decryptFromStorage(user.password);
      } catch (error) {
        console.error("Error decrypting password for user", userId, error);
        user.password = "[Cannot decrypt - legacy data]";
      }
    } else if (user.password && user.password.startsWith('$2b$')) {
      user.password = "[Legacy hashed password - cannot view]";
    }
    
    // Decrypt security PIN if it exists
    if (user.securityPin) {
      try {
        if (user.securityPin.startsWith('$2b$')) {
          user.securityPin = "[Legacy hashed PIN - cannot view]";
        } else {
          user.securityPin = decryptFromStorage(user.securityPin);
        }
      } catch (error) {
        console.error("Error decrypting security PIN for user", userId, error);
        user.securityPin = "[Cannot decrypt - legacy data]";
      }
    }
    
    // Decrypt security answers if they exist
    if (user.securityAnswer1) {
      try {
        if (user.securityAnswer1.startsWith('$2b$')) {
          user.securityAnswer1 = "[Legacy hashed answer - user must re-enter]";
        } else {
          user.securityAnswer1 = decryptFromStorage(user.securityAnswer1);
        }
      } catch (error) {
        console.error("Error decrypting security answer 1 for user", userId, error);
        user.securityAnswer1 = "[Cannot decrypt - legacy data]";
      }
    }
    
    if (user.securityAnswer2) {
      try {
        if (user.securityAnswer2.startsWith('$2b$')) {
          user.securityAnswer2 = "[Legacy hashed answer - user must re-enter]";
        } else {
          user.securityAnswer2 = decryptFromStorage(user.securityAnswer2);
        }
      } catch (error) {
        console.error("Error decrypting security answer 2 for user", userId, error);
        user.securityAnswer2 = "[Cannot decrypt - legacy data]";
      }
    }
    
    if (user.securityAnswer3) {
      try {
        if (user.securityAnswer3.startsWith('$2b$')) {
          user.securityAnswer3 = "[Legacy hashed answer - user must re-enter]";
        } else {
          user.securityAnswer3 = decryptFromStorage(user.securityAnswer3);
        }
      } catch (error) {
        console.error("Error decrypting security answer 3 for user", userId, error);
        user.securityAnswer3 = "[Cannot decrypt - legacy data]";
      }
    }
    
    return user;
  }

  // Admin-specific methods
  async deleteUser(userId: string): Promise<void> {
    try {
      // Delete in order due to foreign key constraints
      await db.delete(birthdayMessages).where(eq(birthdayMessages.birthdayUserId, userId));
      await db.delete(birthdayMessages).where(eq(birthdayMessages.senderUserId, userId));
      await db.delete(callParticipants).where(eq(callParticipants.userId, userId));
      await db.delete(videoCalls).where(eq(videoCalls.initiatorId, userId));
      await db.delete(meetupCheckIns).where(eq(meetupCheckIns.userId, userId));
      await db.delete(meetups).where(eq(meetups.userId, userId));
      await db.delete(actionChatMessages).where(eq(actionChatMessages.userId, userId));
      await db.delete(actionViewers).where(eq(actionViewers.userId, userId));
      await db.delete(actions).where(eq(actions.userId, userId));
      await db.delete(eventReminders).where(eq(eventReminders.userId, userId));
      await db.delete(eventAttendees).where(eq(eventAttendees.userId, userId));
      await db.delete(events).where(eq(events.userId, userId));
      await db.delete(messages).where(eq(messages.senderId, userId));
      await db.delete(conversations).where(eq(conversations.user1Id, userId));
      await db.delete(conversations).where(eq(conversations.user2Id, userId));
      await db.delete(contentFilters).where(eq(contentFilters.userId, userId));
      await db.delete(postLikes).where(eq(postLikes.userId, userId));
      await db.delete(comments).where(eq(comments.userId, userId));
      await db.delete(storyViews).where(eq(storyViews.userId, userId));
      await db.delete(stories).where(eq(stories.userId, userId));
      await db.delete(posts).where(eq(posts.userId, userId));
      await db.delete(friendships).where(eq(friendships.userId, userId));
      await db.delete(friendships).where(eq(friendships.friendId, userId));
      await db.delete(userThemes).where(eq(userThemes.userId, userId));
      await db.delete(socialCredentials).where(eq(socialCredentials.userId, userId));
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }


  async checkAndUnsuspendExpiredUsers(): Promise<number> {
    try {
      const now = new Date();
      
      // Find all suspended users whose suspension has expired
      const expiredSuspensions = await db.select()
        .from(users)
        .where(
          and(
            eq(users.isSuspended, true),
            isNotNull(users.suspensionExpiresAt),
            sql`${users.suspensionExpiresAt} <= ${now}`
          )
        );

      if (expiredSuspensions.length === 0) {
        return 0;
      }

      // Unsuspend all expired users
      const userIds = expiredSuspensions.map(user => user.id);
      for (const userId of userIds) {
        await db.update(users)
          .set({
            isSuspended: false,
            suspensionType: null,
            suspendedAt: null,
            suspensionExpiresAt: null,
            updatedAt: now
          })
          .where(eq(users.id, userId));
      }

      console.log(`Auto-unsuspended ${expiredSuspensions.length} users whose suspension periods have expired`);
      return expiredSuspensions.length;
    } catch (error) {
      console.error("Error checking and unsuspending expired users:", error);
      return 0;
    }
  }

  async getAnalytics(): Promise<any> {
    try {
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
      const postsToday = await db.select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(sql`DATE(${posts.createdAt}) = CURRENT_DATE`);
      const activeStories = await db.select({ count: sql<number>`count(*)` })
        .from(stories)
        .where(sql`${stories.expiresAt} > NOW()`);

      return {
        totalUsers: totalUsers[0]?.count || 0,
        activeToday: 0, // Would need session tracking to implement
        postsToday: postsToday[0]?.count || 0,
        storiesActive: activeStories[0]?.count || 0
      };
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return {
        totalUsers: 0,
        activeToday: 0,
        postsToday: 0,
        storiesActive: 0
      };
    }
  }

  // Smart Friend Ranking Intelligence methods
  async getUserInteractionAnalytics(userId: string, friendId: string): Promise<UserInteractionAnalytics | undefined> {
    const [analytics] = await db
      .select()
      .from(userInteractionAnalytics)
      .where(
        and(
          eq(userInteractionAnalytics.userId, userId),
          eq(userInteractionAnalytics.friendId, friendId)
        )
      );
    return analytics;
  }

  async getFriendRankingSuggestion(suggestionId: string, userId: string): Promise<FriendRankingSuggestion | undefined> {
    const [suggestion] = await db
      .select()
      .from(friendRankingSuggestions)
      .where(
        and(
          eq(friendRankingSuggestions.id, suggestionId),
          eq(friendRankingSuggestions.userId, userId)
        )
      );
    return suggestion;
  }

  async updateRankingSuggestionStatus(suggestionId: string, status: string): Promise<void> {
    await db
      .update(friendRankingSuggestions)
      .set({ 
        status,
        actionTakenAt: new Date(),
        isViewed: true,
        viewedAt: new Date()
      })
      .where(eq(friendRankingSuggestions.id, suggestionId));
  }

  async updateFriendshipRank(userId: string, friendId: string, rank: number): Promise<void> {
    await db
      .update(friendships)
      .set({ 
        rank,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(friendships.userId, userId),
          eq(friendships.friendId, friendId)
        )
      );
  }

  async getActiveUsersForRankingAnalysis(): Promise<User[]> {
    // Get users who have been active in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return await db
      .select()
      .from(users)
      .where(
        and(
          gte(users.updatedAt, thirtyDaysAgo),
          isNull(users.suspendedAt) // Not suspended
        )
      )
      .limit(100); // Limit for performance
  }

  async getUserFriendships(userId: string): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(eq(friendships.userId, userId))
      .orderBy(asc(friendships.rank));
  }

  // Report operations
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db
      .insert(rulesReports)
      .values(report)
      .returning();
    return newReport;
  }

  async getReports(filters: { status?: string; page?: number; limit?: number }): Promise<Report[]> {
    const { status, page = 1, limit = 20 } = filters;
    let query = db
      .select({
        id: rulesReports.id,
        reportedBy: rulesReports.reportedBy,
        postId: rulesReports.postId,
        postAuthorId: rulesReports.postAuthorId,
        reason: rulesReports.reason,
        description: rulesReports.description,
        status: rulesReports.status,
        reviewedBy: rulesReports.reviewedBy,
        reviewedAt: rulesReports.reviewedAt,
        adminNotes: rulesReports.adminNotes,
        actionTaken: rulesReports.actionTaken,
        createdAt: rulesReports.createdAt,
        updatedAt: rulesReports.updatedAt,
        reporter: users,
        post: posts,
        postAuthor: sql<User>`NULL`.as('postAuthor')
      })
      .from(rulesReports)
      .leftJoin(users, eq(rulesReports.reportedBy, users.id))
      .leftJoin(posts, eq(rulesReports.postId, posts.id))
      .orderBy(desc(rulesReports.createdAt));

    if (status) {
      query = query.where(eq(rulesReports.status, status as any));
    }

    const offset = (page - 1) * limit;
    return await query.limit(limit).offset(offset);
  }

  async updateReport(reportId: string, updates: Partial<Report>): Promise<Report> {
    const [updatedReport] = await db
      .update(rulesReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rulesReports.id, reportId))
      .returning();
    return updatedReport;
  }

  async suspendUser(userId: string, suspensionData: { suspensionType: string; suspendedAt: string; suspensionExpiresAt: string | null }): Promise<void> {
    await db
      .update(users)
      .set({
        isSuspended: true,
        suspensionType: suspensionData.suspensionType,
        suspendedAt: new Date(suspensionData.suspendedAt),
        suspensionExpiresAt: suspensionData.suspensionExpiresAt ? new Date(suspensionData.suspensionExpiresAt) : null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Mood Boost Posts operations
  async getMoodBoostPostsForUser(userId: string): Promise<MoodBoostPost[]> {
    const now = new Date();
    const posts = await db
      .select()
      .from(moodBoostPosts)
      .where(
        and(
          eq(moodBoostPosts.userId, userId),
          lte(moodBoostPosts.createdAt, now), // Only show posts whose release time has arrived
          gt(moodBoostPosts.expiresAt, now) // Only get non-expired posts
        )
      )
      .orderBy(desc(moodBoostPosts.createdAt));
    return posts;
  }
}

export const storage = new DatabaseStorage();
