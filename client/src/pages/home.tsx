import { useState, useEffect, useRef } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BorderedAvatar } from "@/components/BorderedAvatar";
import { Badge } from "@/components/ui/badge";
import { FilterManager } from "@/components/filter-manager";
import { Heart, MessageCircle, Send, Image as ImageIcon, Smile, Camera, Clapperboard, Plus, MapPin, Loader2, Edit, Calendar, Clock, Check, HelpCircle, X, Zap, ExternalLink, Video, AlertTriangle, PlusCircle, Trash2, Star } from "lucide-react";
import { SiX, SiFacebook, SiInstagram, SiTiktok, SiYoutube, SiTwitch, SiDiscord, SiReddit, SiPinterest } from "react-icons/si";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { resolveAssetUrl, resolveProfileImageUrl } from "@/lib/apiConfig";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import { MediaUpload } from "@/components/MediaUpload";
import { PyramidChart } from "@/components/pyramid-chart";
import { MemePicker } from "@/components/MemePicker";
import { MemeDisplay } from "@/components/MemeDisplay";
import { MovieconPicker } from "@/components/MovieconPicker";
import { MovieconDisplay } from "@/components/MovieconDisplay";
import { YouTubeEmbedList } from "@/components/YouTubeEmbed";
import { extractYouTubeUrlsFromText } from "@/lib/youtubeUtils";
import { PollCard } from "@/components/PollCard";
import { SponsoredAd } from "@/components/SponsoredAd";
import { GoogleSearch } from "@/components/GoogleSearch";
import { EventCard } from "@/components/EventCard";
import { MoodBoostCard } from "@/components/MoodBoostCard";
import { SportsCarousel } from "@/components/SportsCarousel";
import { LiveStreamCard } from "@/components/LiveStreamCard";
import { trackMobileEvent } from "@/lib/mobileAnalytics";
import { PageWrapper } from "@/components/PageWrapper";
import { PullToRefresh } from "@/components/PullToRefresh";
import { usePostTranslation } from "@/lib/translationService";
import { feedRealtimeService } from "@/lib/feedRealtime";
import { enterpriseFetch } from "@/lib/enterprise/enterpriseFetch";
import { addOptimisticNotification, rollbackOptimisticNotification } from "@/lib/optimisticNotifications";
import { LinkifyText } from "@/components/LinkifyText";
import { ImageGallery } from "@/components/ImageGallery";
import { ImageViewer } from "@/components/ImageViewer";
import { VideoThumbnail } from "@/components/VideoThumbnail";

import type { Meme, Moviecon } from "@shared/schema";

