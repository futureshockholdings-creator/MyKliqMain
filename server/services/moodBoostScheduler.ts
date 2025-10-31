import { db } from "../db";
import { users, posts } from "../../shared/schema";
import { sql, gt } from "drizzle-orm";
import { generateMoodBoostPostsForUser, cleanupExpiredMoodBoostPosts } from "./moodBoostService";

/**
 * Get active users who have posted with a mood in the last 24 hours
 */
async function getActiveUsersWithMood(): Promise<Array<{ userId: string; mood: string | null }>> {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Find users who posted with a mood in the last 24 hours using raw SQL
    const activeMoodUsers = await db.execute<{ userId: string; mood: string | null }>(sql`
      SELECT DISTINCT
        user_id as "userId",
        REGEXP_REPLACE(content, '.*MOOD: Feeling ([a-z ]+).*', '\\1', 'i') as mood
      FROM ${posts}
      WHERE 
        created_at > ${oneDayAgo}
        AND content LIKE '%MOOD: Feeling%'
      LIMIT 100
    `);

    return activeMoodUsers.rows.filter(u => u.mood !== null) as Array<{ userId: string; mood: string }>;
  } catch (error) {
    console.error("Error getting active users with mood:", error);
    return [];
  }
}

/**
 * Get all users who don't have recent mood boost posts (for general uplifting content)
 */
async function getUsersNeedingBoost(): Promise<string[]> {
  try {
    // Get users who are active (have posts) but don't have recent mood boosts
    const allUsers = await db
      .select({ id: users.id })
      .from(users)
      .limit(50); // Limit to 50 users per run for general boosts

    return allUsers.map(u => u.id);
  } catch (error) {
    console.error("Error getting users needing boost:", error);
    return [];
  }
}

/**
 * Cleanup scheduler function that runs every 30 minutes
 * Note: Mood boost posts are now generated on-demand when users post with mood
 */
export async function runMoodBoostCleanup(): Promise<void> {
  try {
    console.log("🧹 Running mood boost cleanup...");
    await cleanupExpiredMoodBoostPosts();
    console.log("✅ Mood boost cleanup completed");
  } catch (error) {
    console.error("❌ Error in mood boost cleanup:", error);
  }
}

/**
 * Start the mood boost cleanup scheduler (runs every 30 minutes)
 * Note: Mood boost generation is now triggered on-demand when users post with mood
 */
export function startMoodBoostScheduler(): NodeJS.Timeout {
  console.log("🚀 Starting mood boost cleanup service...");
  
  // Run cleanup immediately on startup
  runMoodBoostCleanup();
  
  // Then run cleanup every 30 minutes
  const interval = setInterval(() => {
    runMoodBoostCleanup();
  }, 30 * 60 * 1000); // 30 minutes in milliseconds

  return interval;
}

/**
 * Trigger mood boost generation for a user based on their mood post
 * This is called when a user posts with a mood
 */
export async function triggerMoodBoostForUser(userId: string, mood: string): Promise<void> {
  try {
    console.log(`✨ Generating mood boost posts for user ${userId} with mood: ${mood}`);
    await generateMoodBoostPostsForUser(userId, mood);
  } catch (error) {
    console.error("Error triggering mood boost for user:", error);
  }
}
