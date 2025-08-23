import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Smartphone, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

interface PushNotificationSetupProps {
  onDismiss?: () => void;
  compact?: boolean;
  darkStyle?: boolean;
}

export function PushNotificationSetup({ onDismiss, compact = false, darkStyle = false }: PushNotificationSetupProps) {
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      await requestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  // Don't show if notifications are already granted or not supported
  if (!isSupported || permission === 'granted') {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
        <Smartphone className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Enable notifications for real-time alerts</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRequestPermission}
          disabled={isRequesting || permission === 'denied'}
          className="ml-auto"
        >
          {isRequesting ? 'Requesting...' : 'Enable'}
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn(
      darkStyle 
        ? "bg-black border-gray-700 text-white" 
        : "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-full",
              darkStyle ? "bg-white" : "bg-blue-500"
            )}>
              <Smartphone className={cn(
                "w-4 h-4",
                darkStyle ? "text-black" : "text-white"
              )} />
            </div>
            <CardTitle className={cn(
              "text-lg",
              darkStyle ? "text-white" : ""
            )}>Stay Connected</CardTitle>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Bell className={cn(
            "w-5 h-5 mt-0.5",
            darkStyle ? "text-white" : "text-blue-500"
          )} />
          <div>
            <p className={cn(
              "text-sm font-medium",
              darkStyle ? "text-white" : ""
            )}>Enable Push Notifications</p>
            <p className={cn(
              "text-xs mt-1",
              darkStyle ? "text-gray-300" : "text-muted-foreground"
            )}>
              Get instant alerts when friends like your posts, comment, send messages, or invite you to events
            </p>
          </div>
        </div>

        {permission === 'denied' && (
          <Alert className="border-orange-200 dark:border-orange-800">
            <BellOff className="w-4 h-4" />
            <AlertDescription className="text-sm">
              Notifications are currently blocked. To enable them, click the notification icon in your browser's address bar and allow notifications.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleRequestPermission}
            disabled={isRequesting || permission === 'denied'}
            className={cn(
              "flex-1",
              permission === 'denied' && "opacity-50 cursor-not-allowed"
            )}
          >
            {isRequesting ? (
              <>
                <Bell className="w-4 h-4 mr-2 animate-pulse" />
                Requesting Permission...
              </>
            ) : permission === 'denied' ? (
              <>
                <BellOff className="w-4 h-4 mr-2" />
                Notifications Blocked
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </>
            )}
          </Button>
          {onDismiss && (
            <Button variant="outline" onClick={onDismiss}>
              Maybe Later
            </Button>
          )}
        </div>

        <div className={cn(
          "text-xs",
          darkStyle ? "text-gray-300" : "text-muted-foreground"
        )}>
          ✓ Instant kliq activity alerts  
          ✓ Never miss friend interactions  
          ✓ Real-time event invitations
        </div>
      </CardContent>
    </Card>
  );
}