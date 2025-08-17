import { storage } from "./storage";

// Birthday messages templates
const birthdayMessages = [
  "Hope you have the best day ever! 🎉",
  "Wishing you all the happiness on your special day! 🎂",
  "May all your birthday wishes come true! ✨",
  "Hope your birthday is as amazing as you are! 🌟",
  "Sending you lots of birthday love! ❤️",
  "Have a fantastic birthday celebration! 🎊",
  "May this new year of life bring you joy! 🎈",
  "Hope your special day is filled with happiness! 😊",
  "Wishing you the best birthday ever! 🎁",
  "May your birthday be magical! ✨🎂"
];

export async function sendAutomaticBirthdayMessages(): Promise<void> {
  try {
    console.log("Checking for birthday users...");
    
    // Get users with birthdays today
    const birthdayUsers = await storage.getUsersWithBirthdayToday();
    
    if (birthdayUsers.length === 0) {
      console.log("No birthdays today");
      return;
    }
    
    console.log(`Found ${birthdayUsers.length} birthday user(s)`);
    
    // Get all users (kliq members)
    const allUsers = await storage.getAllUsers();
    const currentYear = new Date().getFullYear();
    
    // Send messages from each kliq member to birthday users
    for (const birthdayUser of birthdayUsers) {
      console.log(`Processing birthday messages for ${birthdayUser.firstName}`);
      
      // Get existing messages sent this year
      const existingMessages = await storage.getBirthdayMessagesSentThisYear(birthdayUser.id, currentYear);
      const senderIds = new Set(existingMessages.map(msg => msg.senderUserId));
      
      // Find kliq members who haven't sent messages yet
      const sendersToProcess = allUsers.filter(user => 
        user.id !== birthdayUser.id && // Don't send to self
        !senderIds.has(user.id) // Haven't sent message this year
      );
      
      console.log(`${sendersToProcess.length} kliq members need to send birthday messages`);
      
      // Send messages from each kliq member
      for (const sender of sendersToProcess) {
        try {
          // Pick a random birthday message
          const randomMessage = birthdayMessages[Math.floor(Math.random() * birthdayMessages.length)];
          
          // Create post for birthday message
          const post = await storage.createPost({
            userId: sender.id,
            content: `🎉 Happy Birthday ${birthdayUser.firstName}! ${randomMessage}`
          });
          
          // Save birthday message record
          await storage.createBirthdayMessage({
            birthdayUserId: birthdayUser.id,
            senderUserId: sender.id,
            message: randomMessage,
            year: currentYear,
            postId: post.id
          });
          
          console.log(`Sent birthday message from ${sender.firstName} to ${birthdayUser.firstName}`);
        } catch (error) {
          console.error(`Failed to send birthday message from ${sender.firstName} to ${birthdayUser.firstName}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error in automatic birthday message service:", error);
  }
}

// Combined cleanup service that handles all expired content
async function runCleanupTasks(): Promise<void> {
  try {
    console.log("Running cleanup tasks...");
    
    // Run all cleanup tasks in parallel
    await Promise.all([
      sendAutomaticBirthdayMessages(),
      storage.deleteExpiredStories(),
      storage.cleanUpExpiredPolls(),
      storage.cleanUpExpiredEvents()
    ]);
    
    console.log("Cleanup tasks completed");
  } catch (error) {
    console.error("Error in cleanup service:", error);
  }
}

// Run cleanup service every hour (in production, run daily at a specific time)
export function startBirthdayService(): void {
  console.log("Starting birthday and cleanup service...");
  
  // Run immediately on startup
  setTimeout(() => {
    runCleanupTasks();
  }, 5000); // Wait 5 seconds for database to be ready
  
  // Run every hour (3600000 ms)
  // In production, you might want to run this daily at midnight
  setInterval(runCleanupTasks, 3600000);
}