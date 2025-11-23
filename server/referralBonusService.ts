import { storage } from "./storage";

export async function processReferralBonuses(): Promise<void> {
  try {
    console.log("🎁 Checking for eligible referral bonuses...");
    
    // Get referral bonuses that are:
    // 1. Status is 'pending'
    // 2. firstLoginAt is not null (user has logged in)
    // 3. signupAt is at least 24 hours ago
    const eligibleBonuses = await storage.getEligibleReferralBonuses();
    
    if (eligibleBonuses.length === 0) {
      console.log("No eligible referral bonuses to award");
      return;
    }
    
    console.log(`Found ${eligibleBonuses.length} eligible referral bonus(es) to award`);
    
    // Award each eligible referral bonus
    for (const bonus of eligibleBonuses) {
      try {
        await storage.awardReferralBonus(bonus.id);
        console.log(`✅ Awarded ${bonus.koinsAwarded} Koins to user ${bonus.inviterId} for referring ${bonus.inviteeId}`);
      } catch (error) {
        console.error(`❌ Failed to award referral bonus ${bonus.id}:`, error);
      }
    }
    
    console.log(`🎉 Referral bonus processing completed - awarded ${eligibleBonuses.length} bonus(es)`);
  } catch (error) {
    console.error("Error in referral bonus service:", error);
  }
}

export function startReferralBonusService(): void {
  console.log("🚀 Starting referral bonus service...");
  
  // Run immediately on startup (after 10 seconds for database to be ready)
  setTimeout(() => {
    processReferralBonuses();
  }, 10000);
  
  // Run every hour (3600000 ms = 1 hour)
  setInterval(processReferralBonuses, 3600000);
}
