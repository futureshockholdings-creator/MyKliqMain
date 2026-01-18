/**
 * Mobile OAuth Flow Handler
 * 
 * Implements OAuth 2.0 Authorization Code Flow with PKCE for mobile clients.
 * Supports both Replit OAuth and external social platforms (TikTok, YouTube, etc.)
 * 
 * **Flow:**
 * 1. Mobile app requests OAuth URL with PKCE challenge
 * 2. App opens system browser to authorization endpoint
 * 3. User authorizes on provider's site
 * 4. Provider redirects to deep link (myapp://oauth/callback?code=...)
 * 5. App extracts code, sends to backend with PKCE verifier
 * 6. Backend exchanges code for tokens
 * 7. Backend returns JWT token for MyKliq API
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import * as client from 'openid-client';
import { db } from './db';
import { users, socialCredentials } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { generateMobileToken, generateCodeVerifier, generateCodeChallenge, generateOAuthState } from './mobile-auth';
import { encryptForStorage } from './cryptoService';

// ============================================================================
// PKCE STATE MANAGEMENT
// ============================================================================

/**
 * In-memory store for OAuth state verification
 * Maps state → { userId?, codeVerifier, provider, timestamp }
 * 
 * Production: Use Redis with TTL for horizontal scaling
 */
interface OAuthState {
  userId?: string;
  codeVerifier: string;
  provider: string;
  timestamp: number;
}

const oauthStateStore = new Map<string, OAuthState>();

// Cleanup expired states (5 min TTL)
setInterval(() => {
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;
  
  for (const [state, data] of oauthStateStore.entries()) {
    if (now - data.timestamp > FIVE_MINUTES) {
      oauthStateStore.delete(state);
    }
  }
}, 60 * 1000); // Run every minute

/**
 * Store OAuth state for later verification
 */
function storeOAuthState(state: string, data: Omit<OAuthState, 'timestamp'>): void {
  oauthStateStore.set(state, {
    ...data,
    timestamp: Date.now(),
  });
}

/**
 * Retrieve and remove OAuth state (one-time use)
 */
function consumeOAuthState(state: string): OAuthState | null {
  const data = oauthStateStore.get(state);
  if (data) {
    oauthStateStore.delete(state);
    return data;
  }
  return null;
}

// ============================================================================
// REPLIT OAUTH FOR MOBILE
// ============================================================================

/**
 * Initialize Replit OAuth flow for mobile
 * 
 * POST /api/mobile/oauth/replit/init
 * 
 * Request: { userId?: string, redirectUri?: string }
 * Response: { authUrl: string, state: string }
 */
export async function initReplitOAuth(req: Request, res: Response): Promise<void> {
  try {
    const { userId, redirectUri } = req.body;

    // Validate configuration
    const issuerUrl = process.env.ISSUER_URL;
    const clientId = process.env.REPL_ID;
    
    if (!issuerUrl || !clientId) {
      res.status(500).json({
        success: false,
        message: 'OAuth not configured - missing ISSUER_URL or REPL_ID',
      });
      return;
    }

    // Use provided redirect URI or fall back to environment variable
    const oauthRedirectUri = redirectUri || process.env.MOBILE_OAUTH_REDIRECT_URI || 'myapp://oauth/callback';

    // Discover OIDC configuration
    const config = await client.discovery(new URL(issuerUrl), clientId);

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateOAuthState();

    // Store state for verification
    storeOAuthState(state, {
      userId,
      codeVerifier,
      provider: 'replit',
    });

    // Build authorization URL
    const authUrl = new URL(config.authorization_endpoint!);
    
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', oauthRedirectUri);
    authUrl.searchParams.set('scope', 'openid email profile offline_access');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    res.json({
      success: true,
      authUrl: authUrl.toString(),
      state,
      redirectUri: oauthRedirectUri,
    });
  } catch (error) {
    console.error('Replit OAuth init error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to initialize OAuth flow' 
    });
  }
}

