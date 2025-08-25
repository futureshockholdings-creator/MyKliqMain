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