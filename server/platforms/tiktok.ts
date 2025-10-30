import { OAuthPlatform, OAuthTokens, SocialPost } from '../oauthService';

export class TikTokOAuth implements OAuthPlatform {
  private clientKey: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_ID || '';
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/tiktok`;
  }
  
  isConfigured(): boolean {
    return !!(this.clientKey && this.clientSecret);
  }

  getAuthUrl(state: string): string {
    const csrfState = Math.random().toString(36).substring(2);
    const params = new URLSearchParams({
      client_key: this.clientKey,
      response_type: 'code',
      scope: 'user.info.basic,video.list',
      redirect_uri: this.redirectUri,
      state: state || csrfState,
    });

    return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`TikTok OAuth error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresIn: data.data.expires_in,
      tokenType: data.data.token_type || 'Bearer',
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`TikTok token refresh error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresIn: data.data.expires_in,
      tokenType: data.data.token_type || 'Bearer',
    };
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`TikTok API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.user;
  }

  async fetchUserPosts(accessToken: string, userId?: string): Promise<SocialPost[]> {
    try {
      // Fetch recent videos for the user
      const response = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,share_url,video_description,duration,create_time', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_count: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.data?.videos) {
        return [];
      }

      return data.data.videos.map((video: any) => ({
        id: video.id,
        platform: 'tiktok',
        content: video.video_description || video.title || '',
        mediaUrl: video.cover_image_url,
        platformPostId: video.id,
        originalUrl: video.share_url,
        createdAt: new Date(video.create_time * 1000),
        metadata: {
          duration: video.duration,
        },
      }));
    } catch (error) {
      console.error('Error fetching TikTok posts:', error);
      return [];
    }
  }

  async revokeTokens(accessToken: string): Promise<void> {
    await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        token: accessToken,
      }),
    });
  }
}
