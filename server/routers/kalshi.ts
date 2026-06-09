import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { kalshiService } from "../_core/kalshi";

export const kalshiRouter = router({
  /**
   * Get all open markets from Kalshi
   */
  getSportsMarkets: publicProcedure.query(async () => {
    return kalshiService.getSportsMarkets();
  }),

  /**
   * Get all open markets (alias for getSportsMarkets)
   */
  getPoliticsMarkets: publicProcedure.query(async () => {
    return kalshiService.getAllMarkets();
  }),

  /**
   * Get all open markets (alias for getSportsMarkets)
   */
  getCryptoMarkets: publicProcedure.query(async () => {
    return kalshiService.getAllMarkets();
  }),

  /**
   * Get a specific market by ID
   */
  getMarketById: publicProcedure
    .input(z.object({ marketId: z.string() }))
    .query(async ({ input }) => {
      return kalshiService.fetchMarketById(input.marketId);
    }),

  /**
   * Get market history for line movement analysis
   */
  getMarketHistory: publicProcedure
    .input(z.object({ marketId: z.string() }))
    .query(async ({ input }) => {
      return kalshiService.fetchMarketHistory(input.marketId);
    }),

  /**
   * Analyze a market for trading signals
   */
  analyzeMarket: publicProcedure
    .input(z.object({ marketId: z.string() }))
    .query(async ({ input }) => {
      const market = await kalshiService.fetchMarketById(input.marketId);
      if (!market) {
        return null;
      }

      const history = await kalshiService.fetchMarketHistory(input.marketId);
      return kalshiService.analyzeMarket(market, history);
    }),

  /**
   * Search for markets by keyword
   */
  searchMarkets: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      // Fetch all markets and filter by query
      const allMarkets = await kalshiService.fetchMarkets({ limit: 100 });
      return allMarkets
        .filter(
          (m) =>
            m.title.toLowerCase().includes(input.query.toLowerCase()) ||
            m.description?.toLowerCase().includes(input.query.toLowerCase())
        )
        .slice(0, input.limit);
    }),

  /**
   * Get trending markets (high volume, recent activity)
   */
  getTrendingMarkets: publicProcedure.query(async () => {
    const markets = await kalshiService.fetchMarkets({ limit: 100 });
    // Sort by volume descending
    return markets.sort((a, b) => b.volume - a.volume).slice(0, 20);
  }),

  /**
   * Get market alerts (significant line movements)
   */
  getMarketAlerts: publicProcedure.query(async () => {
    const markets = await kalshiService.fetchMarkets({ limit: 100 });
    const alerts = [];

    for (const market of markets.slice(0, 20)) {
      const history = await kalshiService.fetchMarketHistory(market.id);
      if (history.length > 1) {
        const analysis = await kalshiService.analyzeMarket(market, history);
        if (analysis.sharp_money_detected || analysis.line_movement.change_percentage > 5) {
          alerts.push(analysis);
        }
      }
    }

    return alerts.sort((a, b) => b.confidence_score - a.confidence_score);
  }),
});
