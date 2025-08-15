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
      return await apiRequest("/api/birthdays/send-message", "POST", { birthdayUserId, message });
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
      await apiRequest("PUT", "/api/user/profile-picture", { profileImageURL });
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



  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="space-y-6">
        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload and manage your profile picture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary">
                  <AvatarImage 
                    src={user.profileImageUrl} 
                    alt="Profile picture" 
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-muted text-foreground text-2xl">
                    {user.firstName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880} // 5MB limit for profile pictures
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleProfilePictureComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Camera className="w-4 h-4" />
                    <span>
                      {user.profileImageUrl ? "Change Profile Picture" : "Upload Profile Picture"}
                    </span>
                  </div>
                </ObjectUploader>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload a profile picture (max 5MB). Recommended size: 400x400px
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings & Details Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <ProfileSettings user={user} />
            </div>
            <CardDescription>Your personal details, interests, and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileDetailsDisplay user={user} />
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
                  if (birthdayUser.id === (user as User)?.id) return null; // Don't show own birthday
                  
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
            {(user as User)?.profileMusicUrl && (user as User)?.profileMusicTitle && (
              <div>
                <Label className="text-sm font-medium text-foreground">Current Profile Music</Label>
                <div className="mt-2">
                  <ProfileMusicPlayer
                    musicUrl={(user as User).profileMusicUrl!}
                    musicTitle={(user as User).profileMusicTitle!}
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
                  currentMusicUrl={(user as User)?.profileMusicUrl || undefined}
                  currentMusicTitle={(user as User)?.profileMusicTitle || undefined}
                  userId={(user as User)?.id!}
                />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}