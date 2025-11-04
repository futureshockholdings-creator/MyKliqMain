import { OAuthPlatform, OAuthTokens, SocialPost } from '../oauthService';

export class ESPNOAuth implements OAuthPlatform {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.ESPN_CLIENT_ID || '';
    this.clientSecret = process.env.ESPN_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/espn`;
  }
  
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string, codeChallenge?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile fantasy',
      state,
    });

    return `https://api.espn.com/v1/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<OAuthTokens> {
    const response = await fetch('https://api.espn.com/v1/oauth/token', {
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
      throw new Error(`ESPN OAuth error: ${response.statusText}`);
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
    const response = await fetch('https://api.espn.com/v1/oauth/token', {
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
      throw new Error(`ESPN token refresh error: ${response.statusText}`);
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
    const response = await fetch('https://api.espn.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.userId || data.id,
      username: data.displayName || data.username,
      ...data,
    };
  }

  async fetchUserPosts(accessToken: string, userId?: string): Promise<SocialPost[]> {
    try {
      // Get user info if userId not provided
      if (!userId) {
        const userInfo = await this.getUserInfo(accessToken);
        userId = userInfo.id;
      }

      // Fetch user's fantasy leagues
      const response = await fetch(`https://api.espn.com/v1/fantasy/leagues?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.leagues || data.leagues.length === 0) {
        return [];
      }

      // Convert fantasy leagues into "posts" for the social feed
      return data.leagues.slice(0, 10).map((league: any) => ({
        id: league.id,
        platform: 'espn',
        content: `${league.sport} Fantasy League: ${league.name}`,
        mediaUrl: league.logoUrl,
        platformPostId: league.id,
        originalUrl: `https://fantasy.espn.com/${league.sport}/league?leagueId=${league.id}`,
        createdAt: new Date(league.seasonStartDate || Date.now()),
        metadata: {
          sport: league.sport,
          season: league.season,
          teamCount: league.teams?.length || 0,
          status: league.status,
        },
      }));
    } catch (error) {
      console.error('Error fetching ESPN fantasy data:', error);
      return [];
    }
  }

  async revokeTokens(accessToken: string): Promise<void> {
    await fetch('https://api.espn.com/v1/oauth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        token: accessToken,
        token_type_hint: 'access_token',
      }),
    });
  }
}
