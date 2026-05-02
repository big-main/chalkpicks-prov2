import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { getDb } from "./db";
import { notificationLogs, notificationPreferences, notifications, picks, users } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// ─── Initialize Clients ───────────────────────────────────────────────────────
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE_FROM = process.env.TWILIO_PHONE_FROM || "";
const APP_NAME = "ChalkPicks Pro";
const APP_URL = process.env.APP_URL || "https://www.chalkpicks.live";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@chalkpicks.ml";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

let twilioClient: ReturnType<typeof twilio> | null = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotificationType =
  | "login_alert"
  | "subscription_confirm"
  | "daily_picks"
  | "daily_digest"
  | "performance_summary"
  | "system";

export type NotificationChannel = "email" | "sms" | "in_app";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendSmsOptions {
  to: string;
  body: string;
}

// ─── Email Templates ──────────────────────────────────────────────────────────
const emailBase = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
  <style>
    body { margin: 0; padding: 0; background: #0a0a0f; font-family: 'Segoe UI', Arial, sans-serif; color: #e2e8f0; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { text-align: center; padding: 24px 0; border-bottom: 1px solid #1e293b; margin-bottom: 32px; }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #f59e0b; }
    .logo span { color: #22c55e; }
    .card { background: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 28px; margin-bottom: 24px; }
    .badge { display: inline-block; background: #f59e0b22; color: #f59e0b; border: 1px solid #f59e0b44; border-radius: 6px; padding: 4px 12px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
    .badge.green { background: #22c55e22; color: #22c55e; border-color: #22c55e44; }
    h1 { margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #f1f5f9; }
    h2 { margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #f1f5f9; }
    p { margin: 0 0 16px; line-height: 1.6; color: #94a3b8; font-size: 15px; }
    .pick-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .pick-sport { font-size: 11px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .pick-rec { font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }
    .pick-meta { font-size: 13px; color: #64748b; }
    .confidence { display: inline-block; background: #22c55e22; color: #22c55e; border-radius: 4px; padding: 2px 8px; font-size: 12px; font-weight: 700; }
    .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 8px 0; }
    .divider { border: none; border-top: 1px solid #1e293b; margin: 24px 0; }
    .footer { text-align: center; padding-top: 24px; color: #475569; font-size: 13px; }
    .footer a { color: #f59e0b; text-decoration: none; }
    .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e293b; }
    .stat-label { color: #64748b; font-size: 14px; }
    .stat-value { color: #f1f5f9; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">CHALK<span>PICKS</span> PRO</div>
      <p style="margin:8px 0 0;font-size:13px;color:#475569;">AI-Powered Sports Betting Intelligence</p>
    </div>
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME} · <a href="${APP_URL}/notifications">Manage Notifications</a> · <a href="${APP_URL}">Visit Site</a></p>
      <p style="margin-top:8px;">You're receiving this because you subscribed to ${APP_NAME}.</p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  loginAlert: (name: string, time: string, ip?: string) => ({
    subject: `🔐 New Login to Your ${APP_NAME} Account`,
    html: emailBase(`
      <div class="card">
        <div class="badge">Security Alert</div>
        <h1>New Login Detected</h1>
        <p>Hi ${name}, we noticed a new sign-in to your ${APP_NAME} account.</p>
        <div class="stat-row"><span class="stat-label">Time</span><span class="stat-value">${time}</span></div>
        <div class="stat-row"><span class="stat-label">IP Address</span><span class="stat-value">${ip || "Unknown"}</span></div>
        <hr class="divider" />
        <p>If this was you, no action is needed. If you didn't sign in, please secure your account immediately.</p>
        <a href="${APP_URL}" class="btn">Secure My Account</a>
      </div>
    `),
    text: `New login to your ${APP_NAME} account at ${time}. If this wasn't you, please secure your account at ${APP_URL}.`,
  }),

  subscriptionConfirm: (name: string, tier: string, expiresAt: string) => ({
    subject: `🎉 Welcome to ${APP_NAME} ${tier} — You're All Set!`,
    html: emailBase(`
      <div class="card">
        <div class="badge green">Subscription Active</div>
        <h1>You're Now a ${tier} Member!</h1>
        <p>Hi ${name}, your ${APP_NAME} ${tier} subscription is now active. Get ready for AI-powered picks and expert analysis.</p>
        <div class="stat-row"><span class="stat-label">Plan</span><span class="stat-value">${tier}</span></div>
        <div class="stat-row"><span class="stat-label">Valid Until</span><span class="stat-value">${expiresAt}</span></div>
        <div class="stat-row"><span class="stat-label">Features</span><span class="stat-value">AI Picks, Backtesting, Stats</span></div>
        <hr class="divider" />
        <p>You now have access to all premium picks, advanced backtesting, real-time stats, and daily AI analysis.</p>
        <a href="${APP_URL}/picks" class="btn">View Today's Picks</a>
      </div>
    `),
    text: `Welcome to ${APP_NAME} ${tier}! Your subscription is active until ${expiresAt}. Visit ${APP_URL}/picks to see today's picks.`,
  }),

  dailyPicks: (name: string, picksData: Array<{ sport: string; recommendation: string; confidence: number; odds: number }>) => ({
    subject: `🏆 Today's AI Picks Are Ready — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`,
    html: emailBase(`
      <div class="card">
        <div class="badge">Daily Picks</div>
        <h1>Today's Top Picks</h1>
        <p>Hi ${name}, our AI has analyzed today's games and identified the highest-edge opportunities for you.</p>
        ${picksData.slice(0, 5).map(p => `
          <div class="pick-card">
            <div class="pick-sport">${p.sport}</div>
            <div class="pick-rec">${p.recommendation}</div>
            <div class="pick-meta">Odds: ${p.odds > 0 ? "+" : ""}${p.odds} &nbsp;|&nbsp; <span class="confidence">${p.confidence}% Confidence</span></div>
          </div>
        `).join("")}
        <hr class="divider" />
        <a href="${APP_URL}/picks" class="btn">View Full Analysis</a>
      </div>
    `),
    text: `Today's top picks from ${APP_NAME}: ${picksData.slice(0, 3).map(p => `${p.sport}: ${p.recommendation} (${p.confidence}% confidence)`).join(", ")}. Visit ${APP_URL}/picks for full analysis.`,
  }),

  dailyDigest: (name: string, stats: { totalPicks: number; wins: number; losses: number; winRate: number; roi: number }, topPick: { recommendation: string; sport: string; confidence: number } | null) => ({
    subject: `📊 Your Daily ${APP_NAME} Digest — ${new Date().toLocaleDateString()}`,
    html: emailBase(`
      <div class="card">
        <div class="badge">Daily Digest</div>
        <h1>Your Daily Performance Summary</h1>
        <p>Hi ${name}, here's your ChalkPicks Pro summary for ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.</p>
        <div class="stat-row"><span class="stat-label">Total Picks Today</span><span class="stat-value">${stats.totalPicks}</span></div>
        <div class="stat-row"><span class="stat-label">Win / Loss</span><span class="stat-value">${stats.wins}W — ${stats.losses}L</span></div>
        <div class="stat-row"><span class="stat-label">Win Rate</span><span class="stat-value">${stats.winRate.toFixed(1)}%</span></div>
        <div class="stat-row"><span class="stat-label">ROI</span><span class="stat-value" style="color:${stats.roi >= 0 ? "#22c55e" : "#ef4444"}">${stats.roi >= 0 ? "+" : ""}${stats.roi.toFixed(1)}%</span></div>
        ${topPick ? `
        <hr class="divider" />
        <h2>Top Pick of the Day</h2>
        <div class="pick-card">
          <div class="pick-sport">${topPick.sport}</div>
          <div class="pick-rec">${topPick.recommendation}</div>
          <div class="pick-meta"><span class="confidence">${topPick.confidence}% Confidence</span></div>
        </div>
        ` : ""}
        <hr class="divider" />
        <a href="${APP_URL}/dashboard" class="btn">View Full Dashboard</a>
      </div>
    `),
    text: `Your ${APP_NAME} daily digest: ${stats.totalPicks} picks, ${stats.wins}W-${stats.losses}L, ${stats.winRate.toFixed(1)}% win rate, ${stats.roi >= 0 ? "+" : ""}${stats.roi.toFixed(1)}% ROI. Visit ${APP_URL}/dashboard for details.`,
  }),

  performanceSummary: (name: string, period: string, stats: { totalBets: number; wins: number; losses: number; winRate: number; roi: number; profit: number }) => ({
    subject: `📈 Your ${period} Performance Summary — ${APP_NAME}`,
    html: emailBase(`
      <div class="card">
        <div class="badge">Performance Report</div>
        <h1>${period} Performance Summary</h1>
        <p>Hi ${name}, here's your ${period.toLowerCase()} betting performance on ${APP_NAME}.</p>
        <div class="stat-row"><span class="stat-label">Total Bets</span><span class="stat-value">${stats.totalBets}</span></div>
        <div class="stat-row"><span class="stat-label">Record</span><span class="stat-value">${stats.wins}W — ${stats.losses}L</span></div>
        <div class="stat-row"><span class="stat-label">Win Rate</span><span class="stat-value">${stats.winRate.toFixed(1)}%</span></div>
        <div class="stat-row"><span class="stat-label">ROI</span><span class="stat-value" style="color:${stats.roi >= 0 ? "#22c55e" : "#ef4444"}">${stats.roi >= 0 ? "+" : ""}${stats.roi.toFixed(1)}%</span></div>
        <div class="stat-row"><span class="stat-label">Net Profit</span><span class="stat-value" style="color:${stats.profit >= 0 ? "#22c55e" : "#ef4444"}">${stats.profit >= 0 ? "+" : ""}$${Math.abs(stats.profit).toFixed(2)}</span></div>
        <hr class="divider" />
        <a href="${APP_URL}/dashboard" class="btn">View Full Stats</a>
      </div>
    `),
    text: `Your ${period} ${APP_NAME} performance: ${stats.wins}W-${stats.losses}L, ${stats.winRate.toFixed(1)}% win rate, ${stats.roi >= 0 ? "+" : ""}${stats.roi.toFixed(1)}% ROI. Visit ${APP_URL}/dashboard.`,
  }),
};

// ─── SMS Templates ────────────────────────────────────────────────────────────
export const smsTemplates = {
  loginAlert: (time: string) =>
    `[${APP_NAME}] New login detected at ${time}. If this wasn't you, secure your account at ${APP_URL}`,

  subscriptionConfirm: (tier: string) =>
    `[${APP_NAME}] 🎉 Your ${tier} subscription is now active! View today's picks: ${APP_URL}/picks`,

  dailyPicks: (count: number, topPick: string) =>
    `[${APP_NAME}] 🏆 ${count} new picks today! Top pick: ${topPick}. View all: ${APP_URL}/picks`,

  dailyDigest: (wins: number, losses: number, roi: number) =>
    `[${APP_NAME}] 📊 Daily digest: ${wins}W-${losses}L, ROI: ${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%. Full stats: ${APP_URL}/dashboard`,
};

// ─── Core Send Functions ──────────────────────────────────────────────────────
async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.log(`[Notifications] Email skipped (no SendGrid key): ${options.subject} → ${options.to}`);
    return false;
  }
  try {
    await sgMail.send({
      to: options.to,
      from: { email: FROM_EMAIL, name: APP_NAME },
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject,
    });
    console.log(`[Notifications] Email sent: ${options.subject} → ${options.to}`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Notifications] Email failed: ${msg}`);
    return false;
  }
}

async function sendSms(options: SendSmsOptions): Promise<boolean> {
  if (!twilioClient || !TWILIO_PHONE_FROM) {
    console.log(`[Notifications] SMS skipped (no Twilio config): ${options.to}`);
    return false;
  }
  try {
    await twilioClient.messages.create({
      body: options.body,
      from: TWILIO_PHONE_FROM,
      to: options.to,
    });
    console.log(`[Notifications] SMS sent to ${options.to}`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Notifications] SMS failed: ${msg}`);
    return false;
  }
}

// ─── Log Notification ─────────────────────────────────────────────────────────
async function logNotification(
  userId: number,
  channel: "email" | "sms" | "in_app",
  type: NotificationType,
  recipient: string,
  subject: string,
  status: "sent" | "failed" | "pending",
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(notificationLogs).values({
      userId,
      channel,
      type,
      recipient,
      subject,
      status,
      errorMessage: errorMessage || null,
      sentAt: status === "sent" ? new Date() : null,
    });
  } catch (err) {
    console.error("[Notifications] Failed to log notification:", err);
  }
}

// ─── Create In-App Notification ───────────────────────────────────────────────
async function createInAppNotification(
  userId: number,
  type: "daily_picks" | "subscription" | "performance" | "system",
  title: string,
  message: string
) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(notifications).values({ userId, type, title, message });
  } catch (err) {
    console.error("[Notifications] Failed to create in-app notification:", err);
  }
}

// ─── Get User Preferences ─────────────────────────────────────────────────────
async function getUserPrefs(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return rows[0] || null;
}

// ─── Ensure Default Preferences Exist ────────────────────────────────────────
export async function ensureUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserPrefs(userId);
  if (!existing) {
    await db.insert(notificationPreferences).values({ userId }).onDuplicateKeyUpdate({ set: { userId } });
  }
}

// ─── Notification Dispatchers ─────────────────────────────────────────────────

/**
 * Send login alert to user
 */
export async function sendLoginAlert(userId: number, userEmail: string, userName: string, ip?: string) {
  const prefs = await getUserPrefs(userId);
  const time = new Date().toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });

  // Email
  if (!prefs || (prefs.emailEnabled && prefs.emailLoginAlert)) {
    const tpl = emailTemplates.loginAlert(userName || "there", time, ip);
    const ok = await sendEmail({ to: userEmail, ...tpl });
    await logNotification(userId, "email", "login_alert", userEmail, tpl.subject, ok ? "sent" : "failed");
  }

  // SMS
  if (prefs?.smsEnabled && prefs.smsLoginAlert && prefs.smsPhone) {
    const body = smsTemplates.loginAlert(time);
    const ok = await sendSms({ to: prefs.smsPhone, body });
    await logNotification(userId, "sms", "login_alert", prefs.smsPhone, "Login Alert", ok ? "sent" : "failed");
  }

  // In-app
  if (!prefs || prefs.inAppEnabled) {
    await createInAppNotification(userId, "system", "New Login Detected", `A new login was detected at ${time}.`);
  }
}

