import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, Zap, Crown, Star, Shield, ArrowRight, Lock } from "lucide-react";

// ─── Plan meta ────────────────────────────────────────────────────────────────

const PLAN_META: Record<string, {
  icon: React.ElementType;
  color: string;
  glow: string;
  badge?: string;
  popular?: boolean;
}> = {
  daily:   { icon: Zap,   color: "#00d4ff", glow: "rgba(0,212,255,0.25)",   badge: "Try it out" },
  monthly: { icon: Crown, color: "#00ff88", glow: "rgba(0,255,136,0.25)",   badge: "Most Popular", popular: true },
  yearly:  { icon: Star,  color: "#a855f7", glow: "rgba(168,85,247,0.25)",  badge: "Best Value" },
};

// ─── Feature comparison ───────────────────────────────────────────────────────

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
  children, className = "", style = {}, onClick,
}: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void;
}) => (
  <div
    className={className}
    onClick={onClick}
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
  const [loading, setLoading] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const { data: plansData } = trpc.subscription.plans.useQuery();
  const createCheckout = trpc.subscription.createCheckout.useMutation();
  const { data: mySubscription } = trpc.subscription.mySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Build ordered plan list from server data or fallback defaults
  const planOrder: Array<"daily" | "monthly" | "yearly"> = ["daily", "monthly", "yearly"];
  const plans = planOrder.map((key) => {
    const p = plansData?.[key];
    if (p) return { key, ...p };
    const defaults = {
      daily:   { name: "Daily Pass",    amountCents: 999,   description: "Full access for 24 hours",          features: ["All premium picks today", "AI analysis & confidence scores", "Player props & live odds", "Email alerts"] },
      monthly: { name: "Monthly Pro",   amountCents: 2999,  description: "Best value for serious bettors",    features: ["All premium picks daily", "AI picks generator", "Backtesting engine", "Bet tracker & analytics", "Leaderboard access", "Priority email support", "Daily pick alerts"] },
      yearly:  { name: "Annual Elite",  amountCents: 19999, description: "Maximum savings for pros",          features: ["Everything in Monthly", "Early access to new features", "Advanced backtesting", "Custom AI pick generation", "VIP Discord access", "1-on-1 strategy sessions"] },
    };
    return { key, ...defaults[key] };
  });

  const handleSubscribe = async (tier: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setLoading(tier);
    try {
      const result = await createCheckout.mutateAsync({
        tier: tier as "daily" | "monthly" | "yearly",
        origin: window.location.origin,
      });
      if (result.url) {
        toast.success("Redirecting to secure Stripe checkout...");
        window.open(result.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

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

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {plans.map((plan) => {
            const meta = PLAN_META[plan.key] ?? PLAN_META.monthly;
            const Icon = meta.icon;
            const isCurrent = isActive && currentTier === plan.key;
            const price = plan.amountCents / 100;
            const isPopular = meta.popular;

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
                      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "3rem", color: meta.color, textShadow: `0 0 15px ${meta.glow}`, lineHeight: 1 }}>
                        ${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}
                      </span>
                      <span className="mb-1.5 text-sm" style={{ color: "rgba(140,140,170,0.6)" }}>
                        /{plan.key === "daily" ? "day" : plan.key === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                    {plan.key === "yearly" && (
                      <div className="text-xs mt-1" style={{ color: "#a855f7" }}>= ${(price / 12).toFixed(2)}/mo · Save $16/mo vs monthly</div>
                    )}
                    {plan.key === "monthly" && (
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

                  {/* CTA */}
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
                      disabled={loading === plan.key}
                      className="w-full py-3 text-sm font-bold tracking-wider flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: isPopular ? "#00ff88" : `${meta.color}18`,
                        color: isPopular ? "#080814" : meta.color,
                        border: `1px solid ${isPopular ? "#00ff88" : `${meta.color}50`}`,
                        borderRadius: "5px",
                        cursor: loading === plan.key ? "not-allowed" : "pointer",
                        opacity: loading === plan.key ? 0.7 : 1,
                        fontFamily: "'Exo 2', sans-serif",
                        boxShadow: isPopular ? "0 0 20px rgba(0,255,136,0.3)" : "none",
                      }}
                    >
                      {loading === plan.key ? (
                        <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> REDIRECTING...</>
                      ) : !isAuthenticated ? (
                        <><Lock className="w-4 h-4" /> SIGN IN TO SUBSCRIBE</>
                      ) : (
                        <>GET STARTED <ArrowRight className="w-4 h-4" /></>
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
        <div className="text-center mb-6">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-sm font-bold tracking-wider px-5 py-2.5 transition-all"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.25)", borderRadius: "5px", color: "#00d4ff", cursor: "pointer", fontFamily: "'Exo 2', sans-serif" }}
          >
            {showComparison ? "▲ HIDE" : "▼ SHOW"} FULL FEATURE COMPARISON
          </button>
        </div>

        {/* Feature comparison table */}
        {showComparison && (
          <NeonCard className="max-w-4xl mx-auto overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(0,255,136,0.1)" }}>
                    <th className="text-left py-4 px-5" style={{ color: "rgba(140,140,170,0.7)", fontWeight: 600, width: "40%" }}>FEATURE</th>
                    {[{ label: "Daily", color: "#00d4ff" }, { label: "Monthly", color: "#00ff88" }, { label: "Yearly", color: "#a855f7" }].map(({ label, color }) => (
                      <th key={label} className="py-4 px-4 text-center" style={{ color, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1rem", textTransform: "uppercase" }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_ROWS.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(0,255,136,0.05)", background: i % 2 === 0 ? "transparent" : "rgba(0,255,136,0.02)" }}>
                      <td className="py-3 px-5" style={{ color: "rgba(200,200,220,0.8)" }}>{row.feature}</td>
                      <td className="py-3 px-4"><CheckMark value={row.daily}   color="#00d4ff" /></td>
                      <td className="py-3 px-4"><CheckMark value={row.monthly} color="#00ff88" /></td>
                      <td className="py-3 px-4"><CheckMark value={row.yearly}  color="#a855f7" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              Payments processed securely by Stripe · Test card: <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: "3px" }}>4242 4242 4242 4242</code>
            </div>
          </NeonCard>
        </div>
      </div>
    </div>
  );
}
