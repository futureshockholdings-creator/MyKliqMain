import { OAuthPlatform, OAuthTokens, SocialPost } from '../oauthService';
import { createHash } from 'crypto';

export class DiscordOAuth implements OAuthPlatform {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.DISCORD_CLIENT_ID || '';
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
    this.redirectUri = `${process.env.BASE_URL || 'https://c7dd138c-576d-4490-a426-c0be6e6124ca-00-1u3lut3kqrgq6.kirk.replit.dev'}/api/oauth/callback/discord`;
  }
  
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string, codeChallenge?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'identify email guilds guilds.members.read',
      state,
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<OAuthTokens> {
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
        // Generate a stable hash from guild data to detect actual changes
        // This prevents duplicate posts when nothing has changed
        const sortedGuildIds = guilds.map((g: any) => g.id).sort().join(',');
        const guildNames = guilds.map((g: any) => g.name).sort().join(',');
        const snapshotData = `${sortedGuildIds}|${guildNames}|${guilds.length}`;
        const snapshotHash = createHash('md5').update(snapshotData).digest('hex').substring(0, 16);
        
        // Use the hash as the platformPostId - this way, if nothing changes,
        // the same ID will be generated and duplicate detection will skip it
        const stablePostId = `discord-servers-${snapshotHash}`;
        
        // Create a summary post about Discord activity
        posts.push({
          id: stablePostId,
          platform: 'discord',
          content: `Active in ${guilds.length} Discord server${guilds.length !== 1 ? 's' : ''}: ${guilds.slice(0, 3).map((g: any) => g.name).join(', ')}${guilds.length > 3 ? ` and ${guilds.length - 3} more` : ''}`,
          mediaUrl: undefined,
          platformPostId: stablePostId,
          originalUrl: 'https://discord.com/channels/@me',
          createdAt: new Date(),
          metadata: {
            type: 'activity_summary',
            guildCount: guilds.length,
            snapshotHash,
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