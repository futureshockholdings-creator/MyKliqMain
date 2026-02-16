import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PyramidChart } from "@/components/pyramid-chart";
import { PollCard } from "@/components/PollCard";
import { CreatePollDialog } from "@/components/CreatePollDialog";
import { RankingSuggestions } from "@/components/ranking-suggestions";
import { useVideoCall } from "@/contexts/VideoCallContext";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Edit, Plus, Copy, MessageCircle, X, BarChart3, LogOut, Calendar, MessagesSquare, Share2, PhoneCall } from "lucide-react";
import { useGroupVideoCall } from "@/contexts/GroupVideoCallContext";
import { apiRequest } from "@/lib/queryClient";
import { resolveAssetUrl, getApiBaseUrl } from "@/lib/apiConfig";
import { useToast } from "@/hooks/use-toast";
import { getInviteMessage, getAppStoreUrl, getDownloadText } from "@/lib/deviceDetection";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { PageWrapper } from "@/components/PageWrapper";
import { enhancedCache } from "@/lib/enterprise/enhancedCache";
import { getAuthToken, isTokenExpired } from "@/lib/tokenStorage";
import html2canvas from "html2canvas";

export default function Kliq() {
  const [kliqName, setKliqName] = useState("");
  const [kliqLeftEmoji, setKliqLeftEmoji] = useState("🏆");
  const [kliqRightEmoji, setKliqRightEmoji] = useState("🏆");
  const [editingName, setEditingName] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);
  const [isLeaveKliqDialogOpen, setIsLeaveKliqDialogOpen] = useState(false);
  const [selectedKliqsToLeave, setSelectedKliqsToLeave] = useState<string[]>([]);
  const [isCloseKliqDialogOpen, setIsCloseKliqDialogOpen] = useState(false);
  const [isGroupChatDialogOpen, setIsGroupChatDialogOpen] = useState(false);
  const [isGroupVideoCallDialogOpen, setIsGroupVideoCallDialogOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedVideoCallParticipants, setSelectedVideoCallParticipants] = useState<string[]>([]);
  const [groupChatName, setGroupChatName] = useState("");
  const [isJoinKliqDialogOpen, setIsJoinKliqDialogOpen] = useState(false);
  const [joinInviteCode, setJoinInviteCode] = useState("");
  const [isJoiningKliq, setIsJoiningKliq] = useState(false);
  const [pyramidPreview, setPyramidPreview] = useState<string | null>(null);
  const [isCapturingPyramid, setIsCapturingPyramid] = useState(false);
  const [isPostingPyramid, setIsPostingPyramid] = useState(false);
  const [showPyramidConfirm, setShowPyramidConfirm] = useState(false);
  const pyramidRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const userData = user as { 
    id?: string; 
    firstName?: string; 
    lastName?: string; 
    kliqName?: string; 
    kliqLeftEmoji?: string;
    kliqRightEmoji?: string;
    inviteCode?: string; 
    kliqClosed?: boolean;
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Video call functionality
  const { initiateCall } = useVideoCall();
  const { initiateGroupCall, callState: groupCallState } = useGroupVideoCall();

  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<{ 
    id: string; 
    rank: number; 
    friend: { 
      id: string; 
      firstName?: string; 
      lastName?: string; 
      profileImageUrl?: string; 
    }; 
  }[]>({
    queryKey: ["/api/friends"],
    refetchInterval: 15000, // Poll every 15 seconds for new connections
    refetchOnMount: 'always', // Always refresh when navigating to this page
    refetchOnWindowFocus: true,
  });

  // Fetch pending join requests (for kliq owner)
  const { data: pendingRequests } = useQuery<{ 
    id: string; 
    friendId: string;
    friend: { 
      id: string; 
      firstName?: string; 
      lastName?: string; 
      profileImageUrl?: string; 
    };
    createdAt: string;
  }[]>({
    queryKey: ["/api/friends/pending-requests"],
    retry: false,
    staleTime: 5000,
    refetchInterval: 15000, // Poll every 15 seconds for pending requests
    refetchOnMount: 'always', // Always refresh when navigating to this page
    refetchOnWindowFocus: true,
  });
  
  const safePendingRequests = pendingRequests ?? [];

  // Approve pending request mutation
  const approvePendingMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("POST", `/api/friends/pending-requests/${friendId}/approve`);
    },
    onSuccess: async () => {
      await enhancedCache.removeByPattern('/api/friends');
      await queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/friends/pending-requests"] });
      await queryClient.refetchQueries({ queryKey: ["/api/friends"], type: 'active' });
      await queryClient.refetchQueries({ queryKey: ["/api/friends/pending-requests"], type: 'active' });
      toast({
        title: "Request approved!",
        description: "They have been added to your kliq",
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
        description: "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  // Decline pending request mutation
  const declinePendingMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("POST", `/api/friends/pending-requests/${friendId}/decline`);
    },
    onSuccess: async () => {
      await enhancedCache.removeByPattern('/api/friends/pending-requests');
      await queryClient.invalidateQueries({ queryKey: ["/api/friends/pending-requests"] });
      await queryClient.refetchQueries({ queryKey: ["/api/friends/pending-requests"], type: 'active' });
      toast({
        title: "Request declined",
        description: "The join request has been declined",
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
        description: "Failed to decline request",
        variant: "destructive",
      });
    },
  });

  // Fetch user's own polls for the kliq poll tab
  const { data: polls = [], isLoading: pollsLoading } = useQuery<any[]>({
    queryKey: ["/api/polls", "mine"],
    queryFn: () => apiRequest("GET", "/api/polls?scope=mine"),
  });

  // Join another kliq using invite code
  const handleJoinKliq = async () => {
    if (!joinInviteCode.trim()) {
      toast({
        title: "Enter invite code",
        description: "Please enter a valid invite code",
        variant: "destructive",
      });
      return;
    }

    setIsJoiningKliq(true);
    try {
      // First validate the invite code
      const validationResponse = await apiRequest("POST", "/api/auth/validate-invite-code", {
        inviteCode: joinInviteCode.trim()
      });

      if (!validationResponse.success) {
        toast({
          title: "Invalid invite code",
          description: validationResponse.message || "This invite code is not valid",
          variant: "destructive",
        });
        return;
      }

      // Use the invite code to join the kliq
      const response = await apiRequest("POST", "/api/friends/invite", {
        inviteCode: joinInviteCode.trim()
      });

      // Clear all relevant caches
      await enhancedCache.removeByPattern('/api/friends');
      await enhancedCache.removeByPattern('/api/kliq-feed');
      await enhancedCache.removeByPattern('/api/notifications');
      
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      await queryClient.refetchQueries({ queryKey: ["/api/friends"], type: 'active' });

      // Check if this is a pending request or immediate acceptance
      if (response.pending) {
        toast({
          title: "Request sent!",
          description: response.message || "Your request to join has been sent to the kliq owner for approval",
        });
      } else {
        toast({
          title: "Joined kliq!",
          description: `You've successfully joined ${validationResponse.kliqOwner?.firstName}'s kliq!`,
        });
      }

      // Close dialog and reset form
      setIsJoinKliqDialogOpen(false);
      setJoinInviteCode("");
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
      
      const errorMessage = error?.message || "Failed to join kliq";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsJoiningKliq(false);
    }
  };

  // Update kliq name and emojis
  const updateNameMutation = useMutation({
    mutationFn: async (data: { kliqName: string; kliqLeftEmoji: string; kliqRightEmoji: string }) => {
      await apiRequest("PUT", "/api/user/profile", data);
    },
    onSuccess: async () => {
      // Clear enterprise cache first to prevent stale data from repopulating
      await enhancedCache.removeByPattern('/api/auth/user');
      await enhancedCache.removeByPattern('/api/user');
      // Then refetch to ensure server state is in sync
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditingName(false);
      toast({
        title: "Kliq name updated!",
        description: "Your kliq has a new name",
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
        description: "Failed to update kliq name",
        variant: "destructive",
      });
    },
  });

  // Update friend rank
  const updateRankMutation = useMutation({
    mutationFn: async ({ friendId, rank }: { friendId: string; rank: number }) => {
      await apiRequest("PUT", `/api/friends/${friendId}/rank`, { rank });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend rank updated!",
        description: "Your pyramid has been reorganized",
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
        description: "Failed to update friend rank",
        variant: "destructive",
      });
    },
  });

  // Join kliq
  const joinKliqMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/friends/invite", { inviteCode: code });
      return response;
    },
    onSuccess: async (data: { pending?: boolean; message?: string }) => {
      setInviteCode("");
      setIsInviteDialogOpen(false);
      
      if (data?.pending) {
        await enhancedCache.removeByPattern('/api/friends/pending-requests');
        await queryClient.invalidateQueries({ queryKey: ["/api/friends/pending-requests"] });
        await queryClient.refetchQueries({ queryKey: ["/api/friends/pending-requests"], type: 'active' });
        toast({
          title: "Request sent!",
          description: data.message || "Your request to rejoin has been sent for approval",
        });
      } else {
        await enhancedCache.removeByPattern('/api/friends');
        await queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
        await queryClient.refetchQueries({ queryKey: ["/api/friends"], type: 'active' });
        toast({
          title: "Joined kliq!",
          description: "You've successfully joined a new kliq",
        });
      }
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
        description: "Failed to join kliq. Check your invite code.",
        variant: "destructive",
      });
    },
  });

  // Send friend invites
  const sendInvitesMutation = useMutation({
    mutationFn: async (phoneNumbers: string[]) => {
      const response = await apiRequest("POST", "/api/friends/send-invites", { phoneNumbers });
      return response;
    },
    onSuccess: (data) => {
      setPhoneNumbers("");
      setIsInviteDialogOpen(false);
      toast({
        title: "Invites sent!",
        description: data.message || "Invites have been sent to the provided phone numbers",
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
      
      // Try to parse error message from server
      let errorMessage = "Failed to send invites. Please check the phone numbers.";
      if (error.message && error.message.includes("400: ")) {
        const serverError = error.message.replace("400: ", "");
        try {
          const parsed = JSON.parse(serverError);
          errorMessage = parsed.error || errorMessage;
        } catch {
          errorMessage = serverError || errorMessage;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Test Twilio configuration
  const testTwilioMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/twilio/test");
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Twilio Test Successful",
        description: `Account: ${data.account.status} | Phone: ${data.configuredFrom}`,
      });
      console.log("Twilio test results:", data);
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
      
      let errorMessage = "Twilio configuration test failed";
      if (error.message) {
        try {
          const parsed = JSON.parse(error.message.replace(/^\d+: /, ""));
          errorMessage = parsed.message || parsed.error || errorMessage;
        } catch {
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast({
        title: "Twilio Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Twilio test error:", error);
    },
  });

  // Check message status
  const checkMessageStatusMutation = useMutation({
    mutationFn: async (messageSid: string) => {
      const response = await apiRequest("GET", `/api/twilio/status/${messageSid}`);
      return response;
    },
    onSuccess: (data) => {
      const msg = data.message;
      toast({
        title: "Message Status",
        description: `Status: ${msg.status} | ${msg.errorMessage || 'No errors'}`,
        variant: msg.status === 'failed' ? "destructive" : "default",
      });
      console.log("Message status:", data);
    },
    onError: (error: any) => {
      toast({
        title: "Status Check Failed",
        description: "Could not fetch message status",
        variant: "destructive",
      });
      console.error("Message status error:", error);
    },
  });

  // Query for kliqs the user has joined (not their own)
  const { data: joinedKliqs = [] } = useQuery({
    queryKey: ["/api/kliqs/joined"],
    queryFn: async () => {
      return apiRequest("GET", "/api/kliqs/joined");
    },
    enabled: isLeaveKliqDialogOpen,
  });

  // Leave specific kliq mutation
  const leaveKliqMutation = useMutation({
    mutationFn: async (kliqOwnerIds: string[]) => {
      await Promise.all(
        kliqOwnerIds.map(id => apiRequest("DELETE", `/api/kliqs/${id}/leave`))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliqs/joined"] });
      setIsLeaveKliqDialogOpen(false);
      setSelectedKliqsToLeave([]);
      toast({
        title: "Left kliq(s)",
        description: "You have successfully left the selected kliq(s)",
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
        description: "Failed to leave kliq",
        variant: "destructive",
      });
    },
  });

  // Close Kliq mutation - toggles kliq closed status
  const closeKliqMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/user/profile", { kliqClosed: !userData?.kliqClosed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsCloseKliqDialogOpen(false);
      toast({
        title: userData?.kliqClosed ? "Kliq opened" : "Kliq closed",
        description: userData?.kliqClosed 
          ? "Your kliq is now open to new members until you reach 28 friends" 
          : "Your kliq is now closed to new members",
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
        description: "Failed to update kliq status",
        variant: "destructive",
      });
    },
  });

  // Remove friend
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("DELETE", `/api/friends/${friendId}`);
    },
    onSuccess: async () => {
      await enhancedCache.removeByPattern('/api/friends');
      await queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      await queryClient.refetchQueries({ queryKey: ["/api/friends"], type: 'active' });
      setFriendToRemove(null);
      toast({
        title: "Friend removed",
        description: "They have been removed from your kliq",
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
        description: "Failed to remove friend",
        variant: "destructive",
      });
    },
  });

  const handleSaveKliqName = () => {
    if (kliqName.trim()) {
      updateNameMutation.mutate({
        kliqName: kliqName.trim(),
        kliqLeftEmoji: kliqLeftEmoji,
        kliqRightEmoji: kliqRightEmoji
      });
    }
  };

  const handleRankChange = (friendId: string, newRank: number) => {
    updateRankMutation.mutate({ friendId, rank: newRank });
  };

  const handleSendInvites = () => {
    if (phoneNumbers.trim()) {
      const numbers = phoneNumbers
        .split('\n')
        .map(num => num.trim())
        .filter(num => num.length > 0);
      
      if (numbers.length > 0) {
        sendInvitesMutation.mutate(numbers);
      }
    }
  };

  // Video call handlers
  const handleVideoCall = async (participantIds: string[]) => {
    const friendId = participantIds[0];
    const friend = friends.find(f => f.friend.id === friendId);
    if (!friend) {
      toast({
        title: "Error",
        description: "Friend not found",
        variant: "destructive",
      });
      return;
    }
    
    const friendName = friend.friend.firstName && friend.friend.lastName 
      ? `${friend.friend.firstName} ${friend.friend.lastName}`
      : friend.friend.firstName || "Friend";
    const friendAvatar = friend.friend.profileImageUrl;
    
    try {
      await initiateCall(friendId, friendName, friendAvatar);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start video call",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = (friendId: string) => {
    setFriendToRemove(friendId);
  };

  const confirmRemoveFriend = () => {
    if (friendToRemove) {
      removeFriendMutation.mutate(friendToRemove);
    }
  };

  const handleLeaveKliq = () => {
    if (selectedKliqsToLeave.length > 0) {
      leaveKliqMutation.mutate(selectedKliqsToLeave);
    }
  };

  const toggleKliqToLeave = (kliqId: string) => {
    setSelectedKliqsToLeave(prev => 
      prev.includes(kliqId) 
        ? prev.filter(id => id !== kliqId)
        : [...prev, kliqId]
    );
  };

  const handleCloseKliq = () => {
    setIsCloseKliqDialogOpen(true);
  };

  const confirmCloseKliq = () => {
    closeKliqMutation.mutate();
  };

  const handleCapturePyramid = useCallback(async () => {
    if (!pyramidRef.current) return;
    setIsCapturingPyramid(true);
    try {
      const canvas = await html2canvas(pyramidRef.current, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        scale: 2,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      setPyramidPreview(dataUrl);
      setShowPyramidConfirm(true);
    } catch (error) {
      console.error("Failed to capture pyramid:", error);
      toast({
        title: "Capture failed",
        description: "Could not capture your pyramid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturingPyramid(false);
    }
  }, [toast]);

  const handlePostPyramid = useCallback(async () => {
    if (!pyramidPreview) return;
    setIsPostingPyramid(true);
    try {
      const response = await fetch(pyramidPreview);
      const blob = await response.blob();

      const baseUrl = getApiBaseUrl();
      const uploadHeaders: Record<string, string> = { "Content-Type": "image/png" };
      const token = getAuthToken();
      if (token && !isTokenExpired(token)) {
        uploadHeaders["Authorization"] = `Bearer ${token}`;
      }
      const uploadRes = await fetch(`${baseUrl}/api/media/upload-direct`, {
        method: "POST",
        headers: uploadHeaders,
        body: blob,
        credentials: "include",
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { mediaUrl } = await uploadRes.json();

      const kliqDisplayName = userData?.kliqName || "My Kliq";
      await apiRequest("POST", "/api/posts", {
        content: `Check out my ${kliqDisplayName} friend pyramid!`,
        mediaUrl,
        mediaType: "image",
      });

      await enhancedCache.removeByPattern('/api/posts');
      await queryClient.invalidateQueries({ queryKey: ["/api/posts"] });

      setShowPyramidConfirm(false);
      setPyramidPreview(null);
      toast({
        title: "Pyramid posted!",
        description: "Your friend pyramid has been shared to Headlines",
      });
    } catch (error) {
      console.error("Failed to post pyramid:", error);
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({
        title: "Post failed",
        description: "Could not post your pyramid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPostingPyramid(false);
    }
  }, [pyramidPreview, userData?.kliqName, queryClient, toast]);

  const handleMessageFriend = async (friendId: string, friendName: string) => {
    try {
      // Create or get conversation
      const response = await apiRequest("POST", "/api/messages/conversations", {
        participantId: friendId,
      });
      
      const conversationId = response.id;
      navigate(`/messages/${conversationId}`);
      
      toast({
        title: "Starting conversation",
        description: `Messaging ${friendName}`,
      });
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
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
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = async () => {
    if (userData?.inviteCode && userData?.firstName) {
      try {
        const fullMessage = getInviteMessage(userData.firstName, userData.inviteCode);
        await navigator.clipboard.writeText(fullMessage);
        toast({
          title: "Copied!",
          description: "Full invite message copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to copy invite message",
          variant: "destructive",
        });
      }
    }
  };

  // Create group chat mutation
  const createGroupChatMutation = useMutation({
    mutationFn: async (data: { name?: string; participantIds: string[] }) => {
      return await apiRequest("POST", "/api/group-chats", data);
    },
    onSuccess: (groupChat) => {
      setIsGroupChatDialogOpen(false);
      setSelectedParticipants([]);
      setGroupChatName("");
      enhancedCache.removeByPattern('/api/messages');
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      toast({
        title: "Group chat created!",
        description: "Your group chat has been created",
      });
      navigate(`/group-chat/${groupChat.id}`);
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
        description: "Failed to create group chat",
        variant: "destructive",
      });
    },
  });

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleVideoCallParticipant = (userId: string) => {
    setSelectedVideoCallParticipants(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      if (prev.length >= 7) {
        toast({
          title: "Limit Reached",
          description: "You can select up to 7 friends for a group video call (8 total including you)",
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, userId];
    });
  };

  const handleCreateGroupChat = () => {
    if (selectedParticipants.length < 2) {
      toast({
        title: "Error",
        description: "Please select at least 2 members",
        variant: "destructive",
      });
      return;
    }

    createGroupChatMutation.mutate({
      name: groupChatName.trim() || undefined,
      participantIds: selectedParticipants,
    });
  };

  const handleStartGroupVideoCall = async () => {
    if (selectedVideoCallParticipants.length < 1) {
      toast({
        title: "Error",
        description: "Please select at least 1 friend to call",
        variant: "destructive",
      });
      return;
    }

    try {
      const participantsList = selectedVideoCallParticipants.map(id => {
        const f = friends.find(fr => fr.friend.id === id);
        return {
          id,
          name: f ? `${f.friend.firstName || ''} ${f.friend.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
          avatar: f?.friend.profileImageUrl,
        };
      });

      const kliqDisplayName = userData.kliqName || 'Kliq Video Call';
      await initiateGroupCall(
        `kliq_video_${userData.id}`,
        kliqDisplayName,
        participantsList
      );
      setIsGroupVideoCallDialogOpen(false);
      setSelectedVideoCallParticipants([]);
    } catch (error: any) {
      toast({
        title: "Call Failed",
        description: error.message || "Unable to start group video call. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageWrapper>
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">
            {editingName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="text-2xl cursor-pointer hover:opacity-80 p-2 rounded transition-opacity" 
                       onClick={() => {
                         const emojis = ['🏆', '🚀', '🎆', '✨', '🔥', '💫', '❤️', '👏', '🌟', '💎', '🎉', '⚡', '🎯', '💪', '👑', '🦄'];
                         const currentIndex = emojis.indexOf(kliqLeftEmoji);
                         const nextIndex = (currentIndex + 1) % emojis.length;
                         setKliqLeftEmoji(emojis[nextIndex]);
                       }}
                       data-testid="emoji-left-selector">
                    {kliqLeftEmoji}
                  </div>
                  <Input
                    value={kliqName}
                    onChange={(e) => setKliqName(e.target.value)}
                    className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 text-center"
                    placeholder={userData?.kliqName || "My Kliq"}
                    data-testid="input-kliq-name"
                  />
                  <div className="text-2xl cursor-pointer hover:opacity-80 p-2 rounded transition-opacity" 
                       onClick={() => {
                         const emojis = ['🏆', '🚀', '🎆', '✨', '🔥', '💫', '❤️', '👏', '🌟', '💎', '🎉', '⚡', '🎯', '💪', '👑', '🦄'];
                         const currentIndex = emojis.indexOf(kliqRightEmoji);
                         const nextIndex = (currentIndex + 1) % emojis.length;
                         setKliqRightEmoji(emojis[nextIndex]);
                       }}
                       data-testid="emoji-right-selector">
                    {kliqRightEmoji}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center">Click emojis to cycle through options</div>
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    onClick={handleSaveKliqName}
                    disabled={updateNameMutation.isPending}
                    className="bg-mykliq-green hover:bg-mykliq-green/90 text-foreground"
                    data-testid="button-save-kliq"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <span data-testid="kliq-display">
                  {userData?.kliqLeftEmoji || '🏆'} {userData?.kliqName || "My Kliq"} {userData?.kliqRightEmoji || '🏆'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setKliqName(userData?.kliqName || "");
                    setKliqLeftEmoji(userData?.kliqLeftEmoji || '🏆');
                    setKliqRightEmoji(userData?.kliqRightEmoji || '🏆');
                    setEditingName(true);
                  }}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  data-testid="button-edit-kliq"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </>
            )}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Drag friends to reorder your pyramid
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger value="friends" className="flex items-center gap-2" data-testid="tab-friends">
            <Users className="w-4 h-4" />
            Friends ({friends.length}/28)
          </TabsTrigger>
          <TabsTrigger value="smart-ranking" className="flex items-center gap-2" data-testid="tab-smart-ranking">
            <MessageCircle className="w-4 h-4" />
            Smart Ranking
          </TabsTrigger>
          <TabsTrigger value="polls" className="flex items-center gap-2" data-testid="tab-polls">
            <BarChart3 className="w-4 h-4" />
            Polls ({polls.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2" data-testid="tab-calendar" onClick={() => navigate('/calendar')}>
            <Calendar className="w-4 h-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-card-foreground" data-testid="text-friend-count">
                  {friends.length}/28
                </div>
                <div className="text-sm text-card-foreground">Friends</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-card-foreground" data-testid="text-open-spots">
                  {28 - friends.length}
                </div>
                <div className="text-sm text-card-foreground">Open Spots</div>
              </CardContent>
            </Card>
          </div>

          {/* Join Kliq Dialog */}
          <Dialog open={isJoinKliqDialogOpen} onOpenChange={setIsJoinKliqDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Join Another Kliq</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Enter Invite Code
                  </label>
                  <Input
                    value={joinInviteCode}
                    onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC123XY"
                    className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 uppercase"
                    disabled={isJoiningKliq}
                    maxLength={14}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the invitation code you received from a friend to join their kliq
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsJoinKliqDialogOpen(false);
                      setJoinInviteCode("");
                    }}
                    disabled={isJoiningKliq}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleJoinKliq}
                    disabled={!joinInviteCode.trim() || isJoiningKliq}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80"
                  >
                    {isJoiningKliq ? "Joining..." : "Join Kliq"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Pending Join Requests */}
          {safePendingRequests.length > 0 && (
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-800 dark:text-amber-200 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Pending Join Requests ({safePendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {safePendingRequests.map((request) => (
                  <div 
                    key={request.id} 
                    className="flex items-center justify-between bg-white dark:bg-background rounded-lg p-3 border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-700 dark:text-amber-300 font-medium">
                        {request.friend.firstName?.[0]}{request.friend.lastName?.[0]}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {request.friend.firstName} {request.friend.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Wants to rejoin your kliq
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => declinePendingMutation.mutate(request.friendId)}
                        disabled={declinePendingMutation.isPending}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => approvePendingMutation.mutate(request.friendId)}
                        disabled={approvePendingMutation.isPending}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pyramid Chart with Group Chat Button */}
          <div className="relative">
            {/* Group Chat Button - Top Left Corner */}
            <Dialog open={isGroupChatDialogOpen} onOpenChange={setIsGroupChatDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="absolute top-0 left-0 z-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-12 w-12 rounded-full p-0"
                  data-testid="button-new-group-chat"
                >
                  <MessagesSquare className="!w-8 !h-8" strokeWidth={1.5} />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-foreground max-w-md mx-auto max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-mykliq-green">Create Group Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Optional Group Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Group Name (Optional)</label>
                    <Input
                      placeholder="e.g., Weekend Squad"
                      value={groupChatName}
                      onChange={(e) => setGroupChatName(e.target.value)}
                      className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
                      data-testid="input-group-name"
                    />
                  </div>

                  {/* Member Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Members (min 2)
                      <span className="ml-2 text-muted-foreground">
                        {selectedParticipants.length} selected
                      </span>
                    </label>
                    {friends.length === 0 ? (
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          You need at least 2 friends to create a group chat.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Add friends to your kliq first!
                        </p>
                      </div>
                    ) : friends.length === 1 ? (
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          You need at least one more friend to create a group chat.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Currently have {friends.length} friend - need 2 minimum.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {friends.map((f) => (
                          <div
                            key={f.friend.id}
                            className="flex items-center space-x-3 p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer"
                            onClick={() => toggleParticipant(f.friend.id)}
                            data-testid={`friend-${f.friend.id}`}
                          >
                            <Checkbox
                              checked={selectedParticipants.includes(f.friend.id)}
                              onCheckedChange={() => toggleParticipant(f.friend.id)}
                              data-testid={`checkbox-${f.friend.id}`}
                            />
                            <div className="flex items-center gap-2 flex-1">
                              {f.friend.profileImageUrl ? (
                                <img
                                  src={resolveAssetUrl(f.friend.profileImageUrl)}
                                  alt={`${f.friend.firstName} ${f.friend.lastName}`}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                                  {f.friend.firstName?.[0]}{f.friend.lastName?.[0]}
                                </div>
                              )}
                              <span className="font-medium">
                                {f.friend.firstName} {f.friend.lastName}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Create Button */}
                  <Button
                    onClick={handleCreateGroupChat}
                    disabled={selectedParticipants.length < 2 || createGroupChatMutation.isPending || friends.length < 2}
                    className="w-full bg-mykliq-green hover:bg-mykliq-green/90 text-white"
                    data-testid="button-create-group"
                  >
                    {createGroupChatMutation.isPending ? "Creating..." : "Create Group Chat"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Group Video Call Button - Top Right Corner */}
            <Dialog open={isGroupVideoCallDialogOpen} onOpenChange={(open) => {
              setIsGroupVideoCallDialogOpen(open);
              if (!open) setSelectedVideoCallParticipants([]);
            }}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="absolute top-0 right-0 z-10 bg-red-600 hover:bg-red-700 text-white shadow-lg h-12 w-12 rounded-full p-0 flex items-center justify-center overflow-hidden"
                  disabled={groupCallState !== 'idle'}
                  data-testid="button-group-video-call"
                >
                  <div className="flex items-center justify-center">
                    <PhoneCall className="w-7 h-7 -mr-2.5" strokeWidth={2} />
                    <PhoneCall className="w-7 h-7 -ml-2.5" strokeWidth={2} />
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-foreground max-w-md mx-auto max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-mykliq-green">Group Video Call</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Friends to Call (max 7)
                      <span className="ml-2 text-muted-foreground">
                        {selectedVideoCallParticipants.length}/7 selected
                      </span>
                    </label>
                    {friends.length === 0 ? (
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          You need at least 1 friend to start a group video call.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Add friends to your kliq first!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {friends.map((f) => (
                          <div
                            key={f.friend.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer ${
                              selectedVideoCallParticipants.length >= 7 && !selectedVideoCallParticipants.includes(f.friend.id)
                                ? 'opacity-50'
                                : ''
                            }`}
                            onClick={() => toggleVideoCallParticipant(f.friend.id)}
                          >
                            <Checkbox
                              checked={selectedVideoCallParticipants.includes(f.friend.id)}
                              onCheckedChange={() => toggleVideoCallParticipant(f.friend.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex items-center gap-2 flex-1">
                              {f.friend.profileImageUrl ? (
                                <img
                                  src={resolveAssetUrl(f.friend.profileImageUrl)}
                                  alt={`${f.friend.firstName} ${f.friend.lastName}`}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                                  {f.friend.firstName?.[0]}{f.friend.lastName?.[0]}
                                </div>
                              )}
                              <span className="font-medium">
                                {f.friend.firstName} {f.friend.lastName}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Group video calls support up to 8 participants (you + 7 friends)
                  </p>

                  <Button
                    onClick={handleStartGroupVideoCall}
                    disabled={selectedVideoCallParticipants.length < 1 || groupCallState !== 'idle'}
                    className="w-full bg-mykliq-green hover:bg-mykliq-green/90 text-white"
                    data-testid="button-start-group-call"
                  >
                    {groupCallState !== 'idle' ? "In Call..." : `Start Video Call (${selectedVideoCallParticipants.length + 1} participants)`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Pyramid Chart */}
            {friendsLoading ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <div className="animate-pulse space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto"></div>
                  <div className="space-y-2">
                    <div className="w-24 h-4 bg-muted rounded mx-auto"></div>
                    <div className="w-32 h-3 bg-muted rounded mx-auto"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : friends.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-bold text-muted-foreground mb-2">No friends yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Share your invite code or join someone else's kliq to get started!
                </p>
                <Button
                  onClick={() => setIsInviteDialogOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Join a Kliq
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PyramidChart
              ref={pyramidRef}
              friends={friends.map(f => ({
                id: f.friend.id,
                firstName: f.friend.firstName,
                lastName: f.friend.lastName,
                profileImageUrl: f.friend.profileImageUrl,
                rank: f.rank
              }))}
              onRankChange={handleRankChange}
              onMessage={handleMessageFriend}
              onVideoCall={handleVideoCall}
              onRemove={handleRemoveFriend}
              maxFriends={28}
              kliqName={userData?.kliqName}
              kliqLeftEmoji={userData?.kliqLeftEmoji}
              kliqRightEmoji={userData?.kliqRightEmoji}
              kliqClosed={userData?.kliqClosed}
              onCloseKliq={handleCloseKliq}
              isClosingKliq={false}
              onJoinKliq={() => setIsJoinKliqDialogOpen(true)}
            />
            )}
          </div>

          {/* Post Pyramid & Leave Kliq Buttons - only show if user has friends */}
          {friends.length > 0 && (
            <div className="flex justify-between items-center">
              <Button
                size="sm"
                onClick={handleCapturePyramid}
                disabled={isCapturingPyramid}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-post-pyramid"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {isCapturingPyramid ? "Capturing..." : "Post Pyramid"}
              </Button>
              <Dialog open={isLeaveKliqDialogOpen} onOpenChange={(open) => {
                setIsLeaveKliqDialogOpen(open);
                if (!open) setSelectedKliqsToLeave([]);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    data-testid="button-leave-kliq"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Kliq
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground max-w-md mx-auto max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-red-600">Leave Kliq</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select the kliq(s) you want to leave:
                    </p>
                    {joinedKliqs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        You haven't joined any other kliqs yet.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {joinedKliqs.map((kliq: any) => (
                          <div
                            key={kliq.kliqId}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedKliqsToLeave.includes(kliq.kliqId)
                                ? "border-red-500 bg-red-500/10"
                                : "border-border hover:bg-muted/50"
                            }`}
                            onClick={() => toggleKliqToLeave(kliq.kliqId)}
                          >
                            <Checkbox
                              checked={selectedKliqsToLeave.includes(kliq.kliqId)}
                              onCheckedChange={() => toggleKliqToLeave(kliq.kliqId)}
                              className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <img
                              src={kliq.kliqOwner?.profileImageUrl ? resolveAssetUrl(kliq.kliqOwner.profileImageUrl) : `https://ui-avatars.com/api/?name=${encodeURIComponent(kliq.kliqOwner?.username || 'User')}&background=random`}
                              alt={kliq.kliqOwner?.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{kliq.kliqName}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                by {kliq.kliqOwner?.firstName || kliq.kliqOwner?.username || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsLeaveKliqDialogOpen(false);
                          setSelectedKliqsToLeave([]);
                        }}
                        className="bg-muted hover:bg-muted/80"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleLeaveKliq}
                        disabled={leaveKliqMutation.isPending || selectedKliqsToLeave.length === 0}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {leaveKliqMutation.isPending ? "Leaving..." : `Leave${selectedKliqsToLeave.length > 0 ? ` (${selectedKliqsToLeave.length})` : ''}`}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Close Kliq Dialog (triggered from PyramidChart) */}
          <Dialog open={isCloseKliqDialogOpen} onOpenChange={setIsCloseKliqDialogOpen}>
            <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle className={userData?.kliqClosed ? "text-green-600" : "text-orange-500"}>
                  {userData?.kliqClosed ? "Open Kliq" : "Close Kliq"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {userData?.kliqClosed 
                    ? "Are you sure you want to open your kliq? New members will be able to join using your invite code until you reach 28 friends total."
                    : "Are you sure you want to close your kliq? No new members will be able to join, but existing friends will remain."
                  }
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsCloseKliqDialogOpen(false)}
                    className="bg-muted hover:bg-muted/80"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={userData?.kliqClosed ? "default" : "destructive"}
                    onClick={confirmCloseKliq}
                    disabled={closeKliqMutation.isPending}
                    className={userData?.kliqClosed 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-orange-500 hover:bg-orange-600"
                    }
                  >
                    {closeKliqMutation.isPending 
                      ? (userData?.kliqClosed ? "Opening..." : "Closing...")
                      : (userData?.kliqClosed ? "Open Kliq" : "Close Kliq")
                    }
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Post Pyramid Confirmation Dialog */}
          <Dialog open={showPyramidConfirm} onOpenChange={(open) => {
            setShowPyramidConfirm(open);
            if (!open) setPyramidPreview(null);
          }}>
            <DialogContent className="bg-card border-border text-foreground max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-primary">Post Pyramid to Headlines</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Share your friend pyramid to your Headlines feed?
                </p>
                {pyramidPreview && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img 
                      src={pyramidPreview} 
                      alt="Pyramid preview" 
                      className="w-full h-auto"
                    />
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPyramidConfirm(false);
                      setPyramidPreview(null);
                    }}
                    className="bg-muted hover:bg-muted/80"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePostPyramid}
                    disabled={isPostingPyramid}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isPostingPyramid ? "Posting..." : "Post to Headlines"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Invite Code */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground text-lg flex items-center gap-2">
                📱 Your Invite Message
                {userData?.kliqClosed && (
                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                    Kliq Closed
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted rounded p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm text-muted-foreground font-medium flex-1" data-testid="text-invite-message">
                    {userData?.inviteCode && userData?.firstName 
                      ? (
                          <>
                            {userData.firstName} wants you to join their Kliq. Use the following Invite Code {userData.inviteCode} and{' '}
                            <a 
                              href={getAppStoreUrl()} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 underline"
                            >
                              {getDownloadText()}
                            </a>
                            {' '}- "A Different Social Experience"
                          </>
                        )
                      : "Loading..."
                    }
                  </div>
                  <Button
                    size="sm"
                    onClick={copyInviteCode}
                    className="bg-mykliq-green hover:bg-mykliq-green/90 text-white shrink-0"
                    disabled={!userData?.inviteCode || !userData?.firstName}
                    data-testid="button-copy-invite"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-card-foreground">
                {userData?.kliqClosed 
                  ? "Your kliq is closed to new members. Existing friends can still use your code but new people cannot join."
                  : "Copy and paste this complete message to invite friends to your kliq"
                }
              </p>
            </CardContent>
          </Card>


        </TabsContent>

        <TabsContent value="smart-ranking" className="space-y-6">
          <RankingSuggestions 
            onRankingChange={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
            }}
          />
        </TabsContent>

        <TabsContent value="polls" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Kliq Polls</h3>
              <p className="text-sm text-muted-foreground">
                Create polls and vote with your friends
              </p>
            </div>
            <CreatePollDialog />
          </div>

          {pollsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-10 bg-muted rounded"></div>
                        <div className="h-10 bg-muted rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : polls.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-muted-foreground mb-2">No polls yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Create your first poll to get opinions from your friends!
                </p>
                <CreatePollDialog
                  trigger={
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Poll
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Join a Kliq Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Join a Kliq</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Invite Code</label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="KLIQ-XXXX-XXXX"
                className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
                disabled={joinKliqMutation.isPending}
                data-testid="input-join-invite-code"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the invite code you received from a friend
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsInviteDialogOpen(false);
                  setInviteCode("");
                }}
                className="flex-1"
                disabled={joinKliqMutation.isPending}
                data-testid="button-cancel-join"
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoinKliq}
                disabled={!inviteCode.trim() || joinKliqMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-submit-join"
              >
                {joinKliqMutation.isPending ? "Joining..." : "Join Kliq"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Friend Confirmation Dialog */}
      <Dialog open={!!friendToRemove} onOpenChange={() => setFriendToRemove(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remove Friend?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to remove this friend from your kliq? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setFriendToRemove(null)}
                className="flex-1"
                data-testid="button-cancel-remove"
              >
                Cancel
              </Button>
                <Button
                  onClick={confirmRemoveFriend}
                  disabled={removeFriendMutation.isPending}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  data-testid="button-confirm-remove"
                >
                  {removeFriendMutation.isPending ? "Removing..." : "Remove"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
}
