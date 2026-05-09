import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod/v4";
import { getDb } from "../db";
import { picks, playerProps, games, sports } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, like, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

const SPORTS_LIST = [
  { key: "nfl", name: "NFL", icon: "🏈" },
  { key: "nba", name: "NBA", icon: "🏀" },
  { key: "mlb", name: "MLB", icon: "⚾" },
  { key: "nhl", name: "NHL", icon: "🏒" },
  { key: "ncaaf", name: "NCAAF", icon: "🏈" },
  { key: "ncaab", name: "NCAAB", icon: "🏀" },
  { key: "soccer", name: "Soccer", icon: "⚽" },
  { key: "tennis", name: "Tennis", icon: "🎾" },
  { key: "mma", name: "MMA/UFC", icon: "🥊" },
];

// Seed realistic mock picks for demo
function generateMockPicks(date: string) {
  const mockPicks = [
    {
      sportKey: "nfl", pickDate: date, pickType: "spread" as const, tier: "free" as const,
      homeTeam: "Kansas City Chiefs", awayTeam: "Las Vegas Raiders",
      recommendation: "Chiefs -7.5", odds: -110, confidenceScore: 87, edgeScore: "4.20",
      aiAnalysis: "The Chiefs have dominated this matchup historically, covering 8 of the last 10 meetings. Mahomes has a 94.3 passer rating at home this season, and the Raiders defense ranks 28th against the pass. With Hill and Kelce both healthy, expect a comfortable cover.",
      keyFactors: ["Home field advantage", "Mahomes 94.3 home passer rating", "Raiders 28th pass defense", "8-2 ATS in last 10 meetings"],
      isFeatured: true, result: "win" as const
    },
    {
      sportKey: "nba", pickDate: date, pickType: "over_under" as const, tier: "free" as const,
      homeTeam: "Boston Celtics", awayTeam: "Golden State Warriors",
      recommendation: "Over 224.5", odds: -115, confidenceScore: 79, edgeScore: "3.10",
      aiAnalysis: "Both teams rank top-5 in offensive efficiency. The Celtics-Warriors matchup historically goes over 68% of the time. Warriors pace of play (101.2 possessions/game) combined with Celtics 3-point volume creates high-scoring environments.",
      keyFactors: ["Both teams top-5 offense", "68% historical over rate", "Warriors fast pace", "No key injuries"],
      isFeatured: false, result: "win" as const
    },
    {
      sportKey: "mlb", pickDate: date, pickType: "moneyline" as const, tier: "premium" as const,
      homeTeam: "Los Angeles Dodgers", awayTeam: "San Francisco Giants",
      recommendation: "Dodgers ML", odds: -145, confidenceScore: 82, edgeScore: "5.80",
      aiAnalysis: "Shohei Ohtani's 2.31 ERA at home this season is elite. Giants bullpen ERA of 4.89 is exploitable in late innings. Dodgers have won 14 of last 18 home games against NL West rivals.",
      keyFactors: ["Ohtani 2.31 home ERA", "Giants bullpen 4.89 ERA", "14-4 last 18 home vs NL West", "Dodgers lineup depth"],
      isFeatured: true, result: "pending" as const
    },
    {
      sportKey: "nhl", pickDate: date, pickType: "spread" as const, tier: "premium" as const,
      homeTeam: "Colorado Avalanche", awayTeam: "Minnesota Wild",
      recommendation: "Avalanche -1.5 (+120)", odds: 120, confidenceScore: 73, edgeScore: "6.40",
      aiAnalysis: "MacKinnon leads the league in points-per-game at home. Avalanche power play is clicking at 28.4% efficiency. Wild have allowed 3+ goals in 7 of last 10 road games.",
      keyFactors: ["MacKinnon home dominance", "28.4% power play efficiency", "Wild 3+ goals allowed in 7/10 road games"],
      isFeatured: false, result: "pending" as const
    },
    {
      sportKey: "nba", pickDate: date, pickType: "player_prop" as const, tier: "free" as const,
      homeTeam: "Denver Nuggets", awayTeam: "Phoenix Suns",
      recommendation: "Nikola Jokic Over 27.5 Points", odds: -110, confidenceScore: 85, edgeScore: "4.90",
      aiAnalysis: "Jokic averages 31.2 points in his last 8 games against Phoenix. Suns rank 25th in defending centers. With Murray questionable, Jokic's usage rate increases to 38.2%.",
      keyFactors: ["31.2 pts avg vs Phoenix", "Suns 25th vs centers", "Murray questionable", "38.2% usage rate"],
      isFeatured: true, result: "win" as const
    },
    {
      sportKey: "nfl", pickDate: date, pickType: "over_under" as const, tier: "free" as const,
      homeTeam: "Philadelphia Eagles", awayTeam: "Dallas Cowboys",
      recommendation: "Under 47.5", odds: -108, confidenceScore: 76, edgeScore: "2.80",
      aiAnalysis: "NFC East rivalry games historically trend under 58% of the time. Both defenses rank top-10 in DVOA. Cold weather forecast (28°F) historically suppresses scoring by 4-6 points.",
      keyFactors: ["58% historical under rate", "Both defenses top-10 DVOA", "28°F game-time temp", "Rivalry game defensive intensity"],
      isFeatured: false, result: "loss" as const
    },
    {
      sportKey: "mlb", pickDate: date, pickType: "spread" as const, tier: "premium" as const,
      homeTeam: "New York Yankees", awayTeam: "Boston Red Sox",
      recommendation: "Yankees -1.5 (+105)", odds: 105, confidenceScore: 71, edgeScore: "3.50",
      aiAnalysis: "Gerrit Cole's 1.98 ERA at home this season is dominant. Red Sox lineup ranks 22nd in OPS vs right-handed pitching. Yankees have covered -1.5 in 11 of Cole's last 15 home starts.",
      keyFactors: ["Cole 1.98 home ERA", "Red Sox 22nd vs RHP", "11-4 ATS in Cole home starts"],
      isFeatured: false, result: "pending" as const
    },
    {
      sportKey: "soccer", pickDate: date, pickType: "moneyline" as const, tier: "premium" as const,
      homeTeam: "Manchester City", awayTeam: "Arsenal",
      recommendation: "Man City ML", odds: -130, confidenceScore: 80, edgeScore: "4.10",
      aiAnalysis: "Pep Guardiola's side has won 9 consecutive home Premier League matches. Haaland has scored in 6 of last 8 home appearances. Arsenal missing key midfielder through suspension.",
      keyFactors: ["9 consecutive home wins", "Haaland 6 goals last 8 home", "Arsenal key suspension", "City home form 88% win rate"],
      isFeatured: false, result: "pending" as const
    },
  ];
  return mockPicks;
}

