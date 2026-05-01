import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Calendar, CreditCard, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function SubscriptionManagement() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to manage your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your ChalkPicks Pro subscription and billing</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground capitalize">
                        {subscription?.tier || "Free"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {subscription?.isActive
                          ? "Your current active subscription"
                          : "Upgrade to access premium features"}
                      </p>
                    </div>
                    {subscription?.isActive && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                    )}
                  </div>

                  {subscription?.isActive && subscription?.expiresAt && (
                    <div className="bg-card border border-border rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Renewal Date</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {new Date(subscription.expiresAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Plan Features</h4>
                    <ul className="space-y-2">
                      {subscription?.tier === "free" && (
                        <>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            No active subscription
                          </li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Upgrade to access premium features
                          </li>
                        </>
                      )}
                      {(subscription?.tier === "daily" || subscription?.tier === "monthly" || subscription?.tier === "yearly") && (
                        <>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            All standard features
                          </li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Premium AI-powered picks
                          </li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Advanced backtesting engine
                          </li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Daily pick alerts
                          </li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Performance analytics
                          </li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Priority support
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/pricing", { replace: true })}
                  >
                    {subscription?.isActive ? "Change Plan" : "Upgrade Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Billing History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      date: "2026-03-22",
                      description: "Monthly Subscription",
                      amount: "$29.99",
                      status: "Paid",
                    },
                    {
                      date: "2026-02-22",
                      description: "Monthly Subscription",
                      amount: "$29.99",
                      status: "Paid",
                    },
                    {
                      date: "2026-01-22",
                      description: "Monthly Subscription",
                      amount: "$29.99",
                      status: "Paid",
                    },
                  ].map((invoice, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between pb-3 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{invoice.description}</p>
                        <p className="text-xs text-muted-foreground">{invoice.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{invoice.amount}</p>
                          <Badge variant="outline" className="text-xs">
                            {invoice.status}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-card border border-border rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Visa</p>
                      <p className="text-xs text-muted-foreground">•••• •••• •••• 4242</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Expires 12/26</p>
                </div>
                <Button variant="outline" className="w-full text-sm">
                  Update Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-foreground">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">123 Main Street</p>
                  <p className="text-sm text-muted-foreground">New York, NY 10001</p>
                </div>
                <Button variant="outline" className="w-full text-sm">
                  Edit Address
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-400">
                      Canceling your subscription will immediately revoke access to premium features.
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="w-full text-sm"
                  disabled={!subscription?.isActive}
                >
                  Cancel Subscription
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
