import { OAuthPlatform, OAuthTokens, SocialPost } from '../oauthService';

export class InstagramOAuth implements OAuthPlatform {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID || '';
    this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/instagram`;
  }
  
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'user_profile,user_media',
      state,
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Instagram OAuth error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Exchange short-lived token for long-lived token
    const longLivedResponse = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${this.clientSecret}&access_token=${data.access_token}`);
    const longLivedData = await longLivedResponse.json();
    
    return {
      accessToken: longLivedData.access_token,
      refreshToken: '', // Instagram Graph API doesn't use refresh tokens
      expiresIn: longLivedData.expires_in || 5184000, // 60 days
      tokenType: longLivedData.token_type || 'Bearer',
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    // Instagram long-lived tokens can be refreshed before expiry
    const response = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${refreshToken}`);

    if (!response.ok) {
      throw new Error(`Instagram token refresh error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: '',
      expiresIn: data.expires_in || 5184000,
      tokenType: 'Bearer',
    };
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`);

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async fetchUserPosts(accessToken: string, userId?: string): Promise<SocialPost[]> {
    try {
      // Get user info if userId not provided
      if (!userId) {
        const userInfo = await this.getUserInfo(accessToken);
        userId = userInfo.id;
      }

      // Fetch recent media for the user
      const response = await fetch(`https://graph.instagram.com/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=10&access_token=${accessToken}`);

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.data.map((post: any) => ({
        id: post.id,
        platform: 'instagram',
        content: post.caption || '',
        mediaUrl: post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url,
        platformPostId: post.id,
        originalUrl: post.permalink,
        createdAt: new Date(post.timestamp),
        metadata: {
          mediaType: post.media_type,
        },
      }));
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      return [];
    }
  }

  async revokeTokens(accessToken: string): Promise<void> {
    // Instagram doesn't have a direct revoke endpoint
    // Tokens expire automatically after 60 days
    return;
  }
}
