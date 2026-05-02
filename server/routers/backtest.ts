import { protectedProcedure, publicProcedure, router, proProcedure } from "../_core/trpc";
import { z } from "zod/v4";
import { getDb } from "../db";
import { backtests, picks } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const backtestRouter = router({
  run: proProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      sportKey: z.string().optional(),
      pickType: z.string().optional(),
      minConfidence: z.number().min(0).max(100).optional().default(0),
      dateFrom: z.string(),
      dateTo: z.string(),
      initialBankroll: z.number().optional().default(1000),
      stakePerBet: z.number().optional().default(100),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      // Generate mock backtest results for demo
      const daysDiff = Math.ceil((new Date(input.dateTo).getTime() - new Date(input.dateFrom).getTime()) / (1000 * 60 * 60 * 24));
      const totalPicks = Math.max(10, Math.floor(daysDiff * 1.8));
      const winRate = 0.68 + (input.minConfidence / 100) * 0.15;
      const wins = Math.round(totalPicks * winRate);
      const losses = Math.round(totalPicks * (1 - winRate) * 0.95);
      const pushes = totalPicks - wins - losses;
      const roi = ((wins * 0.909 - losses) / totalPicks) * 100;
      const totalProfit = (wins * input.stakePerBet * 0.909 - losses * input.stakePerBet);

      // Build pick-by-pick results
      const results = Array.from({ length: Math.min(totalPicks, 50) }, (_, i) => {
        const date = new Date(input.dateFrom);
        date.setDate(date.getDate() + Math.floor(i * (daysDiff / totalPicks)));
        const isWin = Math.random() < winRate;
        const isPush = !isWin && Math.random() < 0.05;
        const result = isWin ? "win" : isPush ? "push" : "loss";
        const profit = result === "win" ? input.stakePerBet * 0.909 : result === "loss" ? -input.stakePerBet : 0;
        return {
          date: date.toISOString().split("T")[0],
          pick: `Pick ${i + 1}`,
          confidence: input.minConfidence + Math.floor(Math.random() * (95 - input.minConfidence)),
          result,
          profit: Math.round(profit * 100) / 100,
          bankroll: Math.round((input.initialBankroll + profit * (i + 1)) * 100) / 100,
        };
      });

      if (!db) {
        return {
          id: Date.now(),
          name: input.name,
          sportKey: input.sportKey ?? "all",
          totalPicks,
          wins,
          losses,
          pushes,
          winRate: Math.round(winRate * 1000) / 10,
          roi: Math.round(roi * 100) / 100,
          totalProfit: Math.round(totalProfit * 100) / 100,
          results,
          createdAt: new Date(),
        };
      }

      const [inserted] = await db.insert(backtests).values({
        userId: ctx.user.id,
        name: input.name,
        sportKey: input.sportKey,
        pickType: input.pickType,
        minConfidence: input.minConfidence,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        totalPicks,
        wins,
        losses,
        pushes,
        winRate: String(Math.round(winRate * 1000) / 10),
        roi: String(Math.round(roi * 100) / 100),
        totalProfit: String(Math.round(totalProfit * 100) / 100),
        results,
      });

      return {
        id: (inserted as any).insertId,
        name: input.name,
        sportKey: input.sportKey ?? "all",
        totalPicks,
        wins,
        losses,
        pushes,
        winRate: Math.round(winRate * 1000) / 10,
        roi: Math.round(roi * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        results,
        createdAt: new Date(),
      };
    }),

  list: proProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(backtests).where(eq(backtests.userId, ctx.user.id)).orderBy(backtests.createdAt);
  }),

  // Public demo backtest
  demo: publicProcedure
    .input(z.object({
      sportKey: z.string().optional().default("nfl"),
      minConfidence: z.number().optional().default(70),
    }))
    .query(({ input }) => {
      const winRate = 0.68 + (input.minConfidence / 100) * 0.12;
      const totalPicks = 120;
      const wins = Math.round(totalPicks * winRate);
      const losses = totalPicks - wins - 5;
      const pushes = 5;
      const roi = ((wins * 0.909 - losses) / totalPicks) * 100;

      const bankrollHistory = Array.from({ length: 12 }, (_, i) => {
        const monthWins = Math.round((wins / 12) * (0.85 + Math.random() * 0.3));
        const monthLosses = Math.round((losses / 12) * (0.85 + Math.random() * 0.3));
        const monthProfit = monthWins * 100 * 0.909 - monthLosses * 100;
        return {
          month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
          profit: Math.round(monthProfit),
          winRate: Math.round((monthWins / (monthWins + monthLosses)) * 1000) / 10,
          bankroll: Math.round(1000 + monthProfit * (i + 1) * 0.1),
        };
      });

      return {
        sportKey: input.sportKey,
        minConfidence: input.minConfidence,
        totalPicks,
        wins,
        losses,
        pushes,
        winRate: Math.round(winRate * 1000) / 10,
        roi: Math.round(roi * 100) / 100,
        totalProfit: Math.round((wins * 100 * 0.909 - losses * 100) * 100) / 100,
        bankrollHistory,
        confidenceBreakdown: [
          { range: "60-70%", picks: 30, winRate: 62.5, roi: 5.2 },
          { range: "70-80%", picks: 45, winRate: 71.4, roi: 14.8 },
          { range: "80-90%", picks: 32, winRate: 78.9, roi: 22.1 },
          { range: "90-100%", picks: 13, winRate: 87.2, roi: 34.6 },
        ],
      };
    }),
});
