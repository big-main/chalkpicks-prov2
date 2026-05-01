import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          recommendation: "Chiefs -7.5",
          odds: -110,
          confidenceScore: 85,
          edgeScore: 4.2,
          aiAnalysis: "Strong home favorite with elite QB play.",
          keyFactors: ["Home field", "Mahomes form", "Raiders defense rank"],
          tier: "free",
        }),
      },
    }],
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(overrides: Partial<NonNullable<TrpcContext["user"]>> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      subscriptionTier: "free",
      subscriptionExpiresAt: null,
      stripeSubscriptionId: null,
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("returns null user for unauthenticated requests", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("returns user for authenticated requests", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const user = await caller.auth.me();
    expect(user).not.toBeNull();
    expect(user?.email).toBe("test@example.com");
    expect(user?.name).toBe("Test User");
  });

  it("clears session cookie on logout", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

// ─── Picks Tests ──────────────────────────────────────────────────────────────
describe("picks", () => {
  it("returns mock picks when DB is unavailable", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.picks.list({ limit: 5 });
    expect(result.picks).toBeDefined();
    expect(Array.isArray(result.picks)).toBe(true);
    expect(result.picks.length).toBeGreaterThan(0);
  });

  it("returns sports list with picks", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.picks.list({ limit: 5 });
    expect(result.sports).toBeDefined();
    expect(Array.isArray(result.sports)).toBe(true);
    expect(result.sports.length).toBeGreaterThan(0);
  });

  it("filters picks by sport", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.picks.list({ sportKey: "nfl", limit: 10 });
    expect(result.picks).toBeDefined();
    // Mock picks include NFL picks
    const nflPicks = result.picks.filter((p: any) => p.sportKey === "nfl");
    expect(nflPicks.length).toBeGreaterThan(0);
  });

  it("returns a specific pick by ID", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const pick = await caller.picks.byId({ id: 1 });
    expect(pick).toBeDefined();
    expect(pick.id).toBe(1);
    expect(pick.recommendation).toBeDefined();
    expect(pick.confidenceScore).toBeGreaterThan(0);
  });

  it("throws NOT_FOUND for invalid pick ID", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.picks.byId({ id: 9999 })).rejects.toThrow();
  });

  it("returns picks performance stats", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const stats = await caller.picks.performance();
    expect(stats).toBeDefined();
    expect(stats.overall).toBeDefined();
    expect(typeof stats.overall.winRate).toBe("number");
    expect(typeof stats.overall.roi).toBe("number");
    expect(Array.isArray(stats.bySport)).toBe(true);
  });

  it("requires auth to generate AI picks", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.picks.generateAI({ sportKey: "nfl", matchup: "Chiefs vs Raiders" })
    ).rejects.toThrow();
  });

  it("generates AI picks for authenticated users", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.picks.generateAI({ sportKey: "nfl", matchup: "Chiefs vs Raiders" });
    expect(result.success).toBe(true);
    expect(result.pick).toBeDefined();
    expect(result.pick.recommendation).toBeDefined();
  });
});

// ─── Leaderboard Tests ────────────────────────────────────────────────────────
describe("leaderboard", () => {
  it("returns leaderboard entries", async () => {
    const caller = appRouter.createCaller(createAuthContext({ subscriptionTier: "daily", subscriptionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }));
    const entries = await caller.leaderboard.list({ period: "all", limit: 10 });
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
  });

  it("returns leaderboard stats", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const stats = await caller.leaderboard.stats();
    expect(stats.totalBettors).toBeGreaterThan(0);
    expect(stats.avgWinRate).toBeGreaterThan(0);
    expect(stats.topROI).toBeGreaterThan(0);
  });

  it("returns null myRank when DB unavailable", async () => {
    const caller = appRouter.createCaller(createAuthContext({ subscriptionTier: "daily", subscriptionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }));
    const rank = await caller.leaderboard.myRank();
    expect(rank).toBeNull();
  });

  it("leaderboard entries have required fields", async () => {
    const caller = appRouter.createCaller(createAuthContext({ subscriptionTier: "daily", subscriptionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }));
    const entries = await caller.leaderboard.list({ period: "all", limit: 5 });
    const first = entries[0];
    expect(first).toHaveProperty("rank");
    expect(first).toHaveProperty("displayName");
    expect(first).toHaveProperty("winRate");
    expect(first).toHaveProperty("roi");
    expect(first).toHaveProperty("wins");
    expect(first).toHaveProperty("losses");
  });
});

