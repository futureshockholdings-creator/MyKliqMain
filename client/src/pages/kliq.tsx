import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { PyramidChart } from "@/components/pyramid-chart";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Edit, Plus, Copy, X, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Kliq() {
  const [inviteCode, setInviteCode] = useState("");
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [kliqName, setKliqName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);
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

  // Initialize kliq name from user data
  useState(() => {
    if (userData?.kliqName && !kliqName) {
      setKliqName(userData.kliqName);
    }
  });

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
      await apiRequest("PUT", "/api/user/kliq-name", { kliqName: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setEditingName(false);
      toast({
        title: "Kliq name updated!",
        description: "Your kliq has been renamed",
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

  // Add friend
  const addFriendMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiRequest("POST", "/api/friends/invite", { inviteCode: code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      setInviteCode("");
      setIsJoinDialogOpen(false);
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
      setFriendToRemove(null);
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

  const handleUpdateName = () => {
    if (!kliqName.trim()) return;
    updateNameMutation.mutate(kliqName.trim());
  };

  const handleAddFriend = () => {
    if (!inviteCode.trim()) return;
    addFriendMutation.mutate(inviteCode.trim());
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3">
            {editingName ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={kliqName}
                  onChange={(e) => setKliqName(e.target.value)}
                  className="bg-white text-black text-2xl font-bold h-10"
                  data-testid="input-edit-kliq-name"
                />
                <Button
                  size="sm"
                  onClick={handleUpdateName}
                  disabled={updateNameMutation.isPending}
                  data-testid="button-save-kliq-name"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setKliqName(userData?.kliqName || "My Kliq");
                    setEditingName(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  {userData?.kliqName || "My Kliq"}
                </h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingName(true)}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-edit-kliq-name"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          <p className="text-muted-foreground">Your friend circle and pyramid ranking</p>
        </div>
        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-friend">
              <Plus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Friend</DialogTitle>
              <DialogDescription>
                Enter a friend's invite code to add them to your kliq
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
                  data-testid="input-friend-invite-code"
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
                  onClick={handleAddFriend}
                  disabled={addFriendMutation.isPending || !inviteCode.trim()}
                  data-testid="button-confirm-add-friend"
                >
                  {addFriendMutation.isPending ? "Adding..." : "Add Friend"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Your Invite Code */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Invite Code</span>
            <Crown className="w-5 h-5 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-muted text-lg p-2"
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
              data-testid="button-copy-invite-code"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Share this code with friends so they can join your kliq
          </p>
        </CardContent>
      </Card>

      {/* Friends Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Friends ({friends.length}/15)</h2>
        
        {friends.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No friends yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Add friends to your kliq to start building your pyramid
              </p>
              <Button
                onClick={() => setIsJoinDialogOpen(true)}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                Add First Friend
              </Button>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </div>

      {/* Remove Friend Dialog */}
      <Dialog open={!!friendToRemove} onOpenChange={() => setFriendToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Friend</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {friendToRemove ? friends.find(f => f.id === friendToRemove)?.friend.firstName : ""} from your kliq?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setFriendToRemove(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => friendToRemove && removeFriendMutation.mutate(friendToRemove)}
              disabled={removeFriendMutation.isPending}
            >
              {removeFriendMutation.isPending ? "Removing..." : "Remove Friend"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}