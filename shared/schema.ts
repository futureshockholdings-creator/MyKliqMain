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
  pgEnum,
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
  phoneNumber: varchar("phone_number").unique(),
  bio: text("bio"),
  inviteCode: varchar("invite_code", { length: 20 }).unique(),
  kliqName: varchar("kliq_name").default("My Kliq"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User themes for customization
export const userThemes = pgTable("user_themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  primaryColor: varchar("primary_color").default("#FF1493"),
  secondaryColor: varchar("secondary_color").default("#00BFFF"),
  fontFamily: varchar("font_family").default("comic"),
  fontColor: varchar("font_color").default("#FFFFFF"),
  navBgColor: varchar("nav_bg_color").default("#1F2937"),
  navActiveColor: varchar("nav_active_color").default("#FF1493"),
  borderStyle: varchar("border_style").default("retro"),
  enableSparkles: boolean("enable_sparkles").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Friendships with pyramid ranking
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  friendId: varchar("friend_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rank: integer("rank").notNull(), // 1-15, lower number = higher rank
  status: varchar("status").default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Media type enum
export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

// Posts
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content"),
  mediaUrl: varchar("media_url"),
  mediaType: mediaTypeEnum("media_type"),
  likes: integer("likes").default(0),
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
  createdAt: timestamp("created_at").defaultNow(),
});

// Post likes
export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
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
  content: text("content").notNull(),
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

// Event attendees
export const eventAttendees = pgTable("event_attendees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status").default("going"), // going, maybe, not_going
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
  storyViews: many(storyViews),
  contentFilters: many(contentFilters),
  userTheme: one(userThemes),
  sentMessages: many(messages, { relationName: "senderMessages" }),
  receivedMessages: many(messages, { relationName: "receiverMessages" }),
  conversations1: many(conversations, { relationName: "user1Conversations" }),
  conversations2: many(conversations, { relationName: "user2Conversations" }),
  events: many(events),
  eventAttendees: many(eventAttendees),
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
  comments: many(comments),
  likes: many(postLikes),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertUserThemeSchema = createInsertSchema(userThemes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, likes: true, createdAt: true, updatedAt: true });
export const insertStorySchema = createInsertSchema(stories).omit({ id: true, viewCount: true, createdAt: true }).extend({
  expiresAt: z.string().transform((val) => new Date(val))
});
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });
export const insertContentFilterSchema = createInsertSchema(contentFilters).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, isRead: true, createdAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, lastMessageId: true, lastActivity: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, attendeeCount: true, createdAt: true, updatedAt: true }).extend({
  eventDate: z.string().transform((val) => new Date(val))
});
export const insertEventAttendeeSchema = createInsertSchema(eventAttendees).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
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
