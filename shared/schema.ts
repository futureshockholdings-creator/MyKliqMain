import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
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
  // Kliq Koin - Equipped profile border
  equippedBorderId: varchar("equipped_border_id").references(() => profileBorders.id),
  // Terms acceptance for legal compliance
  termsAcceptedAt: timestamp("terms_accepted_at"),
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

// Border type enum for profile borders
export const borderTypeEnum = pgEnum("border_type", ["streak_reward", "purchasable", "reward"]);

// Engagement type enum for reward borders
export const engagementTypeEnum = pgEnum("engagement_type", ["posts_created", "posts_liked", "mood_updates", "horoscope_posts", "bible_verse_posts"]);

// Transaction type enum for Kliq Koin transactions
export const koinTransactionTypeEnum = pgEnum("koin_transaction_type", ["earned", "spent", "refund"]);

// Profile borders catalog (all available borders)
export const profileBorders = pgTable("profile_borders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Bronze Medal", "Golden Crown"
  type: borderTypeEnum("type").notNull(), // "streak_reward", "purchasable", or "reward"
  cost: integer("cost").notNull().default(0), // Koin cost, 0 for streak rewards
  tier: integer("tier"), // For streak rewards: 3, 7, 30, 90, 180, 365, 730, 1000 days
  postsRequired: integer("posts_required"), // DEPRECATED: Use engagementThreshold instead (will be removed after migration)
  engagementType: engagementTypeEnum("engagement_type"), // Type of engagement: 'posts_created', 'posts_liked', null for non-reward borders
  engagementThreshold: integer("engagement_threshold"), // Number required to unlock: 100, 250, 500
  imageUrl: varchar("image_url").notNull(), // Path to border graphic
  description: text("description"), // Optional description
  isActive: boolean("is_active").notNull().default(true), // For hiding/showing borders
  availableMonth: integer("available_month"), // Month-specific availability (1-12 for Jan-Dec, null for always available)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_borders_type_tier").on(table.type, table.tier), // Fast marketplace queries
  index("idx_borders_active").on(table.isActive), // Filter active borders
]);

// Kliq Koins - User balances
export const kliqKoins = pgTable("kliq_koins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"), // Current Koin balance (supports decimals)
  totalEarned: numeric("total_earned", { precision: 12, scale: 2 }).notNull().default("0"), // Lifetime earnings (supports decimals)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_koins_user").on(table.userId), // Fast user lookup
]);

// Kliq Koin transactions - Audit trail for all Koin activity
export const kliqKoinTransactions = pgTable("kliq_koin_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(), // Positive for earn, negative for spend (supports decimals)
  type: koinTransactionTypeEnum("type").notNull(), // "earned", "spent", "refund"
  source: varchar("source").notNull(), // "daily_login", "purchase_border", "streak_recovery"
  referenceId: varchar("reference_id"), // Related entity ID (borderId, etc)
  balanceAfter: numeric("balance_after", { precision: 12, scale: 2 }).notNull(), // Balance snapshot after transaction (supports decimals)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_transactions_user").on(table.userId), // User's transaction history
  index("idx_transactions_user_date").on(table.userId, table.createdAt), // Sorted history
]);

// Login streaks - Daily login tracking
export const loginStreaks = pgTable("login_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  currentStreak: integer("current_streak").notNull().default(0), // Current consecutive days
  longestStreak: integer("longest_streak").notNull().default(0), // Best streak ever
  lastLoginDate: date("last_login_date"), // Last login date (not timestamp)
  streakFreezes: integer("streak_freezes").notNull().default(0), // Available freeze count
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_streaks_user").on(table.userId), // Fast user lookup
  index("idx_streaks_last_login").on(table.lastLoginDate), // Detect stale streaks
]);

// User borders - Which borders each user owns
export const userBorders = pgTable("user_borders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  borderId: varchar("border_id").references(() => profileBorders.id, { onDelete: "cascade" }).notNull(),
  isEquipped: boolean("is_equipped").notNull().default(false), // Only one can be true per user
  purchasedAt: timestamp("purchased_at").defaultNow(), // When acquired
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_borders_user").on(table.userId), // User's collection
  index("idx_user_borders_equipped").on(table.userId, table.isEquipped), // Find equipped border
]);

