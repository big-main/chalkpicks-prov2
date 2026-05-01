import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Paywall } from "@/components/Paywall";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, TrendingUp, TrendingDown, Users, Target, DollarSign, Crown } from "lucide-react";

export default function Leaderboard() {
  const { isAuthenticated, user } = useAuth();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery();
  const [period, setPeriod] = useState<"all" | "monthly" | "weekly">("all");

  const hasPremiumAccess = subscription?.isActive && (subscription?.tier === 'daily' || subscription?.tier === 'monthly' || subscription?.tier === 'yearly');

  const { data: entries, isLoading } = trpc.leaderboard.list.useQuery({ period, limit: 25 }, { enabled: hasPremiumAccess });
  const { data: stats } = trpc.leaderboard.stats.useQuery(undefined, { enabled: hasPremiumAccess });
  const { data: myRank } = trpc.leaderboard.myRank.useQuery(undefined, { enabled: isAuthenticated && hasPremiumAccess });

  if (!hasPremiumAccess) {
    return <Paywall tier="daily" title="Leaderboard" description="Track top bettors and compete on the global leaderboard" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30">
          <div className="container py-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <Badge className="mb-2 bg-yellow-400/15 text-yellow-400 border-yellow-400/30 text-xs flex items-center gap-1 w-fit">
                  <Crown className="w-3 h-3" /> Rankings
                </Badge>
                <h1 className="font-display text-4xl tracking-wider">
                  LEADER<span className="text-gold-gradient">BOARD</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Top bettors ranked by ROI and win rate. Compete, track, and climb.</p>
              </div>
              <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="weekly">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="container py-6">
          {/* Community Stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              {[
                { label: "Total Bettors", value: stats.totalBettors.toLocaleString(), icon: Users },
                { label: "Avg Win Rate", value: `${stats.avgWinRate}%`, icon: Target },
                { label: "Avg ROI", value: `+${stats.avgRoi}%`, icon: TrendingUp },
                { label: "Top ROI", value: `+${stats.topROI}%`, icon: Crown },
                { label: "Picks Tracked", value: `${(stats.totalPicksTracked / 1000).toFixed(0)}K+`, icon: DollarSign },
              ].map(s => (
                <Card key={s.label} className="bg-card border-border">
                  <CardContent className="p-3 flex items-center gap-2">
                    <s.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-display text-lg text-foreground leading-none">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* My Rank */}
          {isAuthenticated && myRank && (
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 mb-5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-display text-lg text-primary">
                      #{myRank.rank}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{myRank.displayName ?? user?.name ?? "You"}</div>
                      <div className="text-xs text-muted-foreground">Your current ranking</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-accent">{myRank.winRate}%</div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary">+{myRank.roi}%</div>
                      <div className="text-xs text-muted-foreground">ROI</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{myRank.totalBets}</div>
                      <div className="text-xs text-muted-foreground">Bets</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top 3 Podium */}
          {entries && entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[entries[1], entries[0], entries[2]].map((entry: any, podiumIndex: number) => {
                const actualRank = podiumIndex === 0 ? 2 : podiumIndex === 1 ? 1 : 3;
                const heights = ["h-28", "h-36", "h-24"];
                const colors = ["text-gray-300", "text-yellow-400", "text-amber-600"];
                const bgColors = ["bg-gray-400/10", "bg-yellow-400/10", "bg-amber-600/10"];
                const borderColors = ["border-gray-400/30", "border-yellow-400/30", "border-amber-600/30"];
                return (
                  <Card key={entry.rank} className={`${bgColors[podiumIndex]} ${borderColors[podiumIndex]} border`}>
                    <CardContent className={`p-4 flex flex-col items-center justify-end ${heights[podiumIndex]}`}>
                      <div className={`font-display text-2xl ${colors[podiumIndex]} mb-1`}>#{actualRank}</div>
                      <div className="font-semibold text-foreground text-sm text-center truncate w-full text-center">{entry.displayName}</div>
                      <div className={`text-xs font-bold ${colors[podiumIndex]}`}>+{entry.roi}% ROI</div>
                      <div className="text-xs text-muted-foreground">{entry.winRate}% WR</div>
                      {entry.badge && <div className="text-xs mt-1">{entry.badge}</div>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Full Rankings Table */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" /> Full Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-3 text-xs text-muted-foreground font-medium">Rank</th>
                        <th className="text-left p-3 text-xs text-muted-foreground font-medium">Bettor</th>
                        <th className="text-right p-3 text-xs text-muted-foreground font-medium">W-L</th>
                        <th className="text-right p-3 text-xs text-muted-foreground font-medium">Win %</th>
                        <th className="text-right p-3 text-xs text-muted-foreground font-medium">ROI</th>
                        <th className="text-right p-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Profit</th>
                        <th className="text-right p-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries?.map((entry: any) => (
                        <tr key={entry.rank} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                          <td className="p-3">
                            <div className={`font-display text-base ${
                              entry.rank === 1 ? "text-yellow-400" :
                              entry.rank === 2 ? "text-gray-300" :
                              entry.rank === 3 ? "text-amber-600" : "text-muted-foreground"
                            }`}>
                              {entry.rank <= 3 ? (entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉") : `#${entry.rank}`}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
                                {entry.displayName?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <div className="font-medium text-foreground text-sm">{entry.displayName}</div>
                                {entry.badge && <div className="text-xs text-muted-foreground">{entry.badge}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right text-sm text-foreground">{entry.wins}-{entry.losses}</td>
                          <td className="p-3 text-right">
                            <span className={`text-sm font-bold ${entry.winRate >= 70 ? "text-accent" : entry.winRate >= 55 ? "text-yellow-400" : "text-foreground"}`}>
                              {entry.winRate}%
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className={`text-sm font-bold ${entry.roi > 0 ? "text-accent" : "text-red-400"}`}>
                              {entry.roi > 0 ? "+" : ""}{entry.roi}%
                            </span>
                          </td>
                          <td className="p-3 text-right text-sm text-foreground hidden sm:table-cell">
                            ${entry.totalProfit?.toLocaleString() ?? "0"}
                          </td>
                          <td className="p-3 text-right hidden md:table-cell">
                            <div className="flex items-center justify-end gap-1">
                              {entry.streak > 0 ? (
                                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                              ) : entry.streak < 0 ? (
                                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                              ) : null}
                              <span className={`text-xs font-medium ${
                                entry.streak > 0 ? "text-accent" : entry.streak < 0 ? "text-red-400" : "text-muted-foreground"
                              }`}>
                                {entry.streak > 0 ? `W${entry.streak}` : entry.streak < 0 ? `L${Math.abs(entry.streak)}` : "-"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
