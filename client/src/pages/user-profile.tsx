import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileMusicPlayer } from "@/components/ProfileMusicPlayer";
import { CalendarDays, Music, User as UserIcon } from "lucide-react";
import { type User } from "@shared/schema";
import { usePostTranslation } from "@/lib/translationService";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { translatePost } = usePostTranslation();

  const { data: profileUser, isLoading } = useQuery<User>({
    queryKey: ["/api/user/profile", userId],
    enabled: !!userId,
  });

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

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-pink-500/20 to-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage 
                  src={profileUser.profileImageUrl} 
                  alt={`${displayName}'s avatar`} 
                />
                <AvatarFallback className="text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                  {profileUser.kliqName && (
                    <Badge variant="secondary" className="mt-1 bg-pink-500 text-white">
                      {profileUser.kliqName}
                    </Badge>
                  )}
                </div>
                
                {profileUser.bio && (
                  <p className="text-pink-100">{translatePost(profileUser.bio)}</p>
                )}
                
                {profileUser.birthdate && (
                  <div className="flex items-center text-pink-200 text-sm">
                    <CalendarDays className="w-4 h-4 mr-1" />
                    Birthday: {new Date(profileUser.birthdate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Music */}
        {profileUser.profileMusicUrl && profileUser.profileMusicTitle && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Music className="w-5 h-5 text-pink-400" />
                <CardTitle className="text-card-foreground">Profile Music</CardTitle>
              </div>
              <CardDescription>
                {displayName}'s profile music will auto-play when you visit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileMusicPlayer
                musicUrl={profileUser.profileMusicUrl}
                musicTitle={profileUser.profileMusicTitle}
                autoPlay={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Profile Stats/Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-pink-500">
                  {profileUser.kliqName || "My Kliq"}
                </div>
                <div className="text-sm text-gray-600">Kliq Name</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-500">
                  {profileUser.createdAt ? new Date(profileUser.createdAt).getFullYear() : "N/A"}
                </div>
                <div className="text-sm text-gray-600">Joined MyKliq</div>
              </div>
            </div>
            
            {profileUser.email && (
              <div className="text-center text-gray-600">
                <span className="text-sm">Contact: {profileUser.email}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}