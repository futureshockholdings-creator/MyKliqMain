import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, Users, Plus, Check, X, HelpCircle, Image as ImageIcon, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { resolveAssetUrl } from "@/lib/apiConfig";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import { MediaUpload } from "@/components/MediaUpload";
import { PageWrapper } from "@/components/PageWrapper";

interface CountdownProps {
  targetDate: string;
}

function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Ensure we're working with a proper Date object
      const target = new Date(targetDate);
      const now = new Date();
      const difference = target.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
        setIsExpired(false);
      } else {
        setIsExpired(true);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) {
    return (
      <div className="text-center py-2">
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          Event Started
        </Badge>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-2">
        <div className="text-lg font-bold text-primary-foreground">{timeLeft.days}</div>
        <div className="text-xs text-primary-foreground/80">Days</div>
      </div>
      <div className="bg-gradient-to-br from-secondary to-mykliq-blue rounded-lg p-2">
        <div className="text-lg font-bold text-secondary-foreground">{timeLeft.hours}</div>
        <div className="text-xs text-secondary-foreground/80">Hours</div>
      </div>
      <div className="bg-gradient-to-br from-mykliq-green to-mykliq-purple rounded-lg p-2">
        <div className="text-lg font-bold text-foreground">{timeLeft.minutes}</div>
        <div className="text-xs text-foreground/80">Mins</div>
      </div>
      <div className="bg-gradient-to-br from-mykliq-orange to-primary rounded-lg p-2">
        <div className="text-lg font-bold text-foreground">{timeLeft.seconds}</div>
        <div className="text-xs text-foreground/80">Secs</div>
      </div>
    </div>
  );
}

