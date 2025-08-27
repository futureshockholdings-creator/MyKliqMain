-- Performance indexes for MyKliq scaling optimization
-- Run these manually in your database console or via migration

-- Posts table indexes for faster queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_created 
  ON posts(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_desc 
  ON posts(created_at DESC);

-- Friendships table for faster friend lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendships_user1 
  ON friendships(user1_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendships_user2 
  ON friendships(user2_id);

-- Post likes for faster aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_likes_post_user 
  ON post_likes(post_id, user_id);

-- Comments for faster post comment loading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_created 
  ON comments(post_id, created_at);

-- Notifications for faster user notification queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

-- Stories for faster story queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_user_created 
  ON stories(user_id, created_at DESC);

-- Polls for faster poll queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_user_created 
  ON polls(user_id, created_at DESC);

-- Events for faster event queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_user_created 
  ON events(user_id, created_at DESC);

-- Actions for faster action queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actions_user_activity 
  ON actions(user_id, activity_date DESC);

-- Messages for faster message loading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created 
  ON messages(conversation_id, created_at DESC);

-- Content filters for faster filter application
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_filters_user 
  ON content_filters(user_id);

-- Poll votes for faster vote aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_poll_votes_poll_user 
  ON poll_votes(poll_id, user_id);

-- Composite index for kliq feed queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_feed_optimization 
  ON posts(user_id, created_at DESC, content);

-- Index for filtering posts by content (for content filters)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_search 
  ON posts USING gin(to_tsvector('english', content));

-- Additional performance indexes for MyKliq production scaling
-- These indexes target the most critical query patterns after N+1 optimization

-- Messages table optimization for conversation loading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_unread 
  ON messages(receiver_id, is_read, expires_at) WHERE is_read = false;

-- Story views for faster 'hasViewed' checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_story_views_user_story 
  ON story_views(user_id, story_id);

-- Event attendees for faster event details loading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_attendees_event_user 
  ON event_attendees(event_id, user_id);

-- Action viewers for live stream viewer counts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_action_viewers_action_active 
  ON action_viewers(action_id) WHERE left_at IS NULL;

-- Meetup check-ins for faster meetup details
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meetup_checkins_meetup_user 
  ON meetup_checkins(meetup_id, user_id);

-- Video call participants for call management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_call_participants_call_user 
  ON call_participants(call_id, user_id);

-- Conversations for faster IM loading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_user1_activity 
  ON conversations(user1_id, last_activity DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_user2_activity 
  ON conversations(user2_id, last_activity DESC);

-- External posts for social media aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_external_posts_credential_created 
  ON external_posts(social_credential_id, platform_created_at DESC);

-- Birthday messages to avoid duplicates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_birthday_messages_birthday_sender_year 
  ON birthday_messages(birthday_user_id, sender_user_id, year);

-- Active stories cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_expires_at 
  ON stories(expires_at) WHERE expires_at IS NOT NULL;

-- Active polls cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_active_expires 
  ON polls(is_active, expires_at DESC) WHERE is_active = true;

-- Optimized compound indexes for most frequent query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_created_content 
  ON posts(user_id, created_at DESC, content);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendships_composite 
  ON friendships(user1_id, user2_id, status, ranking);