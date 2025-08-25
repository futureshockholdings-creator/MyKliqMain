import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageCircle, Users, Calendar, Heart, MessageSquare, Radio, MapPin, Cake } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Notification } from "@shared/schema";

interface NotificationBadgeProps {
  type?: "all" | "messages" | "friends" | "events" | "likes" | "comments" | "streams" | "meetups" | "birthdays";
  className?: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  showIcon?: boolean;
  maxCount?: number;
}

const typeIcons = {
  all: Bell,
  messages: MessageCircle,
  friends: Users,
  events: Calendar,
  likes: Heart,
  comments: MessageSquare,
  streams: Radio,
  meetups: MapPin,
  birthdays: Cake,
};

export function NotificationBadge({ 
  type = "all", 
  className, 
  size = "md",
  showCount = true,
  showIcon = true,
  maxCount = 99
}: NotificationBadgeProps) {
  const [isVisible, setIsVisible] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", type === "all" ? undefined : type],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data fresh for 15 seconds
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead && n.isVisible).length;
  const hasNotifications = unreadCount > 0;
  
  // Debug logging (remove in production)
  // console.log(`NotificationBadge [${type}]: notifications=`, notifications.length, 'unread=', unreadCount, 'hasNotifications=', hasNotifications);

  useEffect(() => {
    if (hasNotifications) {
      setIsVisible(true);
      // Add pulse animation when new notifications arrive
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasNotifications]);

  if (!hasNotifications && !showIcon) return null;

  const Icon = typeIcons[type];
  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();

  const sizeClasses = {
    sm: "h-4 w-4 text-xs",
    md: "h-5 w-5 text-sm", 
    lg: "h-6 w-6 text-base"
  };

  return (
    <div className="relative inline-flex items-center" data-testid={`notification-badge-${type}`}>
      {showIcon && (
        <Icon 
          className={cn(
            sizeClasses[size],
            hasNotifications ? "text-primary animate-pulse" : "text-muted-foreground",
            className
          )}
        />
      )}
      
      {hasNotifications && showCount && (
        <Badge 
          variant="destructive"
          className={cn(
            "absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0 text-xs font-bold",
            isVisible && "animate-bounce",
            size === "sm" && "h-4 w-4 text-[10px]",
            size === "lg" && "h-6 w-6 text-sm"
          )}
          data-testid={`notification-count-${type}`}
        >
          {displayCount}
        </Badge>
      )}

      {hasNotifications && (
        <div className={cn(
          "absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive",
          isVisible && "animate-ping"
        )} />
      )}
    </div>
  );
}