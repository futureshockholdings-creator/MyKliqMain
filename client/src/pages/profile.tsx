import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

import { ProfileSettings } from "@/components/ProfileSettings";
import { ProfileDetailsDisplay } from "@/components/ProfileDetailsDisplay";
import { MusicUploader } from "@/components/MusicUploader";
import { ProfileMusicPlayer } from "@/components/ProfileMusicPlayer";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import Footer from "@/components/Footer";



import { type User } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();





  // Query for birthday users today
  const { data: birthdayUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/birthdays/today"],
  });

  const sendBirthdayMessageMutation = useMutation({
    mutationFn: async ({ birthdayUserId, message }: { birthdayUserId: string, message: string }) => {
      return await apiRequest("POST", "/api/birthdays/send-message", { birthdayUserId, message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Success",
        description: "Birthday message sent!",
      });
    },
    onError: (error) => {
      const errorMessage = error.message.includes("already sent") 
        ? "You've already sent a birthday message this year"
        : "Failed to send birthday message";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Profile picture upload handlers
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const updateProfilePictureMutation = useMutation({
    mutationFn: async (profileImageURL: string) => {
      await apiRequest("PUT", "/api/user/profile-picture", { profileImageURL: profileImageURL });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
    },
  });

  const handleProfilePictureComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      updateProfilePictureMutation.mutate(uploadURL);
    }
  };

  // Background image upload handlers
  const handleBackgroundGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const updateBackgroundMutation = useMutation({
    mutationFn: async (backgroundUrl: string) => {
      return await apiRequest("PATCH", "/api/user/background", { backgroundImageUrl: backgroundUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Background image updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Background update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update background image",
        variant: "destructive",
      });
    },
  });

  const handleBackgroundComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      updateBackgroundMutation.mutate(uploadURL);
    }
  };



  if (!user) {
    return <div>Loading...</div>;
  }

  const typedUser = user as User;
  


  return (
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Profile Picture & Background Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture & Background</CardTitle>
            <CardDescription>Upload and manage your profile picture and background wallpaper</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: typedUser.backgroundImageUrl 
                  ? `url("${typedUser.backgroundImageUrl}")` 
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Background overlay for better text readability */}
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* Profile Avatar positioned on the right */}
              <div className="absolute bottom-4 right-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage 
                      src={typedUser.profileImageUrl} 
                      alt="Profile picture" 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-white text-primary text-2xl">
                      {typedUser.firstName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Camera Icon for Profile Picture */}
                  <div className="absolute -bottom-1 -right-1">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB limit for profile pictures
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleProfilePictureComplete}
                      buttonClassName="!p-2 !rounded-full !bg-primary !text-white hover:!bg-primary/90 !border-2 !border-white !shadow-lg"
                      allowedFileTypes={[
                        'image/jpeg',
                        'image/jpg', 
                        'image/png',
                        'image/gif',
                        'image/webp',
                        'image/bmp',
                        'image/tiff',
                        'image/tif',
                        'image/svg+xml',
                        'image/avif',
                        'image/heic',
                        'image/heif'
                      ]}
                    >
                      <Camera className="w-4 h-4" />
                    </ObjectUploader>
                  </div>
                </div>
              </div>
              
              {/* Camera Icon for Background Wallpaper */}
              <div className="absolute top-4 right-4">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={15728640} // 15MB limit for background images
                  onGetUploadParameters={handleBackgroundGetUploadParameters}
                  onComplete={handleBackgroundComplete}
                  buttonClassName="!p-3 !rounded-full !bg-white/90 !text-primary hover:!bg-white !border-2 !border-primary/20 !shadow-lg backdrop-blur-sm"
                  allowedFileTypes={[
                    'image/jpeg',
                    'image/jpg', 
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'image/bmp',
                    'image/tiff',
                    'image/tif',
                    'image/svg+xml',
                    'image/avif',
                    'image/heic',
                    'image/heif'
                  ]}
                >
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:block">Background</span>
                  </div>
                </ObjectUploader>
              </div>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-muted-foreground text-right">
                Click the camera icons to upload your profile picture (5MB max) or background wallpaper (15MB max)
              </p>
              <p className="text-xs text-muted-foreground text-right mt-1">
                Supported formats: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG, AVIF, HEIC/HEIF
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings & Details Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <ProfileSettings user={typedUser} />
            </div>
            <CardDescription>Your personal details, interests, and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileDetailsDisplay user={typedUser} />
          </CardContent>
        </Card>



        {birthdayUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>🎉 Birthdays Today!</CardTitle>
              <CardDescription>Send birthday wishes to your kliq members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {birthdayUsers.map((birthdayUser: User) => {
                  if (birthdayUser.id === typedUser.id) return null; // Don't show own birthday
                  
                  return (
                    <div key={birthdayUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {birthdayUser.profileImageUrl && (
                          <img 
                            src={birthdayUser.profileImageUrl} 
                            alt={`${birthdayUser.firstName}'s avatar`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{birthdayUser.firstName} {birthdayUser.lastName}</div>
                          <div className="text-sm text-muted-foreground">It's their birthday! 🎂</div>
                        </div>
                      </div>
                      <Button
                        onClick={() => sendBirthdayMessageMutation.mutate({ 
                          birthdayUserId: birthdayUser.id, 
                          message: "Hope you have the best day ever! 🎉"
                        })}
                        disabled={sendBirthdayMessageMutation.isPending}
                        size="sm"
                        data-testid={`button-birthday-${birthdayUser.id}`}
                      >
                        {sendBirthdayMessageMutation.isPending ? "Sending..." : "Send Birthday Wish"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Music Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary">🎵 Profile Music</CardTitle>
            <CardDescription className="text-muted-foreground">Add music that plays when people visit your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Profile Music Player (if music exists) */}
            {(user as User)?.profileMusicUrls && (user as User)?.profileMusicUrls?.length > 0 && (user as User)?.profileMusicTitles && (
              <div>
                <Label className="text-sm font-medium text-foreground">Current Profile Music</Label>
                <div className="mt-2">
                  <ProfileMusicPlayer
                    musicUrls={(user as User).profileMusicUrls!}
                    musicTitles={(user as User).profileMusicTitles!}
                    autoPlay={true}
                  />
                </div>
              </div>
            )}
            
            {/* Music Upload/Management */}
            <div>
              <Label className="text-sm font-medium text-foreground">Profile Music Settings</Label>
              <div className="mt-2">
                <MusicUploader
                  currentMusicUrls={(user as User)?.profileMusicUrls || []}
                  currentMusicTitles={(user as User)?.profileMusicTitles || []}
                  userId={(user as User)?.id!}
                />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
      
      <Footer />
    </div>
  );
}