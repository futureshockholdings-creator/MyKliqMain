import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, ChevronLeft, ChevronRight, ExternalLink, Share2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NearbyActivity {
  id: string;
  title: string;
  category: "event" | "outdoor" | "family" | "arts" | "sports" | "entertainment";
  date?: string;
  venueName?: string;
  imageUrl?: string;
  externalUrl?: string;
  distance?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  event: "bg-primary/20 text-primary",
  outdoor: "bg-green-500/20 text-green-700",
  family: "bg-yellow-500/20 text-yellow-700",
  arts: "bg-purple-500/20 text-purple-700",
  sports: "bg-blue-500/20 text-blue-700",
  entertainment: "bg-pink-500/20 text-pink-700",
};

function ActivityCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-56 rounded-xl border border-border bg-card animate-pulse">
      <div className="h-32 bg-muted rounded-t-xl" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-16" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-8 bg-muted rounded w-full mt-2" />
      </div>
    </div>
  );
}

export function NearbyActivitiesCarousel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [postalInput, setPostalInput] = useState(
    () => localStorage.getItem("mykliq_postal_code") || ""
  );
  const [searchPostal, setSearchPostal] = useState(
    () => localStorage.getItem("mykliq_postal_code") || ""
  );
  const [postingId, setPostingId] = useState<string | null>(null);

  const { data: activities = [], isLoading, isError } = useQuery<NearbyActivity[]>({
    queryKey: ["/api/nearby-activities", searchPostal],
    queryFn: async () => {
      if (!searchPostal) return [];
      const res = await fetch(`/api/nearby-activities?postal=${encodeURIComponent(searchPostal)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!searchPostal,
    staleTime: 1000 * 60 * 10,
  });

  const postMutation = useMutation({
    mutationFn: async (activity: NearbyActivity) => {
      const content = activity.externalUrl
        ? `I'm checking this out 👀 ${activity.title} — ${activity.externalUrl}`
        : `I'm checking this out 👀 ${activity.title}${activity.venueName ? ` at ${activity.venueName}` : ""}`;
      return apiRequest("POST", "/api/posts", { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      toast({ title: "Posted to Headlines!", description: "Your kliq can see it now." });
      setPostingId(null);
    },
    onError: () => {
      toast({ title: "Couldn't post", description: "Try again.", variant: "destructive" });
      setPostingId(null);
    },
  });

  const handleSearch = () => {
    if (!postalInput.trim()) return;
    localStorage.setItem("mykliq_postal_code", postalInput.trim());
    setSearchPostal(postalInput.trim());
  };

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Need something to get into? 🎉</h2>
          <p className="text-sm text-muted-foreground">Discover local events & activities near you</p>
        </div>
        {activities.length > 0 && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => scroll("left")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => scroll("right")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Postal / Zip Code"
            value={postalInput}
            onChange={(e) => setPostalInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={!postalInput.trim() || isLoading} size="sm">
          <Search className="h-4 w-4 mr-1" />
          Search
        </Button>
      </div>

      {isLoading && (
        <div className="flex gap-3 overflow-hidden pb-2">
          {[1, 2, 3, 4].map((i) => <ActivityCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="text-sm text-muted-foreground text-center py-4">
          Couldn't load activities. Check the postal code and try again.
        </div>
      )}

      {!isLoading && !isError && searchPostal && activities.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No activities found near <strong>{searchPostal}</strong>.</p>
          <p className="text-xs mt-1">Try a nearby zip code or a bigger city.</p>
        </div>
      )}

      {activities.length > 0 && (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {activities.map((activity) => (
            <Card key={activity.id} className="flex-shrink-0 w-56 snap-start border-border hover:border-primary/50 transition-colors">
              {activity.imageUrl ? (
                <div className="h-32 rounded-t-xl overflow-hidden bg-muted">
                  <img
                    src={activity.imageUrl}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              ) : (
                <div className="h-32 rounded-t-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <MapPin className="h-10 w-10 text-primary/40" />
                </div>
              )}
              <CardContent className="p-3 space-y-1.5">
                <Badge className={`text-xs ${CATEGORY_COLORS[activity.category] || CATEGORY_COLORS.event}`}>
                  {activity.category}
                </Badge>
                <p className="font-semibold text-sm leading-tight line-clamp-2">{activity.title}</p>
                {activity.venueName && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{activity.venueName}</p>
                )}
                {activity.date && (
                  <p className="text-xs text-muted-foreground">{activity.date}</p>
                )}
                <div className="flex gap-1 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    disabled={postingId === activity.id}
                    onClick={() => {
                      setPostingId(activity.id);
                      postMutation.mutate(activity);
                    }}
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    {postingId === activity.id ? "Posting…" : "Post to Feed"}
                  </Button>
                  {activity.externalUrl && (
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" asChild>
                      <a href={activity.externalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
