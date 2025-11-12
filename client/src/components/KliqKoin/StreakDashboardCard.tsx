import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Snowflake, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StreakDashboardCardProps {
  streakData: any;
  isLoading: boolean;
  onBuyFreeze: () => void;
  isBuyingFreeze: boolean;
}

const STREAK_TIERS = [
  { tier: 3, name: "Bronze", icon: "🥉", color: "text-orange-600" },
  { tier: 7, name: "Silver", icon: "🥈", color: "text-gray-400" },
  { tier: 30, name: "Gold", icon: "🥇", color: "text-yellow-500" },
  { tier: 90, name: "Diamond", icon: "💎", color: "text-blue-400" },
  { tier: 180, name: "Platinum", icon: "💿", color: "text-cyan-400" },
  { tier: 365, name: "Titanium", icon: "⚙️", color: "text-zinc-400" },
  { tier: 730, name: "Emerald", icon: "💚", color: "text-emerald-500" },
  { tier: 1000, name: "Legend", icon: "👑", color: "text-purple-500" },
];

export function StreakDashboardCard({ streakData, isLoading, onBuyFreeze, isBuyingFreeze }: StreakDashboardCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Loading Streak...
          </CardTitle>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <div className="animate-pulse text-purple-300">Loading your streak data...</div>
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;
  const streakFreezes = streakData?.streakFreezes || 0;

  const nextTier = STREAK_TIERS.find(t => t.tier > currentStreak);
  const progressToNext = nextTier 
    ? ((currentStreak % nextTier.tier) / nextTier.tier) * 100 
    : 100;

  return (
    <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          Daily Login Streak
        </CardTitle>
        <CardDescription className="text-purple-200">
          Keep your streak alive to unlock exclusive borders!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white/10 rounded-lg">
            <div className="text-4xl font-bold text-orange-400">{currentStreak}</div>
            <div className="text-purple-200 text-sm">Current Streak</div>
          </div>
          <div className="text-center p-4 bg-white/10 rounded-lg">
            <div className="text-4xl font-bold text-yellow-400">{longestStreak}</div>
            <div className="text-purple-200 text-sm">Longest Streak</div>
          </div>
        </div>

        {nextTier && (
          <div>
            <div className="flex justify-between text-sm text-purple-200 mb-2">
              <span>Next Tier: {nextTier.name} {nextTier.icon}</span>
              <span>{currentStreak} / {nextTier.tier} days</span>
            </div>
            <Progress value={progressToNext} className="h-3" />
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
          <div className="flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-white font-medium">Streak Freezes</div>
              <div className="text-purple-300 text-sm">Protect your streak for 1 day</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{streakFreezes} available</Badge>
            <Button
              size="sm"
              onClick={onBuyFreeze}
              disabled={isBuyingFreeze}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-use-freeze"
            >
              {isBuyingFreeze ? "Using..." : "Use (10 Koins)"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {STREAK_TIERS.map((tier) => (
            <div
              key={tier.tier}
              className={`text-center p-2 rounded-lg ${
                currentStreak >= tier.tier 
                  ? "bg-green-500/20 border border-green-400" 
                  : "bg-white/5 border border-white/10"
              }`}
            >
              <div className="text-2xl">{tier.icon}</div>
              <div className={`text-xs ${currentStreak >= tier.tier ? tier.color : "text-purple-300"}`}>
                {tier.name}
              </div>
              <div className="text-xs text-purple-400">{tier.tier}d</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
