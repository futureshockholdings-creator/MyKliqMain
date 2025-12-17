import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
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

  const handleToggle = async (checked: boolean) => {
    if (!checked) return; // Can't disable once granted, would need browser settings
    
    setIsRequesting(true);
    try {
      await requestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  // Don't show if not supported
  if (!isSupported) {
    return null;
  }

  const isEnabled = permission === 'granted';
  const isBlocked = permission === 'denied';

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full transition-colors",
              isEnabled ? "bg-green-500" : "bg-white/20"
            )}>
              {isEnabled ? (
                <Bell className="w-4 h-4 text-white" />
              ) : (
                <BellOff className="w-4 h-4 text-purple-200" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm text-white">
                Push Notifications
              </h3>
              <p className="text-xs text-purple-200">
                {isEnabled 
                  ? "Receiving real-time alerts" 
                  : isBlocked 
                    ? "Blocked - check browser settings"
                    : "Get instant kliq activity alerts"
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isRequesting || isBlocked}
              className={cn(
                "data-[state=checked]:bg-green-500",
                isBlocked && "opacity-50 cursor-not-allowed"
              )}
            />
            {onDismiss && !isEnabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8 w-8 p-0 ml-1"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        
        {isBlocked && (
          <div className="mt-3 p-2 rounded text-xs bg-white/10 text-purple-200">
            To enable notifications, click the notification icon in your browser's address bar and allow notifications.
          </div>
        )}
      </CardContent>
    </Card>
  );
}