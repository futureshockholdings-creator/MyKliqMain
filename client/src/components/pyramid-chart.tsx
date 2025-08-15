import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Users } from "lucide-react";
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
  maxFriends?: number;
  kliqName?: string;
}

export function PyramidChart({ friends, onMessage, onVideoCall, maxFriends = 15, kliqName }: PyramidChartProps) {
  const [_, setLocation] = useLocation();

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

  // Organize friends into a simple grid layout
  const friendsPerRow = 4;
  const friendRows = [];
  for (let i = 0; i < friends.length; i += friendsPerRow) {
    friendRows.push(friends.slice(i, i + friendsPerRow));
  }

  const renderFriend = (friend: Friend) => (
    <div
      key={friend.id}
      className="relative group cursor-pointer transition-all duration-300 hover:scale-105 flex flex-col items-center"
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
            className="w-8 h-8 p-0 bg-mykliq-green hover:bg-mykliq-green/90 text-foreground rounded-full shadow-lg"
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
      <div 
        className="p-2 rounded-full bg-gradient-to-r from-primary to-secondary cursor-pointer shadow-lg hover:shadow-xl transition-transform"
        onClick={(e) => {
          e.stopPropagation();
          setLocation(`/user/${friend.id}`);
        }}
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
          👥 {kliqName || "My Kliq"} 👥
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          Your friends in one place
        </p>
        <Badge variant="outline" className="border-primary text-primary">
          {friends.length}/{maxFriends} Friends
        </Badge>
      </div>

      {/* Friend Grid */}
      <div className="space-y-6">
        {friendRows.map((rowFriends, rowIndex) => (
          <div key={rowIndex} className="flex justify-center">
            <div className="flex gap-6 flex-wrap justify-center">
              {rowFriends.map(renderFriend)}
            </div>
          </div>
        ))}
      </div>

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