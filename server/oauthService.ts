import { encryptForStorage, decryptFromStorage } from './cryptoService';
import { storage } from './storage';
import { TwitchOAuth } from './platforms/twitch';
import { DiscordOAuth } from './platforms/discord';
import type { SocialCredential } from '@shared/schema';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface SocialPost {
  id: string;
  platform: string;
  content: string;
  mediaUrl?: string;
  platformPostId: string;
  originalUrl: string;
  createdAt: Date;
  metadata?: any;
}

export interface OAuthPlatform {
  getAuthUrl(state: string): string;
  exchangeCodeForTokens(code: string): Promise<OAuthTokens>;
  refreshTokens(refreshToken: string): Promise<OAuthTokens>;
  getUserInfo(accessToken: string): Promise<any>;
  fetchUserPosts(accessToken: string, userId?: string): Promise<SocialPost[]>;
  revokeTokens(accessToken: string): Promise<void>;
}

export class OAuthService {
  private platforms: Map<string, OAuthPlatform> = new Map();

  constructor() {
    this.platforms.set('twitch', new TwitchOAuth());
    this.platforms.set('discord', new DiscordOAuth());
    // Add more platforms as they're implemented
  }

  getSupportedPlatforms(): string[] {
    return Array.from(this.platforms.keys());
  }

  getPlatform(platform: string): OAuthPlatform | undefined {
    return this.platforms.get(platform);
  }

  generateAuthUrl(platform: string, userId: string): string | null {
    const platformImpl = this.platforms.get(platform);
    if (!platformImpl) {
      return null;
    }

    // Use userId as state to identify the user during callback
    const state = Buffer.from(JSON.stringify({ userId, platform })).toString('base64');
    return platformImpl.getAuthUrl(state);
  }

  async handleOAuthCallback(
    platform: string,
    code: string,
    state: string
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const platformImpl = this.platforms.get(platform);
      if (!platformImpl) {
        return { success: false, error: 'Unsupported platform' };
      }

      // Decode state to get user info
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      const { userId } = stateData;

      // Exchange code for tokens
      const tokens = await platformImpl.exchangeCodeForTokens(code);

      // Get user info from the platform
      const userInfo = await platformImpl.getUserInfo(tokens.accessToken);

      // Encrypt and store credentials
      const encryptedAccessToken = encryptForStorage(tokens.accessToken);
      const encryptedRefreshToken = tokens.refreshToken 
        ? encryptForStorage(tokens.refreshToken) 
        : null;

      const credential: Omit<SocialCredential, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        platform,
        platformUserId: userInfo.id || userInfo.login || userInfo.username,
        platformUsername: userInfo.username || userInfo.login || userInfo.display_name,
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt: tokens.expiresIn 
          ? new Date(Date.now() + tokens.expiresIn * 1000) 
          : null,
        tokenType: tokens.tokenType || 'Bearer',
        scopes: [], // Will be filled based on platform requirements
        isActive: true,
      };

      await storage.createSocialCredential(credential);

      return { success: true, userId };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async fetchUserPosts(userId: string, platform?: string): Promise<SocialPost[]> {
    try {
      const credentials = await storage.getSocialCredentials(userId);
      const activeCreds = credentials.filter((cred: any) => 
        cred.isActive && (!platform || cred.platform === platform)
      );

      const allPosts: SocialPost[] = [];

      for (const cred of activeCreds) {
        const platformImpl = this.platforms.get(cred.platform);
        if (!platformImpl) continue;

        try {
          // Decrypt access token
          const accessToken = decryptFromStorage(cred.encryptedAccessToken);

          // Check if token needs refresh
          if (cred.tokenExpiresAt && cred.tokenExpiresAt < new Date() && cred.encryptedRefreshToken) {
            const refreshToken = decryptFromStorage(cred.encryptedRefreshToken);
            const newTokens = await platformImpl.refreshTokens(refreshToken);
            
            // Update stored credentials
            const updatedCred = {
              ...cred,
              encryptedAccessToken: encryptForStorage(newTokens.accessToken),
              encryptedRefreshToken: newTokens.refreshToken 
                ? encryptForStorage(newTokens.refreshToken) 
                : cred.encryptedRefreshToken,
              tokenExpiresAt: newTokens.expiresIn 
                ? new Date(Date.now() + newTokens.expiresIn * 1000) 
                : null,
            };
            
            await storage.updateSocialCredential(cred.id, updatedCred);
            
            // Use new access token
            const posts = await platformImpl.fetchUserPosts(newTokens.accessToken, cred.platformUserId);
            allPosts.push(...posts);
          } else {
            // Use existing access token
            const posts = await platformImpl.fetchUserPosts(accessToken, cred.platformUserId);
            allPosts.push(...posts);
          }
        } catch (error) {
          console.error(`Error fetching posts from ${cred.platform}:`, error);
          // Mark credential as inactive if there's an auth error
          if (error instanceof Error && error.message.includes('401')) {
            await storage.updateSocialCredential(cred.id, { ...cred, isActive: false });
          }
        }
      }

      // Sort posts by creation date (newest first)
      return allPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }
  }

  async disconnectPlatform(userId: string, platform: string): Promise<boolean> {
    try {
      const credentials = await storage.getSocialCredentials(userId);
      const platformCred = credentials.find((cred: any) => cred.platform === platform && cred.isActive);
      
      if (!platformCred) {
        return false;
      }

      const platformImpl = this.platforms.get(platform);
      if (platformImpl) {
        try {
          const accessToken = decryptFromStorage(platformCred.encryptedAccessToken);
          await platformImpl.revokeTokens(accessToken);
        } catch (error) {
          console.error('Error revoking tokens:', error);
          // Continue with disconnection even if revocation fails
        }
      }

      // Mark credential as inactive
      await storage.updateSocialCredential(platformCred.id, { 
        ...platformCred, 
        isActive: false 
      });

      return true;
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      return false;
    }
  }

  async getUserConnections(userId: string): Promise<Array<{
    platform: string;
    username: string;
    isActive: boolean;
    connectedAt: Date;
  }>> {
    try {
      const credentials = await storage.getSocialCredentials(userId);
      return credentials.map((cred: any) => ({
        platform: cred.platform,
        username: cred.platformUsername,
        isActive: cred.isActive,
        connectedAt: cred.createdAt,
      }));
    } catch (error) {
      console.error('Error getting user connections:', error);
      return [];
    }
  }
}

export const oauthService = new OAuthService();