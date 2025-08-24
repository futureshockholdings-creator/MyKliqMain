interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

interface PlatformUserInfo {
  id: string;
  username: string;
  displayName?: string;
  profileImage?: string;
}

export class OAuthService {
  private static configs: Record<string, OAuthConfig> = {
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID || '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || 'http://localhost:3000'}/api/oauth/callback/twitch`,
      scopes: ['user:read:email', 'channel:read:subscriptions'],
      authUrl: 'https://id.twitch.tv/oauth2/authorize',
      tokenUrl: 'https://id.twitch.tv/oauth2/token',
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || 'http://localhost:3000'}/api/oauth/callback/discord`,
      scopes: ['identify', 'guilds.members.read'],
      authUrl: 'https://discord.com/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
    },
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || 'http://localhost:3000'}/api/oauth/callback/instagram`,
      scopes: ['user_profile', 'user_media'],
      authUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
    },
    tiktok: {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || 'http://localhost:3000'}/api/oauth/callback/tiktok`,
      scopes: ['user.info.basic', 'video.list'],
      authUrl: 'https://www.tiktok.com/v2/auth/authorize',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token',
    },
    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || 'http://localhost:3000'}/api/oauth/callback/youtube`,
      scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
    },
    reddit: {
      clientId: process.env.REDDIT_CLIENT_ID || '',
      clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || 'http://localhost:3000'}/api/oauth/callback/reddit`,
      scopes: ['identity', 'mysubreddits', 'read'],
      authUrl: 'https://www.reddit.com/api/v1/authorize',
      tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    },
  };

  static getAuthUrl(platform: string, state: string): string {
    const config = this.configs[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state,
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  static async exchangeCodeForTokens(platform: string, code: string): Promise<OAuthTokens> {
    const config = this.configs[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Reddit requires Basic Auth
    if (platform === 'reddit') {
      const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth token exchange failed for ${platform}: ${errorText}`);
    }

    return await response.json();
  }

  static async getUserInfo(platform: string, accessToken: string): Promise<PlatformUserInfo> {
    switch (platform) {
      case 'twitch':
        return this.getTwitchUserInfo(accessToken);
      case 'discord':
        return this.getDiscordUserInfo(accessToken);
      case 'instagram':
        return this.getInstagramUserInfo(accessToken);
      case 'tiktok':
        return this.getTikTokUserInfo(accessToken);
      case 'youtube':
        return this.getYouTubeUserInfo(accessToken);
      case 'reddit':
        return this.getRedditUserInfo(accessToken);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private static async getTwitchUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': this.configs.twitch.clientId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Twitch user info');
    }

    const data = await response.json();
    const user = data.data[0];
    
    return {
      id: user.id,
      username: user.login,
      displayName: user.display_name,
      profileImage: user.profile_image_url,
    };
  }

  private static async getDiscordUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Discord user info');
    }

    const user = await response.json();
    
    return {
      id: user.id,
      username: user.username,
      displayName: user.global_name || user.username,
      profileImage: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined,
    };
  }

  private static async getInstagramUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    const response = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);

    if (!response.ok) {
      throw new Error('Failed to fetch Instagram user info');
    }

    const user = await response.json();
    
    return {
      id: user.id,
      username: user.username,
    };
  }

  private static async getTikTokUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch TikTok user info');
    }

    const data = await response.json();
    const user = data.data.user;
    
    return {
      id: user.open_id,
      username: user.union_id,
      displayName: user.display_name,
      profileImage: user.avatar_url,
    };
  }

  private static async getYouTubeUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch YouTube user info');
    }

    const data = await response.json();
    const channel = data.items[0];
    
    return {
      id: channel.id,
      username: channel.snippet.customUrl || channel.snippet.title,
      displayName: channel.snippet.title,
      profileImage: channel.snippet.thumbnails?.default?.url,
    };
  }

  private static async getRedditUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    const response = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'MyKliq/1.0',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Reddit user info');
    }

    const user = await response.json();
    
    return {
      id: user.id,
      username: user.name,
      profileImage: user.icon_img || undefined,
    };
  }

  static async refreshToken(platform: string, refreshToken: string): Promise<OAuthTokens> {
    const config = this.configs[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed for ${platform}`);
    }

    return await response.json();
  }
}