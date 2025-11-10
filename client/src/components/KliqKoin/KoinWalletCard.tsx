import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react";
import kliqKoinIcon from "@assets/kliq-koin.png";

interface KoinWalletCardProps {
  walletData: any;
  isLoading: boolean;
}

export function KoinWalletCard({ walletData, isLoading }: KoinWalletCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Loading Wallet...
          </CardTitle>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <div className="animate-pulse text-purple-300">Loading your wallet...</div>
        </CardContent>
      </Card>
    );
  }

  const balance = walletData?.koins?.balance || 0;
  const totalEarned = walletData?.koins?.totalEarned || 0;
  const transactions = walletData?.transactions || [];

  return (
    <Card className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <img src={kliqKoinIcon} alt="Kliq Koin" className="w-16 h-16" />
          Kliq Koin Wallet
        </CardTitle>
        <CardDescription className="text-purple-200">
          Earn Koins through daily logins and use them to unlock borders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white/10 rounded-lg">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img src={kliqKoinIcon} alt="Koin" className="w-20 h-20" />
              <div className="text-4xl font-bold text-yellow-400">{balance}</div>
            </div>
            <div className="text-purple-200 text-sm">Current Balance</div>
          </div>
          <div className="text-center p-4 bg-white/10 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div className="text-4xl font-bold text-green-400">{totalEarned}</div>
            </div>
            <div className="text-purple-200 text-sm">Total Earned</div>
          </div>
        </div>

        <div>
          <h3 className="text-white font-medium mb-2">Recent Transactions</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-purple-300">
                No transactions yet. Login daily to earn Koins!
              </div>
            ) : (
              transactions.slice(0, 10).map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  data-testid={`transaction-${tx.id}`}
                >
                  <div className="flex items-center gap-3">
                    {tx.type === 'earned' ? (
                      <ArrowDownRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <div className="text-white font-medium">
                        {tx.source.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </div>
                      <div className="text-purple-300 text-xs">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </div>
                    <div className="text-purple-400 text-xs">
                      Balance: {tx.balanceAfter}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
