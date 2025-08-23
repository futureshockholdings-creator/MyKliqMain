import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";

interface ConversationData {
  id: string;
  otherUser: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  lastActivity: string;
}

export function Messages() {
  const { data: conversations = [], isLoading } = useQuery<ConversationData[]>({
    queryKey: ["/api/messages/conversations"],
  });

  const getDisplayName = (user: ConversationData["otherUser"]) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email?.split("@")[0] || "Unknown User";
  };

  const getInitials = (user: ConversationData["otherUser"]) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    return user.email?.[0]?.toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-black dark:text-white">Incognito Messages</h1>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 p-4 rounded-lg border">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-black dark:text-white">Incognito Messages</h1>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No messages yet
            </h2>
            <p className="text-gray-500 dark:text-gray-500">
              Start a conversation with your kliq members
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                to={`/messages/${conversation.otherUser.id}`}
                data-testid={`link-conversation-${conversation.otherUser.id}`}
              >
                <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conversation.otherUser.profileImageUrl} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                      {getInitials(conversation.otherUser)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-black dark:text-white truncate" data-testid={`text-username-${conversation.otherUser.id}`}>
                        {getDisplayName(conversation.otherUser)}
                      </h3>
                      <div className="flex items-center gap-2">
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs" data-testid={`badge-unread-${conversation.otherUser.id}`}>
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400" data-testid={`text-time-${conversation.otherUser.id}`}>
                          {formatDistanceToNow(new Date(conversation.lastActivity), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1" data-testid={`text-last-message-${conversation.otherUser.id}`}>
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}