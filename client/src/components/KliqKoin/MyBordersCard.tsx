import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check } from "lucide-react";

interface MyBordersCardProps {
  myBordersData: any[];
  isLoading: boolean;
  isEquipping: boolean;
  onEquip: (borderId: string) => void;
}

export function MyBordersCard({ myBordersData, isLoading, isEquipping, onEquip }: MyBordersCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Loading Collection...
          </CardTitle>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <div className="animate-pulse text-purple-300">Loading your borders...</div>
        </CardContent>
      </Card>
    );
  }

  const equippedBorder = myBordersData.find((b: any) => b.isEquipped);

  return (
    <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Crown className="w-5 h-5" />
          My Border Collection
        </CardTitle>
        <CardDescription className="text-purple-200">
          Equip borders to customize your profile appearance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {myBordersData.length === 0 ? (
          <div className="text-center py-12">
            <Crown className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
            <p className="text-purple-200 text-lg font-medium">No borders yet</p>
            <p className="text-purple-300 text-sm mt-2">
              Earn borders by maintaining login streaks or purchase them from the marketplace!
            </p>
          </div>
        ) : (
          <>
            {equippedBorder && (
              <div className="p-4 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-lg border-2 border-purple-400">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <div className="flex-1">
                    <Badge className="mb-2 bg-purple-600">Currently Equipped</Badge>
                    <h3 className="text-white font-bold text-lg">{equippedBorder.border.name}</h3>
                    <p className="text-purple-200 text-sm">{equippedBorder.border.description}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {myBordersData.map((userBorder: any) => {
                const isEquipped = userBorder.isEquipped;
                return (
                  <div
                    key={userBorder.id}
                    className={`p-3 rounded-lg border-2 ${
                      isEquipped 
                        ? "bg-purple-500/20 border-purple-400" 
                        : "bg-white/5 border-white/10"
                    }`}
                    data-testid={`my-border-${userBorder.id}`}
                  >
                    <div className="flex flex-col items-center text-center mb-2">
                      <div className="w-12 h-12 rounded-full mb-2 bg-gradient-to-br from-purple-500 to-pink-500" />
                      <h3 className="text-white font-medium text-sm">{userBorder.border.name}</h3>
                      <p className="text-purple-300 text-xs">{userBorder.border.description}</p>
                      {userBorder.border.type === 'streak_reward' && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {userBorder.border.tier}-day streak
                        </Badge>
                      )}
                    </div>

                    {isEquipped ? (
                      <Badge className="w-full bg-purple-600">
                        <Check className="w-4 h-4 mr-1" />
                        Equipped
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => onEquip(userBorder.borderId)}
                        disabled={isEquipping}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        data-testid={`button-equip-${userBorder.id}`}
                      >
                        {isEquipping ? "Equipping..." : "Equip Border"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
