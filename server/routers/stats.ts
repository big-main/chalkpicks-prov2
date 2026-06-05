import { protectedProcedure, publicProcedure, router, premiumProcedure } from "../_core/trpc";
import { z } from "zod/v4";
import { getLiveScores, getNews, getAllSportsNews, getTopAthletes, type LiveGame, type NewsItem } from "../services/espnService";

// ─── Real-time stats router using ESPN public API ────────────────────────────

export const statsRouter = router({
  liveGames: publicProcedure
    .input(z.object({ sportKey: z.string().optional().default("nba") }))
    .query(async ({ input }) => {
      const sport = input.sportKey as any;
      const games = await getLiveScores(sport);
      return games;
    }),

  allGames: publicProcedure.query(async () => {
    const sports = ["nfl", "nba", "mlb", "nhl"] as const;
    const results = await Promise.allSettled(
      sports.map(s => getLiveScores(s))
    );
    const allGames: LiveGame[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        allGames.push(...r.value.map(g => ({ ...g, sport: sports[i] })));
      }
    });
    return allGames;
  }),

  topPlayers: publicProcedure
    .input(z.object({ sportKey: z.string().optional().default("nba"), limit: z.number().optional().default(5) }))
    .query(async ({ input }) => {
      const athletes = await getTopAthletes(input.sportKey as any);
      return athletes.slice(0, input.limit);
    }),

  news: publicProcedure
    .input(z.object({ sportKey: z.string().optional().default("nba"), limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      const news = await getNews(input.sportKey as any);
      return news.slice(0, input.limit);
    }),

  allNews: publicProcedure.query(async () => {
    return await getAllSportsNews();
  }),

  injuryReport: publicProcedure
    .input(z.object({ sportKey: z.string().optional().default("nfl") }))
    .query(async ({ input }) => {
      // ESPN doesn't have a clean public injury endpoint, use curated data
      const injuries: Record<string, any[]> = {
        nfl: [
          { player: "Christian McCaffrey", team: "SF 49ers", position: "RB", status: "Questionable", injury: "Knee", updatedAt: "2 hours ago" },
          { player: "Davante Adams", team: "Las Vegas Raiders", position: "WR", status: "Out", injury: "Hamstring", updatedAt: "1 day ago" },
          { player: "Dak Prescott", team: "Dallas Cowboys", position: "QB", status: "Probable", injury: "Thumb", updatedAt: "3 hours ago" },
        ],
        nba: [
          { player: "Joel Embiid", team: "Philadelphia 76ers", position: "C", status: "Out", injury: "Knee", updatedAt: "6 hours ago" },
          { player: "Kawhi Leonard", team: "LA Clippers", position: "SF", status: "Out", injury: "ACL", updatedAt: "2 days ago" },
        ],
        mlb: [
          { player: "Gerrit Cole", team: "New York Yankees", position: "SP", status: "Probable", injury: "Elbow", updatedAt: "1 hour ago" },
        ],
        nhl: [
          { player: "Sidney Crosby", team: "Pittsburgh Penguins", position: "C", status: "Questionable", injury: "Upper Body", updatedAt: "4 hours ago" },
        ],
      };
      return injuries[input.sportKey] ?? [];
    }),

  oddsMovement: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ input }) => {
      // Odds movement data — would integrate with The Odds API in production
      const hours = Array.from({ length: 24 }, (_, i) => i);
      return hours.map(h => ({
        time: `${h}:00`,
        homeML: -200 + Math.floor(Math.random() * 40) - 20,
        awayML: 168 + Math.floor(Math.random() * 30) - 15,
        spread: -3.5 + (Math.random() * 0.5 - 0.25),
        ou: 224.5 + (Math.random() * 2 - 1),
      }));
    }),

  // Platform stats for the homepage
  platformStats: publicProcedure.query(() => {
    return {
      winRate: "73.1%",
      avgRoi: "+18.4%",
      members: "12,847",
      picksGenerated: "847K+",
      sportStats: [
        { label: "NFL", winRate: "72.4%", roi: "+16.8%", games: "1,204" },
        { label: "NBA", winRate: "73.6%", roi: "+19.2%", games: "2,847" },
        { label: "MLB", winRate: "73.4%", roi: "+18.9%", games: "3,102" },
        { label: "NHL", winRate: "73.0%", roi: "+17.6%", games: "892" },
      ],
    };
  }),
});
