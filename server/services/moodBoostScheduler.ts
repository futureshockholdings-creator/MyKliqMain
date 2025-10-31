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
 * Main scheduler function that runs every 30 minutes
 */
export async function runMoodBoostScheduler(): Promise<void> {
  try {
    console.log("🔄 Starting mood boost scheduler...");

    // Step 1: Cleanup expired posts first
    await cleanupExpiredMoodBoostPosts();

    // Step 2: Get active users with mood posts
    const moodUsers = await getActiveUsersWithMood();
    
    console.log(`Found ${moodUsers.length} users with recent mood posts`);

    // Step 3: Generate mood-specific posts for users who posted with mood
    for (const { userId, mood } of moodUsers) {
      await generateMoodBoostPostsForUser(userId, mood);
      // Small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Step 4: Get random users for general uplifting content
    const randomUsers = await getUsersNeedingBoost();
    const selectedRandomUsers = randomUsers
      .sort(() => Math.random() - 0.5)
      .slice(0, 10); // Pick 10 random users for general boosts

    console.log(`Generating general mood boosts for ${selectedRandomUsers.length} random users`);

    // Step 5: Generate general uplifting posts for random users
    for (const userId of selectedRandomUsers) {
      await generateMoodBoostPostsForUser(userId);
      // Small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log("✅ Mood boost scheduler completed successfully");
  } catch (error) {
    console.error("❌ Error in mood boost scheduler:", error);
  }
}

/**
 * Start the mood boost scheduler interval (runs every 30 minutes)
 */
export function startMoodBoostScheduler(): NodeJS.Timeout {
  console.log("🚀 Starting mood boost scheduler service...");
  
  // Run immediately on startup
  runMoodBoostScheduler();
  
  // Then run every 30 minutes
  const interval = setInterval(() => {
    runMoodBoostScheduler();
  }, 30 * 60 * 1000); // 30 minutes in milliseconds

  return interval;
}
