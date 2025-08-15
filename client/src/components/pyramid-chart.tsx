import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, Star, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Friend {
  id: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  rank: number;
}

interface PyramidChartProps {
  friends: Friend[];
  onRankChange?: (friendId: string, newRank: number) => void;
  onMessage?: (friendId: string, friendName: string) => void;
  onVideoCall?: (participantIds: string[]) => void;
  maxFriends?: number;
  kliqName?: string;
}

export function PyramidChart({ friends, onRankChange, onMessage, onVideoCall, maxFriends = 15, kliqName }: PyramidChartProps) {
  const [draggedFriend, setDraggedFriend] = useState<Friend | null>(null);
  const [_, setLocation] = useLocation();

  const sortedFriends = [...friends].sort((a, b) => a.rank - b.rank);
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-primary to-secondary";
    if (rank <= 3) return "from-secondary to-mykliq-blue";
    if (rank <= 6) return "from-mykliq-orange to-mykliq-green";
    if (rank <= 10) return "from-mykliq-purple to-primary";
    return "from-muted to-muted-foreground";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-3 h-3" />;
    if (rank <= 3) return <Star className="w-3 h-3" />;
    return <Users className="w-3 h-3" />;
  };

  const getInitials = (friend: Friend) => {
    const first = friend.firstName?.[0] || "";
    const last = friend.lastName?.[0] || "";
    return first + last || "?";
  };

  const getName = (friend: Friend) => {
    const first = friend.firstName || "";
    const last = friend.lastName ? ` ${friend.lastName[0]}.` : "";
    return first + last || "Unknown";
  };

  const handleDragStart = (friend: Friend) => {
    setDraggedFriend(friend);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetFriend: Friend) => {
    if (draggedFriend && onRankChange && draggedFriend.id !== targetFriend.id) {
      // Calculate the new rank based on position in the pyramid
      const targetRank = targetFriend.rank;
      console.log(`Dragging ${draggedFriend.id} (rank ${draggedFriend.rank}) to position of ${targetFriend.id} (rank ${targetRank})`);
      onRankChange(draggedFriend.id, targetRank);
    }
    setDraggedFriend(null);
  };

  // Organize friends into pyramid rows: 1, 2, 3, 4, 5
  const pyramidRows = [
    sortedFriends.slice(0, 1),    // Top: 1 friend (rank 1)
    sortedFriends.slice(1, 3),    // Second: 2 friends (ranks 2-3)
    sortedFriends.slice(3, 6),    // Third: 3 friends (ranks 4-6)
    sortedFriends.slice(6, 10),   // Fourth: 4 friends (ranks 7-10)
    sortedFriends.slice(10, 15)   // Bottom: 5 friends (ranks 11-15)
  ].filter(row => row.length > 0);

  const getRowLabel = (rowIndex: number) => {
    const labels = [
      "👑 Top Friend",
      "⭐ Inner Circle", 
      "💎 Close Friends",
      "👥 Good Friends",
      "🌟 Friends"
    ];
    return labels[rowIndex] || "Friends";
  };

  const getRowColor = (rowIndex: number) => {
    const colors = [
      "text-primary",
      "text-secondary", 
      "text-mykliq-purple",
      "text-mykliq-orange",
      "text-muted-foreground"
    ];
    return colors[rowIndex] || "text-muted-foreground";
  };

  const renderFriend = (friend: Friend) => (
    <div
      key={friend.id}
      draggable
      onDragStart={() => handleDragStart(friend)}
      onDragOver={handleDragOver}
      onDrop={() => handleDrop(friend)}
      className={cn(
        "relative group cursor-move transition-all duration-300",
        "hover:scale-110 hover:z-10",
        draggedFriend?.id === friend.id && "opacity-50"
      )}
    >
      {/* Action buttons - appear on hover */}
      <div className="absolute -top-2 -right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        {onVideoCall && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onVideoCall([friend.id]);
            }}
            className="w-6 h-6 p-0 bg-mykliq-green hover:bg-mykliq-green/90 text-foreground rounded-full shadow-lg"
            data-testid={`button-video-call-${friend.id}`}
          >
            <Phone className="w-3 h-3" />
          </Button>
        )}
        {onMessage && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMessage(friend.id, getName(friend));
            }}
            className="w-6 h-6 p-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg"
            data-testid={`button-message-${friend.id}`}
          >
            <MessageCircle className="w-3 h-3" />
          </Button>
        )}
      </div>
      <div 
        className={cn(
          "p-1 rounded-full bg-gradient-to-r cursor-pointer",
          getRankColor(friend.rank),
          "shadow-lg hover:shadow-xl transition-transform hover:scale-105"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setLocation(`/user/${friend.id}`);
        }}
        data-testid={`friend-avatar-${friend.id}`}
      >
        <Avatar className={cn(
          friend.rank === 1 ? "w-16 h-16" : 
          friend.rank <= 3 ? "w-12 h-12" : 
          friend.rank <= 6 ? "w-10 h-10" : "w-9 h-9",
          "border-2 border-background"
        )}>
          <AvatarImage src={friend.profileImageUrl} />
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
            {getInitials(friend)}
          </AvatarFallback>
        </Avatar>
      </div>
      


      {/* Sparkle effect for top friends */}
      {friend.rank <= 3 && (
        <div className="absolute -top-1 -right-1 text-mykliq-orange animate-pulse">
          ✨
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-primary mb-2">
          🏆 {kliqName || "My Kliq"} 🏆
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          Hover over friends to see actions
        </p>
        <Badge variant="outline" className="border-primary text-primary">
          {friends.length}/{maxFriends} Friends
        </Badge>
      </div>

      {/* Pyramid Rows */}
      {pyramidRows.map((rowFriends, rowIndex) => (
        <div key={rowIndex} className="mb-6">
          <div className="text-center mb-2">
            <Badge variant="secondary" className={cn("text-xs", getRowColor(rowIndex))}>
              {getRowLabel(rowIndex)}
            </Badge>
          </div>
          <div 
            className="flex justify-center gap-3 min-h-[80px] items-center p-2 rounded-lg"
            onDragOver={handleDragOver}
            onDrop={(e) => {
              e.preventDefault();
              // If dropping in an empty area of a row, place at the end of that row
              if (draggedFriend && onRankChange && rowFriends.length > 0) {
                const lastFriendInRow = rowFriends[rowFriends.length - 1];
                const newRank = lastFriendInRow.rank + 1;
                console.log(`Dropping ${draggedFriend.id} at end of row ${rowIndex + 1}, new rank: ${newRank}`);
                onRankChange(draggedFriend.id, Math.min(newRank, maxFriends));
              }
              setDraggedFriend(null);
            }}
          >
            {rowFriends.map(renderFriend)}
            {/* Show empty slots for incomplete rows */}
            {rowIndex === 0 && rowFriends.length === 0 && (
              <div className="w-16 h-16 border-2 border-dashed border-muted-foreground/30 rounded-full flex items-center justify-center text-muted-foreground">
                <Crown className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>
      ))}

      {friends.length < maxFriends && (
        <div className="text-center mt-6">
          <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-bold">
            <Users className="w-4 h-4 mr-2" />
            Invite Friend ({maxFriends - friends.length} spots left)
          </Button>
        </div>
      )}
    </div>
  );
}