/**
 * Shared API Contracts for MyKliq Web & Mobile
 * 
 * This file defines TypeScript interfaces for all API requests and responses,
 * ensuring type safety and consistency between frontend and backend.
 * 
 * Naming Convention:
 * - Request types: {Feature}{Action}Request
 * - Response types: {Feature}{Action}Response
 * - Data types: {Feature}Data
 */

// ============================================================================
// REAL-TIME & NOTIFICATIONS
// ============================================================================

export interface NotificationData {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'message' | 'friend_request' | 'event' | 'story_view';
  actorId: string;
  actorName: string;
  actorImageUrl?: string;
  targetId?: string; // post ID, message ID, etc.
  content?: string;
  isRead: boolean;
  createdAt: string;
}

export interface RealtimeUpdateMessage {
  type: 'new_post' | 'new_message' | 'new_story' | 'notification' | 'poll_update' | 'friend_online';
  data: any;
  timestamp: string;
}

export interface MobileUpdatesResponse {
  hasNewPosts: boolean;
  hasNewMessages: boolean;
  hasNewStories: boolean;
  unreadMessageCount: number;
  newPostCount: number;
  newStoryCount: number;
  lastChecked: string;
}

// ============================================================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================================================

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  birthdate: string;
  inviteCode?: string;
}

export interface SignupResponse {
  success: boolean;
  userId: string;
  message?: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  backgroundImageUrl?: string;
  bio?: string;
  pronouns?: string;
  zodiacSign?: string;
  birthdate?: string;
  isPrivate?: boolean;
  kliqName?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  pronouns?: string;
  isPrivate?: boolean;
  backgroundImageUrl?: string;
  profileImageUrl?: string;
}

// ============================================================================
// POSTS & FEED
// ============================================================================

export interface PostData {
  id: number;
  userId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'youtube';
  youtubeUrl?: string;
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  comments?: CommentData[];
}

export interface CreatePostRequest {
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'youtube';
  youtubeUrl?: string;
}

export interface CreatePostResponse {
  success: boolean;
  postId: number;
  message?: string;
}

export interface FeedResponse {
  posts: PostData[];
  hasMore: boolean;
  nextCursor?: string;
}

// ============================================================================
// COMMENTS
// ============================================================================

export interface CommentData {
  id: number;
  postId: number;
  userId: string;
  content: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  replies?: CommentData[];
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number;
}

export interface CreateCommentResponse {
  success: boolean;
  commentId: number;
  message?: string;
}

// ============================================================================
// MESSAGING
// ============================================================================

export interface MessageData {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'gif';
  createdAt: string;
  isRead: boolean;
}

export interface ConversationData {
  id: number;
  user1Id: string;
  user2Id: string;
  lastMessageId?: number;
  lastActivity: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

export interface ConversationsResponse {
  conversations: ConversationData[];
}

export interface MessagesResponse {
  messages: MessageData[];
}

export interface SendMessageRequest {
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'gif';
}

export interface SendMessageResponse {
  success: boolean;
  message: MessageData;
}

// ============================================================================
// STORIES
// ============================================================================

export interface StoryData {
  id: number;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  content?: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
}

export interface StoryGroupData {
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  stories: StoryData[];
}

export interface StoriesResponse {
  storyGroups: StoryGroupData[];
}

export interface CreateStoryRequest {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
}

export interface CreateStoryResponse {
  success: boolean;
  storyId: number;
  mediaUrl: string;
  expiresAt: string;
  message?: string;
}

// ============================================================================
// FRIENDS & HIERARCHY
// ============================================================================

export interface FriendData {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  bio?: string;
  kliqName?: string;
  ranking?: number;
  lastInteraction?: string;
  tier?: 'inner' | 'core' | 'outer'; // Hierarchy tier
}

export interface FriendsResponse {
  friends: FriendData[];
}

export interface UpdateFriendRankingRequest {
  friendId: string;
  ranking: number; // 1-10 scale
  tier?: 'inner' | 'core' | 'outer';
}

export interface UpdateFriendRankingResponse {
  success: boolean;
  friend: FriendData;
}

// ============================================================================
// POST SHARING
// ============================================================================

export interface SharePostRequest {
  postId: number;
  caption?: string;
}

export interface SharePostResponse {
  success: boolean;
  sharedPostId: number;
  message?: string;
}

// ============================================================================
// POLLS
// ============================================================================

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
}

