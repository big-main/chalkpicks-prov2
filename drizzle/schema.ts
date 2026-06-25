import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 256 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "trial", "daily", "monthly", "yearly"]).default("free").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  totalBets: int("totalBets").default(0).notNull(),
  winningBets: int("winningBets").default(0).notNull(),
  totalProfit: decimal("totalProfit", { precision: 10, scale: 2 }).default("0").notNull(),
  accountBalance: decimal("accountBalance", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  ageVerified: boolean("ageVerified").default(false).notNull(),
  experienceLevel: mysqlEnum("experienceLevel", ["brand_new", "just_started", "few_months", "experienced_unprofitable", "experienced_profitable", "years_in"]),
  bettingFrequency: mysqlEnum("bettingFrequency", ["occasionally", "few_times_week", "multiple_times_day"]),
  weeklyBetSize: mysqlEnum("weeklyBetSize", ["under_100", "100_500", "1000_5000", "over_5000"]),
  onboardingIntent: text("onboardingIntent"),
  accessTier: mysqlEnum("accessTier", ["free", "recreational", "serious", "professional"]).default("free").notNull(),
  applicationStatus: mysqlEnum("applicationStatus", ["not_applied", "pending", "approved", "rejected"]).default("not_applied").notNull(),
  applicationReviewedAt: timestamp("applicationReviewedAt"),
  applicationReviewedBy: int("applicationReviewedBy"),
  onboardingCompletedAt: timestamp("onboardingCompletedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Sports ───────────────────────────────────────────────────────────────────
export const sports = mysqlTable("sports", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  icon: varchar("icon", { length: 16 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type Sport = typeof sports.$inferSelect;

// ─── Teams ────────────────────────────────────────────────────────────────────
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  sportKey: varchar("sportKey", { length: 32 }).notNull(),
  externalId: varchar("externalId", { length: 64 }),
  name: varchar("name", { length: 128 }).notNull(),
  abbreviation: varchar("abbreviation", { length: 16 }),
  city: varchar("city", { length: 64 }),
  logoUrl: varchar("logoUrl", { length: 512 }),
  conference: varchar("conference", { length: 64 }),
  division: varchar("division", { length: 64 }),
  wins: int("wins").default(0),
  losses: int("losses").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;

// ─── Players ──────────────────────────────────────────────────────────────────
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }),
  teamId: int("teamId"),
  sportKey: varchar("sportKey", { length: 32 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  position: varchar("position", { length: 32 }),
  jerseyNumber: varchar("jerseyNumber", { length: 8 }),
  imageUrl: varchar("imageUrl", { length: 512 }),
  status: mysqlEnum("status", ["active", "injured", "questionable", "out", "inactive"]).default("active"),
  injuryNote: text("injuryNote"),
  stats: json("stats"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;

// ─── Games ────────────────────────────────────────────────────────────────────
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).unique(),
  sportKey: varchar("sportKey", { length: 32 }).notNull(),
  homeTeamId: int("homeTeamId"),
  awayTeamId: int("awayTeamId"),
  homeTeamName: varchar("homeTeamName", { length: 128 }),
  awayTeamName: varchar("awayTeamName", { length: 128 }),
  homeScore: int("homeScore"),
  awayScore: int("awayScore"),
  status: mysqlEnum("status", ["scheduled", "live", "final", "postponed", "cancelled"]).default("scheduled").notNull(),
  gameTime: timestamp("gameTime").notNull(),
  venue: varchar("venue", { length: 128 }),
  homeMoneyline: int("homeMoneyline"),
  awayMoneyline: int("awayMoneyline"),
  spread: decimal("spread", { precision: 4, scale: 1 }),
  overUnder: decimal("overUnder", { precision: 5, scale: 1 }),
  homeSpreadOdds: int("homeSpreadOdds"),
  awaySpreadOdds: int("awaySpreadOdds"),
  rawOddsData: json("rawOddsData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Game = typeof games.$inferSelect;

// ─── Picks ────────────────────────────────────────────────────────────────────
export const picks = mysqlTable("picks", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId"),
  sportKey: varchar("sportKey", { length: 32 }).notNull(),
  pickDate: varchar("pickDate", { length: 16 }).notNull(),
  pickType: mysqlEnum("pickType", ["moneyline", "spread", "over_under", "player_prop", "parlay"]).notNull(),
  tier: mysqlEnum("tier", ["free", "premium"]).default("free").notNull(),
  homeTeam: varchar("homeTeam", { length: 128 }),
  awayTeam: varchar("awayTeam", { length: 128 }),
  recommendation: varchar("recommendation", { length: 256 }).notNull(),
  odds: int("odds"),
  confidenceScore: int("confidenceScore").notNull(),
  edgeScore: decimal("edgeScore", { precision: 5, scale: 2 }),
  aiAnalysis: text("aiAnalysis"),
  keyFactors: json("keyFactors"),
  result: mysqlEnum("result", ["win", "loss", "push", "pending"]).default("pending").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pick = typeof picks.$inferSelect;
export type InsertPick = typeof picks.$inferInsert;

// ─── Player Props ─────────────────────────────────────────────────────────────
export const playerProps = mysqlTable("player_props", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId"),
  playerId: int("playerId"),
  sportKey: varchar("sportKey", { length: 32 }).notNull(),
  pickDate: varchar("pickDate", { length: 16 }).notNull(),
  playerName: varchar("playerName", { length: 128 }).notNull(),
  teamName: varchar("teamName", { length: 128 }),
  propType: varchar("propType", { length: 64 }).notNull(),
  line: decimal("line", { precision: 6, scale: 1 }).notNull(),
  recommendation: mysqlEnum("recommendation", ["over", "under"]).notNull(),
  odds: int("odds"),
  confidenceScore: int("confidenceScore").notNull(),
  edgeScore: decimal("edgeScore", { precision: 5, scale: 2 }),
  aiAnalysis: text("aiAnalysis"),
  tier: mysqlEnum("tier", ["free", "premium"]).default("free").notNull(),
  result: mysqlEnum("result", ["win", "loss", "push", "pending"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerProp = typeof playerProps.$inferSelect;

// ─── User Bets ────────────────────────────────────────────────────────────────
export const userBets = mysqlTable("user_bets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  pickId: int("pickId"),
  sportKey: varchar("sportKey", { length: 32 }).notNull(),
  description: varchar("description", { length: 256 }).notNull(),
  betType: mysqlEnum("betType", ["moneyline", "spread", "over_under", "player_prop", "parlay", "other"]).notNull(),
  stake: decimal("stake", { precision: 10, scale: 2 }).notNull(),
  odds: int("odds").notNull(),
  potentialPayout: decimal("potentialPayout", { precision: 10, scale: 2 }),
  result: mysqlEnum("result", ["win", "loss", "push", "pending"]).default("pending").notNull(),
  profit: decimal("profit", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  betDate: varchar("betDate", { length: 16 }).notNull(),
  settledAt: timestamp("settledAt"),
  closingLineOdds: int("closingLineOdds"),
  closingLineTime: timestamp("closingLineTime"),
  clvValue: decimal("clvValue", { precision: 5, scale: 2 }),
  lineMovement: int("lineMovement"),
  sharpMoney: boolean("sharpMoney").default(false),
  bookmakerName: varchar("bookmakerName", { length: 64 }),
  betPlacedTime: timestamp("betPlacedTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserBet = typeof userBets.$inferSelect;
export type InsertUserBet = typeof userBets.$inferInsert;

// ─── Backtests ────────────────────────────────────────────────────────────────
export const backtests = mysqlTable("backtests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  sportKey: varchar("sportKey", { length: 32 }),
  pickType: varchar("pickType", { length: 32 }),
  minConfidence: int("minConfidence").default(0),
  dateFrom: varchar("dateFrom", { length: 16 }).notNull(),
  dateTo: varchar("dateTo", { length: 16 }).notNull(),
  totalPicks: int("totalPicks").default(0).notNull(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  pushes: int("pushes").default(0).notNull(),
  winRate: decimal("winRate", { precision: 5, scale: 2 }),
  roi: decimal("roi", { precision: 8, scale: 2 }),
  totalProfit: decimal("totalProfit", { precision: 10, scale: 2 }),
  results: json("results"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Backtest = typeof backtests.$inferSelect;
export type InsertBacktest = typeof backtests.$inferInsert;

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export const leaderboard = mysqlTable("leaderboard", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 128 }),
  totalBets: int("totalBets").default(0).notNull(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  winRate: decimal("winRate", { precision: 5, scale: 2 }).default("0"),
  roi: decimal("roi", { precision: 8, scale: 2 }).default("0"),
  totalProfit: decimal("totalProfit", { precision: 10, scale: 2 }).default("0"),
  streak: int("streak").default(0),
  rank: int("rank"),
  badge: varchar("badge", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeaderboardEntry = typeof leaderboard.$inferSelect;

// ─── Subscription Orders ──────────────────────────────────────────────────────
export const subscriptionOrders = mysqlTable("subscription_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  tier: mysqlEnum("tier", ["trial", "daily", "monthly", "yearly"]).notNull(),
  status: mysqlEnum("status", ["pending", "active", "cancelled", "expired"]).default("pending").notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 8 }).default("usd").notNull(),
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionOrder = typeof subscriptionOrders.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["daily_picks", "subscription", "performance", "system"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Pick Stats ───────────────────────────────────────────────────────────────
export const pickStats = mysqlTable("pick_stats", {
  id: int("id").autoincrement().primaryKey(),
  sportKey: varchar("sportKey", { length: 32 }).notNull(),
  period: varchar("period", { length: 16 }).notNull(),
  totalPicks: int("totalPicks").default(0).notNull(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  pushes: int("pushes").default(0).notNull(),
  winRate: decimal("winRate", { precision: 5, scale: 2 }),
  roi: decimal("roi", { precision: 8, scale: 2 }),
  avgConfidence: decimal("avgConfidence", { precision: 5, scale: 2 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PickStat = typeof pickStats.$inferSelect;

// ─── Pick Feedback ────────────────────────────────────────────────────────────
export const pickFeedback = mysqlTable("pick_feedback", {
  id: int("id").autoincrement().primaryKey(),
  pickId: int("pickId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]).default("neutral").notNull(),
  wasHelpful: boolean("wasHelpful"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PickFeedback = typeof pickFeedback.$inferSelect;
export type InsertPickFeedback = typeof pickFeedback.$inferInsert;

// ─── Notification Preferences ────────────────────────────────────────────────
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Email notifications
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  emailDailyPicks: boolean("emailDailyPicks").default(true).notNull(),
  emailDailyDigest: boolean("emailDailyDigest").default(true).notNull(),
  emailSubscriptionConfirm: boolean("emailSubscriptionConfirm").default(true).notNull(),
  emailLoginAlert: boolean("emailLoginAlert").default(false).notNull(),
  emailPerformanceSummary: boolean("emailPerformanceSummary").default(true).notNull(),
  emailDigestTime: varchar("emailDigestTime", { length: 8 }).default("08:00").notNull(), // HH:MM format
  // SMS notifications
  smsEnabled: boolean("smsEnabled").default(false).notNull(),
  smsPhone: varchar("smsPhone", { length: 32 }),
  smsDailyPicks: boolean("smsDailyPicks").default(false).notNull(),
  smsDailyDigest: boolean("smsDailyDigest").default(false).notNull(),
  smsSubscriptionConfirm: boolean("smsSubscriptionConfirm").default(false).notNull(),
  smsLoginAlert: boolean("smsLoginAlert").default(false).notNull(),
  // In-app notifications
  inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
  inAppDailyPicks: boolean("inAppDailyPicks").default(true).notNull(),
  inAppPerformance: boolean("inAppPerformance").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

// ─── Notification Logs ────────────────────────────────────────────────────────
export const notificationLogs = mysqlTable("notification_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  channel: mysqlEnum("channel", ["email", "sms", "in_app"]).notNull(),
  type: mysqlEnum("type", ["login_alert", "subscription_confirm", "daily_picks", "daily_digest", "performance_summary", "system"]).notNull(),
  recipient: varchar("recipient", { length: 320 }), // email or phone
  subject: varchar("subject", { length: 256 }),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

// ─── Promo Codes ──────────────────────────────────────────────────────────────
export const promoCodes = mysqlTable("promo_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).unique().notNull(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
  discountValue: decimal("discountValue", { precision: 5, scale: 2 }).notNull(),
  tier: mysqlEnum("tier", ["daily", "monthly", "yearly"]).notNull(),
  maxUses: int("maxUses"),
  currentUses: int("currentUses").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  source: varchar("source", { length: 64 }), // "twitter", "email", "reddit", "affiliate", "launch"
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

// ─── Promo Code Usage Tracking ────────────────────────────────────────────────
export const promoCodeUsage = mysqlTable("promo_code_usage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  codeId: int("codeId").notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).notNull(),
  finalPrice: decimal("finalPrice", { precision: 10, scale: 2 }).notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromoCodeUsage = typeof promoCodeUsage.$inferSelect;
export type InsertPromoCodeUsage = typeof promoCodeUsage.$inferInsert;

// ─── Referral System ──────────────────────────────────────────────────────────
export const referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  code: varchar("code", { length: 32 }).unique().notNull(),
  discountPercentage: int("discountPercentage").default(10).notNull(),
  maxRedemptions: int("maxRedemptions"),
  currentRedemptions: int("currentRedemptions").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

// ─── Referrals (tracking who referred whom) ────────────────────────────────
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  referralCodeId: int("referralCodeId").notNull(),
  status: mysqlEnum("status", ["pending", "active", "cancelled"]).default("pending").notNull(),
  discountApplied: decimal("discountApplied", { precision: 10, scale: 2 }).default("0"),
  commissionEarned: decimal("commissionEarned", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// ─── Referral Rewards ─────────────────────────────────────────────────────
export const referralRewards = mysqlTable("referral_rewards", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referralId: int("referralId").notNull(),
  rewardType: mysqlEnum("rewardType", ["commission", "bonus_credit", "subscription_extension"]).notNull(),
  rewardAmount: decimal("rewardAmount", { precision: 10, scale: 2 }).notNull(),
  rewardValue: varchar("rewardValue", { length: 64 }),
  status: mysqlEnum("status", ["pending", "earned", "claimed"]).default("pending").notNull(),
  claimedAt: timestamp("claimedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralReward = typeof referralRewards.$inferSelect;
export type InsertReferralReward = typeof referralRewards.$inferInsert;


// ─── Arbitrage Opportunities ──────────────────────────────────────────────────
export const arbitrageOpportunities = mysqlTable("arbitrage_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 64 }).notNull(),
  sport: varchar("sport", { length: 32 }).notNull(),
  league: varchar("league", { length: 32 }).notNull(),
  matchup: varchar("matchup", { length: 256 }).notNull(),
  eventTime: timestamp("eventTime").notNull(),
  
  // Arbitrage details
  bookA: varchar("bookA", { length: 64 }).notNull(), // e.g., "DraftKings"
  bookB: varchar("bookB", { length: 64 }).notNull(), // e.g., "FanDuel"
  
  // Outcome A (e.g., Team 1 to win)
  outcomeA: varchar("outcomeA", { length: 256 }).notNull(),
  oddsA: decimal("oddsA", { precision: 6, scale: 2 }).notNull(), // American odds
  impliedProbabilityA: decimal("impliedProbabilityA", { precision: 5, scale: 4 }).notNull(),
  
  // Outcome B (e.g., Team 2 to win)
  outcomeB: varchar("outcomeB", { length: 256 }).notNull(),
  oddsB: decimal("oddsB", { precision: 6, scale: 2 }).notNull(),
  impliedProbabilityB: decimal("impliedProbabilityB", { precision: 5, scale: 4 }).notNull(),
  
  // Arbitrage metrics
  totalImpliedProbability: decimal("totalImpliedProbability", { precision: 5, scale: 4 }).notNull(),
  arbitragePercentage: decimal("arbitragePercentage", { precision: 5, scale: 4 }).notNull(), // e.g., 0.0245 = 2.45%
  profitPercentage: decimal("profitPercentage", { precision: 5, scale: 4 }).notNull(),
  
  // Stake calculation (for $100 total investment)
  stakeA: decimal("stakeA", { precision: 8, scale: 2 }).notNull(),
  stakeB: decimal("stakeB", { precision: 8, scale: 2 }).notNull(),
  guaranteedProfit: decimal("guaranteedProfit", { precision: 8, scale: 2 }).notNull(),
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  
  // Metadata
  source: varchar("source", { length: 64 }).default("api").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArbitrageOpportunity = typeof arbitrageOpportunities.$inferSelect;
export type InsertArbitrageOpportunity = typeof arbitrageOpportunities.$inferInsert;

// ─── User Arbitrage Trades ────────────────────────────────────────────────────
export const userArbitrageTrades = mysqlTable("user_arbitrage_trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  arbitrageId: int("arbitrageId").notNull(),
  
  // Trade details
  stakeA: decimal("stakeA", { precision: 8, scale: 2 }).notNull(),
  stakeB: decimal("stakeB", { precision: 8, scale: 2 }).notNull(),
  totalStake: decimal("totalStake", { precision: 8, scale: 2 }).notNull(),
  
  // Execution
  bookABetId: varchar("bookABetId", { length: 128 }),
  bookBBetId: varchar("bookBBetId", { length: 128 }),
  executedAt: timestamp("executedAt"),
  
  // Results
  resultA: mysqlEnum("resultA", ["pending", "won", "lost", "void"]).default("pending").notNull(),
  resultB: mysqlEnum("resultB", ["pending", "won", "lost", "void"]).default("pending").notNull(),
  winningsA: decimal("winningsA", { precision: 8, scale: 2 }),
  winningsB: decimal("winningsB", { precision: 8, scale: 2 }),
  totalWinnings: decimal("totalWinnings", { precision: 8, scale: 2 }),
  actualProfit: decimal("actualProfit", { precision: 8, scale: 2 }),
  
  // Status
  status: mysqlEnum("status", ["pending", "executed", "completed", "failed"]).default("pending").notNull(),
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserArbitrageTrade = typeof userArbitrageTrades.$inferSelect;
export type InsertUserArbitrageTrade = typeof userArbitrageTrades.$inferInsert;
