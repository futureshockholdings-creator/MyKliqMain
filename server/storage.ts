import {
  users,
  userThemes,
  friendships,
  usedInviteCodes,
  kliqRemovals,
  referralBonuses,
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
  groupConversations,
  conversationParticipants,
  events,
  eventAttendees,
  eventReminders,
  calendarNotes,
  actions,
  actionViewers,
  actionChatMessages,
  actionLikes,
  actionComments,
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
  type GroupConversation,
  type InsertGroupConversation,
  type ConversationParticipant,
  type InsertConversationParticipant,
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
  userSportsPreferences,
  type UserSportsPreference,
  type InsertUserSportsPreference,
  deviceTokens,
  type DeviceToken,
  type InsertDeviceToken,
  profileBorders,
  kliqKoins,
  kliqKoinTransactions,
  loginStreaks,
  userBorders,
  type ProfileBorder,
  type InsertProfileBorder,
  type KliqKoin,
  type InsertKliqKoin,
  type KliqKoinTransaction,
  type InsertKliqKoinTransaction,
  type LoginStreak,
  type InsertLoginStreak,
  type UserBorder,
  type InsertUserBorder,
  type ReferralBonus,
  type InsertReferralBonus,
  educationalPosts,
  type EducationalPost,
  type InsertEducationalPost,
  notifications,
  notificationPreferences,
  contentEngagements,
  socialConnectionRewards,
  sessions,
  adminBroadcasts,
  type AdminBroadcast,
  type InsertAdminBroadcast,
  postMedia,
  type PostMedia,
  type InsertPostMedia,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray, like, or, asc, lt, gt, lte, gte, count, countDistinct, not, isNull, isNotNull } from "drizzle-orm";
