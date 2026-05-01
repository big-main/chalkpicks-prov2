import { protectedProcedure, publicProcedure, router, premiumProcedure } from "../_core/trpc";
import { z } from "zod/v4";

// Mock live sports data — in production, integrate with The Odds API, ESPN API, etc.
function generateLiveGames(sportKey: string) {
  const gamesBySport: Record<string, any[]> = {
    nfl: [
      { id: 1, homeTeam: "Kansas City Chiefs", awayTeam: "Las Vegas Raiders", homeScore: 21, awayScore: 14, status: "live", quarter: "3rd", timeLeft: "8:42", homeMoneyline: -280, awayMoneyline: 230, spread: -7.5, overUnder: 47.5, venue: "Arrowhead Stadium" },
      { id: 2, homeTeam: "Philadelphia Eagles", awayTeam: "Dallas Cowboys", homeScore: 0, awayScore: 0, status: "scheduled", gameTime: "8:20 PM ET", homeMoneyline: -165, awayMoneyline: 140, spread: -3.5, overUnder: 44.5, venue: "Lincoln Financial Field" },
      { id: 3, homeTeam: "San Francisco 49ers", awayTeam: "Seattle Seahawks", homeScore: 28, awayScore: 17, status: "final", homeMoneyline: -220, awayMoneyline: 185, spread: -6.5, overUnder: 46.0, venue: "Levi's Stadium" },
    ],
    nba: [
      { id: 4, homeTeam: "Boston Celtics", awayTeam: "Golden State Warriors", homeScore: 67, awayScore: 61, status: "live", quarter: "3rd", timeLeft: "4:12", homeMoneyline: -185, awayMoneyline: 155, spread: -4.5, overUnder: 224.5, venue: "TD Garden" },
      { id: 5, homeTeam: "Denver Nuggets", awayTeam: "Phoenix Suns", homeScore: 0, awayScore: 0, status: "scheduled", gameTime: "9:00 PM ET", homeMoneyline: -145, awayMoneyline: 122, spread: -3.0, overUnder: 228.5, venue: "Ball Arena" },
      { id: 6, homeTeam: "Los Angeles Lakers", awayTeam: "Miami Heat", homeScore: 112, awayScore: 98, status: "final", homeMoneyline: -175, awayMoneyline: 148, spread: -4.5, overUnder: 218.0, venue: "Crypto.com Arena" },
    ],
    mlb: [
      { id: 7, homeTeam: "Los Angeles Dodgers", awayTeam: "San Francisco Giants", homeScore: 4, awayScore: 2, status: "live", inning: "7th", homeMoneyline: -175, awayMoneyline: 148, overUnder: 8.5, venue: "Dodger Stadium" },
      { id: 8, homeTeam: "New York Yankees", awayTeam: "Boston Red Sox", homeScore: 0, awayScore: 0, status: "scheduled", gameTime: "7:05 PM ET", homeMoneyline: -155, awayMoneyline: 132, overUnder: 9.0, venue: "Yankee Stadium" },
    ],
    nhl: [
      { id: 9, homeTeam: "Colorado Avalanche", awayTeam: "Minnesota Wild", homeScore: 3, awayScore: 1, status: "live", period: "2nd", timeLeft: "11:23", homeMoneyline: -195, awayMoneyline: 162, spread: -1.5, overUnder: 6.5, venue: "Ball Arena" },
    ],
  };
  return gamesBySort[sportKey] ?? gamesBySort.nfl ?? [];
}

