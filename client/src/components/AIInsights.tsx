import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AIInsightsProps {
  sport: string;
  matchup: string;
  odds: number;
  pickType: string;
}

export function AIInsights({ sport, matchup, odds, pickType }: AIInsightsProps) {
  const [context, setContext] = useState("");

  useEffect(() => {
    setContext(
      `Sport: ${sport}, Matchup: ${matchup}, Pick Type: ${pickType}, Odds: ${odds}`
    );
  }, [sport, matchup, pickType, odds]);

  const { data: insights, isLoading, error } = trpc.aiPicks.getInsights.useQuery(
    { context },
    { enabled: !!context }
  );

  if (isLoading) {
    return (
      <Card className="border-neon-green/30 bg-gradient-to-br from-slate-900 to-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neon-green">
            <Sparkles className="w-5 h-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/30 bg-gradient-to-br from-slate-900 to-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-300">
            Unable to generate AI insights at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-neon-green/30 bg-gradient-to-br from-slate-900 to-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-neon-green">
          <Sparkles className="w-5 h-5" />
          AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-300 leading-relaxed">
          {insights?.insights || "No insights available"}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * EV Calculator Component
 */
interface EVCalculatorProps {
  odds: number;
  winProbability: number;
  analysis?: string;
}

export function EVCalculator({
  odds,
  winProbability,
  analysis,
}: EVCalculatorProps) {
  const { data: evData, isLoading } = trpc.aiPicks.calculateEV.useQuery({
    odds,
    winProbability,
    analysis,
  });

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (!evData?.data) {
    return null;
  }

  const { ev, recommendation } = evData.data;
  const evPercent = (ev * 100).toFixed(2);
  const isPositive = ev > 0;

  const recommendationColors: Record<string, string> = {
    STRONG_BUY: "text-neon-green",
    BUY: "text-cyan-400",
    HOLD: "text-yellow-400",
    SELL: "text-orange-400",
    STRONG_SELL: "text-red-400",
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-400">Expected Value:</span>
        <span
          className={`font-bold ${isPositive ? "text-neon-green" : "text-red-400"}`}
        >
          {isPositive ? "+" : ""}{evPercent}%
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-400">Recommendation:</span>
        <span className={`font-bold text-sm ${recommendationColors[recommendation]}`}>
          {recommendation}
        </span>
      </div>
    </div>
  );
}
