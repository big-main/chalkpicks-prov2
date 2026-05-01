import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

function impliedProb(american: number): number {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

function noVigProb(prob1: number, prob2: number): [number, number] {
  const total = prob1 + prob2;
  return [prob1 / total, prob2 / total];
}

function calcEV(trueProb: number, decimalOdds: number): number {
  return (trueProb * (decimalOdds - 1) - (1 - trueProb)) * 100;
}

// ─── Mock data generators (replace with real API when key is available) ──────

function generateMockOdds(sport: string) {
  const games: Record<string, { home: string; away: string }[]> = {
    americanfootball_nfl: [
      { home: "Kansas City Chiefs", away: "Buffalo Bills" },
      { home: "San Francisco 49ers", away: "Dallas Cowboys" },
      { home: "Philadelphia Eagles", away: "Baltimore Ravens" },
    ],
    basketball_nba: [
      { home: "Boston Celtics", away: "Miami Heat" },
      { home: "Denver Nuggets", away: "Los Angeles Lakers" },
      { home: "Golden State Warriors", away: "Phoenix Suns" },
      { home: "Milwaukee Bucks", away: "Chicago Bulls" },
    ],
    baseball_mlb: [
      { home: "New York Yankees", away: "Boston Red Sox" },
      { home: "Los Angeles Dodgers", away: "San Francisco Giants" },
      { home: "Houston Astros", away: "Texas Rangers" },
    ],
    icehockey_nhl: [
      { home: "Colorado Avalanche", away: "Tampa Bay Lightning" },
      { home: "Toronto Maple Leafs", away: "Montreal Canadiens" },
    ],
    soccer_epl: [
      { home: "Manchester City", away: "Arsenal" },
      { home: "Liverpool", away: "Chelsea" },
      { home: "Tottenham", away: "Manchester United" },
    ],
  };

  const bookmakers = ["DraftKings", "FanDuel", "BetMGM", "Caesars", "PointsBet", "BetRivers"];
  const sportsGames = sport === "all"
    ? Object.entries(games).flatMap(([s, gs]) => gs.map((g) => ({ ...g, sport: s })))
    : (games[sport] ?? []).map((g) => ({ ...g, sport }));

  return sportsGames.map((game) => {
    const baseHomeOdds = Math.random() > 0.5 ? -(Math.floor(Math.random() * 150) + 110) : Math.floor(Math.random() * 150) + 110;
    const baseAwayOdds = baseHomeOdds > 0 ? -(Math.floor(Math.random() * 150) + 110) : Math.floor(Math.random() * 150) + 110;

    return {
      ...game,
      commenceTime: new Date(Date.now() + Math.random() * 7 * 24 * 3600000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      bookmakers: bookmakers.map((bm) => ({
        name: bm,
        homeOdds: baseHomeOdds + Math.floor((Math.random() - 0.5) * 20),
        awayOdds: baseAwayOdds + Math.floor((Math.random() - 0.5) * 20),
        totalOver: -(Math.floor(Math.random() * 20) + 100),
        totalUnder: -(Math.floor(Math.random() * 20) + 100),
        total: (Math.random() * 40 + 180).toFixed(1),
      })),
    };
  });
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const oddsRouter = router({
  // +EV Opportunities
  getEVOpportunities: publicProcedure
    .input(z.object({ sport: z.string().default("all"), minEV: z.number().default(0) }))
    .query(async ({ input }) => {
      const games = generateMockOdds(input.sport);
      const opportunities: {
        sport: string;
        homeTeam: string;
        awayTeam: string;
        commenceTime: string;
        betDescription: string;
        bookOdds: number;
        trueOdds: number;
        trueProb: number;
        bookmaker: string;
        ev: number;
      }[] = [];

      for (const game of games) {
        // Calculate consensus (no-vig) probabilities
        const homeProbs = game.bookmakers.map((b) => impliedProb(b.homeOdds));
        const awayProbs = game.bookmakers.map((b) => impliedProb(b.awayOdds));
        const avgHomeProb = homeProbs.reduce((a, b) => a + b, 0) / homeProbs.length;
        const avgAwayProb = awayProbs.reduce((a, b) => a + b, 0) / awayProbs.length;
        const [trueHomeProb, trueAwayProb] = noVigProb(avgHomeProb, avgAwayProb);

        for (const bm of game.bookmakers) {
          const homeDecimal = americanToDecimal(bm.homeOdds);
          const awayDecimal = americanToDecimal(bm.awayOdds);
          const homeEV = calcEV(trueHomeProb, homeDecimal);
          const awayEV = calcEV(trueAwayProb, awayDecimal);

          if (homeEV >= input.minEV) {
            opportunities.push({
              sport: game.sport,
              homeTeam: game.home,
              awayTeam: game.away,
              commenceTime: game.commenceTime,
              betDescription: `${game.home} ML`,
              bookOdds: bm.homeOdds,
              trueOdds: decimalToAmerican(1 / trueHomeProb),
              trueProb: trueHomeProb,
              bookmaker: bm.name,
              ev: parseFloat(homeEV.toFixed(2)),
            });
          }
          if (awayEV >= input.minEV) {
            opportunities.push({
              sport: game.sport,
              homeTeam: game.home,
              awayTeam: game.away,
              commenceTime: game.commenceTime,
              betDescription: `${game.away} ML`,
              bookOdds: bm.awayOdds,
              trueOdds: decimalToAmerican(1 / trueAwayProb),
              trueProb: trueAwayProb,
              bookmaker: bm.name,
              ev: parseFloat(awayEV.toFixed(2)),
            });
          }
        }
      }

      return {
        opportunities: opportunities.sort((a, b) => b.ev - a.ev).slice(0, 50),
        updatedAt: new Date().toISOString(),
      };
    }),

  // Live odds comparison across books
  getLiveOdds: publicProcedure
    .input(z.object({ sport: z.string().default("basketball_nba") }))
    .query(async ({ input }) => {
      const games = generateMockOdds(input.sport);
      return {
        games: games.map((g) => ({
          sport: g.sport,
          homeTeam: g.home,
          awayTeam: g.away,
          commenceTime: g.commenceTime,
          bookmakers: g.bookmakers,
          bestHomeOdds: Math.max(...g.bookmakers.map((b) => b.homeOdds)),
          bestAwayOdds: Math.max(...g.bookmakers.map((b) => b.awayOdds)),
          bestHomeBook: g.bookmakers.reduce((best, b) => b.homeOdds > best.homeOdds ? b : best).name,
          bestAwayBook: g.bookmakers.reduce((best, b) => b.awayOdds > best.awayOdds ? b : best).name,
        })),
        updatedAt: new Date().toISOString(),
      };
    }),

  // Steam moves (sharp line movement detector)
  getSteamMoves: publicProcedure
    .input(z.object({ sport: z.string().default("all"), hours: z.number().default(3) }))
    .query(async ({ input }) => {
      const sports = input.sport === "all"
        ? ["americanfootball_nfl", "basketball_nba", "baseball_mlb", "icehockey_nhl"]
        : [input.sport];

      const steamMoves = [
        { sport: "basketball_nba", homeTeam: "Boston Celtics", awayTeam: "Miami Heat", team: "Boston Celtics", direction: "down" as const, openingOdds: -130, currentOdds: -155, movement: -25, pctBets: 45, pctMoney: 72, steamTime: "14 min ago", sharpAction: true, confidence: 92 },
        { sport: "americanfootball_nfl", homeTeam: "Kansas City Chiefs", awayTeam: "Buffalo Bills", team: "Buffalo Bills", direction: "up" as const, openingOdds: 115, currentOdds: 135, movement: 20, pctBets: 38, pctMoney: 61, steamTime: "28 min ago", sharpAction: true, confidence: 87 },
        { sport: "baseball_mlb", homeTeam: "New York Yankees", awayTeam: "Boston Red Sox", team: "Boston Red Sox", direction: "up" as const, openingOdds: 105, currentOdds: 120, movement: 15, pctBets: 41, pctMoney: 65, steamTime: "1 hr ago", sharpAction: true, confidence: 78 },
        { sport: "basketball_nba", homeTeam: "Denver Nuggets", awayTeam: "Los Angeles Lakers", team: "Los Angeles Lakers", direction: "up" as const, openingOdds: 140, currentOdds: 158, movement: 18, pctBets: 35, pctMoney: 58, steamTime: "2 hr ago", sharpAction: false, confidence: 65 },
        { sport: "icehockey_nhl", homeTeam: "Colorado Avalanche", awayTeam: "Tampa Bay Lightning", team: "Colorado Avalanche", direction: "down" as const, openingOdds: -120, currentOdds: -145, movement: -25, pctBets: 52, pctMoney: 74, steamTime: "3 hr ago", sharpAction: true, confidence: 88 },
      ].filter((m) => input.sport === "all" || m.sport === input.sport);

      return { steamMoves, updatedAt: new Date().toISOString() };
    }),

  // Public betting percentages
  getPublicBetting: publicProcedure
    .input(z.object({ sport: z.string().default("basketball_nba") }))
    .query(async ({ input }) => {
      const games = generateMockOdds(input.sport);
      return {
        games: games.slice(0, 8).map((g) => {
          const homePublicPct = Math.floor(Math.random() * 70) + 15;
          const awayPublicPct = 100 - homePublicPct;
          const homeMoneyPct = Math.floor(Math.random() * 70) + 15;
          const awayMoneyPct = 100 - homeMoneyPct;
          const isSharpFade = Math.abs(homePublicPct - homeMoneyPct) > 20;
          return {
            sport: g.sport,
            homeTeam: g.home,
            awayTeam: g.away,
            commenceTime: g.commenceTime,
            homePublicPct,
            awayPublicPct,
            homeMoneyPct,
            awayMoneyPct,
            homeOdds: g.bookmakers[0]?.homeOdds ?? -110,
            awayOdds: g.bookmakers[0]?.awayOdds ?? -110,
            isSharpFade,
            sharpSide: homeMoneyPct > awayMoneyPct ? g.home : g.away,
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    }),

  // Kelly Criterion calculator
  calculateKelly: publicProcedure
    .input(z.object({
      bankroll: z.number().positive(),
      odds: z.number(),
      winProbability: z.number().min(0).max(1),
      fractionKelly: z.number().min(0.1).max(1).default(0.5),
    }))
    .query(({ input }) => {
      const { bankroll, odds, winProbability, fractionKelly } = input;
      const decimal = americanToDecimal(odds);
      const b = decimal - 1; // net odds
      const p = winProbability;
      const q = 1 - p;
      const kelly = (b * p - q) / b;
      const fractionalKelly = kelly * fractionKelly;
      const betAmount = Math.max(0, bankroll * fractionalKelly);
      const ev = calcEV(p, decimal);
      const impliedP = impliedProb(odds);
      const edge = (p - impliedP) * 100;

      return {
        kelly: parseFloat((kelly * 100).toFixed(2)),
        fractionalKelly: parseFloat((fractionalKelly * 100).toFixed(2)),
        betAmount: parseFloat(betAmount.toFixed(2)),
        ev: parseFloat(ev.toFixed(2)),
        edge: parseFloat(edge.toFixed(2)),
        impliedProbability: parseFloat((impliedP * 100).toFixed(2)),
        potentialProfit: parseFloat((betAmount * b).toFixed(2)),
        riskReward: parseFloat((b / 1).toFixed(2)),
        isPositiveEV: ev > 0,
        recommendation: kelly <= 0 ? "NO BET — Negative edge" : kelly < 0.02 ? "SMALL BET — Marginal edge" : kelly < 0.05 ? "MODERATE BET — Good edge" : "STRONG BET — High edge",
      };
    }),

  // Parlay optimizer
  optimizeParlay: publicProcedure
    .input(z.object({
      legs: z.array(z.object({
        description: z.string(),
        odds: z.number(),
        winProbability: z.number().min(0).max(1),
      })).min(2).max(8),
      correlationBoost: z.boolean().default(false),
    }))
    .query(({ input }) => {
      const { legs, correlationBoost } = input;
      const combinedProb = legs.reduce((acc, leg) => acc * leg.winProbability, 1);
      const combinedDecimalOdds = legs.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1);
      const combinedAmericanOdds = decimalToAmerican(combinedDecimalOdds);
      const trueOdds = 1 / combinedProb;
      const ev = calcEV(combinedProb, combinedDecimalOdds);
      const vig = ((1 / combinedDecimalOdds) - combinedProb) * 100;
      const correlationFactor = correlationBoost ? 1.05 : 1.0;
      const adjustedProb = Math.min(combinedProb * correlationFactor, 0.99);
      const adjustedEV = calcEV(adjustedProb, combinedDecimalOdds);

      return {
        combinedOdds: combinedAmericanOdds,
        combinedDecimalOdds: parseFloat(combinedDecimalOdds.toFixed(2)),
        combinedProbability: parseFloat((combinedProb * 100).toFixed(2)),
        trueOdds: decimalToAmerican(trueOdds),
        ev: parseFloat(ev.toFixed(2)),
        adjustedEV: parseFloat(adjustedEV.toFixed(2)),
        vig: parseFloat(vig.toFixed(2)),
        recommendation: ev > 0 ? "POSITIVE EV PARLAY ✓" : ev > -5 ? "MARGINAL — Consider single bets" : "AVOID — High vig parlay",
        legs: legs.map((leg) => ({
          ...leg,
          impliedProbability: parseFloat((impliedProb(leg.odds) * 100).toFixed(1)),
          edge: parseFloat(((leg.winProbability - impliedProb(leg.odds)) * 100).toFixed(1)),
        })),
      };
    }),
});
