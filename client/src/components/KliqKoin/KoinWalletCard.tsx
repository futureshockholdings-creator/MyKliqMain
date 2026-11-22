import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import kliqKoinIcon from "@assets/kliq-koin.png";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";

interface KoinWalletCardProps {
  walletData: any;
  isLoading: boolean;
}

export function KoinWalletCard({ walletData, isLoading }: KoinWalletCardProps) {
  useUiLanguage();
  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Coins className="w-5 h-5" />
            {uiText("Loading Wallet...")}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <div className="animate-pulse text-purple-300">{uiText("Loading your wallet...")}</div>
        </CardContent>
      </Card>
    );
  }

  const balance = parseFloat(walletData?.koins?.balance || 0);

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <img src={kliqKoinIcon} alt={uiText("Kliq Koin")} className="w-16 h-16" />
          {uiText("Kliq Koin Wallet")}
        </CardTitle>
        <CardDescription className="text-purple-200">
          {uiText("Earn Koins to use in Border Marketplace")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-white/10 rounded-lg">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={kliqKoinIcon} alt={uiText("Koin")} className="w-20 h-20" />
            <div className="text-4xl font-bold text-yellow-400">{balance.toFixed(2)}</div>
          </div>
          <div className="text-purple-200 text-sm">{uiText("Current Balance")}</div>
        </div>
      </CardContent>
    </Card>
  );
}
