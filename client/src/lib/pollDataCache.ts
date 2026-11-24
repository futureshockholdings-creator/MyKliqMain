export interface PollResult {
  option: string;
  index: number;
  votes: number;
  percentage: number;
}

export interface SavedPollVote {
  id: string;
  pollId: string;
  userId: string;
  selectedOption: number;
}

/** Preserve the rest of each card/feed while applying confirmed vote metadata. */
export function mergeSavedPollVote(
  data: any,
  vote: SavedPollVote,
  results: PollResult[],
): any {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    const next = data.map(item => mergeSavedPollVote(item, vote, results));
    return next.some((item, index) => item !== data[index]) ? next : data;
  }
  if (data.id === vote.pollId && Array.isArray(data.options)) {
    return {
      ...data,
      userVote: vote,
      totalVotes: results.reduce((sum, result) => sum + result.votes, 0),
      votes: [
        ...(Array.isArray(data.votes) ? data.votes : [])
          .filter((existing: SavedPollVote) => existing.userId !== vote.userId),
        vote,
      ],
    };
  }
  let next = data;
  for (const key of ["pages", "items", "posts", "polls"]) {
    if (!Array.isArray(data[key])) continue;
    const value = mergeSavedPollVote(data[key], vote, results);
    if (value !== data[key]) next = { ...next, [key]: value };
  }
  return next;
}
