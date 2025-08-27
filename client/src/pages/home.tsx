import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FilterManager } from "@/components/filter-manager";
import { Heart, MessageCircle, Share, Image as ImageIcon, Smile, Camera, Clapperboard, Plus, MapPin, Loader2, Edit, Calendar, Clock, Check, HelpCircle, X, Zap } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import { MediaUpload } from "@/components/MediaUpload";
import { PyramidChart } from "@/components/pyramid-chart";
import { GifPicker } from "@/components/GifPicker";
import { GifDisplay } from "@/components/GifDisplay";
import { MovieconPicker } from "@/components/MovieconPicker";
import { MovieconDisplay } from "@/components/MovieconDisplay";
import { YouTubeEmbedList } from "@/components/YouTubeEmbed";
import { extractYouTubeUrlsFromText } from "@/lib/youtubeUtils";
import { PollCard } from "@/components/PollCard";
import { SponsoredAd } from "@/components/SponsoredAd";
import { GoogleSearch } from "@/components/GoogleSearch";
import { EventCard } from "@/components/EventCard";
import { trackEvent } from "@/lib/analytics";
import Footer from "@/components/Footer";
import { usePostTranslation } from "@/lib/translationService";

import type { Gif, Moviecon } from "@shared/schema";


export default function Home() {
  const [newPost, setNewPost] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [selectedGif, setSelectedGif] = useState<Gif | null>(null);
  const [commentGifs, setCommentGifs] = useState<Record<string, Gif | null>>({});
  const [selectedMoviecon, setSelectedMoviecon] = useState<Moviecon | null>(null);
  const [commentMoviecons, setCommentMoviecons] = useState<Record<string, Moviecon | null>>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showReflectDialog, setShowReflectDialog] = useState(false);
  const [reflectionData, setReflectionData] = useState<any>(null);
  const [showHoroscopeDialog, setShowHoroscopeDialog] = useState(false);
  const [horoscopeData, setHoroscopeData] = useState<any>(null);
  const [showBibleVerseDialog, setShowBibleVerseDialog] = useState(false);
  const [bibleVerseData, setBibleVerseData] = useState<any>(null);

  const { user } = useAuth();
  const userData = user as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { translatePost, translateMoodText } = usePostTranslation();

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

  // Fetch kliq feed (posts, polls, events, actions from all kliq members)
  const { data: feedItems = [], isLoading: feedLoading, refetch: refetchFeed } = useQuery({
    queryKey: ["/api/kliq-feed"],
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 300000, // Keep cache for 5 minutes
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    refetchInterval: 120000, // Refetch every 2 minutes (reduced from 30s)
  });


  // Fetch targeted ads for the user
  const { data: targetedAds = [] } = useQuery({
    queryKey: ["/api/ads/targeted"],
  });

  // Separate different types of feed items
  const posts = (feedItems as any[]).filter((item: any) => item.type === 'post');
  const polls = (feedItems as any[]).filter((item: any) => item.type === 'poll');
  const activityItems = (feedItems as any[]).filter((item: any) => item.type !== 'post' && item.type !== 'poll');

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

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; gifId?: string; movieconId?: string }) => {
      await apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      setNewPost("");
      setSelectedGif(null);
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
      
      // Optimistically update the cache
      queryClient.setQueryData(["/api/kliq-feed"], (old: any) => {
        if (!old) return old;
        return old.map((item: any) => {
          if (item.id === postId) {
            const isAlreadyLiked = Array.isArray(item.likes) && user && item.likes.some((like: any) => like.userId === (user as any).id);
            if (isAlreadyLiked) {
              // Remove like
              return {
                ...item,
                likes: item.likes.filter((like: any) => like.userId !== (user as any).id)
              };
            } else {
              // Add like
              return {
                ...item,
                likes: [...(Array.isArray(item.likes) ? item.likes : []), { userId: (user as any).id }]
              };
            }
          }
          return item;
        });
      });
      
      return { previousFeed };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        queryClient.setQueryData(["/api/kliq-feed"], context.previousFeed);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Like recorded!",
        description: "Your like has been added to the post",
        duration: 2000,
        className: "bg-white text-black border-gray-300",
      });
    },
    onSettled: () => {
      // Don't invalidate immediately to preserve optimistic updates
      // Let the background refetch happen naturally
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content, gifId, movieconId }: { postId: string; content: string; gifId?: string; movieconId?: string }) => {
      await apiRequest("POST", `/api/posts/${postId}/comments`, { content, gifId, movieconId });
    },
    onMutate: async ({ postId, content, gifId, movieconId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/kliq-feed"] });
      
      // Snapshot the previous value
      const previousFeed = queryClient.getQueryData(["/api/kliq-feed"]);
      
      // Create optimistic comment
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content: content || '',
        gifId,
        movieconId,
        author: userData,
        createdAt: new Date().toISOString()
      };
      
      // Optimistically update the cache
      queryClient.setQueryData(["/api/kliq-feed"], (old: any) => {
        if (!old) return old;
        return old.map((item: any) => {
          if (item.id === postId) {
            const updatedComments = [...(item.comments || []), optimisticComment];
            return {
              ...item,
              comments: updatedComments,
              _commentsCount: updatedComments.length // Update comment count for UI
            };
          }
          return item;
        });
      });
      
      return { previousFeed };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        queryClient.setQueryData(["/api/kliq-feed"], context.previousFeed);
      }
    },
    onSuccess: (response, { postId }) => {
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      setCommentGifs(prev => ({ ...prev, [postId]: null }));
      setCommentMoviecons(prev => ({ ...prev, [postId]: null }));
      // Close the comment box after posting
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      
      // Keep the optimistic update - don't revert the count
      // The comment was already added optimistically and will be synced in background
      
      toast({
        title: "Comment added!",
        description: "Your comment has been posted",
      });
    },
    onSettled: () => {
      // Don't invalidate immediately to preserve optimistic updates
      // Let the background refetch happen naturally
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
      
      await apiRequest("POST", "/api/posts", {
        content: content,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationName: locationData.locationName || null,
        address: locationData.address || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setShowLocationDialog(false);
      setLocationName('');
      setAddress('');
      setUserLocation(null);
      toast({
        title: "Location shared!",
        description: "Your location has been posted to the Headlines",
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
    if (newPost.trim() || selectedGif || selectedMoviecon || selectedMood) {
      // Track post creation event
      trackEvent('create_post', 'engagement', 'post_created');
      
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
        gifId: selectedGif?.id,
        movieconId: selectedMoviecon?.id
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
    trackEvent('like_post', 'engagement', 'post_liked');
    
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
    const gifId = commentGifs[postId]?.id;
    const movieconId = commentMoviecons[postId]?.id;
    if (content || gifId || movieconId) {
      addCommentMutation.mutate({ postId, content: content || '', gifId, movieconId });
    }
  };

  const handleCommentInputChange = (postId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleCommentGifSelect = (postId: string, gif: Gif) => {
    setCommentGifs(prev => ({ ...prev, [postId]: gif }));
  };

  const handleCommentGifRemove = (postId: string) => {
    setCommentGifs(prev => ({ ...prev, [postId]: null }));
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
          duration: 2000,
          className: "bg-white text-black border-gray-300",
        });
      } else {
        // Fallback to clipboard
        const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Link copied!",
          description: "Post link copied to clipboard",
          duration: 2000,
          className: "bg-white text-black border-gray-300",
        });
      }
    } catch (error) {
      // Final fallback - copy just the URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "App link copied to clipboard",
          duration: 2000,
          className: "bg-white text-black border-gray-300",
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
    <div className="w-full max-w-none md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-4">
      {/* Post Creation */}
      <Card className="bg-gradient-to-r from-mykliq-purple/20 to-secondary/20 border-mykliq-purple/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-10 h-10 border-2 border-mykliq-orange">
              <AvatarImage src={userData?.profileImageUrl} />
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
          {selectedGif && (
            <div className="mt-3 flex items-center gap-2">
              <GifDisplay gif={selectedGif} className="max-w-xs" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedGif(null)}
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
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-mykliq-orange hover:bg-mykliq-orange/10"
                    data-testid="button-emoji-picker"
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
                className="text-mykliq-green hover:bg-mykliq-green/10"
                onClick={() => setShowMediaUpload(true)}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <GifPicker
                onSelectGif={setSelectedGif}
                trigger={
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-mykliq-purple hover:bg-mykliq-purple/10"
                  >
                    <span className="text-xs font-bold">GIF</span>
                  </Button>
                }
              />
              <MovieconPicker
                onSelectMoviecon={setSelectedMoviecon}
                trigger={
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-blue-500 hover:bg-blue-500/10"
                  >
                    <Clapperboard className="w-4 h-4" />
                  </Button>
                }
              />

              <Button 
                size="sm" 
                variant="ghost" 
                className="text-destructive hover:bg-destructive/10"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </Button>

              <Button 
                size="sm" 
                variant="ghost" 
                className="text-yellow-500 hover:bg-yellow-500/10"
                onClick={() => setShowMoodDialog(true)}
                data-testid="button-mood-picker"
              >
                <Zap className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleReflect}
                disabled={reflectMutation.isPending}
                variant="outline"
                className="px-4"
                data-testid="button-lets-reflect"
              >
                {reflectMutation.isPending ? "Reflecting..." : "Lets Reflect"}
              </Button>
              <Button
                onClick={() => horoscopeMutation.mutate()}
                disabled={horoscopeMutation.isPending}
                variant="outline"
                className="px-4"
                data-testid="button-daily-horoscope"
              >
                {horoscopeMutation.isPending ? "Loading..." : "Daily Horoscope"}
              </Button>
              <Button
                onClick={() => bibleVerseMutation.mutate()}
                disabled={bibleVerseMutation.isPending}
                variant="outline"
                className="px-4"
                data-testid="button-daily-bible-verse"
              >
                {bibleVerseMutation.isPending ? "Loading..." : "Daily Bible Verse"}
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={(!newPost.trim() && !selectedGif && !selectedMoviecon && !selectedMood) || createPostMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6"
                style={{ boxShadow: '0 0 15px hsl(var(--primary) / 0.4)' }}
              >
                {createPostMutation.isPending ? "Posting..." : "Post!"}
              </Button>
            </div>
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
                className="bg-input border-border text-foreground"
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
                className="bg-input border-border text-foreground"
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
                className="flex flex-col gap-2 h-auto py-4 hover:bg-accent"
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

      {/* Reflection Dialog */}
      <Dialog open={showReflectDialog} onOpenChange={setShowReflectDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-2xl">✨</span>
              <span>Your Kliq Reflection</span>
            </DialogTitle>
            <DialogDescription>
              Your most popular posts from the last 30 days
            </DialogDescription>
          </DialogHeader>
          
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
                                  <video className="w-full h-full object-cover">
                                    <source src={post.mediaUrl} type="video/mp4" />
                                  </video>
                                ) : (
                                  <img 
                                    src={post.mediaUrl} 
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
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowReflectDialog(false)}
              className="border-border text-foreground"
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
                >
                  Close
                </Button>
                <Button
                  onClick={async () => {
                    const horoscopePost = `🔮 My Daily Horoscope (${horoscopeData.sign}) 🔮\n\n${horoscopeData.horoscope}\n\n✨ Lucky Number: ${horoscopeData.luckyNumber}\n🎨 Lucky Color: ${horoscopeData.luckyColor}`;
                    
                    try {
                      await apiRequest("POST", "/api/posts", {
                        content: horoscopePost,
                        mediaUrl: null,
                        mediaType: null,
                        youtubeUrl: null,
                        type: 'post'
                      });
                      
                      setShowHoroscopeDialog(false);
                      queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
                      
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
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Post to Headlines
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
                >
                  Close
                </Button>
                <Button
                  onClick={async () => {
                    const versePost = `📖 Daily Bible Verse 📖\n\n"${bibleVerseData.verse}"\n\n— ${bibleVerseData.reference}\n\n💭 ${bibleVerseData.reflection}`;
                    
                    try {
                      await apiRequest("POST", "/api/posts", {
                        content: versePost,
                        mediaUrl: null,
                        mediaType: null,
                        youtubeUrl: null,
                        type: 'post'
                      });
                      
                      setShowBibleVerseDialog(false);
                      queryClient.invalidateQueries({ queryKey: ['/api/kliq-feed'] });
                      
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
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Post to Headlines
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
                        <AvatarImage src={story.author.profileImageUrl} />
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


          
          {(feedItems as any[]).filter((item: any) => item.type !== 'event').map((item: any, index: number) => {
          
          // Inject sponsored ads every 3 feed items
          const shouldShowAd = index > 0 && (index + 1) % 4 === 0 && (targetedAds as any[]).length > 0;
          const adIndex = Math.floor((index + 1) / 4 - 1) % (targetedAds as any[]).length;

          return (
            <div key={`feed-wrapper-${item.id}-${index}`}>
              {/* Show sponsored ad before this item if conditions are met */}
              {shouldShowAd && (targetedAds as any[])[adIndex] && (
                <div className="mb-4" key={`ad-${adIndex}-${index}`}>
                  <SponsoredAd ad={(targetedAds as any[])[adIndex]} />
                </div>
              )}
              {(() => {
          
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
          
          if (item.type === 'post') {
            return (
          <Card
            key={item.id}
            className={cn(
              "bg-gradient-to-br from-card to-card/80 border",
              item.author.id === userData?.id ? "border-primary/50" : "border-border"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="w-10 h-10 border-2 border-primary">
                  <AvatarImage src={item.author.profileImageUrl} />
                  <AvatarFallback className="bg-muted text-foreground">
                    {item.author.firstName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-primary">
                    {item.author.firstName} {item.author.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(item.createdAt)}
                  </p>
                </div>

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
                          <p className="text-foreground mb-3">{translatePost(cleanText)}</p>
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
              
              {/* Media Content */}
              {item.mediaUrl && (
                (() => {
                  const { cleanText } = extractYouTubeUrlsFromText(item.content || '');
                  const isEventPost = cleanText?.includes('📅 New event:') || cleanText?.includes('✏️ Updated event:');
                  
                  const mediaElement = (
                    <div className="mb-3 rounded-lg overflow-hidden bg-black/20">
                      {item.mediaType === 'video' ? (
                        <video 
                          src={item.mediaUrl} 
                          controls 
                          className="w-full max-h-96 object-cover"
                          preload="metadata"
                        />
                      ) : (
                        <img 
                          src={item.mediaUrl} 
                          alt="Post media" 
                          className="w-full max-h-96 object-cover"
                        />
                      )}
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
              
              {/* GIF Content */}
              {item.gif && (
                <div className="mb-3">
                  <GifDisplay gif={item.gif} className="max-w-md" />
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
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
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
                          <Avatar className="w-8 h-8 border border-border">
                            <AvatarImage src={comment.author?.profileImageUrl} />
                            <AvatarFallback className="bg-muted text-foreground text-xs">
                              {comment.author?.firstName?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
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
                              {comment.gif && (
                                <div className="mt-2">
                                  <GifDisplay gif={comment.gif} className="max-w-xs" />
                                </div>
                              )}
                              {comment.moviecon && (
                                <div className="mt-2">
                                  <MovieconDisplay moviecon={comment.moviecon} className="max-w-xs" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input */}
                  <div className="flex space-x-3">
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarImage src={userData?.profileImageUrl} />
                      <AvatarFallback className="bg-muted text-foreground text-xs">
                        {userData?.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      {commentGifs[item.id] && (
                        <div className="mb-2 flex items-center gap-2">
                          <GifDisplay gif={commentGifs[item.id]!} className="max-w-xs" />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCommentGifRemove(item.id)}
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
                          <GifPicker
                            onSelectGif={(gif) => handleCommentGifSelect(item.id, gif)}
                            trigger={
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-mykliq-purple hover:bg-mykliq-purple/10 h-8 w-8 p-0"
                                data-testid={`button-comment-gif-${item.id}`}
                              >
                                <span className="text-xs font-bold">GIF</span>
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
                            disabled={(!commentInputs[item.id]?.trim() && !commentGifs[item.id] && !commentMoviecons[item.id]) || addCommentMutation.isPending}
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
          
          return null; // For unknown types
        })()}
      </div>
    );
  })}
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

      <Footer />
    </div>
  );
}
