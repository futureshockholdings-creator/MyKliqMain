import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

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
  onRemove?: (friendId: string) => void;
  maxFriends?: number;
  kliqName?: string;
  kliqClosed?: boolean;
  onCloseKliq?: () => void;
  isClosingKliq?: boolean;
}

export function PyramidChart({ friends, onRankChange, onMessage, onVideoCall, onRemove, maxFriends = 28, kliqName, kliqClosed, onCloseKliq, isClosingKliq }: PyramidChartProps) {
  const [draggedFriend, setDraggedFriend] = useState<Friend | null>(null);
  const [showRemoveButton, setShowRemoveButton] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState<string | null>(null);
  const [_, setLocation] = useLocation();
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const vibrateTimer = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(holdTimer.current!);
      clearInterval(vibrateTimer.current!);
    };
  }, []);

  // Handle click outside to cancel remove action
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if we're in remove mode
      if (showRemoveButton) {
        const target = event.target as Element;
        // Check if the click is outside any friend avatar or remove button
        const isClickOnFriend = target.closest('[data-testid^="friend-avatar-"]');
        const isClickOnRemoveButton = target.closest('[data-testid^="button-remove-"]');
        
        if (!isClickOnFriend && !isClickOnRemoveButton) {
          // Cancel the remove action
          setShowRemoveButton(null);
          setIsHolding(null);
          clearTimeout(holdTimer.current!);
          clearInterval(vibrateTimer.current!);
          
          // Stop vibration if it was running
          if (navigator.vibrate) {
            navigator.vibrate(0);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRemoveButton]);

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

  // Sort friends by rank for pyramid layout
  const sortedFriends = [...friends].sort((a, b) => a.rank - b.rank);
  
  // Organize friends into pyramid rows: 1, 2, 3, 4, 5, 6, 7 (total: 28)
  const pyramidRows = [
    sortedFriends.slice(0, 1),    // Top: 1 friend (rank 1)
    sortedFriends.slice(1, 3),    // Second: 2 friends (ranks 2-3)
    sortedFriends.slice(3, 6),    // Third: 3 friends (ranks 4-6)
    sortedFriends.slice(6, 10),   // Fourth: 4 friends (ranks 7-10)
    sortedFriends.slice(10, 15),  // Fifth: 5 friends (ranks 11-15)
    sortedFriends.slice(15, 21),  // Sixth: 6 friends (ranks 16-21)
    sortedFriends.slice(21, 28)   // Bottom: 7 friends (ranks 22-28)
  ].filter(row => row.length > 0);

  const handleDragStart = (friend: Friend) => {
    setDraggedFriend(friend);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetFriend: Friend) => {
    if (draggedFriend && onRankChange && draggedFriend.id !== targetFriend.id) {
      const targetRank = targetFriend.rank;
      console.log(`Moving ${draggedFriend.id} (rank ${draggedFriend.rank}) to position of ${targetFriend.id} (rank ${targetRank})`);
      onRankChange(draggedFriend.id, targetRank);
    }
    setDraggedFriend(null);
  };

  const handleHoldStart = (friend: Friend) => {
    if (!onRemove) return;
    
    clearTimeout(holdTimer.current!);
    clearInterval(vibrateTimer.current!);
    
    setIsHolding(friend.id);
    
    holdTimer.current = setTimeout(() => {
      setShowRemoveButton(friend.id);
      
      // Trigger vibration if supported
      if (navigator.vibrate) {
        navigator.vibrate(200); // Initial vibration
      }
      
      // Start continuous vibration every 500ms
      vibrateTimer.current = setInterval(() => {
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      }, 500);
    }, 800); // Hold for 800ms to show remove button
  };

  const handleHoldEnd = () => {
    clearTimeout(holdTimer.current!);
    clearInterval(vibrateTimer.current!);
    setIsHolding(null);
    
    // Stop vibration if it was running
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  const handleRemoveClick = (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(friendId);
    }
    setShowRemoveButton(null);
    setIsHolding(null);
    clearInterval(vibrateTimer.current!);
  };

  const handleAvatarClick = (friend: Friend, e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't navigate if we're in holding/remove mode
    if (isHolding === friend.id || showRemoveButton === friend.id) {
      return;
    }
    setLocation(`/user/${friend.id}`);
  };

  const renderFriend = (friend: Friend) => (
    <div
      key={friend.id}
      draggable
      onDragStart={() => handleDragStart(friend)}
      onDragOver={handleDragOver}
      onDrop={() => handleDrop(friend)}
      className={cn(
        "relative group cursor-move transition-all duration-300 hover:scale-105 flex flex-col items-center",
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
            className="w-8 h-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
            data-testid={`button-video-call-${friend.id}`}
          >
            <Phone className="w-4 h-4" />
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
            className="w-8 h-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg"
            data-testid={`button-message-${friend.id}`}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Remove button - appears on hold */}
      {showRemoveButton === friend.id && onRemove && (
        <div className="absolute -top-2 -left-2 z-30">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => handleRemoveClick(friend.id, e)}
            className="w-8 h-8 p-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full shadow-lg animate-in zoom-in-95 duration-200"
            data-testid={`button-remove-${friend.id}`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div 
        className={cn(
          "p-2 rounded-full bg-gradient-to-r from-primary to-secondary cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200",
          isHolding === friend.id && "animate-pulse scale-110",
          showRemoveButton === friend.id && "animate-bounce"
        )}
        onClick={(e) => handleAvatarClick(friend, e)}
        onMouseDown={() => handleHoldStart(friend)}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={() => handleHoldStart(friend)}
        onTouchEnd={handleHoldEnd}
        data-testid={`friend-avatar-${friend.id}`}
      >
        <Avatar className="w-20 h-20 border-4 border-background">
          <AvatarImage src={friend.profileImageUrl} />
          <AvatarFallback className="bg-muted text-muted-foreground text-lg font-bold">
            {getInitials(friend)}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="text-center mt-3">
        <p className="text-sm font-medium text-foreground truncate max-w-[100px]">
          {getName(friend)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-primary mb-2">
          🏆 {kliqName || "My Kliq"} 🏆
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          Your friendship pyramid
        </p>
        <Badge variant="outline" className="border-primary text-primary">
          {friends.length}/{maxFriends} Friends
        </Badge>
      </div>

      {/* Pyramid Layout */}
      <div className="space-y-6">
        {pyramidRows.map((rowFriends, rowIndex) => (
          <div key={rowIndex} className="flex justify-center">
            <div className={cn(
              "flex gap-4 justify-center items-end",
              rowIndex === 0 && "gap-0", // Top friend gets special spacing
              rowIndex === 1 && "gap-6",
              rowIndex >= 2 && "gap-4"
            )}>
              {rowFriends.map(renderFriend)}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom section with invite and close kliq buttons */}
      <div className="flex justify-between items-center mt-6">
        {/* Invite Friend Button - left side or center if no friends */}
        {friends.length < maxFriends && (
          <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-bold">
            <Users className="w-4 h-4 mr-2" />
            Invite Friend ({maxFriends - friends.length} spots left)
          </Button>
        )}
        
        {/* Spacer when no invite button */}
        {friends.length >= maxFriends && <div />}
        
        {/* Open/Close Kliq Button - right side (only show if user has friends) */}
        {friends.length > 0 && onCloseKliq && (
          <Button 
            variant={kliqClosed ? "default" : "outline"} 
            size="sm"
            onClick={onCloseKliq}
            disabled={isClosingKliq}
            className={kliqClosed 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
            }
            data-testid="button-open-close-kliq"
          >
            {kliqClosed ? (
              <>
                <Users className="w-4 h-4 mr-2" />
                {isClosingKliq ? "Opening..." : "Open Kliq"}
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                {isClosingKliq ? "Closing..." : "Close Kliq"}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}