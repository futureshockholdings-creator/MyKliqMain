import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PyramidChart } from "@/components/pyramid-chart";
import { Badge } from "@/components/ui/badge";
import { Users, Edit, Plus, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Kliq() {
  const [kliqName, setKliqName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { user } = useAuth();
  const userData = user as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
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

  return (
    <div className="p-4 pb-20 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="w-6 h-6 text-pink-400" />
          <h1 className="text-2xl font-bold text-pink-400">
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
                  className="bg-green-600 hover:bg-green-700 text-white"
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
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </>
            )}
          </h1>
        </div>
        <p className="text-gray-400 text-sm">
          Drag friends to reorder your kliq pyramid
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-blue-600/20 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {(friends as any[]).length}/15
            </div>
            <div className="text-sm text-blue-200">Friends</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-600/20 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {15 - (friends as any[]).length}
            </div>
            <div className="text-sm text-purple-200">Open Spots</div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Code */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg">
            📱 Your Invite Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between bg-gray-700 rounded p-3">
            <code className="text-green-400 font-mono font-bold">
              {userData?.inviteCode || "Loading..."}
            </code>
            <Button
              size="sm"
              onClick={copyInviteCode}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!userData?.inviteCode}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Share this code with friends to invite them to your kliq
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
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
                />
              </div>
              <Button
                onClick={handleJoinKliq}
                disabled={!inviteCode.trim() || joinKliqMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {joinKliqMutation.isPending ? "Joining..." : "Join Kliq"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pyramid Chart */}
      {friendsLoading ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto"></div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-gray-600 rounded mx-auto"></div>
                <div className="w-32 h-3 bg-gray-600 rounded mx-auto"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (friends as any[]).length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-bold text-gray-400 mb-2">No friends yet</h3>
            <p className="text-gray-500 text-sm mb-4">
              Share your invite code or join someone else's kliq to get started!
            </p>
            <Button
              onClick={() => setIsInviteDialogOpen(true)}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Join a Kliq
            </Button>
          </CardContent>
        </Card>
      ) : (
        <PyramidChart
          friends={(friends as any[]).map(f => ({
            id: f.friend.id,
            firstName: f.friend.firstName,
            lastName: f.friend.lastName,
            profileImageUrl: f.friend.profileImageUrl,
            rank: f.rank
          }))}
          onRankChange={handleRankChange}
          maxFriends={15}
        />
      )}
    </div>
  );
}
