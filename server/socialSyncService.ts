import { storage } from './storage';
import { oauthService, SocialPost } from './oauthService';
import { decryptFromStorage, encryptForStorage } from './cryptoService';
import { db } from './db';
import { externalPosts, socialCredentials } from '@shared/schema';
import { eq, and, inArray, lt } from 'drizzle-orm';

export interface SyncResult {
  platform: string;
  success: boolean;
  newPosts: number;
  totalFetched: number;
  error?: string;
}

class SocialSyncService {
  private syncLock: Set<string> = new Set();

  async syncUserPlatform(userId: string, platform: string, forceUnlock: boolean = false): Promise<SyncResult> {
    const lockKey = `${userId}:${platform}`;
    
    if (this.syncLock.has(lockKey)) {
      if (!forceUnlock) {
        return {
          platform,
          success: false,
          newPosts: 0,
          totalFetched: 0,
          error: 'Sync already in progress',
        };
      }
      // User explicitly requested sync — clear the stale lock and proceed
      this.syncLock.delete(lockKey);
    }

    this.syncLock.add(lockKey);
    
    try {
      const credential = await storage.getSocialCredential(userId, platform);
      if (!credential) {
        return {
          platform,
          success: false,
          newPosts: 0,
          totalFetched: 0,
          error: 'Platform not connected',
        };
      }

      // Auto-recover inactive credentials: if we still have a refresh token, try to
      // re-enable the credential before giving up. This fixes cases where the old code
      // incorrectly set isActive=false on a transient refresh failure.
      if (!credential.isActive) {
        if (credential.encryptedRefreshToken) {
          try {
            const { decryptFromStorage, encryptForStorage } = await import('./cryptoService');
            const platformImpl = oauthService.getPlatform(platform);
            const refreshToken = decryptFromStorage(credential.encryptedRefreshToken);
            const newTokens = await platformImpl.refreshTokens(refreshToken);
            const updatedFields: any = {
              encryptedAccessToken: encryptForStorage(newTokens.accessToken),
              isActive: true,
              lastSyncAt: new Date(),
            };
            if (newTokens.refreshToken) updatedFields.encryptedRefreshToken = encryptForStorage(newTokens.refreshToken);
            if (newTokens.expiresIn) {
              updatedFields.tokenExpiresAt = new Date(Date.now() + newTokens.expiresIn * 1000);
            } else if (platform === 'bluesky') {
              updatedFields.tokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            }
            await storage.updateSocialCredential(credential.id, updatedFields);
            console.log(`[SocialSync] Auto-recovered inactive ${platform} credential for user ${userId}`);
            // Re-fetch so we proceed with a fresh credential object
            const recovered = await storage.getSocialCredential(userId, platform);
            if (!recovered?.isActive) throw new Error('Recovery failed');
            Object.assign(credential, recovered);
          } catch (recoverErr: any) {
            await storage.updateSocialCredential(credential.id, { lastSyncAt: new Date() });
            return {
              platform,
              success: false,
              newPosts: 0,
              totalFetched: 0,
              error: `Credential inactive and recovery failed: ${recoverErr.message}`,
            };
          }
        } else {
          await storage.updateSocialCredential(credential.id, { lastSyncAt: new Date() });
          return {
            platform,
            success: false,
            newPosts: 0,
            totalFetched: 0,
            error: 'Platform credential inactive and no refresh token available',
          };
        }
      }

      const platformImpl = oauthService.getPlatform(platform);
      
      if (!platformImpl) {
        return {
          platform,
          success: false,
          newPosts: 0,
          totalFetched: 0,
          error: 'Platform not supported',
        };
      }

      let accessToken = decryptFromStorage(credential.encryptedAccessToken);

      if (credential.tokenExpiresAt && credential.encryptedRefreshToken) {
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
        if (credential.tokenExpiresAt <= fiveMinutesFromNow) {
          console.log(`[SocialSync] Proactively refreshing token for ${platform} (expires ${credential.tokenExpiresAt.toISOString()})...`);
          try {
            const refreshToken = decryptFromStorage(credential.encryptedRefreshToken);
            const newTokens = await platformImpl.refreshTokens(refreshToken);
            const updatedFields: any = {
              encryptedAccessToken: encryptForStorage(newTokens.accessToken),
              lastSyncAt: new Date(),
            };
            if (newTokens.refreshToken) {
              updatedFields.encryptedRefreshToken = encryptForStorage(newTokens.refreshToken);
            }
            if (newTokens.expiresIn) {
              updatedFields.tokenExpiresAt = new Date(Date.now() + newTokens.expiresIn * 1000);
            } else if (platform === 'bluesky') {
              updatedFields.tokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            }
            await storage.updateSocialCredential(credential.id, updatedFields);
            accessToken = newTokens.accessToken;
            console.log(`[SocialSync] Proactive refresh succeeded for ${platform}`);
          } catch (proactiveRefreshError: any) {
            console.warn(`[SocialSync] Proactive refresh failed for ${platform}, will try with existing token:`, proactiveRefreshError.message);
          }
        }
      }

      let posts: SocialPost[];
      try {
        posts = await platformImpl.fetchUserPosts(accessToken, credential.platformUserId);
      } catch (fetchError: any) {
        console.error(`Error fetching posts from ${platform}:`, fetchError);

        const isAuthError = fetchError.message?.includes('401') || fetchError.message?.includes('Unauthorized');

        if (isAuthError && credential.encryptedRefreshToken) {
          console.log(`[SocialSync] Attempting token refresh for ${platform} user ${userId}...`);
          try {
            const refreshToken = decryptFromStorage(credential.encryptedRefreshToken);
            const newTokens = await platformImpl.refreshTokens(refreshToken);

            const updatedFields: any = {
              encryptedAccessToken: encryptForStorage(newTokens.accessToken),
              lastSyncAt: new Date(),
            };
            if (newTokens.refreshToken) {
              updatedFields.encryptedRefreshToken = encryptForStorage(newTokens.refreshToken);
            }
            if (platform === 'bluesky') {
              updatedFields.tokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            }
            await storage.updateSocialCredential(credential.id, updatedFields);

            console.log(`[SocialSync] Token refresh succeeded for ${platform}, retrying fetch...`);
            posts = await platformImpl.fetchUserPosts(newTokens.accessToken, credential.platformUserId);
          } catch (refreshError: any) {
            console.error(`[SocialSync] Token refresh failed for ${platform}:`, refreshError);
            // Update lastSyncAt so the UI shows the most recent attempt, not a stale date.
            await storage.updateSocialCredential(credential.id, { lastSyncAt: new Date() });
            return {
              platform,
              success: false,
              newPosts: 0,
              totalFetched: 0,
              error: `Token refresh failed: ${refreshError.message}`,
            };
          }
        } else {
          // Non-auth fetch error — update lastSyncAt and retry on the next cycle.
          await storage.updateSocialCredential(credential.id, { lastSyncAt: new Date() });
          return {
            platform,
            success: false,
            newPosts: 0,
            totalFetched: 0,
            error: fetchError.message || 'Failed to fetch posts',
          };
        }
      }

      if (!posts || posts.length === 0) {
        await storage.updateSocialCredential(credential.id, {
          lastSyncAt: new Date(),
        });
        
        return {
          platform,
          success: true,
          newPosts: 0,
          totalFetched: 0,
        };
      }

      // For Discord, remap the platform post ID to be credential-based, not guild-hash based.
      // This ensures the same DB record is matched across syncs even if guild list changes,
      // preventing the "age resets every 7 days" bug.
      if (platform === 'discord') {
        for (const post of posts) {
          post.platformPostId = `discord-activity-${credential.id}`;
        }
      }

      const platformPostIds = posts.map(p => p.platformPostId);
      const existingPosts = await db
        .select({ platformPostId: externalPosts.platformPostId })
        .from(externalPosts)
        .where(and(
          eq(externalPosts.socialCredentialId, credential.id),
          inArray(externalPosts.platformPostId, platformPostIds)
        ));
      
      const existingIds = new Set(existingPosts.map(p => p.platformPostId));
      const newPosts = posts.filter(p => !existingIds.has(p.platformPostId));

      // For Discord posts that already exist, update content only (preserve original platformCreatedAt).
      // This allows guild name changes to appear without resetting the post's age.
      if (platform === 'discord') {
        const existingDiscordPosts = posts.filter(p => existingIds.has(p.platformPostId));
        for (const post of existingDiscordPosts) {
          await storage.upsertDiscordPostContent(post.platformPostId, credential.id, post.content);
        }
      }

      if (newPosts.length > 0) {
        const externalPostsToInsert = newPosts.map(post => ({
          socialCredentialId: credential.id,
          platform: post.platform,
          platformPostId: post.platformPostId,
          platformUserId: credential.platformUserId || '',
          platformUsername: credential.platformUsername || '',
          content: post.content,
          mediaUrls: post.mediaUrl ? [post.mediaUrl] : [],
          thumbnailUrl: post.mediaUrl || null,
          postUrl: post.originalUrl,
          platformCreatedAt: post.createdAt,
        }));

        await storage.createExternalPosts(externalPostsToInsert);
      }

      await storage.updateSocialCredential(credential.id, {
        lastSyncAt: new Date(),
      });

      return {
        platform,
        success: true,
        newPosts: newPosts.length,
        totalFetched: posts.length,
      };
    } catch (error: any) {
      console.error(`Error syncing ${platform} for user ${userId}:`, error);
      return {
        platform,
        success: false,
        newPosts: 0,
        totalFetched: 0,
        error: error.message || 'Unknown error',
      };
    } finally {
      this.syncLock.delete(lockKey);
    }
  }

