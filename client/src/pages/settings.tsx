import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { PushNotificationSetup } from "@/components/PushNotificationSetup";
import { LanguageSelector } from "@/components/LanguageSelector";

import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Twitch,
  MessageCircle,
  Trash2,
  RefreshCw,
  ExternalLink,
  Link2,
  LogOut,
  User,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

const platformInfo = {
  instagram: {
    name: "Instagram",
    icon: Instagram,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    description: "Share your photos and stories"
  },
  tiktok: {
    name: "TikTok",
    icon: MessageCircle,
    color: "bg-black",
    description: "Short-form video content"
  },
  twitch: {
    name: "Twitch",
    icon: Twitch,
    color: "bg-purple-600",
    description: "Live streaming and gaming"
  },
  discord: {
    name: "Discord",
    icon: MessageCircle,
    color: "bg-indigo-600",
    description: "Gaming communities and chat"
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    color: "bg-red-600",
    description: "Video content and subscriptions"
  },
  reddit: {
    name: "Reddit",
    icon: MessageCircle,
    color: "bg-orange-600",
    description: "Communities and discussions"
  }
};

export default function Settings() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();


  const handleLogout = () => {
    window.location.href = '/api/logout';
  };


  // Fetch connected social accounts
  const { data: socialAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/social/accounts"],
  });

  // Connect social account mutation
  const connectAccount = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest("GET", `/api/oauth/authorize/${platform}`);
      return response;
    },
    onSuccess: (data) => {
      if (data.demo) {
        // Demo mode - show success message and refresh accounts
        toast({
          title: "Demo Connection Successful",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
      } else {
        // Real OAuth - open popup window
        window.open(data.authUrl, '_blank', 'width=600,height=700');
        
        // Listen for successful connection
        const checkConnection = () => {
          queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
        };
        
        // Check every 2 seconds for updates
        const interval = setInterval(checkConnection, 2000);
        
        // Clear interval after 2 minutes
        setTimeout(() => clearInterval(interval), 120000);
      }
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: "Failed to start OAuth flow. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove social account mutation
  const removeAccount = useMutation({
    mutationFn: async (accountId: string) => {
      return await apiRequest("DELETE", `/api/social/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
      toast({
        title: "Account Removed",
        description: "Social media account has been disconnected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync account mutation
  const syncAccount = useMutation({
    mutationFn: async (platform: string) => {
      return await apiRequest("POST", `/api/social/sync/${platform}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
      toast({
        title: "Sync Started",
        description: "Content sync has been initiated.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getConnectedPlatforms = () => {
    return (socialAccounts as SocialAccount[]).map((account: SocialAccount) => account.platform);
  };

  const getAvailablePlatforms = () => {
    const connected = getConnectedPlatforms();
    return Object.keys(platformInfo).filter(platform => !connected.includes(platform));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-purple-200">Manage your preferences and connected accounts</p>
        </div>

        <div className="space-y-6">

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Social Media Integration
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Connect your social media accounts to aggregate content in MyKliq
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connected Accounts */}
                {(socialAccounts as SocialAccount[]).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Connected Accounts</h3>
                    <div className="grid gap-4">
                      {(socialAccounts as SocialAccount[]).map((account: SocialAccount) => {
                        const platform = platformInfo[account.platform as keyof typeof platformInfo];
                        const Icon = platform?.icon || MessageCircle;
                        
                        return (
                          <div 
                            key={account.id}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${platform?.color || 'bg-gray-600'}`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{platform?.name || account.platform}</h4>
                                <p className="text-purple-200 text-sm">@{account.username}</p>
                                {account.lastSyncAt && (
                                  <p className="text-purple-300 text-xs">
                                    Last sync: {new Date(account.lastSyncAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <Badge variant={account.isActive ? "default" : "secondary"}>
                                {account.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => syncAccount.mutate(account.platform)}
                                disabled={syncAccount.isPending}
                                className="border-white/20 text-white hover:bg-white/10"
                                data-testid={`button-sync-${account.platform}`}
                              >
                                <RefreshCw className={`w-4 h-4 ${syncAccount.isPending ? 'animate-spin' : ''}`} />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeAccount.mutate(account.id)}
                                disabled={removeAccount.isPending}
                                data-testid={`button-remove-${account.platform}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Available Platforms */}
                {getAvailablePlatforms().length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Connect New Platform</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {getAvailablePlatforms().map((platformKey) => {
                        const platform = platformInfo[platformKey as keyof typeof platformInfo];
                        const Icon = platform?.icon || MessageCircle;
                        
                        return (
                          <div 
                            key={platformKey}
                            className="p-4 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${platform?.color || 'bg-gray-600'}`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{platform?.name || platformKey}</h4>
                                <p className="text-purple-200 text-sm">{platform?.description}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => connectAccount.mutate(platformKey)}
                              disabled={connectAccount.isPending}
                              className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
                              data-testid={`button-connect-${platformKey}`}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Connect Account
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(socialAccounts as SocialAccount[]).length === 0 && !accountsLoading && (
                  <div className="text-center py-8">
                    <p className="text-purple-200 mb-4">No social accounts connected yet</p>
                    <p className="text-purple-300 text-sm">
                      Connect your social media accounts to see all your content in one place
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Push Notification Setup */}
            <PushNotificationSetup 
              darkStyle={true}
              compact={false}
            />

            {/* Language Settings */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">🌍 Language Settings</CardTitle>
                <CardDescription className="text-purple-200">Choose your preferred language for the interface</CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageSelector 
                  variant="select" 
                  showFlag={true} 
                  className="w-full"
                />
              </CardContent>
            </Card>


            {/* Account Management */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Management
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Manage your account settings and session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}