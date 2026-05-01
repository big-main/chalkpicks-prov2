import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Paywall } from "@/components/Paywall";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { BarChart3, Play, Lock, TrendingUp, Target, DollarSign, Trophy } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import { toast } from "sonner";

const SPORTS = [
  { key: "all", name: "All Sports" },
  { key: "nfl", name: "NFL" },
  { key: "nba", name: "NBA" },
  { key: "mlb", name: "MLB" },
  { key: "nhl", name: "NHL" },
];

const PICK_TYPES = [
  { key: "all", name: "All Types" },
  { key: "moneyline", name: "Moneyline" },
  { key: "spread", name: "Spread" },
  { key: "over_under", name: "Over/Under" },
  { key: "player_prop", name: "Player Props" },
];

export default function Backtesting() {
  const { isAuthenticated, user } = useAuth();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery();
  const [sport, setSport] = useState("all");
  const [pickType, setPickType] = useState("all");
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [minConfidence, setMinConfidence] = useState([70]);
  const [bankroll, setBankroll] = useState([1000]);
  const [stakePerBet, setStakePerBet] = useState([100]);
  const [results, setResults] = useState<any>(null);

  const hasProAccess = subscription?.isActive && (subscription?.tier === 'monthly' || subscription?.tier === 'yearly');
  const isPremium = isAuthenticated && user?.subscriptionTier !== "free";

  // Demo data for non-premium users
  const { data: demoData } = trpc.backtest.demo.useQuery({
    sportKey: "nfl",
    minConfidence: 70,
  }, { enabled: !hasProAccess });

  if (!hasProAccess) {
    return <Paywall tier="monthly" title="Backtesting Engine" description="Test your strategies against historical data and optimize your approach" />;
  }

  const { mutateAsync: runBacktestMutation } = trpc.backtest.run.useMutation();

  const runBacktest = async () => {
    try {
      const result = await runBacktestMutation({
        name: `${sport} ${pickType} Backtest`,
        sportKey: sport === "all" ? undefined : sport,
        pickType: pickType === "all" ? undefined : pickType,
        minConfidence: minConfidence[0],
        dateFrom,
        dateTo,
        initialBankroll: bankroll[0],
        stakePerBet: stakePerBet[0],
      });
      setResults(result);
      toast.success("Backtest completed!");
    } catch (error) {
      toast.error("Backtest failed");
      console.error(error);
    }
  };

  const displayData = results || demoData;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 pb-16">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Backtesting Engine</h1>
            </div>
            <p className="text-muted-foreground">Test your strategies against historical data</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Controls */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Sport</Label>
                  <Select value={sport} onValueChange={setSport}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORTS.map(s => (
                        <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Pick Type</Label>
                  <Select value={pickType} onValueChange={setPickType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PICK_TYPES.map(t => (
                        <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>From Date</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>

                <div>
                  <Label>To Date</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>

                <div>
                  <Label>Min Confidence: {minConfidence[0]}%</Label>
                  <Slider value={minConfidence} onValueChange={setMinConfidence} min={0} max={100} step={5} />
                </div>

                <div>
                  <Label>Bankroll: ${bankroll[0]}</Label>
                  <Slider value={bankroll} onValueChange={setBankroll} min={100} max={10000} step={100} />
                </div>

                <div>
                  <Label>Stake Per Bet: ${stakePerBet[0]}</Label>
                  <Slider value={stakePerBet} onValueChange={setStakePerBet} min={10} max={500} step={10} />
                </div>

                <Button onClick={runBacktest} className="w-full" size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Run Backtest
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-3 space-y-6">
              {displayData && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Total Picks</div>
                        <div className="text-3xl font-bold">{displayData.totalPicks}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                        <div className="text-3xl font-bold text-green-500">{(displayData.winRate * 100).toFixed(1)}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">ROI</div>
                        <div className={`text-3xl font-bold ${displayData.roi > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {displayData.roi.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Profit</div>
                        <div className={`text-3xl font-bold ${displayData.profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${displayData.profit.toFixed(0)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chart */}
                  {displayData.results && displayData.results.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Cumulative Profit</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={displayData.results}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="cumulativeProfit" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
