import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { LanguageSelector } from "@/components/LanguageSelector";
import { StreakDashboardCard } from "@/components/KliqKoin/StreakDashboardCard";
import { KoinWalletCard } from "@/components/KliqKoin/KoinWalletCard";
import { BorderMarketplaceCard } from "@/components/KliqKoin/BorderMarketplaceCard";
import { MyBordersCard } from "@/components/KliqKoin/MyBordersCard";
import { NotificationSettings } from "@/components/NotificationSettings";
import { AnalyticsConsentSettings } from "@/components/AnalyticsConsentSettings";

import { 
  MessageCircle,
  Trash2,
  RefreshCw,
  ExternalLink,
  Link2,
  LogOut,
  User,
  AlertTriangle,
  Trophy,
  Coins,
  Flame,
  ShoppingCart,
  Crown,
  Lock,
  Check,
  Users,
  Gift,
  Clock,
  CheckCircle,
} from "lucide-react";
import { 
  SiPinterest, 
  SiTwitch, 
  SiDiscord, 
  SiYoutube, 
  SiReddit,
  SiBluesky,
  SiMedium
} from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { enhancedCache } from "@/lib/enterprise/enhancedCache";
import { enterpriseFetch } from "@/lib/enterprise/enterpriseFetch";
import { cleanupEnterpriseServices } from "@/lib/enterprise/enterpriseInit";
import { removeAuthToken } from "@/lib/tokenStorage";

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

// Custom text icon for Tumblr
const TumblrIcon = () => (
  <div className="w-5 h-5 flex items-center justify-center font-bold text-white text-sm">
    t
  </div>
);

const platformInfo = {
  twitch: {
    name: "Twitch",
    icon: SiTwitch,
    color: "bg-purple-600",
    description: "Live streaming and gaming",
    requiresBusiness: false
  },
  discord: {
    name: "Discord",
    icon: SiDiscord,
    color: "bg-indigo-600",
    description: "Gaming communities and chat",
    requiresBusiness: false
  },
  youtube: {
    name: "YouTube",
    icon: SiYoutube,
    color: "bg-red-600",
    description: "Video content and subscriptions",
    requiresBusiness: false
  },
  reddit: {
    name: "Reddit",
    icon: SiReddit,
    color: "bg-orange-600",
    description: "Communities and discussions",
    requiresBusiness: false
  },
  pinterest: {
    name: "Pinterest",
    icon: SiPinterest,
    color: "bg-red-700",
    description: "Visual inspiration and ideas",
    requiresBusiness: false
  },
  bluesky: {
    name: "Bluesky",
    icon: SiBluesky,
    color: "bg-sky-500",
    description: "Decentralized social network",
    requiresBusiness: false
  },
  medium: {
    name: "Medium",
    icon: SiMedium,
    color: "bg-black",
    description: "Articles and stories",
    requiresBusiness: false
  },
  tumblr: {
    name: "Tumblr",
    icon: TumblrIcon,
    color: "bg-indigo-900",
    description: "Creative blogging platform",
    requiresBusiness: false
  }
};

interface Sport {
  id: string;
  name: string;
  icon: string;
}

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  sport: string;
}

interface SportsPreference {
  id: string;
  userId: string;
  sport: string;
  teamId: string;
  teamName: string;
  teamLogo: string | null;
  teamAbbr: string | null;
  createdAt: string;
}

