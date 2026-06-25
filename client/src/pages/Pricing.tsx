import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Check, Zap, Crown, Star, Shield, Lock, Tag, Loader2, ArrowRight } from "lucide-react";

// ─── Plan meta ────────────────────────────────────────────────────────────────

const PLAN_META: Record<string, {
  icon: React.ElementType;
  color: string;
  glow: string;
  badge?: string;
  popular?: boolean;
}> = {
  trial:   { icon: Zap,   color: "#ff6b35", glow: "rgba(255,107,53,0.25)",   badge: "Free Trial" },
  credit:  { icon: Star,  color: "#fbbf24", glow: "rgba(251,191,36,0.25)",   badge: "Limited Offer", popular: true },
  daily:   { icon: Zap,   color: "#00d4ff", glow: "rgba(0,212,255,0.25)",   badge: "Try it out" },
  monthly: { icon: Crown, color: "#00ff88", glow: "rgba(0,255,136,0.25)",   badge: "Most Popular", popular: true },
  yearly:  { icon: Star,  color: "#a855f7", glow: "rgba(168,85,247,0.25)",  badge: "Best Value" },
};

// ─── Detailed feature comparison ───────────────────────────────────────────────

const FEATURE_CATEGORIES = [
  {
    category: "Core Features",
    features: [
      { name: "AI-generated picks (daily)", daily: true, monthly: true, yearly: true, description: "Daily AI picks with confidence scores" },
      { name: "Confidence & edge scores", daily: true, monthly: true, yearly: true, description: "AI confidence and expected value metrics" },
      { name: "Live stats & player data", daily: true, monthly: true, yearly: true, description: "Real-time stats from 10+ sportsbooks" },
      { name: "Leaderboard access", daily: true, monthly: true, yearly: true, description: "View top bettors and their performance" },
    ]
  },
  {
    category: "Premium Analytics",
    features: [
      { name: "+EV Finder", daily: false, monthly: true, yearly: true, description: "Find positive expected value opportunities" },
      { name: "Steam move detector", daily: false, monthly: true, yearly: true, description: "Detect sharp money and line movements" },
      { name: "CLV Tracker", daily: false, monthly: true, yearly: true, description: "Track closing line value for your bets" },
      { name: "Backtesting engine", daily: false, monthly: true, yearly: true, description: "Test strategies against historical data" },
    ]
  },
  {
    category: "Tools & Calculators",
    features: [
      { name: "Kelly Criterion calculator", daily: false, monthly: true, yearly: true, description: "Optimal bet sizing based on edge" },
      { name: "Parlay optimizer", daily: false, monthly: true, yearly: true, description: "Build and analyze multi-leg parlays" },
      { name: "Arbitrage finder", daily: false, monthly: true, yearly: true, description: "Find risk-free arbitrage opportunities" },
      { name: "Bankroll tracker", daily: false, monthly: true, yearly: true, description: "Track P&L, ROI, and betting performance" },
    ]
  },
  {
    category: "Market Data",
    features: [
      { name: "Kalshi prediction markets", daily: false, monthly: true, yearly: true, description: "Access to real prediction market data" },
      { name: "Odds comparison (18+ books)", daily: false, monthly: true, yearly: true, description: "Compare odds across major sportsbooks" },
      { name: "Line movement history", daily: false, monthly: true, yearly: true, description: "Historical line movement tracking" },
    ]
  },
  {
    category: "Support & Community",
    features: [
      { name: "Email pick alerts", daily: false, monthly: true, yearly: true, description: "Daily picks delivered to your inbox" },
      { name: "Email support", daily: false, monthly: true, yearly: true, description: "Priority email support" },
      { name: "VIP Discord access", daily: false, monthly: false, yearly: true, description: "Exclusive Discord community for elite members" },
      { name: "1-on-1 strategy sessions", daily: false, monthly: false, yearly: true, description: "Personal consulting with betting experts" },
      { name: "Advanced backtesting", daily: false, monthly: false, yearly: true, description: "Deep historical analysis and simulations" },
    ]
  },
];

// ─── Feature comparison (legacy format for table) ───────────────────────────────

