import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePostTranslation } from "@/lib/translationService";

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
  const [selectedOption, setSelectedOption] = useState<number | null>(
    poll.userVote?.selectedOption ?? null
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { translatePost } = usePostTranslation();

  const { data: results = [], refetch: refetchResults } = useQuery<PollOption[]>({
    queryKey: ["/api/polls", poll.id, "results"],
    queryFn: () => apiRequest("GET", `/api/polls/${poll.id}/results`),
    refetchInterval: 3000, // Auto-refresh every 3 seconds for real-time updates
    staleTime: 0, // Always consider data stale to ensure fresh results
  });

  const voteMutation = useMutation({
    mutationFn: async (option: number) => {
      const response = await apiRequest("POST", `/api/polls/${poll.id}/vote`, { selectedOption: option });
      return { option, response };
    },
    onMutate: async (option: number) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/polls", poll.id, "results"] });
      
      // Snapshot the previous value
      const previousResults = queryClient.getQueryData(["/api/polls", poll.id, "results"]);
      
      // Optimistically update UI immediately
      setSelectedOption(option);
      
      return { previousResults, option };
    },
    onSuccess: (data) => {
      // Use server response if available, otherwise refetch
      if (data.response?.results) {
        queryClient.setQueryData(["/api/polls", poll.id, "results"], data.response.results);
      } else {
        refetchResults();
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      
      toast({
        title: "Vote recorded!",
        description: "Your vote has been saved successfully",
      });
    },
    onError: (error, option, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      setSelectedOption(null);
      if (context?.previousResults) {
        queryClient.setQueryData(["/api/polls", poll.id, "results"], context.previousResults);
      }
      console.error("Error voting:", error);
      toast({
        title: "Failed to vote",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleVote = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    voteMutation.mutate(optionIndex);
  };

  const isExpired = new Date(poll.expiresAt) <= new Date();
  const hasVoted = poll.userVote !== undefined || selectedOption !== null;
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
              {isExpired ? "Expired" : "Active"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <img
              src={poll.author.profileImageUrl || "/default-avatar.png"}
              alt={`${poll.author.firstName} ${poll.author.lastName}`}
              className="w-4 h-4 rounded-full"
            />
            <span>{poll.author.firstName} {poll.author.lastName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {isExpired 
                ? `Expired ${formatDistanceToNow(new Date(poll.expiresAt))} ago`
                : `Expires ${formatDistanceToNow(new Date(poll.expiresAt))}`
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{totalVotes} votes</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {poll.options.map((option, index) => {
            const result = (results as PollOption[]).find((r: PollOption) => r.index === index);
            const isSelected = selectedOption === index;
            
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
                            {result?.percentage || 0}%
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
                  <Progress 
                    value={result?.percentage || 0} 
                    className="h-2"
                    data-testid={`progress-poll-option-${poll.id}-${index}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}