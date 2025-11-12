import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Lock, Check, Coins } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BorderedAvatar } from "@/components/BorderedAvatar";

interface BorderMarketplaceCardProps {
  bordersData: any[];
  walletData: any;
  isLoading: boolean;
  isPurchasing: boolean;
  onPurchase: (borderId: string) => void;
}

export function BorderMarketplaceCard({ 
  bordersData, 
  walletData, 
  isLoading, 
  isPurchasing,
  onPurchase 
}: BorderMarketplaceCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Loading Marketplace...
          </CardTitle>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <div className="animate-pulse text-purple-300">Loading borders...</div>
        </CardContent>
      </Card>
    );
  }

  const balance = walletData?.koins?.balance || 0;
  const streakBorders = bordersData.filter((b: any) => b.type === 'streak_reward');
  const rewardBorders = bordersData.filter((b: any) => b.type === 'reward');
  const purchasableBorders = bordersData.filter((b: any) => b.type === 'purchasable');

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Border Marketplace
        </CardTitle>
        <CardDescription className="text-purple-200">
          Purchase exclusive borders with your Kliq Koins
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="purchasable" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="purchasable">Shop ({purchasableBorders.length})</TabsTrigger>
            <TabsTrigger value="engagement">Engagement ({rewardBorders.length})</TabsTrigger>
            <TabsTrigger value="streak">Streaks ({streakBorders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="purchasable" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {purchasableBorders.map((border: any) => {
                const isMonthlyFree = border.cost === 0 && border.availableMonth;
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = border.availableMonth ? monthNames[border.availableMonth - 1] : null;
                
                return (
                  <div
                    key={border.id}
                    className={`p-3 rounded-lg border-2 ${
                      border.owned 
                        ? "bg-green-500/10 border-green-400" 
                        : isMonthlyFree
                        ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400 shadow-lg shadow-purple-500/20"
                        : "bg-white/5 border-white/10"
                    }`}
                    data-testid={`border-${border.id}`}
                  >
                    {isMonthlyFree && !border.owned && (
                      <Badge className="w-full mb-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                        FREE - {monthName} Only
                      </Badge>
                    )}
                    
                    <div className="flex flex-col items-center text-center mb-2">
                      <div className="mb-2">
                        <BorderedAvatar
                          src=""
                          fallback="★"
                          borderImageUrl={border.imageUrl}
                          borderName={border.name}
                          size="lg"
                        />
                      </div>
                      <h3 className="text-white font-medium text-sm">{border.name}</h3>
                      <p className="text-purple-300 text-xs">{border.description}</p>
                    </div>

                    {border.owned ? (
                      <Badge className="w-full bg-green-600">
                        <Check className="w-4 h-4 mr-1" />
                        Owned
                      </Badge>
                    ) : isMonthlyFree ? (
                      <Button
                        onClick={() => onPurchase(border.id)}
                        disabled={isPurchasing}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold"
                        data-testid={`button-purchase-${border.id}`}
                      >
                        {isPurchasing ? "Claiming..." : "Claim FREE"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => onPurchase(border.id)}
                        disabled={isPurchasing || balance < border.cost}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        data-testid={`button-purchase-${border.id}`}
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        {isPurchasing ? "Purchasing..." : `Buy (${border.cost} Koins)`}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {rewardBorders.map((border: any) => {
                const isUnlocked = border.unlocked || border.owned;
                const progress = border.progress || 0;
                const required = border.postsRequired || 100;
                const progressPercentage = Math.min((progress / required) * 100, 100);
                
                return (
                  <div
                    key={border.id}
                    className={`p-3 rounded-lg border-2 ${
                      isUnlocked 
                        ? "bg-green-500/10 border-green-400" 
                        : "bg-white/5 border-white/10"
                    }`}
                    data-testid={`engagement-border-${border.id}`}
                  >
                    <div className="flex flex-col items-center text-center mb-2">
                      <div className="mb-2 relative">
                        <BorderedAvatar
                          src=""
                          fallback="★"
                          borderImageUrl={border.imageUrl}
                          borderName={border.name}
                          size="lg"
                        />
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                            <Lock className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-white font-medium text-sm">{border.name}</h3>
                      <p className="text-purple-300 text-xs mb-2">{border.description}</p>
                      
                      {!isUnlocked && (
                        <div className="w-full space-y-1">
                          <div className="flex justify-between text-xs text-purple-200">
                            <span>{progress} posts</span>
                            <span>{required} posts</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      )}
                    </div>

                    {isUnlocked ? (
                      border.owned ? (
                        <Badge className="w-full bg-green-600">
                          <Check className="w-4 h-4 mr-1" />
                          Owned
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => onPurchase(border.id)}
                          disabled={isPurchasing}
                          className="w-full bg-green-600 hover:bg-green-700 font-bold"
                          data-testid={`button-claim-${border.id}`}
                        >
                          {isPurchasing ? "Claiming..." : "Claim Reward"}
                        </Button>
                      )
                    ) : (
                      <Badge className="w-full bg-gray-600">
                        <Lock className="w-4 h-4 mr-1" />
                        {required - progress} more posts
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="streak" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {streakBorders.map((border: any) => (
                <div
                  key={border.id}
                  className={`p-3 rounded-lg border-2 ${
                    border.owned 
                      ? "bg-green-500/10 border-green-400" 
                      : "bg-white/5 border-white/10"
                  }`}
                  data-testid={`streak-border-${border.id}`}
                >
                  <div className="flex flex-col items-center text-center mb-2">
                    <div className="mb-2">
                      <BorderedAvatar
                        src=""
                        fallback="★"
                        borderImageUrl={border.imageUrl}
                        borderName={border.name}
                        size="lg"
                      />
                    </div>
                    <h3 className="text-white font-medium text-sm">{border.name}</h3>
                    <p className="text-purple-300 text-xs">{border.description}</p>
                  </div>

                  {border.owned ? (
                    <Badge className="w-full bg-green-600">
                      <Check className="w-4 h-4 mr-1" />
                      Unlocked
                    </Badge>
                  ) : (
                    <Badge className="w-full bg-orange-600">
                      <Lock className="w-4 h-4 mr-1" />
                      Reach {border.tier}-day streak
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
