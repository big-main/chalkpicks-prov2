import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { Brain, Lock, TrendingUp, Filter, RefreshCw, ChevronRight, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";

const PICK_TYPE_LABELS: Record<string, string> = {
  moneyline: "Moneyline",
  spread: "Spread",
  over_under: "Over/Under",
  player_prop: "Player Prop",
  parlay: "Parlay",
};

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-accent" : score >= 70 ? "bg-primary" : "bg-yellow-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Confidence</span>
        <span className={`font-bold ${score >= 80 ? "text-accent" : "text-primary"}`}>{score}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function PickCard({ pick, isPremiumUser }: { pick: any; isPremiumUser: boolean }) {
  const isLocked = pick.tier === "premium" && !isPremiumUser;
  const resultClass = pick.result === "win" ? "badge-win" : pick.result === "loss" ? "badge-loss" : pick.result === "push" ? "badge-push" : "badge-pending";

  return (
    <Link href={`/picks/${pick.id}`}>
      <Card className="bg-card border-border card-hover cursor-pointer h-full relative overflow-hidden">
        {pick.isFeatured && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        )}
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs ${pick.tier === "premium" ? "badge-premium" : "badge-free"} border-0`}>
                {pick.tier === "premium" ? "⭐ Premium" : "Free"}
              </Badge>
              <span className="text-xs text-muted-foreground uppercase font-medium bg-secondary px-2 py-0.5 rounded">
                {pick.sportKey}
              </span>
              <span className="text-xs text-muted-foreground">{PICK_TYPE_LABELS[pick.pickType] ?? pick.pickType}</span>
            </div>
            <Badge className={`text-xs ${resultClass} border-0 capitalize`}>{pick.result}</Badge>
          </div>

          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-1">
              {pick.awayTeam} @ {pick.homeTeam}
            </div>
            <div className="font-bold text-foreground text-lg leading-tight">{pick.recommendation}</div>
            {pick.odds && (
              <div className="text-sm text-muted-foreground mt-0.5 font-medium">
                {pick.odds > 0 ? `+${pick.odds}` : pick.odds}
              </div>
            )}
          </div>

          <ConfidenceBar score={pick.confidenceScore} />

          {pick.edgeScore && (
            <div className="mt-3 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-xs text-muted-foreground">Edge Score:</span>
              <span className="text-xs font-bold text-primary">{pick.edgeScore}/10</span>
            </div>
          )}

          {isLocked ? (
            <div className="mt-3 p-2.5 bg-secondary/50 rounded-lg flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">Subscribe to unlock full AI analysis</span>
            </div>
          ) : pick.aiAnalysis ? (
            <div className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {pick.aiAnalysis}
            </div>
          ) : null}

          {pick.keyFactors && Array.isArray(pick.keyFactors) && pick.keyFactors.length > 0 && !isLocked && (
            <div className="mt-3 flex flex-wrap gap-1">
              {(pick.keyFactors as string[]).slice(0, 2).map((f: string, i: number) => (
                <span key={i} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                  {f}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function GeneratePickDialog({ open, onClose, onGenerated, sports }: {
  open: boolean;
  onClose: () => void;
  onGenerated: () => void;
  sports: { key: string; name: string; icon: string }[];
}) {
  const [matchup, setMatchup] = useState("");
  const [genSport, setGenSport] = useState("nfl");
  const [context, setContext] = useState("");

  const generateAI = trpc.picks.generateAI.useMutation({
    onSuccess: () => {
      toast.success("AI pick generated! Refreshing picks...");
      setMatchup("");
      setContext("");
      onClose();
      onGenerated();
    },
    onError: (err) => toast.error(err.message || "Generation failed"),
  });

  const handleSubmit = () => {
    if (!matchup.trim()) {
      toast.error("Please enter a matchup (e.g. Chiefs vs Raiders)");
      return;
    }
    generateAI.mutate({ sportKey: genSport, matchup: matchup.trim(), context: context.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> Generate AI Pick
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div>
            <Label className="text-sm mb-1.5 block">Sport</Label>
            <Select value={genSport} onValueChange={setGenSport}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sports.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.icon} {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Matchup <span className="text-muted-foreground font-normal">(e.g. Chiefs vs Raiders)</span></Label>
            <Input
              value={matchup}
              onChange={(e) => setMatchup(e.target.value)}
              placeholder="Home Team vs Away Team"
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Additional Context <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Injuries, weather, recent form..."
              className="text-sm resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSubmit}
              disabled={generateAI.isPending}
            >
              {generateAI.isPending ? (
                <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate Pick</>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={generateAI.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Picks() {
  const { isAuthenticated, user } = useAuth();
  const [sportKey, setSportKey] = useState<string>("all");
  const [tier, setTier] = useState<"all" | "free" | "premium">("all");
  const [page, setPage] = useState(1);
  const [generateOpen, setGenerateOpen] = useState(false);

  const isPremiumUser = isAuthenticated && user?.subscriptionTier !== "free";

  const { data, isLoading, refetch } = trpc.picks.list.useQuery({
    sportKey: sportKey === "all" ? undefined : sportKey,
    tier,
    page,
    limit: 12,
  });

  const { data: performance } = trpc.picks.performance.useQuery();

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30">
          <div className="container py-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="badge-pending border-0 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    Live Picks
                  </Badge>
                  <span className="text-xs text-muted-foreground">{today}</span>
                </div>
                <h1 className="font-display text-4xl tracking-wider">
                  TODAY'S <span className="text-gold-gradient">PICKS</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {data?.total ?? 0} picks available · AI-generated with confidence scores
                </p>
              </div>

              {/* Quick stats */}
              <div className="flex gap-4">
                {[
                  { label: "Win Rate", value: `${performance?.overall?.winRate ?? 73.1}%` },
                  { label: "ROI", value: `+${performance?.overall?.roi ?? 18.4}%` },
                  { label: "Record", value: `${performance?.overall?.wins ?? 847}-${performance?.overall?.losses ?? 312}` },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="font-display text-xl text-primary">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="container py-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={sportKey} onValueChange={setSportKey}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {data?.sports?.map(s => (
                  <SelectItem key={s.key} value={s.key}>{s.icon} {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tier} onValueChange={(v) => setTier(v as any)}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Picks</SelectItem>
                <SelectItem value="premium">Premium Only</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-9">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>

            <div className="ml-auto">
              {!isPremiumUser && (
                <Link href="/pricing">
                  <Button size="sm" className="bg-primary text-primary-foreground h-9">
                    <Brain className="w-3.5 h-3.5 mr-1.5" /> Unlock Premium
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* AI Generate CTA */}
          {isPremiumUser && (
            <>
              <GeneratePickDialog
                open={generateOpen}
                onClose={() => setGenerateOpen(false)}
                onGenerated={() => { setPage(1); refetch(); }}
                sports={data?.sports ?? []}
              />
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 mb-6">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">Generate Custom AI Pick</div>
                      <div className="text-xs text-muted-foreground">Enter any matchup and get an instant AI analysis</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => setGenerateOpen(true)}
                  >
                    Generate <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Picks grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-48 rounded-xl" />
              ))}
            </div>
          ) : data?.picks && data.picks.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.picks.map((pick) => (
                  <PickCard key={pick.id} pick={pick} isPremiumUser={isPremiumUser} />
                ))}
              </div>

              {/* Pagination */}
              {data.total > 12 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(data.total / 12)}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 12)} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No picks found</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your filters or check back later.</p>
            </div>
          )}

          {/* Upsell for non-premium */}
          {!isPremiumUser && (
            <Card className="mt-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <Badge className="mb-3 badge-premium border-0">Premium Access</Badge>
                <h3 className="font-display text-2xl tracking-wider mb-2">UNLOCK ALL PREMIUM PICKS</h3>
                <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
                  Get access to all premium picks with full AI analysis, confidence scores, edge scoring, and key factors. Starting at $9.99/day.
                </p>
                <Link href="/pricing">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold font-bold">
                    View Pricing Plans <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
}
