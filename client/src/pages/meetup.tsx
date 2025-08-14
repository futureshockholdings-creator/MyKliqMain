import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertMeetupSchema, type Meetup, type MeetupCheckIn, type User } from '@shared/schema';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Users, Calendar, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';

// Form schema for creating meetups
const meetupFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  locationName: z.string().min(1, "Location is required"),
  meetupTime: z.string().min(1, "Meetup time is required"),
  latitude: z.number(),
  longitude: z.number(),
});

type MeetupFormData = z.infer<typeof meetupFormSchema>;

interface MeetupWithDetails extends Meetup {
  organizer: User;
  checkIns: (MeetupCheckIn & { user: User })[];
}

export default function MeetupPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Access",
            description: "Unable to get your location. Some features may be limited.",
            variant: "destructive",
          });
        }
      );
    }
  }, [toast]);

  // Form for creating meetups
  const form = useForm<MeetupFormData>({
    resolver: zodResolver(meetupFormSchema),
    defaultValues: {
      title: '',
      description: '',
      meetupTime: '',
      locationName: '',
      latitude: 0,
      longitude: 0,
    },
  });

  // Update form location when user location is available
  useEffect(() => {
    if (userLocation) {
      form.setValue('latitude', userLocation.lat);
      form.setValue('longitude', userLocation.lng);
    }
  }, [userLocation, form]);

  // Fetch meetups
  const { data: meetups = [], isLoading: meetupsLoading } = useQuery<MeetupWithDetails[]>({
    queryKey: ['/api/meetups'],
  });

  // Fetch nearby meetups if location is available
  const { data: nearbyMeetups = [] } = useQuery<MeetupWithDetails[]>({
    queryKey: ['/api/meetups/nearby', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      if (!userLocation) return [];
      const response = await fetch(`/api/meetups/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userLocation,
  });

  // Create meetup mutation
  const createMeetupMutation = useMutation({
    mutationFn: async (data: MeetupFormData) => {
      const response = await fetch('/api/meetups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          userId: user?.id || '',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create meetup');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meetup Created",
        description: "Your meetup has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meetups'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create meetup",
        variant: "destructive",
      });
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ meetupId, latitude, longitude }: { meetupId: string; latitude: number; longitude: number }) => {
      const response = await fetch(`/api/meetups/${meetupId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ latitude, longitude }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check in');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.verified ? "Check-in Successful" : "Check-in Recorded",
        description: data.message,
        variant: data.verified ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meetups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (meetupId: string) => {
      const response = await fetch(`/api/meetups/${meetupId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check out');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Checked Out",
        description: "You have been checked out successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meetups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-out Failed",
        description: error.message || "Failed to check out",
        variant: "destructive",
      });
    },
  });

  // End meetup mutation
  const endMeetupMutation = useMutation({
    mutationFn: async (meetupId: string) => {
      const response = await fetch(`/api/meetups/${meetupId}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to end meetup');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meetup Ended",
        description: "The meetup has been ended successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meetups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to end meetup",
        variant: "destructive",
      });
    },
  });

  const handleCreateMeetup = (data: MeetupFormData) => {
    createMeetupMutation.mutate(data);
  };

  const handleCheckIn = (meetupId: string) => {
    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Please allow location access to check in to meetups.",
        variant: "destructive",
      });
      return;
    }

    checkInMutation.mutate({
      meetupId,
      latitude: userLocation.lat,
      longitude: userLocation.lng,
    });
  };

  const getUserCheckIn = (meetup: MeetupWithDetails, userId: string) => {
    return meetup.checkIns.find(checkIn => checkIn.userId === userId && !checkIn.checkOutTime);
  };

  if (meetupsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading meetups...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meetups</h1>
          <p className="text-muted-foreground">Check in to location-based meetups with your kliq</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-meetup">
              <Plus className="mr-2 h-4 w-4" />
              Create Meetup
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Meetup</DialogTitle>
              <DialogDescription>
                Create a location-based meetup for your kliq members
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateMeetup)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input data-testid="input-meetup-title" placeholder="Coffee meetup" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea data-testid="textarea-meetup-description" placeholder="Let's grab coffee together!" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="locationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input data-testid="input-meetup-location" placeholder="Starbucks, Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="meetupTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meetup Time</FormLabel>
                      <FormControl>
                        <Input data-testid="input-meetup-time" type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-meetup-latitude"
                            type="number" 
                            step="any" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-meetup-longitude"
                            type="number" 
                            step="any" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    data-testid="button-cancel-meetup"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    data-testid="button-submit-meetup"
                    disabled={createMeetupMutation.isPending}
                  >
                    {createMeetupMutation.isPending ? 'Creating...' : 'Create Meetup'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {/* Your Meetups */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Kliq Meetups</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meetups.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No meetups found. Create your first meetup!</p>
                </CardContent>
              </Card>
            ) : (
              meetups.map((meetup) => {
                const userCheckIn = user?.id ? getUserCheckIn(meetup, user.id) : null;
                
                return (
                  <Card key={meetup.id} data-testid={`card-meetup-${meetup.id}`} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{meetup.title}</CardTitle>
                          <CardDescription>{meetup.description}</CardDescription>
                        </div>
                        <Badge variant={meetup.isActive ? "default" : "secondary"}>
                          {meetup.isActive ? "Active" : "Ended"}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        {meetup.locationName}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {new Date(meetup.meetupTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        {new Date(meetup.meetupTime) > new Date() 
                          ? `Upcoming` 
                          : `Past`}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        {meetup.checkIns.length} checked in
                      </div>
                      
                      <div className="text-sm">
                        <p className="font-medium mb-1">Organizer:</p>
                        <p className="text-muted-foreground">
                          {meetup.organizer.firstName} {meetup.organizer.lastName}
                        </p>
                      </div>
                      
                      {meetup.checkIns.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-medium text-sm">Check-ins:</p>
                          <div className="space-y-1">
                            {meetup.checkIns.map((checkIn) => (
                              <div key={checkIn.id} className="flex items-center justify-between text-sm">
                                <span>{checkIn.user.firstName} {checkIn.user.lastName}</span>
                                <div className="flex items-center space-x-2">
                                  {checkIn.isVerified ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(checkIn.checkInTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        {meetup.isActive && (
                          <>
                            {userCheckIn ? (
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-checkout-${meetup.id}`}
                                onClick={() => checkOutMutation.mutate(meetup.id)}
                                disabled={checkOutMutation.isPending}
                              >
                                Check Out
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                data-testid={`button-checkin-${meetup.id}`}
                                onClick={() => handleCheckIn(meetup.id)}
                                disabled={checkInMutation.isPending}
                              >
                                Check In
                              </Button>
                            )}
                            
                            {user?.id && meetup.userId === user.id && (
                              <Button
                                size="sm"
                                variant="destructive"
                                data-testid={`button-end-${meetup.id}`}
                                onClick={() => endMeetupMutation.mutate(meetup.id)}
                                disabled={endMeetupMutation.isPending}
                              >
                                End Meetup
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Nearby Meetups */}
        {nearbyMeetups.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Nearby Meetups</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nearbyMeetups.map((meetup) => (
                <Card key={`nearby-${meetup.id}`} data-testid={`card-nearby-meetup-${meetup.id}`} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{meetup.title}</CardTitle>
                        <CardDescription>{meetup.description}</CardDescription>
                      </div>
                      <Badge variant="outline">Nearby</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4" />
                      {meetup.locationName}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(meetup.meetupTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      {meetup.checkIns.length} checked in
                    </div>
                    
                    <div className="text-sm">
                      <p className="font-medium mb-1">Organizer:</p>
                      <p className="text-muted-foreground">
                        {meetup.organizer.firstName} {meetup.organizer.lastName}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}