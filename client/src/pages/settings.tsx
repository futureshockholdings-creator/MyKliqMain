import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
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
  AlertTriangle,
  Facebook as FacebookIcon,
  Trophy,
} from "lucide-react";
import { SiPinterest } from "react-icons/si";
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
    description: "Business & Creator accounts only",
    requiresBusiness: true
  },
  tiktok: {
    name: "TikTok",
    icon: MessageCircle,
    color: "bg-black",
    description: "Short-form video content",
    requiresBusiness: false
  },
  twitch: {
    name: "Twitch",
    icon: Twitch,
    color: "bg-purple-600",
    description: "Live streaming and gaming",
    requiresBusiness: false
  },
  discord: {
    name: "Discord",
    icon: MessageCircle,
    color: "bg-indigo-600",
    description: "Gaming communities and chat",
    requiresBusiness: false
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    color: "bg-red-600",
    description: "Video content and subscriptions",
    requiresBusiness: false
  },
  reddit: {
    name: "Reddit",
    icon: MessageCircle,
    color: "bg-orange-600",
    description: "Communities and discussions",
    requiresBusiness: false
  },
  pinterest: {
    name: "Pinterest",
    icon: SiPinterest,
    color: "bg-red-700",
    description: "Visual inspiration and ideas",
    requiresBusiness: false
  },
  facebook: {
    name: "Facebook",
    icon: FacebookIcon,
    color: "bg-blue-600",
    description: "Social networking and communities",
    requiresBusiness: false
  },
  espn: {
    name: "ESPN Fantasy",
    icon: Trophy,
    color: "bg-red-700",
    description: "Fantasy sports leagues and stats",
    requiresBusiness: false
  }
};

export default function Settings() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  // Delete account state management
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'pin' | 'final'>('confirm');
  const [pin, setPin] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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
      // Add cache-busting timestamp to prevent cached OAuth states
      const response = await apiRequest("GET", `/api/oauth/authorize/${platform}?t=${Date.now()}`);
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

  // PIN verification for delete account
  const verifyPin = useMutation({
    mutationFn: async (pinCode: string) => {
      return await apiRequest("POST", "/api/user/verify-pin", { pin: pinCode });
    },
    onSuccess: (data) => {
      if (data.success) {
        setDeleteStep('final');
        setPin('');
      } else {
        toast({
          title: "Invalid PIN",
          description: "The PIN you entered is incorrect.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to verify PIN. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccount = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/user/account");
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      // Redirect to login page after deletion
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
      setIsDeletingAccount(false);
    },
  });

  const handleDeleteAccount = () => {
    setShowDeleteDialog(true);
    setDeleteStep('confirm');
    setPin('');
  };

  const handleDeleteStep = () => {
    if (deleteStep === 'confirm') {
      setDeleteStep('pin');
    } else if (deleteStep === 'pin') {
      if (pin.length === 4) {
        verifyPin.mutate(pin);
      } else {
        toast({
          title: "Invalid PIN",
          description: "Please enter a 4-digit PIN.",
          variant: "destructive",
        });
      }
    } else if (deleteStep === 'final') {
      setIsDeletingAccount(true);
      deleteAccount.mutate();
    }
  };

  const handleDialogClose = () => {
    setShowDeleteDialog(false);
    setDeleteStep('confirm');
    setPin('');
    setIsDeletingAccount(false);
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
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{platform?.name || platformKey}</h4>
                                <p className="text-purple-200 text-sm">{platform?.description}</p>
                                {platform?.requiresBusiness && (
                                  <p className="text-yellow-300 text-xs mt-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Requires Business or Creator account
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => connectAccount.mutate(platformKey)}
                              disabled={(platformKey !== 'tiktok' && platformKey !== 'twitch' && platformKey !== 'discord' && platformKey !== 'reddit' && platformKey !== 'pinterest' && platformKey !== 'youtube') || connectAccount.isPending}
                              className={(platformKey === 'tiktok' || platformKey === 'twitch' || platformKey === 'discord' || platformKey === 'reddit' || platformKey === 'pinterest' || platformKey === 'youtube')
                                ? "w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" 
                                : "w-full bg-white/10 text-white/50 border-white/20 cursor-not-allowed"}
                              data-testid={`button-connect-${platformKey}`}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              {platformKey === 'tiktok' ? 'Connect TikTok' : platformKey === 'twitch' ? 'Connect Twitch' : platformKey === 'discord' ? 'Connect Discord' : platformKey === 'reddit' ? 'Connect Reddit' : platformKey === 'pinterest' ? 'Connect Pinterest' : platformKey === 'youtube' ? 'Connect YouTube' : 'Coming Soon'}
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
              <CardContent className="space-y-4">
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                
                {/* Delete Account Button */}
                <div className="pt-4 border-t border-white/20">
                  <Button
                    onClick={handleDeleteAccount}
                    variant="destructive"
                    className="w-full bg-red-800 hover:bg-red-900 text-white"
                    data-testid="button-delete-account"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                  <p className="text-purple-300 text-xs mt-2 text-center">
                    This action cannot be undone
                  </p>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              {deleteStep === 'confirm' && "Delete Account?"}
              {deleteStep === 'pin' && "Enter PIN"}
              {deleteStep === 'final' && "Final Confirmation"}
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 'confirm' && 
                "Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
              }
              {deleteStep === 'pin' && 
                "Please enter your 4-digit PIN to verify your identity."
              }
              {deleteStep === 'final' && 
                "This is your final warning. Clicking 'Delete Forever' will permanently delete your account and all associated data. This action cannot be undone."
              }
            </DialogDescription>
          </DialogHeader>
          
          {deleteStep === 'pin' && (
            <div className="space-y-4">
              <Label htmlFor="delete-pin">PIN</Label>
              <Input
                id="delete-pin"
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Enter 4-digit PIN"
                className="text-center text-lg tracking-widest"
                data-testid="input-delete-pin"
              />
            </div>
          )}
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={isDeletingAccount || verifyPin.isPending}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStep}
              disabled={
                isDeletingAccount || 
                verifyPin.isPending || 
                (deleteStep === 'pin' && pin.length !== 4)
              }
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {isDeletingAccount && "Deleting..."}
              {!isDeletingAccount && deleteStep === 'confirm' && "Yes, Continue"}
              {!isDeletingAccount && deleteStep === 'pin' && (verifyPin.isPending ? "Verifying..." : "Verify PIN")}
              {!isDeletingAccount && deleteStep === 'final' && "Delete Forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}