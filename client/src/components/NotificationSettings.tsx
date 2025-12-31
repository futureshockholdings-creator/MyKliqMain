import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Check, Smartphone, AlertCircle, Loader2 } from "lucide-react";
import { webPushService } from "@/services/webPushService";
import { useToast } from "@/hooks/use-toast";
import { getMessaging, vapidKey, isMessagingSupported } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

export function NotificationSettings() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [needsPWA, setNeedsPWA] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const firebaseConfigStatus = {
    hasMessaging: !!getMessaging(),
    hasVapidKey: !!vapidKey,
    vapidKeyPreview: vapidKey ? vapidKey.slice(0, 10) + '...' : 'MISSING',
    isMessagingSupported: isMessagingSupported(),
  };

  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      try {
        setNeedsPWA(webPushService.needsPWAInstall());
        
        const status = webPushService.getPermissionStatus();
        setPermissionStatus(status);
        
        if (status === 'granted') {
          try {
            const response = await apiRequest('GET', '/api/push/status');
            setIsEnabled(response?.registered === true);
          } catch (err) {
            console.log('[NotificationSettings] Could not check backend status:', err);
            setIsEnabled(false);
          }
        } else {
          setIsEnabled(false);
        }
      } catch (error) {
        console.error('[NotificationSettings] Error checking status:', error);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStatus();
  }, []);

  const handleEnableNotifications = async () => {
    setIsToggling(true);
    setLastError(null);
    
    try {
      // iOS uses native Web Push API, not Firebase - skip Firebase check for iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        // iOS handles permission through pushManager.subscribe() 
        // Skip separate permission request and Firebase check
        console.log('[NotificationSettings] iOS detected, using native Web Push flow');
      } else {
        // Non-iOS: Check Firebase and request permission separately
        const messaging = getMessaging();
        if (!messaging) {
          const errorMsg = `Firebase not initialized. Supported: ${isMessagingSupported()}, VAPID: ${!!vapidKey}`;
          setLastError(errorMsg);
          toast({
            title: "Configuration Error",
            description: "Firebase messaging is not available. Please try again or use a different browser.",
            variant: "destructive"
          });
          setIsToggling(false);
          return;
        }
        
        const granted = await webPushService.requestPermission();
        
        if (!granted) {
          setLastError("Permission denied by user");
          toast({
            title: "Permission Denied",
            description: "You need to allow notifications in your browser settings.",
            variant: "destructive"
          });
          setIsToggling(false);
          return;
        }
      }

      const registered = await webPushService.registerDevice();
      
      if (registered) {
        setPermissionStatus('granted');
        setIsEnabled(true);
        setLastError(null);
        
        webPushService.setupForegroundListener((payload) => {
          console.log('[NotificationSettings] Notification received in foreground:', payload);
        });
        
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications from MyKliq!",
        });
      } else {
        const serviceError = webPushService.getLastError();
        const errorDetail = serviceError || "Device registration failed - check browser console for details";
        setLastError(errorDetail);
        toast({
          title: "Registration Failed",
          description: errorDetail,
          variant: "destructive",
          duration: 10000
        });
      }
    } catch (error: any) {
      const errorMsg = error?.message || error?.code || String(error);
      console.error('[NotificationSettings] Error enabling notifications:', error);
      console.error('[NotificationSettings] Error stack:', error?.stack);
      setLastError(`Enable Error: ${errorMsg}`);
      toast({
        title: "Error",
        description: errorMsg || "An error occurred while enabling notifications.",
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsToggling(true);
    
    try {
      await webPushService.unregisterDevice();
      setIsEnabled(false);
      
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications anymore.",
      });
    } catch (error) {
      console.error('[NotificationSettings] Error disabling notifications:', error);
      toast({
        title: "Error",
        description: "An error occurred while disabling notifications.",
        variant: "destructive"
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await handleEnableNotifications();
    } else {
      await handleDisableNotifications();
    }
  };

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
            <p className="font-semibold text-white mb-2">How to Install:</p>
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
              {isLoading 
                ? "Checking status..." 
                : isEnabled 
                  ? "You're receiving push notifications" 
                  : "Turn on to receive notifications"}
            </span>
          </Label>
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-purple-300 animate-spin" />
          ) : (
            <Switch
              id="push-notifications"
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isToggling}
              className={isEnabled ? "data-[state=checked]:bg-green-500" : "data-[state=unchecked]:bg-gray-600"}
              data-testid="switch-push-notifications"
            />
          )}
        </div>

        {isToggling && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-sm text-blue-200">
              {isEnabled ? "Disabling notifications..." : "Enabling notifications..."}
            </span>
          </div>
        )}

        {isEnabled && !isToggling && (
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

        {lastError && (
          <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-200">Debug Info</p>
                <p className="text-xs text-orange-300 mt-1">{lastError}</p>
                <p className="text-xs text-orange-300 mt-1">
                  Firebase: {firebaseConfigStatus.hasMessaging ? 'OK' : 'Not initialized'} | 
                  VAPID: {firebaseConfigStatus.hasVapidKey ? firebaseConfigStatus.vapidKeyPreview : 'MISSING'} |
                  Supported: {firebaseConfigStatus.isMessagingSupported ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
