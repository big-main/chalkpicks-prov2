/**
 * Firecrawl Web Scraping Service
 * Integrates with Firecrawl API to scrape sports news, odds, and betting data
 */

interface FirecrawlScrapeOptions {
  url: string;
  formats?: string[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  timeout?: number;
}

interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    content: string;
    markdown?: string;
    html?: string;
    metadata?: Record<string, any>;
  };
  error?: string;
}

export async function scrapeWithFirecrawl(
  options: FirecrawlScrapeOptions
): Promise<FirecrawlScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "FIRECRAWL_API_KEY environment variable not set",
    };
  }

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: options.url,
        formats: options.formats || ["markdown", "html"],
        onlyMainContent: options.onlyMainContent ?? true,
        includeTags: options.includeTags,
        excludeTags: options.excludeTags,
        timeout: options.timeout || 30000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Firecrawl API error: ${response.status} - ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: `Firecrawl scraping failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Scrape sports news from ESPN, DraftKings, FanDuel, etc.
 */
export async function scrapeSpotrsNews(source: string): Promise<FirecrawlScrapeResult> {
  const sources: Record<string, string> = {
    espn: "https://www.espn.com/",
    draftkings: "https://www.draftkings.com/",
    fanduel: "https://www.fanduel.com/",
    betmgm: "https://www.betmgm.com/",
  };

  const url = sources[source.toLowerCase()];
  if (!url) {
    return {
      success: false,
      error: `Unknown sports source: ${source}`,
    };
  }

  return scrapeWithFirecrawl({
    url,
    formats: ["markdown"],
    onlyMainContent: true,
  });
}

/**
 * Scrape odds from a betting website
 */
export async function scrapeOdds(url: string): Promise<FirecrawlScrapeResult> {
  return scrapeWithFirecrawl({
    url,
    formats: ["markdown", "html"],
    onlyMainContent: true,
    includeTags: ["table", "div", "span"],
  });
}

/**
 * Extract betting data from scraped content
 */
export function extractBettingData(content: string): Record<string, any> {
  // Simple extraction logic - can be enhanced with NLP/LLM
  const bettingPatterns = {
    odds: /(\d+\.\d+|\-?\d+)/g,
    teams: /([A-Z][a-z]+ [A-Z][a-z]+|[A-Z]{2,3})/g,
    scores: /(\d+)\s*-\s*(\d+)/g,
  };

  return {
    odds: content.match(bettingPatterns.odds) || [],
    teams: content.match(bettingPatterns.teams) || [],
    scores: content.match(bettingPatterns.scores) || [],
    rawContent: content.substring(0, 500), // First 500 chars
  };
}
