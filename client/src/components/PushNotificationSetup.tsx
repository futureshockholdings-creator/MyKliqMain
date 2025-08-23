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
}

export function PushNotificationSetup({ onDismiss, compact = false }: PushNotificationSetupProps) {
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
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500 rounded-full">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-lg">Stay Connected</CardTitle>
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
          <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Enable Push Notifications</p>
            <p className="text-xs text-muted-foreground mt-1">
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

        <div className="text-xs text-muted-foreground">
          ✓ Instant kliq activity alerts  
          ✓ Never miss friend interactions  
          ✓ Real-time event invitations
        </div>
      </CardContent>
    </Card>
  );
}