import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  scrapeWithFirecrawl,
  scrapeSpotrsNews,
  scrapeOdds,
  extractBettingData,
} from "../services/firecrawlService";

export const firecrawlRouter = router({
  // Scrape any URL
  scrapeUrl: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        formats: z.array(z.enum(["markdown", "html"])).optional(),
        onlyMainContent: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return scrapeWithFirecrawl({
        url: input.url,
        formats: input.formats,
        onlyMainContent: input.onlyMainContent,
      });
    }),

  // Scrape sports news from major sources
  scrapeNews: protectedProcedure
    .input(
      z.object({
        source: z.enum(["espn", "draftkings", "fanduel", "betmgm"]),
      })
    )
    .query(async ({ input }) => {
      return scrapeSpotrsNews(input.source);
    }),

  // Scrape odds from betting websites
  scrapeOdds: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      return scrapeOdds(input.url);
    }),

  // Extract betting data from content
  extractData: protectedProcedure
    .input(
      z.object({
        content: z.string(),
      })
    )
    .query(async ({ input }) => {
      return extractBettingData(input.content);
    }),

  // Admin: Test Firecrawl connection
  testConnection: adminProcedure.query(async () => {
    const result = await scrapeWithFirecrawl({
      url: "https://example.com",
      formats: ["markdown"],
    });

    return {
      connected: result.success,
      message: result.success
        ? "Firecrawl API connection successful"
        : result.error || "Unknown error",
    };
  }),
});
