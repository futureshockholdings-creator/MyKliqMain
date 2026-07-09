import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, ChevronLeft, ChevronRight, ExternalLink, Share2, Loader2 } from "lucide-react";
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
}

const CATEGORY_COLORS: Record<string, string> = {
  event: "bg-purple-100 text-purple-700",
  outdoor: "bg-green-100 text-green-700",
  family: "bg-yellow-100 text-yellow-700",
  arts: "bg-pink-100 text-pink-700",
  sports: "bg-blue-100 text-blue-700",
  entertainment: "bg-orange-100 text-orange-700",
};

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

async function geocodePostal(postal: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(postal)}&format=json&limit=1`,
      { headers: { "Accept": "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

async function fetchVenues(lat: number, lng: number): Promise<NearbyActivity[]> {
  const radius = 25000;
  const query = `[out:json][timeout:25];(node["tourism"~"museum|attraction|gallery|theme_park|zoo|aquarium"]["name"](around:${radius},${lat},${lng});way["tourism"~"museum|attraction|gallery|theme_park|zoo|aquarium"]["name"](around:${radius},${lat},${lng});node["leisure"~"park|sports_centre|stadium|arena|golf_course|amusement_park"]["name"](around:${radius},${lat},${lng});way["leisure"~"park|sports_centre|stadium|arena|golf_course|amusement_park"]["name"](around:${radius},${lat},${lng});node["amenity"~"cinema|theatre|arts_centre|nightclub|bowling_alley|casino"]["name"](around:${radius},${lat},${lng});way["amenity"~"cinema|theatre|arts_centre|nightclub|bowling_alley|casino"]["name"](around:${radius},${lat},${lng}););out tags center 30;`;

  const mirrors = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
  ];

  for (const mirror of mirrors) {
    try {
      const res = await fetch(mirror, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const seen = new Set<string>();
      const results: NearbyActivity[] = [];
      for (const el of (data.elements || []).slice(0, 30)) {
        const name: string = el.tags?.name;
        if (!name || seen.has(name)) continue;
        seen.add(name);
        const tag = el.tags;
        let category: NearbyActivity["category"] = "outdoor";
        if (tag.tourism === "museum" || tag.tourism === "gallery" || tag.amenity === "arts_centre" || tag.amenity === "theatre") category = "arts";
        else if (tag.amenity === "cinema" || tag.amenity === "nightclub" || tag.amenity === "bowling_alley" || tag.amenity === "casino") category = "entertainment";
        else if (tag.leisure === "sports_centre" || tag.leisure === "stadium" || tag.leisure === "arena") category = "sports";
        else if (tag.tourism === "theme_park" || tag.tourism === "zoo" || tag.tourism === "aquarium" || tag.leisure === "amusement_park") category = "family";
        const elType = el.type === "way" ? "way" : el.type === "relation" ? "relation" : "node";
        results.push({
          id: `osm-${el.id}`,
          title: name,
          category,
          venueName: tag["addr:city"] || tag["addr:suburb"] || undefined,
          externalUrl: tag.website || tag.url || `https://www.openstreetmap.org/${elType}/${el.id}`,
        });
      }
      if (results.length > 0) return results;
    } catch {}
  }
  return [];
}

export function NearbyActivitiesCarousel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [postalInput, setPostalInput] = useState("");
  const [activities, setActivities] = useState<NearbyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(null);

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

  const handleSearch = async () => {
    const val = postalInput.trim();
    if (!val) return;
    setIsLoading(true);
    setHasSearched(false);
    setActivities([]);
    try {
      const coords = await geocodePostal(val);
      if (!coords) {
        setHasSearched(true);
        setIsLoading(false);
        return;
      }
      const results = await fetchVenues(coords.lat, coords.lng);
      setActivities(results);
    } catch {}
    setHasSearched(true);
    setIsLoading(false);
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

      {!isLoading && hasSearched && activities.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No activities found near <strong>{postalInput}</strong>.</p>
          <p className="text-xs mt-1">Try a nearby zip code or a bigger city.</p>
        </div>
      )}

      {activities.length > 0 && (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {activities.map((activity) => (
            <Card key={activity.id} className="flex-shrink-0 w-56 snap-start bg-white border-gray-200 hover:border-primary/50 transition-colors">
              <div className="h-32 rounded-t-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <MapPin className="h-10 w-10 text-gray-300" />
              </div>
              <CardContent className="p-3 space-y-1.5">
                <Badge className={`text-xs font-medium ${CATEGORY_COLORS[activity.category] || CATEGORY_COLORS.event}`}>
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