const FEATURE_ROWS = [
  { feature: "AI-generated picks (daily)",     daily: true,  monthly: true,  yearly: true  },
  { feature: "Confidence & edge scores",        daily: true,  monthly: true,  yearly: true  },
  { feature: "Live stats & player data",        daily: true,  monthly: true,  yearly: true  },
  { feature: "+EV Finder access",               daily: false, monthly: true,  yearly: true  },
  { feature: "Steam move detector",             daily: false, monthly: true,  yearly: true  },
  { feature: "Kelly Criterion tool",            daily: false, monthly: true,  yearly: true  },
  { feature: "Parlay optimizer",                daily: false, monthly: true,  yearly: true  },
  { feature: "Backtesting engine",              daily: false, monthly: true,  yearly: true  },
  { feature: "Bet tracker & analytics",         daily: false, monthly: true,  yearly: true  },
  { feature: "Leaderboard access",              daily: true,  monthly: true,  yearly: true  },
  { feature: "Email pick alerts",               daily: false, monthly: true,  yearly: true  },
  { feature: "Advanced backtesting",            daily: false, monthly: false, yearly: true  },
  { feature: "Custom AI pick generation",       daily: false, monthly: false, yearly: true  },
  { feature: "VIP Discord access",              daily: false, monthly: false, yearly: true  },
  { feature: "1-on-1 strategy sessions",        daily: false, monthly: false, yearly: true  },
  { feature: "Priority support",                daily: false, monthly: false, yearly: true  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NeonCard = ({
  children, className = "", style = {},
}: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) => (
  <div
    className={className}
    style={{
      background: "rgba(12, 12, 28, 0.9)",
      border: "1px solid rgba(0, 255, 136, 0.12)",
      borderRadius: "8px",
      backdropFilter: "blur(12px)",
      transition: "all 0.25s",
      ...style,
    }}
  >
    {children}
  </div>
);

function CheckMark({ value, color }: { value: boolean; color: string }) {
  return value
    ? <div className="flex justify-center"><Check className="w-4 h-4" style={{ color }} /></div>
    : <div className="flex justify-center"><span style={{ color: "rgba(100,100,130,0.4)", fontSize: "1rem" }}>—</span></div>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [showComparison, setShowComparison] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDiscountType, setPromoDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const { data: plansData } = trpc.subscription.plans.useQuery();
  const { data: mySubscription } = trpc.subscription.mySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [promoValidating, setPromoValidating] = useState(false);
  const [promoQueryCode, setPromoQueryCode] = useState("");

  const { data: promoResult, error: promoQueryError } = trpc.promoCode.validate.useQuery(
    { code: promoQueryCode, tier: "monthly" },
    {
      enabled: !!promoQueryCode && promoValidating,
      retry: false,
    }
  );

  // Handle promo validation result
  React.useEffect(() => {
    if (!promoValidating) return;
    if (promoResult) {
      setPromoApplied(true);
      setPromoError("");
      setPromoDiscount(promoResult.discount ?? 0);
      setPromoDiscountType("percentage");
      setPromoValidating(false);
    }
  }, [promoResult, promoValidating]);

  React.useEffect(() => {
    if (!promoValidating) return;
    if (promoQueryError) {
      setPromoApplied(false);
      setPromoError(promoQueryError.message || "Invalid promo code");
      setPromoValidating(false);
    }
  }, [promoQueryError, promoValidating]);

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
      setLoadingTier(null);
    },
    onError: (err) => {
      alert(err.message || "Failed to create checkout session");
      setLoadingTier(null);
    },
  });

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    setPromoError("");
    setPromoApplied(false);
    setPromoValidating(true);
    setPromoQueryCode(promoCode.trim());
  };

  const handleSubscribe = (tier: "daily" | "monthly" | "yearly") => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    setLoadingTier(tier);
    createCheckout.mutate({
      tier,
      origin: window.location.origin,
      promoCode: promoApplied ? promoCode.trim() : undefined,
    });
  };

  const getDiscountedPrice = (amountCents: number) => {
    if (!promoApplied) return amountCents;
    if (promoDiscountType === "percentage") {
      return Math.max(0, amountCents - Math.round((amountCents * promoDiscount) / 100));
    }
    return Math.max(0, amountCents - Math.round(promoDiscount * 100));
  };

  // Build ordered plan list from server data or fallback defaults
  const planOrder: Array<"trial" | "credit" | "daily" | "monthly" | "yearly"> = ["trial", "credit", "daily", "monthly", "yearly"];
  const plans = planOrder.map((key) => {
    const p = plansData?.[key];
    if (p) return { key, ...p };
    const defaults = {
      trial:   { name: "5-Day Free Trial", amountCents: 0, description: "Full access for 5 days, payment required", features: ["All premium picks daily", "AI analysis & confidence scores", "Backtesting engine", "Bet tracker & analytics", "Leaderboard access"] },
      credit:  { name: "$100 Credit Offer", amountCents: 500, description: "Pay $5, get $100 in account credit", features: ["$100 account credit", "Use on any subscription tier", "Valid for 30 days", "No expiration on picks access"] },
      daily:   { name: "Daily Pass",    amountCents: 999,   description: "Full access for 24 hours",          features: ["All premium picks today", "AI analysis & confidence scores", "Player props & live odds", "Email alerts"] },
      monthly: { name: "Monthly Pro",   amountCents: 2999,  description: "Best value for serious bettors",    features: ["All premium picks daily", "AI picks generator", "Backtesting engine", "Bet tracker & analytics", "Leaderboard access", "Priority email support", "Daily pick alerts"] },
      yearly:  { name: "Annual Elite",  amountCents: 19999, description: "Maximum savings for pros",          features: ["Everything in Monthly", "Early access to new features", "Advanced backtesting", "Custom AI pick generation", "VIP Discord access", "1-on-1 strategy sessions"] },
    };
    return { key, ...defaults[key] };
  });

  const currentTier = mySubscription?.tier ?? "free";
  const isActive = mySubscription?.isActive ?? false;

  return (
    <div className="min-h-screen" style={{ background: "#080814", color: "#e8e8f0" }}>
      <Navbar />

      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 container pt-24 pb-20">

        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-bold tracking-widest"
            style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: "4px", color: "#00ff88" }}
          >
            <Shield className="w-3 h-3" /> SECURE CHECKOUT · CANCEL ANYTIME
          </div>
          <h1
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              textTransform: "uppercase",
              color: "white",
              lineHeight: 1.1,
            }}
          >
            PICK YOUR{" "}
            <span style={{ color: "#00ff88", textShadow: "0 0 20px rgba(0,255,136,0.5)" }}>EDGE</span>
          </h1>
          <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: "rgba(180,180,210,0.65)" }}>
            Join thousands of sharp bettors using AI-powered analytics, real-time odds, and professional tools to beat the books.
          </p>

          {/* Active subscription banner */}
          {isAuthenticated && isActive && (
            <div
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 text-sm font-bold"
              style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "6px", color: "#00ff88" }}
            >
              <Check className="w-4 h-4" />
              You're on the <strong>{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</strong> plan
              {mySubscription?.expiresAt && (
                <span style={{ color: "rgba(0,255,136,0.7)", fontWeight: 400 }}>
                  · expires {new Date(mySubscription.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Promo code section */}
        <div className="max-w-md mx-auto mb-10">
          <NeonCard className="p-5" style={{ borderColor: promoApplied ? "rgba(0,255,136,0.4)" : "rgba(0,212,255,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4" style={{ color: "#00d4ff" }} />
              <span className="text-sm font-bold tracking-wider" style={{ color: "#00d4ff", fontFamily: "'Exo 2', sans-serif" }}>
                PROMO CODE
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(false); setPromoError(""); }}
                placeholder="Enter code (e.g. LAUNCH50)"
                className="flex-1 px-3 py-2 text-sm rounded"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,212,255,0.2)", color: "white", outline: "none" }}
              />
              <button
                onClick={handleApplyPromo}
                disabled={promoValidating || !promoCode.trim()}
                className="px-4 py-2 text-sm font-bold rounded transition-all"
                style={{
                  background: promoApplied ? "rgba(0,255,136,0.15)" : "rgba(0,212,255,0.12)",
                  border: `1px solid ${promoApplied ? "rgba(0,255,136,0.4)" : "rgba(0,212,255,0.3)"}`,
                  color: promoApplied ? "#00ff88" : "#00d4ff",
                  cursor: promoValidating ? "wait" : "pointer",
                  opacity: !promoCode.trim() ? 0.5 : 1,
                }}
              >
                {promoValidating ? "..." : promoApplied ? "✓ Applied" : "Apply"}
              </button>
            </div>
            {promoApplied && (
              <p className="mt-2 text-xs font-bold" style={{ color: "#00ff88" }}>
                ✓ {promoDiscountType === "percentage" ? `${promoDiscount}% off` : `$${promoDiscount} off`} applied! Discount will be reflected at checkout.
              </p>
            )}
            {promoError && (
              <p className="mt-2 text-xs" style={{ color: "#ff4d4d" }}>{promoError}</p>
            )}
          </NeonCard>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {plans.map((plan) => {
            const meta = PLAN_META[plan.key] ?? PLAN_META.monthly;
            const Icon = meta.icon;
            const isCurrent = isActive && currentTier === plan.key;
            const originalPrice = plan.amountCents / 100;
            const discountedCents = getDiscountedPrice(plan.amountCents);
            const finalPrice = discountedCents / 100;
            const hasDiscount = promoApplied && discountedCents < plan.amountCents;
            const isPopular = meta.popular;
            const isLoading = loadingTier === plan.key;

            return (
              <div key={plan.key} className="relative flex flex-col" style={{ transform: isPopular ? "scale(1.03)" : "scale(1)" }}>
                {isPopular && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-[11px] font-bold tracking-widest z-10 whitespace-nowrap"
                    style={{ background: "#00ff88", color: "#080814", borderRadius: "20px", boxShadow: "0 0 15px rgba(0,255,136,0.5)", fontFamily: "'Exo 2', sans-serif" }}
                  >
                    ★ MOST POPULAR
                  </div>
                )}

                <NeonCard
                  className="flex flex-col flex-1 p-7"
                  style={{
                    borderColor: isPopular ? "rgba(0,255,136,0.4)" : isCurrent ? `${meta.color}50` : "rgba(0,255,136,0.12)",
                    boxShadow: isPopular ? `0 0 30px ${meta.glow}` : isCurrent ? `0 0 20px ${meta.glow}` : "none",
                  }}
                >
                  {/* Plan header */}
                  <div className="mb-6">
                    <div className="w-10 h-10 flex items-center justify-center mb-3" style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}40`, borderRadius: "6px" }}>
                      <Icon className="w-5 h-5" style={{ color: meta.color }} />
                    </div>
                    <div className="text-xs font-bold tracking-widest mb-1" style={{ color: meta.color, fontFamily: "'Exo 2', sans-serif" }}>
                      {meta.badge?.toUpperCase()}
                    </div>
                    <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.4rem", textTransform: "uppercase", color: "white" }}>
                      {plan.name}
                    </h2>
                    <p className="text-sm mt-1" style={{ color: "rgba(160,160,190,0.65)" }}>{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      {hasDiscount && (
                        <span className="mb-1.5 text-lg line-through" style={{ color: "rgba(140,140,170,0.5)" }}>
                          ${originalPrice.toFixed(2)}
                        </span>
                      )}
                      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "3rem", color: hasDiscount ? "#00ff88" : meta.color, textShadow: `0 0 15px ${meta.glow}`, lineHeight: 1 }}>
                        ${finalPrice.toFixed(2)}
                      </span>
                      <span className="mb-1.5 text-sm" style={{ color: "rgba(140,140,170,0.6)" }}>
                        /{plan.key === "daily" ? "day" : plan.key === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                    {hasDiscount && (
                      <div className="text-xs mt-1 font-bold" style={{ color: "#00ff88" }}>
                        🎉 PROMO APPLIED — You save ${(originalPrice - finalPrice).toFixed(2)}!
                      </div>
                    )}
                    {plan.key === "yearly" && !hasDiscount && (
                      <div className="text-xs mt-1" style={{ color: "#a855f7" }}>= ${(originalPrice / 12).toFixed(2)}/mo · Save $16/mo vs monthly</div>
                    )}
                    {plan.key === "monthly" && !hasDiscount && (
                      <div className="text-xs mt-1" style={{ color: "rgba(140,140,170,0.5)" }}>Billed monthly · cancel anytime</div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {(plan.features as string[]).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: meta.color }} />
                        <span style={{ color: "rgba(200,200,220,0.85)" }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA — Backend Checkout Session */}
                  {isCurrent ? (
                    <div
                      className="w-full py-3 text-center text-sm font-bold tracking-wider"
                      style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}40`, borderRadius: "5px", color: meta.color, fontFamily: "'Exo 2', sans-serif" }}
                    >
                      ✓ CURRENT PLAN
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={isLoading}
                      className="w-full py-3 text-sm font-bold tracking-wider flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: isPopular ? meta.color : `${meta.color}18`,
                        color: isPopular ? "#080814" : meta.color,
                        border: `1px solid ${meta.color}50`,
                        borderRadius: "5px",
                        cursor: isLoading ? "wait" : "pointer",
                        fontFamily: "'Exo 2', sans-serif",
                        boxShadow: isPopular ? `0 0 20px ${meta.glow}` : "none",
                      }}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...</>
                      ) : !isAuthenticated ? (
                        <><Lock className="w-4 h-4" /> SIGN IN TO SUBSCRIBE</>
                      ) : (
                        <><Zap className="w-4 h-4" /> {hasDiscount ? "GET DISCOUNTED ACCESS" : "GET ACCESS NOW"}</>
                      )}
                    </button>
                  )}
                </NeonCard>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {[
            { icon: Shield, label: "256-bit SSL Encryption" },
            { icon: Check,  label: "Cancel Anytime" },
            { icon: Zap,    label: "Instant Access" },
            { icon: Star,   label: "Powered by Stripe" },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2 text-sm" style={{ color: "rgba(140,140,170,0.6)" }}>
              <badge.icon className="w-4 h-4" style={{ color: "rgba(0,255,136,0.5)" }} />
              {badge.label}
            </div>
          ))}
        </div>

        {/* Feature comparison toggle */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-sm font-bold tracking-wider px-5 py-2.5 transition-all flex items-center justify-center gap-2 mx-auto"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.25)", borderRadius: "5px", color: "#00d4ff", cursor: "pointer", fontFamily: "'Exo 2', sans-serif" }}
          >
            {showComparison ? "▲ HIDE" : "▼ SHOW"} DETAILED FEATURE COMPARISON
            <ArrowRight className="w-4 h-4" style={{ transform: showComparison ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.3s" }} />
          </button>
        </div>

        {/* Enhanced feature comparison table */}
        {showComparison && (
          <NeonCard className="max-w-5xl mx-auto overflow-hidden mb-12">
            <div className="p-8">
              <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.5rem", textTransform: "uppercase", color: "white", marginBottom: "1.5rem" }}>
                Complete Feature Breakdown
              </h3>

              {/* Categorized features */}
              <div className="space-y-8">
                {FEATURE_CATEGORIES.map((category, catIdx) => (
                  <div key={catIdx}>
                    <h4 style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", color: "#00ff88", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                      {category.category}
                    </h4>
                    <div className="space-y-3">
                      {category.features.map((feature, fIdx) => (
                        <div key={fIdx} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start p-3 rounded" style={{ background: "rgba(0,255,136,0.02)", borderLeft: "2px solid rgba(0,255,136,0.1)" }}>
                          <div className="md:col-span-2">
                            <div className="font-semibold text-sm" style={{ color: "rgba(200,200,220,0.9)" }}>
                              {feature.name}
                            </div>
                            <div className="text-xs mt-1" style={{ color: "rgba(140,140,170,0.6)" }}>
                              {feature.description}
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <CheckMark value={feature.daily} color="#00d4ff" />
                          </div>
                          <div className="flex justify-center">
                            <CheckMark value={feature.monthly} color="#00ff88" />
                          </div>
                          <div className="flex justify-center">
                            <CheckMark value={feature.yearly} color="#a855f7" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-8 pt-6 border-t" style={{ borderColor: "rgba(0,255,136,0.1)" }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center rounded" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)" }}>
                      <Check className="w-3 h-3" style={{ color: "#00d4ff" }} />
                    </div>
                    <span style={{ color: "rgba(140,140,170,0.7)" }}>Daily Pass ($9.99/day)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center rounded" style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)" }}>
                      <Check className="w-3 h-3" style={{ color: "#00ff88" }} />
                    </div>
                    <span style={{ color: "rgba(140,140,170,0.7)" }}>Monthly Pro ($29.99/mo)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center rounded" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}>
                      <Check className="w-3 h-3" style={{ color: "#a855f7" }} />
                    </div>
                    <span style={{ color: "rgba(140,140,170,0.7)" }}>Annual Elite ($199.99/yr)</span>
                  </div>
                </div>
              </div>
            </div>
          </NeonCard>
        )}

        {/* Guarantee card */}
        <div className="max-w-2xl mx-auto text-center">
          <NeonCard className="p-8" style={{ borderColor: "rgba(168,85,247,0.2)" }}>
            <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "8px" }}>
              <Shield className="w-6 h-6" style={{ color: "#a855f7" }} />
            </div>
            <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.3rem", textTransform: "uppercase", color: "white", marginBottom: "0.75rem" }}>
              MONEY-BACK GUARANTEE
            </h3>
            <p className="text-sm" style={{ color: "rgba(180,180,210,0.65)" }}>
              Not satisfied? Contact us within 48 hours of your first purchase and we'll issue a full refund — no questions asked.
            </p>
            <div className="mt-4 text-xs" style={{ color: "rgba(140,140,170,0.5)" }}>
              Payments processed securely by Stripe
            </div>
          </NeonCard>
        </div>
      </div>
    </div>
  );
}
