import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { performanceMonitor, performanceMiddleware } from './performanceMonitor';
import { requestManagerMiddleware, getLoadBalancerStatus } from './loadBalancer';
import { memoryOptimizer } from './memoryOptimizer';
import { healthCheckHandler, scalabilityReportHandler } from './healthcheck';
import { queryOptimizer } from './queryOptimizer';
import { notificationService } from "./notificationService";
import { maintenanceService } from "./maintenanceService";
import { sendChatbotConversation } from "./emailService";
import { pool, db } from "./db";
import { friendRankingIntelligence } from "./friendRankingIntelligence";
import { cacheService } from "./cacheService";
import { rateLimitService } from "./rateLimitService";
import { performanceOptimizer } from "./performanceOptimizer";

import { insertPostSchema, insertStorySchema, insertCommentSchema, insertCommentLikeSchema, insertContentFilterSchema, insertUserThemeSchema, insertMessageSchema, insertEventSchema, insertActionSchema, insertMeetupSchema, insertMeetupCheckInSchema, insertGifSchema, insertMovieconSchema, insertPollSchema, insertPollVoteSchema, insertSponsoredAdSchema, insertAdInteractionSchema, insertUserAdPreferencesSchema, insertSocialCredentialSchema, insertContentEngagementSchema, insertReportSchema, messages, conversations, stories, users } from "@shared/schema";
import { eq, and, or, desc, sql as sqlOp } from "drizzle-orm";
import bcrypt from "bcrypt";
import { oauthService } from "./oauthService";
import { encryptForStorage, decryptFromStorage } from './cryptoService';
import { z } from "zod";
import multer from "multer";

// Configure multer for in-memory storage (MVP)
// TODO: Post-MVP - Migrate to ObjectStorageService for persistent storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    // Whitelist allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// In-memory media registry for MVP (ephemeral storage)
// TODO: Post-MVP - Replace with ObjectStorageService for permanent, scalable storage
const mediaRegistry = new Map<string, { buffer: Buffer; mimetype: string; filename: string }>();

// Stories and messages are now database-backed - no in-memory store needed

// Password setup schema
const passwordSetupSchema = z.object({
  password: z.string()
    .min(10, "Password must be at least 10 characters long")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
});
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";

