import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
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
  const isFreeUser = !isPremiumUser;
  const resultClass = pick.result === "win" ? "badge-win" : pick.result === "loss" ? "badge-loss" : pick.result === "push" ? "badge-push" : "badge-pending";

  // Free users see only title and upgrade CTA
  if (isFreeUser) {
    return (
      <Card className="bg-card border-border h-full relative overflow-hidden">
        <CardContent className="p-5">
          <div className="space-y-4">
            <div className="font-bold text-foreground text-lg leading-tight">{pick.recommendation}</div>
            <div className="text-xs text-muted-foreground">
              {pick.awayTeam} @ {pick.homeTeam}
            </div>
            <div className="p-3 bg-primary/20 border border-primary/40 rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs text-primary font-medium">Upgrade to see odds, confidence & analysis</span>
            </div>
            <button
              onClick={() => window.location.href = "/pricing"}
              className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Premium users see full details
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

          {pick.aiAnalysis ? (
            <div className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {pick.aiAnalysis}
            </div>
          ) : null}

          {pick.keyFactors && Array.isArray(pick.keyFactors) && pick.keyFactors.length > 0 && (
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
            <Label className="text-xs font-medium text-muted-foreground">Sport</Label>
            <Select value={genSport} onValueChange={setGenSport}>
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sports.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Matchup</Label>
            <Input
              placeholder="e.g. Chiefs vs Raiders"
              value={matchup}
              onChange={(e) => setMatchup(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Context (optional)</Label>
            <Textarea
              placeholder="Any additional context..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="mt-1 text-xs min-h-20"
            />
          </div>
          <Button onClick={handleSubmit} disabled={generateAI.isPending} className="w-full h-8 text-xs">
            {generateAI.isPending ? "Generating..." : "Generate Pick"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Picks() {
  const { user } = useAuth();
  const [sport, setSport] = useState("all");
  const [tier, setTier] = useState("all");
  const [generateOpen, setGenerateOpen] = useState(false);

  const { data: picksData, isLoading, refetch } = trpc.picks.list.useQuery({ sportKey: sport === "all" ? undefined : sport, tier: tier === "all" ? undefined : (tier as "free" | "premium" | "all") });
  const { data: sports } = trpc.picks.sports.useQuery();

  const isPremiumUser = user?.subscriptionTier && user.subscriptionTier !== "free";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "2rem", textTransform: "uppercase", color: "white" }}>
              AI <span style={{ background: "linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Picks</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Confidence-scored predictions across all sports</p>
          </div>
          {user?.role === "admin" && (
            <Button onClick={() => setGenerateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
              <Brain className="w-4 h-4" /> Generate Pick
            </Button>
          )}
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <Select value={sport} onValueChange={setSport}>
            <SelectTrigger className="w-40 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports?.map((s: any) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="w-40 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Picks</SelectItem>
              <SelectItem value="free">Free Picks</SelectItem>
              <SelectItem value="premium">Premium Picks</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => refetch()} variant="outline" size="sm" className="h-9 gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground mt-2 text-sm">Loading picks...</p>
          </div>
        ) : picksData?.picks && picksData.picks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {picksData.picks.map((pick: any) => (
              <PickCard key={pick.id} pick={pick} isPremiumUser={isPremiumUser || false} />
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border p-8 text-center">
            <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No picks available for the selected filters.</p>
          </Card>
        )}
      </div>

      <GeneratePickDialog open={generateOpen} onClose={() => setGenerateOpen(false)} onGenerated={() => refetch()} sports={sports || []} />
    </div>
  );
}
