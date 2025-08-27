import { deleteCachePattern } from './redis';

// Cache invalidation patterns for different operations
export async function invalidateUserFeeds(userId: string) {
  // Invalidate user's own feed cache
  await deleteCachePattern(`kliq-feed:${userId}:*`);
  
  // TODO: In production, also invalidate friends' feeds since they see this user's content
  // This would require getting user's friends and invalidating their feeds too
}

export async function invalidateNotificationCache(userId: string) {
  await deleteCachePattern(`notifications:${userId}:*`);
}

export async function invalidateStoriesCache(userId: string) {
  await deleteCachePattern(`stories:${userId}:*`);
}

// Global cache invalidation for posts that affect multiple users
export async function invalidatePostCaches(userId: string) {
  await Promise.all([
    invalidateUserFeeds(userId),
    // Could extend to invalidate friend feeds as well for immediate updates
  ]);
}

export async function invalidatePollCaches(userId: string) {
  await invalidateUserFeeds(userId);
}

export async function invalidateEventCaches(userId: string) {
  await invalidateUserFeeds(userId);
}