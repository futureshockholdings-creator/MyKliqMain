import { OAuthPlatform, OAuthTokens, SocialPost } from '../oauthService';
import { BskyAgent } from '@atproto/api';

export class BlueskyOAuth implements OAuthPlatform {
  private agent: BskyAgent;

  constructor() {
    this.agent = new BskyAgent({ service: 'https://bsky.social' });
  }

  isConfigured(): boolean {
    return true;
  }

  getAuthUrl(state: string, codeChallenge?: string): string {
    return `/bluesky-connect?state=${encodeURIComponent(state)}`;
  }

  async exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<OAuthTokens> {
    throw new Error('Bluesky uses app password authentication. Use authenticateWithAppPassword instead.');
  }

  async authenticateWithAppPassword(handle: string, appPassword: string): Promise<{ tokens: OAuthTokens; userInfo: any }> {
    try {
      const response = await this.agent.login({
        identifier: handle,
        password: appPassword,
      });

      return {
        tokens: {
          accessToken: response.data.accessJwt,
          refreshToken: response.data.refreshJwt,
          tokenType: 'Bearer',
        },
        userInfo: {
          id: response.data.did,
          did: response.data.did,
          handle: response.data.handle,
          username: response.data.handle,
          email: response.data.email,
        },
      };
    } catch (error: any) {
      console.error('Bluesky authentication error:', error);
      throw new Error(error.message || 'Failed to authenticate with Bluesky');
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch('https://bsky.social/xrpc/com.atproto.server.refreshSession', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      const status = response.status;
      const msg = `Bluesky token refresh failed with status ${status}: ${response.statusText}`;
      console.error(msg);
      throw new Error(`401 ${msg}`);
    }

    const data = await response.json();
    return {
      accessToken: data.accessJwt,
      refreshToken: data.refreshJwt,
      tokenType: 'Bearer',
    };
  }

  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://bsky.social/xrpc/com.atproto.server.getSession', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Bluesky API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.did,
        did: data.did,
        handle: data.handle,
        username: data.handle,
        email: data.email,
      };
    } catch (error: any) {
      console.error('Error fetching Bluesky user info:', error);
      throw error;
    }
  }

  async fetchUserPosts(accessToken: string, userId?: string): Promise<SocialPost[]> {
    // Use the stored DID directly as the actor — avoids an extra getSession API call
    // and removes a second 401 failure surface point.
    let actor = userId;
    let handle = userId; // fallback for URL construction

    if (!actor) {
      // No DID stored — fall back to getSession to resolve the handle
      const sessionResponse = await fetch('https://bsky.social/xrpc/com.atproto.server.getSession', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!sessionResponse.ok) {
        const status = sessionResponse.status;
        throw new Error(`401 Bluesky getSession failed with status ${status}: ${sessionResponse.statusText}`);
      }
      const session = await sessionResponse.json();
      actor = session.did;
      handle = session.handle;
    }

    const feedResponse = await fetch(
      `https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(actor!)}&limit=30&filter=posts_no_replies`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    if (!feedResponse.ok) {
      const status = feedResponse.status;
      const msg = `Bluesky getAuthorFeed failed with status ${status}: ${feedResponse.statusText}`;
      console.error(msg);
      if (status === 401 || status === 400) throw new Error(`401 ${msg}`);
      throw new Error(msg);
    }

    const feedData = await feedResponse.json();

    if (!feedData.feed || !Array.isArray(feedData.feed)) {
      return [];
    }

    // Only keep the user's own original posts (not reposts of other people's content).
    // Reposts have item.reason.$type === 'app.bsky.feed.defs#reasonRepost' and
    // item.post.author.did !== actor.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return feedData.feed
      .filter((item: any) => {
        // Exclude reposts
        if (item.reason?.['$type'] === 'app.bsky.feed.defs#reasonRepost') return false;
        // Exclude posts authored by someone other than this user
        if (actor && item.post?.author?.did && item.post.author.did !== actor) return false;
        // Only keep posts within the 7-day retention window to avoid the
        // delete-then-re-add cycle between cleanup and sync.
        const postDate = new Date(item.post?.record?.createdAt || item.post?.indexedAt);
        return postDate >= sevenDaysAgo;
      })
      .map((item: any) => {
        const post = item.post;
        const record = post.record;

        let mediaUrl: string | undefined;
        if (post.embed?.images?.length > 0) {
          mediaUrl = post.embed.images[0].fullsize || post.embed.images[0].thumb;
        } else if (post.embed?.thumbnail) {
          mediaUrl = post.embed.thumbnail;
        }

        const postUri = post.uri;
        const postId = postUri.split('/').pop();
        // Use handle if we resolved it, otherwise use actor (DID works in bsky.app URLs too)
        const profileActor = handle || actor;
        const originalUrl = `https://bsky.app/profile/${profileActor}/post/${postId}`;

        return {
          id: postUri,
          platform: 'bluesky',
          content: record.text || '',
          mediaUrl,
          platformPostId: postUri,
          originalUrl,
          createdAt: new Date(record.createdAt || post.indexedAt),
          metadata: {
            likes: post.likeCount || 0,
            reposts: post.repostCount || 0,
            replies: post.replyCount || 0,
            author: {
              handle: post.author?.handle,
              displayName: post.author?.displayName,
              avatar: post.author?.avatar,
            },
          },
        };
      });
  }

  async revokeTokens(accessToken: string): Promise<void> {
    try {
      await fetch('https://bsky.social/xrpc/com.atproto.server.deleteSession', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('Error revoking Bluesky session:', error);
    }
  }
}
