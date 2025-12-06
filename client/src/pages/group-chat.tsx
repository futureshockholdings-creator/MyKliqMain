import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

interface MessageData {
  id: string;
  content: string;
  senderId: string;
  groupConversationId: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

interface GroupConversationData {
  id: string;
  name?: string;
  createdAt: string;
  messages: MessageData[];
  participants: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  }[];
}

export function GroupChat() {
  const { groupChatId } = useParams<{ groupChatId: string }>();
  const { user } = useAuth() as unknown as { user: User | null };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: groupChat, isLoading } = useQuery<GroupConversationData>({
    queryKey: ["/api/group-chats", groupChatId],
    enabled: !!groupChatId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string }) => {
      return apiRequest("POST", `/api/group-chats/${groupChatId}/messages`, messageData);
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/group-chats", groupChatId] });
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [groupChat?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageText.trim();
    
    if (content) {
      sendMessageMutation.mutate({ content });
    }
  };

  const getDisplayName = (userData: MessageData["sender"]) => {
    if (userData.firstName && userData.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    if (userData.firstName) return userData.firstName;
    return userData.email?.split("@")[0] || "Unknown User";
  };

  const getInitials = (userData: MessageData["sender"]) => {
    if (userData.firstName && userData.lastName) {
      return `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase();
    }
    if (userData.firstName) return userData.firstName[0].toUpperCase();
    return userData.email?.[0]?.toUpperCase() || "U";
  };

  const getGroupDisplayName = () => {
    if (groupChat?.name) {
      return groupChat.name;
    }
    const participantNames = groupChat?.participants
      .map(p => p.firstName || p.email?.split("@")[0] || "User")
      .join(", ");
    return participantNames || "Group Chat";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/kliq">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!groupChat) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/kliq">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Group Chat Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-border bg-card">
          <Link to="/kliq">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-mykliq-green/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-mykliq-green" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground" data-testid="text-group-name">
                {getGroupDisplayName()}
              </h2>
              <p className="text-xs text-muted-foreground" data-testid="text-participant-count">
                {groupChat.participants.length + 1} participants
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {groupChat.messages.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                No messages yet
              </h2>
              <p className="text-muted-foreground">
                Start the conversation!
              </p>
            </div>
          ) : (
            groupChat.messages.map((message) => {
              const isCurrentUser = message.senderId === user?.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                  data-testid={`message-${message.id}`}
                >
                  {!isCurrentUser && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={message.sender.profileImageUrl} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {getInitials(message.sender)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} max-w-[70%]`}>
                    {!isCurrentUser && (
                      <span className="text-xs text-muted-foreground mb-1">
                        {getDisplayName(message.sender)}
                      </span>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isCurrentUser
                          ? "bg-mykliq-green text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 bg-background border-border"
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
            />
            <Button
              type="submit"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="bg-mykliq-green hover:bg-mykliq-green/90 text-white"
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Messages auto-delete after 7 days
          </p>
        </form>
      </div>

      <Footer />
    </div>
  );
}
