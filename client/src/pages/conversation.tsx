import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { resolveAssetUrl } from "@/lib/apiConfig";
import { useAuth } from "@/hooks/useAuth";
import type { User, Meme, Moviecon } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { MessageMediaPicker } from "@/components/MessageMediaPicker";
import { MemeDisplay } from "@/components/MemeDisplay";
import { MovieconDisplay } from "@/components/MovieconDisplay";
import { PageWrapper } from "@/components/PageWrapper";

interface MessageData {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  memeId?: string;
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
  meme?: {
    id: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    title: string;
    height: number | null;
    width: number | null;
    description: string | null;
    imageUrl: string;
    thumbnailUrl: string | null;
    tags: string[] | null;
    category: string;
    fileSize: number | null;
    isAnimated: boolean | null;
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
  const { user } = useAuth() as unknown as { user: User | null };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<{
    type: "meme" | "moviecon" | "image" | "video";
    data: any;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading } = useQuery<ConversationData>({
    queryKey: ["/api/messages/conversation", otherUserId],
    enabled: !!otherUserId,
    staleTime: 5000, // Consider data stale after 5 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // We'll get user info from the conversation messages instead of separate API call

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      content?: string;
      mediaUrl?: string;
      mediaType?: "image" | "video";
      memeId?: string;
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
      queryClient.refetchQueries({ queryKey: ["/api/messages/conversation", otherUserId] });
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
          case "meme":
            // MEMEs come from the memes table, so use memeId
            messageData.memeId = selectedMedia.data.id;
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

  const handleMemeSelect = (meme: Meme) => {
    setSelectedMedia({ type: "meme", data: meme });
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
      <PageWrapper className="bg-background text-foreground p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/messages">
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

  // Get the other user from the first message if available
  const firstMessage = conversation?.messages?.[0];
  const displayUser = firstMessage && user ? 
    (firstMessage.sender.id === user.id ? firstMessage.receiver : firstMessage.sender) :
    null;

  return (
    <PageWrapper className="bg-background text-foreground">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="border-b border-border p-4 bg-background">
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
                    <AvatarImage src={resolveAssetUrl(displayUser.profileImageUrl)} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getInitials(displayUser)}
                    </AvatarFallback>
                  </Avatar>
                  <h1 className="text-lg font-semibold text-foreground" data-testid="text-conversation-title">
                    {getDisplayName(displayUser)}
                  </h1>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Input - at top */}
        <div className="border-b border-border p-4 bg-background">
          <div className="max-w-2xl mx-auto">
            {/* Selected media preview */}
            {selectedMedia && (
              <div className="mb-3 p-3 bg-white text-black rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedMedia.type === "meme" && (
                      <>
                        <span className="text-sm font-medium">😂 MEME selected:</span>
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
                onSelectMeme={handleMemeSelect}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-background">
        <div className="max-w-2xl mx-auto space-y-4">
          {(!conversation?.messages || conversation.messages.length === 0) ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
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
                      <AvatarImage src={resolveAssetUrl(message.sender.profileImageUrl)} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {getInitials(message.sender)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className={`rounded-lg ${
                          isOwn
                            ? "bg-white text-black"
                            : "bg-white text-black"
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
                                src={resolveAssetUrl(message.mediaUrl)} 
                                alt="Shared image" 
                                className="max-w-xs max-h-64 object-cover rounded-lg"
                              />
                            ) : (
                              <video 
                                src={resolveAssetUrl(message.mediaUrl)} 
                                controls 
                                className="max-w-xs max-h-64 rounded-lg"
                              />
                            )}
                          </div>
                        )}
                        
                        {/* MEME/GIF content */}
                        {(message.meme || message.gif) && (
                          <div className="rounded-lg overflow-hidden">
                            <MemeDisplay meme={message.meme || message.gif} className="max-w-xs" />
                          </div>
                        )}
                        
                        {/* Moviecon content */}
                        {message.moviecon && (
                          <div className="rounded-lg overflow-hidden">
                            <MovieconDisplay moviecon={message.moviecon} className="max-w-xs" />
                          </div>
                        )}
                      </div>
                      <div className={`text-xs text-muted-foreground mt-1 ${isOwn ? "text-right" : "text-left"}`}>
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
      </div>
    </PageWrapper>
  );
}