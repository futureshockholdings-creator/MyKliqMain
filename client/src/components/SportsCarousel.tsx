import { useRef } from "react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SportsUpdateCard } from "./SportsUpdateCard";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  position: number;
  name: string;
  score?: string;
}

interface TeamSportsUpdate {
  type: 'team';
  id: string;
  eventId?: string;
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

interface SportsCarouselProps {
  updates: SportsUpdate[];
}

function getGamePriority(update: SportsUpdate): number {
  if (update.type === 'individual') {
    if (update.status === 'in_progress') return 0;
    if (update.status === 'final') return 2;
    return 1;
  }
  
  const lowerStatus = update.status.toLowerCase();
  if (lowerStatus.includes('in progress') || lowerStatus.includes('live')) {
    return 0;
  }
  if (lowerStatus.includes('final')) {
    return 2;
  }
  return 1;
}

function sortSportsUpdates(updates: SportsUpdate[]): SportsUpdate[] {
  return [...updates].sort((a, b) => {
    const priorityA = getGamePriority(a);
    const priorityB = getGamePriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
    const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
    return dateA - dateB;
  });
}

function getStatusCounts(updates: SportsUpdate[]) {
  let live = 0;
  let scheduled = 0;
  let final = 0;
  
  updates.forEach(update => {
    const priority = getGamePriority(update);
    if (priority === 0) live++;
    else if (priority === 1) scheduled++;
    else final++;
  });
  
  return { live, scheduled, final };
}

export function SportsCarousel({ updates }: SportsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  if (!updates || updates.length === 0) {
    return null;
  }
  
  const sortedUpdates = sortSportsUpdates(updates);
  const { live, scheduled, final } = getStatusCounts(updates);
  
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };
  
  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            Sports Updates
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            {live > 0 && (
              <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                {live} Live
              </span>
            )}
            {scheduled > 0 && (
              <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                {scheduled} Upcoming
              </span>
            )}
            {final > 0 && (
              <span className="text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                {final} Final
              </span>
            )}
          </div>
        </div>
        
        {/* Scroll buttons - hidden on mobile, visible on larger screens */}
        <div className="hidden sm:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Carousel */}
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-3 overflow-x-auto scrollbar-hide pb-2",
          "snap-x snap-mandatory",
          "-mx-2 px-2"
        )}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {sortedUpdates.map((update) => (
          <div
            key={update.type === 'individual' ? update.eventId : (update.eventId || update.id)}
            className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start"
          >
            <SportsUpdateCard update={update} />
          </div>
        ))}
      </div>
    </div>
  );
}
