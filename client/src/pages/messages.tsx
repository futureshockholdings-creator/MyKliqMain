import { type MouseEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, ArrowLeft, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageWrapper } from "@/components/PageWrapper";
import { resolveAssetUrl } from "@/lib/apiConfig";
import { enterpriseFetch } from "@/lib/enterprise/enterpriseFetch";
import { useToast } from "@/hooks/use-toast";
import { enhancedCache } from "@/lib/enterprise/enhancedCache";

interface UserData {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface IndividualConversation {
  id: string;
  type: 'individual';
  otherUser: UserData;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  lastActivity: string;
}

interface GroupConversation {
  id: string;
  type: 'group';
  groupName: string;
  participants: UserData[];
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  lastActivity: string;
}

type ConversationData = IndividualConversation | GroupConversation;

export function Messages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: conversations = [], isLoading } = useQuery<ConversationData[]>({
    queryKey: ["/api/messages/conversations"],
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async ({ conversation }: { conversation: ConversationData }) => {
      if (conversation.type === 'group') {
        return enterpriseFetch(`/api/group-chats/${conversation.id}`, { method: 'DELETE' });
      } else {
        const otherUserId = (conversation as IndividualConversation).otherUser.id;
        return enterpriseFetch(`/api/messages/conversation/${otherUserId}`, { method: 'DELETE' });
      }
    },
    onMutate: async ({ conversation }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/messages/conversations"] });
      const previousConversations = queryClient.getQueryData<ConversationData[]>(["/api/messages/conversations"]);
      queryClient.setQueryData<ConversationData[]>(["/api/messages/conversations"], (old) =>
        (old || []).filter(c => c.id !== conversation.id)
      );
      return { previousConversations };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(["/api/messages/conversations"], context.previousConversations);
      }
      toast({ title: "Failed to delete conversation", variant: "destructive" });
    },
    onSuccess: () => {
      enhancedCache.removeByPattern('/api/messages');
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      toast({ title: "Conversation deleted" });
    },
  });

  const handleDelete = (e: MouseEvent<HTMLButtonElement>, conversation: ConversationData) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConversationMutation.mutate({ conversation });
  };

  const getDisplayName = (user: UserData) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email?.split("@")[0] || "Unknown User";
  };

  const getInitials = (user: UserData) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const getGroupInitials = (groupName: string) => {
    const words = groupName.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return groupName.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <PageWrapper className="bg-background text-foreground p-4">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Incognito Messages</h1>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-white text-black h-20 w-96">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="bg-background text-foreground p-4">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Incognito Messages</h1>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              No messages yet
            </h2>
            <p className="text-muted-foreground">
              Start a conversation with your kliq members
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const isGroup = conversation.type === 'group';
              const linkTo = isGroup 
                ? `/group-chat/${conversation.id}`
                : `/messages/${(conversation as IndividualConversation).otherUser.id}`;
              const testId = isGroup 
                ? `link-group-${conversation.id}`
                : `link-conversation-${(conversation as IndividualConversation).otherUser.id}`;
              
              return (
                <Link
                  key={conversation.id}
                  to={linkTo}
                  data-testid={testId}
                >
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-white text-black hover:bg-gray-50 transition-colors cursor-pointer">
                    {isGroup ? (
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                    ) : (
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={resolveAssetUrl((conversation as IndividualConversation).otherUser.profileImageUrl)} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials((conversation as IndividualConversation).otherUser)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <h3 className="font-semibold text-black truncate max-w-[120px] sm:max-w-[180px]" data-testid={isGroup ? `text-groupname-${conversation.id}` : `text-username-${(conversation as IndividualConversation).otherUser.id}`}>
                            {isGroup 
                              ? (conversation as GroupConversation).groupName 
                              : getDisplayName((conversation as IndividualConversation).otherUser)}
                          </h3>
                          {isGroup && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 flex-shrink-0">
                              Group
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500 whitespace-nowrap" data-testid={`text-time-${conversation.id}`}>
                            {formatDistanceToNow(new Date(conversation.lastActivity), { addSuffix: true })}
                          </span>
                          <button
                            className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                            onClick={(e) => handleDelete(e, conversation)}
                            disabled={deleteConversationMutation.isPending}
                            data-testid={`btn-delete-${conversation.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate mt-1" data-testid={`text-last-message-${conversation.id}`}>
                          {conversation.lastMessage.content}
                        </p>
                      )}
                      
                      {isGroup && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {(conversation as GroupConversation).participants.length} members
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
