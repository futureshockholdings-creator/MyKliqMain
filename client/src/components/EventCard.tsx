import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Check, X, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: any;
  currentUserId?: string;
}

const formatEventDate = (dateString: string) => {
  const eventDate = new Date(dateString);
  const formattedDate = eventDate.toLocaleDateString("en-US", { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  return `${formattedDate} at ${formattedTime}`;
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export function EventCard({ event, currentUserId }: EventCardProps) {
  const [selectedAttendance, setSelectedAttendance] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user's attendance status for this event
  const { data: userAttendance } = useQuery<{ status: string }>({
    queryKey: [`/api/events/${event.id}/attendance`],
    enabled: !!currentUserId,
  });

  const currentStatus = userAttendance?.status || null;

  // Mutation to update attendance
  const updateAttendanceMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await fetch(`/api/events/${event.id}/attendance`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update attendance');
      return response.json();
    },
    onSuccess: (_, status) => {
      setSelectedAttendance(status);
      toast({
        title: "Attendance updated",
        description: `You are now marked as "${status === 'not_going' ? 'not going' : status}" for this event.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/attendance`] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error) => {
      console.error("Error updating attendance:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAttendanceClick = (status: string) => {
    updateAttendanceMutation.mutate(status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'going':
        return 'bg-green-500 hover:bg-green-600 text-white border-green-500';
      case 'maybe':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500';
      case 'not_going':
        return 'bg-red-500 hover:bg-red-600 text-white border-red-500';
      default:
        return 'bg-secondary hover:bg-secondary/90 text-secondary-foreground border-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'going':
        return <Check className="w-3 h-3" />;
      case 'maybe':
        return <Clock className="w-3 h-3" />;
      case 'not_going':
        return <X className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'going':
        return 'Going';
      case 'maybe':
        return 'Maybe';
      case 'not_going':
        return 'Not Going';
      default:
        return status;
    }
  };

  const displayStatus = selectedAttendance || currentStatus;
  const isUpdating = updateAttendanceMutation.isPending;

  console.log('EventCard rendering:', {
    eventId: event.id,
    eventTitle: event.title,
    currentUserId,
    currentStatus,
    hasCurrentUserId: !!currentUserId,
    userIdType: typeof currentUserId
  });

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border border-primary/30">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Event Header */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 border-2 border-primary">
              <AvatarImage src={event.author.profileImageUrl} />
              <AvatarFallback className="bg-muted text-foreground">
                {event.author.firstName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-bold text-primary">
                {event.author.firstName} {event.author.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTimeAgo(event.activityDate || event.createdAt)}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
              📅 Event
            </Badge>
          </div>

          {/* Event Details */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">{event.title}</h3>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                {formatEventDate(event.eventDate)}
              </div>
              
              {event.location && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2 text-red-500" />
                  {event.location}
                </div>
              )}
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="w-4 h-4 mr-2 text-green-500" />
                {event.attendeeCount || 0} attending
              </div>
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                {event.description}
              </p>
            )}

            {/* Event Media */}
            {event.mediaUrl && (
              <div className="rounded-md overflow-hidden">
                {event.mediaType === 'video' ? (
                  <video
                    controls
                    className="w-full max-h-96 object-cover"
                    src={event.mediaUrl}
                    data-testid={`video-event-${event.id}`}
                  />
                ) : (
                  <img
                    src={event.mediaUrl}
                    alt="Event media"
                    className="w-full max-h-96 object-cover"
                    data-testid={`img-event-${event.id}`}
                  />
                )}
              </div>
            )}
          </div>

          {/* Attendance Buttons */}
          {currentUserId ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Set your attendance:</p>
              <div className="flex space-x-2 pt-2 border-t border-border">
              <div className="flex space-x-2 flex-1">
                <Button
                  onClick={() => handleAttendanceClick('going')}
                  disabled={isUpdating}
                  size="sm"
                  className={cn(
                    "flex-1 text-xs",
                    displayStatus === 'going' 
                      ? getStatusColor('going')
                      : "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-secondary"
                  )}
                  data-testid={`button-going-${event.id}`}
                >
                  {displayStatus === 'going' && getStatusIcon('going')}
                  <span className="ml-1">Going</span>
                </Button>
                
                <Button
                  onClick={() => handleAttendanceClick('maybe')}
                  disabled={isUpdating}
                  size="sm"
                  className={cn(
                    "flex-1 text-xs",
                    displayStatus === 'maybe' 
                      ? getStatusColor('maybe')
                      : "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-secondary"
                  )}
                  data-testid={`button-maybe-${event.id}`}
                >
                  {displayStatus === 'maybe' && getStatusIcon('maybe')}
                  <span className="ml-1">Maybe</span>
                </Button>
                
                <Button
                  onClick={() => handleAttendanceClick('not_going')}
                  disabled={isUpdating}
                  size="sm"
                  className={cn(
                    "flex-1 text-xs",
                    displayStatus === 'not_going' 
                      ? getStatusColor('not_going')
                      : "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-secondary"
                  )}
                  data-testid={`button-not-going-${event.id}`}
                >
                  {displayStatus === 'not_going' && getStatusIcon('not_going')}
                  <span className="ml-1">Not Going</span>
                </Button>
              </div>
              
              {displayStatus && (
                <Badge 
                  className={cn("text-xs", getStatusColor(displayStatus))}
                  data-testid={`badge-status-${event.id}`}
                >
                  {getStatusIcon(displayStatus)}
                  <span className="ml-1">{getStatusText(displayStatus)}</span>
                </Badge>
              )}
            </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Login required to set attendance
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}