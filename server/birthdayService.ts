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

// Send event reminders for upcoming events
export async function sendEventReminders(): Promise<void> {
  // Event reminder auto-posts disabled per user request
  console.log("Event reminder auto-posts are disabled");
  return;
  
  /* DISABLED CODE:
  try {
    console.log("Checking for event reminders...");
    
    // Get active event reminders that are ready to be sent
    const activeReminders = await storage.getActiveEventReminders();
    
    if (activeReminders.length === 0) {
      console.log("No event reminders to send");
      return;
    }
    
    console.log(`Found ${activeReminders.length} event reminder(s) to send`);
    
    // Send reminder posts for each event
    for (const { reminder, event, user } of activeReminders) {
      try {
        const eventDate = new Date(event.eventDate);
        const now = new Date();
        const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Skip if event has already passed
        if (eventDate <= now) {
          console.log(`Event "${event.title}" has passed, deactivating reminder`);
          await storage.deactivateEventReminder(reminder.id);
          continue;
        }
        
        const formattedDate = eventDate.toLocaleDateString("en-US", { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
          timeZone: 'America/New_York' // Use user's timezone - could be made configurable per user
        });
        const formattedTime = eventDate.toLocaleTimeString("en-US", { 
          hour: 'numeric', 
          minute: '2-digit',
          timeZone: 'America/New_York' // Use user's timezone - could be made configurable per user
        });
        
        let reminderText = '';
        if (daysUntil === 0) {
          reminderText = 'TODAY';
        } else if (daysUntil === 1) {
          reminderText = 'TOMORROW';
        } else {
          reminderText = `in ${daysUntil} days`;
        }
        
        let postContent = `⏰ Event reminder: "${event.title}" is ${reminderText}!`;
        if (event.location) {
          postContent += `\n📍 ${event.location}`;
        }
        postContent += `\n🕒 ${formattedDate} at ${formattedTime}`;
        if (event.description) {
          postContent += `\n\n${event.description}`;
        }
        
        // Create reminder post
        await storage.createPost({
          userId: reminder.userId,
          content: postContent,
          mediaUrl: event.mediaUrl || null,
          mediaType: event.mediaType || null,
        });
        
        // Update the last reminder sent time
        await storage.updateReminderSentTime(reminder.id);
        
        console.log(`Sent event reminder for "${event.title}" to ${user.firstName}`);
      } catch (error) {
        console.error(`Failed to send event reminder for "${event.title}":`, error);
      }
    }
  } catch (error) {
    console.error("Error in event reminder service:", error);
  }
  */
}

// Send calendar reminders for notes with remind_kliq enabled
export async function sendCalendarReminders(): Promise<void> {
  try {
    console.log("Checking for calendar reminders...");
    
    // Get calendar notes for today that have reminders enabled
    const todaysReminders = await storage.getTodaysCalendarReminders();
    
    if (todaysReminders.length === 0) {
      console.log("No calendar reminders to send");
      return;
    }
    
    console.log(`Found ${todaysReminders.length} calendar reminder(s) to send`);
    
    // Send reminder posts for each calendar note
    for (const note of todaysReminders) {
      try {
        // Create a supportive post for the calendar note
        let supportiveMessage = `✨ ${note.title}`;
        if (note.description) {
          supportiveMessage += ` - ${note.description}`;
        }
        
        // Add personalized encouragement based on keywords in the title
        const title = note.title.toLowerCase();
        if (title.includes('surgery') || title.includes('operation')) {
          supportiveMessage = `💙 Sending positive vibes to ${note.author.firstName} for ${note.title} today! Wishing you a smooth recovery! ✨`;
        } else if (title.includes('birthday')) {
          supportiveMessage = `🎉 Happy birthday to ${note.author.firstName}! Hope you have an amazing day! 🎂`;
        } else if (title.includes('job') || title.includes('interview') || title.includes('work')) {
          supportiveMessage = `🌟 Good luck to ${note.author.firstName} on ${note.title} today! You've got this! 💪`;
        } else if (title.includes('exam') || title.includes('test')) {
          supportiveMessage = `📚 Wishing ${note.author.firstName} the best on ${note.title} today! You're going to do great! ✨`;
        } else if (title.includes('graduation')) {
          supportiveMessage = `🎓 Congratulations to ${note.author.firstName} on ${note.title}! So proud of you! 🎉`;
        } else if (title.includes('wedding') || title.includes('anniversary')) {
          supportiveMessage = `💍 Celebrating ${note.author.firstName}'s ${note.title} today! Wishing you all the happiness! 💕`;
        } else {
          supportiveMessage = `⭐ Remember: ${note.title} is today!${note.description ? ` ${note.description}` : ''}`;
        }
        
        // Create the supportive post from the kliq owner
        await storage.createPost({
          userId: note.kliqId, // Post from the kliq owner
          content: supportiveMessage,
        });
        
        // Mark reminder as sent
        await storage.markReminderSent(note.id);
        
        // Send notification to kliq members only
        const { NotificationService } = await import("./notificationService");
        const notificationService = new NotificationService();
        
        // Get kliq members (friends of the kliq owner)
        const kliqMembers = await storage.getFriends(note.kliqId);
        // Notify all friends in the kliq
        for (const friendship of kliqMembers) {
          await notificationService.createNotification({
            userId: friendship.friendId,
            type: 'general',
            title: 'Calendar Reminder',
            message: `${note.title} is today!`,
            relatedId: note.id,
            relatedType: 'calendar_note'
          });
        }
        
        // Also notify the kliq owner
        await notificationService.createNotification({
          userId: note.kliqId,
          type: 'general',
          title: 'Calendar Reminder',
          message: `${note.title} is today!`,
          relatedId: note.id,
          relatedType: 'calendar_note'
        });
        
        console.log(`Sent calendar reminder for "${note.title}"`);
      } catch (error) {
        console.error(`Failed to send calendar reminder for "${note.title}":`, error);
      }
    }
  } catch (error) {
    console.error("Error in calendar reminder service:", error);
  }
}

// Combined cleanup service that handles all expired content
async function runCleanupTasks(): Promise<void> {
  try {
    console.log("Running cleanup tasks...");
    
    // Run all cleanup tasks in parallel
    await Promise.all([
      sendAutomaticBirthdayMessages(),
      sendEventReminders(),
      sendCalendarReminders(),
      storage.deleteExpiredStories(),
      storage.cleanUpExpiredPolls(),
      storage.cleanUpExpiredEvents(),
      storage.checkAndUnsuspendExpiredUsers(),
      // Process intelligent notifications
      (async () => {
        try {
          const { NotificationIntelligence } = await import('./notificationIntelligence');
          const notificationService = new NotificationIntelligence();
          await notificationService.processPendingNotifications();
        } catch (error) {
          console.warn('Failed to process intelligent notifications:', error);
        }
      })()
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