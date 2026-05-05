import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

function createAuthContext(
  tier: "free" | "premium" | "pro" = "pro"
): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      subscriptionTier: tier,
      subscriptionExpiresAt:
        tier !== "free"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
      stripeSubscriptionId: tier !== "free" ? "sub_123" : null,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("AI Picks Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createAuthContext("monthly");
    caller = appRouter.createCaller(ctx);
  });

  it("should calculate EV for a given bet", async () => {
    const result = await caller.aiPicks.calculateEV({
      odds: -110,
      winProbability: 0.55,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.ev).toBeGreaterThan(0);
    expect(result.data?.recommendation).toBeDefined();
  });

  it("should get betting insights for pro users", async () => {
    const result = await caller.aiPicks.getInsights({
      context: "NFL game between Patriots and Chiefs with -110 odds",
    });

    expect(result.success).toBe(true);
    expect(result.insights).toBeDefined();
  });

  it("should analyze steam moves for pro users", async () => {
    const result = await caller.aiPicks.analyzeSteam({
      sport: "NFL",
      matchup: "Patriots vs Chiefs",
      lineMovement: "Opened at -3, now -5.5",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(typeof result.data?.isSharpMove).toBe("boolean");
  });

  it("should generate AI pick analysis for pro users", async () => {
    const result = await caller.aiPicks.generatePick({
      sport: "NFL",
      matchup: "Patriots vs Chiefs",
      pickType: "moneyline",
      odds: -110,
      reasoning: "Strong defensive matchup expected",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.title).toBeDefined();
    expect(result.data?.edge).toBeDefined();
    expect(result.data?.analysis).toBeDefined();
  });

  it("should deny access to free users", async () => {
    const freeCtx = createAuthContext("free" as any);
    const freeCaller = appRouter.createCaller(freeCtx);

    try {
      await freeCaller.aiPicks.generatePick({
        sport: "NFL",
        matchup: "Patriots vs Chiefs",
        pickType: "moneyline",
        odds: -110,
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should allow unauthenticated users to access EV calculator", async () => {
    const publicCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
        setHeader: vi.fn(),
      } as unknown as TrpcContext["res"],
    };
    const publicCaller = appRouter.createCaller(publicCtx);

    const result = await publicCaller.aiPicks.calculateEV({
      odds: -110,
      winProbability: 0.55,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