/**
 * Send subscription confirmation to user
 */
export async function sendSubscriptionConfirmation(
  userId: number,
  userEmail: string,
  userName: string,
  tier: string,
  expiresAt: Date,
  smsPhone?: string
) {
  const prefs = await getUserPrefs(userId);
  const expiresStr = expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  // Email
  if (!prefs || (prefs.emailEnabled && prefs.emailSubscriptionConfirm)) {
    const tpl = emailTemplates.subscriptionConfirm(userName || "there", tierLabel, expiresStr);
    const ok = await sendEmail({ to: userEmail, ...tpl });
    await logNotification(userId, "email", "subscription_confirm", userEmail, tpl.subject, ok ? "sent" : "failed");
  }

  // SMS
  const phone = smsPhone || prefs?.smsPhone;
  if (prefs?.smsEnabled && prefs.smsSubscriptionConfirm && phone) {
    const body = smsTemplates.subscriptionConfirm(tierLabel);
    const ok = await sendSms({ to: phone, body });
    await logNotification(userId, "sms", "subscription_confirm", phone, "Subscription Confirmed", ok ? "sent" : "failed");
  }

  // In-app
  if (!prefs || prefs.inAppEnabled) {
    await createInAppNotification(userId, "subscription", `${tierLabel} Subscription Active`, `Your ${tierLabel} subscription is now active until ${expiresStr}.`);
  }
}

