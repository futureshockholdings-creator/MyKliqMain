import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Check, Trash2, Bell, MessageCircle, Users, Calendar, Heart, MessageSquare, Radio, MapPin, Cake } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Notification } from "@shared/schema";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons = {
  message: MessageCircle,
  friend_request: Users,
  event_invite: Calendar,
  post_like: Heart,
  comment: MessageSquare,
  story_view: MessageCircle,
  live_stream: Radio,
  meetup_invite: MapPin,
  birthday: Cake,
};

const priorityColors = {
  low: "text-muted-foreground",
  normal: "text-foreground",
  high: "text-orange-500 dark:text-orange-400",
  urgent: "text-red-500 dark:text-red-400",
};

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [selectedTab, setSelectedTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}`, {
        isRead: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async (type?: string) => {
      await apiRequest("PATCH", "/api/notifications/mark-all-read", {
        type: type === "all" ? undefined : type,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async (type?: string) => {
      await apiRequest("DELETE", "/api/notifications/delete-all", {
        type: type === "all" ? undefined : type,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "All notifications deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete all notifications",
        variant: "destructive",
      });
    },
  });



  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (!notification.isVisible) return false;
    if (selectedTab === "all") return true;
    return notification.type === selectedTab;
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead && n.isVisible).length;

  const notificationTabs = [
    { value: "all", label: "All", icon: Bell },
    { value: "message", label: "Messages", icon: MessageCircle },
    { value: "friend_request", label: "Friends", icon: Users },
    { value: "event_invite", label: "Events", icon: Calendar },
    { value: "post_like", label: "Likes", icon: Heart },
    { value: "comment", label: "Comments", icon: MessageSquare },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" data-testid="notification-panel-overlay">
      <div className="fixed right-2 md:right-4 top-2 md:top-4 bottom-16 md:bottom-4 w-[calc(100vw-1rem)] md:w-96 max-w-[calc(100vw-1rem)]">
        <Card className="h-full flex flex-col bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate(selectedTab)}
                  data-testid="mark-all-read-button"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {filteredNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAllNotificationsMutation.mutate(selectedTab)}
                  data-testid="delete-all-notifications-button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                data-testid="close-notification-panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-3 w-full mx-4 mb-2">
                {notificationTabs.slice(0, 3).map((tab) => {
                  const Icon = tab.icon;
                  const tabCount = notifications.filter((n: Notification) => 
                    n.isVisible && !n.isRead && (tab.value === "all" || n.type === tab.value)
                  ).length;
                  
                  return (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className="text-xs relative"
                      data-testid={`notification-tab-${tab.value}`}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {tab.label}
                      {tabCount > 0 && (
                        <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px]">
                          {tabCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>



              <ScrollArea className="flex-1 px-4">
                <TabsContent value={selectedTab} className="space-y-2 mt-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading notifications...</div>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No notifications</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification: Notification) => {
                      const Icon = typeIcons[notification.type as keyof typeof typeIcons];
                      return (
                        <Card
                          key={notification.id}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-accent",
                            !notification.isRead && "border-primary bg-primary/5"
                          )}
                          onClick={() => handleNotificationClick(notification)}
                          data-testid={`notification-item-${notification.id}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                {Icon && (
                                  <Icon 
                                    className={cn(
                                      "h-5 w-5",
                                      priorityColors[notification.priority as keyof typeof priorityColors]
                                    )} 
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className={cn(
                                    "text-sm font-medium truncate",
                                    !notification.isRead && "font-semibold"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center space-x-1">
                                    {!notification.isRead && (
                                      <div className="h-2 w-2 bg-primary rounded-full" />
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotificationMutation.mutate(notification.id);
                                      }}
                                      data-testid={`delete-notification-${notification.id}`}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(notification.createdAt || Date.now()), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}