import { google } from 'googleapis';

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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=youtube',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('YouTube not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableYouTubeClient() {
  const accessToken = await getAccessToken();
  return google.youtube({ version: 'v3', auth: accessToken });
}

// Fetch user's YouTube videos for the social feed
export async function fetchYouTubeVideos() {
  try {
    const youtube = await getUncachableYouTubeClient();
    
    // Get the user's channel
    const channelsResponse = await youtube.channels.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
    });

    if (!channelsResponse.data.items || channelsResponse.data.items.length === 0) {
      return [];
    }

    const channel = channelsResponse.data.items[0];
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return [];
    }

    // Get videos from the uploads playlist
    const playlistResponse = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults: 10,
    });

    const videos = playlistResponse.data.items || [];

    return videos.map((video: any) => ({
      id: video.contentDetails.videoId,
      platform: 'youtube',
      content: video.snippet.title || '',
      description: video.snippet.description || '',
      mediaUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
      platformPostId: video.contentDetails.videoId,
      originalUrl: `https://www.youtube.com/watch?v=${video.contentDetails.videoId}`,
      createdAt: new Date(video.snippet.publishedAt),
      metadata: {
        channelTitle: video.snippet.channelTitle,
      },
    }));
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}
