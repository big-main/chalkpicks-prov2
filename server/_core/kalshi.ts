/**
 * Kalshi API Integration
 * Fetches real-time prediction market data from Kalshi
 * Kalshi is a regulated prediction market platform for event-based trading
 */

export interface KalshiMarket {
  id: string;
  title: string;
  category: string;
  subtitle?: string;
  description?: string;
  yes_price: number; // Current price for YES outcome (0-100)
  no_price: number;  // Current price for NO outcome (0-100)
  volume: number;    // Total trading volume
  open_interest: number;
  created_at: string;
  expiration_date: string;
  status: "open" | "closed" | "expired";
  implied_probability: number; // YES price as probability
}

export interface KalshiMarketAnalysis {
  market: KalshiMarket;
  sharp_money_detected: boolean;
  line_movement: {
    direction: "up" | "down" | "flat";
    change_percentage: number;
  };
  market_sentiment: "bullish" | "bearish" | "neutral";
  trading_signal: "buy_yes" | "buy_no" | "hold" | "avoid";
  confidence_score: number; // 0-100
  reasoning: string;
}

class KalshiService {
  private baseUrl = "https://external-api.kalshi.com/trade-api/v2";
  private apiKey = process.env.KALSHI_API_KEY || "";

  async fetchMarkets(query?: {
    status?: string;
    limit?: number;
  }): Promise<KalshiMarket[]> {
    try {
      const params = new URLSearchParams();
      if (query?.status) params.append("status", query.status);
      if (query?.limit) params.append("limit", String(query.limit));

      const url = `${this.baseUrl}/markets?${params.toString()}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.warn(`[Kalshi] API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      // Transform Kalshi API response to our format
      return (data.markets || []).map((m: any) => {
        const yesBid = m.yes_bid_dollars ? parseFloat(m.yes_bid_dollars) : 0.5;
        const noBid = m.no_bid_dollars ? parseFloat(m.no_bid_dollars) : 0.5;
        const total = yesBid + noBid;
        const yesPercent = total > 0 ? (yesBid / total) * 100 : 50;
        
        return {
          id: m.ticker,
          title: m.title,
          category: "sports",
          subtitle: m.subtitle,
          description: m.rules_primary,
          yes_price: Math.min(99, Math.max(1, yesPercent)),
          no_price: Math.min(99, Math.max(1, 100 - yesPercent)),
          volume: m.volume_fp ? parseInt(m.volume_fp) : 0,
          open_interest: m.open_interest_fp ? parseInt(m.open_interest_fp) : 0,
          created_at: m.created_time,
          expiration_date: m.expiration_time,
          status: m.status === "active" ? "open" : m.status === "closed" ? "closed" : "expired",
          implied_probability: Math.min(99, Math.max(1, yesPercent)),
        };
      });
    } catch (error) {
      console.error("[Kalshi] Failed to fetch markets:", error);
      return [];
    }
  }

  async fetchMarketById(marketId: string): Promise<KalshiMarket | null> {
    try {
      const response = await fetch(`${this.baseUrl}/markets/${marketId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey && { "Authorization": `Bearer ${this.apiKey}` }),
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      const m = data.market;
      
      if (!m) return null;

      const yesBid = m.yes_bid_dollars ? parseFloat(m.yes_bid_dollars) : 0.5;
      const noBid = m.no_bid_dollars ? parseFloat(m.no_bid_dollars) : 0.5;
      const total = yesBid + noBid;
      const yesPercent = total > 0 ? (yesBid / total) * 100 : 50;

      return {
        id: m.ticker,
        title: m.title,
        category: "sports",
        subtitle: m.subtitle,
        description: m.rules_primary,
        yes_price: Math.min(99, Math.max(1, yesPercent)),
        no_price: Math.min(99, Math.max(1, 100 - yesPercent)),
        volume: m.volume_fp ? parseInt(m.volume_fp) : 0,
        open_interest: m.open_interest_fp ? parseInt(m.open_interest_fp) : 0,
        created_at: m.created_time,
        expiration_date: m.expiration_time,
        status: m.status === "active" ? "open" : m.status === "closed" ? "closed" : "expired",
        implied_probability: Math.min(99, Math.max(1, yesPercent)),
      };
    } catch (error) {
      console.error("[Kalshi] Failed to fetch market:", error);
      return null;
    }
  }

  async fetchMarketHistory(marketId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/markets/${marketId}/history`, {
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey && { "Authorization": `Bearer ${this.apiKey}` }),
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error("[Kalshi] Failed to fetch market history:", error);
      return [];
    }
  }

  /**
   * Analyze a Kalshi market for trading signals
   */
  async analyzeMarket(market: KalshiMarket, history?: any[]): Promise<KalshiMarketAnalysis> {
    const impliedProbability = market.yes_price;

    let lineMovement = { direction: "flat" as const, change_percentage: 0 };
    if (history && history.length > 1) {
      const oldPrice = history[0].yes_price || 50;
      const newPrice = history[history.length - 1].yes_price || 50;
      const change = ((newPrice - oldPrice) / oldPrice) * 100;
      lineMovement = {
        direction: change > 1 ? "up" : change < -1 ? "down" : "flat",
        change_percentage: Math.abs(change),
      };
    }

    const sharpMoneyDetected =
      market.volume > 100000 && lineMovement.change_percentage > 5;

    let sentiment: "bullish" | "bearish" | "neutral" = "neutral";
    if (impliedProbability > 60) sentiment = "bullish";
    if (impliedProbability < 40) sentiment = "bearish";

    let signal: "buy_yes" | "buy_no" | "hold" | "avoid" = "hold";
    let confidence = 50;

    if (sharpMoneyDetected) {
      if (lineMovement.direction === "up") {
        signal = "buy_yes";
        confidence = Math.min(75, 50 + lineMovement.change_percentage);
      } else if (lineMovement.direction === "down") {
        signal = "buy_no";
        confidence = Math.min(75, 50 + lineMovement.change_percentage);
      }
    } else if (impliedProbability > 70) {
      signal = "buy_yes";
      confidence = 60;
    } else if (impliedProbability < 30) {
      signal = "buy_no";
      confidence = 60;
    }

    const reasoning = this.generateReasoning(market, sharpMoneyDetected, lineMovement, sentiment);

    return {
      market,
      sharp_money_detected: sharpMoneyDetected,
      line_movement: lineMovement,
      market_sentiment: sentiment,
      trading_signal: signal,
      confidence_score: confidence,
      reasoning,
    };
  }

  private generateReasoning(
    market: KalshiMarket,
    sharpMoney: boolean,
    lineMovement: any,
    sentiment: string
  ): string {
    const parts: string[] = [];

    if (sharpMoney) {
      parts.push(
        `Sharp money detected: ${lineMovement.change_percentage.toFixed(1)}% ${lineMovement.direction} movement with high volume.`
      );
    }

    parts.push(
      `Implied probability: ${market.yes_price.toFixed(1)}% for YES. Market sentiment is ${sentiment}.`
    );

    if (market.volume > 1000000) {
      parts.push("High liquidity market with strong trading activity.");
    }

    return parts.join(" ");
  }

  /**
   * Get open markets
   */
  async getSportsMarkets(): Promise<KalshiMarket[]> {
    return this.fetchMarkets({
      status: "open",
      limit: 50,
    });
  }

  /**
   * Get all open markets
   */
  async getAllMarkets(): Promise<KalshiMarket[]> {
    return this.fetchMarkets({
      status: "open",
      limit: 100,
    });
  }
}

export const kalshiService = new KalshiService();
