import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Loader2, Edit } from 'lucide-react';

export default function MeetupPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');

  // Location check-in mutation that creates a post
  const locationCheckInMutation = useMutation({
    mutationFn: async (locationData: { latitude: number; longitude: number; locationName: string; address?: string }) => {
      // Create content based on available information
      let content = `📍 Checked in`;
      if (locationData.locationName) {
        content += ` at ${locationData.locationName}`;
      }
      if (locationData.address) {
        content += ` (${locationData.address})`;
      }
      if (!locationData.locationName && !locationData.address) {
        content += ` at ${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
      }
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: content,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          locationName: locationData.locationName || null,
          address: locationData.address || null,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check in');
      }
      
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Location Check-in Posted!",
        description: "Your location has been shared with your kliq on the bulletin",
      });
      // Force immediate refetch of feed data
      console.log('Force refetching feed after check-in...');
      await queryClient.refetchQueries({ queryKey: ['/api/kliq-feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      // Reset form
      setLocationName('');
      setAddress('');
      setShowLocationDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setUserLocation({ lat, lng });
        setIsGettingLocation(false);
        setShowLocationDialog(true);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
        toast({
          title: "Location Access Denied",
          description: "Please allow location access to check in to your current location.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleLocationCheckIn = async () => {
    if (!userLocation) return;
    
    await locationCheckInMutation.mutateAsync({
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      locationName: locationName,
      address: address,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Location Check-in</h1>
          <p className="text-muted-foreground">
            Share your current location with your kliq on the headlines
          </p>
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <MapPin className="h-6 w-6" />
              <span>Check In Now</span>
            </CardTitle>
            <CardDescription>
              This will post your current location to the bulletin for your kliq to see
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex justify-center">
            <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  data-testid="button-location-checkin"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Check In to Current Location
                    </>
                  )}
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Edit className="h-5 w-5" />
                    <span>Add Location Details</span>
                  </DialogTitle>
                  <DialogDescription>
                    Add a location name and address to make your check-in more informative
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="locationName">Location Name</Label>
                    <Input
                      id="locationName"
                      data-testid="input-location-name"
                      placeholder="e.g., Starbucks, Central Park, Home"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address (optional)</Label>
                    <Input
                      id="address"
                      data-testid="input-location-address"
                      placeholder="e.g., 123 Main St, New York, NY"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  
                  {userLocation && (
                    <div className="text-sm text-muted-foreground">
                      <p>GPS Coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowLocationDialog(false)}
                      data-testid="button-cancel-checkin"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleLocationCheckIn}
                      disabled={locationCheckInMutation.isPending}
                      data-testid="button-confirm-checkin"
                    >
                      {locationCheckInMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        'Check In'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-muted-foreground max-w-md">
          <p>
            When you check in, your location will be shared as a post on the bulletin. 
            Your kliq members will be able to see where you are and can join you if they want.
          </p>
        </div>
      </div>
    </div>
  );
}