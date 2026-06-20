import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { userBets } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const clvRouter = router({
  /**
   * Get CLV statistics for a user's bets
   */
  getClvStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return null;

    const database = await getDb();
    if (!database) return null;

    const bets = await database.select().from(userBets).where(eq(userBets.userId, userId));

    const stats = {
      totalBets: bets.length,
      winningBets: bets.filter((b: any) => b.result === "win").length,
      losingBets: bets.filter((b: any) => b.result === "loss").length,
      pushBets: bets.filter((b: any) => b.result === "push").length,
      pendingBets: bets.filter((b: any) => b.result === "pending").length,
      betsWithCLV: bets.filter((b: any) => b.clvValue !== null).length,
      averageCLV: calculateAverageCLV(bets),
      positiveCLVBets: bets.filter((b: any) => b.clvValue && b.clvValue > 0).length,
      negativeCLVBets: bets.filter((b: any) => b.clvValue && b.clvValue < 0).length,
      totalProfit: bets.reduce((sum: number, b: any) => sum + (parseFloat(b.profit?.toString() || "0")), 0),
      profitWithPositiveCLV: bets
        .filter((b: any) => b.clvValue && b.clvValue > 0)
        .reduce((sum: number, b: any) => sum + (parseFloat(b.profit?.toString() || "0")), 0),
      profitWithNegativeCLV: bets
        .filter((b: any) => b.clvValue && b.clvValue < 0)
        .reduce((sum: number, b: any) => sum + (parseFloat(b.profit?.toString() || "0")), 0),
      winRateOverall: bets.length > 0 ? (bets.filter((b: any) => b.result === "win").length / bets.length) * 100 : 0,
      winRateWithPositiveCLV:
        bets.filter((b: any) => b.clvValue && b.clvValue > 0).length > 0
          ? (bets.filter((b: any) => b.clvValue && b.clvValue > 0 && b.result === "win").length /
              bets.filter((b: any) => b.clvValue && b.clvValue > 0).length) *
            100
          : 0,
      winRateWithNegativeCLV:
        bets.filter((b: any) => b.clvValue && b.clvValue < 0).length > 0
          ? (bets.filter((b: any) => b.clvValue && b.clvValue < 0 && b.result === "win").length /
              bets.filter((b: any) => b.clvValue && b.clvValue < 0).length) *
            100
          : 0,
      betsWithSharpMoney: bets.filter((b: any) => b.sharpMoney === true).length,
      winRateWithSharpMoney:
        bets.filter((b: any) => b.sharpMoney === true).length > 0
          ? (bets.filter((b: any) => b.sharpMoney === true && b.result === "win").length /
              bets.filter((b: any) => b.sharpMoney === true).length) *
            100
          : 0,
    };

    return stats;
  }),

  /**
   * Get CLV breakdown by bet type
   */
  getClvByBetType: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return [];

    const database = await getDb();
    if (!database) return [];

    const bets = await database.select().from(userBets).where(eq(userBets.userId, userId));

    const betTypes = ["moneyline", "spread", "over_under", "player_prop", "parlay"];
    const breakdown = betTypes.map((type) => {
      const typeBets = bets.filter((b: any) => b.betType === type);
      return {
        betType: type,
        count: typeBets.length,
        wins: typeBets.filter((b: any) => b.result === "win").length,
        losses: typeBets.filter((b: any) => b.result === "loss").length,
        winRate: typeBets.length > 0 ? (typeBets.filter((b: any) => b.result === "win").length / typeBets.length) * 100 : 0,
        averageCLV: calculateAverageCLV(typeBets),
        totalProfit: typeBets.reduce((sum: number, b: any) => sum + (parseFloat(b.profit?.toString() || "0")), 0),
      };
    });

    return breakdown.filter((b) => b.count > 0);
  }),

  /**
   * Record CLV for a bet
   */
  recordClv: protectedProcedure
    .input(
      z.object({
        betId: z.number(),
        closingLineOdds: z.number(),
        bookmakerName: z.string().optional(),
        sharpMoney: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      const database = await getDb();
      if (!database) throw new Error("Database unavailable");

      const bet = await database
        .select()
        .from(userBets)
        .where(and(eq(userBets.id, input.betId), eq(userBets.userId, userId)))
        .limit(1);

      if (!bet || bet.length === 0) throw new Error("Bet not found");

      const clvValue = calculateCLV(parseInt(bet[0].odds?.toString() || "0"), input.closingLineOdds);
      const lineMovement = input.closingLineOdds - parseInt(bet[0].odds?.toString() || "0");

      await database
        .update(userBets)
        .set({
          closingLineOdds: input.closingLineOdds,
          clvValue: clvValue,
          lineMovement: lineMovement,
          bookmakerName: input.bookmakerName,
          sharpMoney: input.sharpMoney || false,
          closingLineTime: new Date(),
        })
        .where(eq(userBets.id, input.betId));

      return { clvValue, lineMovement };
    }),

  /**
   * Get best CLV bets
   */
  getBestClvBets: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return [];

    const database = await getDb();
    if (!database) return [];

    const bets = await database.select().from(userBets).where(eq(userBets.userId, userId));

    return bets
      .filter((b: any) => b.clvValue !== null)
      .sort((a: any, b: any) => (b.clvValue || 0) - (a.clvValue || 0))
      .slice(0, 10);
  }),

  /**
   * Get worst CLV bets
   */
  getWorstClvBets: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return [];

    const database = await getDb();
    if (!database) return [];

    const bets = await database.select().from(userBets).where(eq(userBets.userId, userId));

    return bets
      .filter((b: any) => b.clvValue !== null)
      .sort((a: any, b: any) => (a.clvValue || 0) - (b.clvValue || 0))
      .slice(0, 10);
  }),

  /**
   * Get CLV insights
   */
  getClvInsights: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return null;

    const database = await getDb();
    if (!database) return null;

    const bets = await database.select().from(userBets).where(eq(userBets.userId, userId));

    const totalBets = bets.length;
    const positiveCLVBets = bets.filter((b: any) => b.clvValue && b.clvValue > 0).length;
    const negativeCLVBets = bets.filter((b: any) => b.clvValue && b.clvValue < 0).length;
    const betsWithCLV = bets.filter((b: any) => b.clvValue !== null).length;
    const betsWithSharpMoney = bets.filter((b: any) => b.sharpMoney === true).length;

    const insights: Array<{ title: string; message: string; severity: string }> = [];

    if (positiveCLVBets > 0 && negativeCLVBets > 0) {
      insights.push({
        title: "CLV Analysis",
        message: `You have ${positiveCLVBets} bets with positive CLV and ${negativeCLVBets} with negative CLV`,
        severity: "info",
      });
    }

    if (betsWithSharpMoney > 0) {
      insights.push({
        title: "Sharp Money Detected",
        message: `Identified ${betsWithSharpMoney} bets with sharp money activity`,
        severity: "success",
      });
    }

    if (betsWithCLV < totalBets * 0.5 && totalBets > 0) {
      insights.push({
        title: "Low CLV Coverage",
        message: `Only ${((betsWithCLV / totalBets) * 100).toFixed(0)}% of bets have CLV data`,
        severity: "warning",
      });
    }

    return insights;
  }),
});

function calculateCLV(betOdds: number, closingLineOdds: number): number {
  const betDecimal = oddsToDecimal(betOdds);
  const closingDecimal = oddsToDecimal(closingLineOdds);
  return (closingDecimal / betDecimal - 1) * 100;
}

function oddsToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return 1 + americanOdds / 100;
  } else {
    return 1 + 100 / Math.abs(americanOdds);
  }
}

function calculateAverageCLV(bets: any[]): number {
  const betsWithCLV = bets.filter((b: any) => b.clvValue !== null);
  if (betsWithCLV.length === 0) return 0;
  return betsWithCLV.reduce((sum: number, b: any) => sum + (b.clvValue || 0), 0) / betsWithCLV.length;
}
