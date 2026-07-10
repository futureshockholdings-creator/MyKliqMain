import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, ChevronLeft, ChevronRight, ExternalLink, Share2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/tokenStorage";
import { useToast } from "@/hooks/use-toast";

interface NearbyActivity {
  id: string;
  title: string;
  category: "event" | "outdoor" | "family" | "arts" | "sports" | "entertainment";
  date?: string;
  venueName?: string;
  imageUrl?: string;
  externalUrl?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  event: "bg-purple-100 text-purple-700",
  outdoor: "bg-green-100 text-green-700",
  family: "bg-yellow-100 text-yellow-700",
  arts: "bg-pink-100 text-pink-700",
  sports: "bg-blue-100 text-blue-700",
  entertainment: "bg-orange-100 text-orange-700",
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  arts:          "from-pink-400 to-purple-500",
  entertainment: "from-orange-400 to-rose-500",
  outdoor:       "from-green-400 to-teal-500",
  sports:        "from-blue-400 to-indigo-500",
  family:        "from-yellow-400 to-orange-400",
  event:         "from-violet-400 to-purple-500",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  arts:          "🎨",
  entertainment: "🎬",
  outdoor:       "🌳",
  sports:        "🏟️",
  family:        "🎡",
  event:         "🎉",
};

function ActivityThumbnail({ imageUrl, category, title }: { imageUrl?: string; category: string; title: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.event;
  const emoji = CATEGORY_EMOJIS[category] || "📍";

  if (imageUrl && !imgFailed) {
    return (
      <div className="h-32 rounded-t-xl overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`h-32 rounded-t-xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-1`}>
      <span className="text-3xl">{emoji}</span>
      <span className="text-white/80 text-xs font-medium capitalize">{category}</span>
    </div>
  );
}

function ActivityCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-56 rounded-xl border border-gray-200 bg-white animate-pulse">
      <div className="h-32 bg-gray-100 rounded-t-xl" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-16" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-8 bg-gray-100 rounded w-full mt-2" />
      </div>
    </div>
  );
}

export function NearbyActivitiesCarousel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [postalInput, setPostalInput] = useState("");
  const [submittedPostal, setSubmittedPostal] = useState("");
  const [postingId, setPostingId] = useState<string | null>(null);

  const { data: activities = [], isLoading, isError } = useQuery<NearbyActivity[]>({
    queryKey: ["/api/nearby-activities", submittedPostal],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(`/api/nearby-activities?postal=${encodeURIComponent(submittedPostal)}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!submittedPostal,
    staleTime: 1000 * 60 * 10,
    retry: false,
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
    const val = postalInput.trim();
    if (!val) return;
    setSubmittedPostal(val);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  return (
    <div className="space-y-3 bg-white rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Need something to get into? 🎉</h2>
          <p className="text-sm text-gray-500">Discover local events & activities near you</p>
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
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Postal / Zip Code"
            value={postalInput}
            onChange={(e) => setPostalInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <Button onClick={handleSearch} disabled={!postalInput.trim() || isLoading} size="sm">
          {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
          {isLoading ? "Searching…" : "Search"}
        </Button>
      </div>

      {isLoading && (
        <div className="flex gap-3 overflow-hidden pb-2">
          {[1, 2, 3, 4].map((i) => <ActivityCardSkeleton key={i} />)}
        </div>
      )}

      {isError && (
        <p className="text-sm text-gray-500 text-center py-4">Couldn't load results. Try again.</p>
      )}

      {!isLoading && !isError && submittedPostal && activities.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No activities found near <strong>{submittedPostal}</strong>.</p>
          <p className="text-xs mt-1">Try a nearby zip code or a larger city.</p>
        </div>
      )}

      {activities.length > 0 && (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {activities.map((activity) => (
            <Card key={activity.id} className="flex-shrink-0 w-56 snap-start bg-white border-gray-200 hover:border-primary/50 transition-colors">
              <ActivityThumbnail imageUrl={activity.imageUrl} category={activity.category} title={activity.title} />
              <CardContent className="p-3 space-y-1.5">
                <Badge className={`text-xs font-medium border-0 ${CATEGORY_COLORS[activity.category] || CATEGORY_COLORS.event}`}>
                  {activity.category}
                </Badge>
                <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">{activity.title}</p>
                {activity.venueName && (
                  <p className="text-xs text-gray-500 line-clamp-1">{activity.venueName}</p>
                )}
                {activity.date && (
                  <p className="text-xs text-gray-500">{activity.date}</p>
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
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-gray-200" asChild>
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
