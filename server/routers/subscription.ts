import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod/v4";
import { getDb } from "../db";
import { subscriptionOrders, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const PLANS = {
  daily: {
    name: "Daily Pass",
    priceId: "price_daily",
    amountCents: 999,
    description: "Full access for 24 hours",
    features: ["All premium picks today", "AI analysis & confidence scores", "Player props & live odds", "Email alerts"],
    badge: "Try it out",
  },
  monthly: {
    name: "Monthly Pro",
    priceId: "price_monthly",
    amountCents: 2999,
    description: "Best value for serious bettors",
    features: ["All premium picks daily", "AI picks generator", "Backtesting engine", "Bet tracker & analytics", "Leaderboard access", "Priority email support", "Daily pick alerts"],
    badge: "Most Popular",
    popular: true,
  },
  yearly: {
    name: "Annual Elite",
    priceId: "price_yearly",
    amountCents: 19999,
    description: "Maximum savings for pros",
    features: ["Everything in Monthly", "Early access to new features", "Advanced backtesting", "Custom AI pick generation", "VIP Discord access", "1-on-1 strategy sessions"],
    badge: "Best Value",
    savings: "Save $16/mo",
  },
};

export const subscriptionRouter = router({
  plans: publicProcedure.query(() => PLANS),

  createCheckout: protectedProcedure
    .input(z.object({
      tier: z.enum(["daily", "monthly", "yearly"]),
      origin: z.string(),
      promoCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const plan = PLANS[input.tier];
      if (!plan) throw new TRPCError({ code: "BAD_REQUEST" });

      const isRecurring = input.tier !== "daily";
      let finalAmount = plan.amountCents;
      let promoCodeId: string = "";

      // Validate and apply promo code if provided
      if (input.promoCode) {
        const { validatePromoCode, getPromoCodeByCode } = await import("../db");
        const validation = await validatePromoCode(input.promoCode, input.tier);
        
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: validation.message || "Invalid promo code",
          });
        }

        const promo = await getPromoCodeByCode(input.promoCode);
        if (promo) {
          promoCodeId = promo.id.toString();
          let discount = 0;
          if (validation.discountType === "percentage") {
            discount = Math.round((plan.amountCents * validation.discount!) / 100);
          } else {
            discount = Math.round(validation.discount! * 100);
          }
          finalAmount = Math.max(0, plan.amountCents - discount);
        }
      }

      try {
        const session = await stripe.checkout.sessions.create({
          mode: isRecurring ? "subscription" : "payment",
          payment_method_types: ["card"],
          customer_email: ctx.user.email ?? undefined,
          allow_promotion_codes: true,
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: finalAmount,
                product_data: {
                  name: `ChalkPicks Pro — ${plan.name}`,
                  description: plan.description,
                },
                ...(isRecurring ? { recurring: { interval: input.tier === "monthly" ? "month" : "year" } } : {}),
              },
              quantity: 1,
            },
          ],
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email ?? "",
            customer_name: ctx.user.name ?? "",
            tier: input.tier,
            promoCodeId: promoCodeId,
          },
          success_url: `${input.origin}/payment/success?tier=${input.tier}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${input.origin}/pricing`,
        });

        return { url: session.url };
      } catch (err: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    }),

  mySubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { tier: "free", expiresAt: null, isActive: false };

    const user = await db.select({
      subscriptionTier: users.subscriptionTier,
      subscriptionExpiresAt: users.subscriptionExpiresAt,
      stripeSubscriptionId: users.stripeSubscriptionId,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    const u = user[0];
    if (!u) return { tier: "free", expiresAt: null, isActive: false };

    const isActive = u.subscriptionTier !== "free" && (
      !u.subscriptionExpiresAt || u.subscriptionExpiresAt > new Date()
    );

    return {
      tier: u.subscriptionTier,
      expiresAt: u.subscriptionExpiresAt,
      isActive,
    };
  }),

  // Called after successful payment
  activate: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      tier: z.enum(["daily", "monthly", "yearly"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      let session: Stripe.Checkout.Session | null = null;
      try {
        session = await stripe.checkout.sessions.retrieve(input.sessionId);
      } catch {
        // If Stripe not configured, use mock activation
      }

      const now = new Date();
      let expiresAt = new Date(now);
      if (input.tier === "daily") expiresAt.setDate(expiresAt.getDate() + 1);
      else if (input.tier === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1);
      else expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await db.update(users).set({
        subscriptionTier: input.tier,
        subscriptionExpiresAt: expiresAt,
        stripeSubscriptionId: session?.subscription?.toString() ?? null,
      }).where(eq(users.id, ctx.user.id));

      // Record order
      await db.insert(subscriptionOrders).values({
        userId: ctx.user.id,
        stripeSessionId: input.sessionId,
        stripeSubscriptionId: session?.subscription?.toString() ?? null,
        tier: input.tier,
        status: "active",
        amountCents: PLANS[input.tier].amountCents,
        currency: "usd",
        startsAt: now,
        expiresAt,
      });

      return { success: true, tier: input.tier, expiresAt };
    }),
});