export interface PollData {
  id: number;
  userId: string;
  question: string;
  options: PollOption[];
  expiresAt?: string;
  totalVotes: number;
  hasVoted: boolean;
  userVote?: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export interface CreatePollRequest {
  question: string;
  options: string[];
  expiresAt?: string;
}

export interface CreatePollResponse {
  success: boolean;
  pollId: number;
  message?: string;
}

export interface VotePollRequest {
  optionId: string;
}

export interface VotePollResponse {
  success: boolean;
  poll: PollData;
}

// ============================================================================
// EVENTS & CALENDAR
// ============================================================================

export interface EventData {
  id: string;
  userId: string;
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  mediaUrl?: string;
  attendeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  mediaUrl?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  eventDate?: string;
  location?: string;
  mediaUrl?: string;
}

export interface EventsResponse {
  events: EventData[];
}

export interface CreateEventResponse {
  success: boolean;
  eventId: string;
  message?: string;
}

export interface CalendarNoteData {
  id: string;
  kliqId: string;
  userId: string;
  noteDate: string;
  title: string;
  description?: string;
  remindKliq: boolean;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarNoteRequest {
  kliqId: string;
  noteDate: string;
  title: string;
  description?: string;
  remindKliq: boolean;
}

export interface UpdateCalendarNoteRequest {
  title?: string;
  description?: string;
  remindKliq?: boolean;
}

export interface CalendarNotesResponse {
  notes: CalendarNoteData[];
}

// ============================================================================
// KLIQ KOIN & STREAKS
// ============================================================================

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckIn?: string;
  totalKoins: number;
  tier: 'Starter' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Champion' | 'Legend';
  tierProgress: number;
  nextTierKoins: number;
}

export interface CheckInResponse {
  success: boolean;
  streak: StreakData;
  koinsEarned: number;
  message: string;
}

export interface BorderData {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  tier: string;
}

// ============================================================================
// MOVIECONS (VIDEO REACTIONS)
// ============================================================================

export interface MovieconData {
  id: string;
  userId: string;
  postId?: number;
  videoUrl: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export interface CreateMovieconRequest {
  postId?: number;
  videoData: string; // Base64 or media ID
}

export interface CreateMovieconResponse {
  success: boolean;
  movieconId: string;
  videoUrl: string;
}

// ============================================================================
// INCOGNITO MESSAGING
// ============================================================================

export interface IncognitoMessageData {
  id: string;
  senderId: string;
  receiverId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'gif';
  expiresAt: string; // 7 days from creation
  isRead: boolean;
  createdAt: string;
}

export interface SendIncognitoMessageRequest {
  receiverId: string;
  content?: string;
  mediaId?: string;
}

export interface SendIncognitoMessageResponse {
  success: boolean;
  messageId: string;
  expiresAt: string;
}

// Note: NotificationData is defined in REAL-TIME & NOTIFICATIONS section above

// ============================================================================
// GPS MEETUPS
// ============================================================================

export interface MeetupLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  checkInCount: number;
  lastCheckIn: string;
}

export interface CheckInRequest {
  latitude: number;
  longitude: number;
  locationName?: string;
  caption?: string;
}

export interface CheckInResponse {
  success: boolean;
  postId: string;
  locationName: string;
}

export interface NearbyMeetupsRequest {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

export interface NearbyMeetupsResponse {
  locations: MeetupLocation[];
}

export interface MeetupHistoryResponse {
  checkIns: Array<{
    id: string;
    locationName: string;
    latitude: number;
    longitude: number;
    checkedInAt: string;
    postId?: string;
  }>;
}

// ============================================================================
// SPORTS SCORES
// ============================================================================

export interface TeamData {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  sport: string;
  league: string;
}

export interface ScoreData {
  id: string;
  homeTeam: TeamData;
  awayTeam: TeamData;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'final';
  startTime: string;
  quarter?: string;
  timeRemaining?: string;
}

export interface FollowTeamRequest {
  teamId: string;
  teamName: string;
  league: string;
}

export interface UserTeamsResponse {
  teams: TeamData[];
}

export interface LiveScoresResponse {
  scores: ScoreData[];
  lastUpdated: string;
}

export interface TeamScoresRequest {
  teamId: string;
  limit?: number;
}

export interface TeamScoresResponse {
  scores: ScoreData[];
  team: TeamData;
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

export interface RegisterDeviceRequest {
  deviceToken: string;
  platform: 'ios' | 'android';
  deviceId: string;
}

export interface RegisterDeviceResponse {
  success: boolean;
  message: string;
}

export interface NotificationPreferences {
  newMessages: boolean;
  newPosts: boolean;
  eventReminders: boolean;
  friendRequests: boolean;
  likes: boolean;
  comments: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  preferences: Partial<NotificationPreferences>;
}

export interface GetNotificationPreferencesResponse {
  preferences: NotificationPreferences;
}

// ============================================================================
// SOCIAL MEDIA INTEGRATION
// ============================================================================

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface SocialPost {
  id: string;
  platform: 'tiktok' | 'youtube' | 'twitch' | 'discord' | 'reddit' | 'pinterest' | 'linkedin';
  content: string;
  mediaUrl?: string;
  platformPostId: string;
  originalUrl: string;
  createdAt: string;
  metadata?: any;
}

export interface ConnectedAccount {
  id: number;
  platform: string;
  platformUserId: string;
  platformUsername?: string;
  connectedAt: string;
}

export interface SocialAccountsResponse {
  accounts: ConnectedAccount[];
}

// ============================================================================
// SPORTS
// ============================================================================

export interface SportsTeam {
  id: string;
  name: string;
  sport: string;
  league: string;
  logoUrl?: string;
}

export interface SportsUpdate {
  gameId: string;
  homeTeam: SportsTeam;
  awayTeam: SportsTeam;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'final';
  startTime: string;
  sport: string;
}

export interface SportsPreference {
  id: number;
  userId: string;
  teamId: string;
  teamName: string;
  sport: string;
  league: string;
}

export interface SportsUpdatesResponse {
  updates: SportsUpdate[];
}

// ============================================================================
// AI & MOOD BOOST
// ============================================================================

export interface MoodBoostPost {
  id: string;
  content: string;
  mood: string;
  generatedAt: string;
  expiresAt: string;
  priority: number;
}

export interface MoodBoostResponse {
  posts: MoodBoostPost[];
}

// ============================================================================
// DAILY CONTENT (Phase 3)
// ============================================================================

export interface HoroscopeResponse {
  sign: string;
  date: string;
  horoscope: string;
  luckyNumber: number;
  luckyColor: string;
}

export interface BibleVerseResponse {
  date: string;
  verse: string;
  reference: string;
  reflection: string;
}

// ============================================================================
// LIVE STREAMING (Actions) - Phase 3
// ============================================================================

export interface ActionAuthor {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export interface ActionData {
  id: string;
  userId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'live' | 'ended';
  viewerCount: number;
  streamKey?: string; // Only included for creator
  createdAt: string;
  endedAt?: string;
  author?: ActionAuthor;
}

export interface CreateActionRequest {
  title: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface CreateActionResponse {
  id: string;
  streamKey: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'live' | 'ended';
  createdAt: string;
}

export interface ActionsListResponse {
  actions: ActionData[];
}

export interface ActionChatMessage {
  id: string;
  actionId: string;
  userId: string;
  message: string;
  createdAt: string;
}

export interface ActionChatResponse {
  messages: ActionChatMessage[];
}

export interface SendActionChatRequest {
  message: string;
}

export interface SendActionChatResponse {
  id: string;
  message: string;
  createdAt: string;
}

export interface EndActionResponse {
  success: boolean;
  endedAt: string;
}

// ============================================================================
// COMMON RESPONSE TYPES
// ============================================================================

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
  total?: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    cache: 'up' | 'down';
  };
}
