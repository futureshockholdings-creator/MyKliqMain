import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp, ChevronDown, TrendingUp, MessageCircle, Eye, X, Check, Lightbulb, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RankingSuggestion {
  id: string;
  friendId: string;
  currentRank: number;
  suggestedRank: number;
  confidence: string;
  primaryReason: string;
  justificationMessage: string;
  supportingMetrics: {
    totalInteractions: number;
    interactionScore: string;
    consistencyScore: string;
    engagementScore: string;
    overallScore: string;
  };
  createdAt: string;
  expiresAt: string;
  friend: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

interface RankingSuggestionsProps {
  onRankingChange?: () => void;
}

export function RankingSuggestions({ onRankingChange }: RankingSuggestionsProps) {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  // Optimistic sets — cards are removed from UI immediately on action
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  // Per-suggestion pending tracking to prevent double-click on individual cards
  const [pendingDismiss, setPendingDismiss] = useState<Set<string>>(new Set());
  const [pendingAccept, setPendingAccept] = useState<Set<string>>(new Set());
  // Keep generate button locked until the fresh suggestion list has loaded
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rawSuggestions = [], isLoading } = useQuery<RankingSuggestion[]>({
    queryKey: ['/api/friend-ranking/suggestions'],
    refetchInterval: 300000,
    staleTime: 0, // Always refetch when invalidated
  });

  // Filter out optimistically dismissed/accepted cards
  const suggestions = rawSuggestions.filter(
    (s) => !dismissedIds.has(s.id) && !acceptedIds.has(s.id)
  );

  const refreshSuggestions = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: ['/api/friend-ranking/suggestions'], exact: true });
  }, [queryClient]);

  // Accept suggestion mutation — optimistic: remove card immediately
  const acceptSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      return await apiRequest("POST", `/api/friend-ranking/suggestions/${suggestionId}/accept`);
    },
    onMutate: (suggestionId: string) => {
      setAcceptedIds((prev) => new Set(prev).add(suggestionId));
      setPendingAccept((prev) => new Set(prev).add(suggestionId));
    },
    onSuccess: () => {
      toast({
        title: "Ranking Updated",
        description: "Friend ranking has been updated based on your interactions.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friend-ranking/suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      onRankingChange?.();
    },
    onError: (_err, suggestionId) => {
      // Roll back optimistic removal so user can try again
      setAcceptedIds((prev) => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
      toast({
        title: "Error",
        description: "Failed to update ranking. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: (_data, _err, suggestionId) => {
      setPendingAccept((prev) => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
    },
  });

  // Dismiss suggestion mutation — optimistic: remove card immediately
  const dismissSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      return await apiRequest("POST", `/api/friend-ranking/suggestions/${suggestionId}/dismiss`);
    },
    onMutate: (suggestionId: string) => {
      setDismissedIds((prev) => new Set(prev).add(suggestionId));
      setPendingDismiss((prev) => new Set(prev).add(suggestionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friend-ranking/suggestions'] });
      toast({
        title: "Suggestion Dismissed",
        description: "The ranking suggestion has been dismissed.",
      });
    },
    onError: (_err, suggestionId) => {
      // Roll back optimistic removal
      setDismissedIds((prev) => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
      toast({
        title: "Error",
        description: "Failed to dismiss suggestion. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: (_data, _err, suggestionId) => {
      setPendingDismiss((prev) => {
        const next = new Set(prev);
        next.delete(suggestionId);
        return next;
      });
    },
  });

  // Generate new suggestions — keeps button locked until fresh list arrives
  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    // Clear stale optimistic state so the fresh list is shown as-is
    setDismissedIds(new Set());
    setAcceptedIds(new Set());
    try {
      const data = await apiRequest("POST", "/api/friend-ranking/generate");
      // Force a real network fetch (bypasses SWR memory cache)
      await refreshSuggestions();
      if (data.count > 0) {
        toast({
          title: "New Suggestions Available",
          description: `Generated ${data.count} new ranking suggestions based on your recent interactions.`,
        });
      } else {
        toast({
          title: "No New Suggestions",
          description: "Your current rankings align well with your interaction patterns.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate new suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, refreshSuggestions, toast]);

  const getInitials = (friend: RankingSuggestion['friend']) => {
    const first = friend.firstName?.[0] || "";
    const last = friend.lastName?.[0] || "";
    return first + last || "?";
  };

  const getName = (friend: RankingSuggestion['friend']) => {
    const first = friend.firstName || "";
    const last = friend.lastName ? ` ${friend.lastName[0]}.` : "";
    return first + last || "Unknown";
  };

  const getRankChangeIcon = (currentRank: number, suggestedRank: number) => {
    if (suggestedRank < currentRank) {
      return <ChevronUp className="h-4 w-4 text-green-500" />;
    } else {
      return <ChevronDown className="h-4 w-4 text-orange-500" />;
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'frequent_communication':
        return <MessageCircle className="h-4 w-4" />;
      case 'high_engagement':
        return <Eye className="h-4 w-4" />;
      case 'in_person_connection':
        return <Users className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'frequent_communication':
        return 'Frequent Communication';
      case 'high_engagement':
        return 'High Engagement';
      case 'in_person_connection':
        return 'In-Person Connection';
      case 'general_activity':
        return 'General Activity';
      default:
        return 'Interaction Analysis';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="ranking-suggestions-loading">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Smart Ranking Suggestions
          </h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="ranking-suggestions">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Smart Ranking Suggestions
          {suggestions.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {suggestions.length}
            </Badge>
          )}
        </h3>

        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating}
          data-testid="button-generate-suggestions"
          className="bg-green-600 text-white hover:bg-green-700 disabled:bg-green-600/50 disabled:text-white/70"
        >
          {isGenerating ? "Analyzing..." : "Analyze Interactions"}
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <Card data-testid="no-suggestions-card">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>No ranking suggestions available</p>
              <p className="text-sm mt-1">Your current rankings align well with your interaction patterns.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion: RankingSuggestion) => (
            <Card
              key={suggestion.id}
              className="transition-all duration-200 hover:shadow-md"
              data-testid={`suggestion-card-${suggestion.id}`}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage
                      src={suggestion.friend.profileImageUrl}
                      alt={getName(suggestion.friend)}
                    />
                    <AvatarFallback>{getInitials(suggestion.friend)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{getName(suggestion.friend)}</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                        {getRankChangeIcon(suggestion.currentRank, suggestion.suggestedRank)}
                        <span className="text-xs">
                          #{suggestion.currentRank} → #{suggestion.suggestedRank}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                      >
                        {getReasonIcon(suggestion.primaryReason)}
                        {getReasonLabel(suggestion.primaryReason)}
                      </Badge>

                      <Badge variant="secondary" className="text-xs">
                        {parseFloat(suggestion.confidence).toFixed(0)}% confident
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {suggestion.justificationMessage}
                </p>

                {expandedSuggestion === suggestion.id && (
                  <div className="mb-3 p-3 bg-muted/30 rounded-lg text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Total Interactions:</span>
                        <span className="ml-1">{suggestion.supportingMetrics.totalInteractions}</span>
                      </div>
                      <div>
                        <span className="font-medium">Overall Score:</span>
                        <span className="ml-1">{parseFloat(suggestion.supportingMetrics.overallScore).toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Engagement:</span>
                        <span className="ml-1">{parseFloat(suggestion.supportingMetrics.engagementScore).toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Consistency:</span>
                        <span className="ml-1">{parseFloat(suggestion.supportingMetrics.consistencyScore).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Button
                    size="sm"
                    onClick={() => acceptSuggestionMutation.mutate(suggestion.id)}
                    disabled={pendingAccept.has(suggestion.id) || pendingDismiss.has(suggestion.id)}
                    className="flex-1"
                    data-testid={`button-accept-${suggestion.id}`}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Apply Ranking
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dismissSuggestionMutation.mutate(suggestion.id)}
                    disabled={pendingDismiss.has(suggestion.id) || pendingAccept.has(suggestion.id)}
                    data-testid={`button-dismiss-${suggestion.id}`}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedSuggestion(
                      expandedSuggestion === suggestion.id ? null : suggestion.id
                    )}
                    data-testid={`button-toggle-details-${suggestion.id}`}
                  >
                    {expandedSuggestion === suggestion.id ? "Less" : "Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
