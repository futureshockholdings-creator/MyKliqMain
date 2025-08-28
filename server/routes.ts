import type { Express } from "express";
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
import { pool } from "./db";

import { insertPostSchema, insertStorySchema, insertCommentSchema, insertContentFilterSchema, insertUserThemeSchema, insertMessageSchema, insertEventSchema, insertActionSchema, insertMeetupSchema, insertMeetupCheckInSchema, insertGifSchema, insertMovieconSchema, insertPollSchema, insertPollVoteSchema, insertSponsoredAdSchema, insertAdInteractionSchema, insertUserAdPreferencesSchema, insertSocialCredentialSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { oauthService } from "./oauthService";
import { encryptForStorage, decryptFromStorage } from './cryptoService';
import { z } from "zod";

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
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug middleware for all auth requests
  app.use((req, res, next) => {
    if (req.path.includes('/auth/') || req.method === 'POST') {
      console.log(`[DEBUG] ${req.method} ${req.path} - Body keys:`, Object.keys(req.body || {}));
    }
    next();
  });
  
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

  // Login endpoint using phone number and password
  app.post('/api/auth/login', async (req, res) => {
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
        return res.status(404).json({ message: "No account found with this name" });
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
        return res.status(404).json({ message: "Account information does not match our records" });
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

      // Verify security answers (case-insensitive)
      const answer1Valid = await bcrypt.compare(securityAnswer1.toLowerCase().trim(), user.securityAnswer1!);
      const answer2Valid = await bcrypt.compare(securityAnswer2.toLowerCase().trim(), user.securityAnswer2!);
      const answer3Valid = await bcrypt.compare(securityAnswer3.toLowerCase().trim(), user.securityAnswer3!);

      if (!answer1Valid || !answer2Valid || !answer3Valid) {
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

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await storage.updateUser(tokenData.userId, { password: hashedPassword });

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
        profileMusicUrl: user.profileMusicUrl,
        profileMusicTitle: user.profileMusicTitle,
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
      const { musicUrl, musicTitle } = req.body;

      if (!musicUrl || !musicTitle) {
        return res.status(400).json({ message: "Music URL and title are required" });
      }

      // Handle different types of URLs
      let finalMusicUrl = musicUrl;
      
      // For URLs from object storage, normalize the path
      if (musicUrl.includes('storage.googleapis.com') || musicUrl.startsWith('/objects/')) {
        try {
          const objectStorageService = new ObjectStorageService();
          finalMusicUrl = objectStorageService.normalizeObjectEntityPath(musicUrl);
        } catch (error) {
          console.log("Error normalizing object path, using original URL:", error);
          finalMusicUrl = musicUrl;
        }
      }
      // For external URLs (YouTube, SoundCloud, etc.), use them directly
      else {
        finalMusicUrl = musicUrl;
      }

      await storage.updateUser(userId, {
        profileMusicUrl: finalMusicUrl,
        profileMusicTitle: musicTitle,
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
      
      await storage.updateUser(userId, {
        profileMusicUrl: null,
        profileMusicTitle: null,
      });

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
  app.get('/api/kliq-feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(5, parseInt(req.query.limit as string) || 20)); // Between 5-50 items
      
      const cacheKey = `kliq-feed:${userId}:${page}:${limit}`;
      
      // Try to get from cache first (Redis)
      const { getCachedOrFetch } = await import('./redis');
      const feed = await getCachedOrFetch(
        cacheKey,
        async () => {
          const filters = await storage.getContentFilters(userId);
          const filterKeywords = filters.map(f => f.keyword);
          return await storage.getKliqFeed(userId, filterKeywords, page, limit);
        },
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
      
      // Invalidate cache for feeds that need to show this new post
      const { invalidateCache } = await import('./cache');
      invalidateCache('kliq-feed'); // Invalidate all kliq feed caches
      invalidateCache('posts'); // Invalidate posts caches
      
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
      invalidateCache('kliq-feed');
      invalidateCache('posts');
      
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
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
      }
      
      res.json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
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
      
      // Send notification to the receiver
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
          
          await notificationService.notifyNewMessage(
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
      res.json(event);
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
      res.json({ message: "Event deleted successfully" });
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

  // SMS verification routes (mocked for MVP)
  app.post('/api/auth/send-verification', async (req, res) => {
    try {
      const { phoneNumber, inviteCode } = req.body;
      
      // If invite code is provided, validate it exists and isn't used
      if (inviteCode) {
        const inviteCodeUser = await storage.getUserByInviteCode(inviteCode);
        if (!inviteCodeUser) {
          return res.status(400).json({ 
            message: "Invalid invite code. Please check the code and try again." 
          });
        }
        
        const isUsed = await storage.isInviteCodeUsed(inviteCode);
        if (isUsed) {
          return res.status(400).json({ 
            message: "This invite code has already been used." 
          });
        }
      }
      
      // Mock SMS sending - in production, integrate with SMS service
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`Mock SMS to ${phoneNumber}: Your verification code is ${verificationCode}`);
      
      res.json({ 
        success: true, 
        message: "Verification code sent",
        mockCode: verificationCode // Remove in production
      });
    } catch (error) {
      console.error("Error sending verification:", error);
      res.status(500).json({ message: "Failed to send verification" });
    }
  });

  app.post('/api/auth/verify-phone', async (req, res) => {
    try {
      const { phoneNumber, verificationCode, inviteCode } = req.body;
      
      // If invite code is provided, validate it again for final verification
      if (inviteCode) {
        const inviteCodeUser = await storage.getUserByInviteCode(inviteCode);
        if (!inviteCodeUser) {
          return res.status(400).json({ 
            message: "Invalid invite code. Please check the code and try again." 
          });
        }
        
        const isUsed = await storage.isInviteCodeUsed(inviteCode);
        if (isUsed) {
          return res.status(400).json({ 
            message: "This invite code has already been used." 
          });
        }
      }
      
      // Mock verification - in production, verify against SMS service
      res.json({ success: true, verified: true });
    } catch (error) {
      console.error("Error verifying phone:", error);
      res.status(500).json({ message: "Failed to verify phone" });
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
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
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

  // Maintenance dashboard routes
  app.get('/api/maintenance/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const metrics = await maintenanceService.getMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching maintenance metrics:", error);
      res.status(500).json({ message: "Failed to fetch maintenance metrics" });
    }
  });

  app.get('/api/maintenance/health', isAuthenticated, async (req: any, res) => {
    try {
      const healthStatus = maintenanceService.getHealthStatus();
      res.json(healthStatus);
    } catch (error) {
      console.error("Error fetching health status:", error);
      res.status(500).json({ message: "Failed to fetch health status" });
    }
  });

  app.post('/api/maintenance/cleanup/manual', isAuthenticated, async (req: any, res) => {
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
    try {
      const { platform } = req.params;
      const userId = req.user.claims.sub;
      
      // Generate state parameter for security
      const state = `${userId}:${platform}:${Math.random().toString(36).substr(2, 9)}`;
      
      // Store state in session for verification
      req.session.oauthState = state;
      
      // For demo purposes, if no real credentials are configured, simulate the flow
      const hasRealCredentials = (platform === 'twitch' && process.env.TWITCH_CLIENT_ID) || 
                                (platform === 'discord' && process.env.DISCORD_CLIENT_ID);
      
      if (!hasRealCredentials) {
        // Demo mode: simulate successful connection
        console.log(`Demo mode: Simulating ${platform} OAuth connection for user ${userId}`);
        
        // Create demo credential
        await storage.createSocialCredential({
          userId,
          platform,
          platformUserId: `demo-${platform}-user-${Math.random().toString(36).substr(2, 6)}`,
          platformUsername: `demo_${platform}_user`,
          encryptedAccessToken: encryptForStorage('demo-access-token'),
          encryptedRefreshToken: encryptForStorage('demo-refresh-token'),
          tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
          scopes: [],
          isActive: true,
          lastSyncAt: new Date(),
        });
        
        return res.json({ 
          authUrl: `/settings?social=connected&platform=${platform}&demo=true`,
          demo: true,
          message: `Demo connection to ${platform} created successfully`
        });
      }
      
      const authUrl = oauthService.generateAuthUrl(platform, userId);
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
      const { code, state } = req.query;
      
      // Verify state parameter
      const sessionState = req.session?.oauthState;
      if (!sessionState || sessionState !== state) {
        return res.status(400).json({ message: "Invalid state parameter" });
      }
      
      // Extract user ID from state
      const [userId] = state.split(':');
      
      // Handle OAuth callback through service
      const result = await oauthService.handleOAuthCallback(platform, code, state);
      
      // Clear session state
      delete req.session.oauthState;
      
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

  // Get aggregated external posts
  app.get('/api/social/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const posts = await storage.getExternalPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching external posts:", error);
      res.status(500).json({ message: "Failed to fetch external posts" });
    }
  });

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
      
      // TODO: Implement platform-specific content fetching
      // This would involve calling each platform's API to fetch recent posts
      
      res.json({ message: `Sync initiated for ${platform}`, success: true });
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

      await storage.suspendUser(userId, suspensionType, expiresAt);
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

  return httpServer;
}