// Friendships with pyramid ranking
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  friendId: varchar("friend_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rank: integer("rank").notNull(), // 1-28, lower number = higher rank
  status: varchar("status").default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes for friend lookups
  index("idx_friendships_user").on(table.userId), // Find user's friends
  index("idx_friendships_friend").on(table.friendId), // Find who friended someone
  index("idx_friendships_status").on(table.status), // Filter by friendship status
]);

// Used invite codes - tracks which codes have been used once
export const usedInviteCodes = pgTable("used_invite_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inviteCode: varchar("invite_code", { length: 20 }).unique().notNull(),
  usedBy: varchar("used_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  ownedBy: varchar("owned_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

// Referral bonus status enum
export const referralBonusStatusEnum = pgEnum("referral_bonus_status", ["pending", "completed", "cancelled"]);

// Referral bonuses - tracks invite code referrals and rewards (10 Koins after 24hrs + login)
export const referralBonuses = pgTable("referral_bonuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inviterId: varchar("inviter_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  inviteeId: varchar("invitee_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  signupAt: timestamp("signup_at").defaultNow().notNull(),
  firstLoginAt: timestamp("first_login_at"), // Set when invitee logs in for first time
  awardedAt: timestamp("awarded_at"), // Set when bonus is awarded
  koinsAwarded: integer("koins_awarded").default(10),
  status: referralBonusStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_referral_bonuses_inviter").on(table.inviterId),
  index("idx_referral_bonuses_invitee").on(table.inviteeId),
  index("idx_referral_bonuses_status").on(table.status),
]);

// Educational posts - auto-injected tips for new users (<7 days old)
export const educationalPosts = pgTable("educational_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  featureName: varchar("feature_name").notNull(), // e.g., "Stories", "Kliq Koins", "Referrals"
  icon: varchar("icon").default("💡"), // Emoji icon for the post
  accentColor: varchar("accent_color").default("#3b82f6"), // Hex color for special styling
  priority: integer("priority").default(5), // 1-10, higher = shown more often
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_educational_posts_active").on(table.isActive),
  index("idx_educational_posts_priority").on(table.priority),
]);

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

// Password reset attempt tracking
export const passwordResetAttempts = pgTable("password_reset_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  attemptCount: integer("attempt_count").default(0),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow(),
  lockedUntil: timestamp("locked_until"), // NULL if not locked, timestamp if locked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Mood Boost Posts - AI-generated uplifting content personalized for users
export const moodBoostPosts = pgTable("mood_boost_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(), // The uplifting message
  mood: varchar("mood"), // The user's mood that triggered this (optional, can be null for general boosts)
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-delete after 5 hours
}, (table) => [
  index("idx_mood_boost_user").on(table.userId),
  index("idx_mood_boost_expires").on(table.expiresAt), // For cleanup queries
]);

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
  mood: varchar("mood"),
  likes: integer("likes").default(0),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  locationName: varchar("location_name"),
  address: varchar("address"),
  sharedFromPostId: varchar("shared_from_post_id").references(() => posts.id, { onDelete: "cascade" }),
  originalAuthorId: varchar("original_author_id").references(() => users.id, { onDelete: "cascade" }),
  postType: varchar("post_type").default("regular"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes for kliq-feed optimization
  index("idx_posts_user_created").on(table.userId, table.createdAt), // Combined index for user posts by date
  index("idx_posts_created").on(table.createdAt), // Timeline sorting index
  index("idx_posts_user").on(table.userId), // User filtering index
  index("idx_posts_shared_from").on(table.sharedFromPostId), // Shared post tracking
]);

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
}, (table) => [
  index("idx_stories_user_expires").on(table.userId, table.expiresAt),
  index("idx_stories_expires").on(table.expiresAt),
]);

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

// Scrapbook Albums - for organizing saved posts
export const scrapbookAlbums = pgTable("scrapbook_albums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  color: varchar("color").default("#FF1493"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_scrapbook_albums_user").on(table.userId),
]);