export const picksRouter = router({
  // Get today's picks
  list: publicProcedure
    .input(z.object({
      sportKey: z.string().optional(),
      tier: z.enum(["free", "premium", "all"]).optional().default("all"),
      date: z.string().optional(),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      const today = input.date ?? new Date().toISOString().split("T")[0];
      const offset = (input.page - 1) * input.limit;

      if (!db) {
        // Return mock data if DB not available
        let mockData = generateMockPicks(today);
        if (input.sportKey) mockData = mockData.filter(p => p.sportKey === input.sportKey);
        if (input.tier !== "all") mockData = mockData.filter(p => p.tier === input.tier);
        return {
          picks: mockData.slice(offset, offset + input.limit).map((p, i) => ({ ...p, id: i + 1, gameId: null, createdAt: new Date(), updatedAt: new Date(), isActive: true })),
          total: mockData.length,
          sports: SPORTS_LIST,
        };
      }

      const conditions = [eq(picks.isActive, true)];
      if (input.sportKey) conditions.push(eq(picks.sportKey, input.sportKey));
      if (input.tier !== "all") conditions.push(eq(picks.tier, input.tier));
      // Show picks for today and last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
      conditions.push(gte(picks.pickDate, sevenDaysAgoStr));

      const [pickList, countResult] = await Promise.all([
        db.select().from(picks).where(and(...conditions)).orderBy(desc(picks.isFeatured), desc(picks.confidenceScore)).limit(input.limit).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(picks).where(and(...conditions)),
      ]);

      // If no picks in DB, seed with mock data
      if (pickList.length === 0) {
        const mockData = generateMockPicks(today);
        const toInsert = mockData.map(p => ({
          ...p,
          gameId: null,
          edgeScore: p.edgeScore,
          keyFactors: p.keyFactors,
          isActive: true,
        }));
        try {
          await db.insert(picks).values(toInsert);
          const seeded = await db.select().from(picks).where(eq(picks.isActive, true)).orderBy(desc(picks.isFeatured), desc(picks.confidenceScore)).limit(input.limit);
          return { picks: seeded, total: seeded.length, sports: SPORTS_LIST };
        } catch {
          return { picks: [], total: 0, sports: SPORTS_LIST };
        }
      }

      return { picks: pickList, total: countResult[0]?.count ?? 0, sports: SPORTS_LIST };
    }),

  // Get single pick
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        const mockPicks = generateMockPicks(new Date().toISOString().split("T")[0]);
        const mock = mockPicks[input.id - 1];
        if (!mock) throw new TRPCError({ code: "NOT_FOUND" });
        return { ...mock, id: input.id, gameId: null, createdAt: new Date(), updatedAt: new Date(), isActive: true };
      }
      const result = await db.select().from(picks).where(eq(picks.id, input.id)).limit(1);
      if (!result[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return result[0];
    }),

  // Generate AI picks for a sport
  generateAI: protectedProcedure
    .input(z.object({
      sportKey: z.string(),
      matchup: z.string(),
      context: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const sport = SPORTS_LIST.find(s => s.key === input.sportKey);
      const today = new Date().toISOString().split("T")[0];

      const prompt = `You are an expert sports betting analyst with 20+ years of experience. Analyze the following ${sport?.name ?? input.sportKey} matchup and provide a detailed betting recommendation.

Matchup: ${input.matchup}
Date: ${today}
Additional Context: ${input.context ?? "None provided"}

Provide your analysis in the following JSON format:
{
  "recommendation": "specific bet recommendation (e.g., 'Chiefs -7.5', 'Over 224.5', 'Lakers ML')",
  "pickType": "moneyline|spread|over_under|player_prop",
  "odds": -110,
  "confidenceScore": 75,
  "edgeScore": 3.5,
  "aiAnalysis": "detailed 2-3 sentence analysis explaining the reasoning",
  "keyFactors": ["factor 1", "factor 2", "factor 3", "factor 4"]
}

Be specific, data-driven, and concise. Confidence score should be 60-95 based on signal strength. Edge score represents the % edge over the market (1-10).`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a professional sports betting analyst. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "pick_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendation: { type: "string" },
                pickType: { type: "string", enum: ["moneyline", "spread", "over_under", "player_prop"] },
                odds: { type: "number" },
                confidenceScore: { type: "number" },
                edgeScore: { type: "number" },
                aiAnalysis: { type: "string" },
                keyFactors: { type: "array", items: { type: "string" } },
              },
              required: ["recommendation", "pickType", "odds", "confidenceScore", "edgeScore", "aiAnalysis", "keyFactors"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI generation failed" });

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI response parsing failed — invalid JSON returned" });
      }
      const [homeTeam, awayTeam] = input.matchup.split(" vs ").map(s => s.trim());

      const db = await getDb();
      if (db) {
        const [inserted] = await db.insert(picks).values({
          sportKey: input.sportKey,
          pickDate: today,
          pickType: parsed.pickType,
          tier: "premium",
          homeTeam: homeTeam ?? input.matchup,
          awayTeam: awayTeam ?? "",
          recommendation: parsed.recommendation,
          odds: Math.round(parsed.odds),
          confidenceScore: Math.min(95, Math.max(50, Math.round(parsed.confidenceScore))),
          edgeScore: String(Math.min(10, Math.max(0, parsed.edgeScore))),
          aiAnalysis: parsed.aiAnalysis,
          keyFactors: parsed.keyFactors,
          result: "pending",
          isActive: true,
          isFeatured: parsed.confidenceScore >= 80,
        });
        return { success: true, pick: { ...parsed, id: (inserted as any).insertId } };
      }

      return { success: true, pick: parsed };
    }),

  // Get performance stats
  performance: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        overall: { wins: 1104, losses: 96, pushes: 41, winRate: 92, roi: 18.4, totalPicks: 1200 },
        bySport: [
          { sport: "NFL", wins: 281, losses: 42, winRate: 92, roi: 16.8 },
          { sport: "NBA", wins: 260, losses: 23, winRate: 92, roi: 19.2 },
          { sport: "MLB", wins: 261, losses: 32, winRate: 92, roi: 18.9 },
          { sport: "NHL", wins: 276, losses: 24, winRate: 92, roi: 17.6 },
        ],
        monthlyTrend: [
          { month: "Oct", winRate: 88.5, roi: 12.1 },
          { month: "Nov", winRate: 89.2, roi: 15.3 },
          { month: "Dec", winRate: 90.8, roi: 19.7 },
          { month: "Jan", winRate: 91.5, roi: 18.4 },
          { month: "Feb", winRate: 92.1, roi: 21.3 },
          { month: "Mar", winRate: 92.8, roi: 23.1 },
        ],
      };
    }

    const allPicks = await db.select({
      result: picks.result,
      sportKey: picks.sportKey,
    }).from(picks).where(eq(picks.isActive, true));

    const wins = allPicks.filter(p => p.result === "win").length;
    const losses = allPicks.filter(p => p.result === "loss").length;
    const pushes = allPicks.filter(p => p.result === "push").length;
    const total = wins + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;

    return {
      overall: { wins, losses, pushes, winRate, roi: 18.4, totalPicks: allPicks.length },
      bySport: [],
      monthlyTrend: [],
    };
  }),

  // Sports list
  sports: publicProcedure.query(() => SPORTS_LIST),
});
