import { cn } from "@/lib/utils";
import { Trophy, MapPin, Calendar } from "lucide-react";

interface LeaderboardEntry {
  position: number;
  name: string;
  score?: string;
}

interface IndividualSportUpdate {
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

interface IndividualSportCardProps {
  update: IndividualSportUpdate;
}

export function IndividualSportCard({ update }: IndividualSportCardProps) {
  const isLive = update.status === 'in_progress';
  const isFinal = update.status === 'final';
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getPositionStyle = (position: number) => {
    if (position === 1) return 'bg-amber-500 text-white';
    if (position === 2) return 'bg-gray-400 text-white';
    if (position === 3) return 'bg-amber-700 text-white';
    return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
  };

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-3",
      isLive && "ring-2 ring-red-500 ring-opacity-50",
      isFinal && "opacity-90"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{update.sportIcon}</span>
          <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {update.sportName}
          </span>
        </div>
        
        <div className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium",
          isLive && "bg-red-500 text-white animate-pulse",
          isFinal && "bg-gray-500 text-white",
          !isLive && !isFinal && "bg-blue-500 text-white"
        )}>
          {update.statusDetail || (isLive ? 'Live' : isFinal ? 'Final' : 'Upcoming')}
        </div>
      </div>

      <h3 className="font-medium text-gray-800 dark:text-gray-100 text-sm mb-2 line-clamp-2">
        {update.eventName}
      </h3>

      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(update.eventDate)}</span>
        </div>
        {update.venue && (
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{update.venue}</span>
          </div>
        )}
      </div>

      {update.topFive.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Top 5
            </span>
          </div>
          
          {update.topFive.map((entry) => (
            <div
              key={`${entry.position}-${entry.name}`}
              className="flex items-center gap-2"
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                getPositionStyle(entry.position)
              )}>
                {entry.position}
              </span>
              <span className="text-xs text-gray-700 dark:text-gray-200 flex-1 truncate">
                {entry.name}
              </span>
              {entry.score && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {entry.score}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      
      {update.topFive.length === 0 && (
        <div className="text-xs text-gray-400 dark:text-gray-500 italic">
          Leaderboard not yet available
        </div>
      )}
    </div>
  );
}
