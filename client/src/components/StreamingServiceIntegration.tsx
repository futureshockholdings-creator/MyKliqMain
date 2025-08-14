import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Settings,
  Users,
  Crown
} from "lucide-react";

interface StreamingServiceIntegrationProps {
  onServiceConnect: (service: string, playerInstance: any) => void;
  onServiceDisconnect: (service: string) => void;
}

interface ServiceConfig {
  name: string;
  icon: string;
  color: string;
  requiresPremium: boolean;
  supported: boolean;
  setupUrl: string;
  description: string;
  features: string[];
  limitations: string[];
}

export function StreamingServiceIntegration({ 
  onServiceConnect, 
  onServiceDisconnect 
}: StreamingServiceIntegrationProps) {
  const [connectedServices, setConnectedServices] = useState<string[]>([]);
  const [spotifyPlayer, setSpotifyPlayer] = useState<any>(null);
  const [appleMusicPlayer, setAppleMusicPlayer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  // Service configurations
  const services: Record<string, ServiceConfig> = {
    spotify: {
      name: "Spotify",
      icon: "🎵",
      color: "bg-green-500",
      requiresPremium: true,
      supported: true,
      setupUrl: "https://developer.spotify.com/dashboard",
      description: "Stream music from your Spotify Premium account",
      features: [
        "Full song streaming in browser",
        "Access personal playlists and library",
        "Real-time playback control",
        "No uploads needed - stream directly"
      ],
      limitations: [
        "Requires Spotify Premium subscription",
        "Need developer app setup for API access",
        "Some content may be region-restricted"
      ]
    },
    appleMusic: {
      name: "Apple Music",
      icon: "🍎",
      color: "bg-gray-800",
      requiresPremium: true,
      supported: true,
      setupUrl: "https://developer.apple.com/musickit/",
      description: "Stream music from your Apple Music subscription",
      features: [
        "70M+ songs from Apple Music catalog",
        "Access personal library and playlists",
        "Works on all modern browsers",
        "High-quality streaming"
      ],
      limitations: [
        "Requires Apple Music subscription",
        "Need Apple Developer account ($99/year)",
        "Limited to Apple Music catalog"
      ]
    },
    youtubeMusic: {
      name: "YouTube Music",
      icon: "📺",
      color: "bg-red-500",
      requiresPremium: false,
      supported: false,
      setupUrl: "https://developers.google.com/youtube/v3",
      description: "No official API available",
      features: [
        "Large music catalog",
        "Free tier available",
        "Video content included"
      ],
      limitations: [
        "No official web streaming API",
        "Unofficial APIs violate Terms of Service",
        "Integration not recommended"
      ]
    }
  };

  // Initialize Spotify Web Playback SDK
  const initializeSpotify = useCallback(async (accessToken: string) => {
    setIsLoading("spotify");
    
    try {
      // Load Spotify SDK
      if (!window.Spotify) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://sdk.scdn.co/spotify-player.js";
          script.async = true;
          document.body.appendChild(script);
          
          window.onSpotifyWebPlaybackSDKReady = () => resolve(undefined);
        });
      }

      const player = new window.Spotify.Player({
        name: 'MyKliq Spotify Player',
        getOAuthToken: (cb: (token: string) => void) => { cb(accessToken); },
        volume: 0.5
      });

      // Set up event listeners
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify player ready with Device ID', device_id);
        setSpotifyPlayer(player);
        setConnectedServices(prev => [...prev.filter(s => s !== 'spotify'), 'spotify']);
        onServiceConnect('spotify', player);
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify device has gone offline', device_id);
      });

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Spotify initialization error:', message);
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Spotify authentication error:', message);
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Spotify account error:', message);
      });

      // Connect to the player
      await player.connect();
      
    } catch (error) {
      console.error('Failed to initialize Spotify:', error);
    } finally {
      setIsLoading(null);
    }
  }, [onServiceConnect]);

  // Initialize Apple Music MusicKit
  const initializeAppleMusic = useCallback(async (developerToken: string) => {
    setIsLoading("appleMusic");
    
    try {
      // Load MusicKit
      if (!window.MusicKit) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://js-cdn.music.apple.com/musickit/v1/musickit.js";
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      window.MusicKit.configure({
        developerToken: developerToken,
        app: {
          name: 'MyKliq',
          build: '1.0.0'
        }
      });

      const music = window.MusicKit.getInstance();
      
      // Authorize user
      await music.authorize();
      
      setAppleMusicPlayer(music);
      setConnectedServices(prev => [...prev.filter(s => s !== 'appleMusic'), 'appleMusic']);
      onServiceConnect('appleMusic', music);
      
    } catch (error) {
      console.error('Failed to initialize Apple Music:', error);
    } finally {
      setIsLoading(null);
    }
  }, [onServiceConnect]);

  // Disconnect services
  const disconnectService = (serviceKey: string) => {
    if (serviceKey === 'spotify' && spotifyPlayer) {
      spotifyPlayer.disconnect();
      setSpotifyPlayer(null);
    } else if (serviceKey === 'appleMusic' && appleMusicPlayer) {
      // Apple Music doesn't have explicit disconnect
      setAppleMusicPlayer(null);
    }
    
    setConnectedServices(prev => prev.filter(s => s !== serviceKey));
    onServiceDisconnect(serviceKey);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Streaming Service Integration</h2>
        <p className="text-gray-400">
          Connect your music streaming accounts to play music directly in MyKliq
        </p>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="services" className="text-white">
            <Music className="w-4 h-4 mr-2" />
            Services
          </TabsTrigger>
          <TabsTrigger value="setup" className="text-white">
            <Settings className="w-4 h-4 mr-2" />
            Setup Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          {Object.entries(services).map(([key, service]) => (
            <Card key={key} className="bg-gray-800 border-gray-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${service.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                      {service.icon}
                    </div>
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        {service.name}
                        {service.requiresPremium && (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                        {!service.supported && (
                          <Badge variant="destructive" className="bg-red-500/20 text-red-400">
                            Not Available
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-400">{service.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {connectedServices.includes(key) ? (
                      <>
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectService(key)}
                          className="border-red-500 text-red-400 hover:bg-red-500/20"
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        disabled={!service.supported || isLoading === key}
                        variant="outline"
                        size="sm"
                        className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                        onClick={() => {
                          if (key === 'spotify') {
                            // This would trigger OAuth flow in real implementation
                            const accessToken = prompt('Enter Spotify access token:');
                            if (accessToken) initializeSpotify(accessToken);
                          } else if (key === 'appleMusic') {
                            // This would use proper developer token in real implementation
                            const devToken = prompt('Enter Apple Music developer token:');
                            if (devToken) initializeAppleMusic(devToken);
                          }
                        }}
                      >
                        {isLoading === key ? 'Connecting...' : 'Connect'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Features:</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Limitations:</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {service.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Alert className="border-blue-500/30 bg-blue-500/10">
            <AlertTriangle className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              <div className="font-medium mb-2">Developer Setup Required</div>
              <p className="text-sm">
                To use streaming services, you'll need to create developer applications with each service.
                This enables secure API access to user accounts.
              </p>
            </AlertDescription>
          </Alert>

          {/* Spotify Setup Guide */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-sm">🎵</div>
                Spotify Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0">1</span>
                  <span>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Spotify Developer Dashboard</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0">2</span>
                  <span>Create a new app and select "Web Playback SDK"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0">3</span>
                  <span>Add your domain to redirect URIs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0">4</span>
                  <span>Implement OAuth flow to get user access tokens</span>
                </li>
              </ol>
              
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <Crown className="w-4 h-4 text-yellow-400" />
                <AlertDescription className="text-yellow-300">
                  <strong>Important:</strong> Users must have Spotify Premium to use the Web Playback SDK.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Apple Music Setup Guide */}
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center text-sm">🍎</div>
                Apple Music Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0">1</span>
                  <span>Sign up for <a href="https://developer.apple.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Apple Developer Program</a> ($99/year)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0">2</span>
                  <span>Create MusicKit Identifier in your developer account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0">3</span>
                  <span>Generate private key (.p8 file) for JWT signing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0">4</span>
                  <span>Create server endpoint to generate developer tokens</span>
                </li>
              </ol>
              
              <Alert className="border-blue-500/30 bg-blue-500/10">
                <AlertTriangle className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  <strong>Note:</strong> Apple Music integration requires server-side token generation for security.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connected Services Status */}
      {connectedServices.length > 0 && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {connectedServices.map(serviceKey => (
                <Badge key={serviceKey} className="bg-green-500/20 text-green-400">
                  {services[serviceKey].icon} {services[serviceKey].name}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-green-300 mt-2">
              Users can now stream music directly from their connected accounts!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Global type declarations
declare global {
  interface Window {
    Spotify: any;
    MusicKit: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}