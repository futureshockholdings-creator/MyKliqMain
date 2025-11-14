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
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  createdBy: string;
  attendees: string[];
  createdAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
}

export interface CreateEventResponse {
  success: boolean;
  eventId: number;
  message?: string;
}

export interface CalendarNoteData {
  id: number;
  userId: string;
  kliqId?: string;
  date: string;
  note: string;
  createdAt: string;
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

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface NotificationData {
  id: number;
  userId: string;
  type: 'like' | 'comment' | 'message' | 'friend_request' | 'event' | 'birthday' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface NotificationsResponse {
  notifications: NotificationData[];
  unreadCount: number;
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
