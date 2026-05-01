import { useState } from "react";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Calculator, Layers, CloudLightning, TrendingUp, RefreshCw, Info, Zap, Eye } from "lucide-react";

const NeonCard = ({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div
    className={className}
    style={{
      background: "rgba(12, 12, 28, 0.85)",
      border: "1px solid rgba(0, 255, 136, 0.12)",
      borderRadius: "6px",
      backdropFilter: "blur(12px)",
      ...style,
    }}
  >
    {children}
  </div>
);

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold tracking-wider transition-all"
    style={{
      background: active ? "rgba(0,255,136,0.12)" : "transparent",
      color: active ? "#00ff88" : "rgba(160,160,190,0.7)",
      border: `1px solid ${active ? "rgba(0,255,136,0.35)" : "rgba(0,255,136,0.1)"}`,
      borderRadius: "4px",
      fontFamily: "'Exo 2', sans-serif",
      cursor: "pointer",
      textShadow: active ? "0 0 8px rgba(0,255,136,0.4)" : "none",
    }}
  >
    {children}
  </button>
);

// ─── Kelly Criterion Tool ────────────────────────────────────────────────────
function KellyTool() {
  const [bankroll, setBankroll] = useState(1000);
  const [odds, setOdds] = useState(-110);
  const [winProb, setWinProb] = useState(55);
  const [fraction, setFraction] = useState(50);

  const { data, isLoading } = trpc.odds.calculateKelly.useQuery({
    bankroll,
    odds,
    winProbability: winProb / 100,
    fractionKelly: fraction / 100,
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <NeonCard className="p-6">
        <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.2rem", textTransform: "uppercase", color: "white", marginBottom: "1.5rem" }}>
          INPUT PARAMETERS
        </h3>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold tracking-wider mb-2" style={{ color: "#00d4ff" }}>BANKROLL ($)</label>
            <input
              type="number"
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm font-medium"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "4px", color: "white", outline: "none" }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider mb-2" style={{ color: "#00d4ff" }}>AMERICAN ODDS (e.g. -110, +150)</label>
            <input
              type="number"
              value={odds}
              onChange={(e) => setOdds(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm font-medium"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "4px", color: "white", outline: "none" }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider mb-2" style={{ color: "#00d4ff" }}>
              YOUR WIN PROBABILITY: <span style={{ color: "#00ff88" }}>{winProb}%</span>
            </label>
            <input
              type="range"
              min={1}
              max={99}
              value={winProb}
              onChange={(e) => setWinProb(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: "#00ff88" }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(140,140,170,0.5)" }}>
              <span>1%</span><span>50%</span><span>99%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider mb-2" style={{ color: "#00d4ff" }}>
              KELLY FRACTION: <span style={{ color: "#a855f7" }}>{fraction}%</span>
              <span className="ml-2 text-[10px] font-normal" style={{ color: "rgba(140,140,170,0.5)" }}>(50% = Half Kelly, recommended)</span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              step={10}
              value={fraction}
              onChange={(e) => setFraction(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: "#a855f7" }}
            />
          </div>
        </div>
      </NeonCard>

      {/* Results */}
      <div className="space-y-4">
        {data && (
          <>
            <NeonCard
              className="p-6"
              style={{ borderColor: data.isPositiveEV ? "rgba(0,255,136,0.3)" : "rgba(255,77,143,0.3)" }}
            >
              <div className="text-center mb-4">
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "3rem",
                    color: data.isPositiveEV ? "#00ff88" : "#ff4d8f",
                    textShadow: `0 0 15px ${data.isPositiveEV ? "rgba(0,255,136,0.4)" : "rgba(255,77,143,0.4)"}`,
                  }}
                >
                  ${data.betAmount.toFixed(2)}
                </div>
                <div className="text-sm" style={{ color: "rgba(180,180,210,0.7)" }}>Optimal Bet Size</div>
              </div>
              <div
                className="text-center py-2 px-4 text-sm font-bold tracking-wider"
                style={{
                  background: data.isPositiveEV ? "rgba(0,255,136,0.1)" : "rgba(255,77,143,0.1)",
                  border: `1px solid ${data.isPositiveEV ? "rgba(0,255,136,0.3)" : "rgba(255,77,143,0.3)"}`,
                  borderRadius: "4px",
                  color: data.isPositiveEV ? "#00ff88" : "#ff4d8f",
                }}
              >
                {data.recommendation}
              </div>
            </NeonCard>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Expected Value", value: `${data.ev > 0 ? "+" : ""}${data.ev}%`, color: data.ev > 0 ? "#00ff88" : "#ff4d8f" },
                { label: "Your Edge", value: `${data.edge > 0 ? "+" : ""}${data.edge}%`, color: data.edge > 0 ? "#00d4ff" : "#ff4d8f" },
                { label: "Kelly %", value: `${data.fractionalKelly}%`, color: "#a855f7" },
                { label: "Potential Profit", value: `$${data.potentialProfit.toFixed(2)}`, color: "#00ff88" },
                { label: "Implied Prob", value: `${data.impliedProbability}%`, color: "#00d4ff" },
                { label: "Your Prob", value: `${winProb}%`, color: "#00ff88" },
              ].map((s) => (
                <NeonCard key={s.label} className="p-3 text-center">
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: s.color }}>
                    {s.value}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(140,140,170,0.6)" }}>{s.label}</div>
                </NeonCard>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Parlay Optimizer ────────────────────────────────────────────────────────
function ParlayOptimizer() {
  const [legs, setLegs] = useState([
    { description: "Team A ML", odds: -110, winProbability: 55 },
    { description: "Team B -3.5", odds: -115, winProbability: 52 },
  ]);
  const [correlationBoost, setCorrelationBoost] = useState(false);

  const { data } = trpc.odds.optimizeParlay.useQuery({
    legs: legs.map((l) => ({ ...l, winProbability: l.winProbability / 100 })),
    correlationBoost,
  });

  const addLeg = () => {
    if (legs.length < 8) setLegs([...legs, { description: `Leg ${legs.length + 1}`, odds: -110, winProbability: 52 }]);
  };

  const removeLeg = (i: number) => {
    if (legs.length > 2) setLegs(legs.filter((_, idx) => idx !== i));
  };

  const updateLeg = (i: number, field: string, value: string | number) => {
    setLegs(legs.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <NeonCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.1rem", textTransform: "uppercase", color: "white" }}>
              PARLAY LEGS ({legs.length}/8)
            </h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "rgba(160,160,190,0.7)" }}>
                <input
                  type="checkbox"
                  checked={correlationBoost}
                  onChange={(e) => setCorrelationBoost(e.target.checked)}
                  style={{ accentColor: "#a855f7" }}
                />
                <span style={{ color: "#a855f7" }}>Correlation Boost</span>
              </label>
              <button
                onClick={addLeg}
                className="px-3 py-1 text-xs font-bold"
                style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "4px", color: "#00ff88", cursor: "pointer" }}
              >
                + ADD LEG
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {legs.map((leg, i) => (
              <div key={i} className="p-3" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(0,255,136,0.1)", borderRadius: "4px" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold" style={{ color: "#00d4ff" }}>LEG {i + 1}</span>
                  {legs.length > 2 && (
                    <button onClick={() => removeLeg(i)} className="ml-auto text-xs" style={{ color: "#ff4d8f", cursor: "pointer", background: "none", border: "none" }}>✕</button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={leg.description}
                    onChange={(e) => updateLeg(i, "description", e.target.value)}
                    placeholder="Description"
                    className="col-span-3 px-2 py-1.5 text-xs"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: "3px", color: "white", outline: "none" }}
                  />
                  <div>
                    <div className="text-[10px] mb-1" style={{ color: "rgba(140,140,170,0.6)" }}>ODDS</div>
                    <input
                      type="number"
                      value={leg.odds}
                      onChange={(e) => updateLeg(i, "odds", Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs"
                      style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: "3px", color: "white", outline: "none" }}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] mb-1" style={{ color: "rgba(140,140,170,0.6)" }}>WIN PROB: {leg.winProbability}%</div>
                    <input
                      type="range"
                      min={1}
                      max={99}
                      value={leg.winProbability}
                      onChange={(e) => updateLeg(i, "winProbability", Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: "#00ff88" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </NeonCard>
      </div>

      {/* Results */}
      {data && (
        <div className="space-y-4">
          <NeonCard
            className="p-6 text-center"
            style={{ borderColor: data.ev > 0 ? "rgba(0,255,136,0.3)" : "rgba(255,77,143,0.25)" }}
          >
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "2.5rem", color: data.combinedOdds > 0 ? "#00ff88" : "white" }}>
              {data.combinedOdds > 0 ? "+" : ""}{data.combinedOdds}
            </div>
            <div className="text-sm mb-3" style={{ color: "rgba(180,180,210,0.6)" }}>Combined Parlay Odds</div>
            <div
              className="py-2 px-4 text-sm font-bold tracking-wider"
              style={{
                background: data.ev > 0 ? "rgba(0,255,136,0.1)" : "rgba(255,77,143,0.1)",
                border: `1px solid ${data.ev > 0 ? "rgba(0,255,136,0.3)" : "rgba(255,77,143,0.3)"}`,
                borderRadius: "4px",
                color: data.ev > 0 ? "#00ff88" : "#ff4d8f",
              }}
            >
              {data.recommendation}
            </div>
          </NeonCard>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Hit Probability", value: `${data.combinedProbability}%`, color: "#00d4ff" },
              { label: "Expected Value", value: `${data.ev > 0 ? "+" : ""}${data.ev}%`, color: data.ev > 0 ? "#00ff88" : "#ff4d8f" },
              { label: "Adjusted EV", value: `${data.adjustedEV > 0 ? "+" : ""}${data.adjustedEV}%`, color: "#a855f7" },
              { label: "Book Vig", value: `${data.vig.toFixed(1)}%`, color: "#ff4d8f" },
            ].map((s) => (
              <NeonCard key={s.label} className="p-3 text-center">
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: "rgba(140,140,170,0.6)" }}>{s.label}</div>
              </NeonCard>
            ))}
          </div>

          <NeonCard className="p-4">
            <div className="text-xs font-bold tracking-wider mb-3" style={{ color: "#00d4ff" }}>LEG BREAKDOWN</div>
            <div className="space-y-2">
              {data.legs.map((leg, i) => (
                <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(0,255,136,0.06)" }}>
                  <span className="text-sm" style={{ color: "rgba(200,200,220,0.8)" }}>{leg.description}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: "white" }}>{leg.odds > 0 ? "+" : ""}{leg.odds}</span>
                    <span style={{ color: "#a855f7" }}>{leg.impliedProbability}% impl</span>
                    <span style={{ color: leg.edge > 0 ? "#00ff88" : "#ff4d8f" }}>
                      {leg.edge > 0 ? "+" : ""}{leg.edge}% edge
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </NeonCard>
        </div>
      )}
    </div>
  );
}

// ─── Steam Moves ─────────────────────────────────────────────────────────────
function SteamMoves() {
  const [sport, setSport] = useState("all");
  const { data, isLoading, refetch } = trpc.odds.getSteamMoves.useQuery({ sport, hours: 3 }, { refetchInterval: 60000 });

  const SPORTS = [
    { key: "all", label: "ALL" },
    { key: "americanfootball_nfl", label: "NFL" },
    { key: "basketball_nba", label: "NBA" },
    { key: "baseball_mlb", label: "MLB" },
    { key: "icehockey_nhl", label: "NHL" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
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
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ml-auto"
          style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "4px", cursor: "pointer" }}
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          REFRESH
        </button>
      </div>

      <div className="space-y-3">
        {(data?.steamMoves ?? []).map((move, i) => (
          <NeonCard
            key={i}
            className="p-5"
            style={{ borderColor: move.sharpAction ? "rgba(0,255,136,0.25)" : "rgba(0,212,255,0.15)" }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)", borderRadius: "3px", color: "#00d4ff" }}>
                    {move.sport?.split("_")[1]?.toUpperCase()}
                  </span>
                  {move.sharpAction && (
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest" style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "3px", color: "#00ff88" }}>
                      ⚡ SHARP ACTION
                    </span>
                  )}
                  <span className="text-xs ml-auto" style={{ color: "rgba(140,140,170,0.5)" }}>{move.steamTime}</span>
                </div>
                <div className="font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.05rem", color: "white" }}>
                  {move.homeTeam} vs {move.awayTeam}
                </div>
                <div className="text-sm mt-0.5" style={{ color: "#00ff88" }}>
                  Sharp side: <strong>{move.team}</strong>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-center">
                  <div className="text-xs mb-0.5" style={{ color: "rgba(140,140,170,0.6)" }}>OPENING</div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "rgba(200,200,220,0.8)" }}>
                    {move.openingOdds > 0 ? "+" : ""}{move.openingOdds}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs mb-0.5" style={{ color: "rgba(140,140,170,0.6)" }}>CURRENT</div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#00d4ff" }}>
                    {move.currentOdds > 0 ? "+" : ""}{move.currentOdds}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs mb-0.5" style={{ color: "rgba(140,140,170,0.6)" }}>MOVEMENT</div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: move.movement > 0 ? "#00ff88" : "#ff4d8f" }}>
                    {move.movement > 0 ? "+" : ""}{move.movement}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs mb-0.5" style={{ color: "rgba(140,140,170,0.6)" }}>PUBLIC BETS</div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#a855f7" }}>
                    {move.pctBets}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs mb-0.5" style={{ color: "rgba(140,140,170,0.6)" }}>SHARP $</div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#00ff88" }}>
                    {move.pctMoney}%
                  </div>
                </div>
                <div
                  className="px-3 py-2 text-center"
                  style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: "4px", minWidth: "60px" }}
                >
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#00ff88" }}>
                    {move.confidence}%
                  </div>
                  <div className="text-[10px]" style={{ color: "rgba(140,140,170,0.6)" }}>CONF</div>
                </div>
              </div>
            </div>

            {/* RLM indicator */}
            {move.pctBets < 50 && move.pctMoney > 60 && (
              <div
                className="mt-3 flex items-center gap-2 px-3 py-2 text-xs font-bold"
                style={{ background: "rgba(255,77,143,0.08)", border: "1px solid rgba(255,77,143,0.25)", borderRadius: "4px", color: "#ff4d8f" }}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                REVERSE LINE MOVEMENT — Public on {move.pctBets < 50 ? move.awayTeam : move.homeTeam} but sharp money on {move.team}
              </div>
            )}
          </NeonCard>
        ))}
      </div>
    </div>
  );
}