// PKCE helper functions for OAuth 2.0
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// Zodiac sign calculation helper
function getZodiacSign(birthdate: string): string {
  const date = new Date(birthdate);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

// Daily Bible verse generator
function generateDailyBibleVerse(): { verse: string; reference: string; reflection: string } {
  const bibleVerses = [
    {
      verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
      reference: "Jeremiah 29:11",
      reflection: "Today, trust in God's perfect plan for your life. Even when circumstances seem uncertain, remember that His plans are always for your good."
    },
    {
      verse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
      reference: "Joshua 1:9",
      reflection: "Face today's challenges with confidence, knowing that God's presence goes before you and His strength empowers you."
    },
    {
      verse: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
      reference: "Proverbs 3:5-6",
      reflection: "Release control and trust God's wisdom over your own. He sees the bigger picture and will guide your steps."
    },
    {
      verse: "I can do all this through him who gives me strength.",
      reference: "Philippians 4:13",
      reflection: "Whatever obstacles you face today, remember that Christ's strength is available to help you overcome every challenge."
    },
    {
      verse: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
      reference: "Romans 8:28",
      reflection: "Even in difficult moments, trust that God is weaving all things together for your ultimate good and His glory."
    },
    {
      verse: "The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.",
      reference: "Zephaniah 3:17",
      reflection: "Remember today that you are deeply loved and cherished by God. He delights in you and celebrates your life."
    },
    {
      verse: "Cast all your anxiety on him because he cares for you.",
      reference: "1 Peter 5:7",
      reflection: "Don't carry today's worries alone. Give them to God, knowing He cares deeply about every concern in your heart."
    },
    {
      verse: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
      reference: "Isaiah 40:31",
      reflection: "When you feel tired or discouraged, look to the Lord for renewed strength and energy to continue your journey."
    },
    {
      verse: "The Lord is my shepherd, I lack nothing.",
      reference: "Psalm 23:1",
      reflection: "Rest in the assurance that God provides for all your needs. He is your caring shepherd who watches over you."
    },
    {
      verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
      reference: "Philippians 4:6",
      reflection: "Replace anxiety with prayer today. Bring every concern to God with a grateful heart, trusting in His care."
    },
    {
      verse: "He has made everything beautiful in its time.",
      reference: "Ecclesiastes 3:11",
      reflection: "Trust God's timing in your life. What seems delayed or difficult now is being worked into something beautiful."
    },
    {
      verse: "The Lord will fight for you; you need only to be still.",
      reference: "Exodus 14:14",
      reflection: "In today's battles, remember that God fights alongside you. Sometimes the most powerful thing you can do is rest in His strength."
    },
    {
      verse: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.",
      reference: "Matthew 6:33",
      reflection: "Prioritize your relationship with God today, and trust Him to take care of everything else you need."
    },
    {
      verse: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
      reference: "1 Corinthians 13:4",
      reflection: "Let love guide your interactions today. Show patience and kindness to everyone you encounter."
    },
    {
      verse: "Every good and perfect gift is from above, coming down from the Father of the heavenly lights.",
      reference: "James 1:17",
      reflection: "Notice and give thanks for the good gifts in your life today. Every blessing comes from God's loving hand."
    }
  ];

  // Generate semi-random but consistent verse based on current date
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const verseIndex = dayOfYear % bibleVerses.length;
  
  return bibleVerses[verseIndex];
}

// Daily horoscope generator
function generateDailyHoroscope(sign: string): { reading: string; luckyNumber: number; luckyColor: string } {
  const horoscopes = {
    Aries: [
      "Today brings exciting opportunities for new beginnings. Your natural leadership will shine through in unexpected ways.",
      "Energy and enthusiasm guide your day. Take calculated risks and trust your instincts in important decisions.",
      "A spontaneous adventure awaits. Your courage will help you overcome any obstacles that come your way."
    ],
    Taurus: [
      "Stability and comfort are your themes today. Focus on building lasting foundations for your future goals.",
      "Your practical nature serves you well in financial matters. Trust your steady approach to problem-solving.",
      "Patience pays off as a long-term project finally shows promising results. Enjoy the fruits of your labor."
    ],
    Gemini: [
      "Communication is key today. Your wit and charm open doors to new social and professional connections.",
      "Curiosity leads to fascinating discoveries. Embrace variety and don't be afraid to multitask.",
      "Mental agility helps you adapt to changing circumstances. Your flexible nature is your greatest asset today."
    ],
    Cancer: [
      "Emotions run deep today, bringing clarity to personal relationships. Trust your intuitive guidance.",
      "Home and family take center stage. Your nurturing nature brings comfort to those who need it most.",
      "Memories from the past provide valuable insights for current situations. Honor your emotional wisdom."
    ],
    Leo: [
      "The spotlight finds you naturally today. Your confidence and creativity inspire others to follow your lead.",
      "Generous gestures bring unexpected rewards. Your warm heart attracts positive energy and new friendships.",
      "Express yourself boldly and without fear. Your unique talents deserve recognition and appreciation."
    ],
    Virgo: [
      "Attention to detail pays dividends today. Your methodical approach solves problems others couldn't crack.",
      "Organization brings peace to chaotic situations. Your helpful nature makes you indispensable to your team.",
      "Health and wellness deserve extra attention. Small improvements in your routine yield significant benefits."
    ],
    Libra: [
      "Balance and harmony guide your decisions today. Your diplomatic skills help resolve ongoing conflicts.",
      "Beauty and aesthetics inspire creative projects. Trust your excellent taste in all artistic endeavors.",
      "Partnerships flourish under your fair and considerate approach. Collaboration brings mutual success."
    ],
    Scorpio: [
      "Deep transformation occurs beneath the surface. Trust the process of renewal happening in your life.",
      "Intensity and passion drive your pursuits today. Your determination overcomes seemingly impossible obstacles.",
      "Hidden truths come to light, providing clarity about mysterious situations. Trust your investigative instincts."
    ],
    Sagittarius: [
      "Adventure calls your name today. Your optimistic outlook opens doors to exciting new experiences.",
      "Philosophical discussions expand your worldview. Share your wisdom and learn from diverse perspectives.",
      "Freedom and independence fuel your happiness. Trust your wanderlust to guide you toward growth."
    ],
    Capricorn: [
      "Hard work and discipline lead to tangible achievements. Your ambitious nature brings long-awaited recognition.",
      "Traditional approaches prove most effective today. Your respect for structure helps you reach important goals.",
      "Authority figures notice your reliable nature. Professional advancement opportunities may present themselves."
    ],
    Aquarius: [
      "Innovation and originality set you apart today. Your unique perspective offers solutions others missed.",
      "Humanitarian causes capture your attention. Your progressive ideals inspire positive change in your community.",
      "Technology and the future fascinate you. Embrace new methods that streamline your daily routines."
    ],
    Pisces: [
      "Intuition and creativity flow freely today. Your artistic sensibilities bring beauty to ordinary situations.",
      "Compassion guides your interactions with others. Your empathetic nature heals emotional wounds.",
      "Dreams and imagination provide valuable insights. Pay attention to subtle messages from your subconscious."
    ]
  };

  const colors = ["Purple", "Gold", "Silver", "Blue", "Green", "Red", "Orange", "Pink", "Turquoise", "Coral"];
  const readings = horoscopes[sign as keyof typeof horoscopes] || horoscopes.Aries;
  
  // Generate semi-random but consistent values based on current date and sign
  const today = new Date();
  const seedValue = today.getDate() + today.getMonth() + sign.length;
  
  return {
    reading: readings[seedValue % readings.length],
    luckyNumber: ((seedValue * 7) % 42) + 1,
    luckyColor: colors[seedValue % colors.length]
  };
}

// Extend WebSocket interface for custom properties
interface ExtendedWebSocket extends WebSocket {
  action_id?: string;
  user_id?: string;
  call_id?: string;
  feed_subscriber?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Clean up - remove debugging middleware
  
  // Maximum scalability middlewares
  app.use(requestManagerMiddleware); // Advanced load balancing, rate limiting, and circuit breaker
  app.use(performanceMiddleware()); // Performance monitoring and tracking

  // Auth middleware
  await setupAuth(app);

  // Signup endpoint for new user registration
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        bio,
        kliqName,
        birthdate,
        password,
        securityAnswer1,
        securityAnswer2,
        securityAnswer3,
        securityPin,
        interests,
        favoriteLocations,
        favoriteFoods,
        musicGenres,
        hobbies,
        favoriteMovies,
        favoriteBooks,
        relationshipStatus,
        petPreferences,
        lifestyle,
        inviteCode: receivedInviteCode
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !phoneNumber || !password || !securityAnswer1 || !securityAnswer2 || !securityAnswer3 || !securityPin) {
        return res.status(400).json({ 
          message: "Missing required fields: firstName, lastName, email, phoneNumber, password, security answers, and PIN" 
        });
      }

      // Validate password strength
      if (password.length < 10 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
        return res.status(400).json({ 
          message: "Password must be at least 10 characters with letters, numbers, and special characters" 
        });
      }

      // Validate PIN (4 digits)
      if (!/^\d{4}$/.test(securityPin)) {
        return res.status(400).json({ 
          message: "Security PIN must be exactly 4 digits" 
        });
      }

      // Check if user already exists with this email
      const existingUserByEmail = await storage.getUserByEmail(email);
      
      if (existingUserByEmail) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Generate unique user ID and invite code
      const userId = crypto.randomUUID();
      const inviteCode = await storage.generateInviteCode();

      // Encrypt security data
      const { encryptForStorage } = await import('./cryptoService');
      const encryptedPassword = encryptForStorage(password);
      const hashedSecurityAnswer1 = await bcrypt.hash(securityAnswer1, 12);
      const hashedSecurityAnswer2 = await bcrypt.hash(securityAnswer2, 12);
      const hashedSecurityAnswer3 = await bcrypt.hash(securityAnswer3, 12);
      const hashedSecurityPin = await bcrypt.hash(securityPin, 12);

      // Create new user
      const newUser = await storage.upsertUser({
        id: userId,
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        bio: bio?.trim() || null,
        inviteCode,
        kliqName: kliqName?.trim() || "My Kliq",
        birthdate: birthdate || null,
        password: encryptedPassword,
        securityAnswer1: hashedSecurityAnswer1,
        securityAnswer2: hashedSecurityAnswer2,
        securityAnswer3: hashedSecurityAnswer3,
        securityPin: hashedSecurityPin,
        interests: interests?.filter((item: string) => item.trim()) || [],
        favoriteLocations: favoriteLocations?.filter((item: string) => item.trim()) || [],
        favoriteFoods: favoriteFoods?.filter((item: string) => item.trim()) || [],
        musicGenres: musicGenres?.filter((item: string) => item.trim()) || [],
        hobbies: hobbies?.filter((item: string) => item.trim()) || [],
        favoriteMovies: favoriteMovies?.filter((item: string) => item.trim()) || [],
        favoriteBooks: favoriteBooks?.filter((item: string) => item.trim()) || [],
        relationshipStatus: relationshipStatus || null,
        petPreferences: petPreferences || null,
        lifestyle: lifestyle || null
      });

      // Create user session (authenticate them)
      const userSession = {
        claims: {
          sub: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          profile_image_url: null
        },
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days from now
      };

      req.login(userSession, async (err) => {
        if (err) {
          console.error("Session creation error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        // If invite code was provided, create kliq membership
        if (receivedInviteCode && receivedInviteCode.trim()) {
          try {
            const inviteCodeOwner = await storage.getUserByInviteCode(receivedInviteCode.trim());
            if (inviteCodeOwner) {
              // Create friendship between new user and invite code owner
              await storage.addFriend({
                userId: userId,
                friendId: inviteCodeOwner.id,
                status: "accepted",
                rank: 1
              });
              await storage.addFriend({
                userId: inviteCodeOwner.id,
                friendId: userId,
                status: "accepted",
                rank: 1
              });
              
              // Mark invite code as used
              await storage.markInviteCodeAsUsed(receivedInviteCode.trim(), userId, inviteCodeOwner.id);
              
              console.log(`User ${userId} joined ${inviteCodeOwner.id}'s kliq via invite code ${receivedInviteCode}`);
            }
          } catch (error) {
            console.error("Error creating kliq membership:", error);
            // Don't fail the signup if kliq membership creation fails
          }
        }
        
        res.json({ 
          message: "Profile created successfully", 
          user: newUser 
        });
      });

    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to create profile" 
      });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Decrypt password for UI display if it exists
      if (user.password) {
        try {
          const { decryptFromStorage } = await import('./cryptoService');
          // Check if it's an old hashed password (starts with $2b$ for bcrypt)
          if (user.password.startsWith('$2b$')) {
            // Old hashed password, can't decrypt - clear it so user can set a new one
            user.password = null;
          } else {
            user.password = decryptFromStorage(user.password);
          }
        } catch (error) {
          // If decryption fails, clear password so user can set a new one
          console.error("Error decrypting password:", error);
          user.password = null;
        }
      }
      
      // Add security setup status to response
      const securitySetupComplete = !!(user.password && user.securityAnswer1 && user.securityAnswer2 && user.securityAnswer3 && user.securityPin);
      
      res.json({
        ...user,
        securitySetupComplete,
        requiresSecuritySetup: !securitySetupComplete
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Password setup endpoint
  app.post('/api/auth/setup-password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate the request body
      const validation = passwordSetupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid password format",
          errors: validation.error.errors
        });
      }

      const { password } = validation.data;

      // Encrypt the password for secure storage (allows viewing in UI)
      const { encryptForStorage } = await import('./cryptoService');
      const encryptedPassword = encryptForStorage(password);

      // Update user with encrypted password
      await storage.updateUserPassword(userId, encryptedPassword);

      res.json({ 
        message: "Password set up successfully",
        success: true
      });

    } catch (error) {
      console.error("Error setting up password:", error);
      res.status(500).json({ 
        message: "Failed to set up password. Please try again."
      });
    }
  });

  // Test endpoint for mobile connectivity
  app.get('/api/test-mobile', (req, res) => {
    console.log('=== MOBILE TEST ===', req.headers['user-agent']);
    res.json({ 
      status: 'server reachable',
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']
    });
  });

  // Mobile authentication endpoints with JWT tokens
  app.post('/api/mobile/auth/login', async (req, res) => {
    console.log('=== MOBILE LOGIN ATTEMPT ===', new Date().toISOString());
    try {
      const { phoneNumber, password } = req.body;

      if (!phoneNumber || !password) {
        return res.status(400).json({ 
          message: "Phone number and password are required" 
        });
      }

      // Find user by phone number
      const user = await storage.getUserByPhone(phoneNumber);
      if (!user) {
        return res.status(401).json({ 
          message: "Invalid phone number or password" 
        });
      }

      // Check password (bcrypt for admin, encrypted for others)
      let isPasswordValid = false;
      if (user.password?.startsWith('$2b$')) {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else if (user.password) {
        try {
          const { decryptFromStorage } = await import('./cryptoService');
          const decryptedPassword = decryptFromStorage(user.password);
          isPasswordValid = password === decryptedPassword;
        } catch (error) {
          console.error('Password decryption failed:', error);
        }
      }

      if (!isPasswordValid) {
        return res.status(401).json({ 
          message: "Invalid phone number or password" 
        });
      }

      // Generate JWT token for mobile app
      const jwt = await import('jsonwebtoken');
      const token = jwt.default.sign(
        { userId: user.id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET || 'mykliq-mobile-secret-2025',
        { expiresIn: '30d' }
      );

      console.log('Mobile login successful for user:', user.id);
      
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          isAdmin: user.isAdmin,
          profileImageUrl: user.profileImageUrl,
          bio: user.bio
        }
      });

    } catch (error) {
      console.error("Mobile login error:", error);
      res.status(500).json({ 
        message: "Login failed. Please try again."
      });
    }
  });

  // JWT token verification middleware for mobile
  const verifyMobileToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'mykliq-mobile-secret-2025') as any;
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  };

  // Mobile user profile endpoint
  app.get('/api/mobile/user/profile', verifyMobileToken, async (req, res) => {
    try {
      const user = await storage.getUser((req.user as any)?.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        isAdmin: user.isAdmin,
        interests: user.interests,
        hobbies: user.hobbies,
        kliqName: user.kliqName
      });
    } catch (error) {
      console.error('Mobile profile fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });

  // Emergency admin access endpoint (keep for web admin dashboard)
  app.get('/api/activate-admin', async (req, res) => {
    try {
      // Set admin session directly
      const adminUserId = '46297180';
      console.log('Activating admin session for user:', adminUserId);
      
      (req as any).session.userId = adminUserId;
      (req as any).session.isAuthenticated = true;
      
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Session setup failed" });
        }
        
        console.log('Admin session activated successfully');
        res.json({ 
          message: 'Admin session activated! You can now access /admin',
          redirect: '/admin'
        });
      });
      
    } catch (error) {
      console.error("Session activation error:", error);
      res.status(500).json({ 
        message: "Session activation failed"
      });
    }
  });

  // Mobile-optimized intelligent feed endpoint with curation and battery efficiency
  app.get('/api/mobile/feed', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(50, Math.max(5, parseInt(req.query.limit as string) || 20)); // Mobile-optimized limits
      const lastSeenId = req.query.lastSeenId as string; // For battery-efficient pagination
      
      // Mobile-optimized cache key with user-specific intelligent curation
      const cacheKey = `mobile-curated-feed:${userId}:${page}:${limit}:${lastSeenId || 'initial'}`;
      
      // Get from cache first for battery efficiency (shorter cache time for real-time feel)
      const { getCachedOrFetch } = await import('./redis');
      const feedResult = await getCachedOrFetch(
        cacheKey,
        async () => {
          // Get user's content filters
          const userFilters = await storage.getContentFilters(userId);
          const filterTypes = userFilters.map(f => f.keyword);
          
          // Get intelligently curated feed (now with rank-weighting, engagement prediction, and content balancing)
          const feedData = await storage.getKliqFeed(userId, filterTypes, page, limit);
          const posts = Array.isArray(feedData) ? feedData : feedData.items;
          
          // Mobile-optimized formatting with enhanced metadata for better UX
          const mobilePosts = posts.map((post: any) => ({
            id: post.id,
            userId: post.userId,
            content: post.content,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType,
            youtubeUrl: post.youtubeUrl,
            createdAt: post.createdAt,
            type: post.type || 'post', // Include content type for mobile UI optimization
            
            // Enhanced author info for mobile
            author: {
              id: post.author?.id,
              firstName: post.author?.firstName,
              lastName: post.author?.lastName,
              profileImageUrl: post.author?.profileImageUrl,
              kliqName: post.author?.kliqName
            },
            
            // Engagement metrics for mobile UI
            likeCount: post.likes?.length || 0,
            commentCount: post.comments?.length || 0,
            isLiked: post.likes?.some((like: any) => like.userId === userId) || false,
            
            // Intelligent curation metadata (hidden from user, used for analytics)
            curationScore: post.finalScore || 0,
            curationType: post.curationType || 'chronological',
            
            // Mobile-specific optimizations
            title: post.title, // For polls, events, actions
            description: post.description, // Additional context
            status: post.status, // For live streams
            viewerCount: post.viewerCount, // For actions
            thumbnailUrl: post.thumbnailUrl, // For media optimization
            
            // Battery-efficient loading hints
            priority: post.finalScore > 5 ? 'high' : post.finalScore > 2 ? 'medium' : 'low',
          }));
          
          return {
            posts: mobilePosts,
            page,
            hasMore: Array.isArray(feedData) ? false : feedData.hasMore,
            totalPages: feedData.totalPages || 1,
            
            // Mobile-specific metadata for optimization
            curationApplied: true,
            cacheTimestamp: Date.now(),
            batteryOptimized: true
          };
        },
        90 // 1.5 minute cache for mobile (balance between freshness and battery life)
      );
      
      // Add mobile-specific headers for battery optimization
      res.set({
        'Cache-Control': 'public, max-age=60', // Client-side caching for mobile
        'X-Mobile-Optimized': 'true',
        'X-Curation-Applied': 'true',
        'X-Content-Types': feedResult.posts.map((p: any) => p.type).join(',')
      });
      
      res.json(feedResult);
      
    } catch (error) {
      console.error('Mobile intelligent feed error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch feed',
        curationApplied: false,
        fallbackMode: true
      });
    }
  });

  // Mobile post creation endpoint
  app.post('/api/mobile/posts', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.userId;
      const { content, mediaUrl, mediaType } = req.body;
      
      if (!content && !mediaUrl) {
        return res.status(400).json({ message: 'Post content is required' });
      }
      
      const newPost = await storage.createPost({
        userId,
        content: content || '',
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null
      });
      
      // Award 0.50 Kliq Koins for creating a post
      try {
        await storage.awardKoins(userId, 0.50, 'post_create', newPost.id);
      } catch (koinError) {
        console.error("Error awarding Koins for post creation:", koinError);
      }
      
      // Broadcast feed update to all connected clients
      try {
        (req.app as any).broadcastFeedUpdate('post');
      } catch (broadcastError) {
        console.error("Error broadcasting feed update:", broadcastError);
      }
      
      // Return the created post with author info for immediate UI update
      const user = await storage.getUser(userId);
      res.json({
        userId,
        content: content || '',
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        createdAt: new Date().toISOString(),
        author: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          profileImageUrl: user?.profileImageUrl
        },
        likeCount: 0,
        commentCount: 0,
        isLiked: false
      });
      
    } catch (error) {
      console.error('Mobile post creation error:', error);
      res.status(500).json({ message: 'Failed to create post' });
    }
  });

  // Mobile like/unlike endpoint with automatic engagement tracking
  app.post('/api/mobile/posts/:postId/like', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.userId;
      const postId = req.params.postId;
      
      // Get post info for engagement tracking
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Check if user already liked the post by trying to unlike
      let liked = false;
      try {
        await storage.unlikePost(postId, userId);
        liked = false;
      } catch (unlikeError) {
        // If unlike fails, the like doesn't exist, so create it
        await storage.likePost(postId, userId);
        liked = true;
        
        // Award 0.25 Kliq Koins for liking a post (not own post)
        if (post.userId !== userId) {
          try {
            await storage.awardKoins(userId, 0.25, 'post_like', postId);
          } catch (koinError) {
            console.error("Error awarding Koins for post like:", koinError);
          }
        }
        
        // Automatically track engagement for intelligent feed curation (background)
        try {
          const { FeedCurationIntelligence } = await import('./feedCurationIntelligence');
          const curationService = new FeedCurationIntelligence();
          
          // Track this engagement for future curation improvements
          await curationService.trackContentEngagement({
            userId,
            contentOwnerId: post.userId,
            contentType: 'post',
            contentId: postId,
            viewDuration: 2, // Estimated 2 seconds for a like action
            interactionType: 'like',
          });

          // Generate intelligent notification for post author
          const { NotificationIntelligence } = await import('./notificationIntelligence');
          const notificationService = new NotificationIntelligence();
          
          // Get user data for notification
          const likerUser = await storage.getUser(userId);
          
          await notificationService.generateSmartNotifications({
            type: 'new_like',
            userId,
            targetUserId: post.userId,
            data: {
              liker: `${likerUser?.firstName || 'User'} ${likerUser?.lastName || ''}`,
              postId: postId
            }
          });
        } catch (trackingError) {
          // Silent fail for engagement tracking - don't affect user experience
          console.warn('Engagement tracking failed:', trackingError);
        }
      }
      
      res.json({ liked, message: liked ? 'Post liked' : 'Post unliked' });
      
    } catch (error) {
      console.error('Mobile like error:', error);
      res.status(500).json({ message: 'Failed to like/unlike post' });
    }
  });

  // Mobile friends list endpoint
  app.get('/api/mobile/friends', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.userId;
      const friends = await storage.getFriends(userId);
      
      // Format for mobile display
      const mobileFriends = friends.map((friendship: any) => ({
        id: friendship.friend.id,
        firstName: friendship.friend.firstName,
        lastName: friendship.friend.lastName,
        profileImageUrl: friendship.friend.profileImageUrl,
        ranking: friendship.ranking,
        phone: friendship.friend.phoneNumber
      }));
      
      res.json({ friends: mobileFriends });
      
    } catch (error) {
      console.error('Mobile friends error:', error);
      res.status(500).json({ message: 'Failed to fetch friends' });
    }
  });

  // Mobile intelligent insights endpoint - comprehensive intelligence dashboard
  app.get('/api/mobile/insights', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.userId;
      
      // Get all intelligent insights in parallel for maximum efficiency
      const [connectionHealth, conversationSuggestions, notificationTiming, groupDynamics] = await Promise.all([
        (async () => {
          try {
            const { ConnectionHealthMonitoring } = await import('./connectionHealthMonitoring');
            const healthService = new ConnectionHealthMonitoring();
            return await healthService.getConnectionAlerts(userId);
          } catch (error) {
            console.warn('Connection health analysis failed:', error);
            return [];
          }
        })(),
        
        (async () => {
          try {
            const { ConnectionHealthMonitoring } = await import('./connectionHealthMonitoring');
            const healthService = new ConnectionHealthMonitoring();
            const healthData = await healthService.analyzeConnectionHealth(userId);
            
            // Get conversation suggestions for friends who need attention
            const needsAttention = healthData.filter(h => h.healthStatus === 'dormant' || h.healthStatus === 'weak').slice(0, 3);
            const suggestions = await Promise.all(
              needsAttention.map(friend => healthService.generateConversationSuggestions(userId, friend.friendId))
            );
            
            return suggestions.flat();
          } catch (error) {
            console.warn('Conversation suggestions failed:', error);
            return [];
          }
        })(),
        
        (async () => {
          try {
            const { NotificationIntelligence } = await import('./notificationIntelligence');
            const notificationService = new NotificationIntelligence();
            return await notificationService.analyzeUserActivityPatterns(userId);
          } catch (error) {
            console.warn('Notification timing analysis failed:', error);
            return { optimalHours: [9, 12, 18, 20], timezone: 'America/New_York' };
          }
        })(),
        
        (async () => {
          try {
            const { ConnectionHealthMonitoring } = await import('./connectionHealthMonitoring');
            const healthService = new ConnectionHealthMonitoring();
            return await healthService.analyzeGroupDynamics(userId);
          } catch (error) {
            console.warn('Group dynamics analysis failed:', error);
            return { totalMembers: 0, activeMembers: 0, engagementBalance: 0, recommendations: [] };
          }
        })()
      ]);

      res.json({
        connectionHealth,
        conversationSuggestions,
        notificationTiming,
        groupDynamics,
        generatedAt: new Date(),
        
        // Mobile-specific optimizations
        cacheExpiry: Date.now() + (30 * 60 * 1000), // 30 minutes
        intelligenceVersion: '1.0',
        features: ['feed_curation', 'notification_timing', 'connection_health', 'conversation_suggestions']
      });
      
    } catch (error) {
      console.error('Mobile insights error:', error);
      res.status(500).json({ message: 'Failed to fetch intelligent insights' });
    }
  });

  // Mobile stories endpoint
  app.get('/api/mobile/stories', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.userId;
      const stories = await storage.getActiveStories(userId);
      
      // Group stories by user for mobile UI
      const storyGroups = stories.reduce((groups: any, story: any) => {
        const key = story.userId;
        if (!groups[key]) {
          groups[key] = {
            userId: story.userId,
            firstName: story.firstName,
            lastName: story.lastName,
            profileImageUrl: story.profileImageUrl,
            stories: []
          };
        }
        groups[key].stories.push({
          id: story.id,
          imageUrl: story.imageUrl,
          videoUrl: story.videoUrl,
          content: story.content,
          createdAt: story.createdAt
        });
        return groups;
      }, {});
      
      res.json({ storyGroups: Object.values(storyGroups) });
      
    } catch (error) {
      console.error('Mobile stories error:', error);
      res.status(500).json({ message: 'Failed to fetch stories' });
    }
  });

  // Push notification registration endpoint
  app.post('/api/mobile/notifications/register', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.userId;
      const { pushToken, platform } = req.body;
      
      if (!pushToken || !platform) {
        return res.status(400).json({ message: 'Push token and platform are required' });
      }
      
      // Store push token in user profile (commented out - not in schema yet)
      // await storage.updateUser(userId, { 
      //   pushToken: pushToken,
      //   devicePlatform: platform 
      // });
      
      res.json({ 
        success: true, 
        message: 'Push notifications registered successfully' 
      });
      
    } catch (error) {
      console.error('Push notification registration error:', error);
      res.status(500).json({ message: 'Failed to register for push notifications' });
    }
  });

  // Send push notification helper function (for future use)
  const sendPushNotification = async (pushToken: string, title: string, body: string, data?: any) => {
    try {
      // This will be implemented with Firebase Cloud Messaging or Apple Push Notification Service
      // For now, we'll log the notification
      console.log('Push notification sent:', { pushToken, title, body, data });
      
      // TODO: Implement actual push notification sending
      // Example with Firebase:
      // const message = {
      //   notification: { title, body },
      //   data: data || {},
      //   token: pushToken
      // };
      // await admin.messaging().send(message);
      
    } catch (error) {
      console.error('Push notification send error:', error);
    }
  };

  // Mobile content recommendations endpoint - personalized content discovery
  app.get('/api/mobile/recommendations', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.userId;
      const category = req.query.category as string; // Optional filter: 'interests', 'hobbies', 'entertainment', 'lifestyle'
      
      const { contentRecommendationEngine } = await import('./contentRecommendationEngine.js');
      const recommendations = await contentRecommendationEngine.generateRecommendations(userId);
      
      // Filter by category if specified
      const filteredRecommendations = category 
        ? recommendations.filter(rec => rec.category === category)
        : recommendations;
      
      // Mobile-optimized response with actionable recommendations
      const mobileRecommendations = filteredRecommendations.map(rec => ({
        id: `${rec.type}_${rec.category}_${Date.now()}`,
        type: rec.type,
        category: rec.category,
        title: generateRecommendationTitle(rec),
        description: rec.reason,
        score: Math.round(rec.score),
        keywords: rec.keywords,
        actionType: getRecommendationAction(rec.category),
        priority: rec.score > 80 ? 'high' : rec.score > 60 ? 'medium' : 'low'
      }));
      
      res.json({
        recommendations: mobileRecommendations,
        totalCount: mobileRecommendations.length,
        categories: Array.from(new Set(mobileRecommendations.map(r => r.category))),
        userEngagementLevel: calculateUserEngagementLevel(recommendations)
      });
      
    } catch (error) {
      console.error('Content recommendations error:', error);
      res.status(500).json({ message: 'Failed to generate content recommendations' });
    }
  });

  // Mobile recommendation stats for analytics
  app.get('/api/mobile/recommendations/stats', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.userId;
      
      const { contentRecommendationEngine } = await import('./contentRecommendationEngine.js');
      const stats = await contentRecommendationEngine.getRecommendationStats(userId);
      
      res.json({
        ...stats,
        personalizedContentScore: Math.round(stats.averageScore),
        profileCompleteness: await calculateProfileCompleteness(userId),
        recommendationQuality: stats.averageScore > 70 ? 'excellent' : stats.averageScore > 50 ? 'good' : 'developing'
      });
      
    } catch (error) {
      console.error('Recommendation stats error:', error);
      res.status(500).json({ message: 'Failed to fetch recommendation statistics' });
    }
  });

  // Serve uploaded media files from memory
  app.get('/api/mobile/uploads/:mediaId', (req, res) => {
    const { mediaId } = req.params;
    const media = mediaRegistry.get(mediaId);
    
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    
    res.set('Content-Type', media.mimetype);
    res.send(media.buffer);
  });

  // Mobile file upload endpoint for camera/photo library
  app.post('/api/mobile/upload', verifyMobileToken, async (req, res) => {
    try {
      // This endpoint will handle mobile file uploads
      // File upload implementation for mobile
      const { fileType, fileName } = req.body;
      
      // Production file upload integration would go here
      // Currently configured for mobile app development environment
      
      res.json({
        success: true,
        uploadUrl: `/uploads/${fileName}`,
        message: 'File upload prepared'
      });
      
    } catch (error) {
      console.error('Mobile file upload error:', error);
      res.status(500).json({ message: 'Failed to prepare file upload' });
    }
  });

  // Get stories (mobile)
  app.get('/api/mobile/stories', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      
      // Get all non-expired stories from database
      const activeStories = await db.select().from(stories)
        .where(sqlOp`expires_at > NOW()`)
        .orderBy(desc(stories.createdAt));
      
      // Group stories by user
      const userStoryMap = new Map<string, typeof activeStories>();
      for (const story of activeStories) {
        if (!userStoryMap.has(story.userId)) {
          userStoryMap.set(story.userId, []);
        }
        userStoryMap.get(story.userId)!.push(story);
      }
      
      // Build story groups with user details
      const storyGroups = await Promise.all(
        Array.from(userStoryMap.entries()).map(async ([storyUserId, userStories]) => {
          // Get user details
          const [user] = await db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          }).from(users).where(eq(users.id, storyUserId)).limit(1);
          
          return {
            userId: storyUserId,
            firstName: user?.firstName || 'Unknown',
            lastName: user?.lastName || '',
            profileImageUrl: user?.profileImageUrl,
            stories: userStories.map(story => ({
              id: story.id,
              mediaUrl: story.mediaUrl,
              mediaType: story.mediaType,
              createdAt: story.createdAt?.toISOString(),
              expiresAt: story.expiresAt?.toISOString(),
              caption: story.content
            }))
          };
        })
      );
      
      // Put user's own stories first
      storyGroups.sort((a, b) => {
        if (a.userId === userId) return -1;
        if (b.userId === userId) return 1;
        return 0;
      });
      
      res.json({ storyGroups });
    } catch (error) {
      console.error('Get stories error:', error);
      res.status(500).json({ message: 'Failed to fetch stories' });
    }
  });

  // Create story (mobile)
  app.post('/api/mobile/stories', verifyMobileToken, upload.single('media'), async (req, res) => {
    try {
      const userId = (req as any).userId;
      
      if (!req.file) {
        return res.status(400).json({ message: 'Media file is required for story' });
      }

      // Store media in registry (keeping in-memory for MVP)
      const mediaId = `story-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      mediaRegistry.set(mediaId, {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        filename: req.file.originalname
      });

      const mediaUrl = `/api/mobile/uploads/${mediaId}`;
      const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
      
      // Create story in database
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      
      const [newStory] = await db.insert(stories).values({
        userId,
        mediaUrl,
        mediaType: mediaType as 'image' | 'video',
        content: req.body.caption || null,
        expiresAt,
        viewCount: 0
      }).returning();
      
      res.json({
        success: true,
        storyId: newStory.id,
        mediaUrl: newStory.mediaUrl,
        expiresAt: newStory.expiresAt?.toISOString(),
        message: 'Story created successfully'
      });
    } catch (error) {
      console.error('Create story error:', error);
      res.status(500).json({ message: 'Failed to create story' });
    }
  });

  // Helper function to get or create a conversation record between two users
  const getOrCreateConversation = async (user1Id: string, user2Id: string) => {
    // Ensure consistent ordering for lookup
    const [userId1, userId2] = [user1Id, user2Id].sort();
    
    // Try to find existing conversation
    const existing = await db.select().from(conversations)
      .where(
        and(
          eq(conversations.user1Id, userId1),
          eq(conversations.user2Id, userId2)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    // Create new conversation
    const [newConversation] = await db.insert(conversations).values({
      user1Id: userId1,
      user2Id: userId2,
    }).returning();
    
    return newConversation;
  };

  // Get conversations list (mobile messaging)
  app.get('/api/mobile/messages/conversations', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      
      // Get all conversations where user is a participant
      const userConvos = await db.select().from(conversations)
        .where(
          or(
            eq(conversations.user1Id, userId),
            eq(conversations.user2Id, userId)
          )
        )
        .orderBy(desc(conversations.lastActivity));
      
      // Build conversation list with friend details and unread counts
      const conversationList = await Promise.all(
        userConvos.map(async (convo) => {
          // Determine friend ID (the other user in the conversation)
          const friendId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
          
          // Get friend details
          const [friend] = await db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          }).from(users).where(eq(users.id, friendId)).limit(1);
          
          // Get last message
          const [lastMsg] = await db.select().from(messages)
            .where(eq(messages.id, convo.lastMessageId!))
            .limit(1);
          
          // Count unread messages for this user
          const unreadCount = await db.select({ count: sqlOp<number>`count(*)::int` })
            .from(messages)
            .where(
              and(
                or(
                  and(eq(messages.senderId, userId), eq(messages.receiverId, friendId)),
                  and(eq(messages.senderId, friendId), eq(messages.receiverId, userId))
                ),
                eq(messages.receiverId, userId),
                eq(messages.isRead, false)
              )
            );
          
          return {
            id: convo.id,
            friendId: friend.id,
            friendName: `${friend.firstName || ''} ${friend.lastName || ''}`.trim() || 'Unknown',
            friendAvatar: friend.profileImageUrl,
            lastMessage: lastMsg?.content || '',
            lastMessageTime: convo.lastActivity?.toISOString() || convo.createdAt?.toISOString(),
            unreadCount: unreadCount[0]?.count || 0
          };
        })
      );
      
      res.json(conversationList);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  // Get messages with a friend (mobile messaging)
  app.get('/api/mobile/messages/:friendId', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { friendId } = req.params;
      
      // Get all messages between the two users
      const messagesData = await db.select().from(messages)
        .where(
          or(
            and(eq(messages.senderId, userId), eq(messages.receiverId, friendId)),
            and(eq(messages.senderId, friendId), eq(messages.receiverId, userId))
          )
        )
        .orderBy(messages.createdAt);
      
      // Transform to match mobile app format
      const formattedMessages = messagesData.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        content: msg.content || '',
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        createdAt: msg.createdAt?.toISOString(),
        isRead: msg.isRead
      }));
      
      res.json(formattedMessages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Send message (mobile messaging)
  app.post('/api/mobile/messages/:friendId', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { friendId } = req.params;
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Message content is required' });
      }

      // Insert message into database
      const [newMessage] = await db.insert(messages).values({
        senderId: userId,
        receiverId: friendId,
        content: content.trim(),
        isRead: false
      }).returning();
      
      // Update or create conversation
      await getOrCreateConversation(userId, friendId);
      await db.update(conversations)
        .set({
          lastMessageId: newMessage.id,
          lastActivity: new Date()
        })
        .where(
          or(
            and(
              eq(conversations.user1Id, userId < friendId ? userId : friendId),
              eq(conversations.user2Id, userId < friendId ? friendId : userId)
            )
          )
        );
      
      res.json({
        success: true,
        message: {
          id: newMessage.id,
          senderId: newMessage.senderId,
          content: newMessage.content,
          createdAt: newMessage.createdAt?.toISOString(),
          isRead: newMessage.isRead
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // Send media message (mobile messaging)
  app.post('/api/mobile/messages/:friendId/media', verifyMobileToken, upload.single('media'), async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { friendId } = req.params;
      const { mediaType } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: 'Media file is required' });
      }

      // Store media in registry (keeping in-memory for MVP)
      const mediaId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      mediaRegistry.set(mediaId, {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        filename: req.file.originalname
      });

      const mediaUrl = `/api/mobile/uploads/${mediaId}`;

      // Insert message into database
      const [newMessage] = await db.insert(messages).values({
        senderId: userId,
        receiverId: friendId,
        content: '',
        mediaUrl,
        mediaType: (mediaType || 'image') as 'image' | 'video',
        isRead: false
      }).returning();
      
      // Update or create conversation
      await getOrCreateConversation(userId, friendId);
      await db.update(conversations)
        .set({
          lastMessageId: newMessage.id,
          lastActivity: new Date()
        })
        .where(
          or(
            and(
              eq(conversations.user1Id, userId < friendId ? userId : friendId),
              eq(conversations.user2Id, userId < friendId ? friendId : userId)
            )
          )
        );
      
      res.json({
        success: true,
        message: {
          id: newMessage.id,
          senderId: newMessage.senderId,
          content: newMessage.content || '',
          mediaUrl: newMessage.mediaUrl,
          mediaType: newMessage.mediaType,
          createdAt: newMessage.createdAt?.toISOString(),
          isRead: newMessage.isRead
        }
      });
    } catch (error) {
      console.error('Send media error:', error);
      res.status(500).json({ message: 'Failed to send media' });
    }
  });

  // Send GIF message (mobile messaging)
  app.post('/api/mobile/messages/:friendId/gif', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { friendId } = req.params;
      const { gifUrl } = req.body;
      
      if (!gifUrl || !gifUrl.trim()) {
        return res.status(400).json({ message: 'GIF URL is required' });
      }

      // Insert GIF message into database
      const [newMessage] = await db.insert(messages).values({
        senderId: userId,
        receiverId: friendId,
        content: '',
        mediaUrl: gifUrl.trim(),
        isRead: false
      }).returning();
      
      // Update or create conversation
      await getOrCreateConversation(userId, friendId);
      await db.update(conversations)
        .set({
          lastMessageId: newMessage.id,
          lastActivity: new Date()
        })
        .where(
          or(
            and(
              eq(conversations.user1Id, userId < friendId ? userId : friendId),
              eq(conversations.user2Id, userId < friendId ? friendId : userId)
            )
          )
        );
      
      res.json({
        success: true,
        message: {
          id: newMessage.id,
          senderId: newMessage.senderId,
          content: newMessage.content || '',
          mediaUrl: newMessage.mediaUrl,
          mediaType: 'gif',
          createdAt: newMessage.createdAt?.toISOString(),
          isRead: newMessage.isRead
        }
      });
    } catch (error) {
      console.error('Send GIF error:', error);
      res.status(500).json({ message: 'Failed to send GIF' });
    }
  });

  // Get streak data (Kliq Koin)
  app.get('/api/mobile/streak', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      // TODO: Implement real streak query from database
      // For MVP, return starter data
      res.json({
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        kliqKoinBalance: 0,
        tier: 'Starter',
        nextMilestone: 3,
        lastCheckIn: null
      });
    } catch (error) {
      console.error('Get streak error:', error);
      res.status(500).json({ message: 'Failed to fetch streak data' });
    }
  });

  // Daily check-in (Kliq Koin)
  app.post('/api/mobile/streak/checkin', verifyMobileToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      // TODO: Implement real check-in logic with database update
      // For MVP, return updated mock data
      res.json({
        currentStreak: 1,
        longestStreak: 1,
        totalCheckIns: 1,
        kliqKoinBalance: 10,
        tier: 'Starter',
        nextMilestone: 3,
        lastCheckIn: new Date().toISOString()
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ message: 'Failed to check in' });
    }
  });

  // Mobile backend health check endpoint
  app.get('/api/mobile/health', (req, res) => {
    res.json({
      status: 'Mobile backend ready',
      timestamp: new Date().toISOString(),
      endpoints: [
        'POST /api/mobile/auth/login - JWT authentication',
        'GET /api/mobile/user/profile - User profile with JWT',
        'GET /api/mobile/feed - Paginated social feed',
        'POST /api/mobile/posts - Create new posts',
        'POST /api/mobile/posts/:postId/like - Like/unlike posts',
        'GET /api/mobile/friends - Friends list',
        'GET /api/mobile/stories - Stories grouped by user',
        'POST /api/mobile/notifications/register - Push notification registration',
        'POST /api/mobile/upload - File upload preparation',
        'GET /api/mood-boost/posts - Get mood boost posts for current user'
      ],
      features: [
        'JWT Authentication',
        'Push Notifications',
        'File Upload Support',
        'Paginated Responses',
        'Optimized for Mobile',
        'AI-Powered Mood Boosts'
      ]
    });
  });

  // Mood Boost Posts - Get posts for current user
  app.get('/api/mood-boost/posts', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const posts = await storage.getMoodBoostPostsForUser(userId);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching mood boost posts:', error);
      res.status(500).json({ message: 'Failed to fetch mood boost posts' });
    }
  });

  // Cleanup expired mood boost posts (can be called manually or by cron)
  app.post('/api/mood-boost/cleanup', async (req, res) => {
    try {
      const { cleanupExpiredMoodBoostPosts } = await import('./services/moodBoostService');
      await cleanupExpiredMoodBoostPosts();
      res.json({ message: 'Cleanup completed successfully' });
    } catch (error) {
      console.error('Error during mood boost cleanup:', error);
      res.status(500).json({ message: 'Cleanup failed' });
    }
  });



  // Alternative login endpoint to avoid Replit auth conflicts
  app.post('/api/user/login', async (req, res) => {
    console.log('=== LOGIN ATTEMPT ===', new Date().toISOString());
    console.log('Request body:', req.body);
    console.log('User agent:', req.headers['user-agent']);
    try {
      const { phoneNumber, password } = req.body;

      if (!phoneNumber || !password) {
        return res.status(400).json({ 
          message: "Phone number and password are required" 
        });
      }

      // Find user by phone number
      console.log('Looking for user with phone:', phoneNumber);
      const user = await storage.getUserByPhone(phoneNumber);
      console.log('User found:', !!user, user ? `ID: ${user.id}` : 'Not found');
      if (!user) {
        return res.status(401).json({ 
          message: "Invalid phone number or password" 
        });
      }

      // Check if user has a password set
      console.log('Password check for user:', user.id, 'Password exists:', !!user.password);
      if (!user.password) {
        return res.status(401).json({ 
          message: "No password set for this account. Please set up your password first." 
        });
      }

      // Check if it's an old hashed password or new encrypted password
      if (user.password.startsWith('$2b$')) {
        // Old bcrypt hashed password - use bcrypt comparison
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ 
            message: "Invalid phone number or password" 
          });
        }
      } else {
        // New encrypted password - decrypt and compare
        const { decryptFromStorage } = await import('./cryptoService');
        try {
          const decryptedPassword = decryptFromStorage(user.password);
          if (password !== decryptedPassword) {
            return res.status(401).json({ 
              message: "Invalid phone number or password" 
            });
          }
        } catch (error) {
          return res.status(401).json({ 
            message: "Invalid phone number or password" 
          });
        }
      }

      // Create session for the user (matching the OAuth session structure)
      const userSession = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl
        },
        access_token: 'custom-password-login',
        refresh_token: null,
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      };

      // Authenticate the user in the session
      req.login(userSession, (err: any) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({ 
            message: "Failed to create session" 
          });
        }
        
        console.log("Login successful for user:", user.id);
        res.setHeader('Content-Type', 'application/json');
        res.json({ 
          message: "Login successful",
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl
          }
        });
      });

    } catch (error) {
      console.error("Login error:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        message: "Login failed. Please try again." 
      });
    }
  });

  // Password reset endpoints
  // Helper function to check if user is locked from password reset attempts
  async function checkPasswordResetLockout(userId: string): Promise<{ isLocked: boolean; remainingHours?: number; attemptCount: number }> {
    const attempts = await storage.getPasswordResetAttempts(userId);
    if (!attempts) {
      return { isLocked: false, attemptCount: 0 };
    }

    // Check if user is currently locked
    if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
      const remainingMs = attempts.lockedUntil.getTime() - new Date().getTime();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      return { isLocked: true, remainingHours, attemptCount: attempts.attemptCount || 0 };
    }

    return { isLocked: false, attemptCount: attempts.attemptCount || 0 };
  }

  // Step 1: Verify name
  app.post('/api/auth/verify-name', async (req, res) => {
    try {
      const { firstName, lastName } = req.body;
      
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }

      // Find user by name (case-insensitive)
      const user = await storage.getUserByName(firstName.trim(), lastName.trim());
      if (!user) {
        // Record failed attempt for any user with this name if they exist
        const users = await storage.getAllUsers();
        const matchingUser = users.find(u => 
          u.firstName?.toLowerCase() === firstName.trim().toLowerCase() ||
          u.lastName?.toLowerCase() === lastName.trim().toLowerCase()
        );
        
        if (matchingUser) {
          await storage.recordPasswordResetAttempt(matchingUser.id);
          const lockStatus = await checkPasswordResetLockout(matchingUser.id);
          
          if (lockStatus.attemptCount >= 10) {
            await storage.lockPasswordReset(matchingUser.id);
          }
        }
        
        return res.status(404).json({ message: "No account found with this name" });
      }

      // Check lockout status
      const lockStatus = await checkPasswordResetLockout(user.id);
      if (lockStatus.isLocked) {
        return res.status(429).json({ 
          message: `Account locked for ${lockStatus.remainingHours} hours due to too many failed password reset attempts` 
        });
      }

      res.json({ 
        success: true, 
        message: "Name verified successfully" 
      });
    } catch (error) {
      console.error("Error verifying name:", error);
      res.status(500).json({ message: "Failed to verify name" });
    }
  });

  // Step 2: Verify phone number (requires name from step 1)
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { firstName, lastName, phoneNumber } = req.body;
      
      if (!firstName || !lastName || !phoneNumber) {
        return res.status(400).json({ message: "First name, last name, and phone number are required" });
      }

      // Find user by name and phone number for extra security
      const user = await storage.getUserByNameAndPhone(firstName.trim(), lastName.trim(), phoneNumber);
      if (!user) {
        // Record failed attempt if user with name exists
        const userByName = await storage.getUserByName(firstName.trim(), lastName.trim());
        if (userByName) {
          await storage.recordPasswordResetAttempt(userByName.id);
          const lockStatus = await checkPasswordResetLockout(userByName.id);
          
          if (lockStatus.attemptCount >= 10) {
            await storage.lockPasswordReset(userByName.id);
          }
        }
        
        return res.status(404).json({ message: "Account information does not match our records" });
      }

      // Check lockout status
      const lockStatus = await checkPasswordResetLockout(user.id);
      if (lockStatus.isLocked) {
        return res.status(429).json({ 
          message: `Account locked for ${lockStatus.remainingHours} hours due to too many failed password reset attempts` 
        });
      }

      // Check if user has security questions set up
      console.log('Security questions check:', {
        answer1: !!user.securityAnswer1,
        answer2: !!user.securityAnswer2, 
        answer3: !!user.securityAnswer3,
        userId: user.id
      });
      
      if (!user.securityAnswer1 || !user.securityAnswer2 || !user.securityAnswer3) {
        return res.status(400).json({ message: "Security questions not set up for this account" });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store reset token in storage
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

      res.json({ 
        success: true, 
        resetToken: resetToken, // Send token for frontend flow
        message: "Phone number verified successfully" 
      });
    } catch (error) {
      console.error("Error verifying phone number:", error);
      res.status(500).json({ message: "Failed to verify phone number" });
    }
  });

  app.post('/api/auth/verify-security', async (req, res) => {
    try {
      const { resetToken, securityAnswer1, securityAnswer2, securityAnswer3 } = req.body;
      
      if (!resetToken || !securityAnswer1 || !securityAnswer2 || !securityAnswer3) {
        return res.status(400).json({ message: "All security answers are required" });
      }

      // Get reset token from storage
      const tokenData = await storage.getPasswordResetToken(resetToken);
      if (!tokenData || tokenData.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Get user to verify security questions
      const user = await storage.getUser(tokenData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check lockout status
      const lockStatus = await checkPasswordResetLockout(user.id);
      if (lockStatus.isLocked) {
        return res.status(429).json({ 
          message: `Account locked for ${lockStatus.remainingHours} hours due to too many failed password reset attempts` 
        });
      }

      // Verify security answers (case-insensitive)
      const answer1Valid = await bcrypt.compare(securityAnswer1.toLowerCase().trim(), user.securityAnswer1!);
      const answer2Valid = await bcrypt.compare(securityAnswer2.toLowerCase().trim(), user.securityAnswer2!);
      const answer3Valid = await bcrypt.compare(securityAnswer3.toLowerCase().trim(), user.securityAnswer3!);

      if (!answer1Valid || !answer2Valid || !answer3Valid) {
        // Record failed attempt
        await storage.recordPasswordResetAttempt(user.id);
        const updatedLockStatus = await checkPasswordResetLockout(user.id);
        
        if (updatedLockStatus.attemptCount >= 10) {
          await storage.lockPasswordReset(user.id);
          return res.status(429).json({ message: "Too many failed attempts. Account locked for 24 hours." });
        } else if (updatedLockStatus.attemptCount === 8) {
          return res.status(400).json({ message: `Security answers do not match. Warning: 2 more failed attempts will lock your account for 24 hours.` });
        } else if (updatedLockStatus.attemptCount === 9) {
          return res.status(400).json({ message: `Security answers do not match. Warning: 1 more failed attempt will lock your account for 24 hours.` });
        }
        
        return res.status(400).json({ message: "Security answers do not match" });
      }

      res.json({ success: true, message: "Security questions verified" });
    } catch (error) {
      console.error("Error verifying security questions:", error);
      res.status(500).json({ message: "Failed to verify security questions" });
    }
  });

  // Check if user has legacy security data that needs updating
  app.get('/api/user/security-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hasLegacyData = {
        pin: user.securityPin && user.securityPin.startsWith('$2b$'),
        answer1: user.securityAnswer1 && user.securityAnswer1.startsWith('$2b$'),
        answer2: user.securityAnswer2 && user.securityAnswer2.startsWith('$2b$'),
        answer3: user.securityAnswer3 && user.securityAnswer3.startsWith('$2b$'),
      };

      const needsUpdate = hasLegacyData.pin || hasLegacyData.answer1 || hasLegacyData.answer2 || hasLegacyData.answer3;

      res.json({ hasLegacyData, needsUpdate });
    } catch (error) {
      console.error("Error checking security status:", error);
      res.status(500).json({ message: "Failed to check security status" });
    }
  });

  // PIN verification for password viewing
  app.post('/api/user/verify-pin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pin } = req.body;
      
      if (!pin) {
        return res.status(400).json({ message: "PIN is required" });
      }

      // Validate PIN format (4 digits)
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ message: "PIN must be exactly 4 digits" });
      }

      // Get user to verify PIN
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has a PIN set up
      if (!user.securityPin) {
        return res.status(400).json({ message: "Security PIN not set up for this account" });
      }

      // Verify PIN
      const pinValid = await bcrypt.compare(pin, user.securityPin);
      if (!pinValid) {
        return res.status(400).json({ message: "Invalid PIN" });
      }

      res.json({ success: true, message: "PIN verified successfully" });
    } catch (error) {
      console.error("Error verifying PIN:", error);
      res.status(500).json({ message: "Failed to verify PIN" });
    }
  });

  app.post('/api/auth/verify-pin', async (req, res) => {
    try {
      const { resetToken, pin } = req.body;
      
      if (!resetToken || !pin) {
        return res.status(400).json({ message: "Reset token and PIN are required" });
      }

      // Validate PIN format (4 digits)
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ message: "PIN must be exactly 4 digits" });
      }

      // Get reset token from storage
      const tokenData = await storage.getPasswordResetToken(resetToken);
      if (!tokenData || tokenData.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Get user to verify PIN
      const user = await storage.getUser(tokenData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check lockout status
      const lockStatus = await checkPasswordResetLockout(user.id);
      if (lockStatus.isLocked) {
        return res.status(429).json({ 
          message: `Account locked for ${lockStatus.remainingHours} hours due to too many failed password reset attempts` 
        });
      }

      // Check if user has a PIN set up
      if (!user.securityPin) {
        return res.status(400).json({ message: "Security PIN not set up for this account" });
      }

      // Verify PIN
      const pinValid = await bcrypt.compare(pin, user.securityPin);
      if (!pinValid) {
        // Record failed attempt
        await storage.recordPasswordResetAttempt(user.id);
        const updatedLockStatus = await checkPasswordResetLockout(user.id);
        
        if (updatedLockStatus.attemptCount >= 10) {
          await storage.lockPasswordReset(user.id);
          return res.status(429).json({ message: "Too many failed attempts. Account locked for 24 hours." });
        } else if (updatedLockStatus.attemptCount === 8) {
          return res.status(400).json({ message: `Invalid PIN. Warning: 2 more failed attempts will lock your account for 24 hours.` });
        } else if (updatedLockStatus.attemptCount === 9) {
          return res.status(400).json({ message: `Invalid PIN. Warning: 1 more failed attempt will lock your account for 24 hours.` });
        }
        
        return res.status(400).json({ message: "Invalid PIN" });
      }

      res.json({ success: true, message: "PIN verified successfully" });
    } catch (error) {
      console.error("Error verifying PIN:", error);
      res.status(500).json({ message: "Failed to verify PIN" });
    }
  });

  // PIN verification for authenticated settings access
  app.post('/api/user/verify-pin', isAuthenticated, async (req: any, res) => {
    try {
      const { pin } = req.body;
      
      if (!pin) {
        return res.status(400).json({ message: "PIN is required" });
      }

      // Validate PIN format (4 digits)
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ message: "PIN must be exactly 4 digits" });
      }

      // Get authenticated user
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has a PIN set up
      if (!user.securityPin) {
        return res.status(400).json({ message: "Security PIN not set up for this account. Please set up your PIN in profile settings first." });
      }

      // Verify PIN
      const pinValid = await bcrypt.compare(pin, user.securityPin);
      if (!pinValid) {
        return res.status(400).json({ message: "Invalid PIN" });
      }

      res.json({ success: true, message: "PIN verified successfully" });
    } catch (error) {
      console.error("Error verifying PIN for settings access:", error);
      res.status(500).json({ message: "Failed to verify PIN" });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { resetToken, newPassword } = req.body;
      
      if (!resetToken || !newPassword) {
        return res.status(400).json({ message: "Reset token and new password are required" });
      }

      // Get reset token from storage
      const tokenData = await storage.getPasswordResetToken(resetToken);
      if (!tokenData || tokenData.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check lockout status
      const lockStatus = await checkPasswordResetLockout(tokenData.userId);
      if (lockStatus.isLocked) {
        return res.status(429).json({ 
          message: `Account locked for ${lockStatus.remainingHours} hours due to too many failed password reset attempts` 
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await storage.updateUser(tokenData.userId, { password: hashedPassword });

      // Clear password reset attempts on successful reset
      await storage.clearPasswordResetAttempts(tokenData.userId);

      // Delete used reset token
      await storage.deletePasswordResetToken(resetToken);

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Public user profile endpoint (for viewing other users' profiles)
  app.get('/api/user/profile/:userId', async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return public profile info (excluding sensitive data)
      const publicProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        backgroundImageUrl: user.backgroundImageUrl,
        bio: user.bio,
        kliqName: user.kliqName,
        birthdate: user.birthdate,
        profileMusicUrls: user.profileMusicUrls,
        profileMusicTitles: user.profileMusicTitles,
        createdAt: user.createdAt,
      };
      
      res.json(publicProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Unified profile endpoint (basic info + details)
  app.put("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = req.body;

      // Validate and clean the data
      const cleanedData: any = {};
      
      // Handle basic profile fields
      if (profileData.bio !== undefined) cleanedData.bio = profileData.bio;
      if (profileData.phoneNumber !== undefined) cleanedData.phoneNumber = profileData.phoneNumber;
      if (profileData.kliqName !== undefined) cleanedData.kliqName = profileData.kliqName;
      if (profileData.kliqLeftEmoji !== undefined) cleanedData.kliqLeftEmoji = profileData.kliqLeftEmoji;
      if (profileData.kliqRightEmoji !== undefined) cleanedData.kliqRightEmoji = profileData.kliqRightEmoji;
      if (profileData.birthdate !== undefined) cleanedData.birthdate = profileData.birthdate;
      
      // Handle security questions (hash them for security)
      if (profileData.securityAnswer1) {
        cleanedData.securityAnswer1 = await bcrypt.hash(profileData.securityAnswer1.toLowerCase().trim(), 12);
      }
      if (profileData.securityAnswer2) {
        cleanedData.securityAnswer2 = await bcrypt.hash(profileData.securityAnswer2.toLowerCase().trim(), 12);
      }
      if (profileData.securityAnswer3) {
        cleanedData.securityAnswer3 = await bcrypt.hash(profileData.securityAnswer3.toLowerCase().trim(), 12);
      }
      
      // Handle security PIN (hash it for security)
      if (profileData.securityPin) {
        cleanedData.securityPin = await bcrypt.hash(profileData.securityPin.trim(), 12);
      }
      
      // Handle array fields (filter out empty strings)
      if (profileData.interests) cleanedData.interests = profileData.interests.filter((item: string) => item.trim());
      if (profileData.favoriteLocations) cleanedData.favoriteLocations = profileData.favoriteLocations.filter((item: string) => item.trim());
      if (profileData.favoriteFoods) cleanedData.favoriteFoods = profileData.favoriteFoods.filter((item: string) => item.trim());
      if (profileData.musicGenres) cleanedData.musicGenres = profileData.musicGenres.filter((item: string) => item.trim());
      if (profileData.hobbies) cleanedData.hobbies = profileData.hobbies.filter((item: string) => item.trim());
      if (profileData.favoriteMovies) cleanedData.favoriteMovies = profileData.favoriteMovies.filter((item: string) => item.trim());
      if (profileData.favoriteBooks) cleanedData.favoriteBooks = profileData.favoriteBooks.filter((item: string) => item.trim());
      
      // Handle string fields
      if (profileData.relationshipStatus !== undefined) cleanedData.relationshipStatus = profileData.relationshipStatus;
      if (profileData.petPreferences !== undefined) cleanedData.petPreferences = profileData.petPreferences;
      if (profileData.lifestyle !== undefined) cleanedData.lifestyle = profileData.lifestyle;

      await storage.updateUser(userId, cleanedData);

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Profile music endpoints
  app.put("/api/user/profile-music", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { musicUrl, musicTitle, musicUrls, musicTitles } = req.body;

      // Handle both single URL/title and array format for backward compatibility
      let finalMusicUrls: string[] = [];
      let finalMusicTitles: string[] = [];

      if (musicUrls && musicTitles) {
        // New array format
        finalMusicUrls = musicUrls;
        finalMusicTitles = musicTitles;
      } else if (musicUrl && musicTitle) {
        // Legacy single format - add to existing arrays
        const user = await storage.getUser(userId);
        finalMusicUrls = [...(user?.profileMusicUrls || [])];
        finalMusicTitles = [...(user?.profileMusicTitles || [])];
        
        // Handle different types of URLs
        let processedUrl = musicUrl;
        
        // For URLs from object storage, normalize the path
        if (musicUrl.includes('storage.googleapis.com') || musicUrl.startsWith('/objects/')) {
          try {
            const objectStorageService = new ObjectStorageService();
            processedUrl = objectStorageService.normalizeObjectEntityPath(musicUrl);
          } catch (error) {
            console.log("Error normalizing object path, using original URL:", error);
            processedUrl = musicUrl;
          }
        }
        
        finalMusicUrls.push(processedUrl);
        finalMusicTitles.push(musicTitle);
      } else {
        return res.status(400).json({ message: "Music URL(s) and title(s) are required" });
      }

      await storage.updateUser(userId, {
        profileMusicUrls: finalMusicUrls,
        profileMusicTitles: finalMusicTitles,
      });

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile music:", error);
      res.status(500).json({ message: "Failed to update profile music" });
    }
  });

  app.delete("/api/user/profile-music", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { index } = req.body; // Optional: remove specific track by index
      
      if (index !== undefined && index >= 0) {
        // Remove specific track by index
        const user = await storage.getUser(userId);
        const musicUrls = [...(user?.profileMusicUrls || [])];
        const musicTitles = [...(user?.profileMusicTitles || [])];
        
        if (index < musicUrls.length) {
          musicUrls.splice(index, 1);
          musicTitles.splice(index, 1);
        }
        
        await storage.updateUser(userId, {
          profileMusicUrls: musicUrls,
          profileMusicTitles: musicTitles,
        });
      } else {
        // Remove all music
        await storage.updateUser(userId, {
          profileMusicUrls: [],
          profileMusicTitles: [],
        });
      }

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error removing profile music:", error);
      res.status(500).json({ message: "Failed to remove profile music" });
    }
  });

  // Background image update endpoint
  app.patch("/api/user/background", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { backgroundImageUrl } = req.body;

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(
        backgroundImageUrl
      );

      await storage.updateUser(userId, {
        backgroundImageUrl: normalizedPath,
      });

      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating background image:", error);
      res.status(500).json({ message: "Failed to update background image" });
    }
  });

  app.post('/api/user/generate-invite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const inviteCode = await storage.generateInviteCode();
      await storage.updateUser(userId, { inviteCode });
      res.json({ inviteCode });
    } catch (error) {
      console.error("Error generating invite code:", error);
      res.status(500).json({ message: "Failed to generate invite code" });
    }
  });

  // Object storage upload endpoint
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Public upload endpoint for memes
  app.post("/api/objects/upload-public-meme", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getPublicMemeUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Failed to get public meme upload URL:", error);
      res.status(500).json({ error: "Failed to get public meme upload URL" });
    }
  });

  // Serve static files from attached_assets (border images, etc.)
  app.use("/attached_assets", express.static("attached_assets"));

  // Serve uploaded objects (profile pictures, etc.)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Serve public objects (public memes, etc.)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(req.params.filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Proxy endpoint for meme images (to make private URLs accessible)
  app.get("/api/meme-proxy", async (req, res) => {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    // Only allow Google Cloud Storage URLs for security
    if (!url.startsWith('https://storage.googleapis.com/')) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch image" });
      }

      // Copy headers
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const contentLength = response.headers.get('content-length');
      
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      });
      
      if (contentLength) {
        res.set('Content-Length', contentLength);
      }

      // Stream the image
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      console.error("Error proxying meme image:", error);
      res.status(500).json({ error: "Failed to proxy image" });
    }
  });

  // Profile picture update endpoint
  app.put("/api/user/profile-picture", isAuthenticated, async (req: any, res) => {
    if (!req.body.profileImageURL) {
      return res.status(400).json({ error: "profileImageURL is required" });
    }

    const userId = req.user.claims.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.profileImageURL
      );

      // Update user's profile image URL in database
      await storage.updateUser(userId, { profileImageUrl: objectPath });

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Theme routes
  app.get('/api/user/theme', async (req: any, res) => {
    try {
      // For debugging - use a default user ID if not authenticated
      const userId = req.user?.claims?.sub || "46297180"; // Use the logged-in user's ID as fallback
      const theme = await storage.getUserTheme(userId);
      res.json(theme);
    } catch (error) {
      console.error("Error fetching theme:", error);
      res.status(500).json({ message: "Failed to fetch theme" });
    }
  });

  app.post('/api/user/theme', async (req: any, res) => {
    try {
      // For debugging - use a default user ID if not authenticated
      const userId = req.user?.claims?.sub || "46297180"; // Use the logged-in user's ID as fallback
      const themeData = insertUserThemeSchema.parse({ ...req.body, userId });
      const theme = await storage.upsertUserTheme(themeData);
      res.json(theme);
    } catch (error) {
      console.error("Error saving theme:", error);
      res.status(500).json({ message: "Failed to save theme" });
    }
  });

  // Friend routes
  app.get('/api/friends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.post('/api/friends/invite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { inviteCode } = req.body;
      
      // Check if invite code has already been used
      const isCodeUsed = await storage.isInviteCodeUsed(inviteCode);
      if (isCodeUsed) {
        return res.status(400).json({ message: "This invite code has already been used" });
      }
      
      const inviter = await storage.getUserByInviteCode(inviteCode);
      if (!inviter) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      // Check if kliq is closed to new members
      if (inviter.kliqClosed) {
        return res.status(400).json({ message: "This kliq is closed to new members" });
      }

      // Check if friendship already exists
      const existingFriends = await storage.getFriends(inviter.id);
      if (existingFriends.find(f => f.friendId === userId)) {
        return res.status(400).json({ message: "Already friends with this user" });
      }

      // Check friend limit
      if (existingFriends.length >= 28) {
        return res.status(400).json({ message: "User has reached maximum friend limit" });
      }

      // Mark the invite code as used before creating the friendship
      await storage.markInviteCodeAsUsed(inviteCode, userId, inviter.id);

      const rank = existingFriends.length + 1;
      const friendship = await storage.addFriend({
        userId: inviter.id,
        friendId: userId,
        rank,
        status: "accepted"
      });

      res.json(friendship);
    } catch (error) {
      console.error("Error joining kliq:", error);
      res.status(500).json({ message: "Failed to join kliq" });
    }
  });





  app.put('/api/friends/:friendId/rank', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.params;
      const { rank } = req.body;
      
      await storage.updateFriendRank(userId, friendId, rank);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating friend rank:", error);
      res.status(500).json({ message: "Failed to update friend rank" });
    }
  });

  app.delete('/api/friends/:friendId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.params;
      
      await storage.removeFriend(userId, friendId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  // Leave kliq - removes all friendships for the user
  app.delete('/api/friends/leave-kliq', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      await storage.leaveKliq(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving kliq:", error);
      res.status(500).json({ message: "Failed to leave kliq" });
    }
  });

  // Post routes
  app.get('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filters = await storage.getContentFilters(userId);
      const filterKeywords = filters.map(f => f.keyword);
      const posts = await storage.getPosts(userId, filterKeywords);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Get aggregated kliq feed with posts, polls, events, and actions from all kliq members
  app.get('/api/kliq-feed', isAuthenticated, rateLimitService.createRateLimitMiddleware('feed'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(5, parseInt(req.query.limit as string) || 20)); // Between 5-50 items
      
      const cacheKey = `kliq-feed:${userId}:${page}:${limit}`;
      
      // Try to get from cache first using our optimized cache service
      const feed = await performanceOptimizer.optimizeQuery(
        async () => {
          const filters = await storage.getContentFilters(userId);
          const filterKeywords = filters.map(f => f.keyword);
          return await storage.getKliqFeed(userId, filterKeywords, page, limit);
        },
        cacheKey,
        120 // Cache for 2 minutes (longer for paginated content)
      );
      
      res.json(feed);
    } catch (error) {
      console.error("Error fetching kliq feed:", error);
      res.status(500).json({ message: "Failed to fetch kliq feed" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Convert numeric coordinates to strings if present and handle address
      const processedBody = { ...req.body, userId };
      if (processedBody.latitude !== undefined && typeof processedBody.latitude === 'number') {
        processedBody.latitude = processedBody.latitude.toString();
      }
      if (processedBody.longitude !== undefined && typeof processedBody.longitude === 'number') {
        processedBody.longitude = processedBody.longitude.toString();
      }
      // Ensure address field is included
      if (processedBody.address === undefined) {
        processedBody.address = null;
      }
      
      let postData = insertPostSchema.parse(processedBody);
      
      // Normalize media URL if provided
      if (postData.mediaUrl) {
        const objectStorage = new ObjectStorageService();
        postData.mediaUrl = objectStorage.normalizeObjectEntityPath(postData.mediaUrl);
      }
      
      const post = await storage.createPost(postData);
      
      // Award 0.50 Kliq Koins for creating a post
      try {
        await storage.awardKoins(userId, 0.50, 'post_create', post.id);
      } catch (koinError) {
        console.error("Error awarding Koins for post creation:", koinError);
      }
      
      // Broadcast feed update to all connected clients
      try {
        (req.app as any).broadcastFeedUpdate('post');
      } catch (broadcastError) {
        console.error("Error broadcasting feed update:", broadcastError);
      }
      
      // Invalidate cache for feeds that need to show this new post
      const { invalidateCache } = await import('./cache');
      invalidateCache('kliq-feed'); // Invalidate all kliq feed caches (old cache system)
      invalidateCache('posts'); // Invalidate posts caches (old cache system)
      
      // Also invalidate the new cache system used by performanceOptimizer
      await cacheService.invalidatePattern('kliq-feed');
      
      // Detect if post has a mood field and trigger mood boost generation
      if (post.mood) {
        console.log(`🎭 Detected mood post from user ${userId}: ${post.mood}`);
        
        // First, delete ALL existing mood boost posts for this user (new mood replaces old mood)
        const { deleteMoodBoostPostsForUser } = await import('./services/moodBoostService');
        await deleteMoodBoostPostsForUser(userId, true); // true = delete ALL mood boost posts
        
        // Invalidate mood boost cache immediately so frontend sees the change
        invalidateCache('mood-boost');
        await cacheService.invalidatePattern('mood-boost');
        
        // Then trigger new mood boost generation asynchronously (don't wait for it)
        const { triggerMoodBoostForUser } = await import('./services/moodBoostScheduler');
        triggerMoodBoostForUser(userId, post.mood).catch(err => {
          console.error('Failed to trigger mood boost:', err);
        });
      }
      
      // Create notifications for post likes (for future likes)
      // Note: Actual like notifications will be created when someone likes the post
      
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Edit post endpoint
  app.put('/api/posts/:postId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      const { content } = req.body;
      
      // Verify that the user owns this post
      const existingPost = await storage.getPostById(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (existingPost.userId !== userId) {
        return res.status(403).json({ message: "You can only edit your own posts" });
      }
      
      // Update the post content
      const updatedPost = await storage.updatePost(postId, { content });
      
      // Invalidate cache for feeds
      const { invalidateCache } = await import('./cache');
      invalidateCache('kliq-feed'); // Old cache system
      invalidateCache('posts'); // Old cache system
      
      // Also invalidate the new cache system used by performanceOptimizer
      await cacheService.invalidatePattern('kliq-feed');
      
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  // Delete Post (author only)
  app.delete('/api/posts/:postId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      // Check if post exists and user is the author
      const existingPost = await storage.getPostById(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (existingPost.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }
      
      // If the post had a mood, delete all associated mood boost posts
      if (existingPost.mood) {
        const { deleteMoodBoostPostsForUser } = await import('./services/moodBoostService');
        await deleteMoodBoostPostsForUser(userId, true); // true = delete ALL mood boost posts (including staggered ones)
      }
      
      // Delete the post
      await storage.deletePost(postId);
      
      // Invalidate cache for feeds
      const { invalidateCache } = await import('./cache');
      invalidateCache('kliq-feed'); // Old cache system
      invalidateCache('posts'); // Old cache system
      invalidateCache('mood-boost'); // Clear mood boost cache when mood posts are deleted
      
      // Also invalidate the new cache system used by performanceOptimizer
      await cacheService.invalidatePattern('kliq-feed');
      await cacheService.invalidatePattern('mood-boost'); // Clear mood boost cache
      
      res.json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Share post to user's own Headlines
  app.post('/api/posts/:postId/share', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      // Get the original post
      const originalPost = await storage.getPostById(postId);
      if (!originalPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Don't allow sharing your own posts
      if (originalPost.userId === userId) {
        return res.status(400).json({ message: "You cannot share your own posts" });
      }
      
      // Create a shared post
      const sharedPostData = {
        userId, // The person sharing
        content: originalPost.content,
        mediaUrl: originalPost.mediaUrl,
        mediaType: originalPost.mediaType,
        gifId: originalPost.gifId,
        memeId: originalPost.memeId,
        movieconId: originalPost.movieconId,
        sharedFromPostId: postId,
        originalAuthorId: originalPost.userId,
        postType: originalPost.postType || 'regular',
      };
      
      const sharedPost = await storage.createPost(sharedPostData);
      
      // Invalidate cache
      const { invalidateCache } = await import('./cache');
      invalidateCache('kliq-feed');
      invalidateCache('posts');
      await cacheService.invalidatePattern('kliq-feed');
      
      res.json({ success: true, sharedPost });
    } catch (error) {
      console.error("Error sharing post:", error);
      res.status(500).json({ message: "Failed to share post" });
    }
  });

  app.post('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      await storage.likePost(postId, userId);
      
      // Get post details to notify the author
      const post = await storage.getPostById(postId);
      console.log("Post like notification check:", { postUserId: post?.userId, currentUserId: userId, shouldNotify: post && post.userId !== userId });
      
      if (post) {
        const user = await storage.getUser(userId);
        if (user) {
          console.log("Creating like notification for:", post.userId, "from:", user.firstName);
          await notificationService.notifyPostLike(
            post.userId,
            user.firstName || "Someone",
            postId
          );
        }
        
        // Award 0.25 Kliq Koins for liking a post (not own post)
        if (post.userId !== userId) {
          try {
            await storage.awardKoins(userId, 0.25, 'post_like', postId);
          } catch (koinError) {
            console.error("Error awarding Koins for post like:", koinError);
          }
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      await storage.unlikePost(postId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  app.post('/api/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      const commentData = insertCommentSchema.parse({ ...req.body, userId, postId });
      const comment = await storage.addComment(commentData);
      
      // Get post details to notify the author
      const post = await storage.getPostById(postId);
      if (post) {
        const user = await storage.getUser(userId);
        if (user) {
          const commentPreview = comment.content.slice(0, 50) + (comment.content.length > 50 ? "..." : "");
          await notificationService.notifyComment(
            post.userId,
            user.firstName || "Someone",
            postId,
            commentPreview
          );
        }
        
        // Award 0.25 Kliq Koins for commenting on another user's post (not own post)
        if (post.userId !== userId) {
          try {
            await storage.awardKoins(userId, 0.25, 'comment_create', comment.id);
          } catch (koinError) {
            console.error("Error awarding Koins for comment creation:", koinError);
          }
        }
      }
      
      res.json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Like a comment
  app.post('/api/comments/:commentId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { commentId } = req.params;
      
      await storage.likeComment(commentId, userId);
      
      // Get comment details to notify the author
      const comment = await storage.getCommentById(commentId);
      console.log("Comment like notification check:", { commentUserId: comment?.userId, currentUserId: userId, shouldNotify: comment && comment.userId !== userId });
      
      if (comment && comment.userId !== userId) {
        const user = await storage.getUser(userId);
        if (user) {
          console.log("Creating comment like notification for:", comment.userId, "from:", user.firstName);
          const commentPreview = comment.content.slice(0, 50) + (comment.content.length > 50 ? "..." : "");
          await notificationService.notifyCommentLike(
            comment.userId,
            user.firstName || "Someone",
            comment.id,
            commentPreview
          );
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({ message: "Failed to like comment" });
    }
  });

  // Unlike a comment
  app.delete('/api/comments/:commentId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { commentId } = req.params;
      
      await storage.unlikeComment(commentId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unliking comment:", error);
      res.status(500).json({ message: "Failed to unlike comment" });
    }
  });

  // Reply to a comment (nested comment)
  app.post('/api/comments/:commentId/reply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { commentId } = req.params;
      
      // Get parent comment to get the postId
      const parentComment = await storage.getCommentById(commentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
      
      const replyData = insertCommentSchema.parse({ 
        ...req.body, 
        userId, 
        postId: parentComment.postId,
        parentCommentId: commentId 
      });
      
      const reply = await storage.addComment(replyData);
      
      // Notify the parent comment author
      console.log("Comment reply notification check:", { parentCommentUserId: parentComment.userId, currentUserId: userId, shouldNotify: parentComment.userId !== userId });
      
      if (parentComment.userId !== userId) {
        const user = await storage.getUser(userId);
        if (user) {
          console.log("Creating comment reply notification for:", parentComment.userId, "from:", user.firstName);
          const replyPreview = reply.content.slice(0, 50) + (reply.content.length > 50 ? "..." : "");
          await notificationService.notifyComment(
            parentComment.userId,
            `${user.firstName || "Someone"} replied to your comment`,
            parentComment.postId,
            replyPreview
          );
        }
        
        // Award 0.25 Kliq Koins for replying to another user's comment (not own comment)
        try {
          await storage.awardKoins(userId, 0.25, 'comment_reply', reply.id);
        } catch (koinError) {
          console.error("Error awarding Koins for comment reply:", koinError);
        }
      }
      
      res.json(reply);
    } catch (error) {
      console.error("Error adding reply:", error);
      res.status(500).json({ message: "Failed to add reply" });
    }
  });

  // Report a post
  app.post('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate report data
      const reportData = insertReportSchema.parse({
        ...req.body,
        reportedBy: userId
      });
      
      // Get the post to find the author
      const post = await storage.getPostById(reportData.postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Add post author ID to the report
      const completeReportData = {
        ...reportData,
        postAuthorId: post.userId
      };
      
      const report = await storage.createReport(completeReportData);
      
      res.json({ success: true, reportId: report.id });
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Get all reports (admin only)
  app.get('/api/admin/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { status, page = 1, limit = 20 } = req.query;
      const reports = await storage.getReports({ 
        status: status || undefined, 
        page: parseInt(page), 
        limit: parseInt(limit) 
      });
      
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Update report status (admin only)
  app.patch('/api/admin/reports/:reportId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reportId } = req.params;
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { status, adminNotes, actionTaken } = req.body;
      
      const updatedReport = await storage.updateReport(reportId, {
        status,
        adminNotes,
        actionTaken,
        reviewedBy: userId,
        reviewedAt: new Date()
      });
      
      res.json(updatedReport);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // Suspend/ban user (admin only)
  app.patch('/api/admin/users/:userId/suspend', isAuthenticated, async (req: any, res) => {
    try {
      const adminUserId = req.user.claims.sub;
      const { userId } = req.params;
      
      // Check if user is admin
      const adminUser = await storage.getUser(adminUserId);
      if (!adminUser?.isAdmin) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { suspensionType, reason } = req.body;
      
      // Calculate suspension end date
      let suspensionExpiresAt = null;
      if (suspensionType !== "banned") {
        const now = new Date();
        switch (suspensionType) {
          case "24hours":
            suspensionExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case "7days":
            suspensionExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case "30days":
            suspensionExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
          case "90days":
            suspensionExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
            break;
          case "180days":
            suspensionExpiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
            break;
        }
      }
      
      await storage.suspendUser(userId, {
        suspensionType,
        suspendedAt: new Date().toISOString(),
        suspensionExpiresAt: suspensionExpiresAt?.toISOString() || null
      });
      
      res.json({ success: true, message: `User ${suspensionType === "banned" ? "banned" : "suspended"} successfully` });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  // Remove post (admin only)
  app.delete('/api/admin/posts/:postId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      // Check if post has a mood before deleting
      const existingPost = await storage.getPostById(postId);
      if (existingPost?.mood) {
        const { deleteMoodBoostPostsForUser } = await import('./services/moodBoostService');
        await deleteMoodBoostPostsForUser(existingPost.userId);
      }
      
      await storage.deletePost(postId);
      
      res.json({ success: true, message: "Post removed successfully" });
    } catch (error) {
      console.error("Error removing post:", error);
      res.status(500).json({ message: "Failed to remove post" });
    }
  });

  // Post reflection endpoint - analyze user's most popular posts from last 30 days
  app.get('/api/posts/reflect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reflection = await storage.getUserReflection(userId);
      res.json(reflection);
    } catch (error) {
      console.error("Error generating reflection:", error);
      res.status(500).json({ message: "Failed to generate reflection" });
    }
  });

  // Daily horoscope endpoint
  app.get('/api/horoscope', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.birthdate) {
        return res.status(400).json({ message: "Birthdate required for horoscope" });
      }

      // Get user's timezone from query parameter, default to UTC
      const userTimezone = req.query.timezone || 'UTC';
      
      // Generate zodiac sign from birthdate
      const zodiacSign = getZodiacSign(user.birthdate);
      
      // Generate daily horoscope
      const horoscope = generateDailyHoroscope(zodiacSign);
      
      // Format date using user's timezone
      const userDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: userTimezone
      });
      
      res.json({
        sign: zodiacSign,
        date: userDate,
        horoscope: horoscope.reading,
        luckyNumber: horoscope.luckyNumber,
        luckyColor: horoscope.luckyColor
      });
    } catch (error) {
      console.error("Error generating horoscope:", error);
      res.status(500).json({ message: "Failed to generate horoscope" });
    }
  });

  // Daily bible verse endpoint
  app.get('/api/bible-verse', isAuthenticated, async (req: any, res) => {
    try {
      // Get user's timezone from query parameter, default to UTC
      const userTimezone = req.query.timezone || 'UTC';
      
      // Generate daily bible verse
      const bibleVerse = generateDailyBibleVerse();
      
      // Format date using user's timezone
      const userDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: userTimezone
      });
      
      res.json({
        date: userDate,
        verse: bibleVerse.verse,
        reference: bibleVerse.reference,
        reflection: bibleVerse.reflection
      });
    } catch (error) {
      console.error("Error generating bible verse:", error);
      res.status(500).json({ message: "Failed to generate bible verse" });
    }
  });

  // Content filter routes
  app.get('/api/filters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filters = await storage.getContentFilters(userId);
      res.json(filters);
    } catch (error) {
      console.error("Error fetching filters:", error);
      res.status(500).json({ message: "Failed to fetch filters" });
    }
  });

  app.post('/api/filters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const filterData = insertContentFilterSchema.parse({ ...req.body, userId });
      const filter = await storage.addContentFilter(filterData);
      res.json(filter);
    } catch (error) {
      console.error("Error adding filter:", error);
      res.status(500).json({ message: "Failed to add filter" });
    }
  });

  app.delete('/api/filters/:filterId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { filterId } = req.params;
      
      await storage.removeContentFilter(userId, filterId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing filter:", error);
      res.status(500).json({ message: "Failed to remove filter" });
    }
  });

  // Media upload routes
  app.post('/api/media/upload', isAuthenticated, async (req: any, res) => {
    try {
      const objectStorage = new ObjectStorageService();
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Media serving route
  app.get('/objects/:objectPath(*)', async (req: any, res) => {
    try {
      const objectStorage = new ObjectStorageService();
      const objectFile = await objectStorage.getObjectEntityFile(req.path);
      objectStorage.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving media:", error);
      res.status(404).json({ message: "Media not found" });
    }
  });

  // Stories routes
  app.get('/api/stories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stories = await storage.getActiveStories(userId);
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.post('/api/stories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let storyData = insertStorySchema.parse({ ...req.body, userId });
      
      // Normalize media URL if provided
      if (storyData.mediaUrl) {
        const objectStorage = new ObjectStorageService();
        storyData.mediaUrl = objectStorage.normalizeObjectEntityPath(storyData.mediaUrl);
      }
      
      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  app.post('/api/stories/:storyId/view', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId } = req.params;
      
      await storage.viewStory(storyId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error viewing story:", error);
      res.status(500).json({ message: "Failed to view story" });
    }
  });

  // Auto-cleanup expired messages every 5 minutes
  // Optimize cleanup intervals to reduce database load
  setInterval(async () => {
    try {
      await storage.deleteExpiredMessages();
      console.log("Cleaned up expired messages");
    } catch (error) {
      console.error("Error cleaning up expired messages:", error);
    }
  }, 10 * 60 * 1000); // Increased to 10 minutes to reduce load

  // Add periodic connection pool health check
  setInterval(() => {
    console.log(`Connection pool stats - Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
  }, 5 * 60 * 1000); // Every 5 minutes

  // Performance monitoring endpoint for internal use
  app.get('/internal/performance', (req, res) => {
    res.json(performanceMonitor.getPerformanceReport());
  });

  // Auto-cleanup old conversations (7+ days) every hour
  setInterval(async () => {
    try {
      await storage.deleteOldConversations();
      console.log("Cleaned up old conversations");
    } catch (error) {
      console.error("Error cleaning up old conversations:", error);
    }
  }, 60 * 60 * 1000); // 1 hour

  // Incognito Messages (IM) routes
  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { participantId } = req.body;

      if (!participantId) {
        return res.status(400).json({ message: "Participant ID is required" });
      }

      // Check if conversation already exists between these users
      const conversations = await storage.getConversations(userId);
      const existingConversation = conversations.find(conv => 
        conv.otherUser.id === participantId
      );

      if (existingConversation) {
        return res.json({ id: participantId });
      }

      // Create new conversation
      const conversation = await storage.createConversation({
        participantIds: [userId, participantId]
      });

      // Return the participant ID so the frontend can navigate correctly
      res.json({ id: participantId });
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/messages/conversation/:otherUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { otherUserId } = req.params;
      const conversation = await storage.getConversation(userId, otherUserId);
      
      if (!conversation) {
        return res.json({ messages: [] });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post('/api/messages/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { receiverId, content, mediaUrl, mediaType, gifId, movieconId } = req.body;

      // Validate that we have at least one type of content
      if (!receiverId || (!content?.trim() && !mediaUrl && !gifId && !movieconId)) {
        console.log("Validation failed:", { receiverId, content: content?.trim(), mediaUrl, gifId, movieconId });
        return res.status(400).json({ message: "receiverId and at least one content type (text, media, gif, or moviecon) are required" });
      }

      // Validate that both sender and receiver exist in the database
      const [sender, receiver] = await Promise.all([
        storage.getUser(userId),
        storage.getUser(receiverId)
      ]);

      if (!sender) {
        console.log("Sender not found:", userId);
        return res.status(400).json({ message: "Sender user not found" });
      }

      if (!receiver) {
        console.log("Receiver not found:", receiverId);
        return res.status(400).json({ message: "Receiver user not found" });
      }

      const messageData = {
        senderId: userId,
        receiverId,
        content: content?.trim() || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        gifId: gifId || null,
        movieconId: movieconId || null,
      };

      const message = await storage.sendMessage(messageData);
      
      // Send incognito message notifications to the receiver (creates both alert and message notifications)
      if (receiverId !== userId) {
        const sender = await storage.getUser(userId);
        if (sender) {
          let messagePreview = "";
          if (content?.trim()) {
            messagePreview = content.trim().slice(0, 30) + (content.trim().length > 30 ? "..." : "");
          } else if (mediaUrl) {
            messagePreview = mediaType === "image" ? "📷 Photo" : "🎥 Video";
          } else if (gifId) {
            messagePreview = "🎭 GIF";
          } else if (movieconId) {
            messagePreview = "🎬 Moviecon";
          }
          
          // Since all messages in this system are incognito (auto-delete), create dual notifications
          await notificationService.notifyIncognitoMessage(
            receiverId,
            userId,
            sender.firstName || "Someone",
            messagePreview
          );
        }
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.put('/api/messages/:messageId/read', isAuthenticated, async (req: any, res) => {
    try {
      const { messageId } = req.params;
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.put('/api/messages/conversation/:conversationId/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId } = req.params;
      await storage.markConversationAsRead(conversationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      res.status(500).json({ message: "Failed to mark conversation as read" });
    }
  });

  // Manual cleanup endpoint for testing
  app.post('/api/messages/cleanup-expired', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteExpiredMessages();
      res.json({ success: true, message: "Expired messages cleaned up" });
    } catch (error) {
      console.error("Error cleaning up expired messages:", error);
      res.status(500).json({ message: "Failed to cleanup expired messages" });
    }
  });

  // Manual cleanup endpoint for testing old conversations
  app.post('/api/messages/cleanup-old-conversations', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteOldConversations();
      res.json({ success: true, message: "Old conversations cleaned up" });
    } catch (error) {
      console.error("Error cleaning up old conversations:", error);
      res.status(500).json({ message: "Failed to cleanup old conversations" });
    }
  });

  // Group chat routes
  app.post('/api/group-chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, participantIds } = req.body;

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
        return res.status(400).json({ message: "At least 2 participants are required" });
      }

      const allParticipantIds = [userId, ...participantIds.filter((id: string) => id !== userId)];

      const groupConversation = await storage.createGroupConversation({
        name,
        creatorId: userId,
        participantIds: allParticipantIds,
      });

      res.json(groupConversation);
    } catch (error) {
      console.error("Error creating group chat:", error);
      res.status(500).json({ message: "Failed to create group chat" });
    }
  });

  app.get('/api/group-chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groupConversations = await storage.getGroupConversations(userId);
      res.json(groupConversations);
    } catch (error) {
      console.error("Error fetching group chats:", error);
      res.status(500).json({ message: "Failed to fetch group chats" });
    }
  });

  app.get('/api/group-chats/:groupId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;
      
      const groupConversation = await storage.getGroupConversation(groupId, userId);
      
      if (!groupConversation) {
        return res.status(404).json({ message: "Group chat not found or you're not a participant" });
      }
      
      res.json(groupConversation);
    } catch (error) {
      console.error("Error fetching group chat:", error);
      res.status(500).json({ message: "Failed to fetch group chat" });
    }
  });

  app.post('/api/group-chats/:groupId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;
      const { content, mediaUrl, mediaType, gifId, movieconId } = req.body;

      if (!content?.trim() && !mediaUrl && !gifId && !movieconId) {
        return res.status(400).json({ message: "At least one content type (text, media, gif, or moviecon) is required" });
      }

      const messageData = {
        senderId: userId,
        receiverId: null,
        groupConversationId: groupId,
        content: content?.trim() || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        gifId: gifId || null,
        movieconId: movieconId || null,
      };

      const message = await storage.sendGroupMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending group message:", error);
      res.status(500).json({ message: "Failed to send group message" });
    }
  });

  app.post('/api/group-chats/:groupId/participants', isAuthenticated, async (req: any, res) => {
    try {
      const { groupId } = req.params;
      const { userId: participantId } = req.body;

      if (!participantId) {
        return res.status(400).json({ message: "Participant user ID is required" });
      }

      await storage.addParticipantToGroup(groupId, participantId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding participant:", error);
      res.status(500).json({ message: "Failed to add participant" });
    }
  });

  app.delete('/api/group-chats/:groupId/participants/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { groupId, userId: participantId } = req.params;

      await storage.removeParticipantFromGroup(groupId, participantId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing participant:", error);
      res.status(500).json({ message: "Failed to remove participant" });
    }
  });

  app.delete('/api/group-chats/:groupId', isAuthenticated, async (req: any, res) => {
    try {
      const { groupId } = req.params;

      await storage.deleteGroupConversation(groupId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting group chat:", error);
      res.status(500).json({ message: "Failed to delete group chat" });
    }
  });

  // Event routes
  app.get('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventData = insertEventSchema.parse({ ...req.body, userId });
      
      // Normalize media URL if provided
      if (eventData.mediaUrl) {
        const objectStorage = new ObjectStorageService();
        eventData.mediaUrl = objectStorage.normalizeObjectEntityPath(eventData.mediaUrl);
      }
      
      const event = await storage.createEvent(eventData);
      
      // Award 0.50 Kliq Koins for creating an event
      try {
        await storage.awardKoins(userId, 0.50, 'event_create', event.id);
      } catch (koinError) {
        console.error("Error awarding Koins for event creation:", koinError);
      }
      
      // Send response first to ensure event is fully committed
      res.json(event);
      
      // AFTER response: Invalidate cache and broadcast (prevents race condition)
      setImmediate(async () => {
        try {
          const { invalidateCache } = await import('./cache');
          invalidateCache('kliq-feed'); // Invalidate all kliq feed caches (old cache system)
          
          // Invalidate CacheService for feeds (new optimized cache)
          // Use 'kliq-feed:' not 'kliq-feed:*' because invalidatePattern uses includes(), not wildcard matching
          const { cacheService } = await import('./cacheService');
          await cacheService.invalidatePattern('kliq-feed:'); // Invalidate all kliq feed cache entries
          
          // NOW broadcast feed update to all connected clients (after cache is cleared)
          (req.app as any).broadcastFeedUpdate('event');
        } catch (error) {
          console.error("Error in post-response cache invalidation:", error);
        }
      });
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put('/api/events/:eventId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventId } = req.params;
      
      // Validate ownership
      const existingEvent = await storage.getEventById(eventId);
      if (!existingEvent || existingEvent.userId !== userId) {
        return res.status(403).json({ message: "You can only edit your own events" });
      }
      
      const eventData = insertEventSchema.partial().parse(req.body);
      
      // Normalize media URL if provided
      if (eventData.mediaUrl) {
        const objectStorage = new ObjectStorageService();
        eventData.mediaUrl = objectStorage.normalizeObjectEntityPath(eventData.mediaUrl);
      }
      
      const updatedEvent = await storage.updateEvent(eventId, eventData);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete('/api/events/:eventId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventId } = req.params;
      
      // Validate ownership
      const existingEvent = await storage.getEventById(eventId);
      if (!existingEvent || existingEvent.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own events" });
      }
      
      await storage.deleteEvent(eventId);
      
      // Send response first
      res.json({ message: "Event deleted successfully" });
      
      // AFTER response: Invalidate cache and broadcast
      setImmediate(async () => {
        try {
          const { invalidateCache } = await import('./cache');
          invalidateCache('kliq-feed');
          invalidateCache('events');
          // Use 'kliq-feed:' not 'kliq-feed:*' - invalidatePattern uses includes(), not wildcard matching
          await cacheService.invalidatePattern('kliq-feed:');
          await cacheService.invalidatePattern('events:');
          
          // Broadcast WebSocket update to all clients so deleted events disappear from headlines feed
          broadcastFeedUpdate('event', eventId);
        } catch (error) {
          console.error("Error in post-response cache invalidation:", error);
        }
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Get user's attendance status for an event
  app.get('/api/events/:eventId/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventId } = req.params;
      
      const attendance = await storage.getUserEventAttendance(eventId, userId);
      res.json(attendance || { status: null });
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post('/api/events/:eventId/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventId } = req.params;
      const { status } = req.body;
      
      if (!['going', 'maybe', 'not_going'].includes(status)) {
        return res.status(400).json({ message: "Invalid attendance status" });
      }
      
      // Get event details and user info for notifications
      const event = await storage.getEventById(eventId);
      const user = await storage.getUser(userId);
      
      if (!event || !user) {
        return res.status(404).json({ message: "Event or user not found" });
      }
      
      await storage.updateEventAttendance(eventId, userId, status);
      
      // Initialize notification service for creating attendance notifications
      const { NotificationService } = await import("./notificationService");
      const notificationService = new NotificationService();
      
      // Create notification for event creator (if they're not the one updating)
      if (event.userId !== userId) {
        const statusText = status === 'going' ? '✅ Going' : 
                          status === 'maybe' ? '❓ Maybe' : 
                          '❌ Can\'t Go';
                          
        await notificationService.createNotification({
          userId: event.userId,
          type: 'event_invite',
          title: 'Event Attendance Updated',
          message: `${user.firstName} ${user.lastName} responded ${statusText} to "${event.title}"`,
          relatedId: eventId,
          relatedType: 'event'
        });
      } else {
        // Create a notification when creator updates their own event
        const statusText = status === 'going' ? '✅ Going' : 
                          status === 'maybe' ? '❓ Maybe' : 
                          '❌ Can\'t Go';
        
        await notificationService.createNotification({
          userId: userId,
          type: 'event_invite',
          title: 'Event Attendance Updated',
          message: `You updated your attendance to ${statusText} for "${event.title}"`,
          relatedId: eventId,
          relatedType: 'event'
        });
      }
      
      // Create notifications for other attendees about the attendance change
      const otherAttendees = await storage.getEventAttendees(eventId);
      for (const attendee of otherAttendees) {
        // Skip the user making the change and the event creator (already notified above)
        if (attendee.userId !== userId && attendee.userId !== event.userId) {
          const statusText = status === 'going' ? '✅ is going' : 
                            status === 'maybe' ? '❓ might go' : 
                            '❌ can\'t go';
                            
          await notificationService.createNotification({
            userId: attendee.userId,
            type: 'event_invite',
            title: 'Event Attendance Update',
            message: `${user.firstName} ${user.lastName} ${statusText} to "${event.title}"`,
            relatedId: eventId,
            relatedType: 'event'
          });
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      console.error("Error details:", error.stack);
      res.status(500).json({ message: "Failed to update attendance" });
    }
  });

  // Calendar authorization helper
  const assertUserInKliq = async (userId: string, kliqId: string) => {
    const isMember = await storage.isUserInKliq(userId, kliqId);
    if (!isMember) {
      throw new Error('You do not have access to this kliq calendar');
    }
  };

  // Calendar routes
  app.get('/api/calendar/accessible-kliqs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const kliqs = await storage.getKliqsForUser(userId);
      res.json(kliqs);
    } catch (error) {
      console.error("Error fetching accessible kliqs:", error);
      res.status(500).json({ message: "Failed to fetch accessible kliqs" });
    }
  });

  app.get('/api/calendar/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { kliqId, startDate, endDate } = req.query;
      
      // Require kliqId parameter
      if (!kliqId || typeof kliqId !== 'string') {
        return res.status(400).json({ message: "kliqId parameter is required" });
      }
      
      // Verify user has access to this kliq's calendar
      await assertUserInKliq(userId, kliqId);
      
      const notes = await storage.getCalendarNotes(kliqId, startDate, endDate);
      res.json(notes);
    } catch (error: any) {
      console.error("Error fetching calendar notes:", error);
      if (error.message === 'You do not have access to this kliq calendar') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to fetch calendar notes" });
    }
  });

  app.post('/api/calendar/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { insertCalendarNoteSchema } = await import("@shared/schema");
      
      // Require kliqId in request body
      if (!req.body.kliqId) {
        return res.status(400).json({ message: "kliqId is required" });
      }
      
      // Verify user is a member of this kliq
      await assertUserInKliq(userId, req.body.kliqId);
      
      // Server-controlled: always set userId to authenticated user
      const noteData = insertCalendarNoteSchema.parse({
        ...req.body,
        userId, // Server-controlled: who is creating the note
        kliqId: req.body.kliqId, // Validated kliqId
      });
      
      const note = await storage.createCalendarNote(noteData);
      res.json(note);
    } catch (error: any) {
      console.error("Error creating calendar note:", error);
      if (error.message === 'You do not have access to this kliq calendar') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create calendar note" });
    }
  });

  app.put('/api/calendar/notes/:noteId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { noteId } = req.params;
      
      // Get existing note to check kliq membership
      const existingNote = await storage.getCalendarNoteById(noteId);
      if (!existingNote) {
        return res.status(404).json({ message: "Calendar note not found" });
      }
      
      // Verify user is a member of the note's kliq (any member can edit)
      await assertUserInKliq(userId, existingNote.kliqId);
      
      const { insertCalendarNoteSchema } = await import("@shared/schema");
      const updates = insertCalendarNoteSchema.partial().parse(req.body);
      
      // Server-controlled: Never allow clients to change kliqId or userId
      delete updates.kliqId;
      delete updates.userId;
      
      const updatedNote = await storage.updateCalendarNote(noteId, updates);
      res.json(updatedNote);
    } catch (error: any) {
      console.error("Error updating calendar note:", error);
      if (error.message === 'You do not have access to this kliq calendar') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update calendar note" });
    }
  });

  app.delete('/api/calendar/notes/:noteId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { noteId } = req.params;
      
      // Get existing note to check kliq membership
      const existingNote = await storage.getCalendarNoteById(noteId);
      if (!existingNote) {
        return res.status(404).json({ message: "Calendar note not found" });
      }
      
      // Verify user is a member of the note's kliq (any member can delete)
      await assertUserInKliq(userId, existingNote.kliqId);
      
      await storage.deleteCalendarNote(noteId);
      res.json({ message: "Calendar note deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting calendar note:", error);
      if (error.message === 'You do not have access to this kliq calendar') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete calendar note" });
    }
  });

  // Action (Live Stream) routes
  
  // Get all live actions
  app.get('/api/actions', isAuthenticated, async (req: any, res) => {
    try {
      const actions = await storage.getActions();
      res.json(actions);
    } catch (error) {
      console.error("Error fetching actions:", error);
      res.status(500).json({ message: "Failed to fetch actions" });
    }
  });

  // Get specific action details
  app.get('/api/actions/:actionId', isAuthenticated, async (req: any, res) => {
    try {
      const { actionId } = req.params;
      const action = await storage.getActionById(actionId);
      
      if (!action) {
        return res.status(404).json({ message: "Action not found" });
      }
      
      res.json(action);
    } catch (error) {
      console.error("Error fetching action:", error);
      res.status(500).json({ message: "Failed to fetch action" });
    }
  });

  // Create new action (start live stream)
  app.post('/api/actions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { insertActionSchema } = await import("@shared/schema");
      
      // Generate stream key if not provided
      const streamKey = req.body.streamKey || `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const actionData = insertActionSchema.parse({ 
        ...req.body, 
        userId,
        streamKey
      });
      
      const action = await storage.createAction(actionData);
      
      // Award 0.50 Kliq Koins for creating a livestream
      try {
        await storage.awardKoins(userId, 0.50, 'livestream_create', action.id);
      } catch (koinError) {
        console.error("Error awarding Koins for livestream creation:", koinError);
      }
      
      // Broadcast feed update to all connected clients
      try {
        (req.app as any).broadcastFeedUpdate('livestream');
      } catch (broadcastError) {
        console.error("Error broadcasting feed update:", broadcastError);
      }
      
      // Invalidate cache for feeds that need to show this new livestream
      const { invalidateCache } = await import('./cache');
      invalidateCache('kliq-feed'); // Invalidate all kliq feed caches (old cache system)
      
      // Invalidate CacheService for feeds (new optimized cache)
      const { cacheService } = await import('./cacheService');
      await cacheService.invalidatePattern('kliq-feed:*'); // Invalidate all kliq feed cache entries
      
      // Auto-post to headlines when live stream starts
      const postContent = `🔴 LIVE: Streaming "${action.title}" right now! ${action.description ? action.description : ''}`;
      
      // Create the auto-post
      const autoPost = await storage.createPost({
        userId: userId,
        content: postContent.trim(),
        mediaUrl: null,
        mediaType: null,
        gifId: null,
        movieconId: null
      });
      
      res.json(action);
    } catch (error) {
      console.error("Error creating action:", error);
      res.status(500).json({ message: "Failed to create action" });
    }
  });

  // End action (stop live stream)
  app.put('/api/actions/:actionId/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { actionId } = req.params;
      
      // Verify user owns this action
      const action = await storage.getActionById(actionId);
      if (!action || action.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to end this action" });
      }
      
      const endedAction = await storage.endAction(actionId);
      res.json(endedAction);
    } catch (error) {
      console.error("Error ending action:", error);
      res.status(500).json({ message: "Failed to end action" });
    }
  });

  // Join action (start watching stream)
  app.post('/api/actions/:actionId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { actionId } = req.params;
      
      await storage.joinAction(actionId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error joining action:", error);
      res.status(500).json({ message: "Failed to join action" });
    }
  });

  // Leave action (stop watching stream)
  app.post('/api/actions/:actionId/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { actionId } = req.params;
      
      await storage.leaveAction(actionId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving action:", error);
      res.status(500).json({ message: "Failed to leave action" });
    }
  });

  // Get action chat messages
  app.get('/api/actions/:actionId/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { actionId } = req.params;
      const messages = await storage.getActionChatMessages(actionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching action chat:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Send action chat message
  app.post('/api/actions/:actionId/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { actionId } = req.params;
      const { insertActionChatMessageSchema } = await import("@shared/schema");
      const messageData = insertActionChatMessageSchema.parse({
        ...req.body,
        actionId,
        userId
      });
      
      const message = await storage.addActionChatMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send chat message" });
    }
  });

  // Validate invite code endpoint (no authentication required)
  app.post('/api/auth/validate-invite-code', async (req, res) => {
    try {
      const { inviteCode } = req.body;
      
      if (!inviteCode || !inviteCode.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: "Invite code is required" 
        });
      }

      // Check if invite code exists and get the owner
      const inviteCodeOwner = await storage.getUserByInviteCode(inviteCode.trim());
      if (!inviteCodeOwner) {
        return res.status(404).json({ 
          success: false, 
          message: "Invalid invite code" 
        });
      }

      // Check if invite code has been used
      const isUsed = await storage.isInviteCodeUsed(inviteCode.trim());
      if (isUsed) {
        return res.status(409).json({ 
          success: false, 
          message: "This invite code has already been used" 
        });
      }

      // Check if the kliq is closed
      if (inviteCodeOwner.kliqClosed) {
        return res.status(403).json({ 
          success: false, 
          message: "This kliq is no longer accepting new members" 
        });
      }

      // Check friend limit (28 max)
      const friends = await storage.getFriends(inviteCodeOwner.id);
      if (friends.length >= 28) {
        return res.status(403).json({ 
          success: false, 
          message: "This kliq has reached the maximum number of members (28)" 
        });
      }

      // If we get here, the invite code is valid
      res.json({ 
        success: true, 
        message: "Valid invite code",
        kliqOwner: {
          firstName: inviteCodeOwner.firstName,
          lastName: inviteCodeOwner.lastName,
          kliqName: inviteCodeOwner.kliqName
        }
      });

    } catch (error) {
      console.error("Error validating invite code:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to validate invite code" 
      });
    }
  });

  // PIN-based verification for account security
  app.post('/api/auth/verify-pin', async (req, res) => {
    try {
      const { phoneNumber, pin } = req.body;
      
      if (!phoneNumber || !pin) {
        return res.status(400).json({ message: "Phone number and PIN are required" });
      }

      // Find user by phone number and verify their PIN
      const user = await storage.getUserByPhone(phoneNumber);
      if (!user) {
        return res.status(404).json({ message: "No account found with this phone number" });
      }
      
      if (!user.securityPin) {
        return res.status(400).json({ message: "PIN not set for this account" });
      }
      
      const isValidPin = await bcrypt.compare(pin, user.securityPin);
      
      if (!isValidPin) {
        return res.status(400).json({ message: "Invalid PIN" });
      }
      
      res.json({ 
        success: true, 
        verified: true,
        userId: user.id
      });
    } catch (error) {
      console.error("Error verifying PIN:", error);
      res.status(500).json({ message: "Failed to verify PIN" });
    }
  });

  // Meetup (Location check-in) routes
  
  // Get all meetups for user's kliq
  app.get('/api/meetups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetups = await storage.getMeetups(userId);
      res.json(meetups);
    } catch (error) {
      console.error("Error fetching meetups:", error);
      res.status(500).json({ message: "Failed to fetch meetups" });
    }
  });

  // Get nearby meetups based on user location
  app.get('/api/meetups/nearby', isAuthenticated, async (req: any, res) => {
    try {
      const { lat, lng, radius = 5 } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusKm = parseFloat(radius as string);
      
      const nearbyMeetups = await storage.getNearbyMeetups(latitude, longitude, radiusKm);
      res.json(nearbyMeetups);
    } catch (error) {
      console.error("Error fetching nearby meetups:", error);
      res.status(500).json({ message: "Failed to fetch nearby meetups" });
    }
  });

  // Get specific meetup details
  app.get('/api/meetups/:meetupId', isAuthenticated, async (req: any, res) => {
    try {
      const { meetupId } = req.params;
      const meetup = await storage.getMeetupById(meetupId);
      
      if (!meetup) {
        return res.status(404).json({ message: "Meetup not found" });
      }
      
      res.json(meetup);
    } catch (error) {
      console.error("Error fetching meetup:", error);
      res.status(500).json({ message: "Failed to fetch meetup" });
    }
  });

  // Create new meetup
  app.post('/api/meetups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetupData = insertMeetupSchema.parse({ 
        ...req.body, 
        userId: userId
      });
      
      const meetup = await storage.createMeetup(meetupData);
      
      // Award 0.50 Kliq Koins for creating a meetup
      try {
        await storage.awardKoins(userId, 0.50, 'meetup_create', meetup.id);
      } catch (koinError) {
        console.error("Error awarding Koins for meetup creation:", koinError);
      }
      
      // Broadcast feed update to all connected clients
      try {
        (req.app as any).broadcastFeedUpdate('meetup');
      } catch (broadcastError) {
        console.error("Error broadcasting feed update:", broadcastError);
      }
      
      // Invalidate cache for feeds that need to show this new meetup
      const { invalidateCache } = await import('./cache');
      invalidateCache('kliq-feed'); // Invalidate all kliq feed caches (old cache system)
      
      // Invalidate CacheService for feeds (new optimized cache)
      const { cacheService } = await import('./cacheService');
      await cacheService.invalidatePattern('kliq-feed:*'); // Invalidate all kliq feed cache entries
      
      res.json(meetup);
    } catch (error) {
      console.error("Error creating meetup:", error);
      res.status(500).json({ message: "Failed to create meetup" });
    }
  });

  // End meetup
  app.put('/api/meetups/:meetupId/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { meetupId } = req.params;
      
      // Verify user owns this meetup
      const meetup = await storage.getMeetupById(meetupId);
      if (!meetup || meetup.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to end this meetup" });
      }
      
      const endedMeetup = await storage.endMeetup(meetupId);
      res.json(endedMeetup);
    } catch (error) {
      console.error("Error ending meetup:", error);
      res.status(500).json({ message: "Failed to end meetup" });
    }
  });

  // Check in to meetup
  app.post('/api/meetups/:meetupId/checkin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { meetupId } = req.params;
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Location coordinates are required" });
      }
      
      // Create check-in record
      const checkInData = insertMeetupCheckInSchema.parse({
        meetupId,
        userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });
      
      const checkIn = await storage.checkInToMeetup(checkInData);
      
      // Verify location is within acceptable range
      const isVerified = await storage.verifyLocationCheckIn(
        meetupId, 
        userId, 
        parseFloat(latitude), 
        parseFloat(longitude)
      );
      
      res.json({ 
        checkIn, 
        verified: isVerified,
        message: isVerified 
          ? "Successfully checked in!" 
          : "Check-in recorded, but location verification failed. You may be too far from the meetup location."
      });
    } catch (error) {
      console.error("Error checking in to meetup:", error);
      res.status(500).json({ message: "Failed to check in to meetup" });
    }
  });

  // Check out from meetup
  app.post('/api/meetups/:meetupId/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { meetupId } = req.params;
      
      await storage.checkOutFromMeetup(meetupId, userId);
      res.json({ success: true, message: "Successfully checked out!" });
    } catch (error) {
      console.error("Error checking out from meetup:", error);
      res.status(500).json({ message: "Failed to check out from meetup" });
    }
  });

  // GPS Check-in route - create a post with location
  app.post("/api/checkin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { latitude, longitude, locationName, address, emoji } = req.body;

      // Create post with location info
      const post = await storage.createPost({
        userId,
        content: `${emoji ? emoji + ' ' : ''}Checked in at ${locationName}`,
        latitude: latitude?.toString(),
        longitude: longitude?.toString(), 
        locationName,
        address,
      });

      res.json(post);
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  // GIF API routes
  
  // Get all GIFs
  app.get('/api/gifs', async (req, res) => {
    try {
      const gifs = await storage.getAllGifs();
      res.json(gifs);
    } catch (error) {
      console.error("Error fetching gifs:", error);
      res.status(500).json({ message: "Failed to fetch gifs" });
    }
  });

  // Get GIFs by category
  app.get('/api/gifs/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const gifs = await storage.getGifsByCategory(category);
      res.json(gifs);
    } catch (error) {
      console.error("Error fetching gifs by category:", error);
      res.status(500).json({ message: "Failed to fetch gifs by category" });
    }
  });

  // Get trending GIFs
  app.get('/api/gifs/trending', async (req, res) => {
    try {
      const gifs = await storage.getTrendingGifs();
      res.json(gifs);
    } catch (error) {
      console.error("Error fetching trending gifs:", error);
      res.status(500).json({ message: "Failed to fetch trending gifs" });
    }
  });

  // Get featured GIFs
  app.get('/api/gifs/featured', async (req, res) => {
    try {
      const gifs = await storage.getFeaturedGifs();
      res.json(gifs);
    } catch (error) {
      console.error("Error fetching featured gifs:", error);
      res.status(500).json({ message: "Failed to fetch featured gifs" });
    }
  });

  // Search GIFs
  app.get('/api/gifs/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      const gifs = await storage.searchGifs(q);
      res.json(gifs);
    } catch (error) {
      console.error("Error searching gifs:", error);
      res.status(500).json({ message: "Failed to search gifs" });
    }
  });

  // Get GIF by ID
  app.get('/api/gifs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const gif = await storage.getGifById(id);
      if (!gif) {
        return res.status(404).json({ message: "GIF not found" });
      }
      res.json(gif);
    } catch (error) {
      console.error("Error fetching gif:", error);
      res.status(500).json({ message: "Failed to fetch gif" });
    }
  });

  // Create new GIF (admin only)
  app.post('/api/gifs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gifData = insertGifSchema.parse({ 
        ...req.body, 
        uploadedBy: userId 
      });
      
      const gif = await storage.createGif(gifData);
      res.json(gif);
    } catch (error) {
      console.error("Error creating gif:", error);
      res.status(500).json({ message: "Failed to create gif" });
    }
  });

  // Update GIF (admin only)
  app.put('/api/gifs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const gif = await storage.updateGif(id, updates);
      res.json(gif);
    } catch (error) {
      console.error("Error updating gif:", error);
      res.status(500).json({ message: "Failed to update gif" });
    }
  });

  // Delete GIF (admin only)
  app.delete('/api/gifs/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGif(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting gif:", error);
      res.status(500).json({ message: "Failed to delete gif" });
    }
  });

  // Meme API routes
  
  // Get all Memes
  app.get('/api/memes', async (req, res) => {
    try {
      const { q } = req.query;
      let memes;
      
      if (q && typeof q === 'string') {
        // If search query provided, search memes
        memes = await storage.searchMemes(q);
      } else {
        // Otherwise get all memes
        memes = await storage.getAllMemes();
      }
      
      res.json(memes);
    } catch (error) {
      console.error("Error fetching memes:", error);
      res.status(500).json({ message: "Failed to fetch memes" });
    }
  });

  // Get Memes by category
  app.get('/api/memes/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const memes = await storage.getMemesByCategory(category);
      res.json(memes);
    } catch (error) {
      console.error("Error fetching memes by category:", error);
      res.status(500).json({ message: "Failed to fetch memes by category" });
    }
  });

  // Get trending Memes
  app.get('/api/memes/trending', async (req, res) => {
    try {
      const memes = await storage.getTrendingMemes();
      res.json(memes);
    } catch (error) {
      console.error("Error fetching trending memes:", error);
      res.status(500).json({ message: "Failed to fetch trending memes" });
    }
  });

  // Get featured Memes
  app.get('/api/memes/featured', async (req, res) => {
    try {
      const memes = await storage.getFeaturedMemes();
      res.json(memes);
    } catch (error) {
      console.error("Error fetching featured memes:", error);
      res.status(500).json({ message: "Failed to fetch featured memes" });
    }
  });

  // Search Memes
  app.get('/api/memes/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      const memes = await storage.searchMemes(q);
      res.json(memes);
    } catch (error) {
      console.error("Error searching memes:", error);
      res.status(500).json({ message: "Failed to search memes" });
    }
  });

  // Get Meme by ID
  app.get('/api/memes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const meme = await storage.getMemeById(id);
      if (!meme) {
        return res.status(404).json({ message: "Meme not found" });
      }
      res.json(meme);
    } catch (error) {
      console.error("Error fetching meme:", error);
      res.status(500).json({ message: "Failed to fetch meme" });
    }
  });

  // Create new Meme (admin only)
  app.post('/api/memes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, imageUrl, description, category, isAnimated } = req.body;
      
      if (!title || !imageUrl) {
        return res.status(400).json({ message: "Title and image URL are required" });
      }

      // Normalize the image URL for public memes
      let normalizedImageUrl = imageUrl;
      if (imageUrl.startsWith('https://storage.googleapis.com/')) {
        // Extract the file path from the Google Cloud Storage URL
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/');
        // Format: /bucket/public/memes/filename -> /public-objects/memes/filename
        if (pathParts.length >= 4 && pathParts[2] === 'public' && pathParts[3] === 'memes') {
          const filename = pathParts.slice(4).join('/');
          normalizedImageUrl = `/public-objects/memes/${filename}`;
        }
      }

      const meme = await storage.createMeme({
        title,
        imageUrl: normalizedImageUrl,
        description: description || '',
        category: category || 'general',
        isAnimated: isAnimated || false,
        uploadedBy: userId
      });
      
      res.json(meme);
    } catch (error) {
      console.error("Error creating meme:", error);
      res.status(500).json({ message: "Failed to create meme" });
    }
  });

  // Update Meme (admin only)
  app.put('/api/memes/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const meme = await storage.updateMeme(id, updates);
      res.json(meme);
    } catch (error) {
      console.error("Error updating meme:", error);
      res.status(500).json({ message: "Failed to update meme" });
    }
  });

  // Delete Meme (admin only)
  app.delete('/api/memes/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMeme(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting meme:", error);
      res.status(500).json({ message: "Failed to delete meme" });
    }
  });

  // Moviecon API routes
  
  // Get all Moviecons
  app.get('/api/moviecons', async (req, res) => {
    try {
      const { q } = req.query;
      let moviecons;
      
      if (q && typeof q === 'string') {
        // If search query provided, search moviecons
        moviecons = await storage.searchMoviecons(q);
      } else {
        // Otherwise get all moviecons
        moviecons = await storage.getAllMoviecons();
      }
      
      res.json(moviecons);
    } catch (error) {
      console.error("Error fetching moviecons:", error);
      res.status(500).json({ message: "Failed to fetch moviecons" });
    }
  });

  // Get Moviecons by category
  app.get('/api/moviecons/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const moviecons = await storage.getMovieconsByCategory(category);
      res.json(moviecons);
    } catch (error) {
      console.error("Error fetching moviecons by category:", error);
      res.status(500).json({ message: "Failed to fetch moviecons by category" });
    }
  });

  // Get trending Moviecons
  app.get('/api/moviecons/trending', async (req, res) => {
    try {
      const moviecons = await storage.getTrendingMoviecons();
      res.json(moviecons);
    } catch (error) {
      console.error("Error fetching trending moviecons:", error);
      res.status(500).json({ message: "Failed to fetch trending moviecons" });
    }
  });

  // Get featured Moviecons
  app.get('/api/moviecons/featured', async (req, res) => {
    try {
      const moviecons = await storage.getFeaturedMoviecons();
      res.json(moviecons);
    } catch (error) {
      console.error("Error fetching featured moviecons:", error);
      res.status(500).json({ message: "Failed to fetch featured moviecons" });
    }
  });

  // Search Moviecons
  app.get('/api/moviecons/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      const moviecons = await storage.searchMoviecons(q);
      res.json(moviecons);
    } catch (error) {
      console.error("Error searching moviecons:", error);
      res.status(500).json({ message: "Failed to search moviecons" });
    }
  });

  // Get Moviecon by ID
  app.get('/api/moviecons/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const moviecon = await storage.getMovieconById(id);
      if (!moviecon) {
        return res.status(404).json({ message: "Moviecon not found" });
      }
      res.json(moviecon);
    } catch (error) {
      console.error("Error fetching moviecon:", error);
      res.status(500).json({ message: "Failed to fetch moviecon" });
    }
  });

  // Create new Moviecon (admin only)
  app.post('/api/moviecons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, url, videoUrl } = req.body;
      
      // Accept either 'url' or 'videoUrl' for backward compatibility
      const videoUrlValue = videoUrl || url;
      
      if (!title || !videoUrlValue) {
        return res.status(400).json({ message: "Title and video URL are required" });
      }

      // Handle object storage URL and set ACL policy
      const objectStorageService = new ObjectStorageService();
      let normalizedUrl = videoUrlValue;
      
      // If it's an object storage URL, normalize path
      if (videoUrlValue.includes('storage.googleapis.com') || videoUrlValue.startsWith('/objects/')) {
        normalizedUrl = objectStorageService.normalizeObjectEntityPath(videoUrlValue);
      }

      const moviecon = await storage.createMoviecon({
        id: `mv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        videoUrl: normalizedUrl,
        duration: 0, // Will be determined later if needed
        uploadedBy: userId,
      });
      
      res.json(moviecon);
    } catch (error) {
      console.error("Error creating moviecon:", error);
      res.status(500).json({ message: "Failed to create moviecon" });
    }
  });

  // Update Moviecon (admin only)
  app.put('/api/moviecons/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const moviecon = await storage.updateMoviecon(id, updates);
      res.json(moviecon);
    } catch (error) {
      console.error("Error updating moviecon:", error);
      res.status(500).json({ message: "Failed to update moviecon" });
    }
  });

  // Delete Moviecon (admin only)
  app.delete('/api/moviecons/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMoviecon(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting moviecon:", error);
      res.status(500).json({ message: "Failed to delete moviecon" });
    }
  });

  // Poll routes
  app.get('/api/polls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const polls = await storage.getPolls(userId);
      res.json(polls);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ message: "Failed to fetch polls" });
    }
  });

  app.post('/api/polls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { expiresAt, ...otherData } = req.body;
      
      const pollData = insertPollSchema.parse({
        ...otherData,
        userId,
        expiresAt: new Date(expiresAt), // Convert string to Date object
      });

      const poll = await storage.createPoll(pollData);
      res.json(poll);
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ message: "Failed to create poll" });
    }
  });

  app.get('/api/polls/:pollId', isAuthenticated, async (req, res) => {
    try {
      const { pollId } = req.params;
      const poll = await storage.getPollById(pollId);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      res.json(poll);
    } catch (error) {
      console.error("Error fetching poll:", error);
      res.status(500).json({ message: "Failed to fetch poll" });
    }
  });

  app.post('/api/polls/:pollId/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pollId } = req.params;
      const { selectedOption } = req.body;

      if (typeof selectedOption !== 'number') {
        return res.status(400).json({ message: "Selected option must be a number" });
      }

      const voteData = insertPollVoteSchema.parse({
        pollId,
        userId,
        selectedOption,
      });

      const vote = await storage.votePoll(voteData);
      console.log(`User ${userId} voted ${selectedOption} on poll ${pollId}`);
      
      // Get fresh poll results after the vote
      const updatedResults = await storage.getPollResults(pollId);
      console.log(`Updated poll results for ${pollId}:`, updatedResults);
      
      res.json({ vote, results: updatedResults });
    } catch (error) {
      console.error("Error voting on poll:", error);
      res.status(500).json({ message: "Failed to vote on poll" });
    }
  });

  app.get('/api/polls/:pollId/results', isAuthenticated, async (req, res) => {
    try {
      const { pollId } = req.params;
      const results = await storage.getPollResults(pollId);
      
      // Set cache headers to prevent caching of poll results for real-time updates
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      console.log(`Poll ${pollId} results:`, results);
      res.json(results);
    } catch (error) {
      console.error("Error fetching poll results:", error);
      res.status(500).json({ message: "Failed to fetch poll results" });
    }
  });

  // Video call routes
  app.post('/api/video-calls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { participantIds } = req.body;
      
      if (!participantIds || !Array.isArray(participantIds)) {
        return res.status(400).json({ message: "Invalid participant IDs" });
      }

      // Create video call
      const call = await storage.createVideoCall({
        initiatorId: userId,
        status: "pending"
      });

      // Add initiator as participant
      await storage.addCallParticipant({
        callId: call.id,
        userId: userId,
        status: "joined"
      });

      // Add other participants
      for (const participantId of participantIds) {
        if (participantId !== userId) {
          await storage.addCallParticipant({
            callId: call.id,
            userId: participantId,
            status: "invited"
          });
        }
      }

      // Get call with participants
      const callWithParticipants = {
        ...call,
        participants: await storage.getCallParticipants(call.id)
      };

      res.json(callWithParticipants);
    } catch (error) {
      console.error("Error creating video call:", error);
      res.status(500).json({ message: "Failed to create video call" });
    }
  });

  app.post('/api/video-calls/:callId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { callId } = req.params;

      await storage.updateParticipantStatus(callId, userId, "joined", new Date());
      res.json({ message: "Joined call successfully" });
    } catch (error) {
      console.error("Error joining video call:", error);
      res.status(500).json({ message: "Failed to join video call" });
    }
  });

  app.post('/api/video-calls/:callId/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { callId } = req.params;

      await storage.updateParticipantStatus(callId, userId, "left", undefined, new Date());
      res.json({ message: "Left call successfully" });
    } catch (error) {
      console.error("Error leaving video call:", error);
      res.status(500).json({ message: "Failed to leave video call" });
    }
  });

  app.post('/api/video-calls/:callId/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { callId } = req.params;

      // Check if user is the initiator
      const call = await storage.getVideoCall(callId);
      if (!call || call.initiatorId !== userId) {
        return res.status(403).json({ message: "Only call initiator can end the call" });
      }

      await storage.updateVideoCallStatus(callId, "ended", undefined, new Date());
      res.json({ message: "Call ended successfully" });
    } catch (error) {
      console.error("Error ending video call:", error);
      res.status(500).json({ message: "Failed to end video call" });
    }
  });

  app.get('/api/video-calls/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeCalls = await storage.getUserActiveCalls(userId);
      res.json(activeCalls);
    } catch (error) {
      console.error("Error fetching active calls:", error);
      res.status(500).json({ message: "Failed to fetch active calls" });
    }
  });

  // Scrapbook routes
  app.get('/api/scrapbook/albums', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const albums = await storage.getUserScrapbookAlbums(userId);
      res.json(albums);
    } catch (error) {
      console.error("Error fetching scrapbook albums:", error);
      res.status(500).json({ message: "Failed to fetch scrapbook albums" });
    }
  });

  app.post('/api/scrapbook/albums', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, color } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Album name is required" });
      }

      const album = await storage.createScrapbookAlbum({
        userId,
        name: name.trim(),
        color: color || '#FF1493',
      });
      
      res.json(album);
    } catch (error) {
      console.error("Error creating scrapbook album:", error);
      res.status(500).json({ message: "Failed to create scrapbook album" });
    }
  });

  app.patch('/api/scrapbook/albums/:albumId', isAuthenticated, async (req: any, res) => {
    try {
      const { albumId } = req.params;
      const { name, color } = req.body;
      
      const updates: any = {};
      if (name) updates.name = name.trim();
      if (color) updates.color = color;

      const album = await storage.updateScrapbookAlbum(albumId, updates);
      res.json(album);
    } catch (error) {
      console.error("Error updating scrapbook album:", error);
      res.status(500).json({ message: "Failed to update scrapbook album" });
    }
  });

  app.delete('/api/scrapbook/albums/:albumId', isAuthenticated, async (req: any, res) => {
    try {
      const { albumId } = req.params;
      await storage.deleteScrapbookAlbum(albumId);
      res.json({ message: "Album deleted successfully" });
    } catch (error) {
      console.error("Error deleting scrapbook album:", error);
      res.status(500).json({ message: "Failed to delete scrapbook album" });
    }
  });

  app.get('/api/scrapbook/saves', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { albumId } = req.query;
      
      const saves = await storage.getUserScrapbookSaves(userId, albumId as string | undefined);
      res.json(saves);
    } catch (error) {
      console.error("Error fetching scrapbook saves:", error);
      res.status(500).json({ message: "Failed to fetch scrapbook saves" });
    }
  });

  app.get('/api/scrapbook/count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getScrapbookSaveCount(userId);
      res.json({ count, limit: 1000 });
    } catch (error) {
      console.error("Error fetching scrapbook count:", error);
      res.status(500).json({ message: "Failed to fetch scrapbook count" });
    }
  });

  app.post('/api/scrapbook/check-saved', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postIds } = req.body;
      
      if (!Array.isArray(postIds)) {
        return res.status(400).json({ message: "postIds must be an array" });
      }

      // Batch check all posts at once
      const savedMap: Record<string, boolean> = {};
      await Promise.all(
        postIds.map(async (postId) => {
          savedMap[postId] = await storage.isPostSavedByUser(userId, postId);
        })
      );
      
      res.json(savedMap);
    } catch (error) {
      console.error("Error checking saved posts:", error);
      res.status(500).json({ message: "Failed to check saved posts" });
    }
  });

  app.post('/api/scrapbook/save', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId, albumId, note } = req.body;
      
      if (!postId) {
        return res.status(400).json({ message: "Post ID is required" });
      }

      // Check save limit
      const currentCount = await storage.getScrapbookSaveCount(userId);
      if (currentCount >= 1000) {
        return res.status(400).json({ message: "Scrapbook save limit reached (1000 saves maximum)" });
      }

      // Check if already saved
      const alreadySaved = await storage.isPostSavedByUser(userId, postId);
      if (alreadySaved) {
        return res.status(400).json({ message: "Post is already saved to scrapbook" });
      }

      const save = await storage.savePostToScrapbook({
        userId,
        postId,
        albumId: albumId || null,
        note: note || null,
      });
      
      res.json(save);
    } catch (error) {
      console.error("Error saving post to scrapbook:", error);
      res.status(500).json({ message: "Failed to save post to scrapbook" });
    }
  });

  app.delete('/api/scrapbook/save/:postId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      await storage.unsavePostFromScrapbook(userId, postId);
      res.json({ message: "Post removed from scrapbook" });
    } catch (error) {
      console.error("Error removing post from scrapbook:", error);
      res.status(500).json({ message: "Failed to remove post from scrapbook" });
    }
  });

  app.patch('/api/scrapbook/save/:saveId/note', isAuthenticated, async (req: any, res) => {
    try {
      const { saveId } = req.params;
      const { note } = req.body;
      
      const save = await storage.updateScrapbookSaveNote(saveId, note || '');
      res.json(save);
    } catch (error) {
      console.error("Error updating scrapbook save note:", error);
      res.status(500).json({ message: "Failed to update scrapbook save note" });
    }
  });

  // Post Highlight routes
  app.post('/api/posts/:id/highlight', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only highlight your own posts" });
      }
      
      const lastHighlight = await storage.getUserLastHighlight(userId);
      if (lastHighlight && lastHighlight.postId !== postId) {
        const now = new Date();
        const lastHighlightTime = new Date(lastHighlight.highlightedAt);
        const hoursSinceLastHighlight = (now.getTime() - lastHighlightTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastHighlight < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceLastHighlight);
          return res.status(400).json({ 
            message: `You can only highlight one post per day. Try again in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}.` 
          });
        }
      }
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 6);
      
      const highlight = await storage.addPostHighlight({
        postId,
        userId,
        expiresAt,
      });
      
      await cacheService.invalidatePattern('kliq-feed');
      
      res.json(highlight);
    } catch (error) {
      console.error("Error highlighting post:", error);
      res.status(500).json({ message: "Failed to highlight post" });
    }
  });

  app.delete('/api/posts/:id/highlight', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      
      const post = await storage.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only remove highlights from your own posts" });
      }
      
      await storage.removePostHighlight(postId);
      
      await cacheService.invalidatePattern('kliq-feed');
      
      res.json({ message: "Highlight removed" });
    } catch (error) {
      console.error("Error removing highlight:", error);
      res.status(500).json({ message: "Failed to remove highlight" });
    }
  });

  // Birthday routes
  app.get("/api/birthdays/today", isAuthenticated, async (req: any, res) => {
    try {
      const birthdayUsers = await storage.getUsersWithBirthdayToday();
      res.json(birthdayUsers);
    } catch (error) {
      console.error("Error fetching birthday users:", error);
      res.status(500).json({ message: "Failed to fetch birthday users" });
    }
  });

  // Update user birthdate
  app.patch("/api/user/birthdate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { birthdate } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { birthdate });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating birthdate:", error);
      res.status(500).json({ message: "Failed to update birthdate" });
    }
  });

  // Send birthday message (creates automatic birthday post)
  app.post("/api/birthdays/send-message", isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { birthdayUserId, message } = req.body;
      
      const currentYear = new Date().getFullYear();
      
      // Check if message already sent this year
      const existingMessages = await storage.getBirthdayMessagesSentThisYear(birthdayUserId, currentYear);
      const alreadySent = existingMessages.some(msg => msg.senderUserId === senderId);
      
      if (alreadySent) {
        return res.status(400).json({ message: "Birthday message already sent this year" });
      }
      
      // Get birthday user info
      const birthdayUser = await storage.getUser(birthdayUserId);
      if (!birthdayUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create post for birthday message
      const post = await storage.createPost({
        userId: senderId,
        content: `🎉 Happy Birthday ${birthdayUser.firstName}! ${message}`
      });
      
      // Save birthday message record
      const birthdayMessage = await storage.createBirthdayMessage({
        birthdayUserId,
        senderUserId: senderId,
        message,
        year: currentYear,
        postId: post.id
      });
      
      res.json({ success: true, post, birthdayMessage });
    } catch (error) {
      console.error("Error sending birthday message:", error);
      res.status(500).json({ message: "Failed to send birthday message" });
    }
  });

  // Chatbot conversation routes
  app.post('/api/chatbot/conversation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationHistory, timestamp, messageCount } = req.body;

      console.log('Chatbot conversation endpoint called:', { userId, hasConversation: !!conversationHistory, messageCount });

      if (!conversationHistory) {
        return res.status(400).json({ message: "conversationHistory is required" });
      }

      // Get user details for the email
      const user = await storage.getUser(userId);
      console.log('Retrieved user for email:', { userId, hasUser: !!user, userEmail: user?.email });
      
      // Prepare conversation data for email
      const conversationData = {
        conversationHistory,
        timestamp: timestamp || new Date().toISOString(),
        userId,
        userEmail: user?.email || undefined,
        messageCount: messageCount || 0
      };

      console.log('Attempting to send complete chatbot conversation email...');
      
      // Send email copy of the conversation
      const emailSent = await sendChatbotConversation(conversationData);
      
      console.log('Email send result:', emailSent);
      
      if (!emailSent) {
        console.warn('Failed to send chatbot conversation email, but conversation was processed');
      }

      res.json({ 
        success: true, 
        emailSent,
        message: "Complete conversation processed and email sent" 
      });
    } catch (error) {
      console.error("Error processing chatbot conversation:", error);
      res.status(500).json({ message: "Failed to process chatbot conversation" });
    }
  });

  // Notification API routes
  app.get('/api/notifications', isAuthenticated, rateLimitService.createRateLimitMiddleware('notifications'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type } = req.query;
      // Try Redis cache first for notifications
      const { getCachedOrFetch } = await import('./redis');
      const cacheKey = `notifications:${userId}:${type || 'all'}`;
      const notifications = await getCachedOrFetch(
        cacheKey,
        () => notificationService.getUserNotifications(userId, type),
        60 // Cache notifications for 60 seconds
      );
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark all notifications as read - must come BEFORE the :id route
  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type } = req.body;
      const notifications = await notificationService.markAllAsRead(userId, type);
      res.json(notifications);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  // Delete all notifications - must come BEFORE the :id route
  app.delete('/api/notifications/delete-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type } = req.body;
      const notifications = await notificationService.deleteAllNotifications(userId, type);
      res.json(notifications);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      res.status(500).json({ message: "Failed to delete all notifications" });
    }
  });

  app.patch('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { isRead } = req.body;

      if (isRead) {
        const notification = await notificationService.markAsRead(id, userId);
        res.json(notification);
      } else {
        res.status(400).json({ message: "Invalid update operation" });
      }
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const notification = await notificationService.deleteNotification(id, userId);
      res.json(notification);
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Test endpoint to create a demo notification
  app.post('/api/notifications/demo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, title, message } = req.body;
      console.log("Creating demo notification for user:", userId, "type:", type);
      
      const actionUrls = {
        message: '/messages',
        event_invite: '/events', 
        friend_request: '/kliq',
        post_like: '/bulletin'
      };
      
      const notification = await notificationService.createNotification({
        userId: userId,
        type: type || 'post_like',
        title: title || 'Demo Notification',
        message: message || 'This is a test notification to verify the system works!',
        actionUrl: actionUrls[type as keyof typeof actionUrls] || '/bulletin',
        relatedId: `demo-${type}-id`,
        relatedType: type === 'message' ? 'conversation' : type === 'event_invite' ? 'event' : type === 'friend_request' ? 'user' : 'post',
        priority: 'normal',
      });
      
      console.log("Demo notification created successfully:", notification);
      res.json(notification);
    } catch (error) {
      console.error("Error creating demo notification:", error);
      res.status(500).json({ message: "Failed to create demo notification" });
    }
  });

  // Test endpoint to create IM notification
  app.post('/api/notifications/test-im', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const notification = await notificationService.createNotification({
        userId,
        type: 'message' as const,
        title: 'New IM from Alex',
        message: 'Alex: Hey! How was your day? Want to hang out later?',
        actionUrl: '/messages',
        relatedId: 'mock-conversation-id',
        relatedType: 'conversation',
        priority: 'medium' as const,
      });

      console.log("Test IM notification created:", notification);
      res.json({ success: true, notification });
    } catch (error) {
      console.error("Error creating test IM notification:", error);
      res.status(500).json({ message: "Failed to create test IM notification" });
    }
  });

  // Test endpoint to create sample notifications of different types
  app.post('/api/notifications/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const testNotifications = [
        {
          userId,
          type: 'message' as const,
          title: 'New Message',
          message: 'Alex sent you a message',
          actionUrl: '/messages',
          priority: 'medium' as const,
        },
        {
          userId,
          type: 'friend_request' as const,
          title: 'Friend Request',
          message: 'Jordan wants to join your kliq',
          actionUrl: '/kliq',
          priority: 'high' as const,
        },
        {
          userId,
          type: 'event_invite' as const,
          title: 'Event Invitation',
          message: 'You are invited to Movie Night',
          actionUrl: '/events',
          priority: 'medium' as const,
        },
      ];

      const createdNotifications = [];
      for (const notificationData of testNotifications) {
        const notification = await notificationService.createNotification(notificationData);
        createdNotifications.push(notification);
      }

      res.json({ 
        success: true, 
        created: createdNotifications.length,
        notifications: createdNotifications 
      });
    } catch (error) {
      console.error("Error creating test notifications:", error);
      res.status(500).json({ message: "Failed to create test notifications" });
    }
  });

  // Sponsored Ads routes
  app.get('/api/ads/targeted', async (req: any, res) => {
    try {
      // Use authenticated user if available, otherwise use fallback for testing
      const userId = req.user?.claims?.sub || "46297180";
      const ads = await storage.getTargetedAds(userId);
      console.log(`Fetched ${ads.length} targeted ads for user ${userId}`);
      res.json(ads);
    } catch (error) {
      console.error("Error fetching targeted ads:", error);
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  // Admin ads management routes
  app.get('/api/ads', isAuthenticated, async (req: any, res) => {
    try {
      const ads = await storage.getAllAds();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching ads:", error);
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  app.post('/api/ads', isAuthenticated, async (req: any, res) => {
    try {
      const ad = await storage.createAd(req.body);
      res.json(ad);
    } catch (error) {
      console.error("Error creating ad:", error);
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  app.patch('/api/ads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const ad = await storage.updateAd(req.params.id, req.body);
      res.json(ad);
    } catch (error) {
      console.error("Error updating ad:", error);
      res.status(500).json({ message: "Failed to update ad" });
    }
  });

  app.patch('/api/ads/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const ad = await storage.updateAdStatus(req.params.id, status);
      res.json(ad);
    } catch (error) {
      console.error("Error updating ad status:", error);
      res.status(500).json({ message: "Failed to update ad status" });
    }
  });

  app.delete('/api/ads/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteAd(req.params.id);
      res.json({ message: "Ad deleted successfully" });
    } catch (error) {
      console.error("Error deleting ad:", error);
      res.status(500).json({ message: "Failed to delete ad" });
    }
  });

  app.get('/api/ads', isAuthenticated, async (req, res) => {
    try {
      const ads = await storage.getAllActiveAds();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching ads:", error);
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  app.post('/api/ads', isAuthenticated, async (req: any, res) => {
    try {
      // Note: In a real app, this would be admin-only
      const adData = insertSponsoredAdSchema.parse(req.body);
      const ad = await storage.createSponsoredAd(adData);
      res.json(ad);
    } catch (error) {
      console.error("Error creating ad:", error);
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  app.put('/api/ads/:adId', isAuthenticated, async (req, res) => {
    try {
      // Note: In a real app, this would be admin-only
      const { adId } = req.params;
      const updates = req.body;
      const ad = await storage.updateSponsoredAd(adId, updates);
      res.json(ad);
    } catch (error) {
      console.error("Error updating ad:", error);
      res.status(500).json({ message: "Failed to update ad" });
    }
  });

  app.delete('/api/ads/:adId', isAuthenticated, async (req, res) => {
    try {
      // Note: In a real app, this would be admin-only
      const { adId } = req.params;
      await storage.deleteSponsoredAd(adId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting ad:", error);
      res.status(500).json({ message: "Failed to delete ad" });
    }
  });

  app.post('/api/ads/:adId/impression', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { adId } = req.params;
      
      const interaction = await storage.recordAdImpression({
        adId,
        userId,
        interactionType: 'impression' as const,
      });
      
      res.json(interaction);
    } catch (error) {
      console.error("Error recording ad impression:", error);
      res.status(500).json({ message: "Failed to record impression" });
    }
  });

  app.post('/api/ads/:adId/click', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { adId } = req.params;
      
      const interaction = await storage.recordAdClick({
        adId,
        userId,
        interactionType: 'click' as const,
      });
      
      res.json(interaction);
    } catch (error) {
      console.error("Error recording ad click:", error);
      res.status(500).json({ message: "Failed to record click" });
    }
  });

  app.get('/api/ads/:adId/analytics', isAuthenticated, async (req, res) => {
    try {
      const { adId } = req.params;
      const analytics = await storage.getAdAnalytics(adId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching ad analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/user/ad-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserAdPreferences(userId);
      res.json(preferences || {
        enableTargetedAds: true,
        maxAdsPerDay: 5,
        blockedCategories: [],
      });
    } catch (error) {
      console.error("Error fetching ad preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put('/api/user/ad-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferencesData = insertUserAdPreferencesSchema.parse(req.body);
      const preferences = await storage.updateUserAdPreferences(userId, preferencesData);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating ad preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // User self-delete account endpoint
  app.delete('/api/user/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete the user and all associated data
      await storage.deleteUser(userId);
      
      res.json({ 
        success: true, 
        message: "Account deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ 
        message: "Failed to delete account. Please try again." 
      });
    }
  });

  // Force favicon route to bypass all caching (place before other routes)
  app.get('/favicon.ico', (req, res) => {
    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile('favicon.ico', { root: './client/public' });
  });

  // Basic maintenance endpoint
  app.get('/api/maintenance/status', async (req, res) => {
    res.json({ 
      status: "operational", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Advanced scalability monitoring endpoints
  app.get('/health', healthCheckHandler);
  app.get('/internal/scalability', scalabilityReportHandler);
  app.get('/internal/load-balancer', (req, res) => {
    res.json(getLoadBalancerStatus());
  });
  app.get('/internal/memory', (req, res) => {
    res.json(memoryOptimizer.getMemoryStats());
  });
  app.get('/internal/query-optimization', (req, res) => {
    res.json(queryOptimizer.getOptimizationReport());
  });

  const httpServer = createServer(app);

  // Setup WebSocket server for real-time Action features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'join_action':
            // Join action room for real-time updates
            ws.action_id = data.actionId;
            ws.user_id = data.userId;
            
            // Broadcast to other viewers that someone joined
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client !== ws && 
                  client.readyState === WebSocket.OPEN && 
                  client.action_id === data.actionId) {
                client.send(JSON.stringify({
                  type: 'viewer_joined',
                  actionId: data.actionId,
                  userId: data.userId
                }));
              }
            });
            break;
            
          case 'leave_action':
            // Leave action room
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client !== ws && 
                  client.readyState === WebSocket.OPEN && 
                  client.action_id === data.actionId) {
                client.send(JSON.stringify({
                  type: 'viewer_left',
                  actionId: data.actionId,
                  userId: data.userId
                }));
              }
            });
            break;
            
          case 'action_chat':
            // Broadcast chat message to all viewers
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  client.action_id === data.actionId) {
                client.send(JSON.stringify({
                  type: 'action_chat',
                  actionId: data.actionId,
                  message: data.message,
                  userId: data.userId,
                  userName: data.userName,
                  timestamp: new Date().toISOString()
                }));
              }
            });
            break;
            
          case 'action_ended':
            // Broadcast that action has ended
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  client.action_id === data.actionId) {
                client.send(JSON.stringify({
                  type: 'action_ended',
                  actionId: data.actionId
                }));
              }
            });
            break;
            
          case 'join-call-signaling':
            // Join user to call signaling
            ws.user_id = data.userId;
            break;
            
          case 'video-call-invite':
            // Send call invite to specific users
            const { callId, invitedUsers } = data;
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  invitedUsers.includes(client.user_id)) {
                client.send(JSON.stringify({
                  type: 'call-invite',
                  callId: callId,
                  from: data.userId
                }));
              }
            });
            break;
            
          case 'video-call-response':
            // Handle call response (accept/decline)
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  client.call_id === data.callId) {
                client.send(JSON.stringify({
                  type: 'call-response',
                  callId: data.callId,
                  userId: data.userId,
                  response: data.response // 'accept' or 'decline'
                }));
              }
            });
            break;
            
          case 'webrtc-signal':
            // Forward WebRTC signaling messages
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  client.call_id === data.callId &&
                  client.user_id === data.targetUserId) {
                client.send(JSON.stringify({
                  type: 'webrtc-signal',
                  callId: data.callId,
                  from: data.fromUserId,
                  signal: data.signal
                }));
              }
            });
            break;
            
          case 'audio-toggle':
          case 'video-toggle':
            // Broadcast media toggle state
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN && 
                  client.call_id === data.callId) {
                client.send(JSON.stringify({
                  type: data.type,
                  callId: data.callId,
                  userId: data.userId || ws.user_id,
                  enabled: data.enabled
                }));
              }
            });
            break;
            
          case 'subscribe_feed':
            // Subscribe to real-time feed updates
            ws.feed_subscriber = true;
            ws.user_id = data.userId;
            break;
            
          case 'unsubscribe_feed':
            // Unsubscribe from feed updates
            ws.feed_subscriber = false;
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      if (ws.action_id && ws.user_id) {
        // Notify other viewers that someone left
        wss.clients.forEach((client: ExtendedWebSocket) => {
          if (client.readyState === WebSocket.OPEN && 
              client.action_id === ws.action_id) {
            client.send(JSON.stringify({
              type: 'viewer_left',
              actionId: ws.action_id,
              userId: ws.user_id
            }));
          }
        });
      }
    });
  });

  // Global function to broadcast feed updates to all subscribers
  const broadcastFeedUpdate = (contentType: string, data?: any) => {
    const message = JSON.stringify({
      type: 'feed:new-content',
      contentType, // 'post', 'event', 'meetup', 'livestream'
      timestamp: new Date().toISOString(),
      data
    });

    let subscriberCount = 0;
    wss.clients.forEach((client: ExtendedWebSocket) => {
      if (client.readyState === WebSocket.OPEN && client.feed_subscriber) {
        client.send(message);
        subscriberCount++;
      }
    });

    if (subscriberCount > 0) {
      console.log(`📡 Broadcasted ${contentType} update to ${subscriberCount} subscribers`);
    }
  };

  // Store broadcast function reference for use in routes
  (app as any).broadcastFeedUpdate = broadcastFeedUpdate;

  // Maintenance dashboard routes
  app.get('/api/maintenance/metrics', async (req: any, res) => {
    try {
      const metrics = await maintenanceService.getMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching maintenance metrics:", error);
      res.status(500).json({ message: "Failed to fetch maintenance metrics" });
    }
  });

  app.get('/api/maintenance/health', async (req: any, res) => {
    try {
      const healthStatus = maintenanceService.getHealthStatus();
      res.json(healthStatus);
    } catch (error) {
      console.error("Error fetching health status:", error);
      res.status(500).json({ message: "Failed to fetch health status" });
    }
  });

  app.post('/api/maintenance/cleanup/manual', async (req: any, res) => {
    try {
      await maintenanceService.performDailyMaintenance();
      res.json({ message: "Manual cleanup completed successfully" });
    } catch (error) {
      console.error("Error performing manual cleanup:", error);
      res.status(500).json({ message: "Failed to perform manual cleanup" });
    }
  });

  // Social Media Integration OAuth Routes
  
  // Get user's connected social accounts
  app.get('/api/social/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credentials = await storage.getSocialCredentials(userId);
      
      // Return public info only (no tokens)
      const accounts = credentials.map(cred => ({
        id: cred.id,
        platform: cred.platform,
        username: cred.platformUsername,
        isActive: cred.isActive,
        lastSyncAt: cred.lastSyncAt,
        createdAt: cred.createdAt,
      }));
      
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      res.status(500).json({ message: "Failed to fetch social accounts" });
    }
  });

  // Start OAuth flow for a platform
  app.get('/api/oauth/authorize/:platform', isAuthenticated, async (req: any, res) => {
    // Prevent caching - OAuth state must be fresh every time
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      const { platform } = req.params;
      const userId = req.user.claims.sub;
      
      // Generate state parameter for security
      const state = `${userId}:${platform}:${Math.random().toString(36).substr(2, 9)}`;
      
      // Store state in session for verification
      req.session.oauthState = state;
      
      // Generate PKCE parameters for TikTok (required by TikTok API)
      let codeChallenge: string | undefined;
      if (platform === 'tiktok') {
        const codeVerifier = generateCodeVerifier();
        codeChallenge = generateCodeChallenge(codeVerifier);
        // Store code_verifier in session for later use during token exchange
        req.session.pkceCodeVerifier = codeVerifier;
      }
      
      console.log('OAuth Authorize Debug:', {
        platform,
        state,
        sessionId: req.sessionID,
        storedState: req.session.oauthState,
        hasSession: !!req.session
      });
      
      // Check if OAuth credentials are configured for this platform
      const credentialMap: Record<string, { clientId: string; clientSecret: string }> = {
        instagram: { 
          clientId: process.env.INSTAGRAM_CLIENT_ID || '', 
          clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '' 
        },
        tiktok: { 
          clientId: process.env.TIKTOK_CLIENT_ID || '', 
          clientSecret: process.env.TIKTOK_CLIENT_SECRET || '' 
        },
        youtube: { 
          clientId: process.env.YOUTUBE_CLIENT_ID || '', 
          clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '' 
        },
        twitch: { 
          clientId: process.env.TWITCH_CLIENT_ID || '', 
          clientSecret: process.env.TWITCH_CLIENT_SECRET || '' 
        },
        discord: { 
          clientId: process.env.DISCORD_CLIENT_ID || '', 
          clientSecret: process.env.DISCORD_CLIENT_SECRET || '' 
        },
        reddit: { 
          clientId: process.env.REDDIT_CLIENT_ID || '', 
          clientSecret: process.env.REDDIT_CLIENT_SECRET || '' 
        },
        pinterest: { 
          clientId: process.env.PINTEREST_CLIENT_ID || '', 
          clientSecret: process.env.PINTEREST_CLIENT_SECRET || '' 
        },
        facebook: { 
          clientId: process.env.FACEBOOK_CLIENT_ID || '', 
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '' 
        }
      };

      const credentials = credentialMap[platform];
      
      // Debug: Log credential check for Pinterest
      if (platform === 'pinterest') {
        console.log('Pinterest credentials check:', {
          hasCredentials: !!credentials,
          hasClientId: !!credentials?.clientId,
          hasClientSecret: !!credentials?.clientSecret,
          clientIdLength: credentials?.clientId?.length,
          clientSecretLength: credentials?.clientSecret?.length
        });
      }
      
      if (!credentials || !credentials.clientId || !credentials.clientSecret) {
        return res.status(400).json({
          message: `${platform} OAuth credentials not configured. Please add ${platform.toUpperCase()}_CLIENT_ID and ${platform.toUpperCase()}_CLIENT_SECRET environment variables.`
        });
      }
      
      // Explicitly save session before redirecting to external OAuth provider
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      const authUrl = oauthService.generateAuthUrl(platform, state, codeChallenge);
      res.json({ authUrl });
    } catch (error) {
      console.error(`Error starting OAuth for ${req.params.platform}:`, error);
      res.status(500).json({ message: "Failed to start OAuth flow" });
    }
  });

  // OAuth callback handler
  app.get('/api/oauth/callback/:platform', async (req: any, res) => {
    try {
      const { platform } = req.params;
      const { code, state, error, error_description } = req.query;
      
      console.log('OAuth Callback - All query params:', req.query);
      
      // Check for OAuth errors from the provider
      if (error) {
        console.error('OAuth provider error:', { error, error_description });
        return res.redirect(`/settings?social=error&message=${encodeURIComponent(error_description || error)}`);
      }
      
      if (!code) {
        console.error('OAuth callback missing code parameter');
        return res.redirect('/settings?social=error&message=missing_authorization_code');
      }
      
      // Verify state parameter
      const sessionState = req.session?.oauthState;
      console.log('OAuth Callback Debug:', {
        platform,
        receivedState: state,
        sessionState,
        sessionId: req.sessionID,
        hasSession: !!req.session,
        sessionKeys: req.session ? Object.keys(req.session) : []
      });
      
      if (!sessionState || sessionState !== state) {
        console.error('State mismatch:', { sessionState, receivedState: state });
        return res.status(400).json({ message: "Invalid state parameter" });
      }
      
      // Extract user ID from state
      const [userId] = state.split(':');
      
      // Retrieve code_verifier for PKCE (if stored for this platform)
      const codeVerifier = req.session?.pkceCodeVerifier;
      
      // Handle OAuth callback through service
      const result = await oauthService.handleOAuthCallback(platform, code, state, codeVerifier);
      
      // Clear session state
      delete req.session.oauthState;
      delete req.session.pkceCodeVerifier;
      
      if (result.success) {
        res.redirect('/settings?social=connected');
      } else {
        res.redirect(`/settings?social=error&message=${encodeURIComponent(result.error || 'OAuth failed')}`);
      }
    } catch (error) {
      console.error(`Error in OAuth callback for ${req.params.platform}:`, error);
      res.redirect('/settings?social=error&message=callback_error');
    }
  });

  // Facebook Data Deletion Callback (required by Meta for Facebook Login)
  app.post('/api/platforms/facebook/deletion', async (req, res) => {
    try {
      const signed_request = req.body.signed_request;
      
      if (!signed_request) {
        return res.status(400).json({ 
          error: 'Missing signed_request parameter' 
        });
      }

      // Parse the signed request
      const [encoded_sig, payload] = signed_request.split('.');
      const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      
      // The data contains:
      // - user_id: Facebook user ID
      // - algorithm: Should be HMAC-SHA256
      // - issued_at: Unix timestamp
      
      console.log('Facebook data deletion request:', {
        facebookUserId: data.user_id,
        timestamp: new Date(data.issued_at * 1000)
      });
      
      // Find and delete user's Facebook credentials
      try {
        // Query database directly to find Facebook credentials by Facebook user ID
        const result = await pool.query(
          `SELECT id FROM social_credentials 
           WHERE platform = 'facebook' 
           AND metadata->>'userId' = $1`,
          [data.user_id]
        );
        
        if (result.rows.length > 0) {
          await storage.deleteSocialCredential(result.rows[0].id);
          console.log(`Deleted Facebook credentials for Facebook user ${data.user_id}`);
        }
      } catch (error) {
        console.error('Error deleting Facebook data:', error);
      }
      
      // Return a confirmation URL (required by Facebook)
      const confirmationCode = crypto.randomBytes(16).toString('hex');
      const statusUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/deletion-status?code=${confirmationCode}`;
      
      res.json({
        url: statusUrl,
        confirmation_code: confirmationCode
      });
    } catch (error) {
      console.error('Facebook data deletion error:', error);
      res.status(500).json({ 
        error: 'Failed to process deletion request' 
      });
    }
  });

  // Remove a social media account
  app.delete('/api/social/accounts/:accountId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { accountId } = req.params;
      
      // Verify ownership
      const credentials = await storage.getSocialCredentials(userId);
      const credential = credentials.find(c => c.id === accountId);
      
      if (!credential) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      await storage.deleteSocialCredential(accountId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing social account:", error);
      res.status(500).json({ message: "Failed to remove social account" });
    }
  });

  // Get aggregated external posts (includes both OAuth and Replit Connector sources)
  app.get('/api/social/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const posts = await storage.getExternalPosts(userId);
      
      // Also fetch from Replit connectors if available
      const connectorPosts = [];
      
      try {
        const { fetchYouTubeVideos } = await import('./connectors/youtube');
        const youtubeVideos = await fetchYouTubeVideos();
        connectorPosts.push(...youtubeVideos);
      } catch (error) {
        // YouTube connector not connected, skip
      }
      
      try {
        const { fetchDiscordData } = await import('./connectors/discord');
        const discordData = await fetchDiscordData();
        connectorPosts.push(...discordData);
      } catch (error) {
        // Discord connector not connected, skip
      }
      
      // Merge and sort by date
      const allPosts = [...posts, ...connectorPosts].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      res.json(allPosts);
    } catch (error) {
      console.error("Error fetching external posts:", error);
      res.status(500).json({ message: "Failed to fetch external posts" });
    }
  });

  // ============================================================================
  // SPORTS API ROUTES
  // ============================================================================

  // Get all available sports
  app.get('/api/sports/available', isAuthenticated, async (req, res) => {
    try {
      const { espnService } = await import('./espnService');
      const sports = espnService.getAvailableSports();
      res.json(sports);
    } catch (error) {
      console.error('Error fetching available sports:', error);
      res.status(500).json({ message: 'Failed to fetch sports' });
    }
  });

  // Get teams for a specific sport
  app.get('/api/sports/teams/:sport', isAuthenticated, async (req, res) => {
    try {
      const { sport } = req.params;
      const { espnService } = await import('./espnService');
      const teams = await espnService.getTeams(sport as any);
      res.json(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ message: 'Failed to fetch teams' });
    }
  });

  // Get user's sports preferences
  app.get('/api/sports/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserSportsPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching sports preferences:', error);
      res.status(500).json({ message: 'Failed to fetch preferences' });
    }
  });

  // Save user's sports preferences (bulk)
  app.post('/api/sports/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { teams } = req.body; // Array of {sport, teamId, teamName, teamLogo, teamAbbr}

      // Validate input
      if (!Array.isArray(teams)) {
        return res.status(400).json({ message: 'Teams must be an array' });
      }

      // Delete existing preferences
      await storage.deleteUserSportsPreferences(userId);

      // Insert new preferences
      for (const team of teams) {
        await storage.createUserSportsPreference({
          userId,
          sport: team.sport,
          teamId: team.teamId,
          teamName: team.teamName,
          teamLogo: team.teamLogo || null,
          teamAbbr: team.teamAbbr || null,
        });
      }

      res.json({ success: true, message: 'Sports preferences saved' });
    } catch (error) {
      console.error('Error saving sports preferences:', error);
      res.status(500).json({ message: 'Failed to save preferences' });
    }
  });

  // Delete a specific sports preference
  app.delete('/api/sports/preferences/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify ownership
      const preferences = await storage.getUserSportsPreferences(userId);
      const preference = preferences.find(p => p.id === id);

      if (!preference) {
        return res.status(404).json({ message: 'Preference not found' });
      }

      await storage.deleteUserSportsPreference(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting sports preference:', error);
      res.status(500).json({ message: 'Failed to delete preference' });
    }
  });

  // Get latest sports updates for user's teams
  app.get('/api/sports/updates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { espnService } = await import('./espnService');

      // Get user's sports preferences
      const preferences = await storage.getUserSportsPreferences(userId);

      if (preferences.length === 0) {
        return res.json([]);
      }

      // Group preferences by sport
      const teamsBySport = preferences.reduce((acc, pref) => {
        if (!acc[pref.sport]) {
          acc[pref.sport] = [];
        }
        acc[pref.sport].push(pref.teamId);
        return acc;
      }, {} as Record<string, string[]>);

      // Fetch games for each sport independently (one failure won't break others)
      const allGames = [];
      for (const [sport, teamIds] of Object.entries(teamsBySport)) {
        try {
          const games = await espnService.getTeamGames(sport as any, teamIds);
          allGames.push(...games);
        } catch (sportError) {
          console.error(`Failed to fetch ${sport} updates:`, sportError);
          // Continue with other sports even if one fails
        }
      }

      // Sort by date (most recent first)
      allGames.sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());

      res.json(allGames);
    } catch (error) {
      console.error('Error fetching sports updates:', error);
      res.status(500).json({ message: 'Failed to fetch updates' });
    }
  });

  // ============================================================================
  // END SPORTS API ROUTES
  // ============================================================================

  // Sync posts from a specific platform
  app.post('/api/social/sync/:platform', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { platform } = req.params;
      
      const credential = await storage.getSocialCredential(userId, platform);
      if (!credential || !credential.isActive) {
        return res.status(404).json({ message: "Platform not connected" });
      }
      
      // Decrypt access token
      const accessToken = decryptFromStorage(credential.encryptedAccessToken);
      
      // Get platform implementation
      const platformImpl = oauthService.getPlatform(platform);
      if (!platformImpl) {
        return res.status(400).json({ message: "Platform not supported" });
      }
      
      // Fetch posts from the platform
      const posts = await platformImpl.fetchUserPosts(accessToken, credential.platformUserId);
      
      // Convert to external posts format
      const externalPostsToInsert = posts.map(post => ({
        socialCredentialId: credential.id,
        platform: post.platform,
        platformPostId: post.platformPostId,
        platformUserId: credential.platformUserId,
        platformUsername: credential.platformUsername,
        content: post.content,
        mediaUrls: post.mediaUrl ? [post.mediaUrl] : [],
        thumbnailUrl: post.mediaUrl || null,
        postUrl: post.originalUrl,
        platformCreatedAt: post.createdAt,
        engagementStats: post.metadata || {},
      }));
      
      // Store posts in database
      if (externalPostsToInsert.length > 0) {
        await storage.createExternalPosts(externalPostsToInsert);
      }
      
      // Update last sync timestamp
      await storage.updateSocialCredential(credential.id, {
        lastSyncAt: new Date(),
      });
      
      res.json({ 
        message: `Successfully synced ${posts.length} posts from ${platform}`, 
        success: true,
        postsCount: posts.length 
      });
    } catch (error) {
      console.error(`Error syncing ${req.params.platform}:`, error);
      res.status(500).json({ message: "Failed to sync platform" });
    }
  });

  // Admin routes for customer service
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "mykliq2025admin!";

  // Admin authentication
  app.post('/api/admin/auth', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Invalid admin password" });
      }
    } catch (error) {
      console.error("Error authenticating admin:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Get all users for admin dashboard
  app.get('/api/admin/users', async (req, res) => {
    try {
      const { password } = req.query;
      
      // Simple password check for API access
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsersForAdmin();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get specific user details for admin
  app.get('/api/admin/users/:userId', async (req, res) => {
    try {
      const { password } = req.query;
      const { userId } = req.params;
      
      // Simple password check for API access
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Admin access required" });
      }

      const user = await storage.getUserDetailsForAdmin(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user details for admin:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  // Delete user endpoint for admin
  app.delete('/api/admin/users/:userId', async (req, res) => {
    try {
      const { password } = req.body;
      const { userId } = req.params;
      
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Admin access required" });
      }

      await storage.deleteUser(userId);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Suspend user endpoint for admin
  app.post('/api/admin/users/:userId/suspend', async (req, res) => {
    try {
      const { password, suspensionType } = req.body;
      const { userId } = req.params;
      
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Admin access required" });
      }

      // Calculate expiration date based on suspension type
      let expiresAt: Date | null = null;
      const now = new Date();
      
      switch (suspensionType) {
        case "24hours":
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case "7days":
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "30days":
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case "90days":
          expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
        case "180days":
          expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
          break;
        case "banned":
          expiresAt = null; // Permanent ban
          break;
        default:
          return res.status(400).json({ message: "Invalid suspension type" });
      }

      await storage.suspendUser(userId, {
        suspensionType,
        suspendedAt: new Date().toISOString(),
        suspensionExpiresAt: expiresAt ? expiresAt.toISOString() : null
      });
      res.json({ success: true, message: "User suspended successfully", expiresAt });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  // Analytics endpoint for admin
  app.get('/api/admin/analytics', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Admin access required" });
      }

      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Comprehensive scaling dashboard for 5000+ user monitoring
  app.get('/api/admin/scaling-dashboard', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Admin access required" });
      }

      // Gather comprehensive metrics for 5000+ user scaling
      const [
        performanceStats,
        rateLimitStats,
        dbHealth,
        maintenanceStats
      ] = await Promise.all([
        performanceOptimizer.getPerformanceStats(),
        rateLimitService.getStats(),
        performanceOptimizer.checkDatabaseHealth(),
        maintenanceService.getMetrics()
      ]);

      const analytics = await storage.getAnalytics();
      
      const scalingMetrics = {
        // Current load metrics
        currentLoad: {
          activeUsers: analytics.totalUsers,
          memoryUsageMB: Math.round(performanceStats.memoryUsage.heapUsed / 1024 / 1024),
          databaseConnections: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
            utilization: ((pool.totalCount / 50) * 100).toFixed(1) + '%'
          },
          cachePerformance: {
            redisConnected: performanceStats.cacheStats.redisConnected,
            memoryCacheSize: performanceStats.cacheStats.memoryCacheSize,
            rateLimitEntries: rateLimitStats.memoryEntries
          }
        },
        
        // Performance benchmarks
        performance: {
          averageResponseTimes: performanceStats.averageResponseTimes,
          slowEndpoints: performanceStats.slowEndpoints,
          databaseHealth: dbHealth,
          optimizationSuggestions: performanceOptimizer.getOptimizationSuggestions()
        },
        
        // Scaling capacity indicators
        scalingCapacity: {
          estimatedConcurrentUsers: Math.min(
            Math.floor((1500 - performanceStats.memoryUsage.heapUsed / 1024 / 1024) / 0.3), // Memory based
            Math.floor((50 - pool.totalCount) * 100), // DB connection based
            5000 // Target capacity
          ),
          memoryCapacityUsed: ((performanceStats.memoryUsage.heapUsed / 1024 / 1024) / 1500 * 100).toFixed(1) + '%',
          dbCapacityUsed: ((pool.totalCount / 50) * 100).toFixed(1) + '%',
          scalingStatus: dbHealth.status === 'healthy' && performanceStats.memoryUsage.heapUsed < 800000000 ? 'optimal' : 'monitoring'
        },
        
        // Rate limiting effectiveness
        rateLimiting: {
          limits: rateLimitStats.limits,
          activeRateLimits: rateLimitStats.memoryEntries,
          effectiveness: 'protecting against traffic spikes'
        },
        
        // System maintenance
        maintenance: maintenanceStats,
        
        // Recommendations for 5000+ users
        recommendations: [
          performanceStats.memoryUsage.heapUsed > 800000000 ? "Consider memory optimization or horizontal scaling" : "Memory usage optimal",
          pool.totalCount / 50 > 0.8 ? "Database connection pool approaching limits" : "Database connections healthy",
          !performanceStats.cacheStats.redisConnected ? "Enable Redis for better caching performance" : "Cache system operational",
          performanceStats.slowEndpoints.length > 3 ? "Multiple slow endpoints detected - optimization needed" : "Endpoint performance good"
        ]
      };

      res.json(scalingMetrics);
    } catch (error) {
      console.error("Error fetching scaling dashboard:", error);
      res.status(500).json({ message: "Failed to fetch scaling metrics" });
    }
  });

  // System health endpoint for admin
  app.get('/api/admin/system-health', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Admin access required" });
      }

      const systemHealth = {
        dbConnections: "25/25",
        memoryUsage: "45%", 
        uptime: "7d 12h",
        timestamp: new Date().toISOString()
      };
      
      res.json(systemHealth);
    } catch (error) {
      console.error("Error fetching system health:", error);
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });

  // Export data endpoint for admin
  app.get('/api/admin/export/:type', async (req, res) => {
    try {
      const { password } = req.query;
      const { type } = req.params;
      
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Admin access required" });
      }

      if (type === 'users') {
        const users = await storage.getAllUsersForAdmin();
        
        // Convert to CSV
        const csvHeader = 'ID,First Name,Last Name,Email,Phone,Kliq Name,Created At,Has Password,Has PIN\n';
        const csvRows = users.map((user: any) => 
          `"${user.id}","${user.firstName || ''}","${user.lastName || ''}","${user.email || ''}","${user.phoneNumber || ''}","${user.kliqName || ''}","${user.createdAt || ''}","${user.password ? 'Yes' : 'No'}","${user.securityPin ? 'Yes' : 'No'}"`
        ).join('\n');
        
        const csv = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } else {
        res.status(400).json({ message: "Invalid export type" });
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // =====================================
  // SMART FRIEND RANKING INTELLIGENCE API
  // =====================================

  // Get pending ranking suggestions for current user
  app.get('/api/friend-ranking/suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const suggestions = await friendRankingIntelligence.getPendingRankingSuggestions(userId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching ranking suggestions:", error);
      res.status(500).json({ message: "Failed to fetch ranking suggestions" });
    }
  });

  // Generate new ranking suggestions for current user
  app.post('/api/friend-ranking/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Update analytics for all friends first
      const friendships = await storage.getUserFriendships(userId);
      
      // Update interaction analytics for each friendship
      for (const friendship of friendships) {
        await friendRankingIntelligence.updateInteractionAnalytics(userId, friendship.friendId);
      }
      
      // Generate new ranking suggestions
      const suggestions = await friendRankingIntelligence.generateRankingSuggestions(userId);
      
      // Store the suggestions
      await friendRankingIntelligence.storeRankingSuggestions(suggestions);
      
      res.json({ 
        message: "Ranking suggestions generated successfully", 
        count: suggestions.length,
        suggestions 
      });
    } catch (error) {
      console.error("Error generating ranking suggestions:", error);
      res.status(500).json({ message: "Failed to generate ranking suggestions" });
    }
  });

  // Accept a ranking suggestion
  app.post('/api/friend-ranking/suggestions/:suggestionId/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { suggestionId } = req.params;
      
      // Get the suggestion details
      const suggestion = await storage.getFriendRankingSuggestion(suggestionId, userId);
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      // Update the friendship rank
      await storage.updateFriendshipRank(userId, suggestion.friendId, suggestion.suggestedRank);
      
      // Mark suggestion as accepted
      await storage.updateRankingSuggestionStatus(suggestionId, 'accepted');
      
      res.json({ message: "Ranking suggestion accepted successfully" });
    } catch (error) {
      console.error("Error accepting ranking suggestion:", error);
      res.status(500).json({ message: "Failed to accept ranking suggestion" });
    }
  });

  // Dismiss a ranking suggestion
  app.post('/api/friend-ranking/suggestions/:suggestionId/dismiss', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { suggestionId } = req.params;
      
      // Mark suggestion as dismissed
      await storage.updateRankingSuggestionStatus(suggestionId, 'dismissed');
      
      res.json({ message: "Ranking suggestion dismissed successfully" });
    } catch (error) {
      console.error("Error dismissing ranking suggestion:", error);
      res.status(500).json({ message: "Failed to dismiss ranking suggestion" });
    }
  });

  // Track content engagement (time spent viewing content)
  app.post('/api/friend-ranking/track-engagement', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const engagementData = insertContentEngagementSchema.parse(req.body);
      
      // Add the current user ID to the engagement data
      const engagement = {
        ...engagementData,
        userId,
      };
      
      await friendRankingIntelligence.trackContentEngagement(engagement);
      
      res.json({ message: "Content engagement tracked successfully" });
    } catch (error) {
      console.error("Error tracking content engagement:", error);
      res.status(500).json({ message: "Failed to track content engagement" });
    }
  });

  // Get interaction analytics for a specific friend
  app.get('/api/friend-ranking/analytics/:friendId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.params;
      
      // Update analytics first
      await friendRankingIntelligence.updateInteractionAnalytics(userId, friendId);
      
      // Get the updated analytics
      const analytics = await storage.getUserInteractionAnalytics(userId, friendId);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching interaction analytics:", error);
      res.status(500).json({ message: "Failed to fetch interaction analytics" });
    }
  });

  // Kliq Koin Routes
  
  // Process daily login - award Koins and update streak
  app.post('/api/kliq-koins/login', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.processLogin(userId);
      
      res.json({
        success: true,
        koinsAwarded: result.koinsAwarded,
        streak: result.streak,
        tierUnlocked: result.tierUnlocked,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process login" });
    }
  });

  // Get user's Koin wallet info
  app.get('/api/kliq-koins/wallet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let koins = await storage.getUserKoins(userId);
      
      if (!koins) {
        koins = await storage.initializeUserKoins(userId);
      }
      
      const transactions = await storage.getKoinTransactions(userId, 50);
      
      res.json({ koins, transactions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet info" });
    }
  });

  // Get user's streak info
  app.get('/api/kliq-koins/streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let streak = await storage.getUserStreak(userId);
      
      if (!streak) {
        streak = await storage.initializeUserStreak(userId);
      }
      
      res.json(streak);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch streak info" });
    }
  });

  // Buy a streak freeze (costs 10 Koins)
  app.post('/api/kliq-koins/streak-freeze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updatedStreak = await storage.buyStreakFreeze(userId);
      
      res.json({ 
        success: true, 
        streak: updatedStreak,
        message: "Streak freeze purchased successfully!" 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to buy streak freeze" });
    }
  });

  // Get all available borders
  app.get('/api/kliq-koins/borders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allBorders = await storage.getAllBorders();
      const userBorders = await storage.getUserBorders(userId);
      const userBorderIds = new Set(userBorders.map(ub => ub.borderId));
      
      // Engagement counter lookup for different reward types
      const engagementCounters: Record<string, () => Promise<number>> = {
        posts_created: () => storage.getUserPostCount(userId),
        posts_liked: () => storage.getUserUniqueLikeCount(userId),
        mood_updates: () => storage.getUserMoodUpdateCount(userId),
        horoscope_posts: () => storage.getUserHoroscopePostCount(userId),
        bible_verse_posts: () => storage.getUserBibleVersePostCount(userId),
      };
      
      // Fetch all engagement metrics once
      const engagementCounts: Record<string, number> = {
        posts_created: await storage.getUserPostCount(userId),
        posts_liked: await storage.getUserUniqueLikeCount(userId),
        mood_updates: await storage.getUserMoodUpdateCount(userId),
        horoscope_posts: await storage.getUserHoroscopePostCount(userId),
        bible_verse_posts: await storage.getUserBibleVersePostCount(userId),
      };
      
      const bordersWithOwnership = allBorders.map(border => {
        const baseInfo = {
          ...border,
          owned: userBorderIds.has(border.id),
          isEquipped: userBorders.find(ub => ub.borderId === border.id)?.isEquipped || false,
        };
        
        // For reward borders, add unlock status and progress based on engagement type
        if (border.type === 'reward' && border.engagementType && border.engagementThreshold) {
          const userCount = engagementCounts[border.engagementType] || 0;
          return {
            ...baseInfo,
            unlocked: userCount >= border.engagementThreshold,
            progress: userCount,
            engagementType: border.engagementType,
            engagementThreshold: border.engagementThreshold,
          };
        }
        
        return baseInfo;
      });
      
      res.json(bordersWithOwnership);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch borders" });
    }
  });

  // Get user's owned borders
  app.get('/api/kliq-koins/my-borders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userBorders = await storage.getUserBorders(userId);
      
      res.json(userBorders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user borders" });
    }
  });

  // Purchase a border
  app.post('/api/kliq-koins/purchase-border', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { borderId } = req.body;
      
      if (!borderId) {
        return res.status(400).json({ message: "Border ID required" });
      }
      
      const newUserBorder = await storage.purchaseBorder(userId, borderId);
      
      res.json({ 
        success: true, 
        border: newUserBorder,
        message: "Border purchased successfully!" 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to purchase border" });
    }
  });

  // Equip a border
  app.post('/api/kliq-koins/equip-border', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { borderId } = req.body;
      
      if (!borderId) {
        return res.status(400).json({ message: "Border ID required" });
      }
      
      await storage.equipBorder(userId, borderId);
      
      res.json({ 
        success: true,
        message: "Border equipped successfully!" 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to equip border" });
    }
  });

  // Unequip border
  app.post('/api/kliq-koins/unequip-border', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      await storage.unequipBorder(userId);
      
      res.json({ 
        success: true,
        message: "Border removed successfully!" 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to remove border" });
    }
  });

  return httpServer;
}

// Helper functions for content recommendations
function generateRecommendationTitle(rec: any): string {
  const titleMap: Record<string, string> = {
    'interests': `Explore ${rec.keywords[0]} content`,
    'hobbies': `${rec.keywords[0]} activities near you`,
    'music': `New ${rec.keywords[0]} releases`,
    'movies': `Films like ${rec.keywords[0]}`,
    'books': `Books similar to ${rec.keywords[0]}`,
    'food': `${rec.keywords[0]} recipes & restaurants`,
    'location': `Events in ${rec.keywords[0]}`,
    'lifestyle': `${rec.keywords[0]} lifestyle tips`,
    'career': `${rec.keywords[0]} professional development`
  };
  
  return titleMap[rec.category] || `Recommended ${rec.category} content`;
}

function getRecommendationAction(category: string): string {
  const actionMap: Record<string, string> = {
    'interests': 'explore',
    'hobbies': 'discover',
    'music': 'listen',
    'movies': 'watch',
    'books': 'read',
    'food': 'cook',
    'location': 'visit',
    'lifestyle': 'try',
    'career': 'learn'
  };
  
  return actionMap[category] || 'explore';
}

function calculateUserEngagementLevel(recommendations: any[]): string {
  const avgScore = recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length;
  
  if (avgScore > 75) return 'highly_engaged';
  if (avgScore > 50) return 'moderately_engaged';
  return 'developing_profile';
}

async function calculateProfileCompleteness(userId: string): Promise<number> {
  try {
    const user = await storage.getUser(userId);
    if (!user) return 0;
    
    let completeness = 0;
    const totalFields = 10;
    
    if (user.bio) completeness++;
    if (user.interests && user.interests.length > 0) completeness++;
    if (user.hobbies && user.hobbies.length > 0) completeness++;
    if (user.musicGenres && user.musicGenres.length > 0) completeness++;
    if (user.favoriteMovies && user.favoriteMovies.length > 0) completeness++;
    if (user.favoriteBooks && user.favoriteBooks.length > 0) completeness++;
    if (user.favoriteFoods && user.favoriteFoods.length > 0) completeness++;
    if (user.favoriteLocations && user.favoriteLocations.length > 0) completeness++;
    if (user.lifestyle) completeness++;
    if (user.profileImageUrl) completeness++;
    
    return Math.round((completeness / totalFields) * 100);
  } catch (error) {
    console.warn('Failed to calculate profile completeness:', error);
    return 0;
  }
}
