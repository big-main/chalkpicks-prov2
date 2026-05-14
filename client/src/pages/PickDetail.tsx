import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Zap, Target, TrendingUp, Lock, CheckCircle2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import PickFeedback from "@/components/PickFeedback";

export default function PickDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [addingBet, setAddingBet] = useState(false);

  const { data: pick, isLoading } = trpc.picks.byId.useQuery({ id: parseInt(id ?? "0") });
  const addBet = trpc.bets.add.useMutation({
    onSuccess: () => { toast.success("Bet added to tracker!"); setAddingBet(false); },
    onError: () => toast.error("Failed to add bet"),
  });

  const isPremiumUser = isAuthenticated && user?.subscriptionTier !== "free";
  const isLocked = pick?.tier === "premium" && !isPremiumUser;

  const resultClass = pick?.result === "win" ? "badge-win" : pick?.result === "loss" ? "badge-loss" : pick?.result === "push" ? "badge-push" : "badge-pending";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container">
          <div className="max-w-3xl mx-auto space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!pick) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container text-center">
          <h2 className="font-display text-3xl">Pick not found</h2>
          <Link href="/picks"><Button className="mt-4">Back to Picks</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="container py-8 max-w-3xl mx-auto">
          <Link href="/picks">
            <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Picks
            </Button>
          </Link>

          {/* Header Card */}
          <Card className="bg-card border-border mb-5 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className={`text-xs ${pick.tier === "premium" ? "badge-premium" : "badge-free"} border-0`}>
                  {pick.tier === "premium" ? "⭐ Premium" : "Free"}
                </Badge>
                <span className="text-xs text-muted-foreground uppercase font-medium bg-secondary px-2 py-0.5 rounded">
                  {pick.sportKey}
                </span>
                <span className="text-xs text-muted-foreground">{pick.pickType?.replace("_", "/")}</span>
                <Badge className={`text-xs ${resultClass} border-0 capitalize ml-auto`}>{pick.result}</Badge>
              </div>

              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">{pick.awayTeam} @ {pick.homeTeam}</div>
                <h1 className="font-display text-4xl tracking-wider text-foreground">{pick.recommendation}</h1>
                {pick.odds && (
                  <div className="text-lg text-muted-foreground mt-1 font-medium">
                    {pick.odds > 0 ? `+${pick.odds}` : pick.odds}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                  <div className="font-display text-2xl text-primary">{pick.confidenceScore}%</div>
                  <div className="h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pick.confidenceScore}%` }} />
                  </div>
                </div>
                {pick.edgeScore && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Edge Score</div>
                    <div className="font-display text-2xl text-accent">{pick.edgeScore}/10</div>
                    <div className="text-xs text-muted-foreground mt-1">Market advantage</div>
                  </div>
                )}
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Pick Date</div>
                  <div className="font-semibold text-foreground text-sm">{pick.pickDate}</div>
                  <div className="text-xs text-muted-foreground mt-1">{pick.pickType?.replace("_", " ")}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border mb-5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="w-4 h-4 text-primary" /> <span>AI Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLocked ? (
                <div className="text-center py-8">
                  <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Premium Content Locked</h3>
                  <p className="text-sm text-muted-foreground mb-4">Subscribe to access the full AI analysis, key factors, and betting rationale.</p>
                  <Link href="/pricing">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Unlock Premium Access
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">{pick.aiAnalysis ?? "AI analysis not available for this pick."}</p>
              )}
            </CardContent>
          </Card>

          {/* Key Factors */}
          {!isLocked && Array.isArray(pick.keyFactors) && (pick.keyFactors as string[]).length > 0 && (
            <Card className="bg-card border-border mb-5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-4 h-4 text-accent" /> <span>Key Factors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(pick.keyFactors as string[]).map((factor: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{factor}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add to Bet Tracker */}
          {isAuthenticated && !isLocked && (
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground text-sm">Track This Bet</div>
                  <div className="text-xs text-muted-foreground">Add to your bet tracker to monitor performance</div>
                </div>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={addingBet}
                  onClick={() => {
                    setAddingBet(true);
                    addBet.mutate({
                      pickId: pick.id,
                      sportKey: pick.sportKey,
                      description: pick.recommendation,
                      betType: pick.pickType as any,
                      stake: 100,
                      odds: pick.odds ?? -110,
                      betDate: pick.pickDate,
                    });
                  }}
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Add Bet
                </Button>
              </CardContent>
            </Card>
          )}

          {!isAuthenticated && (
            <Card className="bg-card border-border">
              <CardContent className="p-5 text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Sign in to track this bet and access your personal dashboard</p>
                <Button className="bg-primary text-primary-foreground" onClick={() => (window.location.href = "/login")}>
                  Sign In to Track
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Feedback Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Community Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PickFeedback pickId={pick.id} isAuthenticated={isAuthenticated} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
