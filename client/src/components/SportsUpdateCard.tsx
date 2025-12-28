import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SportsUpdate {
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

interface SportsUpdateCardProps {
  update: SportsUpdate;
}

export function SportsUpdateCard({ update }: SportsUpdateCardProps) {
  const isLive = update.status.toLowerCase().includes('in progress') || 
                 update.status.toLowerCase().includes('live');
  const isFinal = update.status.toLowerCase().includes('final');
  
  return (
    <Card className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border-emerald-500/30" data-testid={`card-sports-update-${update.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-500 uppercase tracking-wide" data-testid="text-sport-type">
            {update.sport} Update
          </span>
          {isLive && (
            <Badge variant="destructive" className="ml-auto animate-pulse" data-testid="badge-status-live">
              Live
            </Badge>
          )}
          {isFinal && (
            <Badge variant="secondary" className="ml-auto" data-testid="badge-status-final">
              Final
            </Badge>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Away Team */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            {update.awayTeamLogo && (
              <img 
                src={update.awayTeamLogo} 
                alt={update.awayTeamName}
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
                data-testid="img-away-team-logo"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-base sm:text-lg truncate" data-testid="text-away-team-name">
                {update.awayTeamName}
              </div>
            </div>
            <div className={cn(
              "text-2xl sm:text-3xl font-bold flex-shrink-0",
              (update.awayTeamScore ?? 0) > (update.homeTeamScore ?? 0) ? "text-emerald-600" : "text-gray-700"
            )} data-testid="text-away-team-score">
              {update.awayTeamScore ?? 0}
            </div>
          </div>

          {/* VS Divider */}
          <div className="px-2 sm:px-4 text-gray-600 font-semibold text-center">
            @
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 flex-row-reverse">
            {update.homeTeamLogo && (
              <img 
                src={update.homeTeamLogo} 
                alt={update.homeTeamName}
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
                data-testid="img-home-team-logo"
              />
            )}
            <div className="flex-1 text-right min-w-0">
              <div className="font-bold text-gray-900 text-base sm:text-lg truncate" data-testid="text-home-team-name">
                {update.homeTeamName}
              </div>
            </div>
            <div className={cn(
              "text-2xl sm:text-3xl font-bold flex-shrink-0",
              (update.homeTeamScore ?? 0) > (update.awayTeamScore ?? 0) ? "text-emerald-600" : "text-gray-700"
            )} data-testid="text-home-team-score">
              {update.homeTeamScore ?? 0}
            </div>
          </div>
        </div>

        {/* Status Detail */}
        {update.statusDetail && (
          <div className="mt-3 text-center text-sm text-gray-600" data-testid="text-status-detail">
            {update.statusDetail}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
