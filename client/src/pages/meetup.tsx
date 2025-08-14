import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Loader2 } from 'lucide-react';

export default function MeetupPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Location check-in mutation that creates a post
  const locationCheckInMutation = useMutation({
    mutationFn: async (locationData: { latitude: number; longitude: number; locationName: string }) => {
      // First create a post with location information
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: `📍 Checked in at ${locationData.locationName}`,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          locationName: locationData.locationName,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check in');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Location Check-in Posted!",
        description: "Your location has been shared with your kliq on the bulletin",
      });
      // Invalidate posts to refresh the bulletin
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
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
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Use reverse geocoding to get location name
          const locationName = `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          
          await locationCheckInMutation.mutateAsync({
            latitude: lat,
            longitude: lng,
            locationName: locationName,
          });
        } catch (error) {
          console.error('Error during check-in:', error);
        } finally {
          setIsGettingLocation(false);
        }
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Location Check-in</h1>
          <p className="text-muted-foreground">
            Share your current location with your kliq on the bulletin
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
            <Button
              size="lg"
              data-testid="button-location-checkin"
              onClick={getCurrentLocation}
              disabled={isGettingLocation || locationCheckInMutation.isPending}
              className="w-full"
            >
              {isGettingLocation || locationCheckInMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isGettingLocation ? 'Getting Location...' : 'Posting Check-in...'}
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Check In to Current Location
                </>
              )}
            </Button>
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