/**
 * Handle OAuth callback from deep link
 * 
 * POST /api/mobile/oauth/replit/callback
 * 
 * Request: { code: string, state: string, redirectUri?: string }
 * Response: { token: string, userId: string, ... }
 */
export async function handleReplitOAuthCallback(req: Request, res: Response): Promise<void> {
  try {
    const { code, state, redirectUri } = req.body;

    if (!code || !state) {
      res.status(400).json({ 
        success: false,
        message: 'Missing code or state parameter' 
      });
      return;
    }

    // Verify and consume state
    const oauthState = consumeOAuthState(state);
    if (!oauthState || oauthState.provider !== 'replit') {
      res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OAuth state' 
      });
      return;
    }

    // Validate configuration
    const issuerUrl = process.env.ISSUER_URL;
    const clientId = process.env.REPL_ID;
    
    if (!issuerUrl || !clientId) {
      res.status(500).json({
        success: false,
        message: 'OAuth not configured - missing ISSUER_URL or REPL_ID',
      });
      return;
    }

    // Use provided redirect URI or fall back to environment variable
    const oauthRedirectUri = redirectUri || process.env.MOBILE_OAUTH_REDIRECT_URI || 'myapp://oauth/callback';

    // Discover OIDC configuration
    const config = await client.discovery(new URL(issuerUrl), clientId);

    // Verify issuer matches Replit
    if (!issuerUrl.includes('replit.com')) {
      console.warn(`Warning: OAuth issuer ${issuerUrl} is not Replit`);
    }

    // Exchange authorization code for tokens with PKCE verifier
    const tokenResponse = await client.authorizationCodeGrant(config, {
      code,
      redirect_uri: oauthRedirectUri,
      code_verifier: oauthState.codeVerifier,
    });

    const claims = tokenResponse.claims();
    
    // Validate required claims
    if (!claims.sub) {
      res.status(400).json({
        success: false,
        message: 'Invalid OAuth response - missing user ID',
      });
      return;
    }
    
    // Upsert user in database
    const [user] = await db.insert(users)
      .values({
        id: claims.sub,
        email: claims.email || null,
        firstName: claims.first_name || claims.given_name || claims.email?.split('@')[0] || 'User',
        lastName: claims.last_name || claims.family_name || '',
        phoneNumber: claims.phone_number || null,
        profileImageUrl: claims.picture || null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: claims.email || undefined,
          firstName: claims.first_name || claims.given_name || claims.email?.split('@')[0] || 'User',
          lastName: claims.last_name || claims.family_name || '',
          profileImageUrl: claims.picture || undefined,
        },
      })
      .returning();

    // Generate JWT token for mobile API access
    const mobileToken = generateMobileToken(user.id, user.phoneNumber || user.email || '');

    res.json({
      success: true,
      token: mobileToken,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    console.error('Replit OAuth callback error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to complete OAuth flow' 
    });
  }
}

// ============================================================================
// SOCIAL PLATFORM OAUTH (Phase 2)
// ============================================================================

/**
 * Platform configuration interface
 */
interface PlatformConfig {
  authEndpoint: string;
  tokenEndpoint: string;
  scope: string;
  clientId: string;
  clientSecret?: string;
  requiresPKCE: boolean;
}

/**
 * Get OAuth configuration for a social platform
 */
function getPlatformConfig(platform: string): PlatformConfig | null {
  const configs: Record<string, PlatformConfig> = {
    youtube: {
      authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
      requiresPKCE: true,
    },
    discord: {
      authEndpoint: 'https://discord.com/api/oauth2/authorize',
      tokenEndpoint: 'https://discord.com/api/oauth2/token',
      scope: 'identify guilds',
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      requiresPKCE: false,
    },
    // Add more platforms as needed
  };

  return configs[platform] || null;
}

/**
 * Initialize OAuth flow for social platform
 * 
 * POST /api/mobile/oauth/:platform/init
 * 
 * Request: { redirectUri?: string }
 * Response: { authUrl: string, state: string }
 */
