let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=discord',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Discord not connected');
  }
  return accessToken;
}

// Fetch user's Discord information and recent messages
export async function fetchDiscordData() {
  try {
    const accessToken = await getAccessToken();
    
    // Get user information
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Discord API error: ${userResponse.statusText}`);
    }

    const user = await userResponse.json();

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

    // Return basic info - Discord's OAuth doesn't allow reading messages directly
    // We can only show the servers the user is in
    return guilds.slice(0, 5).map((guild: any) => ({
      id: guild.id,
      platform: 'discord',
      content: `Member of server: ${guild.name}`,
      mediaUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
      platformPostId: guild.id,
      originalUrl: null,
      createdAt: new Date(),
      metadata: {
        username: user.username,
        discriminator: user.discriminator,
        guildName: guild.name,
      },
    }));
  } catch (error) {
    console.error('Error fetching Discord data:', error);
    return [];
  }
}
