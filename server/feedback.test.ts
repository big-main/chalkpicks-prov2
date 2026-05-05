import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("feedback router", () => {
  it("should submit feedback for a pick", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.submitFeedback({
      pickId: 1,
      rating: 5,
      comment: "Great pick! Very accurate analysis.",
    });

    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
  });

  it("should get feedback analytics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.getFeedbackAnalytics();

    expect(result).toHaveProperty("totalFeedback");
    expect(result).toHaveProperty("avgRating");
    expect(result).toHaveProperty("sentimentBreakdown");
    expect(result).toHaveProperty("ratingDistribution");
    expect(typeof result.totalFeedback).toBe("number");
    expect(typeof result.avgRating).toBe("number");
  });

  it("should get top rated picks", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.getTopRatedPicks({ limit: 5, minFeedback: 1 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get worst rated picks", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.getWorstRatedPicks({ limit: 5, minFeedback: 1 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should update feedback when submitting again", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result1 = await caller.feedback.submitFeedback({
      pickId: 1,
      rating: 3,
      comment: "Average pick",
    });

    expect(result1.success).toBe(true);

    const result2 = await caller.feedback.submitFeedback({
      pickId: 1,
      rating: 5,
      comment: "Actually, great pick!",
    });

    expect(result2.success).toBe(true);
  });

  it("should get user feedback", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.getUserFeedback({ pickId: 1 });

    expect(result === null || typeof result === "object").toBe(true);
  });
});
