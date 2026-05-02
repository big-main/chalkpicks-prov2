import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { pickFeedback, picks } from "../../drizzle/schema";
import { eq, and, desc, avg } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

/**
 * Analyze sentiment of feedback comment using LLM
 */
async function analyzeSentiment(comment: string): Promise<"positive" | "neutral" | "negative"> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with only one word: 'positive', 'neutral', or 'negative'.",
        },
        {
          role: "user",
          content: `Analyze this feedback: "${comment}"`,
        },
      ],
    });

    const content = response.choices[0]?.message.content;
    const contentStr = typeof content === "string" ? content : "";
    const sentiment = contentStr.toLowerCase().trim() || "neutral";
    if (sentiment === "positive" || sentiment === "negative") {
      return sentiment as "positive" | "negative";
    }
    return "neutral";
  } catch (error) {
    console.error("[Feedback] Sentiment analysis failed:", error);
    return "neutral";
  }
}

async function getPicksByRating(limit: number, minFeedback: number, order: "asc" | "desc") {
  const db = await getDb();
  if (!db) return [];

  const [allPicks, allFeedback] = await Promise.all([
    db.select().from(picks),
    db.select().from(pickFeedback),
  ]);

  const feedbackByPickId = new Map<number, typeof allFeedback>();
  for (const fb of allFeedback) {
    const arr = feedbackByPickId.get(fb.pickId) ?? [];
    arr.push(fb);
    feedbackByPickId.set(fb.pickId, arr);
  }

  return allPicks
    .map((pick) => {
      const feedback = feedbackByPickId.get(pick.id) ?? [];
      if (feedback.length < minFeedback) return null;
      const avgRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
      return { ...pick, avgRating, feedbackCount: feedback.length };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => order === "desc" ? b.avgRating - a.avgRating : a.avgRating - b.avgRating)
    .slice(0, limit);
}

export const feedbackRouter = router({
  /**
   * Submit feedback for a pick
   */
  submitFeedback: protectedProcedure
    .input(
      z.object({
        pickId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        wasHelpful: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify pick exists
      const pick = await db.select().from(picks).where(eq(picks.id, input.pickId)).limit(1);
      if (!pick.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pick not found" });
      }

      // Analyze sentiment if comment provided
      let sentiment: "positive" | "neutral" | "negative" = "neutral";
      if (input.comment) {
        sentiment = await analyzeSentiment(input.comment);
      }

      // Check if user already rated this pick
      const existing = await db
        .select()
        .from(pickFeedback)
        .where(and(eq(pickFeedback.pickId, input.pickId), eq(pickFeedback.userId, ctx.user.id)))
        .limit(1);

      if (existing.length) {
        // Update existing feedback
        await db
          .update(pickFeedback)
          .set({
            rating: input.rating,
            comment: input.comment || null,
            sentiment,
            wasHelpful: input.wasHelpful ?? null,
          })
          .where(eq(pickFeedback.id, existing[0]!.id));

        return { success: true, message: "Feedback updated" };
      }

      // Insert new feedback
      await db.insert(pickFeedback).values({
        pickId: input.pickId,
        userId: ctx.user.id,
        rating: input.rating,
        comment: input.comment || null,
        sentiment,
        wasHelpful: input.wasHelpful ?? null,
      });

      return { success: true, message: "Feedback submitted" };
    }),

  /**
   * Get feedback for a specific pick
   */
  getPickFeedback: publicProcedure
    .input(z.object({ pickId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { feedback: [], stats: { avgRating: 0, totalFeedback: 0, positiveCount: 0 } };

      const feedback = await db
        .select()
        .from(pickFeedback)
        .where(eq(pickFeedback.pickId, input.pickId))
        .orderBy(desc(pickFeedback.createdAt));

      // Calculate stats
      const stats = {
        avgRating: feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0,
        totalFeedback: feedback.length,
        positiveCount: feedback.filter((f) => f.sentiment === "positive").length,
        negativeCount: feedback.filter((f) => f.sentiment === "negative").length,
        neutralCount: feedback.filter((f) => f.sentiment === "neutral").length,
      };

      return { feedback, stats };
    }),

  /**
   * Get user's feedback for a pick
   */
  getUserFeedback: protectedProcedure
    .input(z.object({ pickId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const feedback = await db
        .select()
        .from(pickFeedback)
        .where(and(eq(pickFeedback.pickId, input.pickId), eq(pickFeedback.userId, ctx.user.id)))
        .limit(1);

      return feedback.length > 0 ? feedback[0] : null;
    }),

  /**
   * Get feedback analytics for all picks
   */
  getFeedbackAnalytics: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalFeedback: 0, avgRating: 0, sentimentBreakdown: {} };

    const allFeedback = await db.select().from(pickFeedback);

    const avgRating = allFeedback.length > 0 ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length : 0;

    const sentimentBreakdown = {
      positive: allFeedback.filter((f) => f.sentiment === "positive").length,
      neutral: allFeedback.filter((f) => f.sentiment === "neutral").length,
      negative: allFeedback.filter((f) => f.sentiment === "negative").length,
    };

    const ratingDistribution = {
      5: allFeedback.filter((f) => f.rating === 5).length,
      4: allFeedback.filter((f) => f.rating === 4).length,
      3: allFeedback.filter((f) => f.rating === 3).length,
      2: allFeedback.filter((f) => f.rating === 2).length,
      1: allFeedback.filter((f) => f.rating === 1).length,
    };

    return {
      totalFeedback: allFeedback.length,
      avgRating: Math.round(avgRating * 100) / 100,
      sentimentBreakdown,
      ratingDistribution,
    };
  }),

  getTopRatedPicks: publicProcedure
    .input(z.object({ limit: z.number().default(10), minFeedback: z.number().default(3) }))
    .query(({ input }) => getPicksByRating(input.limit, input.minFeedback, "desc")),

  getWorstRatedPicks: publicProcedure
    .input(z.object({ limit: z.number().default(10), minFeedback: z.number().default(3) }))
    .query(({ input }) => getPicksByRating(input.limit, input.minFeedback, "asc")),

  /**
   * Delete feedback (user can delete their own, admin can delete any)
   */
  deleteFeedback: protectedProcedure
    .input(z.object({ feedbackId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const feedback = await db
        .select()
        .from(pickFeedback)
        .where(eq(pickFeedback.id, input.feedbackId))
        .limit(1);

      if (!feedback.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found" });
      }

      // Check authorization
      if (feedback[0]!.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to delete this feedback" });
      }

      await db.delete(pickFeedback).where(eq(pickFeedback.id, input.feedbackId));

      return { success: true, message: "Feedback deleted" };
    }),
});