// ─── Subscription Tests ───────────────────────────────────────────────────────
describe("subscription", () => {
  it("returns available plans", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const plans = await caller.subscription.plans();
    expect(plans).toBeDefined();
    expect(plans.daily).toBeDefined();
    expect(plans.monthly).toBeDefined();
    expect(plans.yearly).toBeDefined();
  });

  it("plans have correct structure", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const plans = await caller.subscription.plans();
    expect(plans.monthly.amountCents).toBe(2999);
    expect(plans.yearly.amountCents).toBe(19999);
    expect(plans.daily.amountCents).toBe(999);
    expect(Array.isArray(plans.monthly.features)).toBe(true);
  });

  it("requires auth to check subscription", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.subscription.mySubscription()).rejects.toThrow();
  });

  it("returns free tier for authenticated users without subscription", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const sub = await caller.subscription.mySubscription();
    expect(sub.tier).toBe("free");
    expect(sub.isActive).toBe(false);
  });

  it("requires auth to create checkout", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.subscription.createCheckout({ tier: "monthly", origin: "https://example.com" })
    ).rejects.toThrow();
  });
});

// ─── Bets Tests ───────────────────────────────────────────────────────────────
describe("bets", () => {
  it("requires auth to list bets", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.bets.list({})).rejects.toThrow();
  });

  it("returns empty bets when DB unavailable", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.bets.list({});
    expect(result.bets).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.stats.wins).toBe(0);
  });

  it("returns zero summary when DB unavailable", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const summary = await caller.bets.summary();
    expect(summary.totalBets).toBe(0);
    expect(summary.winRate).toBe(0);
    expect(summary.roi).toBe(0);
  });

  it("requires auth to add a bet", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.bets.add({
      sportKey: "nfl",
      description: "Chiefs -7.5",
      betType: "spread",
      stake: 100,
      odds: -110,
      betDate: "2026-04-07",
    })).rejects.toThrow();
  });
});

// ─── Stats Tests ──────────────────────────────────────────────────────────────
describe("stats", () => {
  it("returns top players", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.stats.topPlayers({ sport: "nba", limit: 5 });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns all games", async () => {
    const caller = appRouter.createCaller(createAuthContext({ subscriptionTier: "daily", subscriptionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }));
    const result = await caller.stats.allGames();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns live games", async () => {
    const caller = appRouter.createCaller(createAuthContext({ subscriptionTier: "daily", subscriptionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }));
    const result = await caller.stats.liveGames({ sportKey: "nfl" });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns injury reports", async () => {
    const caller = appRouter.createCaller(createAuthContext({ subscriptionTier: "daily", subscriptionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }));
    const result = await caller.stats.injuryReport({ sport: "nfl" });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Backtest Tests ───────────────────────────────────────────────────────────
describe("backtest", () => {
  it("runs backtest and returns results", async () => {
    const caller = appRouter.createCaller(createAuthContext({ subscriptionTier: "monthly", subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }));
    const result = await caller.backtest.run({
      name: "NFL Spread Test",
      sportKey: "nfl",
      pickType: "spread",
      minConfidence: 70,
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31",
      initialBankroll: 1000,
      stakePerBet: 100,
    });
    expect(result).toBeDefined();
    expect(result.totalPicks).toBeGreaterThan(0);
    expect(typeof result.winRate).toBe("number");
    expect(typeof result.roi).toBe("number");
    expect(Array.isArray(result.results)).toBe(true);
  });

  it("backtest results have correct structure", async () => {
    const caller = appRouter.createCaller(createAuthContext({ subscriptionTier: "monthly", subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }));
    const result = await caller.backtest.run({
      name: "NBA Over/Under Test",
      sportKey: "nba",
      pickType: "over_under",
      minConfidence: 75,
      dateFrom: "2024-01-01",
      dateTo: "2024-06-30",
    });
    expect(result.wins).toBeGreaterThanOrEqual(0);
    expect(result.losses).toBeGreaterThanOrEqual(0);
    expect(result.totalProfit).toBeDefined();
    expect(result.wins + result.losses).toBeLessThanOrEqual(result.totalPicks);
  });
});
