import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { RefreshCw, TrendingUp, Zap, Filter, Lock, ArrowRight, Info } from "lucide-react";
import { Link } from "wouter";

const SPORTS = [
  { key: "all", label: "ALL SPORTS" },
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "basketball_nba", label: "NBA" },
  { key: "baseball_mlb", label: "MLB" },
  { key: "icehockey_nhl", label: "NHL" },
  { key: "soccer_epl", label: "EPL" },
];

const MIN_EV = [
  { value: 0, label: "All +EV" },
  { value: 2, label: "+2% min" },
  { value: 5, label: "+5% min" },
  { value: 10, label: "+10% min" },
];

function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

function calcEV(trueProb: number, decimalOdds: number): number {
  return (trueProb * (decimalOdds - 1) - (1 - trueProb)) * 100;
}

function impliedProb(american: number): number {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

function formatOdds(american: number): string {
  return american > 0 ? `+${american}` : `${american}`;
}

const NeonCard = ({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div
    className={className}
    style={{
      background: "rgba(12, 12, 28, 0.85)",
      border: "1px solid rgba(0, 255, 136, 0.12)",
      borderRadius: "6px",
      backdropFilter: "blur(12px)",
      transition: "all 0.25s",
      ...style,
    }}
  >
    {children}
  </div>
);

export default function EVFinder() {
  const { isAuthenticated } = useAuth();
  const [sport, setSport] = useState("all");
  const [minEV, setMinEV] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, refetch } = trpc.odds.getEVOpportunities.useQuery(
    { sport, minEV },
    { refetchInterval: 60000 }
  );

  interface EVOpportunity {
    sport: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
    betDescription: string;
    bookOdds: number;
    trueOdds: number;
    trueProb: number;
    bookmaker: string;
    ev: number;
  }
  const opportunities = useMemo<EVOpportunity[]>(() => (data?.opportunities ?? []) as EVOpportunity[], [data]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  return (
    <div className="min-h-screen" style={{ background: "#080814", color: "#e8e8f0" }}>
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-bold tracking-widest"
            style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: "4px", color: "#00ff88" }}
          >
            <span className="live-dot" /> LIVE ODDS SCANNING
          </div>
          <h1
            style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "2.5rem", textTransform: "uppercase", color: "white" }}
          >
            <span style={{ color: "#00ff88", textShadow: "0 0 15px rgba(0,255,136,0.4)" }}>+EV</span> FINDER
          </h1>
          <p style={{ color: "rgba(180,180,210,0.65)", marginTop: "0.5rem" }}>
            Positive expected value bets identified by comparing true probability against sportsbook odds. Only bet when the math is in your favor.
          </p>
        </div>

        {/* Info banner */}
        <NeonCard className="p-4 mb-6 flex items-start gap-3" style={{ borderColor: "rgba(0,212,255,0.2)" }}>
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#00d4ff" }} />
          <p className="text-sm" style={{ color: "rgba(180,180,210,0.75)" }}>
            <strong style={{ color: "#00d4ff" }}>How it works:</strong> We calculate the "true" probability of each outcome using a no-vig model across multiple sportsbooks. When a book's odds imply a lower probability than the true probability, that's a +EV opportunity. Positive EV means you profit long-term if you bet it consistently.
          </p>
        </NeonCard>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1 flex-wrap">
            {SPORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSport(s.key)}
                className="px-3 py-1.5 text-xs font-bold tracking-wider transition-all"
                style={{
                  background: sport === s.key ? "#00ff88" : "rgba(0,255,136,0.06)",
                  color: sport === s.key ? "#080814" : "rgba(0,255,136,0.8)",
                  border: `1px solid ${sport === s.key ? "#00ff88" : "rgba(0,255,136,0.2)"}`,
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {MIN_EV.map((m) => (
              <button
                key={m.value}
                onClick={() => setMinEV(m.value)}
                className="px-3 py-1.5 text-xs font-bold tracking-wider transition-all"
                style={{
                  background: minEV === m.value ? "rgba(0,212,255,0.15)" : "transparent",
                  color: minEV === m.value ? "#00d4ff" : "rgba(140,140,170,0.7)",
                  border: `1px solid ${minEV === m.value ? "rgba(0,212,255,0.4)" : "rgba(140,140,170,0.2)"}`,
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                {m.label}
              </button>
            ))}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider ml-2 transition-all"
              style={{
                background: "rgba(168,85,247,0.1)",
                color: "#a855f7",
                border: "1px solid rgba(168,85,247,0.3)",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "'Exo 2', sans-serif",
              }}
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              REFRESH
            </button>
          </div>
        </div>

        {/* Summary stats */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Opportunities Found", value: opportunities.length.toString(), color: "#00ff88" },
              { label: "Avg EV", value: opportunities.length > 0 ? `+${(opportunities.reduce((s: number, o: EVOpportunity) => s + o.ev, 0) / opportunities.length).toFixed(1)}%` : "—", color: "#00d4ff" },
              { label: "Best EV", value: opportunities.length > 0 ? `+${Math.max(...opportunities.map((o: EVOpportunity) => o.ev)).toFixed(1)}%` : "—", color: "#a855f7" },
              { label: "Last Updated", value: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), color: "#00ff88" },
            ].map((s) => (
              <NeonCard key={s.label} className="p-4 text-center">
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.6rem", color: s.color, textShadow: `0 0 8px ${s.color}50` }}>
                  {s.value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(140,140,170,0.7)" }}>{s.label}</div>
              </NeonCard>
            ))}
          </div>
        )}

        {/* Opportunities table */}
        {isLoading ? (
          <NeonCard className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: "#00ff88" }} />
            <p style={{ color: "rgba(180,180,210,0.6)" }}>Scanning odds from 10+ sportsbooks...</p>
          </NeonCard>
        ) : opportunities.length === 0 ? (
          <NeonCard className="p-12 text-center">
            <TrendingUp className="w-10 h-10 mx-auto mb-4" style={{ color: "rgba(0,255,136,0.3)" }} />
            <p className="font-bold mb-2" style={{ color: "white", fontFamily: "'Rajdhani', sans-serif", fontSize: "1.2rem" }}>
              NO +EV OPPORTUNITIES RIGHT NOW
            </p>
            <p className="text-sm" style={{ color: "rgba(140,140,170,0.6)" }}>
              Markets are efficient at the moment. Check back in a few minutes or lower the minimum EV threshold.
            </p>
          </NeonCard>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp, i) => (
              <NeonCard
                key={i}
                className="p-5"
                style={{
                  borderColor: opp.ev >= 10 ? "rgba(0,255,136,0.3)" : opp.ev >= 5 ? "rgba(0,212,255,0.2)" : "rgba(0,255,136,0.12)",
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Game info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.5 text-[10px] font-bold tracking-widest"
                        style={{
                          background: "rgba(0,212,255,0.1)",
                          border: "1px solid rgba(0,212,255,0.25)",
                          borderRadius: "3px",
                          color: "#00d4ff",
                        }}
                      >
                        {opp.sport?.toUpperCase()}
                      </span>
                      <span className="text-xs" style={{ color: "rgba(140,140,170,0.6)" }}>{opp.commenceTime}</span>
                    </div>
                    <div className="font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.1rem", color: "white" }}>
                      {opp.homeTeam} vs {opp.awayTeam}
                    </div>
                    <div className="text-sm mt-0.5" style={{ color: "rgba(180,180,210,0.7)" }}>
                      <strong style={{ color: "#00ff88" }}>{opp.betDescription}</strong>
                    </div>
                  </div>

                  {/* Odds comparison */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-center">
                      <div className="text-xs mb-0.5" style={{ color: "rgba(140,140,170,0.6)" }}>BOOK ODDS</div>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "white" }}>
                        {formatOdds(opp.bookOdds)}
                      </div>
                      <div className="text-xs" style={{ color: "rgba(140,140,170,0.5)" }}>{opp.bookmaker}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs mb-0.5" style={{ color: "rgba(140,140,170,0.6)" }}>TRUE ODDS</div>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#00d4ff" }}>
                        {formatOdds(opp.trueOdds)}
                      </div>
                      <div className="text-xs" style={{ color: "rgba(140,140,170,0.5)" }}>No-vig</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs mb-0.5" style={{ color: "rgba(140,140,170,0.6)" }}>TRUE PROB</div>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#a855f7" }}>
                        {(opp.trueProb * 100).toFixed(1)}%
                      </div>
                    </div>
                    {/* EV badge */}
                    <div
                      className="px-4 py-2 text-center"
                      style={{
                        background: opp.ev >= 10 ? "rgba(0,255,136,0.15)" : opp.ev >= 5 ? "rgba(0,212,255,0.12)" : "rgba(0,255,136,0.08)",
                        border: `1px solid ${opp.ev >= 10 ? "rgba(0,255,136,0.4)" : opp.ev >= 5 ? "rgba(0,212,255,0.3)" : "rgba(0,255,136,0.2)"}`,
                        borderRadius: "4px",
                        minWidth: "80px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 700,
                          fontSize: "1.5rem",
                          color: opp.ev >= 10 ? "#00ff88" : opp.ev >= 5 ? "#00d4ff" : "#00ff88",
                          textShadow: `0 0 8px ${opp.ev >= 5 ? "rgba(0,255,136,0.4)" : "rgba(0,255,136,0.2)"}`,
                        }}
                      >
                        +{opp.ev.toFixed(1)}%
                      </div>
                      <div className="text-[10px] font-bold tracking-wider" style={{ color: "rgba(140,140,170,0.6)" }}>EV</div>
                    </div>
                  </div>
                </div>
              </NeonCard>
            ))}
          </div>
        )}

        {/* Premium upsell if not authenticated */}
        {!isAuthenticated && (
          <NeonCard
            className="mt-8 p-8 text-center"
            style={{ borderColor: "rgba(0,255,136,0.25)", background: "rgba(0,255,136,0.03)" }}
          >
            <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: "#00ff88" }} />
            <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "white", textTransform: "uppercase" }}>
              UNLOCK FULL +EV SCANNER
            </h3>
            <p className="text-sm mt-2 mb-5" style={{ color: "rgba(180,180,210,0.65)" }}>
              Premium members get real-time alerts when +EV opportunities appear, historical EV tracking, and Kelly criterion sizing for each bet.
            </p>
            <button
              onClick={() => (window.location.href = getLoginUrl())}
              className="flex items-center gap-2 mx-auto px-6 py-2.5 text-sm font-bold tracking-wider"
              style={{
                background: "#00ff88",
                color: "#080814",
                borderRadius: "4px",
                fontFamily: "'Exo 2', sans-serif",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 0 15px rgba(0,255,136,0.3)",
              }}
            >
              GET PREMIUM ACCESS <ArrowRight className="w-4 h-4" />
            </button>
          </NeonCard>
        )}
      </div>
    </div>
  );
}
