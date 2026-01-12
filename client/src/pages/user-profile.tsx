import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileMusicPlayer } from "@/components/ProfileMusicPlayer";
import { ProfileDetailsDisplay } from "@/components/ProfileDetailsDisplay";
import { 
  CalendarDays, Music, User as UserIcon, MessageCircle, ArrowLeft, Video, 
  Heart, MessageSquare, Users, Flame, FileText 
} from "lucide-react";
import { usePostTranslation } from "@/lib/translationService";
import { Button } from "@/components/ui/button";
import { useVideoCall } from "@/contexts/VideoCallContext";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { resolveAssetUrl } from "@/lib/apiConfig";

interface ProfileTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  backgroundType: string;
  backgroundColor: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  backgroundPattern: string;
}

interface ProfileUser {
  id: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  backgroundImageUrl?: string;
  bio?: string;
  kliqName?: string;
  birthdate?: string;
  profileMusicUrls?: string[];
  profileMusicTitles?: string[];
  createdAt?: string;
  equippedBorderId?: string;
  loginStreak?: number;
  friendCount?: number;
  postCount?: number;
  interests?: string[];
  hobbies?: string[];
  favoriteLocations?: string[];
  favoriteFoods?: string[];
  musicGenres?: string[];
  favoriteMovies?: string[];
  favoriteBooks?: string[];
  relationshipStatus?: string;
  petPreferences?: string;
  lifestyle?: string;
  theme?: ProfileTheme | null;
}

interface Post {
  id: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { translatePost } = usePostTranslation();
  const { initiateCall } = useVideoCall();
  const { user: currentUser } = useAuth();

  const { data: profileUser, isLoading, error } = useQuery<ProfileUser>({
    queryKey: ["/api/user/profile", userId],
    queryFn: async () => {
      console.log("[UserProfile] Fetching profile for userId:", userId);
      const result = await apiRequest("GET", `/api/user/profile/${userId}`);
      console.log("[UserProfile] Profile data received:", result);
      return result;
    },
    enabled: !!userId,
  });

  if (error) {
    console.error("[UserProfile] Error fetching profile:", error);
  }

  const { data: userPosts = [] } = useQuery<Post[]>({
    queryKey: ["/api/posts/user", userId],
    queryFn: async () => {
      try {
        const result = await apiRequest("GET", `/api/posts/user/${userId}`);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error("Failed to fetch user posts:", error);
        return [];
      }
    },
    enabled: !!userId,
  });