export async function initPlatformOAuth(req: Request, res: Response): Promise<void> {
  try {
    const { platform } = req.params;
    const { redirectUri } = req.body;
    const userId = (req as any).userId; // From JWT middleware

    const config = getPlatformConfig(platform);
    if (!config) {
      res.status(400).json({ 
        success: false,
        message: `Unsupported platform: ${platform}. Supported: youtube, discord, bluesky` 
      });
      return;
    }

    if (!config.clientId) {
      res.status(500).json({
        success: false,
        message: `Platform ${platform} not configured - missing ${platform.toUpperCase()}_CLIENT_ID`,
      });
      return;
    }

    // Use provided redirect URI or fall back to environment variable
    const oauthRedirectUri = redirectUri || process.env.MOBILE_OAUTH_REDIRECT_URI || 'myapp://oauth/callback';

    // Generate PKCE parameters (if required)
    const codeVerifier = config.requiresPKCE ? generateCodeVerifier() : '';
    const codeChallenge = config.requiresPKCE ? generateCodeChallenge(codeVerifier) : '';
    const state = generateOAuthState();

    // Store state for verification
    storeOAuthState(state, {
      userId,
      codeVerifier,
      provider: platform,
    });

    // Build authorization URL
    const authUrl = new URL(config.authEndpoint);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', oauthRedirectUri);
    authUrl.searchParams.set('scope', config.scope);
    authUrl.searchParams.set('state', state);
    
    if (config.requiresPKCE) {
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
    }

    res.json({
      success: true,
      authUrl: authUrl.toString(),
      state,
      platform,
      redirectUri: oauthRedirectUri,
    });
  } catch (error) {
    console.error('Platform OAuth init error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to initialize OAuth flow' 
    });
  }
}

/**
 * Handle OAuth callback for social platform
 * 
 * POST /api/mobile/oauth/:platform/callback
 * 
 * Request: { code: string, state: string, redirectUri?: string }
 * Response: { success: true, account: ConnectedAccount }
 */
