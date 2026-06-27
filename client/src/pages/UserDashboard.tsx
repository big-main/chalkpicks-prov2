import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Plus, TrendingUp, TrendingDown, Target, DollarSign, Trophy, CheckCircle2, XCircle, Clock, Trash2, Crown, Download } from "lucide-react";
import { toast } from "sonner";
import DashboardMetrics from "@/components/DashboardMetrics";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const SPORTS = ["nfl", "nba", "mlb", "nhl", "soccer", "other"];
const BET_TYPES = ["moneyline", "spread", "over_under", "player_prop", "parlay", "other"];

function ExportCSVButton() {
  const { isAuthenticated } = useAuth();
  const { data: allBets, refetch, isFetching } = trpc.bets.list.useQuery(
    { result: "all", limit: 5000, offset: 0 },
    { enabled: false }
  );
  const handleExport = async () => {
    const result = await refetch();
    const bets = result.data?.bets ?? [];
    if (!bets.length) { toast.error("No bets to export"); return; }
    const header = ["Date","Description","Sport","Type","Odds","Stake","Payout","Result","Profit/Loss","Notes"];
    const rows = (bets as any[]).map((b: any) => [
      b.betDate ?? new Date(b.createdAt).toISOString().split("T")[0],
      `"${(b.description ?? "").replace(/"/g, '""')}"`,
      b.sportKey ?? "",
      b.betType ?? "",
      b.odds?.toString() ?? "",
      b.stake?.toString() ?? "",
      b.potentialPayout?.toString() ?? "",
      b.result ?? "pending",
      b.profit?.toString() ?? "0",
      `"${(b.notes ?? "").replace(/"/g, '""')}"`
    ]);
    const csv = [header.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chalkpicks-bets-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${bets.length} bets!`);
  };
  if (!isAuthenticated) return null;
  return (
    <Button variant="outline" className="h-9 text-sm font-bold" onClick={handleExport} disabled={isFetching}>
      <Download className="w-4 h-4 mr-1.5" />
      {isFetching ? "Exporting..." : "Export CSV"}
    </Button>
  );
}

export default function UserDashboard() {
  const { isAuthenticated, user, loading } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [filterResult, setFilterResult] = useState<"all" | "win" | "loss" | "push" | "pending">("all");

  const [form, setForm] = useState({
    sportKey: "nfl",
    description: "",
    betType: "moneyline" as any,
    stake: "",
    odds: "",
    notes: "",
    betDate: new Date().toISOString().split("T")[0],
  });

  const utils = trpc.useUtils();

  const { data: summary, isLoading: summaryLoading } = trpc.bets.summary.useQuery(undefined, { enabled: isAuthenticated });
  const { data: betsData, isLoading: betsLoading } = trpc.bets.list.useQuery(
    { result: filterResult, limit: 30 },
    { enabled: isAuthenticated }
  );
  const { data: mySubscription } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: isAuthenticated });

  const addBet = trpc.bets.add.useMutation({
    onSuccess: () => {
      utils.bets.list.invalidate();
      utils.bets.summary.invalidate();
      setAddOpen(false);
      setForm({ sportKey: "nfl", description: "", betType: "moneyline", stake: "", odds: "", notes: "", betDate: new Date().toISOString().split("T")[0] });
      toast.success("Bet added!");
    },
    onError: () => toast.error("Failed to add bet"),
  });

  const settleBet = trpc.bets.settle.useMutation({
    onSuccess: () => {
      utils.bets.list.invalidate();
      utils.bets.summary.invalidate();
      toast.success("Bet settled!");
    },
  });

  const deleteBet = trpc.bets.delete.useMutation({
    onSuccess: () => {
      utils.bets.list.invalidate();
      utils.bets.summary.invalidate();
      toast.success("Bet deleted");
    },
  });

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="skeleton w-8 h-8 rounded-full" />
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-3xl tracking-wider mb-3">YOUR DASHBOARD</h2>
          <p className="text-muted-foreground mb-6">Sign in to track your bets and view your analytics.</p>
          <a href="/login">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">Sign In</Button>
          </a>
        </div>
      </div>
    </div>
  );

  // Build profit chart data from bets
  const profitHistory = betsData?.bets
    ?.filter((b: any) => b.result !== "pending")
    .slice(0, 20)
    .reverse()
    .reduce((acc: any[], bet: any, i: number) => {
      const prev = acc[i - 1]?.cumProfit ?? 0;
      acc.push({ date: bet.betDate, cumProfit: Math.round((prev + Number(bet.profit ?? 0)) * 100) / 100 });
      return acc;
    }, []) ?? [];

  const pieData = summary ? [
    { name: "Wins", value: summary.wins, color: "oklch(0.72 0.19 162)" },
    { name: "Losses", value: summary.losses, color: "oklch(0.55 0.22 25)" },
    { name: "Pushes", value: summary.pushes, color: "oklch(0.55 0.02 260)" },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Edge Terminal Metrics */}
        {summary && (
          <div className="border-b border-border/50 bg-card/30">
            <div className="container py-6">
              <DashboardMetrics
                totalBets={summary.totalBets || 0}
                winningBets={summary.wins || 0}
                totalProfit={parseFloat(summary.totalProfit?.toString() || "0")}
                roi={summary.roi || 0}
                projectedPLYTD={summary.projectedPLYTD || 0}
              />
            </div>
          </div>
        )}
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30">
          <div className="container py-8">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <Badge className="mb-2 bg-primary/15 text-primary border-primary/30 text-xs">My Account</Badge>
                <h1 className="font-display text-4xl tracking-wider">
                  MY <span className="text-gold-gradient">DASHBOARD</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Track your bets, analyze performance, and optimize your strategy.</p>
              </div>
              <div className="flex items-center gap-3">
                {mySubscription?.isActive && (
                  <Badge className="badge-premium border-0 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> {mySubscription.tier?.charAt(0).toUpperCase()}{mySubscription.tier?.slice(1)} Plan
                  </Badge>
                )}
                {mySubscription?.accountBalance !== undefined && mySubscription.accountBalance > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Balance: ${(mySubscription.accountBalance / 100).toFixed(2)}
                  </Badge>
                )}
                <ExportCSVButton />
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-9">
                      <Plus className="w-4 h-4 mr-1.5" /> Add Bet
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Track a New Bet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Description *</Label>
                        <Input placeholder="e.g., Chiefs -7.5 vs Raiders" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="h-9 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Sport</Label>
                          <Select value={form.sportKey} onValueChange={(v) => setForm(f => ({ ...f, sportKey: v }))}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Bet Type</Label>
                          <Select value={form.betType} onValueChange={(v) => setForm(f => ({ ...f, betType: v }))}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>{BET_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Stake ($) *</Label>
                          <Input type="number" placeholder="100" value={form.stake} onChange={(e) => setForm(f => ({ ...f, stake: e.target.value }))} className="h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Odds (e.g. -110) *</Label>
                          <Input type="number" placeholder="-110" value={form.odds} onChange={(e) => setForm(f => ({ ...f, odds: e.target.value }))} className="h-9 text-sm" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
                        <Input type="date" value={form.betDate} onChange={(e) => setForm(f => ({ ...f, betDate: e.target.value }))} className="h-9 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Notes (optional)</Label>
                        <Input placeholder="Any notes..." value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="h-9 text-sm" />
                      </div>
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                        disabled={addBet.isPending || !form.description || !form.stake || !form.odds}
                        onClick={() => addBet.mutate({
                          sportKey: form.sportKey,
                          description: form.description,
                          betType: form.betType,
                          stake: Number(form.stake),
                          odds: Number(form.odds),
                          notes: form.notes || undefined,
                          betDate: form.betDate,
                        })}
                      >
                        {addBet.isPending ? "Adding..." : "Add Bet"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-6">
          {/* Summary Cards */}
          {summaryLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
            </div>
          ) : summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Win Rate", value: `${summary.winRate}%`, sub: `${summary.wins}W - ${summary.losses}L`, icon: Target, color: "text-accent" },
                { label: "ROI", value: `${summary.roi > 0 ? "+" : ""}${summary.roi}%`, sub: `$${summary.totalStaked} staked`, icon: TrendingUp, color: summary.roi >= 0 ? "text-accent" : "text-red-400" },
                { label: "Total Profit", value: `${summary.totalProfit >= 0 ? "+" : ""}$${summary.totalProfit}`, sub: `${summary.totalBets} total bets`, icon: DollarSign, color: summary.totalProfit >= 0 ? "text-accent" : "text-red-400" },
                { label: "Current Streak", value: summary.streak > 0 ? `W${summary.streak}` : summary.streak < 0 ? `L${Math.abs(summary.streak)}` : "-", sub: "Active streak", icon: summary.streak >= 0 ? TrendingUp : TrendingDown, color: summary.streak > 0 ? "text-accent" : summary.streak < 0 ? "text-red-400" : "text-muted-foreground" },
              ].map(s => (
                <Card key={s.label} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                      <span className="text-xs text-muted-foreground">{s.label}</span>
                    </div>
                    <div className={`font-display text-2xl ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Tabs defaultValue="bets">
            <TabsList className="mb-5 bg-secondary">
              <TabsTrigger value="bets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Bet History</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Analytics</TabsTrigger>
            </TabsList>

            {/* Bet History */}
            <TabsContent value="bets">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {(["all", "pending", "win", "loss", "push"] as const).map(r => (
                  <Button
                    key={r}
                    variant="outline"
                    size="sm"
                    className={`h-8 text-xs capitalize border-border ${filterResult === r ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"}`}
                    onClick={() => setFilterResult(r)}
                  >
                    {r === "all" ? "All Bets" : r}
                  </Button>
                ))}
              </div>

              {betsLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
              ) : betsData?.bets.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No bets yet. Add your first bet to start tracking!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {betsData?.bets.map((bet: any) => (
                    <Card key={bet.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              bet.result === "win" ? "bg-accent/20" :
                              bet.result === "loss" ? "bg-red-400/20" :
                              bet.result === "push" ? "bg-secondary" : "bg-yellow-400/20"
                            }`}>
                              {bet.result === "win" ? <CheckCircle2 className="w-4 h-4 text-accent" /> :
                               bet.result === "loss" ? <XCircle className="w-4 h-4 text-red-400" /> :
                               bet.result === "push" ? <Target className="w-4 h-4 text-muted-foreground" /> :
                               <Clock className="w-4 h-4 text-yellow-400" />}
                            </div>
                            <div>
                              <div className="font-medium text-foreground text-sm">{bet.description}</div>
                              <div className="text-xs text-muted-foreground">
                                {bet.sportKey.toUpperCase()} · {bet.betType.replace("_", " ")} · {bet.betDate} · Odds: {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className={`font-bold text-sm ${
                                bet.result === "win" ? "text-accent" :
                                bet.result === "loss" ? "text-red-400" : "text-foreground"
                              }`}>
                                {bet.result === "win" ? `+$${Number(bet.profit).toFixed(2)}` :
                                 bet.result === "loss" ? `-$${Number(bet.stake).toFixed(2)}` :
                                 `$${Number(bet.stake).toFixed(2)}`}
                              </div>
                              <div className="text-xs text-muted-foreground">Stake: ${Number(bet.stake).toFixed(2)}</div>
                            </div>
                            {bet.result === "pending" && (
                              <div className="flex gap-1">
                                <Button size="sm" className="h-7 text-xs bg-accent/20 text-accent hover:bg-accent/30 border-0" onClick={() => settleBet.mutate({ id: bet.id, result: "win" })}>W</Button>
                                <Button size="sm" className="h-7 text-xs bg-red-400/20 text-red-400 hover:bg-red-400/30 border-0" onClick={() => settleBet.mutate({ id: bet.id, result: "loss" })}>L</Button>
                                <Button size="sm" className="h-7 text-xs bg-secondary text-muted-foreground border-0" onClick={() => settleBet.mutate({ id: bet.id, result: "push" })}>P</Button>
                              </div>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400" onClick={() => deleteBet.mutate({ id: bet.id })}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics">
              <div className="grid lg:grid-cols-2 gap-6">
                {profitHistory.length > 0 ? (
                  <Card className="bg-card border-border lg:col-span-2">
                    <CardHeader className="pb-2"><CardTitle className="text-base">Cumulative Profit/Loss</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={profitHistory}>
                          <defs>
                            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="oklch(0.72 0.19 162)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="oklch(0.72 0.19 162)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                          <XAxis dataKey="date" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} />
                          <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                          <Tooltip contentStyle={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.015 260)", borderRadius: "8px" }} formatter={(v: number) => [`$${v}`, "Profit"]} />
                          <Area type="monotone" dataKey="cumProfit" stroke="oklch(0.72 0.19 162)" strokeWidth={2} fill="url(#profitGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ) : null}

                {pieData.length > 0 && (
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2"><CardTitle className="text-base">Win/Loss Breakdown</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                            {pieData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: "oklch(0.12 0.015 260)", border: "1px solid oklch(0.22 0.015 260)", borderRadius: "8px" }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {!mySubscription?.isActive && (
                  <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                    <CardContent className="p-6 text-center">
                      <Crown className="w-8 h-8 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold text-foreground mb-2">Unlock Advanced Analytics</h3>
                      <p className="text-xs text-muted-foreground mb-4">Get detailed breakdowns by sport, bet type, ROI trends, and more with a premium subscription.</p>
                      <Link href="/pricing">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm">Upgrade Now</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
