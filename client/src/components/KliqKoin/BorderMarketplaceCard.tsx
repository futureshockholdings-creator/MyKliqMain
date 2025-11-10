import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Lock, Check, Coins } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="purchasable">Shop ({purchasableBorders.length})</TabsTrigger>
            <TabsTrigger value="streak">Streak Rewards ({streakBorders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="purchasable" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {purchasableBorders.map((border: any) => (
                <div
                  key={border.id}
                  className={`p-3 rounded-lg border-2 ${
                    border.owned 
                      ? "bg-green-500/10 border-green-400" 
                      : "bg-white/5 border-white/10"
                  }`}
                  data-testid={`border-${border.id}`}
                >
                  <div className="flex flex-col items-center text-center mb-2">
                    <div className="w-12 h-12 rounded-full mb-2 bg-gradient-to-br from-purple-500 to-pink-500" />
                    <h3 className="text-white font-medium text-sm">{border.name}</h3>
                    <p className="text-purple-300 text-xs">{border.description}</p>
                  </div>

                  {border.owned ? (
                    <Badge className="w-full bg-green-600">
                      <Check className="w-4 h-4 mr-1" />
                      Owned
                    </Badge>
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
              ))}
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
                    <div className="w-12 h-12 rounded-full mb-2 bg-gradient-to-br from-orange-500 to-red-500" />
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
