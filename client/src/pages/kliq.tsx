import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PyramidChart } from "@/components/pyramid-chart";
import { VideoCallComponent } from "@/components/video-call";
import { useVideoCall } from "@/hooks/useVideoCall";
import { Badge } from "@/components/ui/badge";
import { Users, Edit, Plus, Copy, MessageCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";

export default function Kliq() {
  const [kliqName, setKliqName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
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
                  className="bg-gray-700 border-gray-600 text-white text-center"
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
          Drag friends to reorder your kliq pyramid
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary" data-testid="text-friend-count">
              {friends.length}/15
            </div>
            <div className="text-sm text-muted-foreground">Friends</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-mykliq-purple" data-testid="text-open-spots">
              {15 - friends.length}
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
          maxFriends={15}
          kliqName={userData?.kliqName}
        />
      )}

      {/* Invite Code */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-mykliq-green text-lg">
            📱 Your Invite Code
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
              className="bg-mykliq-green hover:bg-mykliq-green/90 text-white"
              disabled={!userData?.inviteCode}
              data-testid="button-copy-invite"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this code with friends to invite them to your kliq
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
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-blue-400">Join Another Kliq</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Invite Code</label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="KLIQ-XXXX-XXXX"
                  className="bg-gray-700 border-gray-600 text-white"
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
    </div>
  );
}
