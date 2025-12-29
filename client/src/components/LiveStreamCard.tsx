import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Video, 
  Users, 
  MessageCircle, 
  Send,
  X,
  Maximize2,
  Minimize2,
  Heart,
  Star,
  Plus,
  Edit
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getApiBaseUrl, resolveAssetUrl } from "@/lib/apiConfig";

interface LiveStreamCardProps {
  action: {
    id: string;
    title: string;
    description?: string;
    status: "live" | "ended";
    viewerCount: number;
    thumbnailUrl?: string;
    recordingUrl?: string;
    recordingDuration?: number;
    chatEnabled?: boolean;
    createdAt: string;
    likes?: any[];
    commentCount?: number;
    isHighlighted?: boolean;
    author: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
    };
  };
  currentUserId?: string;
}

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function LiveStreamCard({ action, currentUserId }: LiveStreamCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [viewerCount, setViewerCount] = useState(action.viewerCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(action.commentCount || 0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(action.title);
  const [editDescription, setEditDescription] = useState(action.description || "");
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(
    Array.isArray(action.likes) && currentUserId && action.likes.some((like: any) => like.userId === currentUserId)
  );
  const [likeCount, setLikeCount] = useState(Array.isArray(action.likes) ? action.likes.length : 0);
  const [isHighlighted, setIsHighlighted] = useState(action.isHighlighted || false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userData } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: actionComments = [], refetch: refetchComments } = useQuery<any[]>({
    queryKey: [`/api/actions/${action.id}/comments`],
    enabled: action.status === 'ended' && showComments,
  });

  const likeActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiRequest("POST", `/api/actions/${actionId}/like`);
      return response;
    },
    onMutate: async (actionId) => {
      // Optimistic update - toggle like immediately in UI
      const previousLiked = isLiked;
      const previousCount = likeCount;
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      return { previousLiked, previousCount };
    },
    onError: (err, actionId, context: any) => {
      // Rollback on error
      if (context) {
        setIsLiked(context.previousLiked);
        setLikeCount(context.previousCount);
      }
    },
    onSuccess: async () => {
      // Clear cache and refetch for consistency
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
        await enhancedCache.removeByPattern('/api/actions');
        await enhancedCache.removeByPattern('/api/notifications');
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      // Refetch notifications immediately for instant update
      queryClient.refetchQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const deleteActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiRequest("DELETE", `/api/actions/${actionId}`);
      return response;
    },
    onSuccess: () => {
      toast({ title: "Video deleted", description: "Your recording has been removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/actions/my-recordings"] });
    },
  });

  const highlightActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiRequest("POST", `/api/actions/${actionId}/highlight`);
      return response;
    },
    onMutate: async () => {
      setIsHighlighted(true);
      return { previousHighlighted: false };
    },
    onError: (err, actionId, context: any) => {
      if (context) setIsHighlighted(context.previousHighlighted);
      toast({ title: "Error", description: "Failed to highlight video", variant: "destructive" });
    },
    onSuccess: async () => {
      toast({ title: "Highlighted!", description: "Your video will stand out for 6 hours" });
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
    },
  });

  const unhighlightActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiRequest("DELETE", `/api/actions/${actionId}/highlight`);
      return response;
    },
    onMutate: async () => {
      setIsHighlighted(false);
      return { previousHighlighted: true };
    },
    onError: (err, actionId, context: any) => {
      if (context) setIsHighlighted(context.previousHighlighted);
      toast({ title: "Error", description: "Failed to remove highlight", variant: "destructive" });
    },
    onSuccess: async () => {
      toast({ title: "Removed", description: "Video highlight removed" });
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
    },
  });

  const joinActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiRequest("POST", `/api/actions/${actionId}/join`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
    },
  });

  const leaveActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiRequest("POST", `/api/actions/${actionId}/leave`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
    },
  });

  const editActionMutation = useMutation({
    mutationFn: async ({ actionId, title, description }: { actionId: string; title: string; description: string }) => {
      const response = await apiRequest("PUT", `/api/actions/${actionId}`, { title, description });
      return response;
    },
    onSuccess: async () => {
      toast({ title: "Updated", description: "Your video post has been updated" });
      setShowEditDialog(false);
      // Clear cache and refetch immediately
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
        await enhancedCache.removeByPattern('/api/actions');
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/actions/my-recordings"] });
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.refetchQueries({ queryKey: ["/api/actions/my-recordings"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ actionId, content }: { actionId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/actions/${actionId}/comments`, { content });
      return response;
    },
    onMutate: async () => {
      // Optimistic update - increment comment count immediately
      const previousCount = commentCount;
      setCommentCount(prev => prev + 1);
      return { previousCount };
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      if (context?.previousCount !== undefined) {
        setCommentCount(context.previousCount);
      }
    },
    onSuccess: async () => {
      setNewComment("");
      refetchComments();
      // Clear cache and refetch for consistency
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
        await enhancedCache.removeByPattern('/api/notifications');
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      // Refetch notifications immediately for instant update
      queryClient.refetchQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Sync comment count when comments are fetched
  useEffect(() => {
    if (actionComments.length > 0) {
      setCommentCount(actionComments.length);
    }
  }, [actionComments]);

  const saveToScrapbookMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiRequest("POST", `/api/scrapbook/save-action`, { actionId });
      return response;
    },
    onSuccess: async () => {
      toast({ title: "Saved!", description: "Video added to your scrapbook" });
      setIsSaved(true);
      // Clear cache and refetch scrapbook
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/scrapbook');
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/saves'] });
      await queryClient.refetchQueries({ queryKey: ['/api/scrapbook/saves'] });
    },
    onError: (error: any) => {
      if (error.message?.includes('already saved')) {
        toast({ title: "Already saved", description: "This video is already in your scrapbook" });
        setIsSaved(true);
      } else {
        toast({ title: "Error", description: "Failed to save video", variant: "destructive" });
      }
    },
  });

  const setupWebSocket = (actionId: string) => {
    const apiBase = getApiBaseUrl();
    const wsProtocol = apiBase.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${apiBase.replace(/^https?:\/\//, '')}/ws`;
    
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("LiveStreamCard WebSocket connected");
      if (userData) {
        websocket.send(JSON.stringify({
          type: 'join_action',
          actionId,
          userId: userData.id,
        }));
      }
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'chat_message':
            setChatMessages(prev => [...prev, data.message]);
            if (chatScrollRef.current) {
              chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
            }
            break;
          case 'viewer_joined':
          case 'viewer_left':
            setViewerCount(data.viewerCount || 0);
            break;
          case 'action_ended':
            toast({
              title: "Stream Ended",
              description: "This live stream has ended.",
            });
            setIsWatching(false);
            queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
            break;
        }
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    };

    websocket.onclose = () => {
      console.log("LiveStreamCard WebSocket disconnected");
    };

    setWs(websocket);
    return websocket;
  };

  const handleStartWatching = () => {
    setIsWatching(true);
    setIsExpanded(true);
    const websocket = setupWebSocket(action.id);
    
    if (currentUserId && action.author.id !== currentUserId) {
      joinActionMutation.mutate(action.id);
    }
  };

  const handleStopWatching = () => {
    setIsWatching(false);
    setIsExpanded(false);
    if (ws) {
      ws.close();
      setWs(null);
    }
    if (currentUserId && action.author.id !== currentUserId) {
      leaveActionMutation.mutate(action.id);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({
      type: 'chat_message',
      actionId: action.id,
      userId: userData?.id,
      message: chatMessage.trim(),
    }));
    setChatMessage("");
  };

  const handleLike = () => {
    likeActionMutation.mutate(action.id);
  };

  const handleShare = async () => {
    try {
      await apiRequest("POST", `/api/actions/${action.id}/share`);
      toast({ title: "Shared!", description: "Video shared to your feed" });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to share video", variant: "destructive" });
    }
  };

  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  const isLive = action.status === 'live';
  const authorName = action.author?.firstName && action.author?.lastName 
    ? `${action.author.firstName} ${action.author.lastName}` 
    : action.author?.firstName || action.author?.username || 'User';
  const isOwner = currentUserId === action.author.id;

  if (!isLive) {
    return (
      <Card 
        className={cn(
          "mb-4 bg-card border transition-all duration-500",
          isHighlighted 
            ? "fire-border bg-gradient-to-r from-yellow-400/20 via-amber-300/20 to-yellow-400/20" 
            : isOwner 
              ? "border-primary/50" 
              : "border-border"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={resolveAssetUrl(action.author?.profileImageUrl)} />
              <AvatarFallback>{authorName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-bold text-primary">{authorName}</p>
              <p className="text-xs text-muted-foreground">
                {formatTimeAgo(action.createdAt)}
              </p>
            </div>
            
            <Badge variant="secondary" className="bg-gray-200 text-gray-700">
              {action.recordingUrl ? '📹 Video' : 'ENDED'}
            </Badge>

            {/* Plus icon for scrapbook - visible to everyone */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveToScrapbookMutation.mutate(action.id)}
              disabled={isSaved || saveToScrapbookMutation.isPending}
              className={cn(
                "h-8 w-8 p-0 transition-colors",
                isSaved ? "text-green-500" : "text-muted-foreground hover:text-green-500"
              )}
            >
              <Plus className={cn("h-4 w-4", isSaved && "fill-current")} />
            </Button>

            {isOwner && (
              <>
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-500"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Edit Video Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Title</label>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="mt-1"
                          placeholder="Video title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="mt-1"
                          placeholder="Video description"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => editActionMutation.mutate({
                            actionId: action.id,
                            title: editTitle,
                            description: editDescription
                          })}
                          disabled={editActionMutation.isPending}
                        >
                          {editActionMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 transition-colors",
                    isHighlighted 
                      ? "text-yellow-500 hover:text-yellow-600" 
                      : "text-muted-foreground hover:text-yellow-500"
                  )}
                  onClick={() => {
                    if (isHighlighted) {
                      unhighlightActionMutation.mutate(action.id);
                    } else {
                      highlightActionMutation.mutate(action.id);
                    }
                  }}
                  disabled={highlightActionMutation.isPending || unhighlightActionMutation.isPending}
                >
                  <Star className={cn("h-4 w-4", isHighlighted && "fill-current")} />
                </Button>
              </>
            )}
          </div>
          
          <div className="mb-3">
            <h3 className="text-lg font-bold text-foreground">{action.title}</h3>
            {action.description && (
              <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
            )}
          </div>
          
          {action.recordingUrl ? (
            <div className="rounded-lg overflow-hidden bg-black mb-3">
              <video
                src={resolveAssetUrl(action.recordingUrl)}
                controls
                className="w-full aspect-video"
                poster={action.thumbnailUrl ? resolveAssetUrl(action.thumbnailUrl) : undefined}
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
              {action.recordingDuration && action.recordingDuration > 0 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  Duration: {action.recordingDuration} seconds
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center mb-3">
              <div className="text-center text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Recording not available</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLike}
                className={cn(
                  "p-0 h-auto transition-colors",
                  isLiked
                    ? "text-red-500 hover:bg-red-50" 
                    : "text-primary hover:bg-primary/10"
                )}
              >
                <Heart className={cn("w-4 h-4 mr-1", isLiked && "fill-current")} />
                {likeCount}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowComments(!showComments)}
                className="text-secondary hover:bg-secondary/10 p-0 h-auto"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {commentCount}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleShare}
                className="text-mykliq-orange hover:bg-mykliq-orange/10 p-0 h-auto"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="space-y-3">
                {actionComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first to comment!</p>
                ) : (
                  actionComments.map((comment: any) => (
                    <div key={comment.id} className="flex space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.user?.profileImageUrl} />
                        <AvatarFallback>{comment.user?.firstName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold text-foreground">{comment.user?.firstName || 'User'}</span>
                          <span className="text-muted-foreground ml-2">{comment.content}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex space-x-2 mt-3">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newComment.trim()) {
                      addCommentMutation.mutate({ actionId: action.id, content: newComment.trim() });
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (newComment.trim()) {
                      addCommentMutation.mutate({ actionId: action.id, content: newComment.trim() });
                    }
                  }}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mb-4 border-2 border-red-500 bg-gradient-to-br from-red-500/10 to-pink-500/10 transition-all duration-300 ${isExpanded ? 'shadow-xl shadow-red-500/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-red-600 text-white animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
              LIVE
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="w-4 h-4" />
              {viewerCount} watching
            </span>
          </div>
          {isWatching && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
        
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="w-10 h-10 border-2 border-red-500">
            <AvatarImage src={resolveAssetUrl(action.author?.profileImageUrl)} />
            <AvatarFallback>{authorName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{authorName}</p>
            <h3 className="text-lg font-bold text-foreground">{action.title}</h3>
            {action.description && (
              <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
            )}
          </div>
        </div>
        
        {!isWatching ? (
          <div 
            className="bg-black/80 rounded-lg aspect-video flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
            onClick={handleStartWatching}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3 hover:bg-red-500 transition-colors">
                <Video className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-medium">Tap to watch live</p>
              <p className="text-gray-400 text-sm">{authorName} is streaming now</p>
            </div>
          </div>
        ) : (
          <div className={`${isExpanded ? 'space-y-4' : ''}`}>
            <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative">
              <div className="text-center">
                <Video className="w-12 h-12 text-red-500 mx-auto mb-2 animate-pulse" />
                <p className="text-white font-medium">Watching {authorName}'s stream</p>
                <p className="text-gray-400 text-sm">Live video stream</p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStopWatching}
                className="absolute top-2 right-2 text-white hover:bg-red-600/50"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <Badge className="bg-red-600 text-white text-xs">
                  LIVE
                </Badge>
                <span className="text-white text-xs">{viewerCount} viewers</span>
              </div>
            </div>
            
            {isExpanded && action.chatEnabled !== false && (
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2 text-gray-300">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Live Chat</span>
                </div>
                
                <ScrollArea className="h-32 mb-2" ref={chatScrollRef}>
                  <div className="space-y-1">
                    {chatMessages.length === 0 ? (
                      <p className="text-gray-500 text-sm">No messages yet. Say hi!</p>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                          <span className="font-semibold text-pink-400">
                            {msg.user.firstName}:
                          </span>
                          <span className="text-gray-300 ml-2">{msg.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-gray-800 border-gray-700 text-white text-sm"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    disabled={!chatMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-3 text-xs text-muted-foreground">
          Started {new Date(action.createdAt).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
