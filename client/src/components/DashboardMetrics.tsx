import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Zap } from "lucide-react";

interface DashboardMetricsProps {
  winRate?: number;
  calibratedOutcomes?: number;
  projectedPLYTD?: number;
  roi?: number;
  annualVolume?: number;
  totalBets?: number;
  winningBets?: number;
  totalProfit?: number;
}

export default function DashboardMetrics({
  winRate = 59,
  calibratedOutcomes = 847000,
  projectedPLYTD = 0,
  roi = 0,
  annualVolume = 0,
  totalBets = 0,
  winningBets = 0,
  totalProfit = 0,
}: DashboardMetricsProps) {
  const actualWinRate = totalBets > 0 ? Math.round((winningBets / totalBets) * 100) : 0;
  const actualROI = totalBets > 0 ? ((totalProfit / (totalBets * 100)) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Win Rate */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-400" />
            Win Rate
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">Verified, timestamped</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-400">{actualWinRate}%</div>
          <p className="text-xs text-slate-400 mt-1">{winningBets} of {totalBets} bets</p>
        </CardContent>
      </Card>

      {/* Projected P&L YTD */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            {projectedPLYTD >= 0 ? (
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            Projected P&L YTD
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">At your current bet size</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${projectedPLYTD >= 0 ? "text-cyan-400" : "text-red-400"}`}>
            {projectedPLYTD >= 0 ? "+" : "-"}${Math.abs(projectedPLYTD).toFixed(0)}
          </div>
          <p className="text-xs text-slate-400 mt-1">{projectedPLYTD >= 0 ? "Positive" : "Negative"} edge</p>
        </CardContent>
      </Card>

      {/* ROI */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            ROI
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">Expected value edge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-400">{actualROI}%</div>
          <p className="text-xs text-slate-400 mt-1">Return on investment</p>
        </CardContent>
      </Card>

      {/* Calibrated Outcomes */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-300">Calibrated Data</CardTitle>
          <CardDescription className="text-xs text-slate-500">Historical outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-400">{(calibratedOutcomes / 1000).toFixed(0)}K</div>
          <p className="text-xs text-slate-400 mt-1">Outcomes analyzed</p>
        </CardContent>
      </Card>
    </div>
  );
}
