import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

import { ProfileSettings } from "@/components/ProfileSettings";
import { ProfileDetailsDisplay } from "@/components/ProfileDetailsDisplay";

import { type User } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();





  // Query for birthday users today
  const { data: birthdayUsers = [] } = useQuery<User[]>({
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
        {/* Profile Settings & Details Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <ProfileSettings user={user} />
            </div>
            <CardDescription>Your personal details, interests, and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileDetailsDisplay user={user} />
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
                  if (birthdayUser.id === (user as User)?.id) return null; // Don't show own birthday
                  
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