  async syncAllUserPlatforms(userId: string): Promise<SyncResult[]> {
    const credentials = await storage.getSocialCredentials(userId);

    if (credentials.length === 0) {
      return [];
    }

    // Include inactive credentials so they get a chance to auto-recover via token refresh.
    const results = await Promise.all(
      credentials.map(cred => this.syncUserPlatform(userId, cred.platform))
    );

    return results;
  }

  async cleanOldPosts(): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    let totalDeleted = 0;

    // Delete Twitch posts older than 24 hours (TOS compliance)
    const twitchResult = await db
      .delete(externalPosts)
      .where(and(
        eq(externalPosts.platform, 'twitch'),
        lt(externalPosts.platformCreatedAt, cutoffDate)
      ))
      .returning();
    totalDeleted += twitchResult.length;

    // Delete posts older than 7 days from all non-Twitch platforms.
    await storage.deleteOldExternalPosts('discord', 7);
    await storage.deleteOldExternalPosts('youtube', 7);
    await storage.deleteOldExternalPosts('reddit', 7);
    await storage.deleteOldExternalPosts('pinterest', 7);
    await storage.deleteOldExternalPosts('bluesky', 7);

    console.log(`[SocialSync] Cleaned up old posts: ${totalDeleted} Twitch posts removed + 7-day cleanup ran for discord/youtube/reddit/pinterest/bluesky`);

