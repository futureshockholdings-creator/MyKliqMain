import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PyramidChart } from "@/components/pyramid-chart";
import { VideoCallComponent } from "@/components/video-call";
import { PollCard } from "@/components/PollCard";
import { CreatePollDialog } from "@/components/CreatePollDialog";
import { useVideoCall } from "@/hooks/useVideoCall";
import { Badge } from "@/components/ui/badge";
import { Users, Edit, Plus, Copy, MessageCircle, X, BarChart3, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";

export default function Kliq() {
  const [kliqName, setKliqName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);
  const [isLeaveKliqDialogOpen, setIsLeaveKliqDialogOpen] = useState(false);
  const [isCloseKliqDialogOpen, setIsCloseKliqDialogOpen] = useState(false);
  const { user } = useAuth();
  const userData = user as { 
    id?: string; 
    firstName?: string; 
    lastName?: string; 
    kliqName?: string; 
    inviteCode?: string; 
    kliqClosed?: boolean;
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Video call functionality
  const { 
    currentCall, 
    isInCall, 
    isConnecting, 
    startCall, 
    endCall, 
    toggleAudio, 
    toggleVideo 
  } = useVideoCall();

  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<{ 
    id: string; 
    rank: number; 
    friend: { 
      id: string; 
      firstName?: string; 
      lastName?: string; 
      profileImageUrl?: string; 
    }; 
  }[]>({
    queryKey: ["/api/friends"],
  });

  // Fetch polls
  const { data: polls = [], isLoading: pollsLoading } = useQuery<any[]>({
    queryKey: ["/api/polls"],
  });

  // Update kliq name
  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("PUT", "/api/user/profile", { kliqName: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditingName(false);
      toast({
        title: "Kliq name updated!",
        description: "Your kliq has a new name",
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
        description: "Failed to update kliq name",
        variant: "destructive",
      });
    },
  });

  // Update friend rank
  const updateRankMutation = useMutation({
    mutationFn: async ({ friendId, rank }: { friendId: string; rank: number }) => {
      await apiRequest("PUT", `/api/friends/${friendId}/rank`, { rank });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend rank updated!",
        description: "Your pyramid has been reorganized",
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
        description: "Failed to update friend rank",
        variant: "destructive",
      });
    },
  });

  // Join kliq
  const joinKliqMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiRequest("POST", "/api/friends/invite", { inviteCode: code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      setInviteCode("");
      setIsInviteDialogOpen(false);
      toast({
        title: "Joined kliq!",
        description: "You've successfully joined a new kliq",
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
        description: "Failed to join kliq. Check your invite code.",
        variant: "destructive",
      });
    },
  });

  // Leave Kliq mutation - removes all friendships
  const leaveKliqMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/friends/leave-kliq");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      setIsLeaveKliqDialogOpen(false);
      toast({
        title: "Left kliq",
        description: "You have successfully left your kliq",
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
        description: "Failed to leave kliq",
        variant: "destructive",
      });
    },
  });

  // Close Kliq mutation - toggles kliq closed status
  const closeKliqMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/user/profile", { kliqClosed: !userData?.kliqClosed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsCloseKliqDialogOpen(false);
      toast({
        title: userData?.kliqClosed ? "Kliq opened" : "Kliq closed",
        description: userData?.kliqClosed 
          ? "Your kliq is now open to new members until you reach 28 friends" 
          : "Your kliq is now closed to new members",
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
        description: "Failed to update kliq status",
        variant: "destructive",
      });
    },
  });

  // Remove friend
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("DELETE", `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      setFriendToRemove(null);
      toast({
        title: "Friend removed",
        description: "They have been removed from your kliq",
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
        description: "Failed to remove friend",
        variant: "destructive",
      });
    },
  });

  const handleSaveKliqName = () => {
    if (kliqName.trim()) {
      updateNameMutation.mutate(kliqName.trim());
    }
  };

  const handleRankChange = (friendId: string, newRank: number) => {
    updateRankMutation.mutate({ friendId, rank: newRank });
  };

  const handleJoinKliq = () => {
    if (inviteCode.trim()) {
      joinKliqMutation.mutate(inviteCode.trim());
    }
  };

  // Video call handlers
  const handleVideoCall = async (participantIds: string[]) => {
    try {
      await startCall(participantIds);
      toast({
        title: "Video Call",
        description: "Starting video call...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start video call",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = (friendId: string) => {
    setFriendToRemove(friendId);
  };

  const confirmRemoveFriend = () => {
    if (friendToRemove) {
      removeFriendMutation.mutate(friendToRemove);
    }
  };

  const handleLeaveKliq = () => {
    leaveKliqMutation.mutate();
  };

  const handleCloseKliq = () => {
    setIsCloseKliqDialogOpen(true);
  };

  const confirmCloseKliq = () => {
    closeKliqMutation.mutate();
  };

  const handleMessageFriend = async (friendId: string, friendName: string) => {
    try {
      // Create or get conversation
      const response = await apiRequest("POST", "/api/messages/conversations", {
        participantId: friendId,
      });
      
      const conversationId = response.id;
      navigate(`/messages/${conversationId}`);
      
      toast({
        title: "Starting conversation",
        description: `Messaging ${friendName}`,
      });
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
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
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = async () => {
    if (userData?.inviteCode) {
      try {
        await navigator.clipboard.writeText(userData.inviteCode);
        toast({
          title: "Copied!",
          description: "Invite code copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to copy invite code",
          variant: "destructive",
        });
      }
    }
  };

  // Show video call interface if in a call
  if (isInCall && currentCall) {
    return (
      <div className="h-screen bg-black">
        <VideoCallComponent
          call={currentCall}
          onEndCall={endCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={kliqName}
                  onChange={(e) => setKliqName(e.target.value)}
                  className="bg-input border-border text-foreground text-center"
                  placeholder={userData?.kliqName || "My Kliq"}
                />
                <Button
                  size="sm"
                  onClick={handleSaveKliqName}
                  disabled={updateNameMutation.isPending}
                  className="bg-mykliq-green hover:bg-mykliq-green/90 text-foreground"
                >
                  Save
                </Button>
              </div>
            ) : (
              <>
                🏆 {userData?.kliqName || "My Kliq"} 🏆
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setKliqName(userData?.kliqName || "");
                    setEditingName(true);
                  }}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </>
            )}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Drag friends to reorder your pyramid
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="friends" className="flex items-center gap-2" data-testid="tab-friends">
            <Users className="w-4 h-4" />
            Friends ({friends.length}/15)
          </TabsTrigger>
          <TabsTrigger value="polls" className="flex items-center gap-2" data-testid="tab-polls">
            <BarChart3 className="w-4 h-4" />
            Polls ({polls.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-secondary" data-testid="text-friend-count">
                  {friends.length}/28
                </div>
                <div className="text-sm text-muted-foreground">Friends</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-mykliq-purple" data-testid="text-open-spots">
                  {28 - friends.length}
                </div>
                <div className="text-sm text-muted-foreground">Open Spots</div>
              </CardContent>
            </Card>
          </div>

          {/* Pyramid Chart */}
          {friendsLoading ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <div className="animate-pulse space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto"></div>
                  <div className="space-y-2">
                    <div className="w-24 h-4 bg-muted rounded mx-auto"></div>
                    <div className="w-32 h-3 bg-muted rounded mx-auto"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : friends.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-bold text-muted-foreground mb-2">No friends yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Share your invite code or join someone else's kliq to get started!
                </p>
                <Button
                  onClick={() => setIsInviteDialogOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Join a Kliq
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PyramidChart
              friends={friends.map(f => ({
                id: f.friend.id,
                firstName: f.friend.firstName,
                lastName: f.friend.lastName,
                profileImageUrl: f.friend.profileImageUrl,
                rank: f.rank
              }))}
              onRankChange={handleRankChange}
              onMessage={handleMessageFriend}
              onVideoCall={handleVideoCall}
              onRemove={handleRemoveFriend}
              maxFriends={28}
              kliqName={userData?.kliqName}
              kliqClosed={userData?.kliqClosed}
              onCloseKliq={handleCloseKliq}
              isClosingKliq={false}
            />
          )}

          {/* Leave Kliq Button - only show if user has friends */}
          {friends.length > 0 && (
            <div className="flex justify-start">
              <Dialog open={isLeaveKliqDialogOpen} onOpenChange={setIsLeaveKliqDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    data-testid="button-leave-kliq"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Kliq
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-red-600">Leave Kliq</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to leave your kliq? This will remove all your friends and cannot be undone.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsLeaveKliqDialogOpen(false)}
                        className="bg-muted hover:bg-muted/80"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleLeaveKliq}
                        disabled={leaveKliqMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {leaveKliqMutation.isPending ? "Leaving..." : "Leave Kliq"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Close Kliq Dialog (triggered from PyramidChart) */}
          <Dialog open={isCloseKliqDialogOpen} onOpenChange={setIsCloseKliqDialogOpen}>
            <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle className={userData?.kliqClosed ? "text-green-600" : "text-orange-500"}>
                  {userData?.kliqClosed ? "Open Kliq" : "Close Kliq"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {userData?.kliqClosed 
                    ? "Are you sure you want to open your kliq? New members will be able to join using your invite code until you reach 28 friends total."
                    : "Are you sure you want to close your kliq? No new members will be able to join, but existing friends will remain."
                  }
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsCloseKliqDialogOpen(false)}
                    className="bg-muted hover:bg-muted/80"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={userData?.kliqClosed ? "default" : "destructive"}
                    onClick={confirmCloseKliq}
                    disabled={closeKliqMutation.isPending}
                    className={userData?.kliqClosed 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-orange-500 hover:bg-orange-600"
                    }
                  >
                    {closeKliqMutation.isPending 
                      ? (userData?.kliqClosed ? "Opening..." : "Closing...")
                      : (userData?.kliqClosed ? "Open Kliq" : "Close Kliq")
                    }
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Invite Code */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-mykliq-green text-lg flex items-center gap-2">
                📱 Your Invite Code
                {userData?.kliqClosed && (
                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                    Kliq Closed
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between bg-muted rounded p-3">
                <code className="text-mykliq-green font-mono font-bold" data-testid="text-invite-code">
                  {userData?.inviteCode || "Loading..."}
                </code>
                <Button
                  size="sm"
                  onClick={copyInviteCode}
                  className="bg-mykliq-green hover:bg-mykliq-green/90 text-foreground"
                  disabled={!userData?.inviteCode}
                  data-testid="button-copy-invite"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {userData?.kliqClosed 
                  ? "Your kliq is closed to new members. Existing friends can still use your code but new people cannot join."
                  : "Share this code with friends to invite them to your kliq"
                }
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground" data-testid="button-join-kliq">
                  <Plus className="w-4 h-4 mr-2" />
                  Join Kliq
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-primary">Join Another Kliq</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Invite Code</label>
                    <Input
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="KLIQ-XXXX-XXXX"
                      className="bg-input border-border text-foreground"
                      data-testid="input-join-invite-code"
                    />
                  </div>
                  <Button
                    onClick={handleJoinKliq}
                    disabled={!inviteCode.trim() || joinKliqMutation.isPending}
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  >
                    {joinKliqMutation.isPending ? "Joining..." : "Join Kliq"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="polls" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Kliq Polls</h3>
              <p className="text-sm text-muted-foreground">
                Create polls and vote with your friends
              </p>
            </div>
            <CreatePollDialog />
          </div>

          {pollsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-10 bg-muted rounded"></div>
                        <div className="h-10 bg-muted rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : polls.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-muted-foreground mb-2">No polls yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Create your first poll to get opinions from your friends!
                </p>
                <CreatePollDialog
                  trigger={
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Poll
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Remove Friend Confirmation Dialog */}
      <Dialog open={!!friendToRemove} onOpenChange={() => setFriendToRemove(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remove Friend?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to remove this friend from your kliq? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setFriendToRemove(null)}
                className="flex-1"
                data-testid="button-cancel-remove"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRemoveFriend}
                disabled={removeFriendMutation.isPending}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                data-testid="button-confirm-remove"
              >
                {removeFriendMutation.isPending ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
