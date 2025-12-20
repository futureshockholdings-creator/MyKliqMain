import { db, pool } from "./db";
import { loginStreaks, userBorders, profileBorders, users } from "@shared/schema";
import { eq, and, sql, gte } from "drizzle-orm";

const STREAK_TIERS = [3, 7, 30, 90, 180, 365, 730, 1000];
const REFERRAL_THRESHOLDS = [1, 5, 10, 25, 50];

export async function reconcileUserBorders(userId: string): Promise<{
  streakBordersAwarded: number;
  referralBordersAwarded: number;
  sportsBordersAwarded: number;
}> {
  let streakBordersAwarded = 0;
  let referralBordersAwarded = 0;
  let sportsBordersAwarded = 0;

  // Process streak borders
  try {
    const [userStreak] = await db
      .select()
      .from(loginStreaks)
      .where(eq(loginStreaks.userId, userId));

    if (userStreak) {
      const currentStreak = userStreak.currentStreak;
      
      for (const tier of STREAK_TIERS) {
        if (currentStreak >= tier) {
          try {
            const awarded = await awardStreakBorderIfMissing(userId, tier);
            if (awarded) streakBordersAwarded++;
          } catch (tierError) {
            console.error(`Error awarding streak tier ${tier} for user ${userId}:`, tierError);
          }
        }
      }
    }
  } catch (streakError) {
    console.error(`Error processing streak borders for user ${userId}:`, streakError);
  }

  // Process referral borders
  try {
    const referralCount = await getUserReferralCount(userId);
    for (const threshold of REFERRAL_THRESHOLDS) {
      if (referralCount >= threshold) {
        try {
          const awarded = await awardReferralBorderIfMissing(userId, threshold);
          if (awarded) referralBordersAwarded++;
        } catch (refError) {
          console.error(`Error awarding referral tier ${threshold} for user ${userId}:`, refError);
        }
      }
    }
  } catch (referralError) {
    console.error(`Error processing referral borders for user ${userId}:`, referralError);
  }

  // Process sports team borders
  try {
    const sportsAwarded = await awardSportsTeamBordersIfMissing(userId);
    sportsBordersAwarded = sportsAwarded;
  } catch (sportsError) {
    console.error(`Error processing sports borders for user ${userId}:`, sportsError);
  }

  return { streakBordersAwarded, referralBordersAwarded, sportsBordersAwarded };
}

async function awardStreakBorderIfMissing(userId: string, tier: number): Promise<boolean> {
  const [border] = await db
    .select()
    .from(profileBorders)
    .where(
      and(
        eq(profileBorders.type, 'streak_reward'),
        eq(profileBorders.tier, tier)
      )
    );

  if (!border) {
    console.log(`No streak border found for tier ${tier}`);
    return false;
  }

  const [existing] = await db
    .select()
    .from(userBorders)
    .where(
      and(
        eq(userBorders.userId, userId),
        eq(userBorders.borderId, border.id)
      )
    );

  if (existing) {
    return false;
  }

  await db.insert(userBorders).values({
    userId,
    borderId: border.id,
    isEquipped: false,
  });

  console.log(`✅ Awarded streak tier ${tier} border to user ${userId}`);
  return true;
}

async function getUserReferralCount(userId: string): Promise<number> {
  // Count completed referral bonuses where this user is the inviter
  // Using raw pool query to avoid ORM issues with enum types
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int as count FROM referral_bonuses WHERE inviter_id = $1 AND status = 'completed'`,
      [userId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('Error getting referral count:', error);
    return 0;
  }
}

async function awardReferralBorderIfMissing(userId: string, threshold: number): Promise<boolean> {
  const [border] = await db
    .select()
    .from(profileBorders)
    .where(
      and(
        eq(profileBorders.type, 'referral'),
        eq(profileBorders.tier, threshold)
      )
    );

  if (!border) {
    console.log(`No referral border found for threshold ${threshold}`);
    return false;
  }

  const [existing] = await db
    .select()
    .from(userBorders)
    .where(
      and(
        eq(userBorders.userId, userId),
        eq(userBorders.borderId, border.id)
      )
    );

  if (existing) {
    return false;
  }

  await db.insert(userBorders).values({
    userId,
    borderId: border.id,
    isEquipped: false,
  });

  console.log(`✅ Awarded referral tier ${threshold} border to user ${userId}`);
  return true;
}

async function awardSportsTeamBordersIfMissing(userId: string): Promise<number> {
  let awarded = 0;

  // Get sports team preferences from the user_sports_preferences table
  const userTeamsResult = await pool.query(
    'SELECT team_name FROM user_sports_preferences WHERE user_id = $1',
    [userId]
  );

  if (!userTeamsResult.rows || userTeamsResult.rows.length === 0) {
    return 0;
  }

  const teamNames = userTeamsResult.rows.map((row: any) => row.team_name as string);

  const sportsBorders = await db
    .select()
    .from(profileBorders)
    .where(eq(profileBorders.type, 'sports_team'));

  for (const border of sportsBorders) {
    const borderTeamName = border.name.replace(' Fan', '').replace(' Border', '');
    
    const userFollowsTeam = teamNames.some(team => {
      const normalizedTeam = team.toLowerCase().trim();
      const normalizedBorderTeam = borderTeamName.toLowerCase().trim();
      return normalizedTeam.includes(normalizedBorderTeam) || normalizedBorderTeam.includes(normalizedTeam);
    });

    if (userFollowsTeam) {
      const [existing] = await db
        .select()
        .from(userBorders)
        .where(
          and(
            eq(userBorders.userId, userId),
            eq(userBorders.borderId, border.id)
          )
        );

      if (!existing) {
        await db.insert(userBorders).values({
          userId,
          borderId: border.id,
          isEquipped: false,
        });

        console.log(`✅ Awarded sports team border "${border.name}" to user ${userId}`);
        awarded++;
      }
    }
  }

  return awarded;
}

export async function reconcileAllUsersWithStreaks(): Promise<{
  usersProcessed: number;
  totalStreakBorders: number;
  totalReferralBorders: number;
  totalSportsBorders: number;
}> {
  console.log('🔄 Starting border reconciliation for all users with active streaks...');

  const usersWithStreaks = await db
    .select({ userId: loginStreaks.userId, currentStreak: loginStreaks.currentStreak })
    .from(loginStreaks)
    .where(gte(loginStreaks.currentStreak, 3));

  let usersProcessed = 0;
  let totalStreakBorders = 0;
  let totalReferralBorders = 0;
  let totalSportsBorders = 0;

  for (const user of usersWithStreaks) {
    const result = await reconcileUserBorders(user.userId);
    totalStreakBorders += result.streakBordersAwarded;
    totalReferralBorders += result.referralBordersAwarded;
    totalSportsBorders += result.sportsBordersAwarded;
    usersProcessed++;
  }

  console.log(`✅ Border reconciliation complete: ${usersProcessed} users processed`);
  console.log(`   Streak borders awarded: ${totalStreakBorders}`);
  console.log(`   Referral borders awarded: ${totalReferralBorders}`);
  console.log(`   Sports borders awarded: ${totalSportsBorders}`);

  return { usersProcessed, totalStreakBorders, totalReferralBorders, totalSportsBorders };
}
