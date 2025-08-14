import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, Star, MessageCircle, Video } from "lucide-react";
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
}

export function PyramidChart({ friends, onRankChange, onMessage, onVideoCall, maxFriends = 15 }: PyramidChartProps) {
  const [draggedFriend, setDraggedFriend] = useState<Friend | null>(null);

  const sortedFriends = [...friends].sort((a, b) => a.rank - b.rank);
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-pink-500 to-purple-600";
    if (rank <= 3) return "from-blue-500 to-green-500";
    if (rank <= 6) return "from-orange-500 to-yellow-500";
    return "from-gray-500 to-gray-600";
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
    if (draggedFriend && onRankChange) {
      onRankChange(draggedFriend.id, targetFriend.rank);
    }
    setDraggedFriend(null);
  };

  const renderPyramidLevel = (levelFriends: Friend[], levelName: string) => (
    <div className="flex justify-center gap-2 mb-6">
      {levelFriends.map((friend) => (
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
                className="w-6 h-6 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg"
                data-testid={`button-video-call-${friend.id}`}
              >
                <Video className="w-3 h-3" />
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
                className="w-6 h-6 p-0 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg"
                data-testid={`button-message-${friend.id}`}
              >
                <MessageCircle className="w-3 h-3" />
              </Button>
            )}
          </div>
          <div className={cn(
            "p-1 rounded-full bg-gradient-to-r",
            getRankColor(friend.rank),
            "shadow-lg hover:shadow-xl"
          )}>
            <Avatar className={cn(
              friend.rank === 1 ? "w-16 h-16" : 
              friend.rank <= 3 ? "w-12 h-12" : "w-10 h-10",
              "border-2 border-white"
            )}>
              <AvatarImage src={friend.profileImageUrl} />
              <AvatarFallback className="bg-gray-700 text-white text-xs">
                {getInitials(friend)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="text-center mt-2">
            <p className={cn(
              "font-bold text-xs truncate max-w-16",
              friend.rank === 1 ? "text-pink-400" :
              friend.rank <= 3 ? "text-blue-400" :
              friend.rank <= 6 ? "text-orange-400" : "text-gray-400"
            )}>
              {getName(friend)}
            </p>
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs px-1 py-0 mt-1",
                friend.rank === 1 ? "bg-pink-500 text-white" :
                friend.rank <= 3 ? "bg-blue-500 text-white" :
                friend.rank <= 6 ? "bg-orange-500 text-black" : "bg-gray-500 text-white"
              )}
            >
              {getRankIcon(friend.rank)}
              {friend.rank === 1 ? "BFF" : `#${friend.rank}`}
            </Badge>
          </div>

          {/* Sparkle effect for top friends */}
          {friend.rank <= 3 && (
            <div className="absolute -top-1 -right-1 text-yellow-300 animate-pulse">
              ✨
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-pink-400 mb-2">
          🏆 Kliq Pyramid 🏆
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Drag friends to reorder your pyramid
        </p>
        <Badge variant="outline" className="border-blue-500 text-blue-400">
          {friends.length}/{maxFriends} Friends
        </Badge>
      </div>

      {/* Best Friend - Level 1 */}
      {sortedFriends.filter(f => f.rank === 1).length > 0 && (
        <div>
          <h4 className="text-center text-pink-400 font-bold mb-3">👑 Best Friend</h4>
          {renderPyramidLevel(sortedFriends.filter(f => f.rank === 1), "Best Friend")}
        </div>
      )}

      {/* Close Friends - Level 2-3 */}
      {sortedFriends.filter(f => f.rank >= 2 && f.rank <= 3).length > 0 && (
        <div>
          <h4 className="text-center text-blue-400 font-bold mb-3">⭐ Close Friends</h4>
          {renderPyramidLevel(sortedFriends.filter(f => f.rank >= 2 && f.rank <= 3), "Close Friends")}
        </div>
      )}

      {/* Good Friends - Level 4-6 */}
      {sortedFriends.filter(f => f.rank >= 4 && f.rank <= 6).length > 0 && (
        <div>
          <h4 className="text-center text-orange-400 font-bold mb-3">👥 Good Friends</h4>
          {renderPyramidLevel(sortedFriends.filter(f => f.rank >= 4 && f.rank <= 6), "Good Friends")}
        </div>
      )}

      {/* Other Friends - Level 7+ */}
      {sortedFriends.filter(f => f.rank >= 7).length > 0 && (
        <div>
          <h4 className="text-center text-gray-400 font-bold mb-3">🌟 Friends</h4>
          <div className="grid grid-cols-4 gap-3 justify-center">
            {sortedFriends.filter(f => f.rank >= 7).map((friend) => (
              <div
                key={friend.id}
                draggable
                onDragStart={() => handleDragStart(friend)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(friend)}
                className="relative group text-center cursor-move hover:scale-105 transition-transform"
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
                      className="w-6 h-6 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg"
                      data-testid={`button-video-call-${friend.id}`}
                    >
                      <Video className="w-3 h-3" />
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
                      className="w-6 h-6 p-0 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg"
                      data-testid={`button-message-${friend.id}`}
                    >
                      <MessageCircle className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="p-1 rounded-full bg-gradient-to-r from-gray-500 to-gray-600">
                  <Avatar className="w-8 h-8 border border-white">
                    <AvatarImage src={friend.profileImageUrl} />
                    <AvatarFallback className="bg-gray-700 text-white text-xs">
                      {getInitials(friend)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate max-w-16">
                  {getName(friend)}
                </p>
                <Badge variant="secondary" className="text-xs px-1 py-0 bg-gray-500 text-white">
                  #{friend.rank}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {friends.length < maxFriends && (
        <div className="text-center mt-6">
          <Button className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-bold">
            <Users className="w-4 h-4 mr-2" />
            Invite Friend ({maxFriends - friends.length} spots left)
          </Button>
        </div>
      )}
    </div>
  );
}
