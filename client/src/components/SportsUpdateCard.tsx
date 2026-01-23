import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  position: number;
  name: string;
  score?: string;
}

interface TeamSportsUpdate {
  type: 'team';
  id: string;
  sport: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamScore: number | null;
  awayTeamScore: number | null;
  status: string;
  statusDetail: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  eventDate?: string;
}

interface IndividualSportsUpdate {
  type: 'individual';
  id: string;
  eventId: string;
  sport: string;
  sportName: string;
  sportIcon: string;
  eventName: string;
  eventDate: string;
  status: 'scheduled' | 'in_progress' | 'final';
  statusDetail: string;
  venue: string | null;
  topFive: LeaderboardEntry[];
}

type SportsUpdate = TeamSportsUpdate | IndividualSportsUpdate;

interface SportsUpdateCardProps {
  update: SportsUpdate;
}

function getPositionStyle(position: number) {
  if (position === 1) return 'bg-amber-500 text-white';
  if (position === 2) return 'bg-gray-400 text-white';
  if (position === 3) return 'bg-amber-700 text-white';
  return 'bg-gray-200 text-gray-600';
}

export function SportsUpdateCard({ update }: SportsUpdateCardProps) {
  if (update.type === 'individual') {
    return <IndividualSportCardContent update={update} />;
  }
  return <TeamSportCardContent update={update} />;
}

function IndividualSportCardContent({ update }: { update: IndividualSportsUpdate }) {
  const isLive = update.status === 'in_progress';
  const isFinal = update.status === 'final';

  return (
    <Card className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border-emerald-500/30 overflow-hidden h-full" data-testid={`card-sports-update-${update.id}`}>
      <CardContent className="p-3 sm:p-4">
        {/* Header with sport type and status */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg">{update.sportIcon}</span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-500 uppercase tracking-wide" data-testid="text-sport-type">
              {update.sportName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse text-xs px-2 py-0.5" data-testid="badge-status-live">
                LIVE
              </Badge>
            )}
            {isFinal && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5" data-testid="badge-status-final">
                Final
              </Badge>
            )}
            {!isLive && !isFinal && update.statusDetail && (
              <span className="text-xs text-gray-500">{update.statusDetail}</span>
            )}
          </div>
        </div>

        {/* Event Name */}
        <div className="bg-white rounded-lg p-2 sm:p-3">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 line-clamp-2">
            {update.eventName}
          </h3>

          {/* Status Detail for live */}
          {isLive && update.statusDetail && (
            <div className="text-xs text-emerald-600 font-medium mb-2">
              {update.statusDetail}
            </div>
          )}

          {/* Top 5 Leaderboard */}
          {update.topFive.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 mb-1">
                <Trophy className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-medium text-gray-500">Top 5</span>
              </div>
              {update.topFive.map((entry) => (
                <div
                  key={`${entry.position}-${entry.name}`}
                  className="flex items-center gap-2 py-0.5"
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    getPositionStyle(entry.position)
                  )}>
                    {entry.position}
                  </span>
                  <span className="text-xs text-gray-700 flex-1 truncate">
                    {entry.name}
                  </span>
                  {entry.score && (
                    <span className="text-xs text-gray-500 font-medium">
                      {entry.score}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {update.topFive.length === 0 && (
            <div className="text-xs text-gray-400 italic">
              Leaderboard not yet available
            </div>
          )}
        </div>

        {/* Event date for final events */}
        {isFinal && update.eventDate && (
          <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            {new Date(update.eventDate).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamSportCardContent({ update }: { update: TeamSportsUpdate }) {
  const isLive = update.status.toLowerCase().includes('in progress') || 
                 update.status.toLowerCase().includes('live');
  const isFinal = update.status.toLowerCase().includes('final');
  const isScheduled = !isLive && !isFinal;
  
  const awayWinning = (update.awayTeamScore ?? 0) > (update.homeTeamScore ?? 0);
  const homeWinning = (update.homeTeamScore ?? 0) > (update.awayTeamScore ?? 0);
  
  return (
    <Card className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border-emerald-500/30 overflow-hidden h-full" data-testid={`card-sports-update-${update.id}`}>
      <CardContent className="p-3 sm:p-4">
        {/* Header with sport type and status */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            <span className="text-xs sm:text-sm font-semibold text-emerald-500 uppercase tracking-wide" data-testid="text-sport-type">
              {update.sport}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse text-xs px-2 py-0.5" data-testid="badge-status-live">
                LIVE
              </Badge>
            )}
            {isFinal && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5" data-testid="badge-status-final">
                Final
              </Badge>
            )}
            {isScheduled && update.statusDetail && (
              <span className="text-xs text-gray-500">{update.statusDetail}</span>
            )}
          </div>
        </div>

        {/* Scoreboard Layout - consistent on all screen sizes */}
        <div className="bg-white rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
          {/* Away Team Row */}
          <div className={cn(
            "flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 px-2 rounded-md transition-colors",
            awayWinning && isFinal && "bg-emerald-50"
          )}>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {update.awayTeamLogo ? (
                <img 
                  src={update.awayTeamLogo} 
                  alt={update.awayTeamName}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
                  data-testid="img-away-team-logo"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-semibold text-sm sm:text-base truncate",
                  awayWinning ? "text-gray-900" : "text-gray-700"
                )} data-testid="text-away-team-name">
                  {update.awayTeamName}
                </div>
              </div>
            </div>
            <div className={cn(
              "text-xl sm:text-2xl font-bold tabular-nums min-w-[2.5rem] text-right",
              awayWinning ? "text-emerald-600" : "text-gray-600"
            )} data-testid="text-away-team-score">
              {update.awayTeamScore ?? '-'}
            </div>
          </div>

          {/* Home Team Row */}
          <div className={cn(
            "flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 px-2 rounded-md transition-colors",
            homeWinning && isFinal && "bg-emerald-50"
          )}>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {update.homeTeamLogo ? (
                <img 
                  src={update.homeTeamLogo} 
                  alt={update.homeTeamName}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
                  data-testid="img-home-team-logo"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-semibold text-sm sm:text-base truncate",
                  homeWinning ? "text-gray-900" : "text-gray-700"
                )} data-testid="text-home-team-name">
                  {update.homeTeamName}
                </div>
              </div>
            </div>
            <div className={cn(
              "text-xl sm:text-2xl font-bold tabular-nums min-w-[2.5rem] text-right",
              homeWinning ? "text-emerald-600" : "text-gray-600"
            )} data-testid="text-home-team-score">
              {update.homeTeamScore ?? '-'}
            </div>
          </div>
        </div>

        {/* Status Detail for live games, date for final games */}
        {isLive && update.statusDetail && (
          <div className="mt-2 text-center text-xs sm:text-sm text-gray-500" data-testid="text-status-detail">
            {update.statusDetail}
          </div>
        )}
        {isFinal && update.eventDate && (
          <div className="mt-2 text-center text-xs sm:text-sm text-gray-500" data-testid="text-game-date">
            {new Date(update.eventDate).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
