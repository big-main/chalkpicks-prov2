import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod/v4";
import { getDb } from "../db";
import { userBets, leaderboard } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function calcPayout(stake: number, odds: number): number {
  if (odds > 0) return stake + (stake * odds) / 100;
  return stake + (stake * 100) / Math.abs(odds);
}

export const betsRouter = router({
  list: protectedProcedure
    .input(z.object({
      result: z.enum(["win", "loss", "push", "pending", "all"]).optional().default("all"),
      sportKey: z.string().optional(),
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { bets: [], total: 0, stats: { wins: 0, losses: 0, roi: 0, totalProfit: 0 } };

      const conditions = [eq(userBets.userId, ctx.user.id)];
      if (input.result !== "all") conditions.push(eq(userBets.result, input.result));
      if (input.sportKey) conditions.push(eq(userBets.sportKey, input.sportKey));

      const [betList, countResult, aggResult] = await Promise.all([
        db.select().from(userBets).where(and(...conditions)).orderBy(desc(userBets.createdAt)).limit(input.limit).offset(input.offset),
        db.select({ count: sql<number>`count(*)` }).from(userBets).where(and(...conditions)),
        db.select({
          wins: sql<number>`sum(case when result = 'win' then 1 else 0 end)`,
          losses: sql<number>`sum(case when result = 'loss' then 1 else 0 end)`,
          totalProfit: sql<number>`sum(cast(profit as decimal(10,2)))`,
          totalStaked: sql<number>`sum(cast(stake as decimal(10,2)))`,
        }).from(userBets).where(eq(userBets.userId, ctx.user.id)),
      ]);

      const agg = aggResult[0];
      const wins = Number(agg?.wins ?? 0);
      const losses = Number(agg?.losses ?? 0);
      const totalProfit = Number(agg?.totalProfit ?? 0);
      const totalStaked = Number(agg?.totalStaked ?? 0);
      const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

      return {
        bets: betList,
        total: countResult[0]?.count ?? 0,
        stats: {
          wins,
          losses,
          roi: Math.round(roi * 100) / 100,
          totalProfit: Math.round(totalProfit * 100) / 100,
          winRate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 1000) / 10 : 0,
        },
      };
    }),

  add: protectedProcedure
    .input(z.object({
      pickId: z.number().optional(),
      sportKey: z.string(),
      description: z.string().min(1).max(256),
      betType: z.enum(["moneyline", "spread", "over_under", "player_prop", "parlay", "other"]),
      stake: z.number().positive(),
      odds: z.number(),
      notes: z.string().optional(),
      betDate: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const potentialPayout = calcPayout(input.stake, input.odds);

      await db.insert(userBets).values({
        userId: ctx.user.id,
        pickId: input.pickId,
        sportKey: input.sportKey,
        description: input.description,
        betType: input.betType,
        stake: String(input.stake),
        odds: input.odds,
        potentialPayout: String(Math.round(potentialPayout * 100) / 100),
        result: "pending",
        profit: "0",
        notes: input.notes,
        betDate: input.betDate,
      });

      return { success: true };
    }),

  settle: protectedProcedure
    .input(z.object({
      id: z.number(),
      result: z.enum(["win", "loss", "push"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [bet] = await db.select().from(userBets).where(and(eq(userBets.id, input.id), eq(userBets.userId, ctx.user.id))).limit(1);
      if (!bet) throw new TRPCError({ code: "NOT_FOUND" });

      const stake = Number(bet.stake);
      const odds = bet.odds;
      let profit = 0;
      if (input.result === "win") profit = calcPayout(stake, odds) - stake;
      else if (input.result === "loss") profit = -stake;

      await db.update(userBets).set({
        result: input.result,
        profit: String(Math.round(profit * 100) / 100),
        settledAt: new Date(),
      }).where(eq(userBets.id, input.id));

      return { success: true, profit };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(userBets).where(and(eq(userBets.id, input.id), eq(userBets.userId, ctx.user.id)));
      return { success: true };
    }),

  summary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalBets: 0, wins: 0, losses: 0, pushes: 0, winRate: 0, roi: 0, totalProfit: 0, totalStaked: 0, streak: 0 };

    const allBets = await db.select().from(userBets).where(eq(userBets.userId, ctx.user.id)).orderBy(desc(userBets.createdAt));
    const wins = allBets.filter(b => b.result === "win").length;
    const losses = allBets.filter(b => b.result === "loss").length;
    const pushes = allBets.filter(b => b.result === "push").length;
    const totalProfit = allBets.reduce((sum, b) => sum + Number(b.profit ?? 0), 0);
    const totalStaked = allBets.reduce((sum, b) => sum + Number(b.stake), 0);
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

    // Calculate current streak
    let streak = 0;
    for (const bet of allBets) {
      if (bet.result === "pending") continue;
      if (streak === 0) { streak = bet.result === "win" ? 1 : -1; continue; }
      if (streak > 0 && bet.result === "win") streak++;
      else if (streak < 0 && bet.result === "loss") streak--;
      else break;
    }

    return {
      totalBets: allBets.length,
      wins,
      losses,
      pushes,
      winRate: Math.round(winRate * 10) / 10,
      roi: Math.round(roi * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalStaked: Math.round(totalStaked * 100) / 100,
      streak,
    };
  }),
});