export async function handlePlatformOAuthCallback(req: Request, res: Response): Promise<void> {
  try {
    const { platform } = req.params;
    const { code, state, redirectUri } = req.body;

    if (!code || !state) {
      res.status(400).json({ 
        success: false,
        message: 'Missing code or state parameter' 
      });
      return;
    }

    // Verify and consume state
    const oauthState = consumeOAuthState(state);
    if (!oauthState || oauthState.provider !== platform) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OAuth state' 
      });
      return;
    }

    const config = getPlatformConfig(platform);
    if (!config) {
      res.status(400).json({ 
        success: false,
        message: `Unsupported platform: ${platform}` 
      });
      return;
    }

    if (!config.clientId || !config.clientSecret) {
      res.status(500).json({
        success: false,
        message: `Platform ${platform} not fully configured - missing credentials`,
      });
      return;
    }

    // Use provided redirect URI or fall back to environment variable
    const oauthRedirectUri = redirectUri || process.env.MOBILE_OAUTH_REDIRECT_URI || 'myapp://oauth/callback';

    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: oauthRedirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    if (config.requiresPKCE && oauthState.codeVerifier) {
      tokenParams.set('code_verifier', oauthState.codeVerifier);
    }

    const tokenResponse = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`${platform} token exchange failed:`, errorText);
      res.status(500).json({
        success: false,
        message: `Failed to exchange authorization code for ${platform} tokens`,
      });
      return;
    }

    const tokens = await tokenResponse.json();
    
    // Validate tokens exist
    if (!tokens.access_token) {
      res.status(500).json({
        success: false,
        message: `Invalid token response from ${platform}`,
      });
      return;
    }

    // Encrypt tokens for secure storage
    const encryptedAccessToken = encryptForStorage(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token 
      ? encryptForStorage(tokens.refresh_token) 
      : null;

    // Store connected account (using socialCredentials table)
    const [account] = await db.insert(socialCredentials)
      .values({
        userId: oauthState.userId!,
        platform,
        platformUserId: tokens.user_id || 'unknown',
        platformUsername: tokens.username || platform,
        encryptedAccessToken,
        encryptedRefreshToken: encryptedRefreshToken || undefined,
        tokenExpiresAt: tokens.expires_in 
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : undefined,
        scopes: config.scope.split(' '),
        isActive: true,
        lastSyncAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [socialCredentials.userId, socialCredentials.platform],
        set: {
          encryptedAccessToken,
          encryptedRefreshToken: encryptedRefreshToken || undefined,
          tokenExpiresAt: tokens.expires_in 
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : undefined,
          isActive: true,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    // Award Kliq Koins for first-time connection using atomic transaction (consistent with web flow)
    let koinsAwarded = 0;
    try {
      const { pool } = await import('./db');
      
      const SOCIAL_CONNECTION_REWARD = 1000;
      
      // Use database transaction to ensure atomicity
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Try to insert reward record first - unique constraint prevents duplicates
        try {
          await client.query(
            'INSERT INTO social_connection_rewards (user_id, platform, koins_awarded) VALUES ($1, $2, $3)',
            [oauthState.userId!, platform, SOCIAL_CONNECTION_REWARD]
          );
          
          // If insert succeeds, this is first connection - award Koins atomically
          // Ensure wallet exists (create if needed)
          const walletCheck = await client.query(
            'SELECT id FROM kliq_koins WHERE user_id = $1',
            [oauthState.userId!]
          );
          
          if (walletCheck.rows.length === 0) {
            await client.query(
              'INSERT INTO kliq_koins (user_id, balance, total_earned) VALUES ($1, $2, $3)',
              [oauthState.userId!, SOCIAL_CONNECTION_REWARD, SOCIAL_CONNECTION_REWARD]
            );
          } else {
            // Use atomic UPDATE to increment balance (prevents lost updates)
            await client.query(
              'UPDATE kliq_koins SET balance = balance + $1, total_earned = total_earned + $1, updated_at = NOW() WHERE user_id = $2',
              [SOCIAL_CONNECTION_REWARD, oauthState.userId!]
            );
          }
          
          // Get new balance for transaction record
          const balanceResult = await client.query(
            'SELECT balance FROM kliq_koins WHERE user_id = $1',
            [oauthState.userId!]
          );
          const newBalance = balanceResult.rows[0].balance;
          
          // Record Koin transaction
          await client.query(
            'INSERT INTO kliq_koin_transactions (user_id, amount, type, source, balance_after) VALUES ($1, $2, $3, $4, $5)',
            [oauthState.userId!, SOCIAL_CONNECTION_REWARD, 'earned', `social_connection_${platform}`, newBalance]
          );
          
          await client.query('COMMIT');
          koinsAwarded = SOCIAL_CONNECTION_REWARD;
          console.log(`Awarded ${SOCIAL_CONNECTION_REWARD} Kliq Koins to user ${oauthState.userId!} for connecting ${platform} (mobile)`);
          
        } catch (insertError: any) {
          await client.query('ROLLBACK');
          // Unique constraint violation means user already received reward - skip silently
          if (!insertError.message?.includes('duplicate key') && !insertError.code?.includes('23505')) {
            throw insertError; // Re-throw unexpected errors
          }
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error awarding social connection Koins (mobile):', error);
      // Don't fail the OAuth flow if Koin award fails
    }

    res.json({
      success: true,
      koinsAwarded,
      account: {
        id: account.id,
        platform: account.platform,
        platformUsername: account.platformUsername,
        connectedAt: account.createdAt,
      },
    });
  } catch (error) {
    console.error('Platform OAuth callback error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to complete OAuth flow' 
    });
  }
}

/**
 * Disconnect a social platform account
 * 
 * DELETE /api/mobile/oauth/:platform/disconnect
 */
export async function disconnectPlatform(req: Request, res: Response): Promise<void> {
  try {
    const { platform } = req.params;
    const userId = (req as any).userId;

    await db.delete(socialCredentials)
      .where(
        and(
          eq(socialCredentials.userId, userId),
          eq(socialCredentials.platform, platform)
        )
      );

    res.json({
      success: true,
      message: `Disconnected from ${platform}`,
    });
  } catch (error) {
    console.error('Disconnect platform error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to disconnect platform' 
    });
  }
}