// Edit Post Form Component
function EditPostForm({ post, onUpdate, onOptimisticDelete }: { post: any; onUpdate: () => void; onOptimisticDelete?: (postId: string) => void }) {
  const [editContent, setEditContent] = useState(post.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Post content cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/posts/${post.id}`, {
        content: editContent
      });

      toast({
        title: "Post Updated",
        description: "Your post has been successfully updated.",
        className: "bg-white text-black border-gray-300",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setShowDeleteDialog(false);
    
    // Optimistically remove from UI immediately
    if (onOptimisticDelete) {
      onOptimisticDelete(post.id);
    }
    
    toast({
      title: "Post Deleted",
      description: "Your post has been successfully deleted.",
      className: "bg-white text-black border-gray-300",
    });
    
    // Fire API call in background
    try {
      await apiRequest("DELETE", `/api/posts/${post.id}`);
    } catch (error) {
      console.error('Error deleting post:', error);
      // Rollback by refetching if delete fails
      onUpdate();
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        placeholder="What's on your mind?"
        className="min-h-[120px] bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
        data-testid="textarea-edit-post"
      />
      <div className="flex gap-2 justify-between">
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isDeleting || isSubmitting}
              className="text-white"
              data-testid="button-delete-post"
            >
              Delete Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Confirm Delete</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="border-border text-foreground"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-white"
                data-testid="button-confirm-delete"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditContent(post.content || '')}
            disabled={isSubmitting || isDeleting}
            className="border-border text-foreground"
          >
            Reset
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isSubmitting || isDeleting || !editContent.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="button-update-post"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Post"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Edit Comment Form Component
function EditCommentForm({ comment, onUpdate }: { comment: any; onUpdate: () => void }) {
  const [editContent, setEditContent] = useState(comment.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Comment content cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/comments/${comment.id}`, {
        content: editContent
      });

      toast({
        title: "Comment Updated",
        description: "Your comment has been successfully updated.",
        className: "bg-white text-black border-gray-300",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/comments/${comment.id}`);

      toast({
        title: "Comment Deleted",
        description: "Your comment has been successfully deleted.",
        className: "bg-white text-black border-gray-300",
      });

      setShowDeleteDialog(false);
      onUpdate();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        placeholder="Edit your comment..."
        className="min-h-[100px] bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
        data-testid="textarea-edit-comment"
      />
      <div className="flex gap-2 justify-between">
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isDeleting || isSubmitting}
              className="text-white"
              data-testid="button-delete-comment"
            >
              Delete Comment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Confirm Delete</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="border-border text-foreground"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-white"
                data-testid="button-confirm-delete-comment"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditContent(comment.content || '')}
            disabled={isSubmitting || isDeleting}
            className="border-border text-foreground"
          >
            Reset
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isSubmitting || isDeleting || !editContent.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="button-update-comment"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Comment"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [newPost, setNewPost] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingToComment, setReplyingToComment] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [commentMemes, setCommentMemes] = useState<Record<string, Meme | null>>({});
  const [selectedMoviecon, setSelectedMoviecon] = useState<Moviecon | null>(null);
  const [commentMoviecons, setCommentMoviecons] = useState<Record<string, Moviecon | null>>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedPostToShare, setSelectedPostToShare] = useState<any>(null);
  const [address, setAddress] = useState('');
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showReflectDialog, setShowReflectDialog] = useState(false);
  const [reflectionData, setReflectionData] = useState<any>(null);
  const [showHoroscopeDialog, setShowHoroscopeDialog] = useState(false);
  const [horoscopeData, setHoroscopeData] = useState<any>(null);
  const [showBibleVerseDialog, setShowBibleVerseDialog] = useState(false);
  const [bibleVerseData, setBibleVerseData] = useState<any>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedPostToReport, setSelectedPostToReport] = useState<any>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isPostingHoroscope, setIsPostingHoroscope] = useState(false);
  const [isPostingBibleVerse, setIsPostingBibleVerse] = useState(false);
  
  // Scrapbook state
  const [showSavePostDialog, setShowSavePostDialog] = useState(false);
  const [selectedPostToSave, setSelectedPostToSave] = useState<any>(null);
  const [selectedMediaUrlToSave, setSelectedMediaUrlToSave] = useState<string | null>(null);
  const [showSaveCommentDialog, setShowSaveCommentDialog] = useState(false);
  const [selectedCommentToSave, setSelectedCommentToSave] = useState<any>(null);
  const [saveAlbumId, setSaveAlbumId] = useState<string>("none");
  const [saveNote, setSaveNote] = useState("");
  const [showCreateAlbumDialog, setShowCreateAlbumDialog] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumColor, setNewAlbumColor] = useState("#FF1493");
  const [editingAlbum, setEditingAlbum] = useState<any>(null);
  const [showEditAlbumDialog, setShowEditAlbumDialog] = useState(false);
  const [editAlbumName, setEditAlbumName] = useState("");
  const [editAlbumColor, setEditAlbumColor] = useState("#FF1493");
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState<string | null>(null);
  const [editingSaveNote, setEditingSaveNote] = useState<any>(null);
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false);
  const [editNoteText, setEditNoteText] = useState("");
  const [showUnsaveDialog, setShowUnsaveDialog] = useState(false);
  const [postToUnsave, setPostToUnsave] = useState<any>(null);
  const [reflectTab, setReflectTab] = useState("reflection");
  
  // Full-screen image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerMedia, setImageViewerMedia] = useState<Array<{ id?: string; mediaUrl: string; mediaType: "image" | "video"; displayOrder?: number }>>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const userData = user as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { translatePost, translateMoodText } = usePostTranslation();

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [authLoading, isAuthenticated]);

  // Add click outside to close comments
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close all expanded comments when clicking outside
      if (!event.target || !(event.target as Element).closest('.comments-section')) {
        setExpandedComments(new Set());
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Real-time feed updates via WebSocket
  useEffect(() => {
    // Only connect if user is authenticated
    if (userData?.id) {
      feedRealtimeService.connect(userData.id);

      // Handle page visibility for mobile battery optimization
      const handleVisibilityChange = () => {
        if (document.hidden) {
          feedRealtimeService.pause();
        } else {
          feedRealtimeService.resume(userData.id);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        feedRealtimeService.disconnect();
      };
    }
  }, [userData?.id]);

  // Predefined mood options
  const moodOptions = [
    { emoji: "😊", label: "Happy", color: "text-yellow-500" },
    { emoji: "😢", label: "Sad", color: "text-blue-500" },
    { emoji: "😎", label: "Cool", color: "text-purple-500" },
    { emoji: "😴", label: "Tired", color: "text-gray-500" },
    { emoji: "😤", label: "Frustrated", color: "text-red-500" },
    { emoji: "🤔", label: "Thoughtful", color: "text-green-500" },
    { emoji: "🥳", label: "Excited", color: "text-pink-500" },
    { emoji: "😌", label: "Peaceful", color: "text-teal-500" },
    { emoji: "🤗", label: "Grateful", color: "text-orange-500" },
    { emoji: "😍", label: "In Love", color: "text-rose-500" },
    { emoji: "🤪", label: "Silly", color: "text-indigo-500" },
    { emoji: "💪", label: "Motivated", color: "text-amber-500" },
    { emoji: "😰", label: "Anxious", color: "text-yellow-600" },
    { emoji: "🥺", label: "Nostalgic", color: "text-blue-400" },
    { emoji: "😠", label: "Irritable", color: "text-red-600" },
    { emoji: "💔", label: "Broken Hearted", color: "text-red-400" },
    { emoji: "🤷", label: "Confused", color: "text-gray-600" },
    { emoji: "😕", label: "Lost", color: "text-slate-500" },
    { emoji: "🙏", label: "Blessed", color: "text-emerald-500" },
    { emoji: "🍀", label: "Lucky", color: "text-green-400" },
    { emoji: "😶", label: "Numb", color: "text-stone-500" }
  ];

  // Fetch paginated kliq feed with infinite scroll
  const {
    data: feedData,
    isLoading: feedLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchFeed
  } = useInfiniteQuery({
    queryKey: ["/api/kliq-feed"],
    queryFn: async ({ pageParam = 1 }) => {
      // Use apiRequest to include JWT auth header
      return await apiRequest("GET", `/api/kliq-feed?page=${pageParam}&limit=100`);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 300000,
    refetchOnWindowFocus: true, // Refresh immediately when user returns to app
    refetchInterval: 15000, // Poll every 15 seconds for new posts
    refetchIntervalInBackground: false, // Don't poll when tab is hidden (saves battery/bandwidth)
  });
  
  // Extract and flatten feed items from all pages (with null safety)
  const feedItems = feedData?.pages.flatMap(page => page?.items ?? []) || [];

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Guard against duplicate fetches while already loading
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // Prefetch 200px before reaching the sentinel
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fetch targeted ads for the user
  const { data: targetedAds = [] } = useQuery({
    queryKey: ["/api/ads/targeted"],
  });

  // Fetch mood boost posts
  const { data: moodBoostPosts = [] } = useQuery({
    queryKey: ["/api/mood-boost/posts"],
    staleTime: 0, // Always fetch fresh data - mood boosts change frequently
    refetchInterval: 10000, // Refetch every 10 seconds to catch new mood posts
    refetchOnWindowFocus: true, // Refetch when user returns to app
  });

  // Fetch sports updates - bypass enhanced cache to always get fresh data after preference changes
  const { data: sportsUpdates = [] } = useQuery({
    queryKey: ["/api/sports/updates"],
    queryFn: () => enterpriseFetch("/api/sports/updates", { skipCache: true }),
    staleTime: 60000, // Consider data fresh for 1 minute (reduced from 5 mins for faster preference updates)
    refetchInterval: 300000, // Refetch every 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to app
  });

  // Create combined feed by merging mood boosts and sports updates with feed items
  // Mood boosts are treated like regular posts and sorted by createdAt
  const moodBoostsArray = Array.isArray(moodBoostPosts) ? moodBoostPosts : [];
  const normalizedMoodBoosts = moodBoostsArray
    .filter((boost: any) => boost.createdAt || boost.timestamp) // Only include items with valid timestamps
    .map((boost: any) => ({
      ...boost,
      type: 'mood_boost',
      createdAt: boost.createdAt ?? boost.timestamp ?? new Date().toISOString(), // Ensure createdAt exists
    }));
  
  // Merge feed items with mood boosts, deduplicate by id+type, and sort by createdAt (newest first)
  const allItems = [...feedItems, ...normalizedMoodBoosts];
  const seenKeys = new Set<string>();
  const deduplicatedFeed = allItems.filter((item: any) => {
    const key = `${item.type}-${item.id}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
  
  const mergedFeed = deduplicatedFeed.sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt || 0).getTime() || 0;
    const dateB = new Date(b.createdAt || 0).getTime() || 0;
    return dateB - dateA;
  });
  
  const combinedFeed = [...mergedFeed];
  
  // Handle the new sports API response format with teamGames and individualSports
  // Merge both into a single unified array for the carousel
  const sportsData = sportsUpdates as { teamGames?: any[]; individualSports?: any[] } | any[];
  
  // Transform team games to unified format with type discriminator
  // Note: Spread first, then explicitly override type to ensure it's set correctly
  const teamGamesArray = (Array.isArray(sportsData) 
    ? sportsData 
    : (sportsData?.teamGames ?? [])
  ).map((game: any) => {
    const { type: _originalType, ...rest } = game; // Remove any existing type field
    return {
      ...rest,
      type: 'team' as const,
      id: game.eventId || game.id,
    };
  });
  
  // Transform individual sports to unified format with type discriminator  
  const individualSportsArray = (Array.isArray(sportsData) 
    ? [] 
    : (sportsData?.individualSports ?? [])
  ).map((sport: any) => {
    const { type: _originalType, ...rest } = sport; // Remove any existing type field
    return {
      ...rest,
      type: 'individual' as const,
      id: sport.eventId,
    };
  });
  
  // Merge all sports updates into single array for unified carousel
  const allSportsUpdates = [...teamGamesArray, ...individualSportsArray];

  // Separate different types of feed items
  console.log('📊 Feed items received:', feedItems.length, feedItems.map((i: any) => i.type));
  const posts = feedItems.filter((item: any) => item.type === 'post');
  const polls = feedItems.filter((item: any) => item.type === 'poll');
  const activityItems = feedItems.filter((item: any) => item.type !== 'post' && item.type !== 'poll');

  // Fetch filters
  const { data: filters = [] } = useQuery({
    queryKey: ["/api/filters"],
  });

  // Fetch stories
  const { data: stories = [] } = useQuery({
    queryKey: ["/api/stories"],
  });

  // Reflect mutation
  const reflectMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("GET", "/api/posts/reflect");
      return result;
    },
    onSuccess: (data) => {
      setReflectionData(data);
      setShowReflectDialog(true);
      toast({
        title: "Reflection Ready!",
        description: `Found ${data.posts?.length || 0} popular posts from the last 30 days`,
        duration: 2500,
        className: "bg-white text-black border-gray-300",
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
        description: "Failed to generate reflection",
        variant: "destructive",
      });
    },
  });

  // Horoscope mutation
  const horoscopeMutation = useMutation({
    mutationFn: async () => {
      // Detect user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await apiRequest("GET", `/api/horoscope?timezone=${encodeURIComponent(userTimezone)}`);
      return result;
    },
    onSuccess: (data) => {
      setHoroscopeData(data);
      setShowHoroscopeDialog(true);
      toast({
        title: "Your Daily Horoscope",
        description: "Your personalized horoscope is ready!",
        duration: 2500,
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: (error: any) => {
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
      if (error.message?.includes("Birthdate required")) {
        toast({
          title: "Birthdate Required",
          description: "Please add your birthdate in Profile Settings to unlock your Daily Horoscope.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to get your horoscope",
          variant: "destructive",
        });
      }
    },
  });

  // Bible verse mutation
  const bibleVerseMutation = useMutation({
    mutationFn: async () => {
      // Detect user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await apiRequest("GET", `/api/bible-verse?timezone=${encodeURIComponent(userTimezone)}`);
      return result;
    },
    onSuccess: (data) => {
      setBibleVerseData(data);
      setShowBibleVerseDialog(true);
      toast({
        title: "Daily Bible Verse",
        description: "Your daily verse of encouragement is ready!",
        duration: 2500,
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: (error: any) => {
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
        description: "Failed to get your daily bible verse",
        variant: "destructive",
      });
    },
  });

  // Scrapbook queries
  const { data: scrapbookAlbums = [] } = useQuery({
    queryKey: ['/api/scrapbook/albums'],
    enabled: showReflectDialog && reflectTab === 'scrapbook',
  });

  const scrapbookSavesUrl = selectedAlbumFilter 
    ? `/api/scrapbook/saves?albumId=${selectedAlbumFilter}` 
    : '/api/scrapbook/saves';
  
  const { data: scrapbookSaves = [] } = useQuery({
    queryKey: [scrapbookSavesUrl],
    enabled: showReflectDialog && reflectTab === 'scrapbook',
  });

  const postIds = feedItems.filter((item: any) => item.type === 'post').map((item: any) => item.id);
  const { data: savedPostsMap = {} } = useQuery({
    queryKey: ['/api/scrapbook/saved-map', postIds],
    queryFn: async () => {
      if (postIds.length === 0) return {};
      return await apiRequest("POST", "/api/scrapbook/check-saved", { postIds });
    },
    enabled: postIds.length > 0,
  });

  // Scrapbook mutations
  const savePostMutation = useMutation({
    mutationFn: async (data: { postId: string; albumId?: string; note?: string; selectedMediaUrl?: string }) => {
      return await apiRequest("POST", "/api/scrapbook/save", data);
    },
    onSuccess: async () => {
      // Clear enhanced cache first for immediate update
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/scrapbook');
      } catch (e) {}
      // Then invalidate React Query cache
      await queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/saves'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/saved-map'] });
      await queryClient.refetchQueries({ queryKey: ['/api/scrapbook/saves'] });
      setShowSavePostDialog(false);
      setSaveAlbumId("none");
      setSaveNote("");
      setSelectedMediaUrlToSave(null);
      toast({
        title: "Post Added!",
        description: "The post has been added to your scrapbook.",
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const unsavePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest("DELETE", `/api/scrapbook/save/${postId}`);
    },
    onMutate: async (postId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [scrapbookSavesUrl] });
      // Snapshot previous value
      const previousSaves = queryClient.getQueryData([scrapbookSavesUrl]);
      // Optimistically update - remove the item from the list
      queryClient.setQueryData([scrapbookSavesUrl], (old: any[]) => 
        old?.filter((save: any) => save.post?.id !== postId) || []
      );
      return { previousSaves };
    },
    onError: (err, postId, context: any) => {
      // Rollback on error
      if (context?.previousSaves) {
        queryClient.setQueryData([scrapbookSavesUrl], context.previousSaves);
      }
      toast({
        title: "Error",
        description: "Failed to remove post. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      // Clear enhanced cache and refetch for consistency
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/scrapbook');
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/saves'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/saved-map'] });
      setShowUnsaveDialog(false);
      setPostToUnsave(null);
      toast({
        title: "Post Removed",
        description: "The post has been removed from your scrapbook.",
        className: "bg-white text-black border-gray-300",
      });
    },
  });

  const createAlbumMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      return await apiRequest("POST", "/api/scrapbook/albums", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/albums'] });
      setShowCreateAlbumDialog(false);
      setNewAlbumName("");
      setNewAlbumColor("#FF1493");
      toast({
        title: "Album Created!",
        description: "Your new album has been created.",
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create album. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateAlbumMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; color: string } }) => {
      return await apiRequest("PATCH", `/api/scrapbook/albums/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/albums'] });
      setShowEditAlbumDialog(false);
      setEditingAlbum(null);
      toast({
        title: "Album Updated!",
        description: "Your album has been updated.",
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update album. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/scrapbook/albums/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/albums'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/saves'] });
      toast({
        title: "Album Deleted",
        description: "The album has been deleted.",
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete album. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ saveId, note }: { saveId: string; note: string }) => {
      return await apiRequest("PATCH", `/api/scrapbook/save/${saveId}/note`, { note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/saves'] });
      setShowEditNoteDialog(false);
      setEditingSaveNote(null);
      toast({
        title: "Note Updated!",
        description: "Your note has been updated.",
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Comment scrapbook mutations
  const saveCommentMutation = useMutation({
    mutationFn: async (data: { commentId: string; albumId?: string; note?: string }) => {
      return await apiRequest("POST", "/api/scrapbook/save-comment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/saves'] });
      setShowSaveCommentDialog(false);
      setSaveAlbumId("none");
      setSaveNote("");
      toast({
        title: "Comment Added!",
        description: "The comment has been added to your scrapbook.",
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save comment",
        variant: "destructive",
      });
    },
  });

  const unsaveCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest("DELETE", `/api/scrapbook/save-comment/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/saves'] });
      toast({
        title: "Comment Removed",
        description: "The comment has been removed from your scrapbook.",
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove comment from scrapbook",
        variant: "destructive",
      });
    },
  });

  const unsaveActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return await apiRequest("DELETE", `/api/scrapbook/save-action/${actionId}`);
    },
    onMutate: async (actionId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [scrapbookSavesUrl] });
      // Snapshot previous value
      const previousSaves = queryClient.getQueryData([scrapbookSavesUrl]);
      // Optimistically update - remove the item from the list
      queryClient.setQueryData([scrapbookSavesUrl], (old: any[]) => 
        old?.filter((save: any) => save.action?.id !== actionId) || []
      );
      return { previousSaves };
    },
    onError: (err, actionId, context: any) => {
      // Rollback on error
      if (context?.previousSaves) {
        queryClient.setQueryData([scrapbookSavesUrl], context.previousSaves);
      }
      toast({
        title: "Error",
        description: "Failed to remove video from scrapbook",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      // Clear enhanced cache for consistency
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/scrapbook');
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ['/api/scrapbook/saves'] });
      setShowUnsaveDialog(false);
      setPostToUnsave(null);
      toast({
        title: "Video Removed",
        description: "The video has been removed from your scrapbook.",
        className: "bg-white text-black border-gray-300",
      });
    },
  });

  // Highlight post mutation
  const highlightPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest("POST", `/api/posts/${postId}/highlight`, {});
    },
    onSuccess: async () => {
      // Clear enterprise cache before refetching
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear (non-critical):', e);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
      queryClient.refetchQueries({ queryKey: ['/api/kliq-feed'] });
      toast({
        title: "Post Highlighted! ⭐",
        description: "Your post will stand out for the next 6 hours.",
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: (error: any) => {
      const message = error.message || "Failed to highlight post. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Unhighlight post mutation
  const unhighlightPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest("DELETE", `/api/posts/${postId}/highlight`, {});
    },
    onSuccess: async () => {
      // Clear enterprise cache before refetching
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear (non-critical):', e);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
      queryClient.refetchQueries({ queryKey: ['/api/kliq-feed'] });
      toast({
        title: "Highlight Removed",
        description: "Your post is back to normal.",
        className: "bg-white text-black border-gray-300",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove highlight. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; memeId?: string; movieconId?: string; mood?: string }) => {
      await apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: async () => {
      // Clear enterprise cache (IndexedDB) before refetching to ensure fresh data
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear (non-critical):', e);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-koins/wallet"] });
      setNewPost("");
      setSelectedMeme(null);
      setSelectedMoviecon(null);
      setSelectedMood(null);
      toast({
        title: "Post created!",
        description: "Your post has been shared with your kliq on the Headlines",
        duration: 2000,
        className: "bg-white text-black border-gray-300",
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
    onMutate: async (postId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/kliq-feed"] });
      
      // Snapshot the previous value
      const previousFeed = queryClient.getQueryData(["/api/kliq-feed"]);
      
      // Optimistically update the cache (infinite query has pages structure)
      queryClient.setQueryData(["/api/kliq-feed"], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items?.map((item: any) => {
              if (item.id === postId) {
                const isAlreadyLiked = Array.isArray(item.likes) && user && item.likes.some((like: any) => like.userId === (user as any).id);
                if (isAlreadyLiked) {
                  return {
                    ...item,
                    likes: item.likes.filter((like: any) => like.userId !== (user as any).id)
                  };
                } else {
                  return {
                    ...item,
                    likes: [...(Array.isArray(item.likes) ? item.likes : []), { userId: (user as any).id }]
                  };
                }
              }
              return item;
            }) || []
          }))
        };
      });
      
      return { previousFeed };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        queryClient.setQueryData(["/api/kliq-feed"], context.previousFeed);
      }
    },
    onSettled: async () => {
      // Clear enterprise cache before refetching to ensure server data persists
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
        await enhancedCache.removeByPattern('/api/notifications');
      } catch (e) {
        console.log('Cache clear (non-critical):', e);
      }
      // Invalidate feed to sync with server after optimistic update
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      // Force immediate refetch of notifications for instant updates
      queryClient.refetchQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-koins/wallet"] });
    },
  });

  // Add comment mutation with optimistic updates
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content, gifId, memeId, movieconId }: { postId: string; content: string; gifId?: string; memeId?: string; movieconId?: string }) => {
      return await apiRequest("POST", `/api/posts/${postId}/comments`, { content, gifId, memeId, movieconId });
    },
    onMutate: async ({ postId, content, gifId, memeId, movieconId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/kliq-feed"] });
      
      // Snapshot the previous value
      const previousFeed = queryClient.getQueryData(["/api/kliq-feed"]);
      
      // Create optimistic comment
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content,
        gifId,
        memeId,
        movieconId,
        createdAt: new Date().toISOString(),
        author: {
          id: (user as any)?.id,
          username: (user as any)?.username,
          firstName: (user as any)?.firstName,
          lastName: (user as any)?.lastName,
          avatarUrl: (user as any)?.avatarUrl,
        },
        likes: [],
        replies: [],
      };
      
      // Optimistically update the cache (infinite query has pages structure)
      queryClient.setQueryData(["/api/kliq-feed"], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items?.map((item: any) => {
              if (item.id === postId) {
                return {
                  ...item,
                  comments: [...(Array.isArray(item.comments) ? item.comments : []), optimisticComment]
                };
              }
              return item;
            }) || []
          }))
        };
      });
      
      // Clear inputs immediately for instant feedback
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      setCommentMemes(prev => ({ ...prev, [postId]: null }));
      setCommentMoviecons(prev => ({ ...prev, [postId]: null }));
      
      return { previousFeed, postId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        queryClient.setQueryData(["/api/kliq-feed"], context.previousFeed);
      }
      
      if (isUnauthorizedError(err)) {
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
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
    onSuccess: (response, { postId }) => {
      // Close the comment box after posting
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      
      toast({
        title: "Comment posted!",
        description: "Your comment has been added to the conversation",
      });
    },
    onSettled: async () => {
      // Clear enterprise cache before refetching to ensure server data persists
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
        await enhancedCache.removeByPattern('/api/notifications');
      } catch (e) {
        console.log('Cache clear (non-critical):', e);
      }
      // Background refresh to get real comment ID (but UI already shows optimistic comment)
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      // Force immediate refetch of notifications for instant updates
      queryClient.refetchQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-koins/wallet"] });
    },
  });

  // Like comment mutation with optimistic updates
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiRequest("POST", `/api/comments/${commentId}/like`);
    },
    onMutate: async (commentId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/kliq-feed"] });
      
      // Snapshot the previous value
      const previousFeed = queryClient.getQueryData(["/api/kliq-feed"]);
      
      // Optimistically update the cache (infinite query has pages structure)
      queryClient.setQueryData(["/api/kliq-feed"], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items?.map((item: any) => {
              if (!item.comments) return item;
              return {
                ...item,
                comments: item.comments.map((comment: any) => {
                  if (comment.id === commentId) {
                    const isAlreadyLiked = Array.isArray(comment.likes) && user && comment.likes.some((like: any) => like.userId === (user as any).id);
                    if (isAlreadyLiked) {
                      return {
                        ...comment,
                        likes: comment.likes.filter((like: any) => like.userId !== (user as any).id)
                      };
                    } else {
                      return {
                        ...comment,
                        likes: [...(Array.isArray(comment.likes) ? comment.likes : []), { userId: (user as any).id }]
                      };
                    }
                  }
                  return comment;
                })
              };
            }) || []
          }))
        };
      });
      
      return { previousFeed };
    },
    onError: (error, commentId, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        queryClient.setQueryData(["/api/kliq-feed"], context.previousFeed);
      }
      
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
        description: "Failed to like comment",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      // Clear enterprise cache before refetching to ensure server data persists
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
        await enhancedCache.removeByPattern('/api/notifications');
      } catch (e) {
        console.log('Cache clear (non-critical):', e);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      // Force immediate refetch of notifications for instant updates
      queryClient.refetchQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-koins/wallet"] });
    },
  });

  // Reply to comment mutation with optimistic updates
  const replyCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      return await apiRequest("POST", `/api/comments/${commentId}/reply`, { content });
    },
    onMutate: async ({ commentId, content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/kliq-feed"] });
      
      // Snapshot the previous value
      const previousFeed = queryClient.getQueryData(["/api/kliq-feed"]);
      
      // Create optimistic reply
      const optimisticReply = {
        id: `temp-reply-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        author: {
          id: (user as any)?.id,
          username: (user as any)?.username,
          firstName: (user as any)?.firstName,
          lastName: (user as any)?.lastName,
          avatarUrl: (user as any)?.avatarUrl,
        },
        likes: [],
      };
      
      // Optimistically update the cache (infinite query has pages structure)
      queryClient.setQueryData(["/api/kliq-feed"], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items?.map((item: any) => {
              if (!item.comments) return item;
              return {
                ...item,
                comments: item.comments.map((comment: any) => {
                  if (comment.id === commentId) {
                    return {
                      ...comment,
                      replies: [...(Array.isArray(comment.replies) ? comment.replies : []), optimisticReply]
                    };
                  }
                  return comment;
                })
              };
            }) || []
          }))
        };
      });
      
      // Clear inputs immediately
      setReplyInputs(prev => ({ ...prev, [commentId]: "" }));
      setReplyingToComment(null);
      
      return { previousFeed };
    },
    onSuccess: () => {
      toast({
        title: "Reply posted!",
        description: "Your reply has been added to the conversation",
      });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        queryClient.setQueryData(["/api/kliq-feed"], context.previousFeed);
      }
      
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
        description: "Failed to post reply",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      // Clear enterprise cache before refetching to ensure server data persists
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
        await enhancedCache.removeByPattern('/api/notifications');
      } catch (e) {
        console.log('Cache clear (non-critical):', e);
      }
      // Background refresh to get real reply ID
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      // Force immediate refetch of notifications for instant updates
      queryClient.refetchQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-koins/wallet"] });
    },
  });

  // Add filter mutation
  const addFilterMutation = useMutation({
    mutationFn: async (keyword: string) => {
      await apiRequest("POST", "/api/filters", { keyword });
    },
    onSuccess: async () => {
      // Clear enterprise cache for both filters and feed
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/filters');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear (non-critical):', e);
      }
      // Refetch filters immediately so they appear in the UI
      await queryClient.refetchQueries({ queryKey: ["/api/filters"], type: 'all' });
      // Refetch the feed so filtered posts are hidden immediately
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"], type: 'all' });
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
    onSuccess: async () => {
      // Clear enterprise cache for both filters and feed
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/filters');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear (non-critical):', e);
      }
      // Refetch filters immediately so they disappear from the UI
      await queryClient.refetchQueries({ queryKey: ["/api/filters"], type: 'all' });
      // Refetch the feed so previously filtered posts appear immediately
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"], type: 'all' });
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

  // Location check-in mutation that creates a post
  const locationCheckInMutation = useMutation({
    mutationFn: async (locationData: { latitude: number; longitude: number; locationName: string; address?: string }) => {
      // Create content based on available information
      let content = `📍 Checked in`;
      if (locationData.locationName) {
        content += ` at ${locationData.locationName}`;
      }
      if (locationData.address) {
        content += ` (${locationData.address})`;
      }
      if (!locationData.locationName && !locationData.address) {
        content += ` at ${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
      }
      
      const result = await apiRequest("POST", "/api/posts", {
        content: content,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationName: locationData.locationName || null,
        address: locationData.address || null,
      });
      
      return result;
    },
    onSuccess: async () => {
      // Clear enterprise cache before refetching
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {
        console.log('Cache clear (non-critical):', e);
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
      setShowLocationDialog(false);
      setLocationName('');
      setAddress('');
      setUserLocation(null);
      toast({
        title: "Location Check-in Posted!",
        description: "Your location has been shared with your kliq on the Headlines",
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
        description: "Failed to share location",
        variant: "destructive",
      });
    },
  });



  // Like toggle mutation for events and posts
  const likeToggleMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("POST", `/api/posts/${itemId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
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
        description: "Failed to update like",
        variant: "destructive",
      });
    },
  });

  // Report post mutation
  const reportPostMutation = useMutation({
    mutationFn: async ({ postId, reason, description }: { postId: string; reason: string; description: string }) => {
      await apiRequest("POST", "/api/reports", { postId, reason, description });
    },
    onSuccess: () => {
      setShowReportDialog(false);
      setReportReason("");
      setReportDescription("");
      setSelectedPostToReport(null);
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep MyKliq safe. Our team will review this content.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive"
        });
        window.location.href = "/";
      } else {
        toast({
          title: "Error",
          description: "Failed to submit report. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setIsGettingLocation(false);
        setShowLocationDialog(true);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
        toast({
          title: "Location access denied",
          description: "Please enable location access to share your location",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleLocationCheckIn = () => {
    if (userLocation) {
      locationCheckInMutation.mutate({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        locationName: locationName.trim(),
        address: address.trim()
      });
    }
  };

  const handleCreatePost = () => {
    if (newPost.trim() || selectedMeme || selectedMoviecon || selectedMood) {
      // Track post creation event
      trackMobileEvent('create_post', { has_media: !!(selectedMeme || selectedMoviecon), mood: selectedMood });
      
      let postContent = "";
      
      if (selectedMood) {
        const moodOption = moodOptions.find(m => m.label === selectedMood);
        postContent = `${moodOption?.emoji} MOOD: Feeling ${selectedMood.toLowerCase()}`;
        if (newPost.trim()) {
          postContent += ` - ${newPost.trim()}`;
        }
      } else {
        postContent = newPost.trim();
      }
      
      createPostMutation.mutate({
        content: postContent,
        memeId: selectedMeme?.id,
        movieconId: selectedMoviecon?.id,
        mood: selectedMood || undefined
      });
    }
  };

  const handleReflect = () => {
    reflectMutation.mutate();
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



  // Like toggle handler
  const handleLikeToggle = (itemId: string) => {
    // Track like event
    trackMobileEvent('like_post', { item_id: itemId });
    
    likeToggleMutation.mutate(itemId);
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
    // PRIDE & LGBTQ+
    '🏳️‍🌈', '🏳️‍⚧️', '🌈', '💖', '💜', '💙', '💛', '💚',
    // Life Events & Celebrations
    // Happy Birthday
    '🎂', '🥳', '🎈', '🎁', '🎉', '🎊', '🕯️', '🧁',
    // Anniversary
    '💍', '👰', '🤵', '💒', '🥂', '💐', '💕', '💖',
    // Congratulations
    '🎉', '👏', '🙌', '🥳', '🏆', '⭐', '💯', '✨',
    // Death & Memorial
    '🕊️', '🌹', '🕯️', '💐', '⚰️', '🪦', '😢', '🙏',
    // Achievement
    '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '👑', '💎',
    // Outdoor Activities
    '🏕️', '⛰️', '🌊', '🏖️', '🎣', '🦅', '🌙', '⭐', 
    '🌞', '🌈', '🔥', '🏞️',
    // Everyday
    '📍', '🏠', '🍕', '☕', '🎵', '📸', '🌟', '💫'
  ];

  const handleLikePost = (postId: string) => {
    likePostMutation.mutate(postId);
  };

  const handleOpenImageViewer = (index: number, media: Array<{ id?: string; mediaUrl: string; mediaType: "image" | "video"; displayOrder?: number }>) => {
    setImageViewerMedia(media);
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  const handleReportPost = (post: any) => {
    setSelectedPostToReport(post);
    setShowReportDialog(true);
  };

  const handleSubmitReport = () => {
    if (!selectedPostToReport || !reportReason) {
      toast({
        title: "Please select a reason",
        description: "A reason for the report is required.",
        variant: "destructive"
      });
      return;
    }

    reportPostMutation.mutate({
      postId: selectedPostToReport.id,
      reason: reportReason,
      description: reportDescription
    });
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
    const memeId = commentMemes[postId]?.id;
    const movieconId = commentMoviecons[postId]?.id;
    if (content || memeId || movieconId) {
      addCommentMutation.mutate({ postId, content: content || '', memeId, movieconId });
    }
  };

  const handleLikeComment = (commentId: string) => {
    likeCommentMutation.mutate(commentId);
  };

  const handleReplyToComment = (commentId: string) => {
    setReplyingToComment(commentId);
  };

  const handleReplySubmit = (commentId: string) => {
    const content = replyInputs[commentId]?.trim();
    if (!content) return;

    replyCommentMutation.mutate({ commentId, content });
  };

  const handleCommentInputChange = (postId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleCommentMemeSelect = (postId: string, meme: Meme) => {
    setCommentMemes(prev => ({ ...prev, [postId]: meme }));
  };

  const handleCommentMemeRemove = (postId: string) => {
    setCommentMemes(prev => ({ ...prev, [postId]: null }));
  };

  const handleCommentMovieconSelect = (postId: string, moviecon: Moviecon) => {
    setCommentMoviecons(prev => ({ ...prev, [postId]: moviecon }));
  };

  const handleCommentMovieconRemove = (postId: string) => {
    setCommentMoviecons(prev => ({ ...prev, [postId]: null }));
  };
  

  

  
  // Friend ranking handler
  const handleRankChange = async (friendId: string, newRank: number) => {
    try {
      await apiRequest("PUT", `/api/friends/${friendId}/rank`, { rank: newRank });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Updated",
        description: "Friend ranking updated!",
      });
    } catch (error: any) {
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
        description: "Failed to update friend ranking",
        variant: "destructive",
      });
    }
  };

  const handleSharePost = (post: any) => {
    setSelectedPostToShare(post);
    setShowShareDialog(true);
  };

  const sharePostToHeadlines = async () => {
    if (!selectedPostToShare) return;
    
    try {
      await apiRequest("POST", `/api/posts/${selectedPostToShare.id}/share`, {});
      
      toast({
        title: "Post shared!",
        description: "This post has been shared to your Headlines feed",
        duration: 3000,
      });
      
      setShowShareDialog(false);
      
      // Immediately refresh the feed to show the shared post
      queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
    } catch (error: any) {
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
        title: "Share failed",
        description: error?.message || "Unable to share post",
        variant: "destructive",
      });
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



  const handleMediaUploadSuccess = async () => {
    // Clear enterprise cache for feed - MUST await to ensure cache is cleared before refetch
    try {
      const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
      await enhancedCache.removeByPattern('/api/kliq-feed');
      console.log('[MediaUpload] Cleared feed cache');
    } catch (e) {
      console.log('Cache clear (non-critical):', e);
    }
    // Invalidate and immediately refetch the feed so the new post appears instantly
    // Use predicate to match all feed queries (including ones with page/limit params)
    await queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.includes('/api/kliq-feed');
      }
    });
    await queryClient.refetchQueries({ 
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.includes('/api/kliq-feed');
      }
    });
    console.log('[MediaUpload] Feed refetched');
  };

  const handleStoryUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    queryClient.refetchQueries({ queryKey: ["/api/stories"] });
  };

  const handleViewStory = async (storyId: string) => {
    try {
      await apiRequest("POST", `/api/stories/${storyId}/view`);
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    } catch (error: any) {
      console.error("Error viewing story:", error);
    }
  };

  const handlePullToRefresh = async () => {
    try {
      await Promise.all([
        refetchFeed(),
        queryClient.refetchQueries({ queryKey: ["/api/mood-boost/posts"] }),
        queryClient.refetchQueries({ queryKey: ["/api/stories"] }),
        queryClient.refetchQueries({ queryKey: ["/api/sports/updates"] }),
        queryClient.refetchQueries({ queryKey: ["/api/ads/targeted"] }),
      ]);
      toast({
        title: "Feed refreshed",
        description: "Your feed is now up to date.",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error refreshing feed:", error);
    }
  };

  return (
    <PageWrapper>
      <PullToRefresh onRefresh={handlePullToRefresh}>
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Post Creation */}
        <Card className="bg-gradient-to-r from-mykliq-purple/20 to-secondary/20 border-mykliq-purple/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-10 h-10 border-2 border-mykliq-orange">
              <AvatarImage src={resolveProfileImageUrl(userData?.profileImageUrl, userData?.updatedAt)} />
              <AvatarFallback className="bg-muted text-foreground">
                {userData?.firstName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's happening in your kliq?"
              className="flex-1 bg-white text-black placeholder-gray-500 border-none resize-none"
              rows={2}
              data-testid="textarea-new-post"
            />
          </div>
          {selectedMeme && (
            <div className="mt-3 flex items-center gap-2">
              <MemeDisplay meme={selectedMeme} className="max-w-xs" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedMeme(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </Button>
            </div>
          )}
          {selectedMoviecon && (
            <div className="mt-3 flex items-center gap-2">
              <MovieconDisplay moviecon={selectedMoviecon} className="max-w-xs" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedMoviecon(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </Button>
            </div>
          )}
          {selectedMood && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <span className="text-lg">{moodOptions.find(m => m.label === selectedMood)?.emoji}</span>
                <span className="text-sm font-medium">MOOD: Feeling {selectedMood.toLowerCase()}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedMood(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </Button>
            </div>
          )}
          {/* Action Icons Row */}
          <div className="flex space-x-4 mb-3">
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-orange-600 hover:bg-orange-600/20 bg-white border border-black shadow-sm h-8 w-8 p-1"
                  data-testid="button-emoji-picker"
                >
                  <Smile className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 max-h-72 overflow-y-auto">
                <div className="grid grid-cols-7 gap-1 p-2">
                  {commonEmojis.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 text-xl hover:bg-accent emoji-large"
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
              className="text-green-600 hover:bg-green-600/20 bg-white border border-black shadow-sm h-8 w-8 p-1"
              onClick={() => setShowMediaUpload(true)}
            >
              <ImageIcon className="w-3 h-3" />
            </Button>
            <MemePicker
              onSelectMeme={setSelectedMeme}
              trigger={
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-purple-600 hover:bg-purple-600/20 bg-white border border-black shadow-sm h-8 w-8 p-1"
                >
                  <span className="text-[8px] font-bold">MEME</span>
                </Button>
              }
            />
            <MovieconPicker
              onSelectMoviecon={setSelectedMoviecon}
              trigger={
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-blue-600 hover:bg-blue-600/20 bg-white border border-black shadow-sm h-8 w-8 p-1"
                >
                  <Clapperboard className="w-3 h-3" />
                </Button>
              }
            />

            <Button 
              size="sm" 
              variant="ghost" 
              className="text-red-600 hover:bg-red-600/20 bg-white border border-black shadow-sm h-8 w-8 p-1"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <MapPin className="w-3 h-3" />
              )}
            </Button>

            <Button 
              size="sm" 
              variant="ghost" 
              className="text-yellow-600 hover:bg-yellow-600/20 bg-white border border-black shadow-sm h-8 w-8 p-1"
              onClick={() => setShowMoodDialog(true)}
              data-testid="button-mood-picker"
            >
              <Zap className="w-3 h-3" />
            </Button>

            <Link href="/events">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-cyan-600 hover:bg-cyan-600/20 bg-white border border-black shadow-sm h-8 w-8 p-1"
                data-testid="button-events"
              >
                <Calendar className="w-3 h-3" />
              </Button>
            </Link>

            <Link href="/actions">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-red-700 hover:bg-red-700/20 bg-white border border-black shadow-sm h-8 w-8 p-1"
                data-testid="button-actions"
              >
                <Video className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          
          {/* Daily Content Buttons and Post Button - Row 2 */}
          <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                onClick={() => horoscopeMutation.mutate()}
                disabled={horoscopeMutation.isPending}
                variant="outline"
                size="sm"
                data-testid="button-daily-horoscope"
              >
                {horoscopeMutation.isPending ? "Loading..." : "Daily Horoscope"}
              </Button>
              <Button
                onClick={() => bibleVerseMutation.mutate()}
                disabled={bibleVerseMutation.isPending}
                variant="outline"
                size="sm"
                data-testid="button-daily-bible-verse"
              >
                {bibleVerseMutation.isPending ? "Loading..." : "Daily Bible Verse"}
              </Button>
              <Button
                onClick={handleReflect}
                disabled={reflectMutation.isPending || !isAuthenticated}
                variant="outline"
                size="sm"
                data-testid="button-lets-reflect"
              >
                {reflectMutation.isPending ? "Reflecting..." : "Lets Reflect"}
              </Button>
            </div>
            <Button
              onClick={handleCreatePost}
              disabled={(!newPost.trim() && !selectedMeme && !selectedMoviecon && !selectedMood) || createPostMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 flex-shrink-0"
              style={{ boxShadow: '0 0 15px hsl(var(--primary) / 0.4)' }}
            >
              {createPostMutation.isPending ? "Posting..." : "Post!"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Google Search powered by AI */}
      <GoogleSearch />

      {/* Location Check-in Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Add Meetup Details</span>
            </DialogTitle>
            <DialogDescription>
              Add a location name and address to allow your friends to meetup with you to join in on the fun
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                data-testid="input-location-name"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Starbucks, Central Park, Home"
                className="bg-white border-gray-300 text-black placeholder-gray-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                data-testid="input-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 123 Main St, New York, NY"
                className="bg-white border-gray-300 text-black placeholder-gray-500"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowLocationDialog(false)}
                className="border-border text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLocationCheckIn}
                disabled={locationCheckInMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-confirm-checkin"
              >
                {locationCheckInMutation.isPending ? "Posting meetup..." : "Post Meetup"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mood Selection Dialog */}
      <Dialog open={showMoodDialog} onOpenChange={setShowMoodDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>How are you feeling?</span>
            </DialogTitle>
            <DialogDescription>
              Share your current mood with your kliq
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-3 py-4 max-h-80 overflow-y-auto">
            {moodOptions.map((mood) => (
              <Button
                key={mood.label}
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4 bg-white hover:bg-gray-50 border-gray-200"
                onClick={() => {
                  setSelectedMood(mood.label);
                  setShowMoodDialog(false);
                }}
                data-testid={`button-mood-${mood.label.toLowerCase()}`}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className={cn("text-xs font-medium", mood.color)}>
                  {mood.label}
                </span>
              </Button>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowMoodDialog(false)}
              className="border-border text-foreground"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reflection & Scrapbook Dialog */}
      <Dialog open={showReflectDialog} onOpenChange={setShowReflectDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-2xl">✨</span>
              <span>Your Kliq Dashboard</span>
            </DialogTitle>
            <DialogDescription>
              View your reflection and manage your scrapbook
            </DialogDescription>
          </DialogHeader>

          <Tabs value={reflectTab} onValueChange={setReflectTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reflection" data-testid="tab-reflection">Reflection</TabsTrigger>
              <TabsTrigger value="scrapbook" data-testid="tab-scrapbook">Scrapbook</TabsTrigger>
            </TabsList>

            <TabsContent value="reflection" className="space-y-6 mt-4">
              {reflectionData && (
                <div className="space-y-6">
                  {/* Stats Section */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{reflectionData.stats.totalPosts}</div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-red-500">{reflectionData.stats.totalLikes}</div>
                      <div className="text-xs text-muted-foreground">Likes</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">{reflectionData.stats.totalComments}</div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-500">{reflectionData.stats.avgEngagement}</div>
                      <div className="text-xs text-muted-foreground">Avg Engagement</div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="text-center p-4 bg-accent rounded-lg">
                    <p className="text-sm text-accent-foreground">{reflectionData.message}</p>
                  </div>

                  {/* Posts Collage */}
                  {reflectionData.posts.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Your Top Posts</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {reflectionData.posts.map((post: any, index: number) => (
                          <Card key={post.id} className="relative">
                            <CardContent className="p-4">
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </div>
                              <div className="space-y-2">
                                {post.mediaUrl && (
                                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                    {post.mediaType === 'video' ? (
                                      <VideoThumbnail
                                        src={resolveAssetUrl(post.mediaUrl)}
                                        posterUrl={post.videoThumbnailUrl ? resolveAssetUrl(post.videoThumbnailUrl) : undefined}
                                      />
                                    ) : (
                                      <img 
                                        src={resolveAssetUrl(post.mediaUrl)} 
                                        alt="Post media" 
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                )}
                                <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    {post.likes}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" />
                                    {post.commentCount}
                                  </span>
                                  <span className="font-medium">
                                    Score: {post.engagementScore}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="scrapbook" className="space-y-6 mt-4">
              {/* Scrapbook Header */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground" data-testid="text-saves-count">
                  {(scrapbookSaves as any[]).length}/1000 posts added
                </div>
                <Button
                  onClick={() => setShowCreateAlbumDialog(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="button-new-album"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Album
                </Button>
              </div>

              {/* Album List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Albums</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* All Saves */}
                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedAlbumFilter === null ? "ring-2 ring-primary" : ""
                    )}
                    onClick={() => setSelectedAlbumFilter(null)}
                    data-testid="album-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                            <PlusCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">All Saves</h4>
                            <p className="text-xs text-muted-foreground">
                              {(scrapbookSaves as any[]).length} posts
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* User Albums */}
                  {(scrapbookAlbums as any[]).map((album: any) => {
                    const albumSaveCount = (scrapbookSaves as any[]).filter(
                      (save: any) => save.albumId === album.id
                    ).length;

                    return (
                      <Card
                        key={album.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedAlbumFilter === album.id ? "ring-2 ring-primary" : ""
                        )}
                        onClick={() => setSelectedAlbumFilter(album.id)}
                        data-testid={`album-${album.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: album.color }}
                              >
                                <PlusCircle className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-medium">{album.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {albumSaveCount} posts
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAlbum(album);
                                  setEditAlbumName(album.name);
                                  setEditAlbumColor(album.color);
                                  setShowEditAlbumDialog(true);
                                }}
                                data-testid={`button-edit-album-${album.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete album "${album.name}"? All saves will be moved to All Saves.`)) {
                                    deleteAlbumMutation.mutate(album.id);
                                  }
                                }}
                                data-testid={`button-delete-album-${album.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Saved Posts Grid */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  {selectedAlbumFilter 
                    ? (scrapbookAlbums as any[]).find((a: any) => a.id === selectedAlbumFilter)?.name 
                    : "All Saves"}
                </h3>
                {(scrapbookSaves as any[]).filter((save: any) => 
                  selectedAlbumFilter ? save.albumId === selectedAlbumFilter : true
                ).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {(scrapbookSaves as any[])
                      .filter((save: any) => 
                        selectedAlbumFilter ? save.albumId === selectedAlbumFilter : true
                      )
                      .map((save: any) => (
                        <Card key={save.id} className="relative" data-testid={`save-${save.id}`}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Action (Video) Content */}
                              {save.type === 'action' && save.action && (
                                <>
                                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                    {save.action.recordingUrl ? (
                                      <video 
                                        className="w-full h-full object-cover" 
                                        controls
                                        playsInline
                                        preload="metadata"
                                        poster={save.action.thumbnailUrl ? resolveAssetUrl(save.action.thumbnailUrl) : undefined}
                                        src={resolveAssetUrl(save.action.recordingUrl)}
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <Video className="h-8 w-8" />
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-sm text-foreground font-semibold">{save.action.title}</p>
                                  {save.action.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{save.action.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={resolveAssetUrl(save.action.author?.profileImageUrl)} />
                                      <AvatarFallback>{save.action.author?.firstName?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <span>{save.action.author?.firstName} {save.action.author?.lastName}</span>
                                  </div>
                                </>
                              )}

                              {/* Post Content */}
                              {save.type !== 'action' && save.post && (
                                <>
                                  {(save.selectedMediaUrl || save.post.mediaUrl) && (
                                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                      {save.post.mediaType === 'video' ? (
                                        <VideoThumbnail
                                          src={resolveAssetUrl(save.selectedMediaUrl || save.post.mediaUrl)}
                                          posterUrl={save.post.videoThumbnailUrl ? resolveAssetUrl(save.post.videoThumbnailUrl) : undefined}
                                        />
                                      ) : (
                                        <img 
                                          src={resolveAssetUrl(save.selectedMediaUrl || save.post.mediaUrl)} 
                                          alt="Post media" 
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                    </div>
                                  )}
                                  <p className="text-sm text-foreground line-clamp-3">{save.post.content}</p>
                                  
                                  {/* Author Info */}
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={resolveAssetUrl(save.post.author?.profileImageUrl)} />
                                      <AvatarFallback>{save.post.author?.firstName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <span>{save.post.author?.firstName} {save.post.author?.lastName}</span>
                                  </div>
                                </>
                              )}

                              {/* Note - only show for post saves, not action saves */}
                              {save.type !== 'action' && save.note && (
                                <div className="p-2 bg-muted/50 rounded text-sm">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs italic text-foreground">{save.note}</p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 flex-shrink-0"
                                      onClick={() => {
                                        setEditingSaveNote(save);
                                        setEditNoteText(save.note || "");
                                        setShowEditNoteDialog(true);
                                      }}
                                      data-testid={`button-edit-note-${save.id}`}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {save.type !== 'action' && !save.note && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() => {
                                        setEditingSaveNote(save);
                                        setEditNoteText("");
                                        setShowEditNoteDialog(true);
                                      }}
                                      data-testid={`button-add-note-${save.id}`}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Note
                                    </Button>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-destructive hover:text-destructive/80"
                                  onClick={() => {
                                    if (save.type === 'action') {
                                      // For action saves, use the action as target
                                      setPostToUnsave({ id: save.action?.id, type: 'action' });
                                    } else {
                                      setPostToUnsave(save.post);
                                    }
                                    setShowUnsaveDialog(true);
                                  }}
                                  data-testid={`button-remove-${save.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No posts in this album</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add posts by clicking the + icon on any post
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowReflectDialog(false)}
              className="bg-black dark:bg-black text-white dark:text-white border-black dark:border-black hover:bg-gray-800 dark:hover:bg-gray-800"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Horoscope Dialog */}
      <Dialog open={showHoroscopeDialog} onOpenChange={setShowHoroscopeDialog}>
        <DialogContent className="sm:max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <span>🔮</span>
              Your Daily Horoscope
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Get insights into your day and share your horoscope with your kliq
            </DialogDescription>
          </DialogHeader>
          
          {horoscopeData && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-2 text-center">
                  {horoscopeData.sign} - {horoscopeData.date}
                </h3>
                <p className="text-foreground leading-relaxed">
                  {horoscopeData.horoscope}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Lucky Number:</span>
                    <span className="ml-2 text-foreground">{horoscopeData.luckyNumber}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Lucky Color:</span>
                    <span className="ml-2 text-foreground">{horoscopeData.luckyColor}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowHoroscopeDialog(false)}
                  className="border-border text-foreground"
                  disabled={isPostingHoroscope}
                >
                  Close
                </Button>
                <Button
                  disabled={isPostingHoroscope}
                  onClick={async () => {
                    if (isPostingHoroscope) return;
                    setIsPostingHoroscope(true);
                    const horoscopePost = `🔮 My Daily Horoscope (${horoscopeData.sign}) 🔮\n\n${horoscopeData.horoscope}\n\n✨ Lucky Number: ${horoscopeData.luckyNumber}\n🎨 Lucky Color: ${horoscopeData.luckyColor}`;
                    
                    try {
                      await apiRequest("POST", "/api/posts", {
                        content: horoscopePost,
                        mediaUrl: null,
                        mediaType: null,
                        youtubeUrl: null,
                        type: 'post',
                        postType: 'horoscope'
                      });
                      
                      setShowHoroscopeDialog(false);
                      
                      // Clear enterprise cache before refetching
                      try {
                        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
                        await enhancedCache.removeByPattern('/api/kliq-feed');
                      } catch (e) {
                        console.log('Cache clear (non-critical):', e);
                      }
                      queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
                      queryClient.refetchQueries({ queryKey: ['/api/kliq-feed'] });
                      
                      toast({
                        title: "Horoscope Posted",
                        description: "Your daily horoscope has been shared with your kliq!",
                        duration: 3000,
                        className: "bg-white text-black border-gray-300",
                      });
                    } catch (error) {
                      console.error('Error posting horoscope:', error);
                      toast({
                        title: "Error",
                        description: "Failed to post horoscope. Please try again.",
                        variant: "destructive",
                        duration: 3000,
                      });
                    } finally {
                      setIsPostingHoroscope(false);
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isPostingHoroscope ? "Posting..." : "Post to Headlines"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Daily Bible Verse Dialog */}
      <Dialog open={showBibleVerseDialog} onOpenChange={setShowBibleVerseDialog}>
        <DialogContent className="sm:max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <span>📖</span>
              Daily Bible Verse
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              A verse of encouragement and reflection for your day
            </DialogDescription>
          </DialogHeader>
          
          {bibleVerseData && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-2 text-center">
                  {bibleVerseData.date}
                </h3>
                <blockquote className="text-foreground leading-relaxed italic text-center mb-4 text-lg">
                  "{bibleVerseData.verse}"
                </blockquote>
                <p className="text-center font-medium text-muted-foreground">
                  — {bibleVerseData.reference}
                </p>
                <div className="mt-4 p-3 bg-background/50 rounded border">
                  <h4 className="font-medium text-foreground mb-2">Today's Reflection:</h4>
                  <p className="text-foreground leading-relaxed text-sm">
                    {bibleVerseData.reflection}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowBibleVerseDialog(false)}
                  className="border-border text-foreground"
                  disabled={isPostingBibleVerse}
                >
                  Close
                </Button>
                <Button
                  disabled={isPostingBibleVerse}
                  onClick={async () => {
                    if (isPostingBibleVerse) return;
                    setIsPostingBibleVerse(true);
                    const versePost = `📖 Daily Bible Verse 📖\n\n"${bibleVerseData.verse}"\n\n— ${bibleVerseData.reference}\n\n💭 ${bibleVerseData.reflection}`;
                    
                    try {
                      await apiRequest("POST", "/api/posts", {
                        content: versePost,
                        mediaUrl: null,
                        mediaType: null,
                        youtubeUrl: null,
                        type: 'post',
                        postType: 'bible_verse'
                      });
                      
                      setShowBibleVerseDialog(false);
                      
                      // Clear enterprise cache before refetching
                      try {
                        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
                        await enhancedCache.removeByPattern('/api/kliq-feed');
                      } catch (e) {
                        console.log('Cache clear (non-critical):', e);
                      }
                      queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
                      queryClient.refetchQueries({ queryKey: ['/api/kliq-feed'] });
                      
                      toast({
                        title: "Bible Verse Posted",
                        description: "Your daily verse has been shared with your kliq!",
                        duration: 3000,
                        className: "bg-white text-black border-gray-300",
                      });
                    } catch (error) {
                      console.error('Error posting bible verse:', error);
                      toast({
                        title: "Error",
                        description: "Failed to post bible verse. Please try again.",
                        variant: "destructive",
                        duration: 3000,
                      });
                    } finally {
                      setIsPostingBibleVerse(false);
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isPostingBibleVerse ? "Posting..." : "Post to Headlines"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stories Section */}
      {(stories as any[]).length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <h2 className="text-lg font-bold text-foreground">Stories</h2>
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
                      story.hasViewed ? "border-muted" : "border-primary"
                    )}>
                      <Avatar className="w-full h-full">
                        <AvatarImage src={resolveAssetUrl(story.author.profileImageUrl)} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          {story.author.firstName?.[0] || story.author.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {story.mediaUrl && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center">
                        {story.mediaType === 'video' ? (
                          <Clapperboard className="w-3 h-3 text-secondary-foreground" />
                        ) : (
                          <ImageIcon className="w-3 h-3 text-secondary-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center truncate w-16">
                    {story.author.firstName || story.author.email?.split('@')[0]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Toggle */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-secondary">🚫</span>
              <span className="text-sm font-medium text-secondary">Content Filters</span>
              <Badge variant="secondary" className="text-xs">
                {(filters as any[]).length} active
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs border-secondary text-secondary hover:bg-secondary/10"
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


      {/* Feed */}
      {feedLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="space-y-1">
                      <div className="w-24 h-4 bg-muted rounded"></div>
                      <div className="w-16 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-muted rounded"></div>
                    <div className="w-3/4 h-4 bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (feedItems as any[]).length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">🌟</div>
            <h3 className="text-lg font-bold text-muted-foreground mb-2">Your feed is empty</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Invite friends to your kliq or create your first post to get started!
            </p>
            <Button
              onClick={() => setNewPost("Hello, MyKliq! 👋")}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
            >
              Create your first post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Unified Sports Carousel - team games and individual sports together */}
          {allSportsUpdates.length > 0 && (
            <SportsCarousel updates={allSportsUpdates} />
          )}
          
          {combinedFeed.map((item: any, index: number) => {
          const regularItemIndex = combinedFeed.slice(0, index).filter((i: any) => i.type !== 'sports_update' && i.type !== 'mood_boost').length;
          
          const showAd = regularItemIndex > 0 && (regularItemIndex + 1) % 4 === 0 && (targetedAds as any[]).length > 0;

          const adIndex = Math.floor((regularItemIndex + 1) / 4 - 1) % (targetedAds as any[]).length;

          return (
            <div key={`feed-wrapper-${item.id}-${index}`}>
              {/* Show sponsored ad before this item if conditions are met */}
              {showAd && (targetedAds as any[])[adIndex] && (
                <div className="mb-4" key={`ad-${adIndex}-${index}`}>
                  <SponsoredAd ad={(targetedAds as any[])[adIndex]} />
                </div>
              )}
              
              {(() => {
          
          // Mood boost posts - rendered like regular feed items but with special styling
          if (item.type === 'mood_boost') {
            return (
              <div className="mb-6" key={`mood-boost-${item.id}`}>
                <MoodBoostCard post={item} />
              </div>
            );
          }
          
          if (item.type === 'sports_update') {
            // Sports updates are now displayed in the carousel at the top
            return null;
          }
          
          if (item.type === 'poll') {
            return (
              <PollCard
                key={item.id}
                poll={{
                  ...item,
                  votes: [],
                  totalVotes: 0,
                }}
              />
            );
          }
          
          if (item.type === 'event') {
            return (
              <EventCard
                key={item.id}
                event={item}
                currentUserId={user?.id}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] })}
              />
            );
          }
          
          if (item.type === 'action') {
            // Live stream embedded inline - users can watch without navigating away
            return (
              <LiveStreamCard
                key={item.id}
                action={item}
                currentUserId={user?.id}
              />
            );
          }
          
          if (item.type === 'educational') {
            // Educational posts - special styling with custom accent colors
            return (
              <Card
                key={item.id}
                className="mb-4 border-2 transition-all duration-300 hover:shadow-xl"
                style={{
                  borderColor: item.accentColor,
                  backgroundColor: `${item.accentColor}15`, // 15% opacity background
                  boxShadow: `0 4px 12px ${item.accentColor}40` // Colored shadow
                }}
              >
                <CardContent className="p-4">
                  {/* Badge */}
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-3"
                    style={{
                      backgroundColor: item.accentColor,
                      color: 'white'
                    }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>MyKliq Tip</span>
                  </div>
                  
                  {/* Content */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-foreground/90">
                      {item.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          if (item.type === 'post') {
            return (
          <Card
            key={item.id}
            className={cn(
              "bg-gradient-to-br from-card to-card/80 border transition-all duration-500",
              item.isHighlighted 
                ? "fire-border bg-gradient-to-r from-yellow-400/20 via-amber-300/20 to-yellow-400/20" 
                : item.author.id === userData?.id 
                  ? "border-primary/50" 
                  : "border-border"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <BorderedAvatar
                  src={item.author.profileImageUrl}
                  fallback={item.author.firstName?.[0] || "U"}
                  borderImageUrl={item.author.id === userData?.id ? (userData as any)?.equippedBorder?.imageUrl : item.authorBorder?.imageUrl}
                  borderName={item.author.id === userData?.id ? (userData as any)?.equippedBorder?.name : item.authorBorder?.name}
                  size="md"
                />
                <div className="flex-1">
                  <p className="font-bold text-primary">
                    {item.author.firstName} {item.author.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(item.createdAt)}
                  </p>
                </div>
                
                {/* Add to scrapbook button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (savedPostsMap[item.id]) {
                      setPostToUnsave(item);
                      setShowUnsaveDialog(true);
                    } else {
                      setSelectedPostToSave(item);
                      setShowSavePostDialog(true);
                    }
                  }}
                  data-testid={`button-add-scrapbook-${item.id}`}
                >
                  {savedPostsMap[item.id] ? (
                    <PlusCircle className="h-4 w-4 fill-primary text-primary" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>

                {/* Edit button - only show for post author */}
                {item.author.id === userData?.id && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        data-testid={`button-edit-post-${item.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Edit Post</DialogTitle>
                      </DialogHeader>
                      <EditPostForm 
                        post={item} 
                        onUpdate={() => {
                          queryClient.refetchQueries({ queryKey: ['/api/kliq-feed'] });
                        }}
                        onOptimisticDelete={(postId) => {
                          // Immediately remove post from cache (infinite query has pages structure)
                          queryClient.setQueryData(["/api/kliq-feed"], (old: any) => {
                            if (!old || !old.pages) return old;
                            return {
                              ...old,
                              pages: old.pages.map((page: any) => ({
                                ...page,
                                items: page.items?.filter((p: any) => p.id !== postId) || []
                              }))
                            };
                          });
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                )}

                {/* Highlight button - only show for post author */}
                {item.author.id === userData?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 transition-colors",
                      item.isHighlighted 
                        ? "text-yellow-500 hover:text-yellow-600" 
                        : "text-muted-foreground hover:text-yellow-500"
                    )}
                    onClick={() => {
                      if (item.isHighlighted) {
                        unhighlightPostMutation.mutate(item.id);
                      } else {
                        highlightPostMutation.mutate(item.id);
                      }
                    }}
                    disabled={highlightPostMutation.isPending || unhighlightPostMutation.isPending}
                    data-testid={`button-highlight-${item.id}`}
                  >
                    <Star className={cn("h-4 w-4", item.isHighlighted && "fill-current")} />
                  </Button>
                )}

              </div>
              
              {item.content && (
                (() => {
                  const { cleanText, youtubeUrls } = extractYouTubeUrlsFromText(item.content);
                  const isEventPost = cleanText?.includes('📅 New event:') || cleanText?.includes('✏️ Updated event:');
                  
                  return (
                    <>
                      {cleanText && (
                        isEventPost ? (
                          <Link href="/events" className="block cursor-pointer hover:bg-primary/5 rounded p-2 -m-2 transition-colors">
                            <p className="text-foreground mb-3">{translatePost(cleanText)}</p>
                            <p className="text-xs text-muted-foreground italic">Click to view event details and manage attendance</p>
                          </Link>
                        ) : (
                          <p className="text-foreground mb-3 whitespace-pre-wrap">
                            <LinkifyText text={translatePost(cleanText)} />
                          </p>
                        )
                      )}
                      {youtubeUrls.length > 0 && (
                        <div className="mb-3">
                          <YouTubeEmbedList urls={youtubeUrls} />
                        </div>
                      )}
                    </>
                  );
                })()
              )}
              
              {/* Media Content - supports multi-image posts */}
              {(item.mediaUrl || (item.media && item.media.length > 0)) && (
                (() => {
                  const { cleanText } = extractYouTubeUrlsFromText(item.content || '');
                  const isEventPost = cleanText?.includes('📅 New event:') || cleanText?.includes('✏️ Updated event:');
                  
                  const mediaElement = (
                    <div className="mb-3 rounded-lg overflow-hidden bg-black/20">
                      <ImageGallery 
                        media={item.media || []}
                        fallbackUrl={item.mediaUrl}
                        fallbackType={item.mediaType}
                        resolveUrl={resolveAssetUrl}
                        className="max-h-96"
                        onImageClick={handleOpenImageViewer}
                        videoThumbnailUrl={item.videoThumbnailUrl}
                      />
                    </div>
                  );
                  
                  return isEventPost ? (
                    <Link href="/events" className="block cursor-pointer">
                      {mediaElement}
                    </Link>
                  ) : (
                    mediaElement
                  );
                })()
              )}
              
              {/* Meme Content */}
              {item.meme && (
                <div className="mb-3">
                  <MemeDisplay meme={item.meme} className="max-w-md" />
                </div>
              )}

              {/* Moviecon Content */}
              {item.moviecon && (
                <div className="mb-3">
                  <MovieconDisplay moviecon={item.moviecon} className="max-w-md" />
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLikePost(item.id);
                    }}
                    className={`p-0 h-auto transition-colors ${
                      Array.isArray(item.likes) && user && (user as any).id && item.likes.some((like: any) => like.userId === (user as any).id)
                        ? "text-red-500 hover:bg-red-50" 
                        : "text-primary hover:bg-primary/10"
                    }`}
                  >
                    <Heart 
                      className={`w-4 h-4 mr-1 ${
                        Array.isArray(item.likes) && user && (user as any).id && item.likes.some((like: any) => like.userId === (user as any).id)
                          ? "fill-current" 
                          : ""
                      }`} 
                    />
                    {Array.isArray(item.likes) ? item.likes.length : (item.likes || 0)}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleComments(item.id);
                    }}
                    className="text-secondary hover:bg-secondary/10 p-0 h-auto"
                    data-testid={`button-toggle-comments-${item.id}`}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {item._commentsCount || item.comments?.length || 0}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSharePost(item)}
                    className="text-mykliq-orange hover:bg-mykliq-orange/10 p-0 h-auto"
                    data-testid={`button-share-${item.id}`}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Report button on the right side */}
                {item.author.id !== userData?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleReportPost(item);
                    }}
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 p-1 h-auto text-xs"
                    data-testid={`button-report-${item.id}`}
                  >
                    REPORT
                  </Button>
                )}
              </div>

              {/* Comments Section */}
              {expandedComments.has(item.id) && (
                <div 
                  className="mt-4 border-t border-border pt-4 comments-section"
                  onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                >
                  {/* Existing Comments */}
                  {item.comments && item.comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {item.comments.map((comment: any) => (
                        <div key={comment.id} className="flex space-x-3">
                          <BorderedAvatar
                            src={comment.author?.profileImageUrl}
                            fallback={comment.author?.firstName?.[0] || "U"}
                            borderImageUrl={comment.author?.id === userData?.id ? (userData as any)?.equippedBorder?.imageUrl : comment.authorBorder?.imageUrl}
                            borderName={comment.author?.id === userData?.id ? (userData as any)?.equippedBorder?.name : comment.authorBorder?.name}
                            size="sm"
                          />
                          <div className="flex-1">
                            <div className="bg-muted rounded-lg px-3 py-2">
                              <p className="text-sm font-semibold text-primary">
                                {comment.author?.firstName} {comment.author?.lastName}
                              </p>
                              {comment.content && (
                                (() => {
                                  const { cleanText, youtubeUrls } = extractYouTubeUrlsFromText(comment.content);
                                  return (
                                    <>
                                      {cleanText && <p className="text-sm text-foreground">{translatePost(cleanText)}</p>}
                                      {youtubeUrls.length > 0 && (
                                        <div className="mt-2">
                                          <YouTubeEmbedList urls={youtubeUrls} />
                                        </div>
                                      )}
                                    </>
                                  );
                                })()
                              )}
                              {comment.meme && (
                                <div className="mt-2">
                                  <MemeDisplay meme={comment.meme} className="max-w-xs" />
                                </div>
                              )}
                              {comment.moviecon && (
                                <div className="mt-2">
                                  <MovieconDisplay moviecon={comment.moviecon} className="max-w-xs" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-muted-foreground">
                                {formatTimeAgo(comment.createdAt)}
                              </p>
                              <div className="flex items-center space-x-2">
                                {/* Scrapbook button - visible to all users */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setSelectedCommentToSave(comment);
                                    setShowSaveCommentDialog(true);
                                  }}
                                  data-testid={`button-add-comment-scrapbook-${comment.id}`}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>

                                {/* Edit button - only show for comment author */}
                                {comment.author?.id === userData?.id && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                        data-testid={`button-edit-comment-${comment.id}`}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md bg-card border-border">
                                      <DialogHeader>
                                        <DialogTitle className="text-foreground">Edit Comment</DialogTitle>
                                      </DialogHeader>
                                      <EditCommentForm 
                                        comment={comment} 
                                        onUpdate={() => {
                                          queryClient.refetchQueries({ queryKey: ['/api/kliq-feed'] });
                                        }}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                )}

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleLikeComment(comment.id)}
                                  disabled={likeCommentMutation.isPending}
                                  className="text-muted-foreground hover:text-red-500 p-0 h-auto text-xs"
                                  data-testid={`button-like-comment-${comment.id}`}
                                >
                                  <Heart className="w-3 h-3 mr-1" />
                                  {comment.likes_count || 0}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleReplyToComment(comment.id)}
                                  className="text-muted-foreground hover:text-primary p-0 h-auto text-xs"
                                  data-testid={`button-reply-comment-${comment.id}`}
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Reply
                                </Button>
                              </div>
                            </div>

                            {/* Reply Input */}
                            {replyingToComment === comment.id && (
                              <div className="mt-3 pl-4 border-l-2 border-muted">
                                <div className="flex space-x-2">
                                  <Avatar className="w-6 h-6 border border-border">
                                    <AvatarImage src={resolveProfileImageUrl(userData?.profileImageUrl, userData?.updatedAt)} />
                                    <AvatarFallback className="bg-muted text-foreground text-xs">
                                      {userData?.firstName?.[0] || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 flex space-x-2">
                                    <Textarea
                                      placeholder="Write a reply..."
                                      className="resize-none bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 text-sm"
                                      rows={2}
                                      value={replyInputs[comment.id] || ""}
                                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleReplySubmit(comment.id);
                                        }
                                      }}
                                    />
                                    <div className="flex flex-col space-y-1">
                                      <Button
                                        onClick={() => handleReplySubmit(comment.id)}
                                        disabled={!replyInputs[comment.id]?.trim() || replyCommentMutation.isPending}
                                        size="sm"
                                        className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-6 text-xs"
                                      >
                                        {replyCommentMutation.isPending ? "..." : "Reply"}
                                      </Button>
                                      <Button
                                        onClick={() => setReplyingToComment(null)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-xs"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input */}
                  <div className="flex space-x-3">
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarImage src={resolveProfileImageUrl(userData?.profileImageUrl, userData?.updatedAt)} />
                      <AvatarFallback className="bg-muted text-foreground text-xs">
                        {userData?.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      {commentMemes[item.id] && (
                        <div className="mb-2 flex items-center gap-2">
                          <MemeDisplay meme={commentMemes[item.id]!} className="max-w-xs" />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCommentMemeRemove(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      )}
                      {commentMoviecons[item.id] && (
                        <div className="mb-2 flex items-center gap-2">
                          <MovieconDisplay moviecon={commentMoviecons[item.id]!} className="max-w-xs" />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCommentMovieconRemove(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <Textarea
                          value={commentInputs[item.id] || ""}
                          onChange={(e) => handleCommentInputChange(item.id, e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 bg-white text-black placeholder-gray-500 border-border resize-none"
                          rows={2}
                          data-testid={`input-comment-${item.id}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCommentSubmit(item.id);
                            }
                          }}
                        />
                        <div className="flex flex-col justify-end space-y-1">
                          <MemePicker
                            onSelectMeme={(meme) => handleCommentMemeSelect(item.id, meme)}
                            trigger={
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-mykliq-purple hover:bg-mykliq-purple/10 h-8 w-8 p-0"
                                data-testid={`button-comment-meme-${item.id}`}
                              >
                                <span className="text-xs font-bold">MEME</span>
                              </Button>
                            }
                          />
                          <MovieconPicker
                            onSelectMoviecon={(moviecon) => handleCommentMovieconSelect(item.id, moviecon)}
                            trigger={
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-500 hover:bg-blue-500/10 h-8 w-8 p-0"
                                data-testid={`button-comment-moviecon-${item.id}`}
                              >
                                <Clapperboard className="w-3 h-3" />
                              </Button>
                            }
                          />
                          <Popover 
                            open={showCommentEmojiPicker === item.id} 
                            onOpenChange={(open) => setShowCommentEmojiPicker(open ? item.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-retro-yellow hover:bg-retro-yellow/10 h-8 w-8 p-0"
                                data-testid={`button-comment-emoji-${item.id}`}
                              >
                                <Smile className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 max-h-72 overflow-y-auto">
                              <div className="grid grid-cols-7 gap-1 p-2">
                                {commonEmojis.map((emoji, index) => (
                                  <Button
                                    key={index}
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 w-10 p-0 text-xl hover:bg-accent emoji-large"
                                    onClick={() => handleCommentEmojiClick(item.id, emoji)}
                                    data-testid={`comment-emoji-${item.id}-${index}`}
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            onClick={() => handleCommentSubmit(item.id)}
                            disabled={(!commentInputs[item.id]?.trim() && !commentMemes[item.id] && !commentMoviecons[item.id]) || addCommentMutation.isPending}
                            size="sm"
                            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-8"
                            data-testid={`button-submit-comment-${item.id}`}
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
            );
          }
          
          if (item.type === 'external_post') {
            const platformIcons: Record<string, any> = {
              tiktok: SiTiktok,
              instagram: SiInstagram,
              youtube: SiYoutube,
              twitch: SiTwitch,
              discord: SiDiscord,
              reddit: SiReddit,
              pinterest: SiPinterest,
            };
            
            const platformColors: Record<string, string> = {
              tiktok: 'from-black via-pink-500 to-cyan-500',
              instagram: 'from-purple-600 via-pink-500 to-orange-500',
              youtube: 'from-red-600 to-red-500',
              twitch: 'from-purple-600 to-purple-500',
              discord: 'from-indigo-600 to-blue-500',
              reddit: 'from-orange-600 to-orange-500',
              pinterest: 'from-red-700 to-red-600',
            };
            
            const PlatformIcon = platformIcons[item.platform] || ExternalLink;
            const platformGradient = platformColors[item.platform] || 'from-gray-600 to-gray-500';
            
            return (
              <Card
                key={item.id}
                className="bg-gradient-to-br from-card to-card/80 border-border overflow-hidden"
              >
                {/* Platform Header */}
                <div className={`bg-gradient-to-r ${platformGradient} px-4 py-2`}>
                  <div className="flex items-center gap-2">
                    <PlatformIcon className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold capitalize">{item.platform}</span>
                    <span className="text-white/80 text-sm">• @{item.platformUsername}</span>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="w-10 h-10 border-2 border-primary">
                      <AvatarImage src={resolveAssetUrl(item.author.profileImageUrl)} />
                      <AvatarFallback className="bg-muted text-foreground">
                        {item.author.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold text-primary">
                        {item.author.firstName} {item.author.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(item.platformCreatedAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Content */}
                  {item.content && (
                    <p className="text-foreground mb-3 whitespace-pre-wrap">
                      <LinkifyText text={item.content} />
                    </p>
                  )}
                  
                  {/* Media Thumbnail */}
                  {item.mediaUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                      <img 
                        src={item.mediaUrl} 
                        alt={`${item.platform} post`}
                        className="w-full object-cover max-h-96"
                      />
                    </div>
                  )}
                  
                  {/* View Original Button */}
                  <a
                    href={item.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground rounded-lg transition-all"
                    data-testid={`link-external-post-${item.id}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                  </a>
                </CardContent>
              </Card>
            );
          }
          
          return null; // For unknown types
        })()}
      </div>
    );
  })}
          
          {/* Infinite scroll trigger and loading indicator */}
          {hasNextPage && (
            <div 
              ref={loadMoreRef} 
              className="flex justify-center items-center py-8"
              data-testid="load-more-trigger"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more...</span>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Scroll down to load more
                </div>
              )}
            </div>
          )}
          
          {/* End of feed indicator */}
          {!hasNextPage && feedItems.length > 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              You've reached the end of your feed
            </div>
          )}
        </>
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

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share to Headlines</DialogTitle>
            <DialogDescription>
              Share this post to your Headlines feed so your kliq can see it
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPostToShare && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3 mb-2">
                  <img 
                    src={selectedPostToShare.author?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPostToShare.author?.firstName || 'User')}&background=random`} 
                    alt={selectedPostToShare.author?.firstName || 'User'} 
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-sm font-medium">
                    {selectedPostToShare.author?.firstName} {selectedPostToShare.author?.lastName}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {selectedPostToShare.content || "Post with media"}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowShareDialog(false)}
                className="flex-1"
                data-testid="button-cancel-share"
              >
                Cancel
              </Button>
              <Button 
                onClick={sharePostToHeadlines}
                className="flex-1"
                data-testid="button-confirm-share"
              >
                <Send className="w-4 h-4 mr-2" />
                Share to Headlines
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Report Content</span>
            </DialogTitle>
            <DialogDescription>
              Help us keep MyKliq safe by reporting inappropriate content
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-reason">Reason for report *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hate_speech">Hate Speech</SelectItem>
                  <SelectItem value="discrimination">Discrimination</SelectItem>
                  <SelectItem value="offensive">Offensive Content</SelectItem>
                  <SelectItem value="pornographic">Pornographic Content</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="report-description">Additional details (optional)</Label>
              <Textarea
                id="report-description"
                placeholder="Please provide additional context about why you're reporting this content..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={3}
                className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportDialog(false);
                  setReportReason("");
                  setReportDescription("");
                }}
                disabled={reportPostMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={reportPostMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {reportPostMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Post Dialog */}
      <Dialog open={showSavePostDialog} onOpenChange={(open) => {
        setShowSavePostDialog(open);
        if (!open) {
          setSaveAlbumId("none");
          setSaveNote("");
          setSelectedMediaUrlToSave(null);
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-white border-gray-300 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-black">Add to Scrapbook</DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-700">
              Add this post to your scrapbook and optionally organize it in an album
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-600">
              {(scrapbookSaves as any[]).length}/1000 added
            </div>
            
            {/* Multi-image selector - show when post has multiple images */}
            {selectedPostToSave?.media && selectedPostToSave.media.length > 1 && (
              <div>
                <Label className="text-black dark:text-black mb-2 block">Select image to save</Label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {selectedPostToSave.media.map((media: any, index: number) => (
                    <button
                      key={media.id || index}
                      type="button"
                      onClick={() => setSelectedMediaUrlToSave(media.mediaUrl)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedMediaUrlToSave === media.mediaUrl 
                          ? 'border-blue-500 ring-2 ring-blue-500/50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img 
                        src={resolveAssetUrl(media.mediaUrl)} 
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedMediaUrlToSave === media.mediaUrl && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                            ✓
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </button>
                  ))}
                </div>
                {!selectedMediaUrlToSave && (
                  <p className="text-sm text-orange-600 mt-2">Please select an image to save</p>
                )}
              </div>
            )}
            
            <div>
              <Label htmlFor="album-select" className="text-black dark:text-black">Album (optional)</Label>
              <Select value={saveAlbumId} onValueChange={setSaveAlbumId}>
                <SelectTrigger data-testid="select-album" className="bg-white dark:bg-white text-black dark:text-black border-gray-300">
                  <SelectValue placeholder="No album (add to All)" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-white border-gray-300">
                  <SelectItem value="none" className="text-black dark:text-black">No album</SelectItem>
                  {(scrapbookAlbums as any[]).map((album: any) => (
                    <SelectItem key={album.id} value={album.id} className="text-black dark:text-black">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: album.color }}
                        />
                        {album.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowCreateAlbumDialog(true)}
                className="mt-1 h-auto p-0 text-blue-600 dark:text-blue-600"
                data-testid="button-create-album"
              >
                + Create New Album
              </Button>
            </div>
            
            <div>
              <Label htmlFor="save-note" className="text-black dark:text-black">Note (optional)</Label>
              <Textarea
                id="save-note"
                placeholder="Add a personal note..."
                value={saveNote}
                onChange={(e) => setSaveNote(e.target.value)}
                rows={3}
                data-testid="textarea-save-note"
                className="bg-white dark:bg-white text-black dark:text-black border-gray-300"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSavePostDialog(false);
                  setSaveAlbumId("none");
                  setSaveNote("");
                  setSelectedMediaUrlToSave(null);
                }}
                className="border-gray-300 text-black dark:text-black bg-white dark:bg-white hover:bg-gray-100 dark:hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if ((scrapbookSaves as any[]).length >= 1000) {
                    toast({
                      title: "Limit Reached",
                      description: "You've reached the maximum of 1000 posts in your scrapbook.",
                      variant: "destructive",
                    });
                    return;
                  }
                  // Require image selection for multi-image posts
                  if (selectedPostToSave?.media && selectedPostToSave.media.length > 1 && !selectedMediaUrlToSave) {
                    toast({
                      title: "Select an Image",
                      description: "Please select which image you want to save from this post.",
                      variant: "destructive",
                    });
                    return;
                  }
                  savePostMutation.mutate({
                    postId: selectedPostToSave?.id,
                    albumId: saveAlbumId === "none" ? undefined : saveAlbumId,
                    note: saveNote || undefined,
                    selectedMediaUrl: selectedMediaUrlToSave || selectedPostToSave?.mediaUrl || undefined,
                  });
                }}
                disabled={savePostMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                data-testid="button-save-post"
              >
                {savePostMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Comment Dialog */}
      <Dialog open={showSaveCommentDialog} onOpenChange={setShowSaveCommentDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-black">Add Comment to Scrapbook</DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-700">
              Add this comment to your scrapbook and optionally organize it in an album
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-600">
              {(scrapbookSaves as any[]).length}/1000 added
            </div>
            
            <div>
              <Label htmlFor="comment-album-select" className="text-black dark:text-black">Album (optional)</Label>
              <Select value={saveAlbumId} onValueChange={setSaveAlbumId}>
                <SelectTrigger data-testid="select-comment-album" className="bg-white dark:bg-white text-black dark:text-black border-gray-300">
                  <SelectValue placeholder="No album (add to All)" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-white border-gray-300">
                  <SelectItem value="none" className="text-black dark:text-black">No album</SelectItem>
                  {(scrapbookAlbums as any[]).map((album: any) => (
                    <SelectItem key={album.id} value={album.id} className="text-black dark:text-black">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: album.color }}
                        />
                        {album.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowCreateAlbumDialog(true)}
                className="mt-1 h-auto p-0 text-blue-600 dark:text-blue-600"
                data-testid="button-create-comment-album"
              >
                + Create New Album
              </Button>
            </div>
            
            <div>
              <Label htmlFor="comment-save-note" className="text-black dark:text-black">Note (optional)</Label>
              <Textarea
                id="comment-save-note"
                placeholder="Add a personal note..."
                value={saveNote}
                onChange={(e) => setSaveNote(e.target.value)}
                rows={3}
                data-testid="textarea-comment-save-note"
                className="bg-white dark:bg-white text-black dark:text-black border-gray-300"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveCommentDialog(false);
                  setSaveAlbumId("none");
                  setSaveNote("");
                }}
                className="border-gray-300 text-black dark:text-black bg-white dark:bg-white hover:bg-gray-100 dark:hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if ((scrapbookSaves as any[]).length >= 1000) {
                    toast({
                      title: "Limit Reached",
                      description: "You've reached the maximum of 1000 items in your scrapbook.",
                      variant: "destructive",
                    });
                    return;
                  }
                  saveCommentMutation.mutate({
                    commentId: selectedCommentToSave?.id,
                    albumId: saveAlbumId === "none" ? undefined : saveAlbumId,
                    note: saveNote || undefined,
                  });
                }}
                disabled={saveCommentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                data-testid="button-save-comment"
              >
                {saveCommentMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Album Dialog */}
      <Dialog open={showCreateAlbumDialog} onOpenChange={setShowCreateAlbumDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-black">Create New Album</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="album-name" className="text-black dark:text-black">Album Name</Label>
              <Input
                id="album-name"
                placeholder="Enter album name..."
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                data-testid="input-album-name"
                className="bg-white dark:bg-white text-black dark:text-black border-gray-300"
              />
            </div>
            
            <div>
              <Label className="text-black dark:text-black">Album Color</Label>
              <div className="flex gap-2 mt-2">
                {["#FF1493", "#00BFFF", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewAlbumColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      newAlbumColor === color ? "border-black scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    data-testid={`button-color-${color}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateAlbumDialog(false);
                  setNewAlbumName("");
                  setNewAlbumColor("#FF1493");
                }}
                className="border-gray-300 text-black dark:text-black bg-white dark:bg-white hover:bg-gray-100 dark:hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!newAlbumName.trim()) {
                    toast({
                      title: "Error",
                      description: "Please enter an album name.",
                      variant: "destructive",
                    });
                    return;
                  }
                  createAlbumMutation.mutate({
                    name: newAlbumName,
                    color: newAlbumColor,
                  });
                }}
                disabled={createAlbumMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                data-testid="button-create-album-submit"
              >
                {createAlbumMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Album Dialog */}
      <Dialog open={showEditAlbumDialog} onOpenChange={setShowEditAlbumDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-black">Edit Album</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-album-name" className="text-black dark:text-black">Album Name</Label>
              <Input
                id="edit-album-name"
                placeholder="Enter album name..."
                value={editAlbumName}
                onChange={(e) => setEditAlbumName(e.target.value)}
                data-testid="input-edit-album-name"
                className="bg-white dark:bg-white text-black dark:text-black border-gray-300"
              />
            </div>
            
            <div>
              <Label className="text-black dark:text-black">Album Color</Label>
              <div className="flex gap-2 mt-2">
                {["#FF1493", "#00BFFF", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditAlbumColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      editAlbumColor === color ? "border-black scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    data-testid={`button-edit-color-${color}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditAlbumDialog(false);
                  setEditingAlbum(null);
                }}
                className="border-gray-300 text-black dark:text-black bg-white dark:bg-white hover:bg-gray-100 dark:hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editAlbumName.trim()) {
                    toast({
                      title: "Error",
                      description: "Please enter an album name.",
                      variant: "destructive",
                    });
                    return;
                  }
                  updateAlbumMutation.mutate({
                    id: editingAlbum?.id,
                    data: {
                      name: editAlbumName,
                      color: editAlbumColor,
                    },
                  });
                }}
                disabled={updateAlbumMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                data-testid="button-update-album"
              >
                {updateAlbumMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={showEditNoteDialog} onOpenChange={setShowEditNoteDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-black">Edit Note</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Add a personal note..."
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              rows={4}
              data-testid="textarea-edit-note"
              className="bg-white dark:bg-white text-black dark:text-black border-gray-300"
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditNoteDialog(false);
                  setEditingSaveNote(null);
                }}
                className="border-gray-300 text-black dark:text-black bg-white dark:bg-white hover:bg-gray-100 dark:hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  updateNoteMutation.mutate({
                    saveId: editingSaveNote?.id,
                    note: editNoteText,
                  });
                }}
                disabled={updateNoteMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                data-testid="button-update-note"
              >
                {updateNoteMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsave Confirmation Dialog */}
      <Dialog open={showUnsaveDialog} onOpenChange={setShowUnsaveDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-black">Remove from Scrapbook?</DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-700">
              This will remove the {postToUnsave?.type === 'action' ? 'video' : 'post'} from your scrapbook and delete any notes you've added.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnsaveDialog(false);
                setPostToUnsave(null);
              }}
              className="border-gray-300 text-black dark:text-black bg-white dark:bg-white hover:bg-gray-100 dark:hover:bg-gray-100"
            >
              Cancel
            </Button>
              <Button
                onClick={() => {
                  if (postToUnsave?.type === 'action') {
                    unsaveActionMutation.mutate(postToUnsave?.id);
                  } else {
                    unsavePostMutation.mutate(postToUnsave?.id);
                  }
                }}
                disabled={unsavePostMutation.isPending || unsaveActionMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white"
                data-testid="button-confirm-unsave"
              >
                {(unsavePostMutation.isPending || unsaveActionMutation.isPending) ? "Removing..." : "Remove"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Full-screen Image Viewer */}
        <ImageViewer
          media={imageViewerMedia}
          initialIndex={imageViewerIndex}
          isOpen={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          resolveUrl={resolveAssetUrl}
        />

      </div>
      </PullToRefresh>
    </PageWrapper>
  );
}
