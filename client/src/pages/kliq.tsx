import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { PyramidChart } from "@/components/pyramid-chart";
import { VideoCallComponent } from "@/components/video-call";
import { useVideoCall } from "@/hooks/useVideoCall";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Edit, Plus, Copy, MessageCircle, X, Settings, LogOut, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";

export default function Kliq() {
  const [newKliqName, setNewKliqName] = useState("");
  const [newKliqDescription, setNewKliqDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const { user } = useAuth();
  const userData = user as { 
    id?: string; 
    firstName?: string; 
    lastName?: string; 
    kliqName?: string; 
    inviteCode?: string; 
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

  // Fetch user's kliqs
  const { data: userKliqs = [], isLoading: kliqsLoading } = useQuery({
    queryKey: ["/api/kliqs"],
  });

  // Fetch friends (for backward compatibility)
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

  // Create kliq mutation
  const createKliqMutation = useMutation({
    mutationFn: async (kliqData: { name: string; description?: string }) => {
      await apiRequest("POST", "/api/kliqs", kliqData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kliqs"] });
      setIsCreateDialogOpen(false);
      setNewKliqName("");
      setNewKliqDescription("");
      toast({
        title: "Kliq created!",
        description: "Your new kliq is ready",
        duration: 2000,
        className: "bg-white text-black border-gray-300",
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
        description: "Failed to create kliq",
        variant: "destructive",
      });
    },
  });

  // Join kliq mutation
  const joinKliqMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      await apiRequest("POST", "/api/kliqs/join", { inviteCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kliqs"] });
      setIsJoinDialogOpen(false);
      setInviteCode("");
      toast({
        title: "Kliq joined!",
        description: "Welcome to your new kliq",
        duration: 2000,
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to join kliq",
          variant: "destructive",
        });
      }
    },
  });

  // Leave kliq mutation
  const leaveKliqMutation = useMutation({
    mutationFn: async (kliqId: string) => {
      await apiRequest("DELETE", `/api/kliqs/${kliqId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kliqs"] });
      toast({
        title: "Left kliq",
        description: "You have left the kliq",
        duration: 2000,
        className: "bg-white text-black border-gray-300",
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
        duration: 2000,
        className: "bg-white text-black border-gray-300",
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

  // Add friend via invite code
  const addFriendMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiRequest("POST", "/api/friends/invite", { inviteCode: code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      setInviteCode("");
      toast({
        title: "Friend added!",
        description: "You've successfully added a new friend",
        duration: 2000,
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add friend. Check your invite code.",
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
      toast({
        title: "Friend removed",
        description: "Friend has been removed from your kliq",
        duration: 2000,
        className: "bg-white text-black border-gray-300",
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

  const copyInviteCode = async (inviteCode: string) => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast({
        title: "Invite code copied!",
        description: "Share this code with friends to invite them",
        duration: 2000,
        className: "bg-white text-black border-gray-300",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  const handleRankChange = (friendId: string, newRank: number) => {
    updateRankMutation.mutate({ friendId, rank: newRank });
  };

  const handleCreateKliq = () => {
    if (!newKliqName.trim()) return;
    createKliqMutation.mutate({
      name: newKliqName.trim(),
      description: newKliqDescription.trim() || undefined,
    });
  };

  const handleJoinKliq = () => {
    if (!inviteCode.trim()) return;
    joinKliqMutation.mutate(inviteCode.trim());
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Kliqs</h1>
          <p className="text-muted-foreground">Manage your friend circles and connections</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-create-kliq">
                <Plus className="w-4 h-4 mr-2" />
                Create Kliq
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Kliq</DialogTitle>
                <DialogDescription>
                  Create a new kliq to organize your friends
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="kliq-name">Kliq Name</Label>
                  <Input
                    id="kliq-name"
                    value={newKliqName}
                    onChange={(e) => setNewKliqName(e.target.value)}
                    placeholder="Enter kliq name"
                    className="bg-white text-black"
                    data-testid="input-kliq-name"
                  />
                </div>
                <div>
                  <Label htmlFor="kliq-description">Description (Optional)</Label>
                  <Textarea
                    id="kliq-description"
                    value={newKliqDescription}
                    onChange={(e) => setNewKliqDescription(e.target.value)}
                    placeholder="Describe your kliq..."
                    className="bg-white text-black"
                    data-testid="textarea-kliq-description"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateKliq}
                    disabled={createKliqMutation.isPending || !newKliqName.trim()}
                    data-testid="button-confirm-create-kliq"
                  >
                    {createKliqMutation.isPending ? "Creating..." : "Create Kliq"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-join-kliq">
                <Users className="w-4 h-4 mr-2" />
                Join Kliq
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Kliq</DialogTitle>
                <DialogDescription>
                  Enter an invite code to join an existing kliq
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code"
                    className="bg-white text-black"
                    data-testid="input-invite-code"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsJoinDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleJoinKliq}
                    disabled={joinKliqMutation.isPending || !inviteCode.trim()}
                    data-testid="button-confirm-join-kliq"
                  >
                    {joinKliqMutation.isPending ? "Joining..." : "Join Kliq"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* User's Kliqs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">My Kliqs ({userKliqs.length})</h2>
        {kliqsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-muted rounded-full"></div>
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-muted rounded"></div>
                        <div className="w-24 h-3 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userKliqs.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🫂</div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No kliqs yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create your first kliq or join an existing one to get started
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Create Kliq
                </Button>
                <Button
                  onClick={() => setIsJoinDialogOpen(true)}
                  variant="outline"
                  className="border-secondary text-secondary hover:bg-secondary/10"
                >
                  Join Kliq
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {userKliqs.map((membership: any) => (
              <Card key={membership.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {membership.kliq.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-foreground">{membership.kliq.name}</h3>
                          {membership.kliq.ownerId === userData?.id && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            Rank #{membership.rank}
                          </Badge>
                        </div>
                        {membership.kliq.description && (
                          <p className="text-sm text-muted-foreground">{membership.kliq.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(membership.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyInviteCode(membership.kliq.inviteCode)}
                        className="text-muted-foreground hover:text-foreground"
                        data-testid={`button-copy-invite-${membership.kliq.id}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {membership.kliq.ownerId !== userData?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => leaveKliqMutation.mutate(membership.kliq.id)}
                          className="text-destructive hover:text-destructive/80"
                          data-testid={`button-leave-kliq-${membership.kliq.id}`}
                        >
                          <LogOut className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Legacy Friends Section */}
      {friends.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Legacy Friends ({friends.length}/15)</h2>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Friend Pyramid</span>
                <Badge variant="secondary" className="text-xs">
                  {friends.length} friends
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PyramidChart
                friends={friends}
                onRankChange={handleRankChange}
                isLoading={updateRankMutation.isPending}
                data-testid="pyramid-chart"
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Add Friend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter friend's invite code"
                  className="bg-white text-black"
                  data-testid="input-friend-invite-code"
                />
                <Button
                  onClick={() => addFriendMutation.mutate(inviteCode)}
                  disabled={addFriendMutation.isPending || !inviteCode.trim()}
                  data-testid="button-add-friend"
                >
                  {addFriendMutation.isPending ? "Adding..." : "Add Friend"}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Your invite code:</span>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => copyInviteCode(userData?.inviteCode || "")}
                  data-testid="badge-user-invite-code"
                >
                  {userData?.inviteCode || "Loading..."}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyInviteCode(userData?.inviteCode || "")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Video Call Section */}
      {isInCall && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <VideoCallComponent
              currentCall={currentCall}
              isConnecting={isConnecting}
              onEndCall={endCall}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}