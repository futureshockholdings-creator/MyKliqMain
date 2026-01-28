import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { resolveAssetUrl } from "@/lib/apiConfig";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { PageWrapper } from "@/components/PageWrapper";
import { GroupVideoCallButton } from "@/components/GroupVideoCallButton";

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToTop = useRef(false);

  const { data: groupChat, isLoading } = useQuery<GroupConversationData>({
    queryKey: ["/api/group-chats", groupChatId],
    enabled: !!groupChatId,
  });

  // Mark group chat notifications as read when opening the conversation
  useEffect(() => {
    if (groupChatId) {
      // Mark notifications related to this group chat as read
      apiRequest("PATCH", `/api/notifications/mark-read-by-related/${groupChatId}`, {
        types: ["message", "incognito_message"]
      }).then(() => {
        // Invalidate notifications cache to update badge counts
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      }).catch((err) => {
        console.error("Failed to mark group notifications as read:", err);
      });
    }
  }, [groupChatId, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string }) => {
      return apiRequest("POST", `/api/group-chats/${groupChatId}/messages`, messageData);
    },
    onMutate: async (newMessage) => {
      setMessageText("");
      
      await queryClient.cancelQueries({ queryKey: ["/api/group-chats", groupChatId] });
      
      const previousData = queryClient.getQueryData<GroupConversationData>(["/api/group-chats", groupChatId]);
      const tempId = `temp-${Date.now()}`;
      
      if (previousData && user) {
        const optimisticMessage: MessageData = {
          id: tempId,
          content: newMessage.content,
          senderId: String(user.id),
          groupConversationId: groupChatId!,
          isRead: true,
          createdAt: new Date().toISOString(),
          sender: {
            id: String(user.id),
            email: user.email || "",
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            profileImageUrl: user.profileImageUrl || undefined,
          },
        };
        
        queryClient.setQueryData<GroupConversationData>(["/api/group-chats", groupChatId], {
          ...previousData,
          messages: [...previousData.messages, optimisticMessage],
        });
      }
      
      setTimeout(() => scrollToTop(), 50);
      
      return { previousData, tempId };
    },
    onSuccess: (serverMessage: any, _, context) => {
      const currentData = queryClient.getQueryData<GroupConversationData>(["/api/group-chats", groupChatId]);
      
      if (currentData && context?.tempId && serverMessage) {
        const realMessage: MessageData = {
          id: String(serverMessage.id),
          content: serverMessage.content || "",
          senderId: String(serverMessage.senderId),
          groupConversationId: groupChatId!,
          isRead: true,
          createdAt: serverMessage.createdAt || new Date().toISOString(),
          sender: serverMessage.sender || (user ? {
            id: String(user.id),
            email: user.email || "",
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            profileImageUrl: user.profileImageUrl || undefined,
          } : undefined),
        };
        
        queryClient.setQueryData<GroupConversationData>(["/api/group-chats", groupChatId], {
          ...currentData,
          messages: currentData.messages.map(msg => 
            msg.id === context.tempId ? realMessage : msg
          ),
        });
      }
      scrollToTop();
    },
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/group-chats", groupChatId], context.previousData);
      }
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scrollToTop = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  };

  // Scroll to top on initial page load (newest messages are at top)
  useEffect(() => {
    if (groupChat && !hasScrolledToTop.current) {
      scrollToTop();
      window.scrollTo(0, 0);
      hasScrolledToTop.current = true;
    }
  }, [groupChat]);

  // Reset scroll flag when navigating to a different chat
  useEffect(() => {
    hasScrolledToTop.current = false;
  }, [groupChatId]);

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
      <PageWrapper className="bg-background text-foreground p-4">
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
      </PageWrapper>
    );
  }

  if (!groupChat) {
    return (
      <PageWrapper className="bg-background text-foreground p-4">
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
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="bg-background text-foreground">
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
          
          {user && groupChatId && (
            <GroupVideoCallButton
              participants={groupChat.participants}
              currentUserId={user.id}
              groupName={getGroupDisplayName()}
              groupId={groupChatId}
            />
          )}
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
            [...groupChat.messages].reverse().map((message) => {
              const isCurrentUser = String(message.senderId) === String(user?.id);
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                  data-testid={`message-${message.id}`}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={resolveAssetUrl(message.sender.profileImageUrl)} />
                    <AvatarFallback className={`text-xs ${isCurrentUser ? "bg-mykliq-green/20 text-mykliq-green" : "bg-blue-100 text-blue-600"}`}>
                      {getInitials(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} max-w-[70%]`}>
                    <span className={`text-xs mb-1 ${isCurrentUser ? "text-mykliq-green" : "text-muted-foreground"}`}>
                      {isCurrentUser ? "You" : getDisplayName(message.sender)}
                    </span>
                    <div className="rounded-lg px-4 py-2 bg-white text-black">
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
              className="flex-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
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
    </PageWrapper>
  );
}
