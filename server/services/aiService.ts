import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface PickAnalysisInput {
  sport: string;
  matchup: string;
  pickType: "moneyline" | "spread" | "over_under" | "player_prop";
  odds: number;
  reasoning?: string;
}

export interface PickAnalysisOutput {
  title: string;
  confidence: number;
  edge: number;
  analysis: string;
  recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
}

/**
 * Generate AI-powered pick analysis using Claude for deep reasoning
 * and OpenAI for quick summaries
 */
export async function generatePickAnalysis(
  input: PickAnalysisInput
): Promise<PickAnalysisOutput> {
  // Use Claude for detailed analysis
  const claudeResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an expert sports betting analyst. Analyze this betting opportunity and provide:
1. Confidence score (0-100)
2. Edge percentage (expected value)
3. Detailed analysis
4. Recommendation (strong_buy, buy, hold, sell, strong_sell)

Sport: ${input.sport}
Matchup: ${input.matchup}
Pick Type: ${input.pickType}
Odds: ${input.odds}
${input.reasoning ? `Initial Reasoning: ${input.reasoning}` : ""}

Respond in JSON format:
{
  "confidence": <number>,
  "edge": <number>,
  "analysis": "<string>",
  "recommendation": "<string>"
}`,
      },
    ],
  });

  let claudeAnalysis;
  try {
    const content = claudeResponse.content[0];
    if (content.type === "text") {
      claudeAnalysis = JSON.parse(content.text);
    }
  } catch (e) {
    console.error("Failed to parse Claude response", e);
    claudeAnalysis = {
      confidence: 50,
      edge: 0,
      analysis: "Analysis unavailable",
      recommendation: "hold",
    };
  }

  // Use OpenAI for title generation
  const titleResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `Generate a concise, catchy title for this sports bet (max 50 chars):
Sport: ${input.sport}
Matchup: ${input.matchup}
Pick Type: ${input.pickType}
Recommendation: ${claudeAnalysis.recommendation}`,
      },
    ],
    max_tokens: 50,
  });

  const title =
    titleResponse.choices[0]?.message?.content || `${input.sport} Pick`;

  return {
    title: title.trim(),
    confidence: claudeAnalysis.confidence || 50,
    edge: claudeAnalysis.edge || 0,
    analysis: claudeAnalysis.analysis || "No analysis available",
    recommendation: claudeAnalysis.recommendation || "hold",
  };
}

/**
 * Generate betting insights using multi-model approach
 */
export async function generateBettingInsights(context: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a sports betting expert providing concise, actionable insights.",
      },
      {
        role: "user",
        content: context,
      },
    ],
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || "No insights available";
}

/**
 * Analyze steam moves (sharp money movement)
 */
export async function analyzeSteamMove(
  sport: string,
  matchup: string,
  lineMovement: string
): Promise<{ isSharpMove: boolean; confidence: number; analysis: string }> {
  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyze if this is a "steam move" (sharp money movement):
Sport: ${sport}
Matchup: ${matchup}
Line Movement: ${lineMovement}

Respond in JSON:
{
  "isSharpMove": <boolean>,
  "confidence": <number 0-100>,
  "analysis": "<string>"
}`,
      },
    ],
  });

  try {
    const content = response.content[0];
    if (content.type === "text") {
      return JSON.parse(content.text);
    }
  } catch (e) {
    console.error("Failed to parse steam move analysis", e);
  }

  return {
    isSharpMove: false,
    confidence: 0,
    analysis: "Analysis unavailable",
  };
}

/**
 * Calculate expected value using AI reasoning
 */
export async function calculateExpectedValue(
  odds: number,
  winProbability: number,
  aiAnalysis?: string
): Promise<{ ev: number; recommendation: string }> {
  // American odds to decimal conversion
  const decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;

  // Basic EV calculation
  const ev = winProbability * decimalOdds - 1;

  // Use AI to refine recommendation
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `Given these betting parameters:
- Odds: ${odds}
- Win Probability: ${winProbability * 100}%
- Expected Value: ${(ev * 100).toFixed(2)}%
${aiAnalysis ? `- AI Analysis: ${aiAnalysis}` : ""}

Should we take this bet? Respond with one word: STRONG_BUY, BUY, HOLD, SELL, or STRONG_SELL`,
      },
    ],
    max_tokens: 20,
  });

  const recommendation =
    response.choices[0]?.message?.content?.toUpperCase() || "HOLD";

  return { ev, recommendation };
}
