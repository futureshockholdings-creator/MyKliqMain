import { storage } from './storage';
import { oauthService, SocialPost } from './oauthService';
import { decryptFromStorage } from './cryptoService';
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

  async syncUserPlatform(userId: string, platform: string): Promise<SyncResult> {
    const lockKey = `${userId}:${platform}`;
    
    if (this.syncLock.has(lockKey)) {
      return {
        platform,
        success: false,
        newPosts: 0,
        totalFetched: 0,
        error: 'Sync already in progress',
      };
    }

    this.syncLock.add(lockKey);
    
    try {
      const credential = await storage.getSocialCredential(userId, platform);
      if (!credential || !credential.isActive) {
        return {
          platform,
          success: false,
          newPosts: 0,
          totalFetched: 0,
          error: 'Platform not connected or inactive',
        };
      }

      const accessToken = decryptFromStorage(credential.encryptedAccessToken);
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

      let posts: SocialPost[];
      try {
        posts = await platformImpl.fetchUserPosts(accessToken, credential.platformUserId);
      } catch (fetchError: any) {
        console.error(`Error fetching posts from ${platform}:`, fetchError);
        
        if (fetchError.message?.includes('401') || fetchError.message?.includes('Unauthorized')) {
          await storage.updateSocialCredential(credential.id, { isActive: false });
        }
        
        return {
          platform,
          success: false,
          newPosts: 0,
          totalFetched: 0,
          error: fetchError.message || 'Failed to fetch posts',
        };
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
    const activeCredentials = credentials.filter(c => c.isActive);

    if (activeCredentials.length === 0) {
      return [];
    }

    const results = await Promise.all(
      activeCredentials.map(cred => this.syncUserPlatform(userId, cred.platform))
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

    // Delete posts older than 24 hours from all other platforms (TOS compliance)
    // Using 1 day as the keepDays parameter which equals 24 hours
    await storage.deleteOldExternalPosts('youtube', 1);
    await storage.deleteOldExternalPosts('tiktok', 1);
    await storage.deleteOldExternalPosts('reddit', 1);
    await storage.deleteOldExternalPosts('pinterest', 1);
    await storage.deleteOldExternalPosts('discord', 1);

    console.log(`[SocialSync] Cleaned up old posts (24hr limit for TOS compliance): ${totalDeleted} Twitch posts removed`);

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
