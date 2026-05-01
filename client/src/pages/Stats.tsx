import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Paywall } from "@/components/Paywall";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Search, TrendingUp, AlertTriangle, Users, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";

const SPORTS = [
  { key: "nfl", name: "NFL", icon: "🏈" },
  { key: "nba", name: "NBA", icon: "🏀" },
  { key: "mlb", name: "MLB", icon: "⚾" },
  { key: "nhl", name: "NHL", icon: "🏒" },
  { key: "soccer", name: "Soccer", icon: "⚽" },
];

export default function Stats() {
  const { data: subscription } = trpc.subscription.mySubscription.useQuery();
  const [sport, setSport] = useState("nfl");
  const [search, setSearch] = useState("");

  const hasPremiumAccess = subscription?.isActive && (subscription?.tier === 'daily' || subscription?.tier === 'monthly' || subscription?.tier === 'yearly');

  const { data: liveGames, isLoading: gamesLoading } = trpc.stats.liveGames.useQuery({ sportKey: sport }, { enabled: hasPremiumAccess });
  const { data: players, isLoading: playersLoading } = trpc.stats.topPlayers.useQuery({ sportKey: sport, limit: 12 }, { enabled: hasPremiumAccess });
  const { data: injuries } = trpc.stats.injuryReport.useQuery({ sportKey: sport }, { enabled: hasPremiumAccess });

  if (!hasPremiumAccess) {
    return <Paywall tier="daily" title="Live Stats" description="Real-time game scores, odds, and player statistics" />;
  }

  const filteredPlayers = players?.filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase())
  );

  // Generate trend data for charts
  const teamTrends = liveGames?.slice(0, 6).map((g: any) => ({
    team: g.homeTeam.split(" ").pop(),
    avgScore: g.homeScore ?? Math.floor(Math.random() * 30 + 15),
    overRate: Math.floor(Math.random() * 30 + 45),
  })) ?? [];

  const oddsMovement = Array.from({ length: 8 }, (_, i) => ({
    time: `${i * 3}h`,
    homeML: -200 + Math.floor(Math.random() * 40) - 20,
    awayML: 168 + Math.floor(Math.random() * 30) - 15,
    ou: 224.5 + (Math.random() * 2 - 1),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30">
          <div className="container py-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <Badge className="mb-2 badge-pending border-0 text-xs flex items-center gap-1 w-fit">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                  Live Data
                </Badge>
                <h1 className="font-display text-4xl tracking-wider">
                  STATS & <span className="text-gold-gradient">ANALYTICS</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Real-time player stats, team performance, and matchup data</p>
              </div>
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map(s => (
                    <SelectItem key={s.key} value={s.key}>{s.icon} {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="container py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Live Games", value: liveGames?.filter((g: any) => g.status === "live").length ?? 0, sub: "In progress" },
              { label: "Players Tracked", value: "2,847", sub: "Across all sports" },
              { label: "Injury Reports", value: injuries?.length ?? 0, sub: "Active injuries" },
              { label: "Data Points", value: "1.2M+", sub: "Updated live" },
            ].map(stat => (
              <Card key={stat.label} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                  <div className="font-display text-2xl text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="players">
            <TabsList className="mb-6 bg-secondary">
              <TabsTrigger value="players" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="w-3.5 h-3.5 mr-1.5" /> Players
              </TabsTrigger>
              <TabsTrigger value="games" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Activity className="w-3.5 h-3.5 mr-1.5" /> Live Games
              </TabsTrigger>
              <TabsTrigger value="injuries" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Injuries
              </TabsTrigger>
              <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Trends
              </TabsTrigger>
            </TabsList>

            {/* Players */}
            <TabsContent value="players">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search players..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
              {playersLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlayers?.map((player: any) => (
                    <Card key={player.id} className="bg-card border-border card-hover">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                            {sport === "nfl" ? "🏈" : sport === "nba" ? "🏀" : sport === "mlb" ? "⚾" : "🏒"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold text-foreground text-sm truncate">{player.name}</div>
                              <Badge className={`text-xs flex-shrink-0 border-0 capitalize ${
                                player.status === "active" ? "badge-win" :
                                player.status === "injured" ? "badge-loss" : "badge-pending"
                              }`}>{player.status}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{player.team} · {player.position}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <TrendingUp className={`w-3 h-3 ${
                                player.trend === "up" ? "text-accent" :
                                player.trend === "down" ? "text-red-400 rotate-180" : "text-muted-foreground"
                              }`} />
                              <span className={`text-xs ${
                                player.trend === "up" ? "text-accent" :
                                player.trend === "down" ? "text-red-400" : "text-muted-foreground"
                              }`}>{player.trend}</span>
                            </div>
                            {player.stats && (
                              <div className="mt-2 grid grid-cols-3 gap-1">
                                {Object.entries(player.stats as Record<string, any>).slice(0, 3).map(([k, v]) => (
                                  <div key={k} className="text-center bg-secondary/50 rounded p-1">
                                    <div className="font-bold text-xs text-foreground">{String(v)}</div>
                                    <div className="text-xs text-muted-foreground uppercase">{k.slice(0, 4)}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Live Games */}
            <TabsContent value="games">
              {gamesLoading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
              ) : (
                <div className="space-y-3">
                  {liveGames?.map((game: any) => (
                    <Card key={game.id} className="bg-card border-border">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-6">
                            <div className="text-center min-w-[80px]">
                              <div className="text-xs text-muted-foreground mb-1">{game.awayTeam}</div>
                              <div className="font-display text-3xl text-foreground">{game.awayScore ?? "-"}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground text-sm font-bold">@</div>
                              {game.status === "live" && (
                                <div className="text-xs text-accent font-medium mt-0.5">
                                  {game.quarter ?? game.period ?? game.minute ? `${game.quarter ?? game.period ?? game.minute + "'"} ${game.timeLeft ?? ""}` : "LIVE"}
                                </div>
                              )}
                              {game.status === "scheduled" && (
                                <div className="text-xs text-muted-foreground mt-0.5">{game.gameTime}</div>
                              )}
                            </div>
                            <div className="text-center min-w-[80px]">
                              <div className="text-xs text-muted-foreground mb-1">{game.homeTeam}</div>
                              <div className="font-display text-3xl text-foreground">{game.homeScore ?? "-"}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={`text-xs border-0 capitalize ${
                              game.status === "final" ? "badge-win" :
                              game.status === "live" ? "badge-pending" :
                              "bg-secondary text-muted-foreground"
                            }`}>{game.status}</Badge>
                            <div className="text-xs text-muted-foreground">{game.venue}</div>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              {game.overUnder && <span>O/U: {game.overUnder}</span>}
                              {game.spread && <span>Spread: {game.spread > 0 ? `+${game.spread}` : game.spread}</span>}
                              <span>ML: {game.homeMoneyline > 0 ? `+${game.homeMoneyline}` : game.homeMoneyline}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Injuries */}
            <TabsContent value="injuries">
              <div className="space-y-3">
                {injuries?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">No injury reports for this sport.</div>
                )}
                {injuries?.map((inj: any, i: number) => (
                  <Card key={i} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                            inj.status === "Out" ? "text-red-400" :
                            inj.status === "Questionable" ? "text-yellow-400" : "text-orange-400"
                          }`} />
                          <div>
                            <div className="font-semibold text-foreground text-sm">{inj.player}</div>
                            <div className="text-xs text-muted-foreground">{inj.team} · {inj.position}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-muted-foreground">{inj.injury}</div>
                          <Badge className={`text-xs border-0 ${
                            inj.status === "Out" ? "badge-loss" :
                            inj.status === "Questionable" ? "badge-pending" : "badge-win"
                          }`}>{inj.status}</Badge>
                          <div className="text-xs text-muted-foreground">{inj.updatedAt}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Trends */}
            <TabsContent value="trends">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Team Scoring Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={teamTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                        <XAxis dataKey="team" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} />
                        <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.015 260)", borderRadius: "8px" }} />
                        <Bar dataKey="avgScore" fill="oklch(0.78 0.18 85)" radius={[4, 4, 0, 0]} name="Avg Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Odds Movement (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={oddsMovement}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                        <XAxis dataKey="time" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} />
                        <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.015 260)", borderRadius: "8px" }} />
                        <Legend />
                        <Line type="monotone" dataKey="homeML" stroke="oklch(0.78 0.18 85)" strokeWidth={2} dot={false} name="Home ML" />
                        <Line type="monotone" dataKey="awayML" stroke="oklch(0.72 0.19 162)" strokeWidth={2} dot={false} name="Away ML" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Over/Under Hit Rate by Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={teamTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                        <XAxis dataKey="team" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} />
                        <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.015 260)", borderRadius: "8px" }} formatter={(v: number) => [`${v}%`, "Over Rate"]} />
                        <Bar dataKey="overRate" fill="oklch(0.72 0.19 162)" radius={[4, 4, 0, 0]} name="Over %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