function SportsPreferences() {
  const queryClient = useQueryClient();
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);

  // Define sport-only sports (no team selection needed)
  const SPORT_ONLY = ['nascar', 'xfinity', 'truck', 'f1', 'indycar', 'nhra', 'pga', 'lpga', 'atp', 'wta', 'ufc', 'boxing'];

  // Fetch available sports
  const { data: availableSports = [] } = useQuery<Sport[]>({
    queryKey: ["/api/sports/available"],
  });

  // Fetch teams for team-based sports only
  useEffect(() => {
    const fetchAllTeams = async () => {
      // Filter to only team-based sports
      const teamBasedSports = selectedSports.filter(s => !SPORT_ONLY.includes(s));
      
      if (teamBasedSports.length === 0) {
        setAllTeams([]);
        return;
      }

      const teamPromises = teamBasedSports.map(async (sport) => {
        try {
          return await apiRequest("GET", `/api/sports/teams/${sport}`);
        } catch {
          return [];
        }
      });

      const teamsArrays = await Promise.all(teamPromises);
      const combined = teamsArrays.flat();
      setAllTeams(combined);
    };

    fetchAllTeams();
  }, [selectedSports]);

  // Fetch user's current preferences (bypass cache to always get fresh data)
  const { data: userPreferences = [], isLoading: prefsLoading } = useQuery<SportsPreference[]>({
    queryKey: ["/api/sports/preferences"],
    queryFn: () => enterpriseFetch<SportsPreference[]>("/api/sports/preferences", { skipCache: true }),
  });

  // Save preferences mutation
  const savePreferences = useMutation({
    mutationFn: async (teams: Team[]) => {
      return await apiRequest("POST", "/api/sports/preferences", {
        teams: teams.map(team => ({
          sport: team.sport,
          teamId: String(team.id), // Ensure consistent string type
          teamName: team.name,
          teamLogo: team.logo,
          teamAbbr: team.abbreviation,
        }))
      });
    },
    onSuccess: async () => {
      toast({
        title: "Preferences Saved",
        description: "Your sports preferences have been updated.",
      });
      // Clear cache and refetch - no page reload needed
      await enhancedCache.removeByPattern('/api/sports/');
      await queryClient.invalidateQueries({ queryKey: ["/api/sports/preferences"] });
      // Force refetch sports updates (not just invalidate) so headlines shows new teams immediately
      // This works even when the query is inactive (user on settings page)
      await queryClient.refetchQueries({ queryKey: ["/api/sports/updates"], type: 'all' });
      // Clear selected teams after save
      setSelectedTeams([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove preference mutation
  const removePreference = useMutation({
    mutationFn: async (preferenceId: string) => {
      return await apiRequest("DELETE", `/api/sports/preferences/${preferenceId}`);
    },
    onSuccess: async () => {
      toast({
        title: "Team Removed",
        description: "Team has been removed from your preferences.",
      });
      // Clear cache and refetch - no page reload needed
      await enhancedCache.removeByPattern('/api/sports/');
      await queryClient.invalidateQueries({ queryKey: ["/api/sports/preferences"] });
      // Also invalidate sports updates so headlines page reflects removal immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/sports/updates"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove team. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSportToggle = (sportId: string) => {
    setSelectedSports(prev => {
      if (prev.includes(sportId)) {
        return prev.filter(s => s !== sportId);
      } else {
        return [...prev, sportId];
      }
    });
  };

  const handleTeamToggle = (team: Team) => {
    setSelectedTeams(prev => {
      const teamIdStr = String(team.id);
      const exists = prev.find(t => String(t.id) === teamIdStr);
      if (exists) {
        return prev.filter(t => String(t.id) !== teamIdStr);
      } else {
        return [...prev, team];
      }
    });
  };

  const handleSaveAll = () => {
    // Combine existing preferences with newly selected teams
    const existingTeams = userPreferences.map(pref => ({
      id: pref.teamId,
      name: pref.teamName,
      abbreviation: pref.teamAbbr || '',
      logo: pref.teamLogo || '',
      sport: pref.sport,
    }));

    // For sport-only selections, create fake "team" entries with sport as the identifier
    const sportOnlySelections = selectedSports
      .filter(s => SPORT_ONLY.includes(s))
      .map(sport => ({
        id: sport, // Use sport ID as team ID for sport-only selections
        name: sport.toUpperCase(),
        abbreviation: sport.toUpperCase(),
        logo: '',
        sport: sport,
      }));

    const allTeams = [...existingTeams, ...selectedTeams, ...sportOnlySelections];
    savePreferences.mutate(allTeams);
  };

  return (
    <div className="space-y-6">
      {/* Followed Teams */}
      {userPreferences.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Following</h3>
          <div className="grid gap-3">
            {userPreferences.map((pref) => (
              <div
                key={pref.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-3">
                  {pref.teamLogo && (
                    <img
                      src={pref.teamLogo}
                      alt={pref.teamName}
                      className="w-10 h-10 object-contain"
                    />
                  )}
                  <div>
                    <h4 className="text-white font-medium">{pref.teamName}</h4>
                    <p className="text-purple-200 text-sm">{pref.sport.toUpperCase()}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removePreference.mutate(pref.id)}
                  disabled={removePreference.isPending}
                  data-testid={`button-remove-team-${pref.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Teams */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Add Teams</h3>
        
        {/* Sport Selection - Organized by Category */}
        <div className="space-y-3">
          <Label className="text-white">Select Sports</Label>
          
          <Accordion type="multiple" className="w-full space-y-2">
            {/* Football */}
            <AccordionItem value="football" className="bg-white/5 border-white/10 rounded-lg px-3">
              <AccordionTrigger className="text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  🏈 Football
                  {selectedSports.filter(s => ['nfl', 'cfb'].includes(s)).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSports.filter(s => ['nfl', 'cfb'].includes(s)).length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pb-3">
                  {availableSports.filter(s => ['nfl', 'cfb'].includes(s.id)).map((sport) => (
                    <Button
                      key={sport.id}
                      variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                      onClick={() => handleSportToggle(sport.id)}
                      size="sm"
                      className={selectedSports.includes(sport.id)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"}
                      data-testid={`button-select-sport-${sport.id}`}
                    >
                      {sport.icon} {sport.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Basketball */}
            <AccordionItem value="basketball" className="bg-white/5 border-white/10 rounded-lg px-3">
              <AccordionTrigger className="text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  🏀 Basketball
                  {selectedSports.filter(s => ['nba', 'cbb', 'wnba', 'wcbb'].includes(s)).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSports.filter(s => ['nba', 'cbb', 'wnba', 'wcbb'].includes(s)).length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pb-3">
                  {availableSports.filter(s => ['nba', 'cbb', 'wnba', 'wcbb'].includes(s.id)).map((sport) => (
                    <Button
                      key={sport.id}
                      variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                      onClick={() => handleSportToggle(sport.id)}
                      size="sm"
                      className={selectedSports.includes(sport.id)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"}
                      data-testid={`button-select-sport-${sport.id}`}
                    >
                      {sport.icon} {sport.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Baseball */}
            <AccordionItem value="baseball" className="bg-white/5 border-white/10 rounded-lg px-3">
              <AccordionTrigger className="text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  ⚾ Baseball
                  {selectedSports.filter(s => ['mlb', 'collegebb'].includes(s)).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSports.filter(s => ['mlb', 'collegebb'].includes(s)).length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pb-3">
                  {availableSports.filter(s => ['mlb', 'collegebb'].includes(s.id)).map((sport) => (
                    <Button
                      key={sport.id}
                      variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                      onClick={() => handleSportToggle(sport.id)}
                      size="sm"
                      className={selectedSports.includes(sport.id)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"}
                      data-testid={`button-select-sport-${sport.id}`}
                    >
                      {sport.icon} {sport.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Hockey */}
            <AccordionItem value="hockey" className="bg-white/5 border-white/10 rounded-lg px-3">
              <AccordionTrigger className="text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  🏒 Hockey
                  {selectedSports.filter(s => ['nhl', 'mcollegehockey', 'wcollegehockey'].includes(s)).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSports.filter(s => ['nhl', 'mcollegehockey', 'wcollegehockey'].includes(s)).length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pb-3">
                  {availableSports.filter(s => ['nhl', 'mcollegehockey', 'wcollegehockey'].includes(s.id)).map((sport) => (
                    <Button
                      key={sport.id}
                      variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                      onClick={() => handleSportToggle(sport.id)}
                      size="sm"
                      className={selectedSports.includes(sport.id)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"}
                      data-testid={`button-select-sport-${sport.id}`}
                    >
                      {sport.icon} {sport.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Soccer */}
            <AccordionItem value="soccer" className="bg-white/5 border-white/10 rounded-lg px-3">
              <AccordionTrigger className="text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  ⚽ Soccer
                  {selectedSports.filter(s => ['soccer', 'premierleague', 'laliga', 'seriea', 'bundesliga', 'championsleague'].includes(s)).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSports.filter(s => ['soccer', 'premierleague', 'laliga', 'seriea', 'bundesliga', 'championsleague'].includes(s)).length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pb-3">
                  {availableSports.filter(s => ['soccer', 'premierleague', 'laliga', 'seriea', 'bundesliga', 'championsleague'].includes(s.id)).map((sport) => (
                    <Button
                      key={sport.id}
                      variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                      onClick={() => handleSportToggle(sport.id)}
                      size="sm"
                      className={selectedSports.includes(sport.id)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"}
                      data-testid={`button-select-sport-${sport.id}`}
                    >
                      {sport.icon} {sport.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Racing */}
            <AccordionItem value="racing" className="bg-white/5 border-white/10 rounded-lg px-3">
              <AccordionTrigger className="text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  🏎️ Racing
                  {selectedSports.filter(s => ['nascar', 'xfinity', 'truck', 'f1', 'indycar', 'nhra'].includes(s)).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSports.filter(s => ['nascar', 'xfinity', 'truck', 'f1', 'indycar', 'nhra'].includes(s)).length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pb-3">
                  {availableSports.filter(s => ['nascar', 'xfinity', 'truck', 'f1', 'indycar', 'nhra'].includes(s.id)).map((sport) => (
                    <Button
                      key={sport.id}
                      variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                      onClick={() => handleSportToggle(sport.id)}
                      size="sm"
                      className={selectedSports.includes(sport.id)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"}
                      data-testid={`button-select-sport-${sport.id}`}
                    >
                      {sport.icon} {sport.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Golf */}
            <AccordionItem value="golf" className="bg-white/5 border-white/10 rounded-lg px-3">
              <AccordionTrigger className="text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  ⛳ Golf
                  {selectedSports.filter(s => ['pga', 'lpga'].includes(s)).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSports.filter(s => ['pga', 'lpga'].includes(s)).length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pb-3">
                  {availableSports.filter(s => ['pga', 'lpga'].includes(s.id)).map((sport) => (
                    <Button
                      key={sport.id}
                      variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                      onClick={() => handleSportToggle(sport.id)}
                      size="sm"
                      className={selectedSports.includes(sport.id)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"}
                      data-testid={`button-select-sport-${sport.id}`}
                    >
                      {sport.icon} {sport.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Tennis */}
            <AccordionItem value="tennis" className="bg-white/5 border-white/10 rounded-lg px-3">
              <AccordionTrigger className="text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  🎾 Tennis
                  {selectedSports.filter(s => ['atp', 'wta'].includes(s)).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSports.filter(s => ['atp', 'wta'].includes(s)).length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pb-3">
                  {availableSports.filter(s => ['atp', 'wta'].includes(s.id)).map((sport) => (
                    <Button
                      key={sport.id}
                      variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                      onClick={() => handleSportToggle(sport.id)}
                      size="sm"
                      className={selectedSports.includes(sport.id)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"}
                      data-testid={`button-select-sport-${sport.id}`}
                    >
                      {sport.icon} {sport.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Combat Sports */}
            <AccordionItem value="combat" className="bg-white/5 border-white/10 rounded-lg px-3">
              <AccordionTrigger className="text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  🥊 Combat Sports
                  {selectedSports.filter(s => ['ufc', 'boxing'].includes(s)).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSports.filter(s => ['ufc', 'boxing'].includes(s)).length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pb-3">
                  {availableSports.filter(s => ['ufc', 'boxing'].includes(s.id)).map((sport) => (
                    <Button
                      key={sport.id}
                      variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                      onClick={() => handleSportToggle(sport.id)}
                      size="sm"
                      className={selectedSports.includes(sport.id)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"}
                      data-testid={`button-select-sport-${sport.id}`}
                    >
                      {sport.icon} {sport.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Other Sports */}
            <AccordionItem value="other" className="bg-white/5 border-white/10 rounded-lg px-3">
              <AccordionTrigger className="text-white hover:no-underline py-3">
                <span className="flex items-center gap-2">
                  🌍 Other Sports
                  {selectedSports.filter(s => ['rugby', 'cricket'].includes(s)).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSports.filter(s => ['rugby', 'cricket'].includes(s)).length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pb-3">
                  {availableSports.filter(s => ['rugby', 'cricket'].includes(s.id)).map((sport) => (
                    <Button
                      key={sport.id}
                      variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                      onClick={() => handleSportToggle(sport.id)}
                      size="sm"
                      className={selectedSports.includes(sport.id)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"}
                      data-testid={`button-select-sport-${sport.id}`}
                    >
                      {sport.icon} {sport.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Team Selection and Sport-Only Message */}
        {selectedSports.length > 0 && (
          <div className="space-y-3">
            {(() => {
              const teamBasedSports = selectedSports.filter(s => !SPORT_ONLY.includes(s));
              const sportOnlySports = selectedSports.filter(s => SPORT_ONLY.includes(s));
              
              return (
                <>
                  {/* Show message for sport-only selections */}
                  {sportOnlySports.length > 0 && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-emerald-400 text-sm">
                        ✓ {sportOnlySports.length} sport{sportOnlySports.length !== 1 ? 's' : ''} selected ({sportOnlySports.map(s => s.toUpperCase()).join(', ')})
                      </p>
                      <p className="text-emerald-300/70 text-xs mt-1">
                        These sports don't require team selection
                      </p>
                    </div>
                  )}

                  {/* Show team selection for team-based sports */}
                  {teamBasedSports.length > 0 && (
                    <>
                      <Label className="text-white">Select Teams ({teamBasedSports.length} team-based sport{teamBasedSports.length !== 1 ? 's' : ''} selected)</Label>
                      {allTeams.length === 0 ? (
                        <div className="text-purple-200">Loading teams...</div>
                      ) : (
                        <div className="grid gap-2 max-h-64 overflow-y-auto">
                          {allTeams.map((team) => {
                            const teamIdStr = String(team.id);
                            const isSelected = selectedTeams.some(t => String(t.id) === teamIdStr);
                            const isAlreadyFollowing = userPreferences.some(p => String(p.teamId) === teamIdStr);
                            
                            return (
                              <button
                                key={team.id}
                                onClick={() => !isAlreadyFollowing && handleTeamToggle(team)}
                                disabled={isAlreadyFollowing}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                                  isAlreadyFollowing 
                                    ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-purple-600/30 border-purple-400'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                                data-testid={`button-toggle-team-${team.id}`}
                              >
                                {team.logo && (
                                  <img
                                    src={team.logo}
                                    alt={team.name}
                                    className="w-8 h-8 object-contain"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="text-white font-medium">{team.name}</div>
                                  <div className="text-purple-200 text-sm">{team.abbreviation}</div>
                                </div>
                                {isAlreadyFollowing && (
                                  <Badge variant="secondary">Following</Badge>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* Save button - show if there are teams selected OR sport-only sports selected */}
                  {(selectedTeams.length > 0 || sportOnlySports.length > 0) && (
                    <Button
                      onClick={handleSaveAll}
                      disabled={savePreferences.isPending}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      data-testid="button-save-sports-preferences"
                    >
                      {selectedTeams.length > 0 && sportOnlySports.length > 0
                        ? `Save ${selectedTeams.length} Team${selectedTeams.length !== 1 ? 's' : ''} & ${sportOnlySports.length} Sport${sportOnlySports.length !== 1 ? 's' : ''}`
                        : selectedTeams.length > 0
                        ? `Save ${selectedTeams.length} Team${selectedTeams.length !== 1 ? 's' : ''}`
                        : `Save ${sportOnlySports.length} Sport${sportOnlySports.length !== 1 ? 's' : ''}`
                      }
                    </Button>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {userPreferences.length === 0 && !prefsLoading && (
        <div className="text-center py-8">
          <p className="text-purple-200 mb-4">No teams followed yet</p>
          <p className="text-purple-300 text-sm">
            Select a sport and add teams to see their scores in your Headlines feed
          </p>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Delete account state management
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'pin' | 'final'>('confirm');
  const [pin, setPin] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Bluesky connection state
  const [showBlueskyDialog, setShowBlueskyDialog] = useState(false);
  const [blueskyHandle, setBlueskyHandle] = useState('');
  const [blueskyAppPassword, setBlueskyAppPassword] = useState('');

  const handleLogout = async () => {
    try {
      // 1. Clear JWT token first (for cross-domain auth with AWS Amplify)
      console.log('[Logout] Clearing JWT token...');
      removeAuthToken();
      
      // 2. Mark that we're logging out to prevent auto-redirect on login page
      sessionStorage.setItem('forceLogout', 'true');
      
      console.log('[Logout] Cleaning up enterprise services...');
      await cleanupEnterpriseServices();

      console.log('[Logout] Clearing offline store...');
      const { offlineStore } = await import('@/lib/offlineStore');
      await offlineStore.clearAll();
      
      // 4. Completely REMOVE all user-specific queries from TanStack Query
      // Using predicate-based removal to catch ALL API queries regardless of structure
      console.log('[Logout] Removing TanStack Query cache...');
      queryClient.removeQueries({
        predicate: (query) => {
          const firstKey = query.queryKey[0];
          return typeof firstKey === 'string' && firstKey.startsWith('/api/');
        }
      });
      
      // 5. Also clear the query client cache entirely
      queryClient.clear();
      
      // 6. Call server logout endpoint to invalidate server session
      try {
        await apiRequest("GET", "/api/logout");
      } catch (serverLogoutError) {
        // Server logout failure is not critical, continue with client-side logout
        console.warn('[Logout] Server logout failed, continuing with client logout:', serverLogoutError);
      }
      
      console.log('[Logout] All caches cleared successfully, redirecting...');
    } catch (error) {
      console.error('[Logout] Failed to clear caches:', error);
      // Continue with logout even if cache clearing fails
    }
    
    // 7. Redirect to landing page
    window.location.href = '/landing';
  };


  // Fetch connected social accounts
  const { data: socialAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/social/accounts"],
  });

  // Connect social account mutation
  const connectAccount = useMutation({
    mutationFn: async (platform: string) => {
      console.log(`[Social Connect] Starting OAuth flow for: ${platform}`);
      // Add cache-busting timestamp to prevent cached OAuth states
      const response = await apiRequest("GET", `/api/oauth/authorize/${platform}?t=${Date.now()}`);
      console.log(`[Social Connect] Got response:`, response);
      return response;
    },
    onSuccess: (data) => {
      if (data.demo) {
        // Demo mode - show success message and refresh accounts
        toast({
          title: "Demo Connection Successful",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
      } else {
        // Real OAuth
        if (!data.authUrl) {
          toast({
            title: "Connection Failed",
            description: "OAuth URL not provided. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        // Try popup first (works on desktop)
        const popup = window.open(data.authUrl, '_blank', 'width=600,height=700');
        
        // If popup fails (mobile browsers or popup blockers), use redirect
        if (!popup) {
          toast({
            title: "Redirecting to authorize...",
            description: "You'll be redirected back after connecting.",
          });
          // Full page redirect - works reliably on mobile
          window.location.assign(data.authUrl);
          return;
        }
        
        // Popup opened successfully (desktop)
        toast({
          title: "Authorization Window Opened",
          description: "Complete the authorization in the popup window.",
        });
        
        // Poll for connection updates
        const interval = setInterval(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
        }, 2000);
        
        // Clear interval after 2 minutes
        setTimeout(() => clearInterval(interval), 120000);
      }
    },
    onError: (error) => {
      console.error(`[Social Connect] Error:`, error);
      toast({
        title: "Connection Failed",
        description: "Failed to start OAuth flow. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove social account mutation with optimistic updates for immediate UI feedback
  const removeAccount = useMutation({
    mutationFn: async (accountId: string) => {
      return await apiRequest("DELETE", `/api/social/accounts/${accountId}`);
    },
    onMutate: async (accountId: string) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/social/accounts"] });
      
      // Snapshot the previous value
      const previousAccounts = queryClient.getQueryData(["/api/social/accounts"]);
      
      // Optimistically remove the account from the list immediately
      queryClient.setQueryData(["/api/social/accounts"], (old: SocialAccount[] | undefined) => {
        return old ? old.filter(account => account.id !== accountId) : [];
      });
      
      // Return context with the previous value
      return { previousAccounts };
    },
    onSuccess: async () => {
      // Clear enterprise cache first to prevent stale data from repopulating
      await enhancedCache.removeByPattern('/api/social/accounts');
      // Then refetch to ensure server state is in sync
      queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
      toast({
        title: "Account Removed",
        description: "Social media account has been disconnected.",
      });
    },
    onError: (_error, _accountId, context) => {
      // Rollback to the previous value on error
      if (context?.previousAccounts) {
        queryClient.setQueryData(["/api/social/accounts"], context.previousAccounts);
      }
      toast({
        title: "Error",
        description: "Failed to remove account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bluesky connection mutation (uses app password instead of OAuth)
  const connectBluesky = useMutation({
    mutationFn: async ({ handle, appPassword }: { handle: string; appPassword: string }) => {
      return await apiRequest("POST", "/api/social/bluesky/connect", { handle, appPassword });
    },
    onSuccess: async (data) => {
      await enhancedCache.removeByPattern('/api/social/accounts');
      queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-koins/wallet"] });
      setShowBlueskyDialog(false);
      setBlueskyHandle('');
      setBlueskyAppPassword('');
      toast({
        title: "Bluesky Connected!",
        description: `Successfully connected @${data.username}. You earned 1,000 Kliq Koins!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Bluesky. Please check your handle and app password.",
        variant: "destructive",
      });
    },
  });

  // Sync account mutation
  const syncAccount = useMutation({
    mutationFn: async (platform: string) => {
      return await apiRequest("POST", `/api/social/sync/${platform}`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      toast({
        title: "Sync Complete",
        description: data?.message || "Content has been synced to your Headlines feed.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync content. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sync all platforms mutation
  const syncAllPlatforms = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/social/sync-all");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      toast({
        title: "All Platforms Synced",
        description: data?.message || "Content from all platforms has been synced to your Headlines feed.",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync platforms. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getConnectedPlatforms = () => {
    return (socialAccounts as SocialAccount[]).map((account: SocialAccount) => account.platform);
  };

  const getAvailablePlatforms = () => {
    const connected = getConnectedPlatforms();
    return Object.keys(platformInfo).filter(platform => !connected.includes(platform));
  };

  // Kliq Koin queries
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["/api/kliq-koins/wallet"],
  });

  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ["/api/kliq-koins/streak"],
  });

  const { data: bordersData = [], isLoading: bordersLoading } = useQuery({
    queryKey: ["/api/kliq-koins/borders"],
  });

  const { data: myBordersData = [], isLoading: myBordersLoading } = useQuery({
    queryKey: ["/api/kliq-koins/my-borders"],
  });

  const { data: referralStats, isLoading: referralStatsLoading } = useQuery<{
    totalReferred: number;
    pendingBonuses: number;
    completedBonuses: number;
    totalKoinsEarned: number;
  }>({
    queryKey: ["/api/referrals/stats"],
  });

  // Kliq Koin mutations
  const purchaseBorder = useMutation({
    mutationFn: async (borderId: string) => {
      return await apiRequest("POST", "/api/kliq-koins/purchase-border", { borderId });
    },
    onSuccess: async () => {
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-koins');
      } catch (e) {
        console.log('Cache clear error (non-critical):', e);
      }

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/kliq-koins/wallet"] }),
        queryClient.refetchQueries({ queryKey: ["/api/kliq-koins/borders"] }),
        queryClient.refetchQueries({ queryKey: ["/api/kliq-koins/my-borders"] }),
      ]);

      toast({
        title: "Border Purchased! 🎉",
        description: "Your new border has been added to your collection.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase border. Please try again.",
        variant: "destructive",
      });
    },
  });

  const equipBorder = useMutation({
    mutationFn: async (borderId: string) => {
      return await apiRequest("POST", "/api/kliq-koins/equip-border", { borderId });
    },
    onSuccess: async () => {
      // Clear all caches and wait for completion before reload
      // Use refetchQueries to ensure fresh data is fetched before reload
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/kliq-koins/my-borders"] }),
        queryClient.refetchQueries({ queryKey: ["/api/kliq-koins/borders"] }),
        queryClient.refetchQueries({ queryKey: ["/api/auth/user"] }),
      ]);
      
      // Clear enterprise cache (IndexedDB) for feed data
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
        await enhancedCache.removeByPattern('/api/auth/user');
        await enhancedCache.removeByPattern('/api/kliq-koins');
      } catch (e) {
        console.log('Cache clear error (non-critical):', e);
      }
      
      // Also invalidate feed queries
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      
      // Small delay to ensure server cache is invalidated before reload
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force hard refresh by reloading the page
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Equip",
        description: error.message || "Failed to equip border. Please try again.",
        variant: "destructive",
      });
    },
  });

  const unequipBorder = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/kliq-koins/unequip-border", {});
    },
    onSuccess: async () => {
      // Clear all caches and wait for completion before reload
      // Use refetchQueries to ensure fresh data is fetched before reload
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/kliq-koins/my-borders"] }),
        queryClient.refetchQueries({ queryKey: ["/api/kliq-koins/borders"] }),
        queryClient.refetchQueries({ queryKey: ["/api/auth/user"] }),
      ]);
      
      // Clear enterprise cache (IndexedDB) for feed data
      try {
        const { enhancedCache } = await import('@/lib/enterprise/enhancedCache');
        await enhancedCache.removeByPattern('/api/kliq-feed');
        await enhancedCache.removeByPattern('/api/auth/user');
        await enhancedCache.removeByPattern('/api/kliq-koins');
      } catch (e) {
        console.log('Cache clear error (non-critical):', e);
      }
      
      // Also invalidate feed queries
      queryClient.invalidateQueries({ queryKey: ["/api/kliq-feed"] });
      
      // Small delay to ensure server cache is invalidated before reload
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force hard refresh by reloading the page
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove",
        description: error.message || "Failed to remove border. Please try again.",
        variant: "destructive",
      });
    },
  });

  const restoreStreak = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/kliq-koins/restore-streak", {});
    },
    onSuccess: async (data: any) => {
      await enhancedCache.removeByPattern('/api/kliq-koins/');
      
      if (data?.streak) {
        queryClient.setQueryData(["/api/kliq-koins/streak"], data.streak);
      }
      
      await queryClient.invalidateQueries({ queryKey: ["/api/kliq-koins/wallet"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/kliq-koins/streak"] });
      toast({
        title: "Streak Restored!",
        description: `Your streak has been restored to ${data?.streak?.currentStreak || 'your longest'} days!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Restore Failed",
        description: error.message || "Failed to restore streak.",
        variant: "destructive",
      });
    },
  });

  // PIN verification for delete account
  const verifyPin = useMutation({
    mutationFn: async (pinCode: string) => {
      return await apiRequest("POST", "/api/user/verify-pin", { pin: pinCode });
    },
    onSuccess: (data) => {
      if (data.success) {
        setDeleteStep('final');
        setPin('');
      } else {
        toast({
          title: "Invalid PIN",
          description: "The PIN you entered is incorrect.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to verify PIN. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccount = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/user/account");
    },
    onSuccess: async () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      
      // Clean up auth state properly (same as logout flow)
      try {
        // 1. Clear JWT token first
        console.log('[Delete Account] Clearing JWT token...');
        removeAuthToken();
        
        // 2. Mark that we're logging out to prevent auto-redirect
        sessionStorage.setItem('forceLogout', 'true');
        
        // 3. Clear ALL enterprise caches
        console.log('[Delete Account] Cleaning up enterprise services...');
        await cleanupEnterpriseServices();
        
        // 4. Remove all user-specific queries from TanStack Query
        console.log('[Delete Account] Removing TanStack Query cache...');
        queryClient.removeQueries({
          predicate: (query) => {
            const firstKey = query.queryKey[0];
            return typeof firstKey === 'string' && firstKey.startsWith('/api/');
          }
        });
        
        // 5. Clear the query client cache entirely
        queryClient.clear();
        
        console.log('[Delete Account] All caches cleared, redirecting...');
      } catch (error) {
        console.error('[Delete Account] Failed to clear caches:', error);
        // Continue with redirect even if cache clearing fails
      }
      
      // Redirect to landing page immediately
      window.location.href = '/landing';
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
      setIsDeletingAccount(false);
    },
  });

  const handleDeleteAccount = () => {
    setShowDeleteDialog(true);
    setDeleteStep('confirm');
    setPin('');
  };

  const handleDeleteStep = () => {
    if (deleteStep === 'confirm') {
      setDeleteStep('pin');
    } else if (deleteStep === 'pin') {
      if (pin.length === 4) {
        verifyPin.mutate(pin);
      } else {
        toast({
          title: "Invalid PIN",
          description: "Please enter a 4-digit PIN.",
          variant: "destructive",
        });
      }
    } else if (deleteStep === 'final') {
      setIsDeletingAccount(true);
      deleteAccount.mutate();
    }
  };

  const handleDialogClose = () => {
    setShowDeleteDialog(false);
    setDeleteStep('confirm');
    setPin('');
    setIsDeletingAccount(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-purple-200">Manage your preferences and connected accounts</p>
        </div>

        <div className="space-y-6">

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Social Media Integration
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Connect your social media accounts to aggregate content in MyKliq
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connected Accounts */}
                {(socialAccounts as SocialAccount[]).length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Connected Accounts</h3>
                      <Button
                        size="sm"
                        onClick={() => syncAllPlatforms.mutate()}
                        disabled={syncAllPlatforms.isPending}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                        data-testid="button-sync-all-platforms"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncAllPlatforms.isPending ? 'animate-spin' : ''}`} />
                        {syncAllPlatforms.isPending ? 'Syncing...' : 'Sync All'}
                      </Button>
                    </div>
                    <p className="text-purple-200 text-sm">
                      Content from your connected platforms will appear in your Headlines feed. Syncs automatically every 15 minutes.
                    </p>
                    <div className="grid gap-4">
                      {(socialAccounts as SocialAccount[]).map((account: SocialAccount) => {
                        const platform = platformInfo[account.platform as keyof typeof platformInfo];
                        const Icon = platform?.icon || MessageCircle;
                        
                        return (
                          <div 
                            key={account.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${platform?.color || 'bg-gray-600'}`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{platform?.name || account.platform}</h4>
                                <p className="text-purple-200 text-sm truncate">@{account.username}</p>
                                {account.lastSyncAt && (
                                  <p className="text-purple-300 text-xs">
                                    Last sync: {new Date(account.lastSyncAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <Badge variant={account.isActive ? "default" : "secondary"} className="flex-shrink-0 hidden sm:inline-flex">
                                {account.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => syncAccount.mutate(account.platform)}
                                disabled={syncAccount.isPending}
                                className="border-white/20 text-white hover:bg-white/10 flex-1 sm:flex-none"
                                data-testid={`button-sync-${account.platform}`}
                              >
                                <RefreshCw className={`w-4 h-4 ${syncAccount.isPending ? 'animate-spin' : ''}`} />
                                <span className="ml-2 sm:hidden">Sync</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeAccount.mutate(account.id)}
                                disabled={removeAccount.isPending}
                                className="flex-1 sm:flex-none"
                                data-testid={`button-remove-${account.platform}`}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="ml-2 sm:hidden">Remove</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Available Platforms */}
                {getAvailablePlatforms().length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Connect New Platform</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {getAvailablePlatforms().map((platformKey) => {
                        const platform = platformInfo[platformKey as keyof typeof platformInfo];
                        const Icon = platform?.icon || MessageCircle;
                        
                        return (
                          <div 
                            key={platformKey}
                            className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${platform?.color || 'bg-gray-600'}`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm sm:text-base break-words">{platform?.name || platformKey}</h4>
                                <p className="text-purple-200 text-xs sm:text-sm break-words">{platform?.description}</p>
                                {platform?.requiresBusiness && (
                                  <p className="text-yellow-300 text-xs mt-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Requires Business or Creator account
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => {
                                console.log(`[Social Connect] Button clicked for platform: ${platformKey}`);
                                if (platformKey === 'bluesky') {
                                  setShowBlueskyDialog(true);
                                } else {
                                  connectAccount.mutate(platformKey);
                                }
                              }}
                              disabled={!['twitch', 'discord', 'reddit', 'pinterest', 'youtube', 'bluesky'].includes(platformKey) || connectAccount.isPending || connectBluesky.isPending}
                              className={['twitch', 'discord', 'reddit', 'pinterest', 'youtube', 'bluesky'].includes(platformKey)
                                ? "w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm sm:text-base" 
                                : "w-full bg-white/10 text-white/50 border-white/20 cursor-not-allowed text-sm sm:text-base"}
                              data-testid={`button-connect-${platformKey}`}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              {['twitch', 'discord', 'reddit', 'pinterest', 'youtube', 'bluesky'].includes(platformKey) ? `Connect ${platform?.name}` : 'Coming Soon'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(socialAccounts as SocialAccount[]).length === 0 && !accountsLoading && (
                  <div className="text-center py-8">
                    <p className="text-purple-200 mb-4">No social accounts connected yet</p>
                    <p className="text-purple-300 text-sm">
                      Connect your social media accounts to see all your content in one place
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sports Preferences */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Sports Preferences
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Follow your favorite sports teams and get score updates in your Headlines feed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SportsPreferences />
              </CardContent>
            </Card>

            {/* Kliq Koin System */}
            <StreakDashboardCard 
              streakData={streakData}
              isLoading={streakLoading}
              onRestoreStreak={() => restoreStreak.mutate()}
              isRestoring={restoreStreak.isPending}
            />

            <KoinWalletCard 
              walletData={walletData}
              isLoading={walletLoading}
            />

            {/* Referral Stats Card */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Referral Program
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Earn 10 Kliq Koins for each friend who joins using your invite code
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralStatsLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-20 bg-white/10 rounded-lg" />
                    <div className="h-20 bg-white/10 rounded-lg" />
                    <div className="h-20 bg-white/10 rounded-lg" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-600/20">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{referralStats?.totalReferred || 0}</p>
                          <p className="text-sm text-purple-200">Total Referred</p>
                        </div>
                      </div>
                      <p className="text-xs text-purple-300 mt-2">
                        Friends who joined with your code
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-yellow-600/20">
                          <Clock className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{referralStats?.pendingBonuses || 0}</p>
                          <p className="text-sm text-purple-200">Pending Bonuses</p>
                        </div>
                      </div>
                      <p className="text-xs text-purple-300 mt-2">
                        Waiting for 24hr period + login
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-600/20">
                          <Gift className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{referralStats?.totalKoinsEarned || 0}</p>
                          <p className="text-sm text-purple-200">Koins Earned</p>
                        </div>
                      </div>
                      <p className="text-xs text-purple-300 mt-2">
                        {referralStats?.completedBonuses || 0} bonuses completed
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-400/30">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-600/40">
                      <CheckCircle className="w-5 h-5 text-purple-200" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">How Referral Bonuses Work</h4>
                      <ul className="text-sm text-purple-200 space-y-1">
                        <li>✅ Share your invite code from the MyKliq page</li>
                        <li>✅ New user signs up with your code</li>
                        <li>✅ They must wait 24 hours and log in at least once</li>
                        <li>✅ You automatically receive 10 Kliq Koins!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Accordion type="multiple" className="space-y-4">
              <AccordionItem value="marketplace" className="border-0">
                <AccordionTrigger className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-6 py-4 hover:bg-white/15 transition-colors data-[state=open]:rounded-b-none text-white hover:no-underline">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="text-lg font-semibold">Border Marketplace</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-white/10 backdrop-blur-sm border border-t-0 border-white/20 rounded-b-lg p-0">
                  <BorderMarketplaceCard 
                    bordersData={bordersData}
                    walletData={walletData}
                    isLoading={bordersLoading}
                    isPurchasing={purchaseBorder.isPending}
                    onPurchase={(borderId) => purchaseBorder.mutate(borderId)}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="collection" className="border-0">
                <AccordionTrigger className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-6 py-4 hover:bg-white/15 transition-colors data-[state=open]:rounded-b-none text-white hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    <span className="text-lg font-semibold">My Borders Collection</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-white/10 backdrop-blur-sm border border-t-0 border-white/20 rounded-b-lg p-0">
                  <MyBordersCard 
                    myBordersData={myBordersData}
                    isLoading={myBordersLoading}
                    isEquipping={equipBorder.isPending || unequipBorder.isPending}
                    onEquip={(borderId) => equipBorder.mutate(borderId)}
                    onUnequip={() => unequipBorder.mutate()}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Language Settings */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">🌍 Language Settings</CardTitle>
                <CardDescription className="text-purple-200">Choose your preferred language for the interface</CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageSelector 
                  variant="select" 
                  showFlag={true} 
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Push Notification Settings */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
              <NotificationSettings />
            </div>

            {/* Analytics Consent Settings */}
            {user && (
              <AnalyticsConsentSettings initialConsent={user.analyticsConsent !== false} />
            )}

            {/* Account Management */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Management
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Manage your account settings and session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                
                {/* Delete Account Button */}
                <div className="pt-4 border-t border-white/20">
                  <Button
                    onClick={handleDeleteAccount}
                    variant="destructive"
                    className="w-full bg-red-800 hover:bg-red-900 text-white"
                    data-testid="button-delete-account"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                  <p className="text-purple-300 text-xs mt-2 text-center">
                    This action cannot be undone
                  </p>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Bluesky Connection Dialog */}
      <Dialog open={showBlueskyDialog} onOpenChange={(open) => {
        setShowBlueskyDialog(open);
        if (!open) {
          setBlueskyHandle('');
          setBlueskyAppPassword('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sky-500 flex items-center gap-2">
              <SiBluesky className="w-5 h-5" />
              Connect Bluesky
            </DialogTitle>
            <DialogDescription>
              Bluesky uses app passwords for secure third-party access. Create an app password in your Bluesky settings, then enter it below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bluesky-handle">Bluesky Handle</Label>
              <Input
                id="bluesky-handle"
                type="text"
                value={blueskyHandle}
                onChange={(e) => setBlueskyHandle(e.target.value)}
                placeholder="yourname.bsky.social"
                className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label htmlFor="bluesky-password">App Password</Label>
              <Input
                id="bluesky-password"
                type="password"
                value={blueskyAppPassword}
                onChange={(e) => setBlueskyAppPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                className="mt-1 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Create an app password at: Settings → Privacy and Security → App Passwords
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBlueskyDialog(false);
                setBlueskyHandle('');
                setBlueskyAppPassword('');
              }}
              disabled={connectBluesky.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => connectBluesky.mutate({ handle: blueskyHandle.trim(), appPassword: blueskyAppPassword.trim() })}
              disabled={!blueskyHandle.trim() || !blueskyAppPassword.trim() || blueskyHandle.trim().length < 3 || blueskyAppPassword.trim().length < 10 || connectBluesky.isPending}
              className="bg-sky-500 hover:bg-sky-600"
            >
              {connectBluesky.isPending ? "Connecting..." : "Connect Bluesky"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              {deleteStep === 'confirm' && "Delete Account?"}
              {deleteStep === 'pin' && "Enter PIN"}
              {deleteStep === 'final' && "Final Confirmation"}
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 'confirm' && 
                "Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
              }
              {deleteStep === 'pin' && 
                "Please enter your 4-digit PIN to verify your identity."
              }
              {deleteStep === 'final' && 
                "This is your final warning. Clicking 'Delete Forever' will permanently delete your account and all associated data. This action cannot be undone."
              }
            </DialogDescription>
          </DialogHeader>
          
          {deleteStep === 'pin' && (
            <div className="space-y-4">
              <Label htmlFor="delete-pin">PIN</Label>
              <Input
                id="delete-pin"
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Enter 4-digit PIN"
                className="text-center text-lg tracking-widest bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
                data-testid="input-delete-pin"
              />
            </div>
          )}
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={isDeletingAccount || verifyPin.isPending}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStep}
              disabled={
                isDeletingAccount || 
                verifyPin.isPending || 
                (deleteStep === 'pin' && pin.length !== 4)
              }
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {isDeletingAccount && "Deleting..."}
              {!isDeletingAccount && deleteStep === 'confirm' && "Yes, Continue"}
              {!isDeletingAccount && deleteStep === 'pin' && (verifyPin.isPending ? "Verifying..." : "Verify PIN")}
              {!isDeletingAccount && deleteStep === 'final' && "Delete Forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}