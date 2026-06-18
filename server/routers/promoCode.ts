import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { promoCodes, promoCodeUsage } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Pricing plans - must match subscription.ts PLANS
const PLANS = [
  { tier: "daily", name: "Daily Pass", amount: 9.99 },
  { tier: "monthly", name: "Monthly Pro", amount: 29.99 },
  { tier: "yearly", name: "Yearly Pro", amount: 199.99 },
];

export const promoCodeRouter = router({
  // Validate promo code (public)
  validate: publicProcedure
    .input(
      z.object({
        code: z.string().min(1),
        tier: z.enum(["daily", "monthly", "yearly"]),
      })
    )
    .query(async ({ input }) => {
      const validation = await db.validatePromoCode(input.code, input.tier);

      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.message || "Invalid promo code",
        });
      }

      const plan = PLANS.find((p) => p.tier === input.tier);
      const originalPrice = plan?.amount || 0;

      let discount = 0;
      if (validation.discountType === "percentage") {
        discount = (originalPrice * validation.discount!) / 100;
      } else {
        discount = validation.discount!;
      }

      const finalPrice = Math.max(0, originalPrice - discount);

      return {
        code: input.code.toUpperCase(),
        originalPrice,
        discount: Math.round(discount * 100) / 100, // Round to 2 decimals
        finalPrice: Math.round(finalPrice * 100) / 100,
        discountPercentage: ((discount / originalPrice) * 100).toFixed(1),
      };
    }),

  // Create promo code (admin only)
  create: adminProcedure
    .input(
      z.object({
        code: z.string().min(3).max(32),
        discountType: z.enum(["percentage", "fixed"]),
        discountValue: z.number().positive(),
        tier: z.enum(["daily", "monthly", "yearly"]),
        maxUses: z.number().optional(),
        expiresAt: z.date().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await db.getPromoCodeByCode(input.code);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Promo code already exists",
        });
      }

      await db.createPromoCode({
        code: input.code.toUpperCase(),
        discountType: input.discountType,
        discountValue: input.discountValue.toString() as any,
        tier: input.tier,
        maxUses: input.maxUses,
        expiresAt: input.expiresAt,
        source: input.source,
        isActive: true,
      });

      return { success: true, message: "Promo code created" };
    }),

  // Get all promo codes (admin only)
  list: adminProcedure.query(async () => {
    const codes = await db.getAllPromoCodes();
    const stats = await Promise.all(
      codes.map(async (code) => ({
        ...code,
        stats: await db.getPromoCodeStats(code.id),
      }))
    );
    return stats;
  }),

  // Get stats for a specific code (admin only)
  getStats: adminProcedure
    .input(z.object({ codeId: z.number() }))
    .query(async ({ input }) => {
      return db.getPromoCodeStats(input.codeId);
    }),

  // Deactivate promo code (admin only)
  deactivate: adminProcedure
    .input(z.object({ codeId: z.number() }))
    .mutation(async ({ input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database unavailable");

      await dbInstance
        .update(promoCodes)
        .set({ isActive: false })
        .where(eq(promoCodes.id, input.codeId));

      return { success: true, message: "Promo code deactivated" };
    }),
});
