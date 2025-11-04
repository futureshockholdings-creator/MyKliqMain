import { OAuthPlatform, OAuthTokens, SocialPost } from '../oauthService';

export class FacebookOAuth implements OAuthPlatform {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.FACEBOOK_CLIENT_ID || '';
    this.clientSecret = process.env.FACEBOOK_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/facebook`;
  }
  
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string, codeChallenge?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'public_profile,email,user_posts,user_photos',
      state,
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
    });

    const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Facebook OAuth error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Exchange short-lived token for long-lived token
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      fb_exchange_token: data.access_token,
    });

    const longLivedResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${longLivedParams.toString()}`);
    const longLivedData = await longLivedResponse.json();

    return {
      accessToken: longLivedData.access_token,
      refreshToken: '', // Facebook uses long-lived tokens instead of refresh tokens
      expiresIn: longLivedData.expires_in || 5184000, // 60 days
      tokenType: longLivedData.token_type || 'Bearer',
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    // Facebook long-lived tokens don't need to be refreshed the same way
    // They can be extended before expiry
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      fb_exchange_token: refreshToken,
    });

    const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Facebook token refresh error: ${response.statusText}`);
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
    const response = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${accessToken}`);

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      ...data,
      username: data.name,
    };
  }

  async fetchUserPosts(accessToken: string, userId?: string): Promise<SocialPost[]> {
    try {
      // Get user info if userId not provided
      if (!userId) {
        const userInfo = await this.getUserInfo(accessToken);
        userId = userInfo.id;
      }

      // Fetch user's posts
      const response = await fetch(`https://graph.facebook.com/v18.0/${userId}/posts?fields=id,message,full_picture,permalink_url,created_time&limit=25&access_token=${accessToken}`);

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        return [];
      }

      return data.data.map((post: any) => ({
        id: post.id,
        platform: 'facebook',
        content: post.message || '',
        mediaUrl: post.full_picture,
        platformPostId: post.id,
        originalUrl: post.permalink_url || `https://www.facebook.com/${post.id}`,
        createdAt: new Date(post.created_time),
        metadata: {},
      }));
    } catch (error) {
      console.error('Error fetching Facebook posts:', error);
      return [];
    }
  }

  async revokeTokens(accessToken: string): Promise<void> {
    await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`, {
      method: 'DELETE',
    });
  }
}
