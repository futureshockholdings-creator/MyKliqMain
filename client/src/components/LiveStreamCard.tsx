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
import { 
  Video, 
  Users, 
  MessageCircle, 
  Send,
  X,
  Maximize2,
  Minimize2
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiConfig";

interface LiveStreamCardProps {
  action: {
    id: string;
    title: string;
    description?: string;
    status: "live" | "ended";
    viewerCount: number;
    thumbnailUrl?: string;
    chatEnabled?: boolean;
    createdAt: string;
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

export function LiveStreamCard({ action, currentUserId }: LiveStreamCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [viewerCount, setViewerCount] = useState(action.viewerCount || 0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userData } = useQuery<any>({
    queryKey: ["/api/auth/user"],
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

  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  const isLive = action.status === 'live';
  const authorName = action.author?.firstName || action.author?.username || 'User';

  if (!isLive) {
    return (
      <Card className="mb-4 border border-gray-500 bg-gray-800/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-gray-600 text-gray-300">
              ENDED
            </Badge>
          </div>
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={action.author?.profileImageUrl} />
              <AvatarFallback>{authorName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{authorName}</p>
              <h3 className="text-lg font-bold text-foreground">{action.title}</h3>
              {action.description && (
                <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Stream ended {new Date(action.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
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
            <AvatarImage src={action.author?.profileImageUrl} />
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