/**
 * Send daily picks notification to all subscribed users
 */
export async function sendDailyPicksToAllUsers() {
  const db = await getDb();
  if (!db) return;

  console.log("[Notifications] Sending daily picks notifications...");

  // Get today's top picks
  const today = new Date().toISOString().split("T")[0];
  const todayPicks = await db
    .select()
    .from(picks)
    .where(and(eq(picks.pickDate, today), eq(picks.isActive, true)))
    .orderBy(desc(picks.confidenceScore))
    .limit(10);

  if (todayPicks.length === 0) {
    console.log("[Notifications] No picks available for today, skipping daily picks notifications.");
    return;
  }

  const picksData = todayPicks.map(p => ({
    sport: p.sportKey.toUpperCase(),
    recommendation: p.recommendation,
    confidence: p.confidenceScore,
    odds: p.odds || 0,
  }));

  // Get all subscribed users with email notifications enabled
  const subscribedUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      subscriptionTier: users.subscriptionTier,
    })
    .from(users)
    .where(eq(users.subscriptionTier, "monthly"));

  // Also get daily and yearly subscribers
  const dailyUsers = await db.select({ id: users.id, name: users.name, email: users.email, subscriptionTier: users.subscriptionTier }).from(users).where(eq(users.subscriptionTier, "daily"));
  const yearlyUsers = await db.select({ id: users.id, name: users.name, email: users.email, subscriptionTier: users.subscriptionTier }).from(users).where(eq(users.subscriptionTier, "yearly"));

  const allSubscribers = [...subscribedUsers, ...dailyUsers, ...yearlyUsers];
  console.log(`[Notifications] Sending daily picks to ${allSubscribers.length} subscribers...`);

  for (const user of allSubscribers) {
    if (!user.email) continue;
    const prefs = await getUserPrefs(user.id);

    // Email
    if (!prefs || (prefs.emailEnabled && prefs.emailDailyPicks)) {
      const tpl = emailTemplates.dailyPicks(user.name || "there", picksData);
      const ok = await sendEmail({ to: user.email, ...tpl });
      await logNotification(user.id, "email", "daily_picks", user.email, tpl.subject, ok ? "sent" : "failed");
    }

    // SMS
    if (prefs?.smsEnabled && prefs.smsDailyPicks && prefs.smsPhone) {
      const topPick = picksData[0];
      const body = smsTemplates.dailyPicks(picksData.length, topPick?.recommendation || "");
      const ok = await sendSms({ to: prefs.smsPhone, body });
      await logNotification(user.id, "sms", "daily_picks", prefs.smsPhone, "Daily Picks", ok ? "sent" : "failed");
    }

    // In-app
    if (!prefs || (prefs.inAppEnabled && prefs.inAppDailyPicks)) {
      await createInAppNotification(user.id, "daily_picks", `${picksData.length} New Picks Today`, `Today's top pick: ${picksData[0]?.recommendation || "View picks"}`);
    }
  }

  console.log(`[Notifications] Daily picks notifications sent to ${allSubscribers.length} users.`);
}

