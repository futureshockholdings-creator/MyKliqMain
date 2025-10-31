import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import { moodBoostPosts } from "../../shared/schema";
import { sql } from "drizzle-orm";

// DON'T DELETE THIS COMMENT
// Reference: blueprint:javascript_gemini
// Using Gemini 2.5 Flash for fast, cost-effective content generation

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const MOOD_PROMPTS = {
  sad: "Create an uplifting, compassionate message for someone feeling sad. Focus on hope, resilience, and reminding them that tough times pass. Keep it warm and genuine.",
  anxious: "Create a calming, reassuring message for someone feeling anxious. Focus on grounding, taking things one step at a time, and self-compassion. Keep it soothing.",
  frustrated: "Create an encouraging message for someone feeling frustrated. Focus on perspective, persistence, and the value of challenges. Keep it motivating.",
  tired: "Create an energizing message for someone feeling tired. Focus on self-care, rest as productivity, and gentle encouragement. Keep it understanding.",
  broken_hearted: "Create a healing message for someone with a broken heart. Focus on time healing wounds, self-love, and new beginnings. Keep it compassionate.",
  confused: "Create a clarifying message for someone feeling confused. Focus on trusting the process, taking small steps, and being patient with oneself. Keep it reassuring.",
  lost: "Create a guiding message for someone feeling lost. Focus on finding purpose, self-discovery, and the journey being as important as the destination. Keep it inspiring.",
  numb: "Create a gentle message for someone feeling numb. Focus on reconnecting with feelings, small joys, and the temporary nature of emotional numbness. Keep it empathetic.",
  happy: "Create a celebratory message that amplifies their joy. Focus on gratitude, sharing positivity, and appreciating the moment. Keep it energetic.",
  excited: "Create an enthusiastic message that matches their energy. Focus on momentum, possibilities, and channeling excitement productively. Keep it vibrant.",
  peaceful: "Create a serene message that honors their calm. Focus on mindfulness, presence, and protecting inner peace. Keep it tranquil.",
  grateful: "Create an appreciative message that deepens gratitude. Focus on abundance, connections, and paying kindness forward. Keep it heartfelt.",
  motivated: "Create an empowering message that fuels their drive. Focus on goals, potential, and taking action. Keep it dynamic.",
  in_love: "Create a joyful message celebrating love. Focus on connection, appreciation, and nurturing relationships. Keep it warm.",
  cool: "Create a confident message that matches their vibe. Focus on self-assurance, uniqueness, and owning who they are. Keep it smooth.",
  thoughtful: "Create a reflective message for deep thinkers. Focus on wisdom, introspection, and meaningful insights. Keep it contemplative.",
  silly: "Create a playful message that embraces lightheartedness. Focus on fun, laughter, and not taking life too seriously. Keep it cheerful.",
  nostalgic: "Create a bittersweet message honoring memories. Focus on growth, cherished moments, and how the past shapes us. Keep it tender.",
  irritable: "Create a patient message for someone feeling on edge. Focus on self-awareness, healthy outlets, and being kind to oneself. Keep it understanding.",
  default: "Create an uplifting, positive message that brightens someone's day. Make it personal, warm, and genuinely encouraging."
};

/**
 * Generate a personalized uplifting message using Gemini AI
 * @param mood - Optional mood of the user
 * @returns AI-generated uplifting content
 */
export async function generateUpliftingMessage(mood?: string): Promise<string> {
  const moodKey = mood?.toLowerCase().replace(/\s+/g, '_') || 'default';
  const basePrompt = MOOD_PROMPTS[moodKey as keyof typeof MOOD_PROMPTS] || MOOD_PROMPTS.default;
  
  const fullPrompt = `${basePrompt}

Requirements:
- 1-2 SHORT sentences maximum (keep it concise and punchy)
- Use "you" to make it personal
- Be genuine and avoid clichés
- Include specific, actionable encouragement when possible
- Make each message unique with varied vocabulary
- NO emojis in the text itself
- Sound like a caring friend, not a motivational poster
- IMPORTANT: Keep it brief and impactful

Generate one unique uplifting message now:`;

  // Retry logic with exponential backoff for API rate limits
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
      });

      const content = response.text?.trim() || "You're doing better than you think. Every moment is a chance to start fresh.";
      
      // Remove quotes if Gemini wrapped the response
      return content.replace(/^["']|["']$/g, '');
    } catch (error: any) {
      // If it's a rate limit error (503) and we have retries left, wait and retry
      if (error?.status === 503 && attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If we've exhausted retries or it's a different error, use fallback
      if (attempt === 0) {
        console.error("Error generating uplifting message:", error);
      }
      
      // Fallback messages if API fails
      const fallbacks = [
        "You're stronger than you realize. Take it one moment at a time.",
        "Your journey is uniquely yours. Trust the process, even when it's hard.",
        "Small steps forward are still progress. You're doing great.",
        "Be gentle with yourself today. You deserve kindness, especially from you.",
        "This moment doesn't define you. Tomorrow brings new possibilities."
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }
  
  // Should never reach here, but TypeScript wants a return
  return "You're doing better than you think. Every moment is a chance to start fresh.";
}

/**
 * Generate 5 mood boost posts for a specific user with staggered release times
 * First post appears immediately, remaining 4 appear every 30 minutes
 * @param userId - User ID to generate posts for
 * @param mood - Optional mood context
 */
export async function generateMoodBoostPostsForUser(userId: string, mood?: string): Promise<void> {
  try {
    const now = new Date();
    const baseExpiresAt = new Date(now);
    baseExpiresAt.setHours(baseExpiresAt.getHours() + 5); // Expire 5 hours from now

    // Generate 5 unique messages
    const messages = await Promise.all([
      generateUpliftingMessage(mood),
      generateUpliftingMessage(mood),
      generateUpliftingMessage(mood),
      generateUpliftingMessage(mood),
      generateUpliftingMessage(mood),
    ]);

    // Create posts with staggered release times
    // Post 1: shows immediately (createdAt = now)
    // Posts 2-5: show at 30, 60, 90, 120 minutes from now
    const posts = messages.map((content, index) => {
      const createdAt = new Date(now);
      const expiresAt = new Date(baseExpiresAt);
      
      if (index > 0) {
        // Stagger posts: 30 mins, 60 mins, 90 mins, 120 mins
        const delayMinutes = index * 30;
        createdAt.setMinutes(createdAt.getMinutes() + delayMinutes);
        expiresAt.setMinutes(expiresAt.getMinutes() + delayMinutes);
      }
      
      return {
        userId,
        content,
        mood: mood || null,
        createdAt,
        expiresAt,
      };
    });

    await db.insert(moodBoostPosts).values(posts);
    
    console.log(`✨ Generated 5 mood boost posts for user ${userId}${mood ? ` (mood: ${mood})` : ''} (staggered every 30 mins)`);
  } catch (error) {
    console.error(`Error generating mood boost posts for user ${userId}:`, error);
  }
}

/**
 * Cleanup expired mood boost posts
 */
export async function cleanupExpiredMoodBoostPosts(): Promise<void> {
  try {
    const result = await db
      .delete(moodBoostPosts)
      .where(sql`${moodBoostPosts.expiresAt} < NOW()`)
      .returning({ id: moodBoostPosts.id });
    
    if (result.length > 0) {
      console.log(`🧹 Cleaned up ${result.length} expired mood boost posts`);
    }
  } catch (error) {
    console.error("Error cleaning up expired mood boost posts:", error);
  }
}
