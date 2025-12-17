import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check, Smartphone } from "lucide-react";
import { webPushService } from "@/services/webPushService";
import { useToast } from "@/hooks/use-toast";

export function NotificationSettings() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsPWA, setNeedsPWA] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user needs to install PWA first (iOS Safari requirement)
    setNeedsPWA(webPushService.needsPWAInstall());
    
    // Check initial permission status
    const status = webPushService.getPermissionStatus();
    setPermissionStatus(status);
    setIsEnabled(status === 'granted');
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      // Request permission
      const granted = await webPushService.requestPermission();
      
      if (!granted) {
        toast({
          title: "Permission Denied",
          description: "You need to allow notifications in your browser settings.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Register device
      const registered = await webPushService.registerDevice();
      
      if (registered) {
        setPermissionStatus('granted');
        setIsEnabled(true);
        
        // Setup foreground message listener
        webPushService.setupForegroundListener((payload) => {
          console.log('Notification received in foreground:', payload);
        });
        
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications from MyKliq!",
        });
      } else {
        toast({
          title: "Registration Failed",
          description: "Failed to register for push notifications. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "An error occurred while enabling notifications.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    
    try {
      await webPushService.unregisterDevice();
      setIsEnabled(false);
      
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications anymore.",
      });
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({
        title: "Error",
        description: "An error occurred while disabling notifications.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await handleEnableNotifications();
    } else {
      await handleDisableNotifications();
    }
  };

  // Show PWA install instructions for iOS Safari users
  if (needsPWA) {
    return (
      <Card className="bg-transparent border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Smartphone className="w-5 h-5" />
            Install MyKliq to Enable Notifications
          </CardTitle>
          <CardDescription className="text-purple-200">
            Safari requires MyKliq to be installed as an app on your home screen to receive push notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/10 border border-white/20 rounded-lg p-4">
            <p className="font-semibold text-white mb-2">📱 How to Install:</p>
            <ol className="space-y-2 text-sm text-purple-200">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Tap the Share button (square with arrow) in Safari</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Scroll down and tap "Add to Home Screen"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Tap "Add" to confirm</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span>Open MyKliq from your home screen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">5.</span>
                <span>Return to Settings to enable push notifications</span>
              </li>
            </ol>
          </div>
          <p className="text-sm text-purple-300">
            Once installed, you'll be able to receive notifications for posts, comments, messages, and more!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Browser doesn't support notifications at all
  if (!webPushService.isSupported()) {
    return (
      <Card className="bg-transparent border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BellOff className="w-5 h-5" />
            Push Notifications Not Supported
          </CardTitle>
          <CardDescription className="text-purple-200">
            Your browser doesn't support push notifications.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="w-5 h-5" />
          Push Notifications
        </CardTitle>
        <CardDescription className="text-purple-200">
          Get notified about new posts, comments, likes, and more
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
            <span className="font-medium text-white">Enable Push Notifications</span>
            <span className="text-sm text-purple-300">
              {isEnabled 
                ? "You're receiving push notifications" 
                : "Turn on to receive notifications"}
            </span>
          </Label>
          <Switch
            id="push-notifications"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            className={isEnabled ? "data-[state=checked]:bg-green-500" : "data-[state=unchecked]:bg-gray-600"}
            data-testid="switch-push-notifications"
          />
        </div>

        {isEnabled && (
          <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-200">Push notifications are active</span>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-200">
              You've blocked notifications. To enable them, please allow notifications in your browser settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