/**
 * Send daily digest to all users with digest enabled
 */
export async function sendDailyDigestToAllUsers() {
  const db = await getDb();
  if (!db) return;

  console.log("[Notifications] Sending daily digest notifications...");

  const today = new Date().toISOString().split("T")[0];
  const todayPicks = await db
    .select()
    .from(picks)
    .where(eq(picks.pickDate, today))
    .orderBy(desc(picks.confidenceScore))
    .limit(1);

  const topPick = todayPicks[0] || null;

  // Get all users with email enabled
  const allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users);

  for (const user of allUsers) {
    if (!user.email) continue;
    const prefs = await getUserPrefs(user.id);
    if (prefs && (!prefs.emailEnabled || !prefs.emailDailyDigest)) continue;

    // Build simple stats (mock for now, real data from user bets)
    const digestStats = { totalPicks: todayPicks.length, wins: 0, losses: 0, winRate: 0, roi: 0 };

    const tpl = emailTemplates.dailyDigest(
      user.name || "there",
      digestStats,
      topPick ? { recommendation: topPick.recommendation, sport: topPick.sportKey.toUpperCase(), confidence: topPick.confidenceScore } : null
    );
    const ok = await sendEmail({ to: user.email, ...tpl });
    await logNotification(user.id, "email", "daily_digest", user.email, tpl.subject, ok ? "sent" : "failed");

    // SMS digest
    if (prefs?.smsEnabled && prefs.smsDailyDigest && prefs.smsPhone) {
      const body = smsTemplates.dailyDigest(digestStats.wins, digestStats.losses, digestStats.roi);
      const ok2 = await sendSms({ to: prefs.smsPhone, body });
      await logNotification(user.id, "sms", "daily_digest", prefs.smsPhone, "Daily Digest", ok2 ? "sent" : "failed");
    }
  }

  console.log("[Notifications] Daily digest sent.");
}

/**
 * Get notification history for a user
 */
export async function getUserNotificationHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.userId, userId))
    .orderBy(desc(notificationLogs.createdAt))
    .limit(limit);
}

/**
 * Get in-app notifications for a user
 */
export async function getUserInAppNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Mark in-app notification as read
 */
export async function markNotificationRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}
