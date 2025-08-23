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
  darkStyle?: boolean;
}

export function PushNotificationSetup({ onDismiss, compact = false, darkStyle = false }: PushNotificationSetupProps) {
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
    <Card className={cn(
      "transition-all duration-200",
      darkStyle 
        ? "bg-black border-gray-700 text-white" 
        : "bg-card border-border"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full transition-colors",
              darkStyle 
                ? isEnabled ? "bg-green-600" : "bg-gray-600"
                : isEnabled ? "bg-green-500" : "bg-muted"
            )}>
              {isEnabled ? (
                <Bell className={cn(
                  "w-4 h-4",
                  darkStyle ? "text-white" : "text-white"
                )} />
              ) : (
                <BellOff className={cn(
                  "w-4 h-4",
                  darkStyle ? "text-gray-300" : "text-muted-foreground"
                )} />
              )}
            </div>
            <div>
              <h3 className={cn(
                "font-medium text-sm",
                darkStyle ? "text-white" : "text-foreground"
              )}>
                Push Notifications
              </h3>
              <p className={cn(
                "text-xs",
                darkStyle ? "text-gray-300" : "text-muted-foreground"
              )}>
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
          <div className={cn(
            "mt-3 p-2 rounded text-xs",
            darkStyle ? "bg-gray-800 text-gray-300" : "bg-orange-50 text-orange-700 border border-orange-200"
          )}>
            To enable notifications, click the notification icon in your browser's address bar and allow notifications.
          </div>
        )}
      </CardContent>
    </Card>
  );
}