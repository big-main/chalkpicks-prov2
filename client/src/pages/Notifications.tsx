import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, CheckCircle, AlertCircle, Clock, Trophy, TrendingUp, Shield, Zap, Settings } from "lucide-react";
import Navbar from "@/components/Navbar";

const notifTypeIcons: Record<string, React.ReactNode> = {
  login_alert: <Shield className="w-4 h-4 text-yellow-400" />,
  subscription_confirm: <CheckCircle className="w-4 h-4 text-green-400" />,
  daily_picks: <Trophy className="w-4 h-4 text-amber-400" />,
  daily_digest: <TrendingUp className="w-4 h-4 text-blue-400" />,
  performance_summary: <Zap className="w-4 h-4 text-purple-400" />,
  system: <Bell className="w-4 h-4 text-slate-400" />,
};

const notifTypeLabels: Record<string, string> = {
  login_alert: "Login Alert",
  subscription_confirm: "Subscription",
  daily_picks: "Daily Picks",
  daily_digest: "Daily Digest",
  performance_summary: "Performance",
  system: "System",
};

const statusColors: Record<string, string> = {
  sent: "text-green-400",
  failed: "text-red-400",
  pending: "text-yellow-400",
};

export default function Notifications() {
  const { isAuthenticated, loading } = useAuth();
  const [smsPhone, setSmsPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: prefs, refetch: refetchPrefs } = trpc.notifications.getPreferences.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: inAppNotifs, refetch: refetchInApp } = trpc.notifications.getInApp.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: history } = trpc.notifications.getHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updatePrefs = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      refetchPrefs();
      toast.success("Notification preferences saved!");
    },
    onError: () => toast.error("Failed to save preferences."),
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      refetchInApp();
      toast.success("All notifications marked as read.");
    },
  });

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => refetchInApp(),
  });

  const sendTest = trpc.notifications.sendTest.useMutation({
    onSuccess: (data) => {
      if (data.success) toast.success(data.message);
      else toast.error(data.message);
    },
  });

  const handleToggle = async (field: string, value: boolean) => {
    setSaving(true);
    await updatePrefs.mutateAsync({ [field]: value });
    setSaving(false);
  };

  const handleSavePhone = async () => {
    if (!smsPhone.trim()) return;
    setSaving(true);
    await updatePrefs.mutateAsync({ smsPhone: smsPhone.trim(), smsEnabled: true });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-8 pb-8 text-center">
              <Bell className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground mb-6">Sign in to manage your notification preferences.</p>
              <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold">
                <a href="/login">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const unreadCount = inAppNotifs?.filter(n => !n.isRead).length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-7 h-7 text-primary" />
              <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground font-bold">{unreadCount} unread</Badge>
              )}
            </div>
            <p className="text-muted-foreground">Manage your notification preferences and view your notification history.</p>
          </div>

          <Tabs defaultValue="inbox">
            <TabsList className="mb-6 bg-card border border-border">
              <TabsTrigger value="inbox" className="gap-2">
                <Bell className="w-4 h-4" /> Inbox {unreadCount > 0 && <Badge className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Settings className="w-4 h-4" /> Preferences
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Clock className="w-4 h-4" /> History
              </TabsTrigger>
            </TabsList>

            {/* ─── INBOX TAB ─────────────────────────────────────────────────── */}
            <TabsContent value="inbox">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg">Notification Center</CardTitle>
                  {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
                      Mark All Read
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {!inAppNotifs || inAppNotifs.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <p className="text-muted-foreground">No notifications yet.</p>
                      <p className="text-sm text-muted-foreground mt-1">You'll see daily picks, alerts, and updates here.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {inAppNotifs.map((notif) => (
                        <div
                          key={notif.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${!notif.isRead ? "border-primary/30 bg-primary/5" : "border-border bg-transparent"}`}
                          onClick={() => !notif.isRead && markRead.mutate({ notificationId: notif.id })}
                        >
                          <div className="mt-0.5 shrink-0">
                            {notifTypeIcons[notif.type] || <Bell className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`font-semibold text-sm ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                {notif.title}
                              </p>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">{notif.message}</p>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Test notification */}
              <Card className="bg-card border-border mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Test Notifications</CardTitle>
                  <CardDescription>Send a test notification to verify your setup.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendTest.mutate({ type: "in_app" })}
                    disabled={sendTest.isPending}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Send Test In-App Notification
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── PREFERENCES TAB ───────────────────────────────────────────── */}
            <TabsContent value="preferences">
              <div className="space-y-6">
                {/* Email Preferences */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">Email Notifications</CardTitle>
                    </div>
                    <CardDescription>Receive updates directly to your email inbox.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Enable Email Notifications</p>
                        <p className="text-xs text-muted-foreground">Master toggle for all email alerts</p>
                      </div>
                      <Switch
                        checked={prefs?.emailEnabled ?? true}
                        onCheckedChange={(v) => handleToggle("emailEnabled", v)}
                        disabled={saving}
                      />
                    </div>
                    <Separator />
                    {[
                      { field: "emailDailyPicks", label: "Daily Picks", desc: "Get today's top AI picks every morning", icon: <Trophy className="w-4 h-4 text-amber-400" /> },
                      { field: "emailDailyDigest", label: "Daily Digest", desc: "Performance summary and stats recap", icon: <TrendingUp className="w-4 h-4 text-blue-400" /> },
                      { field: "emailSubscriptionConfirm", label: "Subscription Confirmations", desc: "Receipts and subscription status updates", icon: <CheckCircle className="w-4 h-4 text-green-400" /> },
                      { field: "emailLoginAlert", label: "Login Alerts", desc: "Security alert when a new login is detected", icon: <Shield className="w-4 h-4 text-yellow-400" /> },
                      { field: "emailPerformanceSummary", label: "Performance Summary", desc: "Weekly and monthly betting performance reports", icon: <Zap className="w-4 h-4 text-purple-400" /> },
                    ].map(({ field, label, desc, icon }) => (
                      <div key={field} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {icon}
                          <div>
                            <p className="font-medium text-sm">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                        </div>
                        <Switch
                          checked={prefs?.[field as keyof typeof prefs] as boolean ?? true}
                          onCheckedChange={(v) => handleToggle(field, v)}
                          disabled={saving || !prefs?.emailEnabled}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* SMS Preferences */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      <CardTitle className="text-lg">SMS Notifications</CardTitle>
                    </div>
                    <CardDescription>Get instant text alerts on your phone.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Enable SMS Notifications</p>
                        <p className="text-xs text-muted-foreground">Requires a verified phone number</p>
                      </div>
                      <Switch
                        checked={prefs?.smsEnabled ?? false}
                        onCheckedChange={(v) => handleToggle("smsEnabled", v)}
                        disabled={saving}
                      />
                    </div>

                    {/* Phone number input */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Phone Number</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="+1 555 000 0000"
                          value={smsPhone || prefs?.smsPhone || ""}
                          onChange={(e) => setSmsPhone(e.target.value)}
                          className="bg-background border-border"
                        />
                        <Button variant="outline" size="sm" onClick={handleSavePhone} disabled={saving || !smsPhone.trim()}>
                          Save
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Include country code (e.g., +1 for US)</p>
                    </div>

                    <Separator />
                    {[
                      { field: "smsDailyPicks", label: "Daily Picks SMS", desc: "Text alert with today's top picks" },
                      { field: "smsDailyDigest", label: "Daily Digest SMS", desc: "Short summary of daily performance" },
                      { field: "smsSubscriptionConfirm", label: "Subscription SMS", desc: "Text confirmation when subscription activates" },
                      { field: "smsLoginAlert", label: "Login Alert SMS", desc: "Instant text when new login detected" },
                    ].map(({ field, label, desc }) => (
                      <div key={field} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={prefs?.[field as keyof typeof prefs] as boolean ?? false}
                          onCheckedChange={(v) => handleToggle(field, v)}
                          disabled={saving || !prefs?.smsEnabled}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* In-App Preferences */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-400" />
                      <CardTitle className="text-lg">In-App Notifications</CardTitle>
                    </div>
                    <CardDescription>Notifications shown inside the ChalkPicks Pro app.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Enable In-App Notifications</p>
                        <p className="text-xs text-muted-foreground">Show notification bell with unread count</p>
                      </div>
                      <Switch
                        checked={prefs?.inAppEnabled ?? true}
                        onCheckedChange={(v) => handleToggle("inAppEnabled", v)}
                        disabled={saving}
                      />
                    </div>
                    <Separator />
                    {[
                      { field: "inAppDailyPicks", label: "Daily Picks Alert", desc: "In-app alert when new picks are available" },
                      { field: "inAppPerformance", label: "Performance Updates", desc: "Alerts for notable performance milestones" },
                    ].map(({ field, label, desc }) => (
                      <div key={field} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={prefs?.[field as keyof typeof prefs] as boolean ?? true}
                          onCheckedChange={(v) => handleToggle(field, v)}
                          disabled={saving || !prefs?.inAppEnabled}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── HISTORY TAB ───────────────────────────────────────────────── */}
            <TabsContent value="history">
              <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Notification History</CardTitle>
                  <CardDescription>Log of all notifications sent to you.</CardDescription>
                </CardHeader>
                <CardContent>
                  {!history || history.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <p className="text-muted-foreground">No notification history yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {history.map((log) => (
                        <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                          <div className="shrink-0">
                            {log.channel === "email" ? <Mail className="w-4 h-4 text-blue-400" /> :
                             log.channel === "sms" ? <MessageSquare className="w-4 h-4 text-green-400" /> :
                             <Bell className="w-4 h-4 text-slate-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{notifTypeLabels[log.type] || log.type}</span>
                              <Badge variant="outline" className="text-xs capitalize">{log.channel}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{log.subject || log.recipient}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`flex items-center gap-1 text-xs font-medium ${statusColors[log.status]}`}>
                              {log.status === "sent" ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {log.status}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {log.sentAt ? new Date(log.sentAt).toLocaleDateString() : new Date(log.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