    return { deleted: totalDeleted };
  }

  async autoSyncAllUsers(): Promise<{ synced: number; errors: number }> {
    const allCredentials = await db
      .select()
      .from(socialCredentials)
      .where(eq(socialCredentials.isActive, true));

    const userIds = [...new Set(allCredentials.map(c => c.userId))];
    
    let synced = 0;
    let errors = 0;

    for (const userId of userIds) {
      try {
        const results = await this.syncAllUserPlatforms(userId);
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;
        synced += successCount;
        errors += errorCount;
      } catch (error) {
        console.error(`Error auto-syncing user ${userId}:`, error);
        errors++;
      }
    }

    return { synced, errors };
  }
}

export const socialSyncService = new SocialSyncService();

let syncInterval: NodeJS.Timeout | null = null;

export function startAutoSync(intervalMinutes: number = 15): void {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  console.log(`[SocialSync] Starting auto-sync every ${intervalMinutes} minutes`);

  const runSync = async () => {
    console.log('[SocialSync] Running automatic sync...');
    try {
      const result = await socialSyncService.autoSyncAllUsers();
      console.log(`[SocialSync] Auto-sync complete: ${result.synced} synced, ${result.errors} errors`);
      
      await socialSyncService.cleanOldPosts();
    } catch (error) {
      console.error('[SocialSync] Auto-sync failed:', error);
    }
  };

  runSync();

  syncInterval = setInterval(runSync, intervalMinutes * 60 * 1000);
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[SocialSync] Auto-sync stopped');
  }
}
