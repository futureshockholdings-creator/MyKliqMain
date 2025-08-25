import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  Shield,
  Eye,
  EyeOff
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  // Password setup form schema
  const passwordSchema = z.object({
    password: z.string()
      .min(10, "Password must be at least 10 characters long")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  // Password setup mutation
  const setupPassword = useMutation({
    mutationFn: async (data: { password: string }) => {
      return await apiRequest("POST", "/api/auth/setup-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password Set Successfully",
        description: "Your password has been set up and will be used for future logins.",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error Setting Password",
        description: "Failed to set up password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
    setupPassword.mutate({ password: values.password });
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
      <div className="max-w-4xl mx-auto">
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

            {/* Password Setup */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Password Setup
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Set up your password for future login access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="bg-white/5 border-white/20 text-white placeholder:text-purple-300 pr-10"
                                data-testid="input-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-purple-300" />
                                ) : (
                                  <Eye className="h-4 w-4 text-purple-300" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-purple-300 text-sm">
                            Must be at least 10 characters with letters, numbers, and special characters
                          </FormDescription>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                className="bg-white/5 border-white/20 text-white placeholder:text-purple-300 pr-10"
                                data-testid="input-confirm-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                data-testid="button-toggle-confirm-password"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-purple-300" />
                                ) : (
                                  <Eye className="h-4 w-4 text-purple-300" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={setupPassword.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-setup-password"
                    >
                      {setupPassword.isPending ? "Setting up..." : "Set Password"}
                    </Button>
                  </form>
                </Form>
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