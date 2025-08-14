import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, Users, Plus, Check, X, HelpCircle, Image as ImageIcon, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import { MediaUpload } from "@/components/MediaUpload";

interface CountdownProps {
  targetDate: string;
}

function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
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
        <Badge variant="secondary" className="bg-gray-500 text-white">
          Event Started
        </Badge>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div className="bg-gradient-to-br from-pink-600 to-purple-600 rounded-lg p-2">
        <div className="text-lg font-bold text-white">{timeLeft.days}</div>
        <div className="text-xs text-pink-200">Days</div>
      </div>
      <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg p-2">
        <div className="text-lg font-bold text-white">{timeLeft.hours}</div>
        <div className="text-xs text-blue-200">Hours</div>
      </div>
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg p-2">
        <div className="text-lg font-bold text-white">{timeLeft.minutes}</div>
        <div className="text-xs text-green-200">Mins</div>
      </div>
      <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-lg p-2">
        <div className="text-lg font-bold text-white">{timeLeft.seconds}</div>
        <div className="text-xs text-orange-200">Secs</div>
      </div>
    </div>
  );
}

export default function Events() {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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
        description: "Your event has been shared with your kliq",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      await apiRequest("PUT", `/api/events/${eventId}/attendance`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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

    createEventMutation.mutate(newEvent);
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
        eventDate: editingEvent.eventDate,
        mediaUrl: editingEvent.mediaUrl,
        mediaType: editingEvent.mediaType,
      }
    });
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
    return {
      date: date.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (eventsLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-800">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-gray-400">Create and join events with your kliq</p>
        </div>
        
        <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Event Title</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-event-title"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Description</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What's this event about?"
                  className="bg-gray-700 border-gray-600 text-white resize-none"
                  rows={3}
                  data-testid="input-event-description"
                />
              </div>

              <div>
                <Label className="text-gray-300">Location</Label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Where will this happen?"
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-event-location"
                />
              </div>

              <div>
                <Label className="text-gray-300">Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={newEvent.eventDate}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  min={new Date().toISOString().slice(0, 16)}
                  data-testid="input-event-datetime"
                />
              </div>

              <div>
                <Label className="text-gray-300">Media</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMediaUpload(true)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Photo/Video
                  </Button>
                  {newEvent.mediaUrl && (
                    <Badge className="bg-green-600 text-white">
                      Media attached
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleCreateEvent}
                  disabled={createEventMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                  data-testid="button-create-event"
                >
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateEvent(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Event Modal */}
        <Dialog open={showEditEvent} onOpenChange={setShowEditEvent}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Event Title</Label>
                <Input
                  value={editingEvent?.title || ""}
                  onChange={(e) => setEditingEvent((prev: any) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-edit-event-title"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Description</Label>
                <Textarea
                  value={editingEvent?.description || ""}
                  onChange={(e) => setEditingEvent((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="What's this event about?"
                  className="bg-gray-700 border-gray-600 text-white resize-none"
                  rows={3}
                  data-testid="input-edit-event-description"
                />
              </div>

              <div>
                <Label className="text-gray-300">Location</Label>
                <Input
                  value={editingEvent?.location || ""}
                  onChange={(e) => setEditingEvent((prev: any) => ({ ...prev, location: e.target.value }))}
                  placeholder="Where will this happen?"
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-edit-event-location"
                />
              </div>

              <div>
                <Label className="text-gray-300">Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={editingEvent?.eventDate || ""}
                  onChange={(e) => setEditingEvent((prev: any) => ({ ...prev, eventDate: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  min={new Date().toISOString().slice(0, 16)}
                  data-testid="input-edit-event-datetime"
                />
              </div>

              <div>
                <Label className="text-gray-300">Media</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMediaUpload(true)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {editingEvent?.mediaUrl ? "Change Media" : "Add Photo/Video"}
                  </Button>
                  {editingEvent?.mediaUrl && (
                    <Badge className="bg-green-600 text-white">
                      Media attached
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleUpdateEvent}
                  disabled={updateEventMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                  data-testid="button-update-event"
                >
                  {updateEventMutation.isPending ? "Updating..." : "Update Event"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditEvent(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!Array.isArray(events) || events.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 text-center">
          <CardContent className="p-8">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Events Yet</h2>
            <p className="text-gray-400 mb-4">
              Create your first event to start planning with your kliq!
            </p>
            <Button
              onClick={() => setShowCreateEvent(true)}
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white"
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
                  "bg-gradient-to-br from-gray-800 to-gray-700 border",
                  event.author.id === userData?.id ? "border-purple-500/50" : "border-gray-600"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12 border-2 border-pink-400">
                        <AvatarImage src={event.author.profileImageUrl} />
                        <AvatarFallback className="bg-gray-700 text-white">
                          {event.author.firstName?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white">
                          {event.author.firstName} {event.author.lastName}
                        </p>
                        <p className="text-xs text-gray-400">Event Host</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {event.author.id === userData?.id && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditEvent(event)}
                            className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                            data-testid={`button-edit-event-${event.id}`}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Badge className="bg-purple-600 text-white">Your Event</Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                      {event.description && (
                        <p className="text-gray-300">{event.description}</p>
                      )}
                    </div>

                    {/* Event Media */}
                    {event.mediaUrl && (
                      <div className="rounded-lg overflow-hidden bg-black/20">
                        {event.mediaType === 'video' ? (
                          <video 
                            src={event.mediaUrl} 
                            controls 
                            className="w-full max-h-64 object-cover"
                            preload="metadata"
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
                        <div className="flex items-center text-blue-400 mb-2">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Date & Time</span>
                        </div>
                        <p className="text-white font-medium">{date}</p>
                        <p className="text-gray-300">{time}</p>
                      </div>

                      {event.location && (
                        <div>
                          <div className="flex items-center text-green-400 mb-2">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Location</span>
                          </div>
                          <p className="text-white">{event.location}</p>
                        </div>
                      )}
                    </div>

                    {/* Countdown Timer */}
                    <div>
                      <div className="flex items-center text-pink-400 mb-3">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Event Countdown</span>
                      </div>
                      <Countdown targetDate={event.eventDate} />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                      <div className="flex items-center text-purple-400">
                        <Users className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          {event.attendeeCount} going • {event.attendees?.length || 0} responded
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
                              ? "bg-green-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-green-600 hover:text-white"
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
  );
}