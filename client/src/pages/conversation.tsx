import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User, Gif, Moviecon } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { MessageMediaPicker } from "@/components/MessageMediaPicker";
import { GifDisplay } from "@/components/GifDisplay";
import { MovieconDisplay } from "@/components/MovieconDisplay";

interface MessageData {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  gifId?: string;
  movieconId?: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  receiver: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  gif?: {
    id: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    title: string;
    height: number | null;
    width: number | null;
    description: string | null;
    url: string;
    thumbnailUrl: string | null;
    tags: string[] | null;
    category: string;
    fileSize: number | null;
    trending: boolean | null;
    featured: boolean | null;
    uploadedBy: string | null;
  };
  moviecon?: {
    id: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    title: string;
    duration: number;
    height: number | null;
    width: number | null;
    description: string | null;
    thumbnailUrl: string | null;
    videoUrl: string;
    tags: string[] | null;
    category: string;
    movieSource: string | null;
    fileSize: number | null;
    trending: boolean | null;
    featured: boolean | null;
    uploadedBy: string | null;
  };
}

interface ConversationData {
  id: string;
  messages: MessageData[];
}

export function Conversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  // For now, treat conversationId as otherUserId - in a real app we'd fetch conversation details
  const otherUserId = conversationId;
  const { user } = useAuth() as { user: User | null };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<{
    type: "gif" | "moviecon" | "image" | "video";
    data: any;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading } = useQuery<ConversationData>({
    queryKey: ["/api/messages/conversation", otherUserId],
    enabled: !!otherUserId,
  });

  // We'll get user info from the conversation messages instead of separate API call

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      content?: string;
      mediaUrl?: string;
      mediaType?: "image" | "video";
      gifId?: string;
      movieconId?: string;
    }) => {
      return apiRequest("POST", `/api/messages/send`, {
        receiverId: otherUserId,
        ...messageData,
      });
    },
    onSuccess: () => {
      setMessageText("");
      setSelectedMedia(null);
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", otherUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
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
  }, [conversation?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageText.trim();
    
    if (content || selectedMedia) {
      const messageData: any = {};
      
      if (content) {
        messageData.content = content;
      }
      
      if (selectedMedia) {
        switch (selectedMedia.type) {
          case "gif":
            messageData.gifId = selectedMedia.data.id;
            break;
          case "moviecon":
            messageData.movieconId = selectedMedia.data.id;
            break;
          case "image":
          case "video":
            messageData.mediaUrl = selectedMedia.data.url;
            messageData.mediaType = selectedMedia.type;
            break;
        }
      }
      
      sendMessageMutation.mutate(messageData);
    }
  };

  const handleGifSelect = (gif: Gif) => {
    setSelectedMedia({ type: "gif", data: gif });
  };

  const handleMovieconSelect = (moviecon: Moviecon) => {
    setSelectedMedia({ type: "moviecon", data: moviecon });
  };

  const handleMediaSelect = (mediaUrl: string, mediaType: "image" | "video") => {
    setSelectedMedia({ type: mediaType, data: { url: mediaUrl } });
  };

  const clearSelectedMedia = () => {
    setSelectedMedia(null);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/messages">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get the other user from the first message if available
  const firstMessage = conversation?.messages?.[0];
  const displayUser = firstMessage && user ? 
    (firstMessage.sender.id === user.id ? firstMessage.receiver : firstMessage.sender) :
    null;

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/messages">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            {displayUser && (
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={displayUser.profileImageUrl} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                    {getInitials(displayUser)}
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-lg font-semibold text-black dark:text-white" data-testid="text-conversation-title">
                  {getDisplayName(displayUser)}
                </h1>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {(!conversation?.messages || conversation.messages.length === 0) ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            conversation.messages.map((message) => {
              const isOwn = user && message.senderId === user.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${message.id}`}
                >
                  <div className={`flex gap-3 max-w-xs lg:max-w-md ${isOwn ? "flex-row-reverse" : ""}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.sender.profileImageUrl} />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs">
                        {getInitials(message.sender)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className={`rounded-lg ${
                          isOwn
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                        }`}
                        data-testid={`text-message-content-${message.id}`}
                      >
                        {/* Text content */}
                        {message.content && (
                          <div className="px-4 py-2">
                            {message.content}
                          </div>
                        )}
                        
                        {/* Media content */}
                        {message.mediaUrl && (
                          <div className="rounded-lg overflow-hidden">
                            {message.mediaType === "image" ? (
                              <img 
                                src={message.mediaUrl} 
                                alt="Shared image" 
                                className="max-w-xs max-h-64 object-cover rounded-lg"
                              />
                            ) : (
                              <video 
                                src={message.mediaUrl} 
                                controls 
                                className="max-w-xs max-h-64 rounded-lg"
                              />
                            )}
                          </div>
                        )}
                        
                        {/* GIF content */}
                        {message.gif && (
                          <div className="rounded-lg overflow-hidden">
                            <GifDisplay gif={message.gif} className="max-w-xs" />
                          </div>
                        )}
                        
                        {/* Moviecon content */}
                        {message.moviecon && (
                          <div className="rounded-lg overflow-hidden">
                            <MovieconDisplay moviecon={message.moviecon} className="max-w-xs" />
                          </div>
                        )}
                      </div>
                      <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white text-black">
        <div className="max-w-2xl mx-auto">
          {/* Selected media preview */}
          {selectedMedia && (
            <div className="mb-3 p-3 bg-gray-100 text-black rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedMedia.type === "gif" && (
                    <>
                      <span className="text-sm font-medium">🎭 GIF selected:</span>
                      <span className="text-sm text-gray-700">{selectedMedia.data.title}</span>
                    </>
                  )}
                  {selectedMedia.type === "moviecon" && (
                    <>
                      <span className="text-sm font-medium">🎬 Moviecon selected:</span>
                      <span className="text-sm text-gray-700">{selectedMedia.data.title}</span>
                    </>
                  )}
                  {(selectedMedia.type === "image" || selectedMedia.type === "video") && (
                    <>
                      <span className="text-sm font-medium">
                        {selectedMedia.type === "image" ? "📷 Photo" : "🎥 Video"} selected
                      </span>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelectedMedia}
                  data-testid="button-clear-media"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <MessageMediaPicker
              onSelectGif={handleGifSelect}
              onSelectMoviecon={handleMovieconSelect}
              onSelectMedia={handleMediaSelect}
            />
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
            />
            <Button
              type="submit"
              disabled={(!messageText.trim() && !selectedMedia) || sendMessageMutation.isPending}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}