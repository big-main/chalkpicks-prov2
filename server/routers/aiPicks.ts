import { router, proProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  generatePickAnalysis,
  generateBettingInsights,
  analyzeSteamMove,
  calculateExpectedValue,
} from "../services/aiService";

export const aiPicksRouter = router({
  /**
   * Generate AI-powered pick analysis
   * Pro tier only
   */
  generatePick: proProcedure
    .input(
      z.object({
        sport: z.string(),
        matchup: z.string(),
        pickType: z.enum(["moneyline", "spread", "over_under", "player_prop"]),
        odds: z.number(),
        reasoning: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const analysis = await generatePickAnalysis(input);
        return {
          success: true,
          data: analysis,
        };
      } catch (error: any) {
        console.error("Error generating pick:", error);
        return {
          success: false,
          error: error.message || "Failed to generate pick",
        };
      }
    }),

  /**
   * Get betting insights for a given context
   * Pro tier only
   */
  getInsights: proProcedure
    .input(
      z.object({
        context: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const insights = await generateBettingInsights(input.context);
        return {
          success: true,
          insights,
        };
      } catch (error: any) {
        console.error("Error generating insights:", error);
        return {
          success: false,
          error: error.message || "Failed to generate insights",
        };
      }
    }),

  /**
   * Analyze steam moves (sharp money movement)
   * Pro tier only
   */
  analyzeSteam: proProcedure
    .input(
      z.object({
        sport: z.string(),
        matchup: z.string(),
        lineMovement: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const analysis = await analyzeSteamMove(
          input.sport,
          input.matchup,
          input.lineMovement
        );
        return {
          success: true,
          data: analysis,
        };
      } catch (error: any) {
        console.error("Error analyzing steam:", error);
        return {
          success: false,
          error: error.message || "Failed to analyze steam move",
        };
      }
    }),

  /**
   * Calculate expected value with AI recommendation
   * Public access (free users can learn about EV)
   */
  calculateEV: publicProcedure
    .input(
      z.object({
        odds: z.number(),
        winProbability: z.number().min(0).max(1),
        analysis: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await calculateExpectedValue(
          input.odds,
          input.winProbability,
          input.analysis
        );
        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        console.error("Error calculating EV:", error);
        return {
          success: false,
          error: error.message || "Failed to calculate EV",
        };
      }
    }),
});
