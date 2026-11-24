import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Users, Check, Trash2 } from "lucide-react";
import { usePostTranslation } from "@/lib/translationService";
import { EditPollDialog } from "@/components/EditPollDialog";
import { BorderedAvatar } from "@/components/BorderedAvatar";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";
import { formatDisplayNumber, formatRelativeDate } from "@/i18n/formatting";
import { mergeSavedPollVote, type SavedPollVote } from "@/lib/pollDataCache";

interface PollOption {
  option: string;
  index: number;
  votes: number;
  percentage: number;
}

interface Poll {
  id: string;
  title: string;
  description?: string;
  options: string[];
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  author: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  authorBorder?: {
    imageUrl?: string;
    name?: string;
  };
  votes: any[];
  totalVotes: number;
  userVote?: {
    selectedOption: number;
  };
}

interface PollCardProps {
  poll: Poll;
}

export function PollCard({ poll }: PollCardProps) {
  useUiLanguage();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const voteInFlight = useRef(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(
    poll.userVote?.selectedOption ?? null
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { translatePost } = usePostTranslation();
  const { user } = useAuth();
  const currentUserId = (user as any)?.id;
  const isAuthor = currentUserId === poll.author.id;

  const deletePollMutation = useMutation({
    retry: false,
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/polls/${poll.id}`);
    },
    onSuccess: async () => {
      setShowDeleteConfirmation(false);
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/polls');
        await enhancedCache.removeByPattern('/api/kliq-feed');
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/polls", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      await queryClient.refetchQueries({ queryKey: ["/api/polls"] });
      await queryClient.refetchQueries({ queryKey: ["/api/polls", "mine"] });
      await queryClient.refetchQueries({ queryKey: ["/api/kliq-feed"] });
      toast({
        title: uiText("Poll deleted"),
        description: uiText("Your poll has been removed"),
      });
    },
    onError: (error) => {
      console.error("Error deleting poll:", error);
      toast({
        title: uiText("Failed to delete poll"),
        description: uiText("Please try again"),
        variant: "destructive",
      });
    },
  });

  const { data: results = [] } = useQuery<PollOption[]>({
    queryKey: ["/api/polls", poll.id, "results"],
    queryFn: () => apiRequest("GET", `/api/polls/${poll.id}/results`),
    enabled: !isVoting,
    refetchInterval: 3000, // Auto-refresh every 3 seconds for real-time updates
    staleTime: 0, // Always consider data stale to ensure fresh results
  });

  const voteMutation = useMutation({
    retry: false,
    mutationFn: async (option: number) => {
      const response: { vote: SavedPollVote; results: PollOption[] } =
        await apiRequest("POST", `/api/polls/${poll.id}/vote`, { selectedOption: option });
      return { option, response };
    },
    onMutate: async (option: number) => {
      setIsVoting(true);
      // Pause timer reads and ignore requests started before this vote.
      await queryClient.cancelQueries(
        { queryKey: ["/api/polls", poll.id, "results"], exact: true },
        { revert: false },
      );
      const previousResults = queryClient.getQueryData<PollOption[]>(["/api/polls", poll.id, "results"]);
      const previousSelection = selectedOption;
      const baseline = previousResults?.length === poll.options.length
        ? previousResults
        : poll.options.map((option, index) => ({
            option,
            index,
            votes: (poll.votes || []).filter(vote => vote.selectedOption === index).length,
            percentage: 0,
          }));
      const total = baseline.reduce((sum, result) => sum + result.votes, 0) + 1;
      const optimisticResults = baseline.map(result => {
        const votes = result.votes + (result.index === option ? 1 : 0);
        return { ...result, votes, percentage: Math.round(votes / total * 1000) / 10 };
      });
      // Counts, percentages, bars, and selected state change together, not
      // just the checkmark while all the counts still read zero.
      queryClient.setQueryData(["/api/polls", poll.id, "results"], optimisticResults);
      setSelectedOption(option);

      return { previousResults, previousSelection, baseline };
    },
    onSuccess: async (data) => {
      const affected = (query: { queryKey: readonly unknown[] }) =>
        query.queryKey[0] === "/api/polls" || query.queryKey[0] === "/api/kliq-feed";
      // Older list/feed reads must not replace the confirmed vote or cause a
      // remounted card to think the member has not voted yet.
      await queryClient.cancelQueries({ predicate: affected }, { revert: false });
      if (!currentUserId || queryClient.getQueryData<{ id: string }>(["/api/auth/user"])?.id !== currentUserId) return;
      queryClient.setQueriesData({ predicate: affected }, old =>
        mergeSavedPollVote(old, data.response.vote, data.response.results)
      );
      queryClient.setQueryData(["/api/polls", poll.id, "results"], data.response.results);
      await queryClient.invalidateQueries({ predicate: affected, refetchType: "none" });
      
      toast({
        title: uiText("Vote recorded!"),
        description: uiText("Your vote has been saved successfully"),
      });
    },
    onError: (error, option, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      setSelectedOption(context?.previousSelection ?? null);
      if (!currentUserId || queryClient.getQueryData<{ id: string }>(["/api/auth/user"])?.id !== currentUserId) return;
      if (context) {
        queryClient.setQueryData(["/api/polls", poll.id, "results"], context.previousResults ?? context.baseline);
      }
      console.error("Error voting:", error);
      toast({
        title: uiText("Failed to vote"),
        description: uiText("Please try again"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      voteInFlight.current = false;
      setIsVoting(false);
    },
  });

  const handleVote = (optionIndex: number) => {
    if (voteInFlight.current || hasVoted || isExpired) return;
    voteInFlight.current = true;
    voteMutation.mutate(optionIndex);
  };

  const isExpired = new Date(poll.expiresAt) <= new Date();
  const hasVoted = poll.userVote != null || selectedOption !== null;
  const totalVotes = results.reduce((sum, result) => sum + (result?.votes || 0), 0);
  
  // Always show results when there are votes, regardless of user's vote status  
  const showResults = totalVotes > 0 || hasVoted || isExpired;

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" data-testid={`card-poll-${poll.id}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-black dark:text-white">{translatePost(poll.title)}</CardTitle>
            {poll.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {translatePost(poll.description)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isExpired ? "destructive" : "secondary"} 
              className="text-xs"
              data-testid={`badge-poll-status-${poll.id}`}
            >
              {isExpired ? uiText("Expired") : uiText("Active")}
            </Badge>
            {isAuthor && (
              <>
                <EditPollDialog 
                  poll={{
                    id: poll.id,
                    title: poll.title,
                    description: poll.description,
                    options: poll.options,
                    expiresAt: poll.expiresAt,
                  }}
                />
                <AlertDialog
                  open={showDeleteConfirmation}
                  onOpenChange={open => {
                    if (!deletePollMutation.isPending) setShowDeleteConfirmation(open);
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletePollMutation.isPending}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50"
                      aria-label={uiText("Delete poll")}
                      data-testid={`button-delete-poll-${poll.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{uiText("Delete this poll?")}</AlertDialogTitle>
                      <AlertDialogDescription className="break-words">
                        {uiText("This will permanently delete “{{title}}” and all its votes. This can’t be undone.", { title: poll.title })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        disabled={deletePollMutation.isPending}
                        data-testid={`button-cancel-delete-poll-${poll.id}`}
                      >
                        {uiText("Cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={event => {
                          event.preventDefault();
                          if (!deletePollMutation.isPending) deletePollMutation.mutate();
                        }}
                        disabled={deletePollMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid={`button-confirm-delete-poll-${poll.id}`}
                      >
                        {deletePollMutation.isPending ? uiText("Deleting…") : uiText("Delete poll")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3 mb-2">
          <BorderedAvatar
            src={poll.author.profileImageUrl}
            fallback={poll.author.firstName?.[0] || "U"}
            borderImageUrl={poll.authorBorder?.imageUrl}
            borderName={poll.authorBorder?.name}
            size="md"
          />
          <div className="flex-1">
            <p className="font-bold text-primary">
              {poll.author.firstName} {poll.author.lastName}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {isExpired 
                    ? `${uiText("Expired")} ${formatRelativeDate(new Date(poll.expiresAt))}`
                    : `${uiText("Expires")} ${formatRelativeDate(new Date(poll.expiresAt))}`
                  }
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{uiText("{{count}} votes", { count: formatDisplayNumber(totalVotes) })}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {poll.options.map((option, index) => {
            const result = (results as PollOption[]).find((r: PollOption) => r.index === index);
            const isSelected = (selectedOption ?? poll.userVote?.selectedOption) === index;
            const percentage = Math.min(100, Math.max(0, Number(result?.percentage) || 0));
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant={isSelected && hasVoted ? "default" : "outline"}
                    className={`flex-1 justify-start text-left h-auto p-3 ${
                      showResults ? "cursor-default" : ""
                    } bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600`}
                    onClick={() => !hasVoted && !isExpired && handleVote(index)}
                    disabled={hasVoted || isExpired || voteMutation.isPending}
                    data-testid={`button-poll-option-${poll.id}-${index}`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {isSelected && hasVoted && <Check className="w-4 h-4 text-green-600" />}
                      <span className="flex-1">{translatePost(option)}</span>
                      {showResults && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {percentage}%
                          </span>
                          <span className="text-xs text-gray-500">
                            ({result?.votes || 0})
                          </span>
                        </div>
                      )}
                    </div>
                  </Button>
                </div>
                {showResults && (
                  <div
                    role="progressbar"
                    aria-label={uiText("Votes for {{option}}", { option })}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                    aria-valuetext={uiText("{{percent}}% ({{count}} votes)", { percent: formatDisplayNumber(percentage), count: formatDisplayNumber(result?.votes || 0) })}
                    className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                    data-testid={`progress-poll-option-${poll.id}-${index}`}
                  >
                    <div
                      className="h-full rounded-full bg-blue-600 transition-[width] duration-300 motion-reduce:transition-none dark:bg-blue-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}