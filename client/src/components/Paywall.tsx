import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Lock, Zap } from "lucide-react";

interface PaywallProps {
  tier: "daily" | "monthly" | "yearly";
  title?: string;
  description?: string;
}

export function Paywall({ tier, title = "Premium Feature", description = "Unlock this feature with a subscription" }: PaywallProps) {
  const [location, navigate] = useLocation();

  const tierInfo = {
    daily: { name: "Daily Pass", price: "$9.99/day", features: ["24-hour access", "All premium picks"] },
    monthly: { name: "Monthly Pro", price: "$29.99/mo", features: ["Unlimited access", "Backtesting", "Leaderboard", "Priority support"] },
    yearly: { name: "Annual Elite", price: "$199.99/yr", features: ["Everything in Monthly", "Early access", "VIP Discord", "1-on-1 sessions"] },
  };

  const info = tierInfo[tier];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Locked Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full blur-xl opacity-50"></div>
            <div className="relative bg-slate-900 rounded-full p-4 border border-cyan-500/30">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 font-orbitron">{title}</h1>
          <p className="text-slate-400 mb-4">{description}</p>
          <div className="inline-block bg-gradient-to-r from-cyan-500/10 to-green-500/10 border border-cyan-500/30 rounded-lg px-4 py-2 mb-6">
            <p className="text-cyan-400 font-semibold text-sm">Requires {info.name}</p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 mb-6">
          <p className="text-slate-300 text-sm font-semibold mb-3">What you'll get:</p>
          <ul className="space-y-2">
            {info.features.map((feature, idx) => (
              <li key={idx} className="flex items-center text-slate-400 text-sm">
                <Zap className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/pricing", { replace: true })}
            className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-600 hover:to-green-600 text-black font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Upgrade to {info.name}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/", { replace: true })}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50"
          >
            Back to Home
          </Button>
        </div>

        {/* Price */}
        <p className="text-center text-slate-500 text-xs mt-6">Starting at {info.price}</p>
      </div>
    </div>
  );
}
