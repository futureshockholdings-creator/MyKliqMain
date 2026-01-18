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
    try {
      const response = await fetch('https://bsky.social/xrpc/com.atproto.server.refreshSession', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Bluesky token refresh error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        accessToken: data.accessJwt,
        refreshToken: data.refreshJwt,
        tokenType: 'Bearer',
      };
    } catch (error: any) {
      console.error('Error refreshing Bluesky tokens:', error);
      throw error;
    }
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
    try {
      const sessionResponse = await fetch('https://bsky.social/xrpc/com.atproto.server.getSession', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to get Bluesky session');
      }

      const session = await sessionResponse.json();
      const handle = session.handle;

      const feedResponse = await fetch(
        `https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!feedResponse.ok) {
        throw new Error(`Bluesky feed error: ${feedResponse.statusText}`);
      }

      const feedData = await feedResponse.json();

      if (!feedData.feed || !Array.isArray(feedData.feed)) {
        return [];
      }

      return feedData.feed.map((item: any) => {
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
        const originalUrl = `https://bsky.app/profile/${handle}/post/${postId}`;

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
    } catch (error) {
      console.error('Error fetching Bluesky posts:', error);
      return [];
    }
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