// Scrapbook Saves - saved posts and comments with optional notes
export const scrapbookSaves = pgTable("scrapbook_saves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: varchar("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  albumId: varchar("album_id").references(() => scrapbookAlbums.id, { onDelete: "cascade" }),
  note: text("note"),
  savedAt: timestamp("saved_at").defaultNow(),
}, (table) => [
  index("idx_scrapbook_saves_user").on(table.userId),
  index("idx_scrapbook_saves_post").on(table.postId),
  index("idx_scrapbook_saves_comment").on(table.commentId),
  index("idx_scrapbook_saves_album").on(table.albumId),
]);

// Post Highlights - for highlighting posts with 6hr duration
export const postHighlights = pgTable("post_highlights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull().unique(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  highlightedAt: timestamp("highlighted_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => [
  index("idx_post_highlights_user").on(table.userId),
  index("idx_post_highlights_post").on(table.postId),
  index("idx_post_highlights_expires").on(table.expiresAt),
]);

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
  receiverId: varchar("receiver_id").references(() => users.id, { onDelete: "cascade" }),
  groupConversationId: varchar("group_conversation_id").references(() => groupConversations.id, { onDelete: "cascade" }),
  content: text("content"),
  mediaUrl: varchar("media_url"),
  mediaType: mediaTypeEnum("media_type"),
  gifId: varchar("gif_id").references(() => gifs.id),
  movieconId: varchar("moviecon_id").references(() => moviecons.id),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_messages_group").on(table.groupConversationId),
  index("idx_messages_sender_receiver_created").on(table.senderId, table.receiverId, table.createdAt),
  index("idx_messages_receiver_unread").on(table.receiverId, table.isRead),
]);

// Message conversations for organizing messages between users
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  user2Id: varchar("user2_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lastMessageId: varchar("last_message_id").references(() => messages.id),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_conversations_user1").on(table.user1Id),
  index("idx_conversations_user2").on(table.user2Id),
  index("idx_conversations_activity").on(table.lastActivity),
]);

// Group conversations for multi-user chats
export const groupConversations = pgTable("group_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name"),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lastMessageId: varchar("last_message_id"),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_group_conversations_creator").on(table.creatorId),
  index("idx_group_conversations_activity").on(table.lastActivity),
]);

// Participants in group conversations
export const conversationParticipants = pgTable("conversation_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupConversationId: varchar("group_conversation_id").references(() => groupConversations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  index("idx_conversation_participants_group").on(table.groupConversationId),
  index("idx_conversation_participants_user").on(table.userId),
]);

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
}, (table) => [
  // Performance indexes for kliq-feed optimization
  index("idx_polls_user_created").on(table.userId, table.createdAt), // Combined index for user polls by date
  index("idx_polls_created").on(table.createdAt), // Timeline sorting index
  index("idx_polls_user").on(table.userId), // User filtering index
]);

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
}, (table) => [
  // Performance indexes for kliq-feed optimization
  index("idx_events_user_created").on(table.userId, table.createdAt), // Combined index for user events by date
  index("idx_events_created").on(table.createdAt), // Timeline sorting index
  index("idx_events_user").on(table.userId), // User filtering index
  index("idx_events_event_date").on(table.eventDate), // Event date filtering index
]);

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

