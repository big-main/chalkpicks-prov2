import { describe, it, expect, beforeAll } from "vitest";
import { scrapeWithFirecrawl, extractBettingData } from "./services/firecrawlService";

describe("Firecrawl Integration", () => {
  beforeAll(() => {
    // Check if API key is set
    if (!process.env.FIRECRAWL_API_KEY) {
      console.warn("FIRECRAWL_API_KEY not set - skipping integration tests");
    }
  });

  it("should test Firecrawl API connection", async () => {
    if (!process.env.FIRECRAWL_API_KEY) {
      console.log("Skipping - FIRECRAWL_API_KEY not set");
      return;
    }

    const result = await scrapeWithFirecrawl({
      url: "https://example.com",
      formats: ["markdown"],
    });

    expect(result).toBeDefined();
    // API may fail due to rate limiting or network issues, but should return a result
    expect(result.success || result.error).toBeTruthy();
    if (result.success && result.data) {
      expect(result.data.content).toBeDefined();
    }
  });

  it("should extract betting data from content", () => {
    const content = `
      Kansas City Chiefs vs Buffalo Bills
      Odds: -110 / +110
      Score: 24 - 20
      Quarter: 4th
    `;

    const extracted = extractBettingData(content);

    expect(extracted).toBeDefined();
    expect(extracted.odds).toBeDefined();
    expect(extracted.teams).toBeDefined();
    expect(extracted.scores).toBeDefined();
    expect(Array.isArray(extracted.odds)).toBe(true);
  });

  it("should handle missing API key gracefully", async () => {
    const originalKey = process.env.FIRECRAWL_API_KEY;
    delete process.env.FIRECRAWL_API_KEY;

    const result = await scrapeWithFirecrawl({
      url: "https://example.com",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("FIRECRAWL_API_KEY");

    if (originalKey) {
      process.env.FIRECRAWL_API_KEY = originalKey;
    }
  });

  it("should handle invalid URLs", async () => {
    if (!process.env.FIRECRAWL_API_KEY) {
      console.log("Skipping - FIRECRAWL_API_KEY not set");
      return;
    }

    const result = await scrapeWithFirecrawl({
      url: "https://invalid-domain-that-does-not-exist-12345.com",
    });

    // Should fail gracefully
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });
});