export default function Events() {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    eventDate: "",
    mediaUrl: "",
    mediaType: null as "image" | "video" | null,
  });
  const { user } = useAuth();
  const userData = user as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      await apiRequest("POST", "/api/events", eventData);
    },
    onSuccess: async () => {
      // Clear enterprise cache first to prevent stale data
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/events');
        await enhancedCache.removeByPattern('/api/calendar');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear error (non-critical):', e);
      }
      // Force refetch to ensure UI updates immediately
      await queryClient.refetchQueries({ queryKey: ["/api/events"], type: 'active' });
      // Refetch kliq-feed so event appears on headlines immediately
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-koins/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/notes"] });
      setShowCreateEvent(false);
      setNewEvent({
        title: "",
        description: "",
        location: "",
        eventDate: "",
        mediaUrl: "",
        mediaType: null,
      });
      toast({
        title: "Event created!",
        description: "Your event has been shared with your kliq on the Headlines",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, eventData }: { eventId: string; eventData: any }) => {
      await apiRequest("PUT", `/api/events/${eventId}`, eventData);
    },
    onSuccess: async () => {
      // Clear enterprise cache first to prevent stale data
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/events');
        await enhancedCache.removeByPattern('/api/calendar');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear error (non-critical):', e);
      }
      // Force refetch to ensure UI updates immediately
      await queryClient.refetchQueries({ queryKey: ["/api/events"], type: 'active' });
      // Refetch kliq-feed so changes appear on headlines immediately
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
      setShowEditEvent(false);
      setEditingEvent(null);
      toast({
        title: "Event updated!",
        description: "Your event changes have been saved",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: async () => {
      // Clear enterprise cache first to prevent stale data
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/events');
        await enhancedCache.removeByPattern('/api/calendar');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear error (non-critical):', e);
      }
      // Force refetch to ensure UI updates immediately
      await queryClient.refetchQueries({ queryKey: ["/api/events"], type: 'active' });
      // Refetch kliq-feed so deletion reflects on headlines immediately
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
      setShowEditEvent(false);
      setEditingEvent(null);
      toast({
        title: "Event deleted!",
        description: "Your event has been cancelled and removed",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      await apiRequest("POST", `/api/events/${eventId}/attendance`, { status });
    },
    onSuccess: async () => {
      // Clear enterprise cache first to prevent stale data
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/events');
      } catch (e) {
        console.log('Cache clear error (non-critical):', e);
      }
      // Force refetch to ensure UI updates immediately
      await queryClient.refetchQueries({ queryKey: ["/api/events"], type: 'active' });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      toast({
        title: "Attendance updated!",
        description: "Your attendance status has been updated",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
    },
  });

  const handleCreateEvent = () => {
    if (!newEvent.title.trim() || !newEvent.eventDate) {
      toast({
        title: "Missing information",
        description: "Please provide at least a title and date for your event",
        variant: "destructive",
      });
      return;
    }

    // Convert datetime-local to ISO string to ensure proper timezone handling
    // The datetime-local input gives us a local time, but we need to send it as the intended local time in ISO format
    const localDateTime = new Date(newEvent.eventDate);
    const eventData = {
      ...newEvent,
      eventDate: localDateTime.toISOString()
    };

    createEventMutation.mutate(eventData);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent({
      ...event,
      eventDate: new Date(event.eventDate).toISOString().slice(0, 16), // Convert to datetime-local format
    });
    setShowEditEvent(true);
  };

  const handleUpdateEvent = () => {
    if (!editingEvent.title.trim() || !editingEvent.eventDate) {
      toast({
        title: "Missing information",
        description: "Please provide at least a title and date for your event",
        variant: "destructive",
      });
      return;
    }

    updateEventMutation.mutate({ 
      eventId: editingEvent.id, 
      eventData: {
        title: editingEvent.title,
        description: editingEvent.description,
        location: editingEvent.location,
        eventDate: new Date(editingEvent.eventDate).toISOString(),
        mediaUrl: editingEvent.mediaUrl,
        mediaType: editingEvent.mediaType,
      }
    });
  };

  const handleDeleteEvent = () => {
    if (!editingEvent?.id) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEvent = () => {
    if (!editingEvent?.id) return;
    deleteEventMutation.mutate(editingEvent.id);
    setShowDeleteConfirm(false);
  };

  const handleAttendanceUpdate = (eventId: string, status: string) => {
    updateAttendanceMutation.mutate({ eventId, status });
  };

  const handleMediaUploadSuccess = (uploadedObject: any) => {
    if (showEditEvent && editingEvent) {
      setEditingEvent((prev: any) => ({
        ...prev,
        mediaUrl: uploadedObject.objectURL,
        mediaType: uploadedObject.type as "image" | "video",
      }));
    } else {
      setNewEvent(prev => ({
        ...prev,
        mediaUrl: uploadedObject.objectURL,
        mediaType: uploadedObject.type as "image" | "video",
      }));
    }
    setShowMediaUpload(false);
    toast({
      title: "Media uploaded!",
      description: "Media has been attached to your event",
    });
  };

  const getUserAttendanceStatus = (event: any) => {
    const userAttendance = event.attendees?.find((a: any) => a.userId === userData?.id);
    return userAttendance?.status || null;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    // Ensure we display in the user's local timezone
    return {
      date: date.toLocaleDateString("en-US", { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }),
      time: date.toLocaleTimeString("en-US", { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    };
  };

  if (eventsLoading) {
    return (
      <PageWrapper>
        <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground">Create and join events with your kliq</p>
        </div>
        
        <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-black">Create New Event</DialogTitle>
              <DialogDescription className="text-gray-600">
                Create a new event for your kliq. Add details, set date and time, and invite members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Event Title</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  data-testid="input-event-title"
                />
              </div>
              
              <div>
                <Label className="text-gray-700">Description</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What's this event about?"
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400 resize-none"
                  rows={3}
                  data-testid="input-event-description"
                />
              </div>

              <div>
                <Label className="text-gray-700">Location</Label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Where will this happen?"
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  data-testid="input-event-location"
                />
              </div>

              <div>
                <Label className="text-gray-700">Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={newEvent.eventDate}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="bg-white border-gray-300 text-black"
                  min={new Date().toISOString().slice(0, 16)}
                  data-testid="input-event-datetime"
                />
              </div>

              <div>
                <Label className="text-gray-700">Media</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMediaUpload(true)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Photo/Video
                  </Button>
                  {newEvent.mediaUrl && (
                    <Badge className="bg-mykliq-green text-white">
                      Media attached
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleCreateEvent}
                  disabled={createEventMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  data-testid="button-create-event"
                >
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateEvent(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Event Modal */}
        <Dialog open={showEditEvent} onOpenChange={setShowEditEvent}>
          <DialogContent className="bg-white border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-black">Edit Event</DialogTitle>
              <DialogDescription className="text-gray-600">
                Update event details, change date and time, or modify the description and location.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Event Title</Label>
                <Input
                  value={editingEvent?.title || ""}
                  onChange={(e) => setEditingEvent((prev: any) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  data-testid="input-edit-event-title"
                />
              </div>
              
              <div>
                <Label className="text-gray-700">Description</Label>
                <Textarea
                  value={editingEvent?.description || ""}
                  onChange={(e) => setEditingEvent((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="What's this event about?"
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400 resize-none"
                  rows={3}
                  data-testid="input-edit-event-description"
                />
              </div>

              <div>
                <Label className="text-gray-700">Location</Label>
                <Input
                  value={editingEvent?.location || ""}
                  onChange={(e) => setEditingEvent((prev: any) => ({ ...prev, location: e.target.value }))}
                  placeholder="Where will this happen?"
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400"
                  data-testid="input-edit-event-location"
                />
              </div>

              <div>
                <Label className="text-gray-700">Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={editingEvent?.eventDate || ""}
                  onChange={(e) => setEditingEvent((prev: any) => ({ ...prev, eventDate: e.target.value }))}
                  className="bg-white border-gray-300 text-black"
                  min={new Date().toISOString().slice(0, 16)}
                  data-testid="input-edit-event-datetime"
                />
              </div>

              <div>
                <Label className="text-gray-700">Media</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMediaUpload(true)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {editingEvent?.mediaUrl ? "Change Media" : "Add Photo/Video"}
                  </Button>
                  {editingEvent?.mediaUrl && (
                    <Badge className="bg-mykliq-green text-white">
                      Media attached
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleUpdateEvent}
                  disabled={updateEventMutation.isPending || deleteEventMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  data-testid="button-update-event"
                >
                  {updateEventMutation.isPending ? "Updating..." : "Update Event"}
                </Button>
                <Button
                  onClick={handleDeleteEvent}
                  disabled={updateEventMutation.isPending || deleteEventMutation.isPending}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  data-testid="button-delete-event"
                >
                  {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditEvent(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="bg-white border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-black">Confirm Delete</DialogTitle>
              <DialogDescription className="text-gray-600">
                This action cannot be undone. The event will be permanently removed from your kliq.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete "{editingEvent?.title}"? This action cannot be undone.
              </p>
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={confirmDeleteEvent}
                  disabled={deleteEventMutation.isPending}
                  variant="destructive"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  data-testid="button-confirm-delete"
                >
                  {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!Array.isArray(events) || events.length === 0 ? (
        <Card className="bg-card border-border text-center">
          <CardContent className="p-8">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">No Events Yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first event to start planning with your kliq!
            </p>
            <Button
              onClick={() => setShowCreateEvent(true)}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
            >
              Create Your First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.isArray(events) && events.map((event: any) => {
            const userAttendance = getUserAttendanceStatus(event);
            const { date, time } = formatDateTime(event.eventDate);
            
            return (
              <Card
                key={event.id}
                className={cn(
                  "bg-card border",
                  event.author.id === userData?.id ? "border-primary/50" : "border-border"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12 border-2 border-primary">
                        <AvatarImage src={resolveAssetUrl(event.author.profileImageUrl)} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {event.author.firstName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">
                          {event.author.firstName} {event.author.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">Event Host</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {event.author.id === userData?.id && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditEvent(event)}
                            className="border-primary text-primary hover:bg-primary/10"
                            data-testid={`button-edit-event-${event.id}`}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Badge className="bg-primary text-primary-foreground">Your Event</Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{event.title}</h3>
                      {event.description && (
                        <p className="text-muted-foreground">{event.description}</p>
                      )}
                    </div>

                    {/* Event Media */}
                    {event.mediaUrl && (
                      <div className="rounded-lg overflow-hidden bg-muted/20">
                        {event.mediaType === 'video' ? (
                          <video 
                            src={event.mediaUrl} 
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full max-h-64 object-cover"
                          />
                        ) : (
                          <img 
                            src={event.mediaUrl} 
                            alt="Event media" 
                            className="w-full max-h-64 object-cover"
                          />
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center text-secondary mb-2">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Date & Time</span>
                        </div>
                        <p className="text-foreground font-medium">{date}</p>
                        <p className="text-muted-foreground">{time}</p>
                      </div>

                      {event.location && (
                        <div>
                          <div className="flex items-center text-mykliq-green mb-2">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Location</span>
                          </div>
                          <p className="text-foreground">{event.location}</p>
                        </div>
                      )}
                    </div>

                    {/* Countdown Timer */}
                    <div>
                      <div className="flex items-center text-primary mb-3">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Event Countdown</span>
                      </div>
                      <Countdown targetDate={event.eventDate} />
                    </div>

                    {/* Attendance Statistics */}
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Attendance Summary</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Check className="w-4 h-4 text-green-600 mr-1" />
                            <span className="text-lg font-bold text-green-600">
                              {event.attendees?.filter((a: any) => a.status === 'going').length || 0}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Going</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <HelpCircle className="w-4 h-4 text-yellow-600 mr-1" />
                            <span className="text-lg font-bold text-yellow-600">
                              {event.attendees?.filter((a: any) => a.status === 'maybe').length || 0}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Maybe</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <X className="w-4 h-4 text-red-600 mr-1" />
                            <span className="text-lg font-bold text-red-600">
                              {event.attendees?.filter((a: any) => a.status === 'not_going').length || 0}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Can't Go</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center text-mykliq-purple">
                        <Users className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          {event.attendees?.filter((a: any) => a.status === 'going').length || 0} going • {event.attendees?.length || 0} responded
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAttendanceUpdate(event.id, 'going')}
                          disabled={updateAttendanceMutation.isPending}
                          className={cn(
                            "h-8 px-3",
                            userAttendance === 'going'
                              ? "bg-mykliq-green text-foreground"
                              : "bg-muted text-muted-foreground hover:bg-mykliq-green hover:text-foreground"
                          )}
                          data-testid={`button-going-${event.id}`}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Going
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAttendanceUpdate(event.id, 'maybe')}
                          disabled={updateAttendanceMutation.isPending}
                          className={cn(
                            "h-8 px-3",
                            userAttendance === 'maybe'
                              ? "bg-yellow-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-yellow-600 hover:text-white"
                          )}
                          data-testid={`button-maybe-${event.id}`}
                        >
                          <HelpCircle className="w-3 h-3 mr-1" />
                          Maybe
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAttendanceUpdate(event.id, 'not_going')}
                          disabled={updateAttendanceMutation.isPending}
                          className={cn(
                            "h-8 px-3",
                            userAttendance === 'not_going'
                              ? "bg-red-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white"
                          )}
                          data-testid={`button-not-going-${event.id}`}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Can't Go
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Media Upload Modal */}
        <MediaUpload
          open={showMediaUpload}
          onOpenChange={setShowMediaUpload}
          onSuccess={handleMediaUploadSuccess}
          type="event"
          userId={userData?.id}
        />

      </div>
    </PageWrapper>
  );
}