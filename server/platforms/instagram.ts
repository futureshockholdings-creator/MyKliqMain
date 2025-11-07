import { OAuthPlatform, OAuthTokens, SocialPost } from '../oauthService';

export class InstagramOAuth implements OAuthPlatform {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.FACEBOOK_CLIENT_ID || '';
    this.clientSecret = process.env.FACEBOOK_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/instagram`;
  }
  
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string, codeChallenge?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'instagram_basic,pages_show_list',
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
      const errorText = await response.text();
      console.error('Instagram OAuth error:', errorText);
      throw new Error(`Instagram OAuth error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Exchange short-lived token for long-lived token using Facebook's exchange method
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      fb_exchange_token: data.access_token,
    });

    const longLivedResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${longLivedParams.toString()}`);
    
    if (!longLivedResponse.ok) {
      const errorText = await longLivedResponse.text();
      console.error('Instagram long-lived token error:', errorText);
    }
    
    const longLivedData = await longLivedResponse.json();
    
    return {
      accessToken: longLivedData.access_token,
      refreshToken: '',
      expiresIn: longLivedData.expires_in || 5184000, // 60 days
      tokenType: longLivedData.token_type || 'Bearer',
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    // Use Facebook's token exchange to refresh
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      fb_exchange_token: refreshToken,
    });

    const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);

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
