import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { type User } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [birthdate, setBirthdate] = useState(user?.birthdate || "");

  const updateBirthdateMutation = useMutation({
    mutationFn: async (birthdate: string) => {
      return await apiRequest("/api/user/birthdate", "PATCH", { birthdate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Birthdate updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update birthdate",
        variant: "destructive",
      });
    },
  });

  const handleUpdateBirthdate = () => {
    if (!birthdate) {
      toast({
        title: "Error", 
        description: "Please enter your birthdate",
        variant: "destructive",
      });
      return;
    }
    updateBirthdateMutation.mutate(birthdate);
  };

  // Query for birthday users today
  const { data: birthdayUsers = [] } = useQuery({
    queryKey: ["/api/birthdays/today"],
  });

  const sendBirthdayMessageMutation = useMutation({
    mutationFn: async ({ birthdayUserId, message }: { birthdayUserId: string, message: string }) => {
      return await apiRequest("/api/birthdays/send-message", "POST", { birthdayUserId, message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Success",
        description: "Birthday message sent!",
      });
    },
    onError: (error) => {
      const errorMessage = error.message.includes("already sent") 
        ? "You've already sent a birthday message this year"
        : "Failed to send birthday message";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <div className="text-sm text-muted-foreground">
                {user.firstName} {user.lastName}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="text-sm text-muted-foreground">
                {user.email}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Kliq Name</Label>
              <div className="text-sm text-muted-foreground">
                {user.kliqName}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdate">Birthdate</Label>
              <Input
                id="birthdate"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                data-testid="input-birthdate"
              />
            </div>

            <Button 
              onClick={handleUpdateBirthdate}
              disabled={updateBirthdateMutation.isPending}
              data-testid="button-update-birthdate"
            >
              {updateBirthdateMutation.isPending ? "Updating..." : "Update Birthdate"}
            </Button>
          </CardContent>
        </Card>

        {birthdayUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>🎉 Birthdays Today!</CardTitle>
              <CardDescription>Send birthday wishes to your kliq members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {birthdayUsers.map((birthdayUser: User) => {
                  if (birthdayUser.id === user.id) return null; // Don't show own birthday
                  
                  return (
                    <div key={birthdayUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {birthdayUser.profileImageUrl && (
                          <img 
                            src={birthdayUser.profileImageUrl} 
                            alt={`${birthdayUser.firstName}'s avatar`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{birthdayUser.firstName} {birthdayUser.lastName}</div>
                          <div className="text-sm text-muted-foreground">It's their birthday! 🎂</div>
                        </div>
                      </div>
                      <Button
                        onClick={() => sendBirthdayMessageMutation.mutate({ 
                          birthdayUserId: birthdayUser.id, 
                          message: "Hope you have the best day ever! 🎉"
                        })}
                        disabled={sendBirthdayMessageMutation.isPending}
                        size="sm"
                        data-testid={`button-birthday-${birthdayUser.id}`}
                      >
                        {sendBirthdayMessageMutation.isPending ? "Sending..." : "Send Birthday Wish"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}