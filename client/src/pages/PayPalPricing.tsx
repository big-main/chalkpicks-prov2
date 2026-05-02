import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

export default function PayPalPricing() {
  const { isAuthenticated, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { data: plans, isLoading } = trpc.paypal.getPlans.useQuery();
  const createOrder = trpc.paypal.createOrder.useMutation();

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    setSelectedPlan(planId);
    try {
      const order = await createOrder.mutateAsync({
        planId: planId as "daily" | "monthly" | "yearly",
        returnUrl: window.location.origin + "/payment/success",
      });

      // Redirect to PayPal
      if (order.links && order.links[0]) {
        window.open(order.links[0].href, "_blank");
      }
    } catch (error) {
      toast.error("Failed to create subscription. Please try again.");
    } finally {
      setSelectedPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-96 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 container">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your betting strategy. Upgrade or downgrade anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans?.map((plan, idx) => (
              <Card
                key={plan.id}
                className={`bg-card border-border relative transition-all hover:shadow-lg ${
                  idx === 1 ? "md:scale-105 md:shadow-xl" : ""
                }`}
              >
                {idx === 1 && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {idx === 0 && <Zap className="w-5 h-5 text-primary" />}
                    {idx === 1 && <Crown className="w-5 h-5 text-gold-gradient" />}
                    {idx === 2 && <Sparkles className="w-5 h-5 text-primary" />}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">{plan.billing_cycle}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-muted-foreground">
                        {plan.billing_cycle === "Daily" && "/day"}
                        {plan.billing_cycle === "Monthly" && "/month"}
                        {plan.billing_cycle === "Yearly" && "/year"}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full ${
                      idx === 1
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-gold"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={selectedPlan === plan.id}
                  >
                    {selectedPlan === plan.id ? "Processing..." : "Subscribe with PayPal"}
                  </Button>

                  {user?.subscriptionTier === plan.id && (
                    <div className="text-center text-sm text-primary font-medium">
                      ✓ Current Plan
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-foreground text-center">Frequently Asked Questions</h2>

            <div className="space-y-4">
              {[
                {
                  q: "Can I change my plan anytime?",
                  a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major payment methods through PayPal, including credit cards, debit cards, and PayPal balance.",
                },
                {
                  q: "Do you offer a trial?",
                  a: "No trial needed. Start with our Daily Pass ($9.99/day) to test the platform risk-free with our 7-day money-back guarantee.",
                },
                {
                  q: "What if I'm not satisfied?",
                  a: "We offer a 7-day money-back guarantee. Contact support for a full refund.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-secondary/30 p-4 rounded-lg border border-border/30">
                  <h3 className="font-semibold text-foreground mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
