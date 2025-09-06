import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  backgroundImageUrl: varchar("background_image_url"),
  phoneNumber: varchar("phone_number"),
  password: varchar("password"), // Hashed password
  // Security questions for password recovery (encrypted)
  securityAnswer1: varchar("security_answer_1", { length: 255 }), // First car
  securityAnswer2: varchar("security_answer_2", { length: 255 }), // Mother's maiden name
  securityAnswer3: varchar("security_answer_3", { length: 255 }), // Favorite teacher's last name
  securityPin: varchar("security_pin", { length: 255 }), // 4-digit PIN (encrypted)
  bio: text("bio"),
  inviteCode: varchar("invite_code", { length: 20 }).unique(),
  kliqName: varchar("kliq_name").default("My Kliq"),
  kliqLeftEmoji: varchar("kliq_left_emoji").default("🏆"),
  kliqRightEmoji: varchar("kliq_right_emoji").default("🏆"),
  kliqClosed: boolean("kliq_closed").default(false),
  birthdate: date("birthdate"),
  profileMusicUrls: text("profile_music_urls").array(),
  profileMusicTitles: text("profile_music_titles").array(),
  // Extended profile details
  interests: text("interests").array(),
  favoriteLocations: text("favorite_locations").array(),
  favoriteFoods: text("favorite_foods").array(),
  musicGenres: text("music_genres").array(),
  relationshipStatus: varchar("relationship_status"), // single, taken, married, complicated, etc.
  hobbies: text("hobbies").array(),
  favoriteMovies: text("favorite_movies").array(),
  favoriteBooks: text("favorite_books").array(),
  petPreferences: varchar("pet_preferences"), // dogs, cats, both, none, other
  lifestyle: varchar("lifestyle"), // active, relaxed, adventurous, homebody, etc.
  // Account suspension fields
  isSuspended: boolean("is_suspended").default(false),
  suspensionType: varchar("suspension_type"), // "24hours", "7days", "30days", "90days", "180days", "banned"
  suspendedAt: timestamp("suspended_at"),
  suspensionExpiresAt: timestamp("suspension_expires_at"),
  // Admin role field
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User themes for customization
export const userThemes = pgTable("user_themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  primaryColor: varchar("primary_color").default("#FF1493"),
  secondaryColor: varchar("secondary_color").default("#00BFFF"),
  fontFamily: varchar("font_family").default("comic"),
  fontColor: varchar("font_color").default("#FFFFFF"),
  navBgColor: varchar("nav_bg_color").default("#1F2937"),
  navActiveColor: varchar("nav_active_color").default("#FF1493"),
  borderStyle: varchar("border_style").default("retro"),
  enableSparkles: boolean("enable_sparkles").default(true),
  backgroundType: varchar("background_type").default("solid"), // 'solid', 'gradient', 'pattern'
  backgroundColor: varchar("background_color").default("#000000"),
  backgroundGradientStart: varchar("background_gradient_start").default("#FF1493"),
  backgroundGradientEnd: varchar("background_gradient_end").default("#00BFFF"),
  backgroundPattern: varchar("background_pattern").default("dots"), // 'dots', 'lines', 'waves', 'geometric'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Friendships with pyramid ranking
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  friendId: varchar("friend_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rank: integer("rank").notNull(), // 1-28, lower number = higher rank
  status: varchar("status").default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Used invite codes - tracks which codes have been used once
export const usedInviteCodes = pgTable("used_invite_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inviteCode: varchar("invite_code", { length: 20 }).unique().notNull(),
  usedBy: varchar("used_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  ownedBy: varchar("owned_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

// Media type enum
export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

// Call status enum
export const callStatusEnum = pgEnum("call_status", ["pending", "active", "ended", "declined"]);

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// GIF database for posts and comments
export const gifs = pgTable("gifs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: varchar("description"),
  url: varchar("url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  tags: varchar("tags").array().default(sql`'{}'::varchar[]`),
  category: varchar("category").notNull().default("general"),
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  trending: boolean("trending").default(false),
  featured: boolean("featured").default(false),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sponsored Ads System
export const adCategoryEnum = pgEnum("ad_category", [
  "food", "fashion", "tech", "entertainment", "travel", "fitness", 
  "beauty", "automotive", "education", "finance", "health", "home", 
  "gaming", "music", "books", "pets", "lifestyle", "sports"
]);

export const adStatusEnum = pgEnum("ad_status", ["active", "paused", "expired", "pending"]);

export const sponsoredAds = pgTable("sponsored_ads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url"),
  videoUrl: varchar("video_url"),
  backgroundColor: varchar("background_color").default("#ffffff"), // Background color for ad
  ctaText: varchar("cta_text").default("Learn More"), // Call-to-action text
  ctaUrl: varchar("cta_url").notNull(), // URL to redirect when clicked
  category: adCategoryEnum("category").notNull(),
  
  // Targeting criteria
  targetInterests: text("target_interests").array().default(sql`'{}'::text[]`),
  targetMusicGenres: text("target_music_genres").array().default(sql`'{}'::text[]`),
  targetRelationshipStatus: varchar("target_relationship_status").array().default(sql`'{}'::varchar[]`),
  targetHobbies: text("target_hobbies").array().default(sql`'{}'::text[]`),
  targetPetPreferences: varchar("target_pet_preferences").array().default(sql`'{}'::varchar[]`),
  targetLifestyle: varchar("target_lifestyle").array().default(sql`'{}'::varchar[]`),
  targetAgeMin: integer("target_age_min"),
  targetAgeMax: integer("target_age_max"),
  
  // Ad management
  status: adStatusEnum("status").default("active"),
  priority: integer("priority").default(1), // Higher number = higher priority
  dailyBudget: numeric("daily_budget", { precision: 10, scale: 2 }),
  costPerClick: numeric("cost_per_click", { precision: 10, scale: 2 }),
  
  // Scheduling
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  
  // Performance tracking
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  
  // Metadata
  advertiserName: varchar("advertiser_name").notNull(),
  advertiserEmail: varchar("advertiser_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ad impressions and clicks tracking
export const adInteractions = pgTable("ad_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id").references(() => sponsoredAds.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  interactionType: varchar("interaction_type").notNull(), // 'impression', 'click'
  timestamp: timestamp("timestamp").defaultNow(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
});

// User ad preferences (allow users to control ad targeting)
export const userAdPreferences = pgTable("user_ad_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  enableTargetedAds: boolean("enable_targeted_ads").default(true),
  blockedCategories: text("blocked_categories").array().default(sql`'{}'::text[]`),
  maxAdsPerDay: integer("max_ads_per_day").default(5),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Memes - custom uploaded meme images and GIFs
export const memes = pgTable("memes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: varchar("description"),
  imageUrl: varchar("image_url").notNull(), // Can be static image or animated GIF
  thumbnailUrl: varchar("thumbnail_url"),
  tags: varchar("tags").array().default(sql`'{}'::varchar[]`),
  category: varchar("category").notNull().default("general"),
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  isAnimated: boolean("is_animated").default(false), // true for GIFs, false for static images
  trending: boolean("trending").default(false),
  featured: boolean("featured").default(false),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Moviecons - short movie clips with sound (3-5 seconds)
export const moviecons = pgTable("moviecons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: varchar("description"),
  videoUrl: varchar("video_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  duration: integer("duration").notNull(), // in seconds, max 5
  tags: varchar("tags").array().default(sql`'{}'::varchar[]`),
  category: varchar("category").notNull().default("general"),
  movieSource: varchar("movie_source"), // e.g., "The Avengers (2012)"
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  trending: boolean("trending").default(false),
  featured: boolean("featured").default(false),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content"),
  mediaUrl: varchar("media_url"),
  mediaType: mediaTypeEnum("media_type"),
  gifId: varchar("gif_id").references(() => gifs.id),
  memeId: varchar("meme_id").references(() => memes.id),
  movieconId: varchar("moviecon_id").references(() => moviecons.id),
  likes: integer("likes").default(0),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  locationName: varchar("location_name"),
  address: varchar("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stories (disappear after 24 hours)
export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content"),
  mediaUrl: varchar("media_url"),
  mediaType: mediaTypeEnum("media_type"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Comments on posts
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  gifId: varchar("gif_id").references(() => gifs.id),
  memeId: varchar("meme_id").references(() => memes.id),
  movieconId: varchar("moviecon_id").references(() => moviecons.id),
  parentCommentId: varchar("parent_comment_id"), // For nested replies
  createdAt: timestamp("created_at").defaultNow(),
});

// Post likes
export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comment likes
export const commentLikes = pgTable("comment_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").references(() => comments.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content filters
export const contentFilters = pgTable("content_filters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  keyword: varchar("keyword").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Story views tracking
export const storyViews = pgTable("story_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").references(() => stories.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Incognito Messages (IM) - Direct messages between kliq members
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content"),
  mediaUrl: varchar("media_url"),
  mediaType: mediaTypeEnum("media_type"),
  gifId: varchar("gif_id").references(() => gifs.id),
  movieconId: varchar("moviecon_id").references(() => moviecons.id),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message conversations for organizing messages between users
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  user2Id: varchar("user2_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lastMessageId: varchar("last_message_id").references(() => messages.id),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Polls table
export const polls = pgTable("polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  options: text("options").array().notNull(), // Array of poll options
  expiresAt: timestamp("expires_at").notNull(), // When the poll expires
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Poll votes table
export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").references(() => polls.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  selectedOption: integer("selected_option").notNull(), // Index of the selected option
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Ensure one vote per user per poll
  index("unique_user_poll_vote").on(table.pollId, table.userId)
]);

// Events with countdown functionality
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  location: varchar("location"),
  eventDate: timestamp("event_date").notNull(),
  mediaUrl: varchar("media_url"),
  mediaType: mediaTypeEnum("media_type"),
  isPublic: boolean("is_public").default(true),
  attendeeCount: integer("attendee_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event reminders for auto-posting daily reminders
export const eventReminders = pgTable("event_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reminderTime: timestamp("reminder_time").notNull(), // Time to send reminder (same time as original post)
  isActive: boolean("is_active").default(true),
  lastReminderSent: timestamp("last_reminder_sent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Action (Live Streams)
export const actionStreamStatusEnum = pgEnum("action_stream_status", ["live", "ended"]);

export const actions = pgTable("actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  status: actionStreamStatusEnum("status").default("live"),
  viewerCount: integer("viewer_count").default(0),
  thumbnailUrl: varchar("thumbnail_url"),
  streamKey: varchar("stream_key").notNull().unique(),
  chatEnabled: boolean("chat_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Action viewers (who's watching the stream)
export const actionViewers = pgTable("action_viewers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actionId: varchar("action_id").references(() => actions.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

// Action chat messages
export const actionChatMessages = pgTable("action_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actionId: varchar("action_id").references(() => actions.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meetups (location-based gatherings)
export const meetups = pgTable("meetups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  locationName: varchar("location_name").notNull(),
  address: text("address"),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 11, scale: 8 }),
  meetupTime: timestamp("meetup_time").notNull(),
  maxAttendees: integer("max_attendees").default(50),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Meetup check-ins (who's at the location)
export const meetupCheckIns = pgTable("meetup_check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetupId: varchar("meetup_id").references(() => meetups.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  checkInTime: timestamp("check_in_time").defaultNow(),
  checkOutTime: timestamp("check_out_time"),
  latitude: numeric("latitude", { precision: 10, scale: 8 }),
  longitude: numeric("longitude", { precision: 11, scale: 8 }),
  isVerified: boolean("is_verified").default(false), // Based on location proximity
});

// Event attendees
export const eventAttendees = pgTable("event_attendees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status").default("going"), // going, maybe, not_going
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification system for in-app alerts and badges
export const notificationTypeEnum = pgEnum("notification_type", [
  "message", "friend_request", "event_invite", "post_like", "comment", "comment_like",
  "story_view", "live_stream", "meetup_invite", "birthday", "incognito_message"
]);

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url"), // URL to navigate when notification is clicked
  relatedId: varchar("related_id"), // ID of related entity (post, message, user, etc)
  relatedType: varchar("related_type"), // Type of related entity
  isRead: boolean("is_read").default(false),
  isVisible: boolean("is_visible").default(true), // Allow hiding notifications
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  expiresAt: timestamp("expires_at"), // Auto-expire notifications
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// User Interaction Analytics for Smart Friend Ranking
export const userInteractionAnalytics = pgTable("user_interaction_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  friendId: varchar("friend_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  
  // Interaction counts (last 30 days)
  messagesSent: integer("messages_sent").default(0),
  messagesReceived: integer("messages_received").default(0),
  postLikesGiven: integer("post_likes_given").default(0),
  postLikesReceived: integer("post_likes_received").default(0),
  commentsGiven: integer("comments_given").default(0),
  commentsReceived: integer("comments_received").default(0),
  commentLikesGiven: integer("comment_likes_given").default(0),
  commentLikesReceived: integer("comment_likes_received").default(0),
  storyViewsGiven: integer("story_views_given").default(0),
  storyViewsReceived: integer("story_views_received").default(0),
  videoCalls: integer("video_calls").default(0),
  liveStreamViews: integer("live_stream_views").default(0),
  meetupAttendanceTogether: integer("meetup_attendance_together").default(0),
  eventAttendanceTogether: integer("event_attendance_together").default(0),
  
  // Time-based metrics (last 30 days)
  totalInteractionTime: integer("total_interaction_time").default(0), // seconds
  averageResponseTime: integer("average_response_time").default(0), // seconds
  lastInteractionAt: timestamp("last_interaction_at"),
  
  // Computed scores
  interactionScore: numeric("interaction_score", { precision: 8, scale: 2 }).default("0.00"),
  consistencyScore: numeric("consistency_score", { precision: 8, scale: 2 }).default("0.00"),
  engagementScore: numeric("engagement_score", { precision: 8, scale: 2 }).default("0.00"),
  overallScore: numeric("overall_score", { precision: 8, scale: 2 }).default("0.00"),
  
  // Ranking suggestion data
  suggestedRank: integer("suggested_rank"),
  currentRank: integer("current_rank"),
  rankChangeJustification: text("rank_change_justification"),
  
  // Metadata
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
  calculationPeriodDays: integer("calculation_period_days").default(30),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Friend Ranking Suggestions System
export const friendRankingSuggestions = pgTable("friend_ranking_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  friendId: varchar("friend_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  
  // Suggestion details
  currentRank: integer("current_rank").notNull(),
  suggestedRank: integer("suggested_rank").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100%
  
  // Justification and reasoning
  primaryReason: varchar("primary_reason").notNull(), // "high_engagement", "frequent_communication", "decreased_activity", etc.
  justificationMessage: text("justification_message").notNull(),
  supportingMetrics: jsonb("supporting_metrics"), // Store detailed metrics as JSON
  
  // Suggestion status
  status: varchar("status").default("pending"), // pending, accepted, dismissed, expired
  isViewed: boolean("is_viewed").default(false),
  
  // Timing
  expiresAt: timestamp("expires_at").notNull(), // Suggestions expire after 7 days
  viewedAt: timestamp("viewed_at"),
  actionTakenAt: timestamp("action_taken_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content Engagement Tracking (for time spent viewing)
export const contentEngagements = pgTable("content_engagements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  contentOwnerId: varchar("content_owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  contentType: varchar("content_type").notNull(), // "post", "story", "profile", "live_stream"
  contentId: varchar("content_id").notNull(), // ID of the content (post, story, etc.)
  
  // Engagement metrics
  viewDuration: integer("view_duration").notNull(), // seconds
  interactionType: varchar("interaction_type"), // "like", "comment", "share", "view_only"
  scrollDepth: numeric("scroll_depth", { precision: 5, scale: 2 }), // 0-100% for posts
  
  // Context
  deviceType: varchar("device_type").default("mobile"), // mobile, desktop, tablet
  sessionId: varchar("session_id"), // For grouping related views
  
  // Timestamps
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  friendships: many(friendships, { relationName: "userFriendships" }),
  friendOf: many(friendships, { relationName: "friendOfUser" }),
  posts: many(posts),
  stories: many(stories),
  comments: many(comments),
  postLikes: many(postLikes),
  commentLikes: many(commentLikes),
  storyViews: many(storyViews),
  contentFilters: many(contentFilters),
  userTheme: one(userThemes),
  sentMessages: many(messages, { relationName: "senderMessages" }),
  receivedMessages: many(messages, { relationName: "receiverMessages" }),
  conversations1: many(conversations, { relationName: "user1Conversations" }),
  conversations2: many(conversations, { relationName: "user2Conversations" }),
  events: many(events),
  eventAttendees: many(eventAttendees),
  actions: many(actions),
  actionViewers: many(actionViewers),
  actionChatMessages: many(actionChatMessages),
  meetups: many(meetups),
  meetupCheckIns: many(meetupCheckIns),
  uploadedGifs: many(gifs),
  uploadedMoviecons: many(moviecons),
  notifications: many(notifications),
  // Smart ranking analytics
  interactionAnalytics: many(userInteractionAnalytics, { relationName: "userInteractionAnalytics" }),
  friendInteractionAnalytics: many(userInteractionAnalytics, { relationName: "friendInteractionAnalytics" }),
  rankingSuggestions: many(friendRankingSuggestions, { relationName: "userRankingSuggestions" }),
  friendRankingSuggestions: many(friendRankingSuggestions, { relationName: "friendRankingSuggestions" }),
  contentEngagements: many(contentEngagements, { relationName: "userContentEngagements" }),
  receivedContentEngagements: many(contentEngagements, { relationName: "contentOwnerEngagements" }),
}));

// GIF Relations
export const gifsRelations = relations(gifs, ({ one, many }) => ({
  uploader: one(users, {
    fields: [gifs.uploadedBy],
    references: [users.id],
  }),
  posts: many(posts),
  comments: many(comments),
}));

// Moviecon Relations
export const movieconsRelations = relations(moviecons, ({ one, many }) => ({
  uploader: one(users, {
    fields: [moviecons.uploadedBy],
    references: [users.id],
  }),
  posts: many(posts),
  comments: many(comments),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  author: one(users, {
    fields: [stories.userId],
    references: [users.id],
  }),
  views: many(storyViews),
}));

export const storyViewsRelations = relations(storyViews, ({ one }) => ({
  story: one(stories, {
    fields: [storyViews.storyId],
    references: [stories.id],
  }),
  user: one(users, {
    fields: [storyViews.userId],
    references: [users.id],
  }),
}));

export const userThemesRelations = relations(userThemes, ({ one }) => ({
  user: one(users, {
    fields: [userThemes.userId],
    references: [users.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "userFriendships",
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "friendOfUser",
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  gif: one(gifs, {
    fields: [posts.gifId],
    references: [gifs.id],
  }),
  moviecon: one(moviecons, {
    fields: [posts.movieconId],
    references: [moviecons.id],
  }),
  comments: many(comments),
  likes: many(postLikes),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  gif: one(gifs, {
    fields: [comments.gifId],
    references: [gifs.id],
  }),
  moviecon: one(moviecons, {
    fields: [comments.movieconId],
    references: [moviecons.id],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: "nestedComments",
  }),
  replies: many(comments, {
    relationName: "nestedComments",
  }),
  likes: many(commentLikes),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentLikes.userId],
    references: [users.id],
  }),
}));

export const contentFiltersRelations = relations(contentFilters, ({ one }) => ({
  user: one(users, {
    fields: [contentFilters.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "senderMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiverMessages",
  }),
  gif: one(gifs, {
    fields: [messages.gifId],
    references: [gifs.id],
  }),
  moviecon: one(moviecons, {
    fields: [messages.movieconId],
    references: [moviecons.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one }) => ({
  user1: one(users, {
    fields: [conversations.user1Id],
    references: [users.id],
    relationName: "user1Conversations",
  }),
  user2: one(users, {
    fields: [conversations.user2Id],
    references: [users.id],
    relationName: "user2Conversations",
  }),
  lastMessage: one(messages, {
    fields: [conversations.lastMessageId],
    references: [messages.id],
  }),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
  author: one(users, {
    fields: [polls.userId],
    references: [users.id],
  }),
  votes: many(pollVotes),
}));

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
  poll: one(polls, {
    fields: [pollVotes.pollId],
    references: [polls.id],
  }),
  voter: one(users, {
    fields: [pollVotes.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  author: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  attendees: many(eventAttendees),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({ one }) => ({
  event: one(events, {
    fields: [eventAttendees.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventAttendees.userId],
    references: [users.id],
  }),
}));

export const actionsRelations = relations(actions, ({ one, many }) => ({
  user: one(users, {
    fields: [actions.userId],
    references: [users.id],
  }),
  viewers: many(actionViewers),
  chatMessages: many(actionChatMessages),
}));

export const actionViewersRelations = relations(actionViewers, ({ one }) => ({
  action: one(actions, {
    fields: [actionViewers.actionId],
    references: [actions.id],
  }),
  user: one(users, {
    fields: [actionViewers.userId],
    references: [users.id],
  }),
}));

export const actionChatMessagesRelations = relations(actionChatMessages, ({ one }) => ({
  action: one(actions, {
    fields: [actionChatMessages.actionId],
    references: [actions.id],
  }),
  user: one(users, {
    fields: [actionChatMessages.userId],
    references: [users.id],
  }),
}));

export const meetupsRelations = relations(meetups, ({ one, many }) => ({
  organizer: one(users, {
    fields: [meetups.userId],
    references: [users.id],
  }),
  checkIns: many(meetupCheckIns),
}));

export const meetupCheckInsRelations = relations(meetupCheckIns, ({ one }) => ({
  meetup: one(meetups, {
    fields: [meetupCheckIns.meetupId],
    references: [meetups.id],
  }),
  user: one(users, {
    fields: [meetupCheckIns.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Smart Ranking Analytics Relations
export const userInteractionAnalyticsRelations = relations(userInteractionAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [userInteractionAnalytics.userId],
    references: [users.id],
    relationName: "userInteractionAnalytics",
  }),
  friend: one(users, {
    fields: [userInteractionAnalytics.friendId],
    references: [users.id],
    relationName: "friendInteractionAnalytics",
  }),
}));

export const friendRankingSuggestionsRelations = relations(friendRankingSuggestions, ({ one }) => ({
  user: one(users, {
    fields: [friendRankingSuggestions.userId],
    references: [users.id],
    relationName: "userRankingSuggestions",
  }),
  friend: one(users, {
    fields: [friendRankingSuggestions.friendId],
    references: [users.id],
    relationName: "friendRankingSuggestions",
  }),
}));

export const contentEngagementsRelations = relations(contentEngagements, ({ one }) => ({
  user: one(users, {
    fields: [contentEngagements.userId],
    references: [users.id],
    relationName: "userContentEngagements",
  }),
  contentOwner: one(users, {
    fields: [contentEngagements.contentOwnerId],
    references: [users.id],
    relationName: "contentOwnerEngagements",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, readAt: true });
export const insertUserThemeSchema = createInsertSchema(userThemes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, likes: true, createdAt: true, updatedAt: true });
export const insertStorySchema = createInsertSchema(stories).omit({ id: true, viewCount: true, createdAt: true }).extend({
  expiresAt: z.string().transform((val) => new Date(val))
});
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });
export const insertCommentLikeSchema = createInsertSchema(commentLikes).omit({ id: true, createdAt: true });
export const insertContentFilterSchema = createInsertSchema(contentFilters).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, isRead: true, createdAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, lastMessageId: true, lastActivity: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, attendeeCount: true, createdAt: true, updatedAt: true }).extend({
  eventDate: z.string().transform((val) => new Date(val))
});
export const insertEventAttendeeSchema = createInsertSchema(eventAttendees).omit({ id: true, createdAt: true });
export const insertEventReminderSchema = createInsertSchema(eventReminders).omit({ id: true, createdAt: true });
export const insertActionSchema = createInsertSchema(actions).omit({ id: true, viewerCount: true, createdAt: true, endedAt: true }).extend({
  streamKey: z.string().optional()
});
export const insertActionViewerSchema = createInsertSchema(actionViewers).omit({ id: true, joinedAt: true, leftAt: true });
export const insertActionChatMessageSchema = createInsertSchema(actionChatMessages).omit({ id: true, createdAt: true });
export const insertMeetupSchema = createInsertSchema(meetups).omit({ id: true, isActive: true, createdAt: true, endedAt: true }).extend({
  meetupTime: z.string().transform((val) => new Date(val))
});
export const insertMeetupCheckInSchema = createInsertSchema(meetupCheckIns).omit({ id: true, checkInTime: true, checkOutTime: true, isVerified: true });

// Smart Friend Ranking Schemas
export const insertUserInteractionAnalyticsSchema = createInsertSchema(userInteractionAnalytics).omit({ 
  id: true, 
  lastCalculatedAt: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertFriendRankingSuggestionSchema = createInsertSchema(friendRankingSuggestions).omit({ 
  id: true, 
  isViewed: true, 
  viewedAt: true, 
  actionTakenAt: true, 
  createdAt: true 
}).extend({
  expiresAt: z.string().transform((val) => new Date(val))
});

export const insertContentEngagementSchema = createInsertSchema(contentEngagements).omit({ 
  id: true, 
  startedAt: true, 
  createdAt: true 
}).extend({
  endedAt: z.string().optional().transform((val) => val ? new Date(val) : undefined)
});

// Types
// Birthday messages to track sent birthday wishes
export const birthdayMessages = pgTable("birthday_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  birthdayUserId: varchar("birthday_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  senderUserId: varchar("sender_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  message: text("message").notNull(),
  year: integer("year").notNull(), // Track year to avoid duplicate messages
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Video calls table
export const videoCalls = pgTable("video_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  initiatorId: varchar("initiator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: callStatusEnum("status").default("pending").notNull(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video call participants table (many-to-many)
export const callParticipants = pgTable("call_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callId: varchar("call_id").references(() => videoCalls.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status").default("invited").notNull(), // invited, joined, declined, left
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Birthday message types
export const insertBirthdayMessageSchema = createInsertSchema(birthdayMessages).omit({ id: true, createdAt: true });
export type InsertBirthdayMessage = z.infer<typeof insertBirthdayMessageSchema>;
export type BirthdayMessage = typeof birthdayMessages.$inferSelect;

// Video call types
export const insertVideoCallSchema = createInsertSchema(videoCalls).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVideoCall = z.infer<typeof insertVideoCallSchema>;
export type VideoCall = typeof videoCalls.$inferSelect;

export const insertCallParticipantSchema = createInsertSchema(callParticipants).omit({ id: true, createdAt: true });
export type InsertCallParticipant = z.infer<typeof insertCallParticipantSchema>;
export type CallParticipant = typeof callParticipants.$inferSelect;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Gif = typeof gifs.$inferSelect;
export type InsertGif = typeof gifs.$inferInsert;
export type Meme = typeof memes.$inferSelect;
export type InsertMeme = typeof memes.$inferInsert;
export type Moviecon = typeof moviecons.$inferSelect;
export type InsertMoviecon = typeof moviecons.$inferInsert;

// GIF Zod schemas
export const insertGifSchema = createInsertSchema(gifs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGifForm = z.infer<typeof insertGifSchema>;

// Meme Zod schemas
export const insertMemeSchema = createInsertSchema(memes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMemeForm = z.infer<typeof insertMemeSchema>;

// Moviecon Zod schemas
export const insertMovieconSchema = createInsertSchema(moviecons).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMovieconForm = z.infer<typeof insertMovieconSchema>;
export type UserTheme = typeof userThemes.$inferSelect;
export type InsertUserTheme = z.infer<typeof insertUserThemeSchema>;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type StoryView = typeof storyViews.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertCommentLike = z.infer<typeof insertCommentLikeSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type ContentFilter = typeof contentFilters.$inferSelect;
export type InsertContentFilter = z.infer<typeof insertContentFilterSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;
export type EventReminder = typeof eventReminders.$inferSelect;
export type InsertEventReminder = z.infer<typeof insertEventReminderSchema>;
export type Action = typeof actions.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;
export type ActionViewer = typeof actionViewers.$inferSelect;
export type InsertActionViewer = z.infer<typeof insertActionViewerSchema>;
export type ActionChatMessage = typeof actionChatMessages.$inferSelect;
export type InsertActionChatMessage = z.infer<typeof insertActionChatMessageSchema>;
export type Meetup = typeof meetups.$inferSelect;
export type InsertMeetup = z.infer<typeof insertMeetupSchema>;
export type MeetupCheckIn = typeof meetupCheckIns.$inferSelect;
export type InsertMeetupCheckIn = z.infer<typeof insertMeetupCheckInSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Poll types
export const insertPollSchema = createInsertSchema(polls).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;

export const insertPollVoteSchema = createInsertSchema(pollVotes).omit({ id: true, createdAt: true });
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;
export type PollVote = typeof pollVotes.$inferSelect;

// Sponsored Ads types and schemas
export const insertSponsoredAdSchema = createInsertSchema(sponsoredAds).omit({ 
  id: true, 
  impressions: true, 
  clicks: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)).optional(),
});
export type InsertSponsoredAd = z.infer<typeof insertSponsoredAdSchema>;
export type SponsoredAd = typeof sponsoredAds.$inferSelect;

export const insertAdInteractionSchema = createInsertSchema(adInteractions).omit({ 
  id: true, 
  timestamp: true 
});
export type InsertAdInteraction = z.infer<typeof insertAdInteractionSchema>;
export type AdInteraction = typeof adInteractions.$inferSelect;

export const insertUserAdPreferencesSchema = createInsertSchema(userAdPreferences).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertUserAdPreferences = z.infer<typeof insertUserAdPreferencesSchema>;
export type UserAdPreferences = typeof userAdPreferences.$inferSelect;

// Social media credentials table for OAuth integration
export const socialCredentials = pgTable("social_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  platform: varchar("platform").notNull(), // 'instagram', 'tiktok', 'twitch', 'discord', 'youtube', 'reddit'
  platformUserId: varchar("platform_user_id").notNull(),
  platformUsername: varchar("platform_username").notNull(),
  encryptedAccessToken: text("encrypted_access_token").notNull(),
  encryptedRefreshToken: text("encrypted_refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  scopes: text("scopes").array(), // OAuth scopes granted
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// External posts aggregated from social media platforms
export const externalPosts = pgTable("external_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  socialCredentialId: varchar("social_credential_id").references(() => socialCredentials.id, { onDelete: "cascade" }).notNull(),
  platform: varchar("platform").notNull(),
  platformPostId: varchar("platform_post_id").notNull(),
  platformUserId: varchar("platform_user_id").notNull(),
  platformUsername: varchar("platform_username").notNull(),
  content: text("content"),
  mediaUrls: text("media_urls").array(),
  thumbnailUrl: varchar("thumbnail_url"),
  postUrl: varchar("post_url").notNull(),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  platformCreatedAt: timestamp("platform_created_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Report status enum
export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed", "resolved", "dismissed"]);

// Reports table for content moderation
export const rulesReports = pgTable("rules-reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportedBy: varchar("reported_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  postAuthorId: varchar("post_author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reason: varchar("reason").notNull(), // "hate", "discrimination", "offensive", "pornographic", "spam", "other"
  description: text("description"), // Optional additional details
  status: reportStatusEnum("status").default("pending").notNull(),
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"), // Admin notes about the review
  actionTaken: varchar("action_taken"), // "none", "warning", "post_removed", "user_suspended", "user_banned"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social media integration schemas
export const insertSocialCredentialSchema = createInsertSchema(socialCredentials).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertSocialCredential = z.infer<typeof insertSocialCredentialSchema>;
export type SocialCredential = typeof socialCredentials.$inferSelect;

export const insertExternalPostSchema = createInsertSchema(externalPosts).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertExternalPost = z.infer<typeof insertExternalPostSchema>;
export type ExternalPost = typeof externalPosts.$inferSelect;

// Smart Friend Ranking Types
export type UserInteractionAnalytics = typeof userInteractionAnalytics.$inferSelect;
export type InsertUserInteractionAnalytics = z.infer<typeof insertUserInteractionAnalyticsSchema>;
export type FriendRankingSuggestion = typeof friendRankingSuggestions.$inferSelect;
export type InsertFriendRankingSuggestion = z.infer<typeof insertFriendRankingSuggestionSchema>;
export type ContentEngagement = typeof contentEngagements.$inferSelect;
export type InsertContentEngagement = z.infer<typeof insertContentEngagementSchema>;

// Password reset token types
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Report types
export const insertReportSchema = createInsertSchema(rulesReports).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof rulesReports.$inferSelect;
