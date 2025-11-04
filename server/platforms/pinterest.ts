import { OAuthPlatform, OAuthTokens, SocialPost } from '../oauthService';

export class PinterestOAuth implements OAuthPlatform {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.PINTEREST_CLIENT_ID || '';
    this.clientSecret = process.env.PINTEREST_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/pinterest`;
  }
  
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string, codeChallenge?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'boards:read,pins:read,user_accounts:read',
      state,
    });

    return `https://www.pinterest.com/oauth/?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<OAuthTokens> {
    const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinterest OAuth error: ${response.statusText}`);
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
    const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinterest token refresh error: ${response.statusText}`);
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
    const response = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Pinterest API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async fetchUserPosts(accessToken: string, userId?: string): Promise<SocialPost[]> {
    try {
      // Fetch user's pins
      const response = await fetch('https://api.pinterest.com/v5/pins?page_size=25', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Pinterest API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.items) {
        return [];
      }

      return data.items.map((pin: any) => ({
        id: pin.id,
        platform: 'pinterest',
        content: pin.description || pin.title || '',
        mediaUrl: pin.media?.images?.['400x300']?.url || pin.media?.images?.original?.url,
        platformPostId: pin.id,
        originalUrl: pin.link || `https://www.pinterest.com/pin/${pin.id}`,
        createdAt: new Date(pin.created_at),
        metadata: {
          boardId: pin.board_id,
          altText: pin.alt_text,
        },
      }));
    } catch (error) {
      console.error('Error fetching Pinterest pins:', error);
      return [];
    }
  }

  async revokeTokens(accessToken: string): Promise<void> {
    // Pinterest doesn't have a public token revocation endpoint
    // Tokens expire automatically
    return;
  }
}
