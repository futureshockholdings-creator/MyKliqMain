import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FilterManager } from "@/components/filter-manager";
import { Heart, MessageCircle, Share, Image as ImageIcon, Smile, Camera, Video, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import { MediaUpload } from "@/components/MediaUpload";

export default function Home() {
  const [newPost, setNewPost] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const userData = user as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
  });

  // Fetch filters
  const { data: filters = [] } = useQuery({
    queryKey: ["/api/filters"],
  });

  // Fetch stories
  const { data: stories = [] } = useQuery({
    queryKey: ["/api/stories"],
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", "/api/posts", { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPost("");
      toast({
        title: "Post created!",
        description: "Your post has been shared with your kliq",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("POST", `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      toast({
        title: "Comment added!",
        description: "Your comment has been posted",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Add filter mutation
  const addFilterMutation = useMutation({
    mutationFn: async (keyword: string) => {
      await apiRequest("POST", "/api/filters", { keyword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Filter added",
        description: "Posts with this keyword will be hidden",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add filter",
        variant: "destructive",
      });
    },
  });

  // Remove filter mutation
  const removeFilterMutation = useMutation({
    mutationFn: async (filterId: string) => {
      await apiRequest("DELETE", `/api/filters/${filterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Filter removed",
        description: "Posts with this keyword will now be visible",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove filter",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (newPost.trim()) {
      createPostMutation.mutate(newPost.trim());
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setNewPost(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleCommentEmojiClick = (postId: string, emoji: string) => {
    setCommentInputs(prev => ({ 
      ...prev, 
      [postId]: (prev[postId] || '') + emoji 
    }));
    setShowCommentEmojiPicker(null);
  };

  const commonEmojis = [
    // Emotions & Reactions
    '😀', '😂', '😍', '😭', '😎', '😊', '🤔', '😴', 
    '❤️', '👍', '👎', '🔥', '💯', '✨', '🎉', '👏',
    // Prayer & Spiritual
    '🙏', '✝️', '🕊️', '☮️', '🤲', '💒',
    // Disapproval & Negative
    '🙄', '😤', '😠', '👎', '❌', '🚫', '🤦', '😒',
    // Sports & Activities
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸',
    '🏋️', '🏊', '🏃', '🚴', '🏆', '🥇', '🎯', '🏟️',
    // Bicycling & Cycling
    '🚴‍♂️', '🚴‍♀️', '🚲', '🛴', '🏁', '🚴', '🚵‍♂️', '🚵‍♀️',
    // Hunting & Outdoors
    '🏹', '🦌', '🐻', '🪓', '🔫', '🎯', '🦆', '🐺',
    // Hiking & Nature
    '🥾', '🎒', '🧭', '⛰️', '🏔️', '🌲', '🌿', '🍃',
    // Cheerleading & Performance
    '📣', '💃', '🤸‍♀️', '🤸‍♂️', '🎭', '⭐', '💫', '🏆',
    // Video Games & Gaming
    '🎮', '🕹️', '👾', '🎯', '🏆', '⚡', '💥', '🔥',
    // Boating & Water Activities
    '⛵', '🚤', '🛥️', '🚢', '🌊', '⚓', '🏖️', '🐠',
    // Holiday Emojis
    // Christmas
    '🎄', '🎅', '🤶', '🎁', '⭐', '❄️', '☃️', '🔔',
    // New Years
    '🎊', '🎉', '🍾', '🥂', '✨', '🎆', '🎇', '🕛',
    // Thanksgiving
    '🦃', '🍂', '🥧', '🌽', '🍁', '🧡', '🙏', '🏠',
    // Halloween
    '🎃', '👻', '🦇', '🕷️', '🍬', '🍭', '💀', '🧙‍♀️',
    // 4th of July
    '🇺🇸', '🎆', '🎇', '🗽', '🦅', '🔴', '⚪', '🔵',
    // Easter
    '🐰', '🥚', '🐣', '🌷', '🌸', '🌺', '✝️', '🌱',
    // Valentine's Day
    '💕', '💖', '💘', '💝', '🌹', '💐', '💌', '😍',
    // St. Patrick's Day
    '🍀', '☘️', '🌈', '🍺', '👒', '💚', '🇮🇪', '🪙',
    // Outdoor Activities
    '🏕️', '⛰️', '🌊', '🏖️', '🎣', '🦅', '🌙', '⭐', 
    '🌞', '🌈', '🔥', '🏞️',
    // Everyday
    '📍', '🏠', '🍕', '☕', '🎵', '📸', '🌟', '💫'
  ];

  const handleLikePost = (postId: string) => {
    likePostMutation.mutate(postId);
  };

  const handleToggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleCommentSubmit = (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (content) {
      addCommentMutation.mutate({ postId, content });
    }
  };

  const handleCommentInputChange = (postId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleSharePost = async (post: any) => {
    const shareData = {
      title: `${post.author.firstName} ${post.author.lastName} on MyKliq`,
      text: post.content || "Check out this post on MyKliq!",
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Post shared!",
          description: "The post has been shared successfully",
        });
      } else {
        // Fallback to clipboard
        const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Link copied!",
          description: "Post link copied to clipboard",
        });
      }
    } catch (error) {
      // Final fallback - copy just the URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "App link copied to clipboard",
        });
      } catch (clipboardError) {
        toast({
          title: "Share failed",
          description: "Unable to share post",
          variant: "destructive",
        });
      }
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-pink-500 text-white";
    if (rank <= 3) return "bg-blue-500 text-white";
    if (rank <= 6) return "bg-orange-500 text-black";
    return "bg-gray-500 text-white";
  };

  const handleMediaUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
  };

  const handleStoryUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
  };

  const handleViewStory = async (storyId: string) => {
    try {
      await apiRequest("POST", `/api/stories/${storyId}/view`);
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    } catch (error: any) {
      console.error("Error viewing story:", error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Post Creation */}
      <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-10 h-10 border-2 border-yellow-400">
              <AvatarImage src={userData?.profileImageUrl} />
              <AvatarFallback className="bg-gray-700 text-white">
                {userData?.firstName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's happening in your kliq?"
              className="flex-1 bg-black/30 text-white placeholder-gray-300 border-none resize-none"
              rows={2}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-yellow-400 hover:bg-yellow-400/10"
                    data-testid="button-emoji-picker"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-1 p-2">
                    {commonEmojis.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
                        onClick={() => handleEmojiClick(emoji)}
                        data-testid={`emoji-${index}`}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-green-400 hover:bg-green-400/10"
                onClick={() => setShowMediaUpload(true)}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-blue-400 hover:bg-blue-400/10"
                onClick={() => setShowStoryUpload(true)}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={handleCreatePost}
              disabled={!newPost.trim() || createPostMutation.isPending}
              className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6"
              style={{ boxShadow: '0 0 15px rgba(255, 20, 147, 0.4)' }}
            >
              {createPostMutation.isPending ? "Posting..." : "Post!"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stories Section */}
      {(stories as any[]).length > 0 && (
        <Card className="bg-gray-800 border-gray-600">
          <CardHeader className="pb-3">
            <h2 className="text-lg font-bold text-white">Stories</h2>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {(stories as any[]).map((story: any) => (
                <div key={story.id} className="flex-shrink-0">
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => handleViewStory(story.id)}
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-full border-3 p-0.5",
                      story.hasViewed ? "border-gray-500" : "border-pink-500"
                    )}>
                      <Avatar className="w-full h-full">
                        <AvatarImage src={story.author.profileImageUrl} />
                        <AvatarFallback className="bg-gray-700 text-white text-sm">
                          {story.author.firstName?.[0] || story.author.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {story.mediaUrl && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        {story.mediaType === 'video' ? (
                          <Video className="w-3 h-3 text-white" />
                        ) : (
                          <ImageIcon className="w-3 h-3 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-center truncate w-16">
                    {story.author.firstName || story.author.email?.split('@')[0]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Toggle */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🚫</span>
              <span className="text-sm font-medium text-blue-400">Content Filters</span>
              <Badge variant="secondary" className="text-xs">
                {(filters as any[]).length} active
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs border-blue-500 text-blue-400 hover:bg-blue-500/10"
            >
              {showFilters ? "Hide" : "Manage"}
            </Button>
          </div>
          {showFilters && (
            <div className="mt-4">
              <FilterManager
                filters={filters as any[]}
                onAddFilter={(keyword) => addFilterMutation.mutate(keyword)}
                onRemoveFilter={(filterId) => removeFilterMutation.mutate(filterId)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {postsLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                    <div className="space-y-1">
                      <div className="w-24 h-4 bg-gray-600 rounded"></div>
                      <div className="w-16 h-3 bg-gray-600 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-gray-600 rounded"></div>
                    <div className="w-3/4 h-4 bg-gray-600 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (posts as any[]).length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">🌟</div>
            <h3 className="text-lg font-bold text-gray-400 mb-2">Your feed is empty</h3>
            <p className="text-gray-500 text-sm mb-4">
              Invite friends to your kliq or create your first post to get started!
            </p>
            <Button
              onClick={() => setNewPost("Hello, MyKliq! 👋")}
              variant="outline"
              className="border-pink-500 text-pink-400 hover:bg-pink-500/10"
            >
              Create your first post
            </Button>
          </CardContent>
        </Card>
      ) : (
        (posts as any[]).map((post: any) => (
          <Card
            key={post.id}
            className={cn(
              "bg-gradient-to-br from-gray-800 to-gray-700 border",
              post.author.id === userData?.id ? "border-purple-500/50" : "border-gray-600"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="w-10 h-10 border-2 border-pink-400">
                  <AvatarImage src={post.author.profileImageUrl} />
                  <AvatarFallback className="bg-gray-700 text-white">
                    {post.author.firstName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-pink-400">
                    {post.author.firstName} {post.author.lastName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatTimeAgo(post.createdAt)}
                  </p>
                </div>
                {post.author.id !== userData?.id && (
                  <Badge className={cn("text-xs font-bold", getRankColor(1))}>
                    #{1} {/* This would be the actual friend rank */}
                  </Badge>
                )}
              </div>
              
              {post.content && <p className="text-white mb-3">{post.content}</p>}
              
              {/* Media Content */}
              {post.mediaUrl && (
                <div className="mb-3 rounded-lg overflow-hidden bg-black/20">
                  {post.mediaType === 'video' ? (
                    <video 
                      src={post.mediaUrl} 
                      controls 
                      className="w-full max-h-96 object-cover"
                      preload="metadata"
                    />
                  ) : (
                    <img 
                      src={post.mediaUrl} 
                      alt="Post media" 
                      className="w-full max-h-96 object-cover"
                    />
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLikePost(post.id)}
                    className="text-pink-400 hover:bg-pink-400/10 p-0 h-auto"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleComments(post.id)}
                    className="text-blue-400 hover:bg-blue-400/10 p-0 h-auto"
                    data-testid={`button-toggle-comments-${post.id}`}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comments?.length || 0}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSharePost(post)}
                    className="text-green-400 hover:bg-green-400/10 p-0 h-auto"
                    data-testid={`button-share-${post.id}`}
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Comments Section */}
              {expandedComments.has(post.id) && (
                <div className="mt-4 border-t border-gray-600 pt-4">
                  {/* Existing Comments */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {post.comments.map((comment: any) => (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="w-8 h-8 border border-gray-600">
                            <AvatarImage src={comment.author?.profileImageUrl} />
                            <AvatarFallback className="bg-gray-700 text-white text-xs">
                              {comment.author?.firstName?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-gray-700 rounded-lg px-3 py-2">
                              <p className="text-sm font-semibold text-blue-400">
                                {comment.author?.firstName} {comment.author?.lastName}
                              </p>
                              <p className="text-sm text-white">{comment.content}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input */}
                  <div className="flex space-x-3">
                    <Avatar className="w-8 h-8 border border-gray-600">
                      <AvatarImage src={userData?.profileImageUrl} />
                      <AvatarFallback className="bg-gray-700 text-white text-xs">
                        {userData?.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex space-x-2">
                        <Textarea
                          value={commentInputs[post.id] || ""}
                          onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-none"
                          rows={2}
                          data-testid={`input-comment-${post.id}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCommentSubmit(post.id);
                            }
                          }}
                        />
                        <div className="flex flex-col justify-end space-y-1">
                          <Popover 
                            open={showCommentEmojiPicker === post.id} 
                            onOpenChange={(open) => setShowCommentEmojiPicker(open ? post.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-yellow-400 hover:bg-yellow-400/10 h-8 w-8 p-0"
                                data-testid={`button-comment-emoji-${post.id}`}
                              >
                                <Smile className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 max-h-64 overflow-y-auto">
                              <div className="grid grid-cols-8 gap-1 p-2">
                                {commonEmojis.map((emoji, index) => (
                                  <Button
                                    key={index}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
                                    onClick={() => handleCommentEmojiClick(post.id, emoji)}
                                    data-testid={`comment-emoji-${post.id}-${index}`}
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            onClick={() => handleCommentSubmit(post.id)}
                            disabled={!commentInputs[post.id]?.trim() || addCommentMutation.isPending}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                            data-testid={`button-submit-comment-${post.id}`}
                          >
                            {addCommentMutation.isPending ? "..." : "Post"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Media Upload Modals */}
      <MediaUpload
        open={showMediaUpload}
        onOpenChange={setShowMediaUpload}
        onSuccess={handleMediaUploadSuccess}
        type="post"
        userId={userData?.id}
      />

      <MediaUpload
        open={showStoryUpload}
        onOpenChange={setShowStoryUpload}
        onSuccess={handleStoryUploadSuccess}
        type="story"
        userId={userData?.id}
      />
    </div>
  );
}
