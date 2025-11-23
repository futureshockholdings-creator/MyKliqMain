import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check } from "lucide-react";
import { webPushService } from "@/services/webPushService";
import { useToast } from "@/hooks/use-toast";

export function NotificationSettings() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
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

  if (!webPushService.isSupported()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Push Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about new posts, comments, likes, and more
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
            <span className="font-medium">Enable Push Notifications</span>
            <span className="text-sm text-muted-foreground">
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
            data-testid="switch-push-notifications"
          />
        </div>

        {isEnabled && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm">Push notifications are active</span>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              You've blocked notifications. To enable them, please allow notifications in your browser settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