  const handleVideoCall = async () => {
    if (!profileUser) return;
    const friendName = profileUser.firstName && profileUser.lastName 
      ? `${profileUser.firstName} ${profileUser.lastName}`
      : profileUser.firstName || "Friend";
    const friendAvatar = profileUser.profileImageUrl;
    
    try {
      await initiateCall(profileUser.id, friendName, friendAvatar);
    } catch (error: any) {
      console.error("Failed to initiate video call:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <UserIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-600 mb-2">User not found</h2>
            <p className="text-gray-500">The profile you're looking for doesn't exist.</p>
            <Link to="/kliq">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Kliq
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profileUser.firstName && profileUser.lastName 
    ? `${profileUser.firstName} ${profileUser.lastName}`
    : profileUser.firstName || "Anonymous User";

  const theme = profileUser.theme;
  const primaryColor = theme?.primaryColor || "#FF1493";
  const secondaryColor = theme?.secondaryColor || "#00BFFF";
  
  const resolvedBackgroundUrl = resolveAssetUrl(profileUser.backgroundImageUrl);
  const resolvedProfileUrl = resolveAssetUrl(profileUser.profileImageUrl);

  const getBackgroundStyle = () => {
    if (resolvedBackgroundUrl) {
      return {
        backgroundImage: `url("${resolvedBackgroundUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    if (!theme) {
      return { background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)` };
    }
    
    switch (theme.backgroundType) {
      case 'gradient':
        return { 
          background: `linear-gradient(135deg, ${theme.backgroundGradientStart || primaryColor}, ${theme.backgroundGradientEnd || secondaryColor})` 
        };
      case 'solid':
        return { backgroundColor: theme.backgroundColor || '#000000' };
      default:
        return { background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)` };
    }
  };

  const fontFamilyClass = theme?.fontFamily === 'comic' 
    ? 'font-comic' 
    : theme?.fontFamily === 'serif' 
    ? 'font-serif' 
    : 'font-sans';

  const joinYear = profileUser.createdAt ? new Date(profileUser.createdAt).getFullYear() : null;

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 md:p-6 pb-24 ${fontFamilyClass}`}>
      <div className="space-y-4 md:space-y-6">
        <Link to="/kliq">
          <Button variant="ghost" size="sm" className="gap-2 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Kliq
          </Button>
        </Link>

        {/* Hero Section with Background Image */}
        <Card className="overflow-hidden">
          <div 
            className="relative h-48 md:h-56"
            style={getBackgroundStyle()}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            
            {/* Profile Avatar */}
            <div className="absolute bottom-4 left-4">
              <Avatar 
                className="w-24 h-24 md:w-28 md:h-28 border-4 shadow-lg"
                style={{ borderColor: primaryColor }}
              >
                <AvatarImage 
                  src={resolvedProfileUrl} 
                  alt={`${displayName}'s avatar`}
                  className="object-cover"
                />
                <AvatarFallback 
                  className="text-3xl text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Name and Kliq Badge */}
            <div className="absolute bottom-4 left-36 md:left-40">
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                {displayName}
              </h1>
              {profileUser.kliqName && (
                <Badge 
                  className="mt-1 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {profileUser.kliqName}
                </Badge>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Link to={`/messages/${profileUser.id}`}>
                <Button 
                  size="sm" 
                  className="gap-2 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
              </Link>
              {currentUser && currentUser.id !== profileUser.id && (
                <Button 
                  size="sm" 
                  className="gap-2 text-white"
                  style={{ backgroundColor: secondaryColor }}
                  onClick={handleVideoCall}
                >
                  <Video className="w-4 h-4" />
                  Call
                </Button>
              )}
            </div>
          </div>
          
          {/* Bio Section */}
          {profileUser.bio && (
            <CardContent className="pt-4">
              <p className="text-foreground">{translatePost(profileUser.bio)}</p>
            </CardContent>
          )}
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="text-center p-4" style={{ borderColor: `${primaryColor}40` }}>
            <Users className="w-6 h-6 mx-auto mb-2" style={{ color: primaryColor }} />
            <div className="text-2xl font-bold" style={{ color: primaryColor }}>
              {profileUser.friendCount || 0}
            </div>
            <div className="text-sm text-muted-foreground">Friends</div>
          </Card>
          
          <Card className="text-center p-4" style={{ borderColor: `${secondaryColor}40` }}>
            <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: secondaryColor }} />
            <div className="text-2xl font-bold" style={{ color: secondaryColor }}>
              {profileUser.postCount || 0}
            </div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </Card>
          
          <Card className="text-center p-4" style={{ borderColor: `${primaryColor}40` }}>
            <Flame className="w-6 h-6 mx-auto mb-2" style={{ color: primaryColor }} />
            <div className="text-2xl font-bold" style={{ color: primaryColor }}>
              {profileUser.loginStreak || 0}
            </div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </Card>
          
          <Card className="text-center p-4" style={{ borderColor: `${secondaryColor}40` }}>
            <CalendarDays className="w-6 h-6 mx-auto mb-2" style={{ color: secondaryColor }} />
            <div className="text-2xl font-bold" style={{ color: secondaryColor }}>
              {joinYear || "N/A"}
            </div>
            <div className="text-sm text-muted-foreground">Joined</div>
          </Card>
        </div>

        {/* Profile Music */}
        {profileUser.profileMusicUrls && Array.isArray(profileUser.profileMusicUrls) && profileUser.profileMusicUrls.length > 0 && 
         profileUser.profileMusicTitles && Array.isArray(profileUser.profileMusicTitles) && profileUser.profileMusicTitles.length > 0 && (
          <Card style={{ borderColor: `${primaryColor}40` }}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Music className="w-5 h-5" style={{ color: primaryColor }} />
                <CardTitle className="text-card-foreground">Profile Music</CardTitle>
              </div>
              <CardDescription>{displayName}'s vibe</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileMusicPlayer
                musicUrls={profileUser.profileMusicUrls}
                musicTitles={profileUser.profileMusicTitles}
                autoPlay={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Profile Details (Interests, Hobbies, etc.) */}
        <Card style={{ borderColor: `${primaryColor}40` }}>
          <CardHeader>
            <CardTitle style={{ color: primaryColor }}>About {displayName}</CardTitle>
            <CardDescription>Interests, hobbies, and favorites</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileDetailsDisplay user={profileUser} />
          </CardContent>
        </Card>

        {/* Birthday */}
        {profileUser.birthdate && (
          <Card style={{ borderColor: `${secondaryColor}40` }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5" style={{ color: secondaryColor }} />
                <div>
                  <div className="font-medium">Birthday</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(profileUser.birthdate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Posts */}
        {Array.isArray(userPosts) && userPosts.length > 0 && (
          <Card style={{ borderColor: `${primaryColor}40` }}>
            <CardHeader>
              <CardTitle style={{ color: primaryColor }}>Recent Posts</CardTitle>
              <CardDescription>{displayName}'s latest activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userPosts.slice(0, 5).map((post) => (
                <div 
                  key={post.id} 
                  className="p-4 rounded-lg border"
                  style={{ borderColor: `${primaryColor}30` }}
                >
                  <p className="text-foreground mb-2">{translatePost(post.content)}</p>
                  {post.mediaUrl && (
                    <img 
                      src={resolveAssetUrl(post.mediaUrl)} 
                      alt="Post media" 
                      className="rounded-lg max-h-48 object-cover mb-2"
                    />
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" /> {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" /> {post.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
