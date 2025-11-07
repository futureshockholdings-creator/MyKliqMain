import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SportsUpdate {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  statusDetail: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  createdAt: string;
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

        <div className="flex items-center justify-between">
          {/* Away Team */}
          <div className="flex-1 flex items-center gap-3">
            {update.awayTeamLogo && (
              <img 
                src={update.awayTeamLogo} 
                alt={update.awayTeam}
                className="w-12 h-12 object-contain"
                data-testid="img-away-team-logo"
              />
            )}
            <div className="flex-1">
              <div className="font-bold text-foreground text-lg" data-testid="text-away-team-name">
                {update.awayTeam}
              </div>
            </div>
            <div className={cn(
              "text-3xl font-bold",
              update.awayScore > update.homeScore ? "text-emerald-500" : "text-muted-foreground"
            )} data-testid="text-away-team-score">
              {update.awayScore}
            </div>
          </div>

          {/* VS Divider */}
          <div className="px-4 text-muted-foreground font-semibold">
            @
          </div>

          {/* Home Team */}
          <div className="flex-1 flex items-center gap-3 flex-row-reverse">
            {update.homeTeamLogo && (
              <img 
                src={update.homeTeamLogo} 
                alt={update.homeTeam}
                className="w-12 h-12 object-contain"
                data-testid="img-home-team-logo"
              />
            )}
            <div className="flex-1 text-right">
              <div className="font-bold text-foreground text-lg" data-testid="text-home-team-name">
                {update.homeTeam}
              </div>
            </div>
            <div className={cn(
              "text-3xl font-bold",
              update.homeScore > update.awayScore ? "text-emerald-500" : "text-muted-foreground"
            )} data-testid="text-home-team-score">
              {update.homeScore}
            </div>
          </div>
        </div>

        {/* Status Detail */}
        {update.statusDetail && (
          <div className="mt-3 text-center text-sm text-muted-foreground" data-testid="text-status-detail">
            {update.statusDetail}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
