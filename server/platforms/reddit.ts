import { OAuthPlatform, OAuthTokens, SocialPost } from '../oauthService';

export class RedditOAuth implements OAuthPlatform {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID || '';
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/reddit`;
  }
  
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string, codeChallenge?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'identity read history',
      state,
      duration: 'permanent',
    });

    return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<OAuthTokens> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Reddit OAuth error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type || 'Bearer',
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Reddit token refresh error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Reddit doesn't return a new refresh token
      expiresIn: data.expires_in,
      tokenType: data.token_type || 'Bearer',
    };
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MyKliq/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async fetchUserPosts(accessToken: string, userId?: string): Promise<SocialPost[]> {
    try {
      // Get user info if userId not provided
      let username = userId;
      if (!username) {
        const userInfo = await this.getUserInfo(accessToken);
        username = userInfo.name;
      }

      // Fetch recent posts and comments for the user
      const response = await fetch(`https://oauth.reddit.com/user/${username}/submitted?limit=10`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'MyKliq/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.data.children.map((post: any) => ({
        id: post.data.id,
        platform: 'reddit',
        content: post.data.title || post.data.body || '',
        mediaUrl: post.data.thumbnail && post.data.thumbnail.startsWith('http') ? post.data.thumbnail : undefined,
        platformPostId: post.data.id,
        originalUrl: `https://reddit.com${post.data.permalink}`,
        createdAt: new Date(post.data.created_utc * 1000),
        metadata: {
          subreddit: post.data.subreddit,
          score: post.data.score,
          numComments: post.data.num_comments,
        },
      }));
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      return [];
    }
  }

  async revokeTokens(accessToken: string): Promise<void> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    await fetch('https://www.reddit.com/api/v1/revoke_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: accessToken,
        token_type_hint: 'access_token',
      }),
    });
  }
}