const gamesBySort: Record<string, any[]> = {
  nfl: [
    { id: 1, homeTeam: "Kansas City Chiefs", awayTeam: "Las Vegas Raiders", homeScore: 21, awayScore: 14, status: "live", quarter: "3rd", timeLeft: "8:42", homeMoneyline: -280, awayMoneyline: 230, spread: -7.5, overUnder: 47.5, venue: "Arrowhead Stadium" },
    { id: 2, homeTeam: "Philadelphia Eagles", awayTeam: "Dallas Cowboys", homeScore: 0, awayScore: 0, status: "scheduled", gameTime: "8:20 PM ET", homeMoneyline: -165, awayMoneyline: 140, spread: -3.5, overUnder: 44.5, venue: "Lincoln Financial Field" },
    { id: 3, homeTeam: "San Francisco 49ers", awayTeam: "Seattle Seahawks", homeScore: 28, awayScore: 17, status: "final", homeMoneyline: -220, awayMoneyline: 185, spread: -6.5, overUnder: 46.0, venue: "Levi's Stadium" },
  ],
  nba: [
    { id: 4, homeTeam: "Boston Celtics", awayTeam: "Golden State Warriors", homeScore: 67, awayScore: 61, status: "live", quarter: "3rd", timeLeft: "4:12", homeMoneyline: -185, awayMoneyline: 155, spread: -4.5, overUnder: 224.5, venue: "TD Garden" },
    { id: 5, homeTeam: "Denver Nuggets", awayTeam: "Phoenix Suns", homeScore: 0, awayScore: 0, status: "scheduled", gameTime: "9:00 PM ET", homeMoneyline: -145, awayMoneyline: 122, spread: -3.0, overUnder: 228.5, venue: "Ball Arena" },
    { id: 6, homeTeam: "Los Angeles Lakers", awayTeam: "Miami Heat", homeScore: 112, awayScore: 98, status: "final", homeMoneyline: -175, awayMoneyline: 148, spread: -4.5, overUnder: 218.0, venue: "Crypto.com Arena" },
  ],
  mlb: [
    { id: 7, homeTeam: "Los Angeles Dodgers", awayTeam: "San Francisco Giants", homeScore: 4, awayScore: 2, status: "live", inning: "7th", homeMoneyline: -175, awayMoneyline: 148, overUnder: 8.5, venue: "Dodger Stadium" },
    { id: 8, homeTeam: "New York Yankees", awayTeam: "Boston Red Sox", homeScore: 0, awayScore: 0, status: "scheduled", gameTime: "7:05 PM ET", homeMoneyline: -155, awayMoneyline: 132, overUnder: 9.0, venue: "Yankee Stadium" },
  ],
  nhl: [
    { id: 9, homeTeam: "Colorado Avalanche", awayTeam: "Minnesota Wild", homeScore: 3, awayScore: 1, status: "live", period: "2nd", timeLeft: "11:23", homeMoneyline: -195, awayMoneyline: 162, spread: -1.5, overUnder: 6.5, venue: "Ball Arena" },
  ],
  soccer: [
    { id: 10, homeTeam: "Manchester City", awayTeam: "Arsenal", homeScore: 2, awayScore: 1, status: "live", minute: "67", homeMoneyline: -130, awayMoneyline: 340, spread: null, overUnder: 3.0, venue: "Etihad Stadium" },
  ],
};

