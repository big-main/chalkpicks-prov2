import { describe, it, expect } from "vitest";
import OpenAI from "openai";

describe("AI API Integration", () => {
  it("should validate OpenAI API key", async () => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      const response = await openai.models.list();
      expect(response.data).toBeDefined();
      expect(response.data.length).toBeGreaterThan(0);
      console.log(`✓ OpenAI API key valid. Found ${response.data.length} models`);
    } catch (error: any) {
      throw new Error(`OpenAI API validation failed: ${error.message}`);
    }
  });

  it("should validate Claude API key via OpenRouter", async () => {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
    console.log(`✓ OpenRouter API key valid. Found ${data.data.length} models`);
  });

  it("should validate Anthropic Claude API key directly", async () => {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
    });

    expect(response.ok).toBe(true);
    console.log("✓ Anthropic Claude API key valid");
  });
});
