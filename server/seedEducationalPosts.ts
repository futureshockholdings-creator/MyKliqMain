import { db } from './db';
import { educationalPosts } from '@shared/schema';

/**
 * Seed database with educational posts for new users
 * These posts appear in feeds for users < 7 days old
 */
export async function seedEducationalPosts() {
  console.log('Seeding educational posts...');

  const posts = [
    {
      title: '📖 Discover Stories - Share Your Moments!',
      content: 'Stories disappear after 24 hours, perfect for sharing quick updates, photos, or videos with your kliq! Swipe through stories from your closest friends and see what they\'re up to right now.',
      featureName: 'Stories',
      icon: '📖',
      accentColor: '#8b5cf6', // Purple
      priority: 10,
      isActive: true,
    },
    {
      title: '💰 Earn Kliq Koins Every Day!',
      content: 'Log in daily to build your streak and earn Kliq Koins! Use them to unlock exclusive profile borders and customizations. The longer your streak, the more Koins you earn.',
      featureName: 'Kliq Koins',
      icon: '💰',
      accentColor: '#f59e0b', // Amber
      priority: 10,
      isActive: true,
    },
    {
      title: '🎁 Get 10 Koins Per Friend You Refer!',
      content: 'Share your invite code from the MyKliq page and earn 10 Kliq Koins for every friend who joins and logs in! It\'s that simple. Help grow your kliq and get rewarded.',
      featureName: 'Referrals',
      icon: '🎁',
      accentColor: '#10b981', // Green
      priority: 9,
      isActive: true,
    },
    {
      title: '👥 Rank Your 28 Closest Friends',
      content: 'MyKliq lets you rank your friends 1-28, with lower numbers meaning closer friends. Your feed shows posts from higher-ranked friends more prominently. Keep your inner circle truly close!',
      featureName: 'Friend Rankings',
      icon: '👥',
      accentColor: '#3b82f6', // Blue
      priority: 9,
      isActive: true,
    },
    {
      title: '🎭 Send Messages That Auto-Delete',
      content: 'Incognito messages automatically delete after 7 days - perfect for temporary chats, jokes, or just keeping your conversations private and clutter-free!',
      featureName: 'Incognito Messaging',
      icon: '🎭',
      accentColor: '#ef4444', // Red
      priority: 8,
      isActive: true,
    },
    {
      title: '🗳️ Create Polls & Get Instant Feedback',
      content: 'Ask your kliq anything with polls! Get quick opinions on decisions, plan activities, or just have fun. See live results and who voted for what.',
      featureName: 'Polls',
      icon: '🗳️',
      accentColor: '#06b6d4', // Cyan
      priority: 8,
      isActive: true,
    },
    {
      title: '📅 Never Miss an Event',
      content: 'Create events, set reminders, and see who\'s attending. Your kliq calendar keeps everyone in sync for hangouts, parties, and special occasions!',
      featureName: 'Events & Calendar',
      icon: '📅',
      accentColor: '#ec4899', // Pink
      priority: 7,
      isActive: true,
    },
    {
      title: '🎬 React with Moviecons!',
      content: 'Moviecons are 5-second video reactions that bring your posts to life! Use them instead of regular emojis to show exactly how you feel.',
      featureName: 'Moviecons',
      icon: '🎬',
      accentColor: '#a855f7', // Purple
      priority: 7,
      isActive: true,
    },
    {
      title: '🏆 Follow Your Favorite Sports Teams',
      content: 'Get real-time scores and updates for NFL, NBA, MLB, NHL, and MLS! Personalize your feed with the teams you care about most.',
      featureName: 'Sports Scores',
      icon: '🏆',
      accentColor: '#f97316', // Orange
      priority: 6,
      isActive: true,
    },
    {
      title: '🎨 Customize Your Theme',
      content: 'Make MyKliq truly yours! Choose from countless themes, backgrounds, fonts, and color schemes. Hit "Surprise Me" for a random fresh look anytime.',
      featureName: 'Themes',
      icon: '🎨',
      accentColor: '#14b8a6', // Teal
      priority: 6,
      isActive: true,
    },
    {
      title: '🔥 Maintain Your Login Streak',
      content: 'Don\'t break the chain! Log in daily to keep your streak alive and earn bonus Koins. Higher streaks unlock exclusive profile borders that show your dedication.',
      featureName: 'Login Streaks',
      icon: '🔥',
      accentColor: '#dc2626', // Red
      priority: 7,
      isActive: true,
    },
    {
      title: '📸 Share Photos, Videos & More',
      content: 'Post photos, videos, YouTube links, GIFs, memes, and even Moviecons! Express yourself with rich media that makes your feed come alive.',
      featureName: 'Rich Media',
      icon: '📸',
      accentColor: '#8b5cf6', // Purple
      priority: 6,
      isActive: true,
    },
    {
      title: '🎯 Filter What You See',
      content: 'Use content filters to hide posts with certain keywords. Keep your feed clean and focused on what matters to you. Customize your experience!',
      featureName: 'Content Filters',
      icon: '🎯',
      accentColor: '#6366f1', // Indigo
      priority: 5,
      isActive: true,
    },
    {
      title: '💬 Chat 1-on-1 with Friends',
      content: 'Direct messages let you have private conversations with anyone in your kliq. Send text, photos, videos, and GIFs - all in one place!',
      featureName: 'Direct Messaging',
      icon: '💬',
      accentColor: '#0ea5e9', // Sky Blue
      priority: 6,
      isActive: true,
    },
    {
      title: '🤖 AI-Powered Friend Analysis',
      content: 'Discover how close you really are with your friends! Our AI analyzes your interactions, shared moments, and communication patterns to give you insights about your friendships.',
      featureName: 'Friend Analysis AI',
      icon: '🤖',
      accentColor: '#7c3aed', // Violet
      priority: 5,
      isActive: true,
    },
    {
      title: '📔 Create Your Digital Scrapbook',
      content: 'Save your favorite memories in a beautiful scrapbook! Collect special moments, photos, and posts to look back on anytime. Your personal timeline of cherished memories.',
      featureName: 'Scrapbook',
      icon: '📔',
      accentColor: '#f472b6', // Rose
      priority: 5,
      isActive: true,
    },
    {
      title: '⭐ Daily Horoscopes Just for You',
      content: 'Start your day with personalized horoscopes! Get daily insights based on your zodiac sign and share them with friends who believe in the stars.',
      featureName: 'Horoscopes',
      icon: '⭐',
      accentColor: '#fbbf24', // Yellow
      priority: 4,
      isActive: true,
    },
    {
      title: '📿 Daily Bible Verses for Inspiration',
      content: 'Receive daily Bible verses to uplift and inspire you. Share faith-based content with your kliq and stay connected spiritually with your community.',
      featureName: 'Bible Verses',
      icon: '📿',
      accentColor: '#84cc16', // Lime
      priority: 4,
      isActive: true,
    },
    {
      title: '👥 Create Group Chats for Your Crews',
      content: 'Bring your whole friend group together! Create group chats for different crews - study groups, sports teams, or just your closest friends. Keep everyone connected in one place.',
      featureName: 'Group Chats',
      icon: '👥',
      accentColor: '#22d3ee', // Cyan
      priority: 7,
      isActive: true,
    },
    {
      title: '🔗 Connect Your Social Media Accounts',
      content: 'Link your TikTok, Instagram, YouTube, and other social accounts to earn Kliq Koins! Get 1,000 Koins per platform (up to 10 platforms). Share content across your networks effortlessly.',
      featureName: 'Social Integration',
      icon: '🔗',
      accentColor: '#fb923c', // Orange
      priority: 6,
      isActive: true,
    },
    {
      title: '📺 Go Live & Stream with Friends',
      content: 'Start live video streams to connect with your kliq in real-time! Share your experiences, host Q&As, or just hang out. Your friends get notified when you go live.',
      featureName: 'Live Streaming',
      icon: '📺',
      accentColor: '#ef4444', // Red
      priority: 7,
      isActive: true,
    },
    {
      title: '🎉 Create Events & Plan Hangouts',
      content: 'Organize events with built-in RSVP tracking, reminders, and auto-posting! From study sessions to birthday parties, keep your kliq coordinated and never miss a gathering.',
      featureName: 'Event Creation',
      icon: '🎉',
      accentColor: '#ec4899', // Pink
      priority: 8,
      isActive: true,
    },
    {
      title: '💭 Let\'s Reflect - Your Daily Check-In',
      content: 'Take a moment to reflect on your day, mood, and thoughts. Let\'s Reflect helps you track your mental wellness and share what matters with close friends when you\'re ready.',
      featureName: 'Let\'s Reflect',
      icon: '💭',
      accentColor: '#a78bfa', // Purple
      priority: 6,
      isActive: true,
    },
    {
      title: '📆 MyKliq Calendar - Stay Organized',
      content: 'Your personal calendar syncs with kliq events, birthdays, and reminders. Never miss important dates - from friend meetups to project deadlines, it\'s all in one place!',
      featureName: 'MyKliq Calendar',
      icon: '📆',
      accentColor: '#06b6d4', // Cyan
      priority: 7,
      isActive: true,
    },
    {
      title: '😊 Express Your Mood & Get AI Boosts',
      content: 'Share how you\'re feeling with mood tags on your posts! Feeling down? Get personalized AI-powered mood boosts using Google Gemini to lift your spirits and brighten your day.',
      featureName: 'Moods & Mood Boosts',
      icon: '😊',
      accentColor: '#fbbf24', // Yellow
      priority: 8,
      isActive: true,
    },
  ];

  try {
    // Insert all educational posts
    for (const post of posts) {
      await db.insert(educationalPosts).values(post);
      console.log(`✓ Added: ${post.title}`);
    }

    console.log(`\n✅ Successfully seeded ${posts.length} educational posts!`);
    return posts.length;
  } catch (error) {
    console.error('❌ Error seeding educational posts:', error);
    throw error;
  }
}

// Run the seeding function
seedEducationalPosts()
  .then((count) => {
    console.log(`\nDone! Seeded ${count} educational posts.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed:', error);
    process.exit(1);
  });
