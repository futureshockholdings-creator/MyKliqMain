import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Edit, RefreshCw, MessageSquare, Smartphone, Camera } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    bio: "",
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userData = user as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize profile state when user data loads
  useState(() => {
    if (user) {
      setProfile({
        firstName: userData?.firstName || "",
        lastName: userData?.lastName || "",
        bio: userData?.bio || "",
      });
    }
  });

  // Fetch user stats (mocked for now)
  const stats = {
    posts: 127,
    friends: 12,
    likes: 1200
  };

  // Profile picture upload handlers
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleProfilePictureComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const profileImageURL = uploadedFile.uploadURL;
      
      try {
        // Update profile with new image URL
        await apiRequest("PUT", "/api/user/profile-picture", {
          profileImageURL: profileImageURL,
        });
        
        // Refresh user data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        toast({
          title: "Profile picture updated!",
          description: "Your new profile picture has been saved",
        });
      } catch (error) {
        if (isUnauthorizedError(error as Error)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
          return;
        }
        toast({
          title: "Error",
          description: "Failed to update profile picture",
          variant: "destructive",
        });
      }
    }
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Generate new invite code
  const generateInviteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/generate-invite");
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "New invite code generated!",
        description: `Your new code: ${data.inviteCode}`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate new invite code",
        variant: "destructive",
      });
    },
  });

  // Send SMS invite (mocked)
  const sendSMSMutation = useMutation({
    mutationFn: async (phone: string) => {
      await apiRequest("POST", "/api/auth/send-verification", { phoneNumber: phone });
    },
    onSuccess: () => {
      toast({
        title: "Invite sent!",
        description: `SMS invitation sent to ${phoneNumber}`,
      });
      setPhoneNumber("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send SMS invite",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profile);
  };

  const handleGenerateCode = () => {
    generateInviteMutation.mutate();
  };

  const handleSendSMS = () => {
    if (phoneNumber.trim()) {
      sendSMSMutation.mutate(phoneNumber.trim());
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-pink-500/30" id="profile-section">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-24 h-24 border-4 border-pink-400">
                <AvatarImage src={userData?.profileImageUrl} />
                <AvatarFallback className="bg-gray-700 text-white text-2xl">
                  {userData?.firstName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleProfilePictureComplete}
                buttonClassName="absolute -bottom-1 -right-1 p-2 rounded-full bg-pink-600 hover:bg-pink-700 text-white shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </ObjectUploader>
            </div>
            
            {isEditing ? (
              <div className="space-y-3 max-w-sm mx-auto">
                <div className="flex gap-2">
                  <Input
                    value={profile.firstName}
                    onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First name"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    value={profile.lastName}
                    onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last name"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-pink-400">
                    {userData?.firstName} {userData?.lastName}
                  </h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-gray-400 text-sm">
                  {userData?.bio || "Living my best life! ✨"}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-pink-400">{stats.posts}</div>
            <div className="text-sm text-pink-200">Posts</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500/20 to-green-500/20 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.friends}</div>
            <div className="text-sm text-blue-200">Kliq Size</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{(stats.likes / 1000).toFixed(1)}k</div>
            <div className="text-sm text-orange-200">Total Likes</div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Friends */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            📱 Invite Friends to Your Kliq
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite Code */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Your invitation code:</span>
              <Button
                size="sm"
                onClick={handleGenerateCode}
                disabled={generateInviteMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {generateInviteMutation.isPending ? "..." : "New Code"}
              </Button>
            </div>
            <div className="flex items-center justify-between bg-black rounded px-3 py-2">
              <code className="text-green-400 font-mono font-bold">
                {userData?.inviteCode || "Loading..."}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(userData?.inviteCode || "")}
                className="text-blue-400 hover:bg-blue-400/10"
              >
                Copy
              </Button>
            </div>
          </div>

          {/* SMS Invite */}
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Friend's phone number</label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Button
              onClick={handleSendSMS}
              disabled={!phoneNumber.trim() || sendSMSMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {sendSMSMutation.isPending ? "Sending..." : "Send SMS Invite"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-purple-400">🎨 Quick Customization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="bg-pink-500 hover:bg-pink-600 text-white"
              onClick={() => setLocation('/themes')}
              data-testid="button-edit-theme"
            >
              Edit Theme
            </Button>
            <Button 
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Banner customization will be available in the next update!",
                });
              }}
              data-testid="button-change-banner"
            >
              Change Banner
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-black"
              onClick={() => {
                const profileSection = document.getElementById('profile-section');
                profileSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              data-testid="button-edit-profile"
            >
              Edit Profile
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => setLocation('/kliq')}
              data-testid="button-manage-filters"
            >
              Manage Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <Button
            onClick={() => window.location.href = "/api/logout"}
            variant="outline"
            className="w-full border-red-500 text-red-400 hover:bg-red-500/10"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
