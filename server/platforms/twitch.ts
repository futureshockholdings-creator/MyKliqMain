import { OAuthPlatform, OAuthTokens, SocialPost } from '../oauthService';

export class TwitchOAuth implements OAuthPlatform {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID || '';
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.BASE_URL || 'https://c7dd138c-576d-4490-a426-c0be6e6124ca-00-1u3lut3kqrgq6.kirk.replit.dev'}/api/oauth/callback/twitch`;
  }
  
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string, codeChallenge?: string): string {
    console.log('Twitch getAuthUrl - redirect_uri being sent:', this.redirectUri);
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'user:read:email channel:read:subscriptions',
      state,
    });

    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<OAuthTokens> {
    const requestBody = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    };
    
    console.log('Twitch token exchange request:', {
      redirect_uri: this.redirectUri,
      code: code ? code.substring(0, 10) + '...' : 'MISSING',
    });
    
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitch OAuth error response:', errorText);
      throw new Error(`Twitch OAuth error: ${response.statusText} - ${errorText}`);
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
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Twitch token refresh error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type || 'Bearer',
    };
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': this.clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0];
  }

  async fetchUserPosts(accessToken: string, userId?: string): Promise<SocialPost[]> {
    try {
      // Get user info if userId not provided
      if (!userId) {
        const userInfo = await this.getUserInfo(accessToken);
        userId = userInfo.id;
      }

      // Fetch recent streams/videos for the user
      const response = await fetch(`https://api.twitch.tv/helix/videos?user_id=${userId}&first=10`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': this.clientId,
        },
      });

      if (!response.ok) {
        throw new Error(`Twitch API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.data.map((video: any) => ({
        id: video.id,
        platform: 'twitch',
        content: video.title,
        mediaUrl: video.thumbnail_url?.replace('%{width}', '480').replace('%{height}', '270'),
        platformPostId: video.id,
        originalUrl: video.url,
        createdAt: new Date(video.created_at),
        metadata: {
          type: video.type,
          duration: video.duration,
          viewCount: video.view_count,
          language: video.language,
        },
      }));
    } catch (error) {
      console.error('Error fetching Twitch posts:', error);
      return [];
    }
  }

  async revokeTokens(accessToken: string): Promise<void> {
    await fetch(`https://id.twitch.tv/oauth2/revoke?client_id=${this.clientId}&token=${accessToken}`, {
      method: 'POST',
    });
  }
}