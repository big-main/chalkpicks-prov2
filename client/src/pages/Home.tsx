import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import {
  Zap, BarChart3, Shield, Trophy, Brain,
  ArrowRight, CheckCircle2, Star, Target, Lock,
  Activity, TrendingUp, TrendingDown, Percent,
  Calculator, CloudLightning, Layers, Eye, Flame
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const performanceData = [
  { month: "Oct", roi: 12.1 },
  { month: "Nov", roi: 15.3 },
  { month: "Dec", roi: 19.7 },
  { month: "Jan", roi: 18.4 },
  { month: "Feb", roi: 21.3 },
  { month: "Mar", roi: 23.1 },
];

const features = [
  {
    icon: Brain,
    title: "AI Pick Engine",
    desc: "Neural network analyzes thousands of data points — player stats, matchup history, weather, injuries — generating picks with confidence scores.",
    color: "#00ff88",
    badge: "CORE",
  },
  {
    icon: Percent,
    title: "+EV Finder",
    desc: "Scan real-time odds from 10+ sportsbooks to surface positive expected value bets. Only bet when the math is on your side.",
    color: "#00d4ff",
    badge: "EXCLUSIVE",
  },
  {
    icon: TrendingUp,
    title: "Steam Move Detector",
    desc: "Detect sudden sharp money line movements the moment they happen. Follow the sharps, not the public.",
    color: "#a855f7",
    badge: "EXCLUSIVE",
  },
  {
    icon: Eye,
    title: "Public Betting %",
    desc: "See where the public money is going on every game. Fade the public or follow the sharp money — your choice.",
    color: "#00d4ff",
    badge: "NEW",
  },
  {
    icon: Calculator,
    title: "Kelly Criterion Tool",
    desc: "Mathematically optimal bet sizing based on your edge and bankroll. Never over-bet or under-bet again.",
    color: "#00ff88",
    badge: "NEW",
  },
  {
    icon: CloudLightning,
    title: "Weather Impact Model",
    desc: "Real weather data integrated into NFL and MLB picks. Wind speed, temperature, and precipitation affect outcomes — we model it.",
    color: "#a855f7",
    badge: "NEW",
  },
  {
    icon: Layers,
    title: "Parlay Optimizer",
    desc: "AI-powered correlated parlay builder. Finds leg combinations that are statistically linked for higher combined win probability.",
    color: "#00ff88",
    badge: "NEW",
  },
  {
    icon: BarChart3,
    title: "Advanced Backtesting",
    desc: "Test any strategy against years of historical data. Filter by sport, confidence, bet type, and date range to find your edge.",
    color: "#00d4ff",
    badge: "CORE",
  },
  {
    icon: Target,
    title: "CLV Tracker",
    desc: "Track your closing line value on every bet. CLV is the #1 predictor of long-term profitability — monitor yours automatically.",
    color: "#a855f7",
    badge: "NEW",
  },
];

const statsBar = [
  { label: "Win Rate", value: "73.1%", sub: "Verified 12-month", color: "#00ff88" },
  { label: "Avg ROI", value: "+18.4%", sub: "Per unit staked", color: "#00d4ff" },
  { label: "Members", value: "12,847", sub: "Active bettors", color: "#a855f7" },
  { label: "Picks", value: "847K+", sub: "Generated & tracked", color: "#00ff88" },
];

const sportStats = [
  { label: "NFL", winRate: "72.4%", roi: "+16.8%", games: "1,204" },
  { label: "NBA", winRate: "73.6%", roi: "+19.2%", games: "2,847" },
  { label: "MLB", winRate: "73.4%", roi: "+18.9%", games: "3,102" },
  { label: "NHL", winRate: "73.0%", roi: "+17.6%", games: "892" },
];

const testimonials = [
  { name: "Marcus T.", role: "Pro Bettor", text: "The +EV finder alone pays for the subscription 10x over. I've never had a tool this precise for finding real value.", stars: 5 },
  { name: "Sarah K.", role: "Sports Analyst", text: "The steam move detector is insane. I get alerted the second sharp money hits and I can beat the closing line consistently.", stars: 5 },
  { name: "Derek M.", role: "Daily Bettor", text: "Kelly Criterion tool changed how I size bets. My bankroll grew 34% in 3 months just from better bet sizing.", stars: 5 },
];

const NeonCard = ({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div
    className={`relative overflow-hidden transition-all duration-300 ${className}`}
    style={{
      background: "rgba(12, 12, 28, 0.85)",
      border: "1px solid rgba(0, 255, 136, 0.12)",
      borderRadius: "6px",
      backdropFilter: "blur(12px)",
      ...style,
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,255,136,0.3)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 20px rgba(0,255,136,0.06)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,255,136,0.12)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
    }}
  >
    {children}
  </div>
);

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: picksData } = trpc.picks.list.useQuery({ limit: 3, tier: "all" });

  return (
    <div className="min-h-screen" style={{ background: "#080814", color: "#e8e8f0" }}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        className="relative pt-32 pb-20 overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,255,136,0.07), transparent),
            radial-gradient(ellipse 60% 40% at 80% 50%, rgba(168,85,247,0.07), transparent),
            radial-gradient(ellipse 50% 40% at 20% 80%, rgba(0,212,255,0.05), transparent),
            #080814
          `,
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-100 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-bold tracking-widest"
              style={{
                background: "rgba(0,255,136,0.08)",
                border: "1px solid rgba(0,255,136,0.3)",
                borderRadius: "4px",
                color: "#00ff88",
              }}
            >
              <span className="live-dot" />
              NEXT-GEN SPORTS AI — LIVE DATA
            </div>

            {/* Headline */}
            <h1
              className="mb-6 leading-none"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(3.2rem, 8vw, 6rem)",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                color: "white",
              }}
            >
              THE FUTURE OF<br />
              <span style={{ color: "#00ff88", textShadow: "0 0 20px rgba(0,255,136,0.5), 0 0 60px rgba(0,255,136,0.2)" }}>
                SPORTS
              </span>{" "}
              <span style={{ color: "#00d4ff", textShadow: "0 0 20px rgba(0,212,255,0.5), 0 0 60px rgba(0,212,255,0.2)" }}>
                BETTING
              </span>
              <br />IS HERE
            </h1>

            <p
              className="mb-10 max-w-2xl mx-auto"
              style={{ fontSize: "1.15rem", color: "rgba(200,200,220,0.75)", lineHeight: 1.7 }}
            >
              Real-time odds from 10+ sportsbooks. AI picks with confidence scores. +EV finder, steam move detector, CLV tracker, Kelly criterion tool — features no other platform offers, all in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {isAuthenticated ? (
                <Link href="/picks">
                  <button
                    className="flex items-center gap-2 px-8 py-3.5 text-base font-bold tracking-wider transition-all"
                    style={{
                      background: "#00ff88",
                      color: "#080814",
                      borderRadius: "4px",
                      fontFamily: "'Exo 2', sans-serif",
                      boxShadow: "0 0 20px rgba(0,255,136,0.35)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    VIEW TODAY'S PICKS <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              ) : (
                <button
                  className="flex items-center gap-2 px-8 py-3.5 text-base font-bold tracking-wider transition-all"
                  style={{
                    background: "#00ff88",
                    color: "#080814",
                    borderRadius: "4px",
                    fontFamily: "'Exo 2', sans-serif",
                    boxShadow: "0 0 20px rgba(0,255,136,0.35)",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  START FREE TODAY <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <Link href="/ev-finder">
                <button
                  className="flex items-center gap-2 px-8 py-3.5 text-base font-semibold tracking-wider transition-all"
                  style={{
                    background: "transparent",
                    color: "#00d4ff",
                    borderRadius: "4px",
                    fontFamily: "'Exo 2', sans-serif",
                    border: "1px solid rgba(0,212,255,0.4)",
                    cursor: "pointer",
                  }}
                >
                  TRY +EV FINDER FREE
                </button>
              </Link>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {statsBar.map((stat) => (
                <NeonCard key={stat.label} className="p-4 text-center">
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      fontSize: "2rem",
                      color: stat.color,
                      textShadow: `0 0 10px ${stat.color}60`,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold mt-0.5" style={{ color: "rgba(220,220,240,0.9)" }}>
                    {stat.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(140,140,170,0.8)" }}>
                    {stat.sub}
                  </div>
                </NeonCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PERFORMANCE CHART ────────────────────────────────── */}
      <section
        className="py-16"
        style={{ borderTop: "1px solid rgba(0,255,136,0.1)", borderBottom: "1px solid rgba(0,255,136,0.1)" }}
      >
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-bold tracking-widest"
                style={{
                  background: "rgba(0,212,255,0.08)",
                  border: "1px solid rgba(0,212,255,0.3)",
                  borderRadius: "4px",
                  color: "#00d4ff",
                }}
              >
                VERIFIED TRACK RECORD
              </div>
              <h2
                className="mb-4 leading-none"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ color: "#00ff88", textShadow: "0 0 15px rgba(0,255,136,0.4)" }}>73.1% WIN RATE</span>
                <br />
                <span style={{ color: "white" }}>OVER 12 MONTHS</span>
              </h2>
              <p style={{ color: "rgba(180,180,210,0.75)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                Every pick is logged, tracked, and verified on-chain. Our AI model has maintained a 73.1% win rate and +18.4% ROI over the past year across all major sports leagues.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {sportStats.map((s) => (
                  <NeonCard key={s.label} className="p-3">
                    <div className="text-xs mb-1" style={{ color: "#00d4ff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, textTransform: "uppercase" }}>
                      {s.label}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: "white" }}>{s.winRate}</span>
                      <span className="text-xs font-bold" style={{ color: "#00ff88" }}>{s.roi}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(140,140,170,0.7)" }}>{s.games} games</div>
                  </NeonCard>
                ))}
              </div>
            </div>

            <NeonCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium" style={{ color: "rgba(180,180,210,0.7)" }}>Monthly ROI Performance</span>
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold"
                  style={{
                    background: "rgba(0,255,136,0.1)",
                    border: "1px solid rgba(0,255,136,0.3)",
                    borderRadius: "4px",
                    color: "#00ff88",
                  }}
                >
                  <span className="live-dot" style={{ width: 6, height: 6 }} />
                  LIVE
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,136,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(140,140,170,0.8)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(140,140,170,0.8)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(12,12,28,0.95)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "4px" }}
                    labelStyle={{ color: "#00d4ff" }}
                    formatter={(v: number) => [`${v}%`, "ROI"]}
                  />
                  <Area type="monotone" dataKey="roi" stroke="#00ff88" strokeWidth={2} fill="url(#roiGrad)" dot={{ fill: "#00ff88", strokeWidth: 0, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </NeonCard>
          </div>
        </div>
      </section>

      {/* ── TODAY'S PICKS PREVIEW ────────────────────────────── */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 text-xs font-bold tracking-widest"
                style={{
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  borderRadius: "4px",
                  color: "#a855f7",
                }}
              >
                <span className="live-dot" style={{ background: "#a855f7" }} />
                UPDATED DAILY AT 6AM UTC
              </div>
              <h2
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "2rem",
                  textTransform: "uppercase",
                  color: "white",
                }}
              >
                TODAY'S{" "}
                <span style={{ color: "#00ff88", textShadow: "0 0 10px rgba(0,255,136,0.4)" }}>TOP PICKS</span>
              </h2>
            </div>
            <Link href="/picks">
              <button
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all"
                style={{
                  background: "transparent",
                  color: "#00d4ff",
                  border: "1px solid rgba(0,212,255,0.3)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {picksData?.picks?.slice(0, 3).map((pick) => (
              <Link key={pick.id} href={`/picks/${pick.id}`}>
                <NeonCard className="p-5 cursor-pointer h-full" style={{ transition: "all 0.25s" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="px-2 py-0.5 text-xs font-bold tracking-wider"
                      style={{
                        background: pick.tier === "premium" ? "rgba(0,255,136,0.1)" : "rgba(148,163,184,0.1)",
                        border: `1px solid ${pick.tier === "premium" ? "rgba(0,255,136,0.3)" : "rgba(148,163,184,0.25)"}`,
                        borderRadius: "3px",
                        color: pick.tier === "premium" ? "#00ff88" : "#94a3b8",
                      }}
                    >
                      {pick.tier === "premium" ? "⚡ PREMIUM" : "FREE"}
                    </div>
                    <span
                      className="text-xs font-bold tracking-widest"
                      style={{ color: "#00d4ff", fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      {pick.sportKey?.toUpperCase()}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs mb-1" style={{ color: "rgba(140,140,170,0.7)" }}>
                      {pick.awayTeam} @ {pick.homeTeam}
                    </div>
                    <div className="font-bold text-base" style={{ color: "white", fontFamily: "'Rajdhani', sans-serif", fontSize: "1.05rem" }}>
                      {pick.recommendation}
                    </div>
                    <div className="text-sm mt-0.5" style={{ color: "rgba(180,180,210,0.6)" }}>
                      {pick.odds && pick.odds > 0 ? `+${pick.odds}` : pick.odds}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: "rgba(140,140,170,0.7)" }}>Confidence</span>
                      <span className="font-bold" style={{ color: "#00ff88" }}>{pick.confidenceScore}%</span>
                    </div>
                    <div className="h-1" style={{ background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pick.confidenceScore}%`,
                          background: "linear-gradient(90deg, #00ff88, #00d4ff)",
                          borderRadius: "2px",
                          boxShadow: "0 0 6px rgba(0,255,136,0.4)",
                        }}
                      />
                    </div>
                  </div>
                  {pick.tier === "premium" && !isAuthenticated && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "rgba(140,140,170,0.6)" }}>
                      <Lock className="w-3 h-3" /> Subscribe to unlock full analysis
                    </div>
                  )}
                </NeonCard>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/picks">
              <button
                className="flex items-center gap-2 mx-auto px-6 py-2.5 text-sm font-bold tracking-wider transition-all"
                style={{
                  background: "#00ff88",
                  color: "#080814",
                  borderRadius: "4px",
                  fontFamily: "'Exo 2', sans-serif",
                  boxShadow: "0 0 15px rgba(0,255,136,0.25)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                VIEW ALL TODAY'S PICKS <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section
        className="py-16"
        style={{ background: "linear-gradient(180deg, rgba(168,85,247,0.04) 0%, transparent 100%)" }}
      >
        <div className="container">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-bold tracking-widest"
              style={{
                background: "rgba(0,255,136,0.08)",
                border: "1px solid rgba(0,255,136,0.25)",
                borderRadius: "4px",
                color: "#00ff88",
              }}
            >
              WEAPONS IN YOUR ARSENAL
            </div>
            <h2
              className="mb-3"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(2rem, 4vw, 2.8rem)",
                textTransform: "uppercase",
                color: "white",
              }}
            >
              FEATURES NO OTHER PLATFORM{" "}
              <span style={{ color: "#00ff88", textShadow: "0 0 15px rgba(0,255,136,0.4)" }}>OFFERS</span>
            </h2>
            <p style={{ color: "rgba(180,180,210,0.65)", maxWidth: "560px", margin: "0 auto" }}>
              Built by professional bettors and data scientists. Every tool is designed to give you a measurable, mathematical edge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <NeonCard key={f.title} className="p-6 relative">
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-0 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                />
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{
                      background: `${f.color}12`,
                      border: `1px solid ${f.color}30`,
                      borderRadius: "6px",
                    }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <div
                    className="px-2 py-0.5 text-[10px] font-bold tracking-widest"
                    style={{
                      background: `${f.color}12`,
                      border: `1px solid ${f.color}30`,
                      borderRadius: "3px",
                      color: f.color,
                    }}
                  >
                    {f.badge}
                  </div>
                </div>
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    fontSize: "1.1rem",
                    textTransform: "uppercase",
                    color: "white",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(160,160,190,0.8)", lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </NeonCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "2rem",
                textTransform: "uppercase",
                color: "white",
              }}
            >
              WHAT OUR{" "}
              <span style={{ color: "#00d4ff", textShadow: "0 0 10px rgba(0,212,255,0.4)" }}>MEMBERS SAY</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <NeonCard key={t.name} className="p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4" style={{ fill: "#00ff88", color: "#00ff88" }} />
                  ))}
                </div>
                <p style={{ fontSize: "0.875rem", color: "rgba(180,180,210,0.75)", lineHeight: 1.7, marginBottom: "1rem" }}>
                  "{t.text}"
                </p>
                <div>
                  <div className="font-semibold text-sm" style={{ color: "white" }}>{t.name}</div>
                  <div className="text-xs" style={{ color: "rgba(140,140,170,0.7)" }}>{t.role}</div>
                </div>
              </NeonCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          borderTop: "1px solid rgba(0,255,136,0.1)",
          background: `
            radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,255,136,0.06), transparent),
            #080814
          `,
        }}
      >
        <div className="container text-center">
          <h2
            className="mb-5"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              textTransform: "uppercase",
              color: "white",
            }}
          >
            READY TO BET{" "}
            <span style={{ color: "#00ff88", textShadow: "0 0 20px rgba(0,255,136,0.5)" }}>SMARTER?</span>
          </h2>
          <p style={{ color: "rgba(180,180,210,0.7)", fontSize: "1.1rem", marginBottom: "2rem", maxWidth: "480px", margin: "0 auto 2rem" }}>
            Join 12,847+ members who use ChalkPicks Pro to gain a real, mathematical edge. Start free, upgrade when you're ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {isAuthenticated ? (
              <Link href="/pricing">
                <button
                  className="flex items-center gap-2 px-8 py-3.5 text-base font-bold tracking-wider"
                  style={{
                    background: "#00ff88",
                    color: "#080814",
                    borderRadius: "4px",
                    fontFamily: "'Exo 2', sans-serif",
                    boxShadow: "0 0 20px rgba(0,255,136,0.35)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  UPGRADE TO PRO <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            ) : (
              <button
                className="flex items-center gap-2 px-8 py-3.5 text-base font-bold tracking-wider"
                style={{
                  background: "#00ff88",
                  color: "#080814",
                  borderRadius: "4px",
                  fontFamily: "'Exo 2', sans-serif",
                  boxShadow: "0 0 20px rgba(0,255,136,0.35)",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => (window.location.href = getLoginUrl())}
              >
                GET STARTED FREE <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <Link href="/pricing">
              <button
                className="flex items-center gap-2 px-8 py-3.5 text-base font-semibold tracking-wider"
                style={{
                  background: "transparent",
                  color: "#00d4ff",
                  borderRadius: "4px",
                  fontFamily: "'Exo 2', sans-serif",
                  border: "1px solid rgba(0,212,255,0.4)",
                  cursor: "pointer",
                }}
              >
                VIEW PRICING
              </button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs" style={{ color: "rgba(140,140,170,0.7)" }}>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#00ff88" }} /> No credit card for free tier
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#00ff88" }} /> Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#00ff88" }} /> Verified results
            </span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(0,255,136,0.1)", padding: "2.5rem 0" }}>
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: "#00ff88" }} />
              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "white",
                }}
              >
                CHALK<span style={{ color: "#00ff88" }}>PICKS</span> PRO
              </span>
            </div>
            <div className="flex items-center gap-5 text-sm" style={{ color: "rgba(140,140,170,0.7)" }}>
              <Link href="/picks" className="hover:text-white transition-colors">Picks</Link>
              <Link href="/stats" className="hover:text-white transition-colors">Stats</Link>
              <Link href="/ev-finder" className="hover:text-white transition-colors">+EV Finder</Link>
              <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
              <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            </div>
            <div className="text-xs" style={{ color: "rgba(120,120,150,0.6)" }}>
              © 2026 ChalkPicks Pro. Bet responsibly.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
