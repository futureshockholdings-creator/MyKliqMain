import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileMusicPlayer } from "@/components/ProfileMusicPlayer";
import { CalendarDays, Music, User as UserIcon, MessageCircle, ArrowLeft, Video, Heart, MessageSquare } from "lucide-react";
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

  const { data: profileUser, isLoading } = useQuery<ProfileUser>({
    queryKey: ["/api/user/profile", userId],
    enabled: !!userId,
  });

  const { data: userPosts = [] } = useQuery<Post[]>({
    queryKey: ["/api/posts/user", userId],
    queryFn: () => apiRequest("GET", `/api/posts/user/${userId}`),
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
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <UserIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-600 mb-2">User not found</h2>
            <p className="text-gray-500">The profile you're looking for doesn't exist.</p>
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

  const getBackgroundStyle = () => {
    if (!theme) {
      return { background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)` };
    }
    
    switch (theme.backgroundType) {
      case 'gradient':
        return { 
          background: `linear-gradient(135deg, ${theme.backgroundGradientStart || primaryColor}40, ${theme.backgroundGradientEnd || secondaryColor}40)` 
        };
      case 'solid':
        return { backgroundColor: `${theme.backgroundColor || '#000000'}40` };
      default:
        return { background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}40)` };
    }
  };

  const fontFamilyClass = theme?.fontFamily === 'comic' 
    ? 'font-comic' 
    : theme?.fontFamily === 'serif' 
    ? 'font-serif' 
    : 'font-sans';

  return (
    <div className={`container mx-auto p-4 max-w-2xl pb-24 ${fontFamilyClass}`}>
      <div className="space-y-6">
        <Link to="/kliq">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Kliq
          </Button>
        </Link>

        <Card style={getBackgroundStyle()} className="border-2" 
          {...(primaryColor && { style: { ...getBackgroundStyle(), borderColor: primaryColor } })}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4" style={{ borderColor: primaryColor }}>
                  <AvatarImage 
                    src={profileUser.profileImageUrl ? resolveAssetUrl(profileUser.profileImageUrl) : undefined} 
                    alt={`${displayName}'s avatar`} 
                  />
                  <AvatarFallback className="text-3xl" style={{ backgroundColor: primaryColor, color: 'white' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{displayName}</h1>
                  {profileUser.kliqName && (
                    <Badge className="mt-1 text-white" style={{ backgroundColor: primaryColor }}>
                      {profileUser.kliqName}
                    </Badge>
                  )}
                </div>
                
                {profileUser.bio && (
                  <p className="text-foreground/80">{translatePost(profileUser.bio)}</p>
                )}
                
                {profileUser.birthdate && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4 mr-1" />
                    Birthday: {new Date(profileUser.birthdate).toLocaleDateString()}
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-3">
                  <Link to={`/messages/${profileUser.id}`}>
                    <Button variant="outline" size="sm" className="gap-2" 
                      style={{ borderColor: primaryColor, color: primaryColor }}>
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>
                  </Link>
                  {currentUser && currentUser.id !== profileUser.id && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      style={{ borderColor: secondaryColor, color: secondaryColor }}
                      onClick={handleVideoCall}
                    >
                      <Video className="w-4 h-4" />
                      Video Call
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {profileUser.profileMusicUrls && profileUser.profileMusicUrls.length > 0 && 
         profileUser.profileMusicTitles && profileUser.profileMusicTitles.length > 0 && (
          <Card className="border" style={{ borderColor: `${primaryColor}40` }}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Music className="w-5 h-5" style={{ color: primaryColor }} />
                <CardTitle className="text-card-foreground">Profile Music</CardTitle>
              </div>
              <CardDescription>
                {displayName}'s profile music
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileMusicPlayer
                musicUrl={profileUser.profileMusicUrls[0]}
                musicTitle={profileUser.profileMusicTitles[0]}
                autoPlay={true}
              />
            </CardContent>
          </Card>
        )}

        <Card className="border" style={{ borderColor: `${primaryColor}40` }}>
          <CardHeader>
            <CardTitle style={{ color: primaryColor }}>About {displayName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {profileUser.kliqName || "My Kliq"}
                </div>
                <div className="text-sm text-muted-foreground">Kliq Name</div>
              </div>
              
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${secondaryColor}15` }}>
                <div className="text-2xl font-bold" style={{ color: secondaryColor }}>
                  {profileUser.createdAt ? new Date(profileUser.createdAt).getFullYear() : "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">Joined MyKliq</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {userPosts.length > 0 && (
          <Card className="border" style={{ borderColor: `${primaryColor}40` }}>
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
