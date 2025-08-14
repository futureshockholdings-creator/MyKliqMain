import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Shuffle,
  Repeat,
  Search,
  Music,
  ExternalLink,
  Download,
  Heart,
  Plus
} from "lucide-react";

interface IntegratedMusicPlayerProps {
  connectedServices: Record<string, any>;
  currentUser?: any;
}

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  image?: string;
  url?: string;
  service: 'spotify' | 'appleMusic' | 'local';
}

interface PlaybackState {
  isPlaying: boolean;
  currentTrack: Track | null;
  position: number;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'track' | 'playlist';
  queue: Track[];
}

export function IntegratedMusicPlayer({ connectedServices, currentUser }: IntegratedMusicPlayerProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTrack: null,
    position: 0,
    volume: 50,
    shuffle: false,
    repeat: 'off',
    queue: []
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeService, setActiveService] = useState<string | null>(null);
  
  const currentPlayerRef = useRef<any>(null);

  // Initialize active service
  useEffect(() => {
    const availableServices = Object.keys(connectedServices);
    if (availableServices.length > 0 && !activeService) {
      setActiveService(availableServices[0]);
      currentPlayerRef.current = connectedServices[availableServices[0]];
    }
  }, [connectedServices, activeService]);

  // Format time helper
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Search across connected services
  const searchMusic = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    const results: Track[] = [];

    try {
      // Search Spotify
      if (connectedServices.spotify) {
        try {
          const spotifyResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
            headers: {
              'Authorization': `Bearer ${await connectedServices.spotify.getOAuthToken()}`
            }
          });
          
          if (spotifyResponse.ok) {
            const data = await spotifyResponse.json();
            const spotifyTracks = data.tracks.items.map((track: any) => ({
              id: track.id,
              name: track.name,
              artist: track.artists[0].name,
              album: track.album.name,
              duration: track.duration_ms,
              image: track.album.images[0]?.url,
              url: track.external_urls.spotify,
              service: 'spotify' as const
            }));
            results.push(...spotifyTracks);
          }
        } catch (error) {
          console.error('Spotify search error:', error);
        }
      }

      // Search Apple Music
      if (connectedServices.appleMusic) {
        try {
          const appleResults = await connectedServices.appleMusic.api.search(query, {
            limit: 10,
            types: ['songs']
          });
          
          if (appleResults.songs) {
            const appleTracks = appleResults.songs.data.map((track: any) => ({
              id: track.id,
              name: track.attributes.name,
              artist: track.attributes.artistName,
              album: track.attributes.albumName,
              duration: track.attributes.durationInMillis,
              image: track.attributes.artwork?.url?.replace('{w}', '300').replace('{h}', '300'),
              url: track.attributes.url,
              service: 'appleMusic' as const
            }));
            results.push(...appleTracks);
          }
        } catch (error) {
          console.error('Apple Music search error:', error);
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [connectedServices]);

  // Play track
  const playTrack = useCallback(async (track: Track) => {
    try {
      if (track.service === 'spotify' && connectedServices.spotify) {
        await connectedServices.spotify.setQueue({
          uris: [`spotify:track:${track.id}`]
        });
        await connectedServices.spotify.play();
        currentPlayerRef.current = connectedServices.spotify;
      } else if (track.service === 'appleMusic' && connectedServices.appleMusic) {
        await connectedServices.appleMusic.setQueue({
          song: track.id
        });
        await connectedServices.appleMusic.play();
        currentPlayerRef.current = connectedServices.appleMusic;
      }

      setPlaybackState(prev => ({
        ...prev,
        currentTrack: track,
        isPlaying: true
      }));
      
      setActiveService(track.service);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }, [connectedServices]);

  // Playback controls
  const togglePlayback = useCallback(async () => {
    if (!currentPlayerRef.current) return;

    try {
      if (playbackState.isPlaying) {
        await currentPlayerRef.current.pause();
      } else {
        await currentPlayerRef.current.play();
      }
      
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: !prev.isPlaying
      }));
    } catch (error) {
      console.error('Playback toggle error:', error);
    }
  }, [playbackState.isPlaying]);

  const skipNext = useCallback(async () => {
    if (!currentPlayerRef.current) return;
    
    try {
      await currentPlayerRef.current.nextTrack();
    } catch (error) {
      console.error('Skip next error:', error);
    }
  }, []);

  const skipPrevious = useCallback(async () => {
    if (!currentPlayerRef.current) return;
    
    try {
      await currentPlayerRef.current.previousTrack();
    } catch (error) {
      console.error('Skip previous error:', error);
    }
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    if (!currentPlayerRef.current) return;
    
    try {
      await currentPlayerRef.current.setVolume(volume / 100);
      setPlaybackState(prev => ({ ...prev, volume }));
    } catch (error) {
      console.error('Volume error:', error);
    }
  }, []);

  // Service status
  const connectedServicesList = Object.keys(connectedServices);
  
  if (connectedServicesList.length === 0) {
    return (
      <Alert className="border-amber-500/30 bg-amber-500/10">
        <Music className="w-4 h-4 text-amber-400" />
        <AlertDescription className="text-amber-300">
          <div className="font-medium mb-1">No Streaming Services Connected</div>
          <p className="text-sm">Connect Spotify or Apple Music to enable streaming playback.</p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Service Switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-400">Active Service:</span>
        {connectedServicesList.map(service => (
          <Button
            key={service}
            variant={activeService === service ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveService(service);
              currentPlayerRef.current = connectedServices[service];
            }}
            className={activeService === service ? "bg-pink-500 hover:bg-pink-600" : ""}
          >
            {service === 'spotify' ? '🎵' : '🍎'} {service === 'spotify' ? 'Spotify' : 'Apple Music'}
          </Button>
        ))}
      </div>

      {/* Search Interface */}
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Music
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search songs, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchMusic(searchQuery)}
              className="bg-gray-700 border-gray-600 text-white"
              data-testid="input-music-search"
            />
            <Button 
              onClick={() => searchMusic(searchQuery)}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-pink-500 hover:bg-pink-600"
              data-testid="button-search-music"
            >
              {isSearching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((track, index) => (
                <div
                  key={`${track.service}-${track.id}-${index}`}
                  className="flex items-center gap-3 p-2 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer transition-colors"
                  onClick={() => playTrack(track)}
                  data-testid={`track-result-${index}`}
                >
                  {track.image && (
                    <img 
                      src={track.image} 
                      alt={track.album}
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{track.name}</div>
                    <div className="text-sm text-gray-400 truncate">{track.artist} • {track.album}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={track.service === 'spotify' ? 'border-green-500 text-green-400' : 'border-gray-500 text-gray-400'}>
                      {track.service === 'spotify' ? '🎵' : '🍎'}
                    </Badge>
                    <span className="text-xs text-gray-500">{formatTime(track.duration)}</span>
                    <Button size="sm" variant="ghost" className="text-white hover:bg-gray-600">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Now Playing */}
      {playbackState.currentTrack && (
        <Card className="bg-gray-800 border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {playbackState.currentTrack.image && (
                <img 
                  src={playbackState.currentTrack.image} 
                  alt={playbackState.currentTrack.album}
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{playbackState.currentTrack.name}</div>
                <div className="text-sm text-gray-400 truncate">{playbackState.currentTrack.artist}</div>
                <div className="text-xs text-gray-500 truncate">{playbackState.currentTrack.album}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={skipPrevious}
                  className="text-white hover:bg-gray-700"
                  data-testid="button-previous-track"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={togglePlayback}
                  className="text-white hover:bg-gray-700"
                  data-testid="button-toggle-playback"
                >
                  {playbackState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={skipNext}
                  className="text-white hover:bg-gray-700"
                  data-testid="button-next-track"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 min-w-32">
                {playbackState.volume > 0 ? <Volume2 className="w-4 h-4 text-gray-400" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                <Slider
                  value={[playbackState.volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  step={1}
                  className="w-20"
                  data-testid="slider-volume"
                />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500 w-12">{formatTime(playbackState.position)}</span>
              <div className="flex-1 bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-pink-500 h-1 rounded-full transition-all"
                  style={{ 
                    width: playbackState.currentTrack ? 
                      `${(playbackState.position / playbackState.currentTrack.duration) * 100}%` : '0%' 
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 w-12">
                {playbackState.currentTrack ? formatTime(playbackState.currentTrack.duration) : '0:00'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Status */}
      <Alert className="border-blue-500/30 bg-blue-500/10">
        <Music className="w-4 h-4 text-blue-400" />
        <AlertDescription className="text-blue-300">
          <div className="font-medium mb-1">Streaming Integration Active</div>
          <p className="text-sm">
            Connected to {connectedServicesList.join(' and ')}. Users can now stream music directly from their accounts without uploading files.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}