const topPlayers: Record<string, any[]> = {
  nfl: [
    { id: 1, name: "Patrick Mahomes", team: "Kansas City Chiefs", position: "QB", stats: { passingYards: 4823, touchdowns: 38, interceptions: 11, rating: 105.2 }, trend: "up", status: "active" },
    { id: 2, name: "Lamar Jackson", team: "Baltimore Ravens", position: "QB", stats: { passingYards: 4172, touchdowns: 41, interceptions: 8, rating: 112.4 }, trend: "up", status: "active" },
    { id: 3, name: "Christian McCaffrey", team: "San Francisco 49ers", position: "RB", stats: { rushingYards: 1459, touchdowns: 21, receptions: 67 }, trend: "stable", status: "questionable" },
    { id: 4, name: "Tyreek Hill", team: "Miami Dolphins", position: "WR", stats: { receivingYards: 1799, touchdowns: 13, receptions: 119 }, trend: "up", status: "active" },
    { id: 5, name: "Travis Kelce", team: "Kansas City Chiefs", position: "TE", stats: { receivingYards: 984, touchdowns: 9, receptions: 93 }, trend: "stable", status: "active" },
  ],
  nba: [
    { id: 6, name: "Nikola Jokic", team: "Denver Nuggets", position: "C", stats: { points: 26.4, rebounds: 12.4, assists: 9.0, fg: 58.3 }, trend: "up", status: "active" },
    { id: 7, name: "Luka Doncic", team: "Dallas Mavericks", position: "PG", stats: { points: 33.9, rebounds: 9.2, assists: 9.8, fg: 47.1 }, trend: "up", status: "active" },
    { id: 8, name: "Giannis Antetokounmpo", team: "Milwaukee Bucks", position: "PF", stats: { points: 30.4, rebounds: 11.5, assists: 6.5, fg: 61.1 }, trend: "stable", status: "active" },
    { id: 9, name: "Stephen Curry", team: "Golden State Warriors", position: "PG", stats: { points: 29.4, rebounds: 4.5, assists: 6.1, fg: 45.2, threeP: 42.7 }, trend: "up", status: "active" },
    { id: 10, name: "Joel Embiid", team: "Philadelphia 76ers", position: "C", stats: { points: 34.7, rebounds: 11.0, assists: 5.6, fg: 52.8 }, trend: "down", status: "injured" },
  ],
  mlb: [
    { id: 11, name: "Shohei Ohtani", team: "Los Angeles Dodgers", position: "DH/SP", stats: { avg: 0.310, homeRuns: 44, rbi: 130, era: 3.14, strikeouts: 219 }, trend: "up", status: "active" },
    { id: 12, name: "Mookie Betts", team: "Los Angeles Dodgers", position: "SS", stats: { avg: 0.307, homeRuns: 39, rbi: 107, ops: 1.009 }, trend: "up", status: "active" },
    { id: 13, name: "Aaron Judge", team: "New York Yankees", position: "RF", stats: { avg: 0.322, homeRuns: 58, rbi: 144, ops: 1.159 }, trend: "stable", status: "active" },
  ],
  nhl: [
    { id: 14, name: "Nathan MacKinnon", team: "Colorado Avalanche", position: "C", stats: { goals: 42, assists: 69, points: 111, plusMinus: 28 }, trend: "up", status: "active" },
    { id: 15, name: "Connor McDavid", team: "Edmonton Oilers", position: "C", stats: { goals: 64, assists: 89, points: 153, plusMinus: 22 }, trend: "up", status: "active" },
  ],
};

export const statsRouter = router({
  liveGames: premiumProcedure
    .input(z.object({ sportKey: z.string().optional().default("nfl") }))
    .query(({ input }) => {
      return gamesBySort[input.sportKey] ?? gamesBySort.nfl ?? [];
    }),

  allGames: premiumProcedure.query(() => {
    return Object.entries(gamesBySort).flatMap(([sport, games]) =>
      games.map(g => ({ ...g, sportKey: sport }))
    );
  }),

  topPlayers: publicProcedure
    .input(z.object({ sportKey: z.string().optional().default("nfl"), limit: z.number().optional().default(5) }))
    .query(({ input }) => {
      const players = topPlayers[input.sportKey] ?? topPlayers.nfl ?? [];
      return players.slice(0, input.limit);
    }),

  injuryReport: publicProcedure
    .input(z.object({ sportKey: z.string().optional().default("nfl") }))
    .query(({ input }) => {
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
    .input(z.object({ gameId: z.number() }))
    .query(({ input }) => {
      // Mock odds movement data for charts
      const hours = Array.from({ length: 24 }, (_, i) => i);
      return hours.map(h => ({
        time: `${h}:00`,
        homeML: -200 + Math.floor(Math.random() * 40) - 20,
        awayML: 168 + Math.floor(Math.random() * 30) - 15,
        spread: -3.5 + (Math.random() * 0.5 - 0.25),
        ou: 224.5 + (Math.random() * 2 - 1),
      }));
    }),
});
