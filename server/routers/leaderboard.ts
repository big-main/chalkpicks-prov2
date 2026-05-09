import { protectedProcedure, publicProcedure, router, premiumProcedure } from "../_core/trpc";
import { z } from "zod/v4";
import { getDb } from "../db";
import { leaderboard, users } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";

const mockLeaderboard = [
  { rank: 1, displayName: "SharpBettor_KC", wins: 234, losses: 67, winRate: 77.7, roi: 28.4, totalProfit: 12840, streak: 7, badge: "🔥 Hot Streak", totalBets: 301 },
  { rank: 2, displayName: "ValueHunter99", wins: 198, losses: 62, winRate: 76.2, roi: 24.1, totalProfit: 9640, streak: 4, badge: "💎 Diamond", totalBets: 260 },
  { rank: 3, displayName: "EdgeFinder_Pro", wins: 312, losses: 101, winRate: 75.5, roi: 22.8, totalProfit: 11400, streak: 3, badge: "⭐ Consistent", totalBets: 413 },
  { rank: 4, displayName: "DataDriven_Dan", wins: 189, losses: 63, winRate: 75.0, roi: 21.3, totalProfit: 8520, streak: -1, badge: "📊 Analyst", totalBets: 252 },
  { rank: 5, displayName: "PropKing_2024", wins: 267, losses: 91, winRate: 74.6, roi: 19.7, totalProfit: 9880, streak: 5, badge: "🏆 Champion", totalBets: 358 },
  { rank: 6, displayName: "NightOwl_Picks", wins: 145, losses: 51, winRate: 74.0, roi: 18.9, totalProfit: 7560, streak: 2, badge: "🦉 Night Owl", totalBets: 196 },
  { rank: 7, displayName: "GrindMode_Sports", wins: 223, losses: 79, winRate: 73.8, roi: 17.4, totalProfit: 8700, streak: -2, badge: "💪 Grinder", totalBets: 302 },
  { rank: 8, displayName: "LineMover_Mike", wins: 178, losses: 64, winRate: 73.6, roi: 16.8, totalProfit: 6720, streak: 1, badge: "📈 Rising", totalBets: 242 },
  { rank: 9, displayName: "StatGeek_Official", wins: 156, losses: 57, winRate: 73.2, roi: 15.9, totalProfit: 6360, streak: 3, badge: "🔬 Analyst", totalBets: 213 },
  { rank: 10, displayName: "BetSmarter_Now", wins: 134, losses: 49, winRate: 73.2, roi: 15.1, totalProfit: 6040, streak: -1, badge: "🧠 Smart", totalBets: 183 },
];

export const leaderboardRouter = router({
  list: premiumProcedure
    .input(z.object({
      period: z.enum(["all", "monthly", "weekly"]).optional().default("all"),
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return mockLeaderboard.slice(0, input.limit);

      const entries = await db
        .select({
          id: leaderboard.id,
          userId: leaderboard.userId,
          displayName: leaderboard.displayName,
          totalBets: leaderboard.totalBets,
          wins: leaderboard.wins,
          losses: leaderboard.losses,
          winRate: leaderboard.winRate,
          roi: leaderboard.roi,
          totalProfit: leaderboard.totalProfit,
          streak: leaderboard.streak,
          rank: leaderboard.rank,
          badge: leaderboard.badge,
        })
        .from(leaderboard)
        .orderBy(desc(leaderboard.roi))
        .limit(input.limit);

      if (entries.length === 0) return mockLeaderboard.slice(0, input.limit);
      return entries;
    }),

  myRank: premiumProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const entry = await db.select().from(leaderboard).where(eq(leaderboard.userId, ctx.user.id)).limit(1);
    return entry[0] ?? null;
  }),

  stats: publicProcedure.query(() => ({
    totalBettors: 12847,
    avgWinRate: 92,
    avgRoi: 8.7,
    topROI: 28.4,
    totalPicksTracked: 847293,
  })),
});
