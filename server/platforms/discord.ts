import { OAuthPlatform, OAuthTokens, SocialPost } from '../oauthService';

export class DiscordOAuth implements OAuthPlatform {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.DISCORD_CLIENT_ID || '';
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/discord`;
  }
  
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'identify email guilds guilds.members.read',
      state,
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch('https://discord.com/api/oauth2/token', {
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
      throw new Error(`Discord OAuth error: ${response.statusText}`);
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
    const response = await fetch('https://discord.com/api/oauth2/token', {
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
      throw new Error(`Discord token refresh error: ${response.statusText}`);
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
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async fetchUserPosts(accessToken: string, userId?: string): Promise<SocialPost[]> {
    try {
      // Get user's guilds (servers)
      const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!guildsResponse.ok) {
        throw new Error(`Discord API error: ${guildsResponse.statusText}`);
      }

      const guilds = await guildsResponse.json();
      
      // For now, we'll create summary posts about the user's Discord activity
      // Note: Discord doesn't allow fetching messages via OAuth for privacy reasons
      const posts: SocialPost[] = [];

      if (guilds.length > 0) {
        // Create a summary post about Discord activity
        posts.push({
          id: `discord-activity-${Date.now()}`,
          platform: 'discord',
          content: `Active in ${guilds.length} Discord servers including: ${guilds.slice(0, 3).map((g: any) => g.name).join(', ')}${guilds.length > 3 ? '...' : ''}`,
          mediaUrl: undefined,
          platformPostId: `activity-${Date.now()}`,
          originalUrl: 'https://discord.com/channels/@me',
          createdAt: new Date(),
          metadata: {
            type: 'activity_summary',
            guildCount: guilds.length,
            topGuilds: guilds.slice(0, 5).map((g: any) => ({
              id: g.id,
              name: g.name,
              icon: g.icon,
            })),
          },
        });
      }

      return posts;
    } catch (error) {
      console.error('Error fetching Discord posts:', error);
      return [];
    }
  }

  async revokeTokens(accessToken: string): Promise<void> {
    await fetch('https://discord.com/api/oauth2/token/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        token: accessToken,
      }),
    });
  }
}