// Calendar notes - shared kliq calendar for special dates
export const calendarNotes = pgTable("calendar_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kliqId: varchar("kliq_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // References kliq owner
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // Who created the note
  noteDate: date("note_date").notNull(), // The date this note is for
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  remindKliq: boolean("remind_kliq").default(false), // Send notification on this day
  reminderSent: boolean("reminder_sent").default(false), // Track if reminder was sent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes
  index("idx_calendar_notes_kliq_date").on(table.kliqId, table.noteDate), // Combined index for fetching notes by kliq and date
  index("idx_calendar_notes_date").on(table.noteDate), // Date filtering for reminders
  index("idx_calendar_notes_user").on(table.userId), // User's notes
]);

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
  autoGeneratedPostId: varchar("auto_generated_post_id").references(() => posts.id, { onDelete: "set null" }),
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
  createdGroupConversations: many(groupConversations, { relationName: "createdGroupConversations" }),
  groupConversationParticipants: many(conversationParticipants),
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
  groupConversation: one(groupConversations, {
    fields: [messages.groupConversationId],
    references: [groupConversations.id],
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

export const groupConversationsRelations = relations(groupConversations, ({ one, many }) => ({
  creator: one(users, {
    fields: [groupConversations.creatorId],
    references: [users.id],
    relationName: "createdGroupConversations",
  }),
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  groupConversation: one(groupConversations, {
    fields: [conversationParticipants.groupConversationId],
    references: [groupConversations.id],
  }),
  user: one(users, {
    fields: [conversationParticipants.userId],
    references: [users.id],
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

export const calendarNotesRelations = relations(calendarNotes, ({ one }) => ({
  kliq: one(users, {
    fields: [calendarNotes.kliqId],
    references: [users.id],
  }),
  author: one(users, {
    fields: [calendarNotes.userId],
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
export const insertScrapbookAlbumSchema = createInsertSchema(scrapbookAlbums).omit({ id: true, createdAt: true });
export const insertScrapbookSaveSchema = createInsertSchema(scrapbookSaves).omit({ id: true, savedAt: true });
export const insertPostHighlightSchema = createInsertSchema(postHighlights).omit({ id: true, highlightedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, isRead: true, createdAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, lastMessageId: true, lastActivity: true, createdAt: true });
export const insertGroupConversationSchema = createInsertSchema(groupConversations).omit({ id: true, lastMessageId: true, lastActivity: true, createdAt: true });
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({ id: true, joinedAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, attendeeCount: true, createdAt: true, updatedAt: true }).extend({
  eventDate: z.string().transform((val) => new Date(val))
});
export const insertEventAttendeeSchema = createInsertSchema(eventAttendees).omit({ id: true, createdAt: true });
export const insertEventReminderSchema = createInsertSchema(eventReminders).omit({ id: true, createdAt: true });
export const insertCalendarNoteSchema = createInsertSchema(calendarNotes).omit({ id: true, reminderSent: true, createdAt: true, updatedAt: true }).extend({
  noteDate: z.string().transform((val) => val) // Keep as string for date
});
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

// Kliq Koin system schemas
export const insertProfileBorderSchema = createInsertSchema(profileBorders).omit({ id: true, createdAt: true });
export const insertKliqKoinSchema = createInsertSchema(kliqKoins).omit({ id: true, createdAt: true, updatedAt: true });
export const insertKliqKoinTransactionSchema = createInsertSchema(kliqKoinTransactions).omit({ id: true, createdAt: true });
export const insertLoginStreakSchema = createInsertSchema(loginStreaks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserBorderSchema = createInsertSchema(userBorders).omit({ id: true, createdAt: true });

// Types
export type ProfileBorder = typeof profileBorders.$inferSelect;
export type InsertProfileBorder = z.infer<typeof insertProfileBorderSchema>;
export type KliqKoin = typeof kliqKoins.$inferSelect;
export type InsertKliqKoin = z.infer<typeof insertKliqKoinSchema>;
export type KliqKoinTransaction = typeof kliqKoinTransactions.$inferSelect;
export type InsertKliqKoinTransaction = z.infer<typeof insertKliqKoinTransactionSchema>;
export type LoginStreak = typeof loginStreaks.$inferSelect;
export type InsertLoginStreak = z.infer<typeof insertLoginStreakSchema>;
export type UserBorder = typeof userBorders.$inferSelect;
export type InsertUserBorder = z.infer<typeof insertUserBorderSchema>;

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
export type ScrapbookAlbum = typeof scrapbookAlbums.$inferSelect;
export type InsertScrapbookAlbum = z.infer<typeof insertScrapbookAlbumSchema>;
export type ScrapbookSave = typeof scrapbookSaves.$inferSelect;
export type InsertScrapbookSave = z.infer<typeof insertScrapbookSaveSchema>;
export type PostHighlight = typeof postHighlights.$inferSelect;
export type InsertPostHighlight = z.infer<typeof insertPostHighlightSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type GroupConversation = typeof groupConversations.$inferSelect;
export type InsertGroupConversation = z.infer<typeof insertGroupConversationSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;
export type EventReminder = typeof eventReminders.$inferSelect;
export type InsertEventReminder = z.infer<typeof insertEventReminderSchema>;
export type CalendarNote = typeof calendarNotes.$inferSelect;
export type InsertCalendarNote = z.infer<typeof insertCalendarNoteSchema>;
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

// Social connection rewards - tracks one-time Kliq Koin rewards for connecting platforms
export const socialConnectionRewards = pgTable("social_connection_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  platform: varchar("platform").notNull(), // 'instagram', 'tiktok', 'twitch', 'discord', 'youtube', 'reddit', 'pinterest', 'facebook', 'espn'
  koinsAwarded: numeric("koins_awarded", { precision: 12, scale: 2 }).notNull(), // Amount of Koins awarded (typically 1000)
  awardedAt: timestamp("awarded_at").defaultNow(),
}, (table) => ({
  userIdx: index("idx_social_rewards_user").on(table.userId), // Fast user lookup
  userPlatformUnique: uniqueIndex("idx_social_rewards_unique_user_platform").on(table.userId, table.platform), // Unique constraint to prevent duplicate rewards
}));

// Sports/team connection rewards - tracks one-time Kliq Koin rewards for following sports teams
export const sportsTeamRewards = pgTable("sports_team_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sport: varchar("sport").notNull(), // 'nfl', 'nba', 'mlb', 'nhl', 'soccer'
  teamId: varchar("team_id").notNull(), // ESPN team ID
  teamName: varchar("team_name").notNull(), // For auditing
  koinsAwarded: numeric("koins_awarded", { precision: 12, scale: 2 }).notNull(), // Amount of Koins awarded (100)
  awardedAt: timestamp("awarded_at").defaultNow(),
}, (table) => ({
  userIdx: index("idx_sports_rewards_user").on(table.userId), // Fast user lookup
  userTeamUnique: uniqueIndex("idx_sports_rewards_unique_user_team").on(table.userId, table.teamId), // Unique constraint to prevent duplicate rewards (teamId is globally unique across sports)
}));

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

// Sports preferences - tracks which sports and teams users follow
export const userSportsPreferences = pgTable("user_sports_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sport: varchar("sport").notNull(), // 'nfl', 'nba', 'mlb', 'nhl', 'soccer'
  teamId: varchar("team_id").notNull(), // ESPN team ID
  teamName: varchar("team_name").notNull(),
  teamLogo: varchar("team_logo"),
  teamAbbr: varchar("team_abbr"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_sports_user").on(table.userId),
  index("idx_user_sports_sport").on(table.sport),
]);

// Sports updates cache - stores latest scores and news
export const sportsUpdates = pgTable("sports_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sport: varchar("sport").notNull(),
  eventId: varchar("event_id").notNull(), // ESPN event/game ID
  homeTeamId: varchar("home_team_id").notNull(),
  homeTeamName: varchar("home_team_name").notNull(),
  homeTeamScore: integer("home_team_score"),
  awayTeamId: varchar("away_team_id").notNull(),
  awayTeamName: varchar("away_team_name").notNull(),
  awayTeamScore: integer("away_team_score"),
  status: varchar("status").notNull(), // 'scheduled', 'in_progress', 'final'
  statusDetail: varchar("status_detail"), // e.g. "End of 3rd Quarter", "Final"
  eventDate: timestamp("event_date").notNull(),
  venue: varchar("venue"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_sports_updates_sport").on(table.sport),
  index("idx_sports_updates_event").on(table.eventId),
  index("idx_sports_updates_teams").on(table.homeTeamId, table.awayTeamId),
]);

// Device tokens for push notifications (FCM/APNS)
export const deviceTokens = pgTable("device_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(), // FCM/APNS device token
  platform: varchar("platform").notNull(), // 'ios', 'android', or 'web'
  deviceId: varchar("device_id"), // Optional device identifier
  isActive: boolean("is_active").default(true), // Can be disabled without deleting
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_device_tokens_user").on(table.userId),
  index("idx_device_tokens_active").on(table.isActive),
]);

// Notification delivery preference enum
export const notificationDeliveryPreferenceEnum = pgEnum("notification_delivery_pref", ["immediate", "hourly_digest", "daily_digest"]);

// User notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  newPosts: boolean("new_posts").notNull().default(true),
  comments: boolean("comments").notNull().default(true),
  likes: boolean("likes").notNull().default(true),
  newFriends: boolean("new_friends").notNull().default(true),
  messages: boolean("messages").notNull().default(true),
  storyReplies: boolean("story_replies").notNull().default(true),
  mentions: boolean("mentions").notNull().default(true),
  events: boolean("events").notNull().default(true),
  kliqKoin: boolean("kliq_koin").notNull().default(true),
  deliveryPreference: notificationDeliveryPreferenceEnum("delivery_preference").notNull().default("immediate"),
  snoozedUntil: timestamp("snoozed_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const insertSocialConnectionRewardSchema = createInsertSchema(socialConnectionRewards).omit({ 
  id: true, 
  awardedAt: true 
});
export type InsertSocialConnectionReward = z.infer<typeof insertSocialConnectionRewardSchema>;
export type SocialConnectionReward = typeof socialConnectionRewards.$inferSelect;

export const insertSportsTeamRewardSchema = createInsertSchema(sportsTeamRewards).omit({ 
  id: true, 
  awardedAt: true 
});
export type InsertSportsTeamReward = z.infer<typeof insertSportsTeamRewardSchema>;
export type SportsTeamReward = typeof sportsTeamRewards.$inferSelect;

export const insertExternalPostSchema = createInsertSchema(externalPosts).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertExternalPost = z.infer<typeof insertExternalPostSchema>;
export type ExternalPost = typeof externalPosts.$inferSelect;

// Sports preferences types
export const insertUserSportsPreferenceSchema = createInsertSchema(userSportsPreferences).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertUserSportsPreference = z.infer<typeof insertUserSportsPreferenceSchema>;
export type UserSportsPreference = typeof userSportsPreferences.$inferSelect;

export const insertSportsUpdateSchema = createInsertSchema(sportsUpdates).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});
export type InsertSportsUpdate = z.infer<typeof insertSportsUpdateSchema>;
export type SportsUpdate = typeof sportsUpdates.$inferSelect;

// Device tokens types
export const insertDeviceTokenSchema = createInsertSchema(deviceTokens).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertDeviceToken = z.infer<typeof insertDeviceTokenSchema>;
export type DeviceToken = typeof deviceTokens.$inferSelect;

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

// Password reset attempt types
export const insertPasswordResetAttemptSchema = createInsertSchema(passwordResetAttempts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertPasswordResetAttempt = z.infer<typeof insertPasswordResetAttemptSchema>;
export type PasswordResetAttempt = typeof passwordResetAttempts.$inferSelect;

// Report types
export const insertReportSchema = createInsertSchema(rulesReports).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof rulesReports.$inferSelect;

// Mood Boost Post types
export const insertMoodBoostPostSchema = createInsertSchema(moodBoostPosts).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertMoodBoostPost = z.infer<typeof insertMoodBoostPostSchema>;
export type MoodBoostPost = typeof moodBoostPosts.$inferSelect;

// Notification Preferences types
export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;

// Referral Bonus types
export const insertReferralBonusSchema = createInsertSchema(referralBonuses).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertReferralBonus = z.infer<typeof insertReferralBonusSchema>;
export type ReferralBonus = typeof referralBonuses.$inferSelect;

// Educational Posts types
export const insertEducationalPostSchema = createInsertSchema(educationalPosts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertEducationalPost = z.infer<typeof insertEducationalPostSchema>;
export type EducationalPost = typeof educationalPosts.$inferSelect;