import { FeedCurationIntelligence } from './feedCurationIntelligence';
import { cacheService } from './cacheService';
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
  getFollowers(userId: string): Promise<(Friendship & { follower: User })[]>;
  getPendingJoinRequests(userId: string): Promise<(Friendship & { friend: User })[]>;
  addFriend(friendship: InsertFriendship): Promise<Friendship>;
  updateFriendRank(userId: string, friendId: string, rank: number): Promise<void>;
  acceptFriendship(userId: string, friendId: string): Promise<void>;
  declineFriendship(userId: string, friendId: string): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  leaveKliq(userId: string): Promise<void>;
  
  // Kliq removal tracking (for pending rejoin approval)
  wasUserRemovedFromKliq(kliqOwnerId: string, userId: string): Promise<boolean>;
  addKliqRemoval(kliqOwnerId: string, removedUserId: string): Promise<void>;
  removeKliqRemoval(kliqOwnerId: string, removedUserId: string): Promise<void>;
  
  // Post operations
  getPosts(userId: string, filters: string[]): Promise<(Omit<Post, 'likes'> & { author: User; likes: PostLike[]; comments: (Comment & { author: User })[] })[]>;
  getPostById(postId: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  createPostWithMedia(post: InsertPost, mediaItems: { url: string; type: "image" | "video" }[]): Promise<Post & { media: PostMedia[] }>;
  getPostMedia(postId: string): Promise<PostMedia[]>;
  addPostMedia(postId: string, mediaItems: { url: string; type: "image" | "video" }[]): Promise<PostMedia[]>;
  updatePost(postId: string, updates: Partial<Pick<Post, 'content' | 'videoThumbnailUrl'>>): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  getUserReflection(userId: string): Promise<{ posts: any[]; stats: any; message: string }>;
  getUserPostCount(userId: string): Promise<number>;
  
  // Feed operations
  getKliqFeed(userId: string, filters: string[], page?: number, limit?: number, includeEducationalPosts?: boolean): Promise<{ items: any[], hasMore: boolean, totalPages: number } | any[]>;
  
  // Story operations
  getActiveStories(userId: string): Promise<(Story & { author: User; viewCount: number; hasViewed: boolean })[]>;
  createStory(story: InsertStory): Promise<Story>;
  viewStory(storyId: string, userId: string): Promise<void>;
  deleteExpiredStories(): Promise<void>;
  
  // Comment operations
  addComment(comment: InsertComment): Promise<Comment>;
  getCommentById(commentId: string): Promise<Comment | undefined>;
  updateComment(commentId: string, updates: Partial<Pick<Comment, 'content'>>): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;
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
  deleteMessage(messageId: string, userId: string): Promise<boolean>;
  deleteExpiredMessages(): Promise<void>;
  deleteOldConversations(): Promise<void>;
  deleteConversation(userId: string, otherUserId: string): Promise<void>;
  
  // Group chat operations
  createGroupConversation(data: { name?: string; creatorId: string; participantIds: string[] }): Promise<GroupConversation>;
  getGroupConversations(userId: string): Promise<(GroupConversation & { participants: User[]; lastMessage?: Message; unreadCount: number })[]>;
  getGroupConversation(groupId: string, userId: string): Promise<(GroupConversation & { participants: User[]; messages: (Message & { sender: User })[] }) | undefined>;
  getAllGroupParticipantIds(groupId: string): Promise<string[]>;
  addParticipantToGroup(groupId: string, userId: string): Promise<void>;
  removeParticipantFromGroup(groupId: string, userId: string): Promise<void>;
  sendGroupMessage(message: InsertMessage): Promise<Message>;
  deleteGroupConversation(groupId: string): Promise<void>;
  
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
  getActionById(actionId: string): Promise<(Action & { author?: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; kliqName: string | null } }) | undefined>;
  getUserRecordings(userId: string): Promise<(Action & { author: User })[]>;
  enforceRecordingLimit(userId: string, maxRecordings: number): Promise<void>;
  createAction(action: InsertAction): Promise<Action>;
  updateAction(actionId: string, updates: Partial<Action>): Promise<Action>;
  endAction(actionId: string): Promise<Action>;
  deleteAction(actionId: string): Promise<void>;
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

  // Sports preferences operations
  getUserSportsPreferences(userId: string): Promise<UserSportsPreference[]>;
  createUserSportsPreference(preference: InsertUserSportsPreference): Promise<UserSportsPreference>;
  deleteUserSportsPreference(preferenceId: string): Promise<void>;
  deleteUserSportsPreferences(userId: string): Promise<void>;

  // Device token operations for push notifications
  registerDeviceToken(tokenData: InsertDeviceToken): Promise<DeviceToken>;
  getDeviceTokensByUser(userId: string): Promise<DeviceToken[]>;
  deactivateDeviceToken(token: string): Promise<void>;
  deactivateAllUserDeviceTokens(userId: string): Promise<void>;
  unregisterDeviceToken(userId: string, token: string): Promise<void>;

  // Notification preferences operations
  getNotificationPreferences(userId: string): Promise<NotificationPreference | undefined>;
  createNotificationPreferences(preferences: InsertNotificationPreference): Promise<NotificationPreference>;
  updateNotificationPreferences(userId: string, updates: Partial<InsertNotificationPreference>): Promise<NotificationPreference>;

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
  saveCommentToScrapbook(save: InsertScrapbookSave): Promise<ScrapbookSave>;
  unsaveCommentFromScrapbook(userId: string, commentId: string): Promise<void>;
  getUserScrapbookSaves(userId: string, albumId?: string): Promise<(ScrapbookSave & { post: Post & { author: User } })[]>;
  updateScrapbookSaveNote(saveId: string, note: string): Promise<ScrapbookSave>;
  getScrapbookSaveCount(userId: string): Promise<number>;
  isPostSavedByUser(userId: string, postId: string): Promise<boolean>;
  isCommentSavedByUser(userId: string, commentId: string): Promise<boolean>;

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
  deletePoll(pollId: string): Promise<void>;

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
  getReports(filters: { status?: string; page?: number; limit?: number }): Promise<any[]>;
  updateReport(reportId: string, updates: Partial<Report>): Promise<Report>;
  suspendUser(userId: string, suspensionData: { suspensionType: string; suspendedAt: string; suspensionExpiresAt: string | null }): Promise<void>;

  // Mood Boost Posts operations
  getMoodBoostPostsForUser(userId: string): Promise<MoodBoostPost[]>;

  // Kliq Koin operations
  getUserKoins(userId: string): Promise<KliqKoin | undefined>;
  initializeUserKoins(userId: string): Promise<KliqKoin>;
  awardKoins(userId: string, amount: number, source: string, referenceId?: string): Promise<KliqKoin>;
  spendKoins(userId: string, amount: number, source: string, referenceId?: string): Promise<KliqKoin>;
  getKoinTransactions(userId: string, limit?: number): Promise<KliqKoinTransaction[]>;
  
  // Login Streak operations
  getUserStreak(userId: string): Promise<LoginStreak | undefined>;
  initializeUserStreak(userId: string): Promise<LoginStreak>;
  processLogin(userId: string): Promise<{ streak: LoginStreak; koinsAwarded: number; tierUnlocked?: ProfileBorder }>;
  restoreStreak(userId: string): Promise<LoginStreak>;
  
  // Profile Border operations
  getAllBorders(): Promise<ProfileBorder[]>;
  getStreakRewardBorders(): Promise<ProfileBorder[]>;
  getPurchasableBorders(): Promise<ProfileBorder[]>;
  getBorderById(borderId: string): Promise<ProfileBorder | undefined>;
  getUserBorders(userId: string): Promise<(UserBorder & { border: ProfileBorder })[]>;
  getEquippedBorder(userId: string): Promise<(UserBorder & { border: ProfileBorder }) | undefined>;
  purchaseBorder(userId: string, borderId: string): Promise<UserBorder>;
  equipBorder(userId: string, borderId: string): Promise<void>;
  unlockStreakBorder(userId: string, tier: number): Promise<UserBorder | undefined>;
  
  // Educational Posts operations
  getEducationalPosts(limit?: number): Promise<EducationalPost[]>;
  getRandomEducationalPosts(count: number, excludeIds?: string[]): Promise<EducationalPost[]>;
  createEducationalPost(post: InsertEducationalPost): Promise<EducationalPost>;

  // Admin Broadcast operations
  createBroadcast(broadcast: InsertAdminBroadcast): Promise<AdminBroadcast>;
  getBroadcasts(limit?: number): Promise<AdminBroadcast[]>;
  getBroadcastById(broadcastId: string): Promise<AdminBroadcast | undefined>;
  updateBroadcast(broadcastId: string, updates: Partial<AdminBroadcast>): Promise<AdminBroadcast>;
  deleteBroadcast(broadcastId: string): Promise<void>;
  getAllActiveDeviceTokens(): Promise<DeviceToken[]>;
  getActiveDeviceTokensByAudience(audience: string): Promise<DeviceToken[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const results = await db
      .select({
        user: users,
        equippedBorder: profileBorders,
      })
      .from(users)
      .leftJoin(
        userBorders,
        and(
          eq(userBorders.userId, users.id),
          eq(userBorders.isEquipped, true)
        )
      )
      .leftJoin(profileBorders, eq(userBorders.borderId, profileBorders.id))
      .where(eq(users.id, id));

    if (!results[0]) return undefined;

    return {
      ...results[0].user,
      equippedBorder: results[0].equippedBorder || undefined,
    } as any;
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

  async getFollowers(userId: string): Promise<(Friendship & { follower: User })[]> {
    // Get users who have this userId in THEIR kliq (reverse of getFriends)
    const followers = await db
      .select({
        id: friendships.id,
        userId: friendships.userId,
        friendId: friendships.friendId,
        rank: friendships.rank,
        status: friendships.status,
        createdAt: friendships.createdAt,
        updatedAt: friendships.updatedAt,
        follower: users,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.userId, users.id))
      .where(and(eq(friendships.friendId, userId), eq(friendships.status, "accepted")));
    
    return followers;
  }

  async getPendingJoinRequests(userId: string): Promise<(Friendship & { friend: User })[]> {
    // Get pending join requests for this kliq owner (users waiting for approval)
    const pending = await db
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
      .where(and(eq(friendships.userId, userId), eq(friendships.status, "pending")))
      .orderBy(desc(friendships.createdAt));
    
    return pending;
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
    
    // Remove from kliq removals if they were previously removed (allow clean slate)
    await this.removeKliqRemoval(userId, friendId);
  }

  async declineFriendship(userId: string, friendId: string): Promise<void> {
    await db
      .delete(friendships)
      .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)));
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    // Track this removal so future rejoins require approval
    await this.addKliqRemoval(userId, friendId);
    
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

  // Kliq removal tracking
  async wasUserRemovedFromKliq(kliqOwnerId: string, userId: string): Promise<boolean> {
    const [removal] = await db
      .select()
      .from(kliqRemovals)
      .where(and(
        eq(kliqRemovals.kliqOwnerId, kliqOwnerId),
        eq(kliqRemovals.removedUserId, userId)
      ));
    return !!removal;
  }

  async addKliqRemoval(kliqOwnerId: string, removedUserId: string): Promise<void> {
    // Check if already exists to avoid duplicates
    const exists = await this.wasUserRemovedFromKliq(kliqOwnerId, removedUserId);
    if (!exists) {
      await db.insert(kliqRemovals).values({
        kliqOwnerId,
        removedUserId,
      });
    }
  }

  async removeKliqRemoval(kliqOwnerId: string, removedUserId: string): Promise<void> {
    await db
      .delete(kliqRemovals)
      .where(and(
        eq(kliqRemovals.kliqOwnerId, kliqOwnerId),
        eq(kliqRemovals.removedUserId, removedUserId)
      ));
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
        sharedFromPostId: posts.sharedFromPostId,
        originalAuthorId: posts.originalAuthorId,
        postType: posts.postType,
        videoThumbnailUrl: posts.videoThumbnailUrl,
        author: users,
        authorBorder: profileBorders,
        gif: gifs,
        meme: memes,
        moviecon: moviecons,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .leftJoin(profileBorders, eq(users.equippedBorderId, profileBorders.id))
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
    
    const [allLikes, allComments, allMedia] = await Promise.all([
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
          authorBorder: profileBorders,
          gif: gifs,
          meme: memes,
          moviecon: moviecons,
          likes_count: sql<number>`COALESCE(COUNT(${commentLikes.id}), 0)`.as('likes_count'),
        })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .leftJoin(profileBorders, eq(users.equippedBorderId, profileBorders.id))
        .leftJoin(gifs, eq(comments.gifId, gifs.id))
        .leftJoin(memes, eq(comments.memeId, memes.id))
        .leftJoin(moviecons, eq(comments.movieconId, moviecons.id))
        .leftJoin(commentLikes, eq(comments.id, commentLikes.commentId))
        .where(inArray(comments.postId, postIds))
        .groupBy(comments.id, users.id, profileBorders.id, gifs.id, memes.id, moviecons.id)
        .orderBy(comments.createdAt) : [] as any[],
      // Batch fetch all post media for multi-image posts
      postIds.length > 0 ? db
        .select()
        .from(postMedia)
        .where(inArray(postMedia.postId, postIds))
        .orderBy(asc(postMedia.displayOrder)) : [] as any[]
    ]);

    // Group likes, comments, and media by postId for O(1) lookup
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

    const mediaByPost = allMedia.reduce((acc, media: any) => {
      if (!acc[media.postId]) acc[media.postId] = [];
      acc[media.postId].push(media);
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
      sharedFromPostId: post.sharedFromPostId,
      originalAuthorId: post.originalAuthorId,
      postType: post.postType,
      videoThumbnailUrl: post.videoThumbnailUrl,
      author: post.author,
      authorBorder: post.authorBorder,
      comments: commentsByPost[post.id] || [],
      media: mediaByPost[post.id] || [],
    }));

    return postsWithDetails;
  }

  // Get paginated aggregated kliq feed including posts, polls, events, and actions with intelligent curation
  async getKliqFeed(userId: string, filters: string[], page = 1, limit = 100, includeEducationalPosts = false): Promise<{ items: any[], hasMore: boolean, totalPages: number }> {
    // Get user's friends first
    const userFriends = await this.getFriends(userId);
    const friendIds = userFriends.map(f => f.friendId);
    friendIds.push(userId); // Include user's own content

    const feedItems: any[] = [];
    
    // Educational posts: Show 1-2 randomly selected posts for users <7 days old
    // Rate limited to every 6 hours (max 4 times per day)
    let educationalPostsToAdd: any[] = [];
    if (includeEducationalPosts && page === 1) {
      // Check 6-hour rate limit
      const sixHoursInMs = 6 * 60 * 60 * 1000;
      const lastViewCacheKey = `edu-posts-last-view:${userId}`;
      const lastViewTime = await cacheService.get<number>(lastViewCacheKey);
      const now = Date.now();
      const shouldShowEducationalPosts = !lastViewTime || (now - lastViewTime) >= sixHoursInMs;
      
      if (shouldShowEducationalPosts) {
        // Update last view time in cache (expires in 7 days)
        await cacheService.set(lastViewCacheKey, now, 7 * 24 * 60 * 60);
        
        // Get 1-2 random educational posts
        const educationalPosts = await this.getRandomEducationalPosts(2);
        
        educationalPostsToAdd = educationalPosts.map(eduPost => ({
        id: `edu_${eduPost.id}`,
        type: 'educational',
        title: eduPost.title,
        content: eduPost.content,
        featureName: eduPost.featureName,
        icon: eduPost.icon,
        accentColor: eduPost.accentColor,
        createdAt: eduPost.createdAt,
        activityDate: eduPost.createdAt,
        userId: 'system',
        author: {
          id: 'system',
          firstName: 'MyKliq',
          lastName: 'Tips',
          profileImageUrl: null,
          kliqName: null,
        },
        likes: [],
        comments: [],
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
      }));
      }
    }

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
            authorBorder: profileBorders,
          })
          .from(polls)
          .innerJoin(users, eq(polls.userId, users.id))
          .leftJoin(profileBorders, eq(users.equippedBorderId, profileBorders.id))
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
          recordingUrl: actions.recordingUrl,
          recordingDuration: actions.recordingDuration,
          isHighlighted: actions.isHighlighted,
          createdAt: actions.createdAt,
          authorId: users.id,
          authorFirstName: users.firstName,
          authorLastName: users.lastName,
          authorProfileImageUrl: users.profileImageUrl,
          authorKliqName: users.kliqName,
          authorBorder: profileBorders,
        })
        .from(actions)
        .innerJoin(users, eq(actions.userId, users.id))
        .leftJoin(profileBorders, eq(users.equippedBorderId, profileBorders.id))
        .where(inArray(actions.userId, friendIds))
        .orderBy(desc(actions.createdAt))
        .limit(50) : [];
      
      // Get likes for all actions
      const actionIds = actionsData.map(a => a.id);
      const allActionLikes = actionIds.length > 0 ? await db
        .select({
          actionId: actionLikes.actionId,
          userId: actionLikes.userId,
        })
        .from(actionLikes)
        .where(inArray(actionLikes.actionId, actionIds)) : [];
      
      const actionLikesByAction: Record<string, { userId: string }[]> = {};
      allActionLikes.forEach(like => {
        if (!actionLikesByAction[like.actionId]) {
          actionLikesByAction[like.actionId] = [];
        }
        actionLikesByAction[like.actionId].push({ userId: like.userId });
      });
      
      // Get comment counts for all actions
      const allActionComments = actionIds.length > 0 ? await db
        .select({
          actionId: actionComments.actionId,
        })
        .from(actionComments)
        .where(inArray(actionComments.actionId, actionIds)) : [];
      
      const actionCommentCounts: Record<string, number> = {};
      allActionComments.forEach(comment => {
        actionCommentCounts[comment.actionId] = (actionCommentCounts[comment.actionId] || 0) + 1;
      });

      console.log(`Feed: Got ${postsData.length} posts, ${eventsData.length} events, ${pollsData.length} polls, ${actionsData.length} actions`);
      
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
        authorBorder: poll.authorBorder,
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
        recordingUrl: action.recordingUrl,
        recordingDuration: action.recordingDuration,
        isHighlighted: action.isHighlighted || false,
        likes: actionLikesByAction[action.id] || [],
        commentCount: actionCommentCounts[action.id] || 0,
        activityDate: action.createdAt,
        createdAt: action.createdAt,
        author: {
          id: action.authorId,
          firstName: action.authorFirstName,
          lastName: action.authorLastName,
          profileImageUrl: action.authorProfileImageUrl,
          kliqName: action.authorKliqName,
        },
        authorBorder: action.authorBorder ? {
          imageUrl: action.authorBorder.imageUrl,
          name: action.authorBorder.name,
        } : undefined,
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

    // Inject educational posts (1-2 random posts every 6 hours)
    if (educationalPostsToAdd.length > 0) {
      feedItems.push(...educationalPostsToAdd);
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

  async createPostWithMedia(post: InsertPost, mediaItems: { url: string; type: "image" | "video" }[]): Promise<Post & { media: PostMedia[] }> {
    const [newPost] = await db.insert(posts).values(post).returning();
    
    let media: PostMedia[] = [];
    if (mediaItems.length > 0) {
      media = await this.addPostMedia(newPost.id, mediaItems);
    }
    
    return { ...newPost, media };
  }

  async getPostMedia(postId: string): Promise<PostMedia[]> {
    return await db
      .select()
      .from(postMedia)
      .where(eq(postMedia.postId, postId))
      .orderBy(asc(postMedia.displayOrder));
  }

  async addPostMedia(postId: string, mediaItems: { url: string; type: "image" | "video" }[]): Promise<PostMedia[]> {
    if (mediaItems.length === 0) return [];
    
    const mediaToInsert = mediaItems.map((item, index) => ({
      postId,
      mediaUrl: item.url,
      mediaType: item.type as "image" | "video",
      displayOrder: index,
    }));
    
    return await db.insert(postMedia).values(mediaToInsert).returning();
  }

  async updatePost(postId: string, updates: Partial<Pick<Post, 'content' | 'videoThumbnailUrl'>>): Promise<Post> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, postId))
      .returning();
    return updatedPost;
  }

  async deletePost(postId: string): Promise<void> {
    // Delete associated data first (comments, likes, media)
    await db.delete(commentLikes).where(
      sql`${commentLikes.commentId} IN (SELECT ${comments.id} FROM ${comments} WHERE ${comments.postId} = ${postId})`
    );
    await db.delete(comments).where(eq(comments.postId, postId));
    await db.delete(postLikes).where(eq(postLikes.postId, postId));
    await db.delete(postMedia).where(eq(postMedia.postId, postId));
    
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

  async getUserPostCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.userId, userId));
    
    return result[0]?.count || 0;
  }

  async getUserUniqueLikeCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: countDistinct(postLikes.postId) })
      .from(postLikes)
      .innerJoin(posts, eq(postLikes.postId, posts.id))
      .where(
        and(
          eq(postLikes.userId, userId),
          not(eq(posts.userId, userId))
        )
      );
    
    return result[0]?.count || 0;
  }

  async getUserMoodUpdateCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(posts)
      .where(
        and(
          eq(posts.userId, userId),
          isNotNull(posts.mood),
          not(eq(posts.mood, ''))
        )
      );
    
    return result[0]?.count || 0;
  }

  async getUserHoroscopePostCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(posts)
      .where(
        and(
          eq(posts.userId, userId),
          or(
            eq(posts.postType, 'horoscope'),
            like(posts.content, '🔮 My Daily Horoscope%')
          )
        )
      );
    
    return result[0]?.count || 0;
  }

  async getUserBibleVersePostCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(posts)
      .where(
        and(
          eq(posts.userId, userId),
          or(
            eq(posts.postType, 'bible_verse'),
            like(posts.content, '📖 Daily Bible Verse 📖%')
          )
        )
      );
    
    return result[0]?.count || 0;
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

  async updateComment(commentId: string, updates: Partial<Pick<Comment, 'content'>>): Promise<Comment> {
    const [updatedComment] = await db
      .update(comments)
      .set(updates)
      .where(eq(comments.id, commentId))
      .returning();
    if (!updatedComment) {
      throw new Error('Failed to update comment');
    }
    return updatedComment as Comment;
  }

  async deleteComment(commentId: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, commentId));
  }

  async getCommentsByPostId(postId: string, userId: string): Promise<any[]> {
    // Get all comments for the post with author info
    const postComments = await db
      .select({
        comment: comments,
        author: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    // Get all comment likes for this post
    const commentIds = postComments.map(pc => pc.comment.id);
    const allLikes = commentIds.length > 0
      ? await db
          .select()
          .from(commentLikes)
          .where(sql`${commentLikes.commentId} IN ${commentIds}`)
      : [];

    // Map comments with like counts and user liked status
    return postComments.map(({ comment, author }) => {
      const commentLikesForThis = allLikes.filter(like => like.commentId === comment.id);
      const likes_count = commentLikesForThis.length;
      const user_liked = commentLikesForThis.some(like => like.userId === userId);

      return {
        ...comment,
        author,
        likes_count,
        user_liked,
      };
    });
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
    // Case-insensitive lookup to handle user input variations
    const [user] = await db.select().from(users).where(
      sql`LOWER(${users.inviteCode}) = LOWER(${inviteCode})`
    );
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

  // Referral Bonus operations
  async createReferralBonus(data: InsertReferralBonus): Promise<ReferralBonus> {
    const [bonus] = await db.insert(referralBonuses).values(data).returning();
    return bonus;
  }

  async getReferralBonusesByInviter(inviterId: string): Promise<ReferralBonus[]> {
    return await db.select().from(referralBonuses).where(eq(referralBonuses.inviterId, inviterId));
  }

  async getReferralBonusesByInvitee(inviteeId: string): Promise<ReferralBonus[]> {
    return await db.select().from(referralBonuses).where(eq(referralBonuses.inviteeId, inviteeId));
  }

  async updateReferralBonusFirstLogin(inviteeId: string): Promise<void> {
    await db.update(referralBonuses)
      .set({ firstLoginAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(referralBonuses.inviteeId, inviteeId),
          eq(referralBonuses.status, 'pending'),
          sql`${referralBonuses.firstLoginAt} IS NULL`
        )
      );
  }

  async getEligibleReferralBonuses(): Promise<ReferralBonus[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return await db.select()
      .from(referralBonuses)
      .where(
        and(
          eq(referralBonuses.status, 'pending'),
          sql`${referralBonuses.firstLoginAt} IS NOT NULL`,
          sql`${referralBonuses.signupAt} <= ${twentyFourHoursAgo}`
        )
      );
  }

  async awardReferralBonus(bonusId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get the bonus details
      const [bonus] = await tx.select()
        .from(referralBonuses)
        .where(eq(referralBonuses.id, bonusId));
      
      if (!bonus || bonus.status !== 'pending') {
        return;
      }

      // Award Koins to inviter atomically within the same transaction
      let userKoins = await this.getUserKoins(bonus.inviterId);
      if (!userKoins) {
        userKoins = await this.initializeUserKoins(bonus.inviterId);
      }

      const newBalance = parseFloat(userKoins.balance as any) + bonus.koinsAwarded;
      const newTotalEarned = parseFloat(userKoins.totalEarned as any) + bonus.koinsAwarded;

      await tx
        .update(kliqKoins)
        .set({ 
          balance: newBalance, 
          totalEarned: newTotalEarned,
          updatedAt: new Date() 
        })
        .where(eq(kliqKoins.userId, bonus.inviterId));

      await tx.insert(kliqKoinTransactions).values({
        userId: bonus.inviterId,
        amount: bonus.koinsAwarded,
        type: 'earned',
        source: 'referral_bonus',
        referenceId: bonusId,
        balanceAfter: newBalance,
      });

      // Mark bonus as completed
      await tx.update(referralBonuses)
        .set({ 
          status: 'completed',
          awardedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(referralBonuses.id, bonusId));
    });
  }

  async getReferralStats(userId: string): Promise<{
    totalReferred: number;
    pendingBonuses: number;
    completedBonuses: number;
    totalKoinsEarned: number;
  }> {
    const bonuses = await this.getReferralBonusesByInviter(userId);
    
    return {
      totalReferred: bonuses.length,
      pendingBonuses: bonuses.filter(b => b.status === 'pending').length,
      completedBonuses: bonuses.filter(b => b.status === 'completed').length,
      totalKoinsEarned: bonuses
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.koinsAwarded || 0), 0)
    };
  }

  // Educational Posts operations
  async getEducationalPosts(limit = 12): Promise<EducationalPost[]> {
    // Cache educational posts for 1 hour since they're static content
    const cacheKey = `educational-posts:${limit}`;
    const cached = await cacheService.get<EducationalPost[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const posts = await db.select()
      .from(educationalPosts)
      .where(eq(educationalPosts.isActive, true))
      .orderBy(desc(educationalPosts.priority))
      .limit(limit);
    
    // Cache for 1 hour (3600 seconds)
    await cacheService.set(cacheKey, posts, 3600);
    return posts;
  }

  async getRandomEducationalPosts(count: number, excludeIds: string[] = []): Promise<EducationalPost[]> {
    const query = db.select()
      .from(educationalPosts)
      .where(
        and(
          eq(educationalPosts.isActive, true),
          excludeIds.length > 0 ? not(inArray(educationalPosts.id, excludeIds)) : undefined
        )
      );
    
    const allPosts = await query;
    
    // Weighted random selection based on priority (higher priority = more likely)
    const weightedPosts: EducationalPost[] = [];
    allPosts.forEach(post => {
      const weight = post.priority || 5;
      for (let i = 0; i < weight; i++) {
        weightedPosts.push(post);
      }
    });
    
    // Shuffle and take count
    const shuffled = weightedPosts.sort(() => Math.random() - 0.5);
    const uniquePosts = Array.from(new Set(shuffled.map(p => p.id)))
      .map(id => allPosts.find(p => p.id === id)!)
      .slice(0, count);
    
    return uniquePosts;
  }

  async createEducationalPost(post: InsertEducationalPost): Promise<EducationalPost> {
    const [newPost] = await db.insert(educationalPosts).values(post).returning();
    return newPost;
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
        meme: memes,
        moviecon: moviecons,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .leftJoin(gifs, eq(messages.gifId, gifs.id))
      .leftJoin(memes, eq(messages.memeId, memes.id))
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
      conversationMessages.map(async ({ message, sender, gif, meme, moviecon }) => {
        const [receiver] = await db
          .select()
          .from(users)
          .where(eq(users.id, message.receiverId));
        
        return {
          ...message,
          sender,
          receiver,
          gif,
          meme,
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

    // Set 3-day expiration for all incognito messages
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    const [newMessage] = await db.insert(messages).values({
      ...message,
      isIncognito: true,
      expiresAt,
    }).returning();

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

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    // Get the message to verify ownership
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));
    
    if (!message) {
      return false;
    }
    
    // Only allow sender or receiver to delete
    if (message.senderId !== userId && message.receiverId !== userId) {
      return false;
    }
    
    // Update conversation if this was the last message
    await db
      .update(conversations)
      .set({ lastMessageId: null })
      .where(eq(conversations.lastMessageId, messageId));
    
    // Delete the message
    await db.delete(messages).where(eq(messages.id, messageId));
    
    return true;
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
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    // Find conversations older than 3 days based on lastActivity
    const oldConversations = await db
      .select({ 
        id: conversations.id, 
        user1Id: conversations.user1Id, 
        user2Id: conversations.user2Id 
      })
      .from(conversations)
      .where(lt(conversations.lastActivity, threeDaysAgo));
    
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
      .where(lt(conversations.lastActivity, threeDaysAgo));
    
    console.log(`Cleaned up ${oldConversations.length} old conversations and ${messagesDeletedCount} messages at ${now.toISOString()}`);
  }

  async deleteConversation(userId: string, otherUserId: string): Promise<void> {
    // Find the conversation between these two users
    const conversation = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        or(
          and(eq(conversations.user1Id, userId), eq(conversations.user2Id, otherUserId)),
          and(eq(conversations.user1Id, otherUserId), eq(conversations.user2Id, userId))
        )
      )
      .limit(1);
    
    if (conversation.length === 0) {
      return;
    }
    
    const conversationId = conversation[0].id;
    
    // Clear lastMessageId reference first
    await db
      .update(conversations)
      .set({ lastMessageId: null })
      .where(eq(conversations.id, conversationId));
    
    // Delete all messages between these users
    await db
      .delete(messages)
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
          and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
        )
      );
    
    // Delete the conversation
    await db
      .delete(conversations)
      .where(eq(conversations.id, conversationId));
    
    console.log(`Deleted conversation between ${userId} and ${otherUserId}`);
  }

  // Group chat operations
  async createGroupConversation(data: { name?: string; creatorId: string; participantIds: string[] }): Promise<GroupConversation> {
    const { name, creatorId, participantIds } = data;
    
    const [groupConversation] = await db
      .insert(groupConversations)
      .values({
        name: name || null,
        creatorId,
      })
      .returning();
    
    for (const userId of participantIds) {
      await db.insert(conversationParticipants).values({
        groupConversationId: groupConversation.id,
        userId,
      });
    }
    
    return groupConversation;
  }

  async getGroupConversations(userId: string): Promise<(GroupConversation & { participants: User[]; lastMessage?: Message; unreadCount: number })[]> {
    const userGroups = await db
      .select({
        groupConversation: groupConversations,
      })
      .from(conversationParticipants)
      .innerJoin(groupConversations, eq(conversationParticipants.groupConversationId, groupConversations.id))
      .where(eq(conversationParticipants.userId, userId))
      .orderBy(desc(groupConversations.lastActivity));
    
    const result = [];
    for (const { groupConversation } of userGroups) {
      const participantsData = await db
        .select({ user: users })
        .from(conversationParticipants)
        .innerJoin(users, eq(conversationParticipants.userId, users.id))
        .where(eq(conversationParticipants.groupConversationId, groupConversation.id));
      
      const participants = participantsData.map(p => p.user);
      
      let lastMessage: Message | undefined;
      if (groupConversation.lastMessageId) {
        const lastMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.id, groupConversation.lastMessageId))
          .limit(1);
        lastMessage = lastMessages[0];
      }
      
      const unreadMessages = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.groupConversationId, groupConversation.id),
            eq(messages.isRead, false),
            sql`${messages.senderId} != ${userId}`
          )
        );
      
      const unreadCount = Number(unreadMessages[0]?.count || 0);
      
      result.push({
        ...groupConversation,
        participants,
        lastMessage,
        unreadCount,
      });
    }
    
    return result;
  }

  async getGroupConversation(groupId: string, userId: string): Promise<(GroupConversation & { participants: User[]; messages: (Message & { sender: User })[] }) | undefined> {
    const isParticipant = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.groupConversationId, groupId),
          eq(conversationParticipants.userId, userId)
        )
      )
      .limit(1);
    
    if (isParticipant.length === 0) {
      return undefined;
    }
    
    const groupConversationData = await db
      .select()
      .from(groupConversations)
      .where(eq(groupConversations.id, groupId))
      .limit(1);
    
    if (groupConversationData.length === 0) {
      return undefined;
    }
    
    const groupConversation = groupConversationData[0];
    
    const participantsData = await db
      .select({ user: users })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(eq(conversationParticipants.groupConversationId, groupId));
    
    const participants = participantsData.map(p => p.user);
    
    const messagesData = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.groupConversationId, groupId))
      .orderBy(messages.createdAt);
    
    const groupMessages = messagesData.map(({ message, sender }) => ({
      ...message,
      sender,
    }));
    
    return {
      ...groupConversation,
      participants,
      messages: groupMessages,
    };
  }

  async getAllGroupParticipantIds(groupId: string): Promise<string[]> {
    console.log(`[GROUP-PARTICIPANTS-DEBUG] Fetching ALL participants for groupId=${groupId}`);
    
    const participantsData = await db
      .select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.groupConversationId, groupId));
    
    const participantIds = participantsData.map(p => p.userId);
    console.log(`[GROUP-PARTICIPANTS-DEBUG] Found ${participantIds.length} participants: ${JSON.stringify(participantIds)}`);
    
    return participantIds;
  }

  async addParticipantToGroup(groupId: string, userId: string): Promise<void> {
    await db.insert(conversationParticipants).values({
      groupConversationId: groupId,
      userId,
    });
  }

  async removeParticipantFromGroup(groupId: string, userId: string): Promise<void> {
    await db
      .delete(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.groupConversationId, groupId),
          eq(conversationParticipants.userId, userId)
        )
      );
  }

  async sendGroupMessage(message: InsertMessage): Promise<Message> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        expiresAt,
      })
      .returning();
    
    if (message.groupConversationId) {
      await db
        .update(groupConversations)
        .set({
          lastMessageId: newMessage.id,
          lastActivity: new Date(),
        })
        .where(eq(groupConversations.id, message.groupConversationId));
    }
    
    return newMessage;
  }

  async deleteGroupConversation(groupId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.groupConversationId, groupId));
    
    await db.delete(conversationParticipants).where(eq(conversationParticipants.groupConversationId, groupId));
    
    await db.delete(groupConversations).where(eq(groupConversations.id, groupId));
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

  async getActionById(actionId: string): Promise<(Action & { author?: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; kliqName: string | null } }) | undefined> {
    const result = await db
      .select({
        action: actions,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          kliqName: users.kliqName,
        },
      })
      .from(actions)
      .leftJoin(users, eq(actions.userId, users.id))
      .where(eq(actions.id, actionId))
      .limit(1);
    
    if (result.length === 0) return undefined;
    
    const { action, author } = result[0];
    return {
      ...action,
      author: author || undefined,
    };
  }

  async getUserRecordings(userId: string): Promise<(Action & { author: User })[]> {
    const recordings = await db
      .select({
        action: actions,
        author: users,
      })
      .from(actions)
      .leftJoin(users, eq(actions.userId, users.id))
      .where(
        and(
          eq(actions.userId, userId),
          eq(actions.status, "ended"),
          isNotNull(actions.recordingUrl)
        )
      )
      .orderBy(desc(actions.createdAt))
      .limit(10);

    return recordings.map(({ action, author }) => ({
      ...action,
      author: author!,
    }));
  }

  async enforceRecordingLimit(userId: string, maxRecordings: number): Promise<void> {
    // Get all recordings for user ordered by creation date (oldest first)
    const userRecordings = await db
      .select()
      .from(actions)
      .where(
        and(
          eq(actions.userId, userId),
          eq(actions.status, "ended"),
          isNotNull(actions.recordingUrl)
        )
      )
      .orderBy(actions.createdAt);

    // If over limit, delete the oldest recordings
    if (userRecordings.length >= maxRecordings) {
      const recordingsToDelete = userRecordings.slice(0, userRecordings.length - maxRecordings + 1);
      
      for (const recording of recordingsToDelete) {
        // Delete the recording's related data and the action itself
        await this.deleteAction(recording.id);
        console.log(`Auto-deleted old recording: ${recording.id} (${recording.title})`);
      }
    }
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

  async updateAction(actionId: string, updates: Partial<Action>): Promise<Action> {
    const [updatedAction] = await db
      .update(actions)
      .set(updates)
      .where(eq(actions.id, actionId))
      .returning();
    
    return updatedAction;
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

  async deleteAction(actionId: string): Promise<void> {
    // Get the action to find the auto-generated post
    const action = await this.getActionById(actionId);
    
    // Delete all related records first (cascade delete)
    await db.delete(actionChatMessages).where(eq(actionChatMessages.actionId, actionId));
    await db.delete(actionViewers).where(eq(actionViewers.actionId, actionId));
    
    // Delete action likes
    await db.delete(actionLikes).where(eq(actionLikes.actionId, actionId));
    
    // Delete the auto-generated post if it exists
    if (action?.autoGeneratedPostId) {
      await db.delete(posts).where(eq(posts.id, action.autoGeneratedPostId));
    }
    
    // Delete the action itself
    await db.delete(actions).where(eq(actions.id, actionId));
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

  async toggleActionLike(actionId: string, userId: string): Promise<{ liked: boolean }> {
    const [existingLike] = await db
      .select()
      .from(actionLikes)
      .where(and(eq(actionLikes.actionId, actionId), eq(actionLikes.userId, userId)))
      .limit(1);

    if (existingLike) {
      await db.delete(actionLikes).where(eq(actionLikes.id, existingLike.id));
      return { liked: false };
    } else {
      await db.insert(actionLikes).values({ actionId, userId });
      return { liked: true };
    }
  }

  async getActionLikes(actionId: string): Promise<{ userId: string }[]> {
    const likes = await db
      .select({ userId: actionLikes.userId })
      .from(actionLikes)
      .where(eq(actionLikes.actionId, actionId));
    return likes;
  }

  async highlightAction(actionId: string): Promise<void> {
    await db
      .update(actions)
      .set({ isHighlighted: true })
      .where(eq(actions.id, actionId));
  }

  async unhighlightAction(actionId: string): Promise<void> {
    await db
      .update(actions)
      .set({ isHighlighted: false })
      .where(eq(actions.id, actionId));
  }

  async getActionComments(actionId: string): Promise<any[]> {
    const comments = await db
      .select({
        comment: actionComments,
        user: users,
        userBorder: profileBorders,
      })
      .from(actionComments)
      .leftJoin(users, eq(actionComments.userId, users.id))
      .leftJoin(profileBorders, eq(users.equippedBorderId, profileBorders.id))
      .where(eq(actionComments.actionId, actionId))
      .orderBy(actionComments.createdAt);

    return comments.map(({ comment, user, userBorder }) => ({
      ...comment,
      user: {
        ...user!,
        equippedBorder: userBorder || undefined,
      },
    }));
  }

  async addActionComment(data: { actionId: string; userId: string; content: string }): Promise<any> {
    const [newComment] = await db.insert(actionComments).values(data).returning();
    
    const user = await this.getUser(data.userId);
    return { ...newComment, user };
  }

  async saveActionToScrapbook(userId: string, actionId: string): Promise<any> {
    const [existing] = await db
      .select()
      .from(scrapbookSaves)
      .where(and(
        eq(scrapbookSaves.userId, userId),
        sql`note = ${`action:${actionId}`}`
      ))
      .limit(1);

    if (existing) {
      throw new Error('Action already saved to scrapbook');
    }

    const [saved] = await db.insert(scrapbookSaves).values({
      userId,
      note: `action:${actionId}`,
    }).returning();

    return saved;
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
    
    // birthdate is stored as YYYY-MM-DD string, extract MM-DD portion (chars 6-10)
    return await db
      .select()
      .from(users)
      .where(sql`substring(${users.birthdate}, 6, 5) = ${monthDay}`);
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

  async getUserScrapbookSaves(userId: string, albumId?: string): Promise<any[]> {
    const conditions = [eq(scrapbookSaves.userId, userId)];
    if (albumId) {
      conditions.push(eq(scrapbookSaves.albumId, albumId));
    }

    // Get post saves
    const postSaves = await db
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

    // Get action saves (identified by note starting with 'action:')
    const actionSavesRaw = await db
      .select()
      .from(scrapbookSaves)
      .where(and(
        eq(scrapbookSaves.userId, userId),
        sql`note LIKE 'action:%'`,
        albumId ? eq(scrapbookSaves.albumId, albumId) : sql`TRUE`
      ))
      .orderBy(desc(scrapbookSaves.savedAt));

    // Fetch action details for action saves
    const actionSaves = await Promise.all(
      actionSavesRaw.map(async (save) => {
        const actionId = save.note?.replace('action:', '');
        if (!actionId) return null;
        
        const action = await this.getActionById(actionId);
        if (!action) return null;
        
        return {
          ...save,
          action,
          type: 'action' as const,
        };
      })
    );

    // Combine and sort by savedAt
    const allSaves = [
      ...postSaves.map(({ save, post, author }) => ({
        ...save,
        post: { ...post, author },
        type: 'post' as const,
      })),
      ...actionSaves.filter(Boolean),
    ].sort((a, b) => 
      new Date(b!.savedAt!).getTime() - new Date(a!.savedAt!).getTime()
    );

    return allSaves;
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

  async saveCommentToScrapbook(save: InsertScrapbookSave): Promise<ScrapbookSave> {
    const [newSave] = await db
      .insert(scrapbookSaves)
      .values(save)
      .returning();
    return newSave;
  }

  async unsaveCommentFromScrapbook(userId: string, commentId: string): Promise<void> {
    await db
      .delete(scrapbookSaves)
      .where(and(
        eq(scrapbookSaves.userId, userId),
        eq(scrapbookSaves.commentId, commentId)
      ));
  }

  async unsaveActionFromScrapbook(userId: string, actionId: string): Promise<void> {
    await db
      .delete(scrapbookSaves)
      .where(and(
        eq(scrapbookSaves.userId, userId),
        sql`note = ${`action:${actionId}`}`
      ));
  }

  async isCommentSavedByUser(userId: string, commentId: string): Promise<boolean> {
    const result = await db
      .select({ id: scrapbookSaves.id })
      .from(scrapbookSaves)
      .where(and(
        eq(scrapbookSaves.userId, userId),
        eq(scrapbookSaves.commentId, commentId)
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
  async getPolls(userId: string, authorId?: string): Promise<(Poll & { author: User; votes: PollVote[]; totalVotes: number; userVote?: PollVote })[]> {
    const whereClause = authorId 
      ? and(eq(polls.isActive, true), eq(polls.userId, authorId))
      : eq(polls.isActive, true);
    
    const userPolls = await db
      .select({
        poll: polls,
        author: users,
      })
      .from(polls)
      .innerJoin(users, eq(polls.userId, users.id))
      .where(whereClause)
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

  async updatePoll(pollId: string, updates: Partial<Pick<Poll, 'title' | 'description' | 'options' | 'expiresAt'>>): Promise<Poll> {
    const [updatedPoll] = await db
      .update(polls)
      .set(updates)
      .where(eq(polls.id, pollId))
      .returning();
    return updatedPoll;
  }

  async deletePoll(pollId: string): Promise<void> {
    // Delete poll votes first (foreign key constraint)
    await db.delete(pollVotes).where(eq(pollVotes.pollId, pollId));
    // Delete the poll
    await db.delete(polls).where(eq(polls.id, pollId));
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
      // Parse YYYY-MM-DD string without timezone conversion
      const [birthYear, birthMonth, birthDay] = user.birthdate.split('-').map(Number);
      const today = new Date();
      userAge = today.getFullYear() - birthYear;
      const monthDiff = (today.getMonth() + 1) - birthMonth; // today.getMonth() is 0-indexed
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
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

  // Sports preferences operations
  async getUserSportsPreferences(userId: string): Promise<UserSportsPreference[]> {
    const preferences = await db
      .select()
      .from(userSportsPreferences)
      .where(eq(userSportsPreferences.userId, userId))
      .orderBy(userSportsPreferences.createdAt);
    return preferences;
  }

  async createUserSportsPreference(preference: InsertUserSportsPreference): Promise<UserSportsPreference> {
    const [newPreference] = await db
      .insert(userSportsPreferences)
      .values(preference)
      .returning();
    return newPreference;
  }

  async deleteUserSportsPreference(preferenceId: string): Promise<void> {
    await db
      .delete(userSportsPreferences)
      .where(eq(userSportsPreferences.id, preferenceId));
  }

  async deleteUserSportsPreferences(userId: string): Promise<void> {
    await db
      .delete(userSportsPreferences)
      .where(eq(userSportsPreferences.userId, userId));
  }

  // Device token operations
  async registerDeviceToken(tokenData: InsertDeviceToken): Promise<DeviceToken> {
    // Upsert: deactivate existing token if it exists, then insert new one
    const existingToken = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, tokenData.token))
      .limit(1);
    
    if (existingToken.length > 0) {
      const [updated] = await db
        .update(deviceTokens)
        .set({ ...tokenData, updatedAt: new Date(), isActive: true })
        .where(eq(deviceTokens.token, tokenData.token))
        .returning();
      return updated;
    }
    
    const [newToken] = await db.insert(deviceTokens).values(tokenData).returning();
    return newToken;
  }

  async getDeviceTokensByUser(userId: string): Promise<DeviceToken[]> {
    return await db
      .select()
      .from(deviceTokens)
      .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.isActive, true)));
  }

  async deactivateDeviceToken(token: string): Promise<void> {
    await db
      .update(deviceTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(deviceTokens.token, token));
  }

  async deactivateAllUserDeviceTokens(userId: string): Promise<void> {
    await db
      .update(deviceTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(deviceTokens.userId, userId));
  }

  async unregisterDeviceToken(userId: string, token: string): Promise<void> {
    await db
      .delete(deviceTokens)
      .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, token)));
  }

  // Notification preferences operations
  async getNotificationPreferences(userId: string): Promise<NotificationPreference | undefined> {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    return preferences;
  }

  async createNotificationPreferences(preferences: InsertNotificationPreference): Promise<NotificationPreference> {
    const [newPreferences] = await db
      .insert(notificationPreferences)
      .values(preferences)
      .returning();
    return newPreferences;
  }

  async updateNotificationPreferences(userId: string, updates: Partial<InsertNotificationPreference>): Promise<NotificationPreference> {
    const [updated] = await db
      .update(notificationPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    return updated;
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

  async getUserDetailsForAdmin(userId: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;
    
    // Return user data with sensitive fields replaced by status flags only
    // This prevents exposing passwords, PINs, or security answers to admin panel
    return {
      ...user,
      // Replace sensitive fields with boolean status flags
      password: !!user.password,         // true if password is set, false if not
      securityPin: !!user.securityPin,   // true if PIN is set, false if not
      securityAnswer1: !!user.securityAnswer1,  // true if set
      securityAnswer2: !!user.securityAnswer2,  // true if set
      securityAnswer3: !!user.securityAnswer3,  // true if set
      // Add explicit status flags for clarity
      hasPassword: !!user.password,
      hasSecurityPin: !!user.securityPin,
      hasSecurityAnswers: !!(user.securityAnswer1 && user.securityAnswer2 && user.securityAnswer3)
    };
  }

  // Admin-specific methods
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log(`Starting comprehensive user deletion for userId: ${userId}`);
      
      // Delete in order due to foreign key constraints
      // Start with tables that have no dependencies first
      
      // Session cleanup - delete sessions containing this user's ID
      await db.execute(sql`DELETE FROM sessions WHERE sess::text LIKE ${'%"sub":"' + userId + '"%'}`);
      
      // Notifications and preferences
      await db.delete(notifications).where(eq(notifications.userId, userId));
      await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));
      
      // Kliq Koins system
      await db.delete(kliqKoinTransactions).where(eq(kliqKoinTransactions.userId, userId));
      await db.delete(kliqKoins).where(eq(kliqKoins.userId, userId));
      await db.delete(loginStreaks).where(eq(loginStreaks.userId, userId));
      await db.delete(userBorders).where(eq(userBorders.userId, userId));
      
      // Referral system
      await db.delete(referralBonuses).where(eq(referralBonuses.inviterId, userId));
      await db.delete(referralBonuses).where(eq(referralBonuses.inviteeId, userId));
      
      // Social connections and rewards
      await db.delete(socialConnectionRewards).where(eq(socialConnectionRewards.userId, userId));
      await db.delete(socialCredentials).where(eq(socialCredentials.userId, userId));
      
      // Device tokens
      await db.delete(deviceTokens).where(eq(deviceTokens.userId, userId));
      
      // Sports preferences
      await db.delete(userSportsPreferences).where(eq(userSportsPreferences.userId, userId));
      
      // Ad preferences and interactions
      await db.delete(userAdPreferences).where(eq(userAdPreferences.userId, userId));
      await db.delete(adInteractions).where(eq(adInteractions.userId, userId));
      
      // Analytics and suggestions
      await db.delete(userInteractionAnalytics).where(eq(userInteractionAnalytics.userId, userId));
      await db.delete(friendRankingSuggestions).where(eq(friendRankingSuggestions.userId, userId));
      await db.delete(contentEngagements).where(eq(contentEngagements.userId, userId));
      
      // Rules reports (both reporter and reported)
      await db.delete(rulesReports).where(eq(rulesReports.reportedBy, userId));
      await db.delete(rulesReports).where(eq(rulesReports.postAuthorId, userId));
      
      // Birthday messages
      await db.delete(birthdayMessages).where(eq(birthdayMessages.birthdayUserId, userId));
      await db.delete(birthdayMessages).where(eq(birthdayMessages.senderUserId, userId));
      
      // Video calls
      await db.delete(callParticipants).where(eq(callParticipants.userId, userId));
      await db.delete(videoCalls).where(eq(videoCalls.initiatorId, userId));
      
      // Meetups
      await db.delete(meetupCheckIns).where(eq(meetupCheckIns.userId, userId));
      await db.delete(meetups).where(eq(meetups.userId, userId));
      
      // Actions (live streams)
      await db.delete(actionChatMessages).where(eq(actionChatMessages.userId, userId));
      await db.delete(actionViewers).where(eq(actionViewers.userId, userId));
      await db.delete(actions).where(eq(actions.userId, userId));
      
      // Calendar
      await db.delete(calendarNotes).where(eq(calendarNotes.userId, userId));
      await db.delete(eventReminders).where(eq(eventReminders.userId, userId));
      await db.delete(eventAttendees).where(eq(eventAttendees.userId, userId));
      await db.delete(events).where(eq(events.userId, userId));
      
      // Messages and conversations
      await db.delete(messages).where(eq(messages.senderId, userId));
      await db.delete(conversationParticipants).where(eq(conversationParticipants.userId, userId));
      await db.delete(conversations).where(eq(conversations.user1Id, userId));
      await db.delete(conversations).where(eq(conversations.user2Id, userId));
      
      // Polls
      await db.delete(pollVotes).where(eq(pollVotes.userId, userId));
      await db.delete(polls).where(eq(polls.userId, userId));
      
      // Content filters
      await db.delete(contentFilters).where(eq(contentFilters.userId, userId));
      
      // Scrapbook
      await db.delete(scrapbookSaves).where(eq(scrapbookSaves.userId, userId));
      await db.delete(scrapbookAlbums).where(eq(scrapbookAlbums.userId, userId));
      
      // Post highlights
      await db.delete(postHighlights).where(eq(postHighlights.userId, userId));
      
      // Comments and likes
      await db.delete(commentLikes).where(eq(commentLikes.userId, userId));
      await db.delete(postLikes).where(eq(postLikes.userId, userId));
      await db.delete(comments).where(eq(comments.userId, userId));
      
      // Mood boost posts
      await db.delete(moodBoostPosts).where(eq(moodBoostPosts.userId, userId));
      
      // Stories
      await db.delete(storyViews).where(eq(storyViews.userId, userId));
      await db.delete(stories).where(eq(stories.userId, userId));
      
      // Posts (must be after comments and likes)
      await db.delete(posts).where(eq(posts.userId, userId));
      
      // Friendships
      await db.delete(friendships).where(eq(friendships.userId, userId));
      await db.delete(friendships).where(eq(friendships.friendId, userId));
      
      // User theme
      await db.delete(userThemes).where(eq(userThemes.userId, userId));
      
      // Password reset tokens and attempts
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
      await db.delete(passwordResetAttempts).where(eq(passwordResetAttempts.userId, userId));
      
      // Used invite codes
      await db.delete(usedInviteCodes).where(eq(usedInviteCodes.usedBy, userId));
      
      // Finally, delete the user
      await db.delete(users).where(eq(users.id, userId));
      
      console.log(`Successfully deleted user ${userId} and all associated data`);
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

  async getReports(filters: { status?: string; page?: number; limit?: number }): Promise<any[]> {
    const { status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;
    
    // Build the base query with proper aliasing for the post author
    const reporterUsers = users;
    
    let whereClause = status ? eq(rulesReports.status, status as any) : undefined;
    
    const results = await db
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
        reporter: reporterUsers,
        post: posts,
      })
      .from(rulesReports)
      .leftJoin(reporterUsers, eq(rulesReports.reportedBy, reporterUsers.id))
      .leftJoin(posts, eq(rulesReports.postId, posts.id))
      .where(whereClause)
      .orderBy(desc(rulesReports.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Fetch post authors and media attachments for the results
    const enrichedResults = await Promise.all(
      results.map(async (report) => {
        let postAuthor = null;
        let memeData = null;
        let movieconData = null;
        
        if (report.postAuthorId) {
          const [author] = await db
            .select()
            .from(users)
            .where(eq(users.id, report.postAuthorId));
          postAuthor = author;
        }
        
        // Fetch meme data if the post has a meme attachment
        if (report.post?.memeId) {
          const [meme] = await db
            .select()
            .from(memes)
            .where(eq(memes.id, report.post.memeId));
          memeData = meme;
        }
        
        // Fetch moviecon data if the post has a moviecon attachment
        if (report.post?.movieconId) {
          const [moviecon] = await db
            .select()
            .from(moviecons)
            .where(eq(moviecons.id, report.post.movieconId));
          movieconData = moviecon;
        }
        
        return { ...report, postAuthor, memeData, movieconData };
      })
    );
    
    return enrichedResults;
  }

  async getReportById(reportId: string): Promise<Report | null> {
    const [report] = await db
      .select()
      .from(rulesReports)
      .where(eq(rulesReports.id, reportId));
    return report || null;
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

  // Kliq Koin operations
  async getUserKoins(userId: string): Promise<KliqKoin | undefined> {
    const [koins] = await db
      .select()
      .from(kliqKoins)
      .where(eq(kliqKoins.userId, userId));
    return koins;
  }

  async initializeUserKoins(userId: string): Promise<KliqKoin> {
    const [newKoins] = await db
      .insert(kliqKoins)
      .values({ userId, balance: 0, totalEarned: 0 })
      .returning();
    return newKoins;
  }

  async awardKoins(userId: string, amount: number, source: string, referenceId?: string): Promise<KliqKoin> {
    return await db.transaction(async (tx) => {
      let userKoins = await this.getUserKoins(userId);
      if (!userKoins) {
        userKoins = await this.initializeUserKoins(userId);
      }

      const newBalance = parseFloat(userKoins.balance as any) + amount;
      const newTotalEarned = parseFloat(userKoins.totalEarned as any) + amount;

      const [updated] = await tx
        .update(kliqKoins)
        .set({ 
          balance: newBalance, 
          totalEarned: newTotalEarned,
          updatedAt: new Date() 
        })
        .where(eq(kliqKoins.userId, userId))
        .returning();

      await tx.insert(kliqKoinTransactions).values({
        userId,
        amount,
        type: 'earned',
        source,
        referenceId,
        balanceAfter: newBalance,
      });

      return updated;
    });
  }

  async spendKoins(userId: string, amount: number, source: string, referenceId?: string): Promise<KliqKoin> {
    return await db.transaction(async (tx) => {
      const userKoins = await this.getUserKoins(userId);
      if (!userKoins || parseFloat(userKoins.balance as any) < amount) {
        throw new Error('Insufficient Kliq Koins');
      }

      const newBalance = parseFloat(userKoins.balance as any) - amount;

      const [updated] = await tx
        .update(kliqKoins)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(kliqKoins.userId, userId))
        .returning();

      await tx.insert(kliqKoinTransactions).values({
        userId,
        amount: -amount,
        type: 'spent',
        source,
        referenceId,
        balanceAfter: newBalance,
      });

      return updated;
    });
  }

  async getKoinTransactions(userId: string, limit: number = 50): Promise<KliqKoinTransaction[]> {
    return await db
      .select()
      .from(kliqKoinTransactions)
      .where(eq(kliqKoinTransactions.userId, userId))
      .orderBy(desc(kliqKoinTransactions.createdAt))
      .limit(limit);
  }

  // Login Streak operations
  async getUserStreak(userId: string): Promise<LoginStreak | undefined> {
    const [streak] = await db
      .select()
      .from(loginStreaks)
      .where(eq(loginStreaks.userId, userId));
    return streak;
  }

  async initializeUserStreak(userId: string): Promise<LoginStreak> {
    const [newStreak] = await db
      .insert(loginStreaks)
      .values({ 
        userId, 
        currentStreak: 0, 
        longestStreak: 0,
        streakFreezes: 0 
      })
      .returning();
    return newStreak;
  }

  async processLogin(userId: string): Promise<{ streak: LoginStreak; koinsAwarded: number; tierUnlocked?: ProfileBorder }> {
    return await db.transaction(async (tx) => {
      let userStreak = await this.getUserStreak(userId);
      if (!userStreak) {
        userStreak = await this.initializeUserStreak(userId);
      }

      const now = new Date();
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      
      const hour = estTime.getHours();
      const loginDay = new Date(estTime);
      if (hour < 12) {
        loginDay.setDate(loginDay.getDate() - 1);
      }
      const y = loginDay.getFullYear();
      const m = String(loginDay.getMonth() + 1).padStart(2, '0');
      const d = String(loginDay.getDate()).padStart(2, '0');
      const loginDayStr = `${y}-${m}-${d}`;
      
      const lastLogin = userStreak.lastLoginDate?.toString();

      console.log(`[Streak] userId=${userId} | nowUTC=${now.toISOString()} | estHour=${hour} | loginDayStr=${loginDayStr} | lastLogin=${lastLogin} | currentStreak=${userStreak.currentStreak}`);

      if (lastLogin === loginDayStr) {
        console.log(`[Streak] Already checked in for ${loginDayStr}, skipping`);
        return { streak: userStreak, koinsAwarded: 0 };
      }

      const yesterdayLoginDay = new Date(loginDay);
      yesterdayLoginDay.setDate(yesterdayLoginDay.getDate() - 1);
      const yy = yesterdayLoginDay.getFullYear();
      const ym = String(yesterdayLoginDay.getMonth() + 1).padStart(2, '0');
      const yd = String(yesterdayLoginDay.getDate()).padStart(2, '0');
      const yesterdayStr = `${yy}-${ym}-${yd}`;

      let newStreak = userStreak.currentStreak;
      let tierUnlocked: ProfileBorder | undefined;
      let previousStreakValue = userStreak.previousStreak;

      if (lastLogin === yesterdayStr) {
        newStreak += 1;
      } else {
        // Streak broken - save the current streak before resetting (only if > 0)
        if (userStreak.currentStreak > 0) {
          previousStreakValue = userStreak.currentStreak;
        }
        newStreak = 1;
      }

      const newLongestStreak = Math.max(newStreak, userStreak.longestStreak);

      const [updatedStreak] = await tx
        .update(loginStreaks)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          previousStreak: previousStreakValue,
          lastLoginDate: loginDayStr as any,
          updatedAt: new Date(),
        })
        .where(eq(loginStreaks.userId, userId))
        .returning();

      const koinsAwarded = await this.awardKoins(userId, 1, 'daily_login');

      // Streak reward tiers matching profile_borders tier values
      // Use >= to self-heal and award any missing borders from past milestones
      const tiers = [3, 7, 30, 90, 180, 365, 730, 1000];
      for (const tier of tiers) {
        if (newStreak >= tier) {
          const unlockedBorder = await this.unlockStreakBorder(userId, tier);
          if (unlockedBorder) {
            // Only show the most recently unlocked tier (exact match)
            if (newStreak === tier) {
              tierUnlocked = unlockedBorder.border;
            }
          }
        }
      }

      return { 
        streak: updatedStreak, 
        koinsAwarded: 1,
        tierUnlocked 
      };
    });
  }

  async restoreStreak(userId: string): Promise<LoginStreak> {
    const RESTORE_COST = 10;
    
    return await db.transaction(async (tx) => {
      const [currentStreak] = await tx
        .select()
        .from(loginStreaks)
        .where(eq(loginStreaks.userId, userId));

      if (!currentStreak || currentStreak.longestStreak === 0) {
        throw new Error('No streak available to restore');
      }

      if (currentStreak.currentStreak >= currentStreak.longestStreak) {
        throw new Error('Your current streak is already at or above your longest streak');
      }

      const [userKoins] = await tx
        .select()
        .from(kliqKoins)
        .where(eq(kliqKoins.userId, userId));

      if (!userKoins || parseFloat(userKoins.balance as any) < RESTORE_COST) {
        throw new Error('Insufficient Kliq Koins');
      }

      const newBalance = parseFloat(userKoins.balance as any) - RESTORE_COST;

      await tx
        .update(kliqKoins)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(kliqKoins.userId, userId));

      await tx.insert(kliqKoinTransactions).values({
        userId,
        amount: -RESTORE_COST,
        type: 'spent',
        source: 'streak_restore',
        balanceAfter: newBalance,
      });

      const [updatedStreak] = await tx
        .update(loginStreaks)
        .set({ 
          currentStreak: currentStreak.longestStreak,
          previousStreak: 0,
          lastLoginDate: new Date().toISOString().split('T')[0] as any,
          updatedAt: new Date() 
        })
        .where(eq(loginStreaks.userId, userId))
        .returning();

      return updatedStreak;
    });
  }

  // Profile Border operations
  async getAllBorders(): Promise<ProfileBorder[]> {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    const allBorders = await db
      .select()
      .from(profileBorders)
      .where(
        and(
          eq(profileBorders.isActive, true),
          or(
            isNull(profileBorders.availableMonth),
            eq(profileBorders.availableMonth, currentMonth)
          )
        )
      );
    
    // Sort: Free monthly borders first (cost=0 AND availableMonth not null),
    // then regular borders sorted by cost
    return allBorders.sort((a, b) => {
      const aIsMonthlyFree = a.cost === 0 && a.availableMonth !== null;
      const bIsMonthlyFree = b.cost === 0 && b.availableMonth !== null;
      
      if (aIsMonthlyFree && !bIsMonthlyFree) return -1;
      if (!aIsMonthlyFree && bIsMonthlyFree) return 1;
      
      return a.cost - b.cost;
    });
  }

  async getStreakRewardBorders(): Promise<ProfileBorder[]> {
    return await db
      .select()
      .from(profileBorders)
      .where(
        and(
          eq(profileBorders.type, 'streak_reward'),
          eq(profileBorders.isActive, true)
        )
      )
      .orderBy(asc(profileBorders.tier));
  }

  async getPurchasableBorders(): Promise<ProfileBorder[]> {
    return await db
      .select()
      .from(profileBorders)
      .where(
        and(
          eq(profileBorders.type, 'purchasable'),
          eq(profileBorders.isActive, true)
        )
      )
      .orderBy(asc(profileBorders.cost));
  }

  async getBorderById(borderId: string): Promise<ProfileBorder | undefined> {
    const [border] = await db
      .select()
      .from(profileBorders)
      .where(eq(profileBorders.id, borderId));
    return border;
  }

  async getUserBorders(userId: string): Promise<(UserBorder & { border: ProfileBorder })[]> {
    const borders = await db
      .select({
        id: userBorders.id,
        userId: userBorders.userId,
        borderId: userBorders.borderId,
        isEquipped: userBorders.isEquipped,
        purchasedAt: userBorders.purchasedAt,
        createdAt: userBorders.createdAt,
        border: profileBorders,
      })
      .from(userBorders)
      .innerJoin(profileBorders, eq(userBorders.borderId, profileBorders.id))
      .where(eq(userBorders.userId, userId))
      .orderBy(desc(userBorders.purchasedAt));

    return borders;
  }

  async getEquippedBorder(userId: string): Promise<(UserBorder & { border: ProfileBorder }) | undefined> {
    const [equipped] = await db
      .select({
        id: userBorders.id,
        userId: userBorders.userId,
        borderId: userBorders.borderId,
        isEquipped: userBorders.isEquipped,
        purchasedAt: userBorders.purchasedAt,
        createdAt: userBorders.createdAt,
        border: profileBorders,
      })
      .from(userBorders)
      .innerJoin(profileBorders, eq(userBorders.borderId, profileBorders.id))
      .where(
        and(
          eq(userBorders.userId, userId),
          eq(userBorders.isEquipped, true)
        )
      );

    return equipped;
  }

  async purchaseBorder(userId: string, borderId: string): Promise<UserBorder> {
    return await db.transaction(async (tx) => {
      const border = await this.getBorderById(borderId);
      if (!border) {
        throw new Error('Border not found');
      }

      if (border.type === 'streak_reward') {
        throw new Error('Streak reward borders cannot be purchased');
      }

      // Validate unlock requirements for engagement reward borders
      if (border.type === 'reward') {
        // Use new engagement system if available, fall back to legacy postsRequired
        const threshold = border.engagementThreshold || border.postsRequired;
        const engagementType = border.engagementType || 'posts_created';
        
        if (!threshold || threshold <= 0) {
          throw new Error('Invalid reward border configuration');
        }
        
        // Engagement counter lookup
        const engagementCounters: Record<string, () => Promise<number>> = {
          posts_created: () => this.getUserPostCount(userId),
          posts_liked: () => this.getUserUniqueLikeCount(userId),
        };
        
        const getCount = engagementCounters[engagementType];
        if (!getCount) {
          throw new Error(`Unknown engagement type: ${engagementType}`);
        }
        
        const userCount = await getCount();
        if (userCount < threshold) {
          const remaining = threshold - userCount;
          const metric = engagementType === 'posts_created' ? 'posts' : 'likes';
          throw new Error(`You need ${remaining} more ${metric} to unlock this border`);
        }
      }

      const existingBorders = await this.getUserBorders(userId);
      if (existingBorders.some(ub => ub.borderId === borderId)) {
        throw new Error('Border already owned');
      }

      await this.spendKoins(userId, border.cost, 'purchase_border', borderId);

      const [newUserBorder] = await tx
        .insert(userBorders)
        .values({ userId, borderId, isEquipped: false })
        .returning();

      return newUserBorder;
    });
  }

  async equipBorder(userId: string, borderId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const userBorderList = await this.getUserBorders(userId);
      if (!userBorderList.some(ub => ub.borderId === borderId)) {
        throw new Error('Border not owned');
      }

      await tx
        .update(userBorders)
        .set({ isEquipped: false })
        .where(eq(userBorders.userId, userId));

      await tx
        .update(userBorders)
        .set({ isEquipped: true })
        .where(
          and(
            eq(userBorders.userId, userId),
            eq(userBorders.borderId, borderId)
          )
        );

      await tx
        .update(users)
        .set({ equippedBorderId: borderId })
        .where(eq(users.id, userId));
    });
  }

  async unequipBorder(userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(userBorders)
        .set({ isEquipped: false })
        .where(eq(userBorders.userId, userId));

      await tx
        .update(users)
        .set({ equippedBorderId: null })
        .where(eq(users.id, userId));
    });
  }

  async unlockStreakBorder(userId: string, tier: number): Promise<(UserBorder & { border: ProfileBorder }) | undefined> {
    const [border] = await db
      .select()
      .from(profileBorders)
      .where(
        and(
          eq(profileBorders.type, 'streak_reward'),
          eq(profileBorders.tier, tier)
        )
      );

    if (!border) {
      return undefined;
    }

    const existingBorders = await this.getUserBorders(userId);
    if (existingBorders.some(ub => ub.borderId === border.id)) {
      return undefined;
    }

    const [newUserBorder] = await db
      .insert(userBorders)
      .values({ userId, borderId: border.id, isEquipped: false })
      .returning();

    return { ...newUserBorder, border };
  }

  // Admin Broadcast operations
  async createBroadcast(broadcast: InsertAdminBroadcast): Promise<AdminBroadcast> {
    const [newBroadcast] = await db
      .insert(adminBroadcasts)
      .values(broadcast)
      .returning();
    return newBroadcast;
  }

  async getBroadcasts(limit: number = 50): Promise<AdminBroadcast[]> {
    return await db
      .select()
      .from(adminBroadcasts)
      .orderBy(desc(adminBroadcasts.createdAt))
      .limit(limit);
  }

  async getBroadcastById(broadcastId: string): Promise<AdminBroadcast | undefined> {
    const [broadcast] = await db
      .select()
      .from(adminBroadcasts)
      .where(eq(adminBroadcasts.id, broadcastId));
    return broadcast;
  }

  async updateBroadcast(broadcastId: string, updates: Partial<AdminBroadcast>): Promise<AdminBroadcast> {
    const [updated] = await db
      .update(adminBroadcasts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminBroadcasts.id, broadcastId))
      .returning();
    return updated;
  }

  async deleteBroadcast(broadcastId: string): Promise<void> {
    await db.delete(adminBroadcasts).where(eq(adminBroadcasts.id, broadcastId));
  }

  async getAllActiveDeviceTokens(): Promise<DeviceToken[]> {
    return await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.isActive, true));
  }

  async getActiveDeviceTokensByAudience(audience: string): Promise<DeviceToken[]> {
    // Base query for active tokens
    if (audience === 'all') {
      return this.getAllActiveDeviceTokens();
    }

    // For targeted audiences, join with users table
    if (audience === 'active_7d') {
      // Users active in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const results = await db
        .select({ token: deviceTokens })
        .from(deviceTokens)
        .innerJoin(users, eq(deviceTokens.userId, users.id))
        .where(
          and(
            eq(deviceTokens.isActive, true),
            gte(users.updatedAt, sevenDaysAgo)
          )
        );
      return results.map(r => r.token);
    }

    if (audience === 'active_30d') {
      // Users active in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const results = await db
        .select({ token: deviceTokens })
        .from(deviceTokens)
        .innerJoin(users, eq(deviceTokens.userId, users.id))
        .where(
          and(
            eq(deviceTokens.isActive, true),
            gte(users.updatedAt, thirtyDaysAgo)
          )
        );
      return results.map(r => r.token);
    }

    if (audience === 'streak_users') {
      // Users with active login streaks (> 0 days)
      const results = await db
        .select({ token: deviceTokens })
        .from(deviceTokens)
        .innerJoin(loginStreaks, eq(deviceTokens.userId, loginStreaks.userId))
        .where(
          and(
            eq(deviceTokens.isActive, true),
            gt(loginStreaks.currentStreak, 0)
          )
        );
      return results.map(r => r.token);
    }

    // Default to all
    return this.getAllActiveDeviceTokens();
  }
}

export const storage = new DatabaseStorage();