// ─── Public Betting % ────────────────────────────────────────────────────────
function PublicBetting() {
  const [sport, setSport] = useState("basketball_nba");
  const { data, isLoading, refetch } = trpc.odds.getPublicBetting.useQuery({ sport }, { refetchInterval: 120000 });

  const SPORTS = [
    { key: "basketball_nba", label: "NBA" },
    { key: "americanfootball_nfl", label: "NFL" },
    { key: "baseball_mlb", label: "MLB" },
    { key: "icehockey_nhl", label: "NHL" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {SPORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSport(s.key)}
            className="px-3 py-1.5 text-xs font-bold tracking-wider"
            style={{
              background: sport === s.key ? "#00d4ff" : "rgba(0,212,255,0.06)",
              color: sport === s.key ? "#080814" : "rgba(0,212,255,0.8)",
              border: `1px solid ${sport === s.key ? "#00d4ff" : "rgba(0,212,255,0.2)"}`,
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "'Exo 2', sans-serif",
            }}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ml-auto"
          style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "4px", cursor: "pointer" }}
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          REFRESH
        </button>
      </div>

      <div className="space-y-3">
        {(data?.games ?? []).map((game, i) => (
          <NeonCard key={i} className="p-5" style={{ borderColor: game.isSharpFade ? "rgba(255,77,143,0.25)" : "rgba(0,255,136,0.12)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.05rem", color: "white" }}>
                  {game.awayTeam} @ {game.homeTeam}
                </div>
                <div className="text-xs" style={{ color: "rgba(140,140,170,0.5)" }}>{game.commenceTime}</div>
              </div>
              {game.isSharpFade && (
                <div
                  className="px-2 py-1 text-[10px] font-bold tracking-widest"
                  style={{ background: "rgba(255,77,143,0.1)", border: "1px solid rgba(255,77,143,0.3)", borderRadius: "3px", color: "#ff4d8f" }}
                >
                  SHARP FADE: {game.sharpSide}
                </div>
              )}
            </div>

            {/* Public % bars */}
            <div className="space-y-3">
              {[
                { team: game.homeTeam, odds: game.homeOdds, publicPct: game.homePublicPct, moneyPct: game.homeMoneyPct },
                { team: game.awayTeam, odds: game.awayOdds, publicPct: game.awayPublicPct, moneyPct: game.awayMoneyPct },
              ].map((side, j) => (
                <div key={j}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "rgba(200,200,220,0.85)" }}>{side.team}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span style={{ color: "rgba(140,140,170,0.6)" }}>
                        {side.odds > 0 ? "+" : ""}{side.odds}
                      </span>
                      <span style={{ color: "#00d4ff" }}>{side.publicPct}% public</span>
                      <span style={{ color: "#00ff88" }}>{side.moneyPct}% $$$</span>
                    </div>
                  </div>
                  <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="absolute left-0 top-0 h-full transition-all duration-500"
                      style={{ width: `${side.publicPct}%`, background: "rgba(0,212,255,0.5)", borderRadius: "2px" }}
                    />
                    <div
                      className="absolute left-0 top-0 h-1 transition-all duration-500"
                      style={{ width: `${side.moneyPct}%`, background: "#00ff88", borderRadius: "2px", boxShadow: "0 0 4px rgba(0,255,136,0.5)" }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] mt-0.5" style={{ color: "rgba(100,100,130,0.6)" }}>
                    <span style={{ color: "rgba(0,212,255,0.5)" }}>■ Public bets</span>
                    <span style={{ color: "rgba(0,255,136,0.5)" }}>■ Sharp money</span>
                  </div>
                </div>
              ))}
            </div>
          </NeonCard>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TOOLS = [
  { id: "kelly", label: "Kelly Criterion", icon: Calculator, color: "#00ff88" },
  { id: "parlay", label: "Parlay Optimizer", icon: Layers, color: "#a855f7" },
  { id: "steam", label: "Steam Moves", icon: TrendingUp, color: "#00d4ff" },
  { id: "public", label: "Public Betting %", icon: Eye, color: "#ff4d8f" },
];

export default function Tools() {
  const [activeTool, setActiveTool] = useState("kelly");

  return (
    <div className="min-h-screen" style={{ background: "#080814", color: "#e8e8f0" }}>
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-bold tracking-widest"
            style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: "4px", color: "#a855f7" }}
          >
            <Zap className="w-3 h-3" /> POWER TOOLS
          </div>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "2.5rem", textTransform: "uppercase", color: "white" }}>
            BETTING{" "}
            <span style={{ color: "#a855f7", textShadow: "0 0 15px rgba(168,85,247,0.4)" }}>ARSENAL</span>
          </h1>
          <p style={{ color: "rgba(180,180,210,0.65)", marginTop: "0.5rem" }}>
            Professional-grade tools used by sharp bettors. Mathematically precise, real-time data.
          </p>
        </div>

        {/* Tool tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold tracking-wider transition-all"
              style={{
                background: activeTool === tool.id ? `${tool.color}15` : "rgba(12,12,28,0.85)",
                color: activeTool === tool.id ? tool.color : "rgba(160,160,190,0.7)",
                border: `1px solid ${activeTool === tool.id ? `${tool.color}40` : "rgba(0,255,136,0.1)"}`,
                borderRadius: "4px",
                fontFamily: "'Exo 2', sans-serif",
                cursor: "pointer",
                textShadow: activeTool === tool.id ? `0 0 8px ${tool.color}60` : "none",
              }}
            >
              <tool.icon className="w-4 h-4" />
              {tool.label}
            </button>
          ))}
        </div>

        {/* Tool content */}
        {activeTool === "kelly" && <KellyTool />}
        {activeTool === "parlay" && <ParlayOptimizer />}
        {activeTool === "steam" && <SteamMoves />}
        {activeTool === "public" && <PublicBetting />}
      </div>
    </div>
  );
}
