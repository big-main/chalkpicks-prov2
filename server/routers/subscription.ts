import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod/v4";
import { getDb } from "../db";
import { subscriptionOrders, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const PLANS = {
  trial: {
    name: "5-Day Free Trial",
    priceId: "price_trial",
    amountCents: 0,
    description: "Full access for 5 days, payment required",
    features: ["All premium picks daily", "AI analysis & confidence scores", "Backtesting engine", "Bet tracker & analytics", "Leaderboard access"],
    badge: "Free Trial",
    trial: true,
    trialDays: 5,
  },
  credit: {
    name: "$100 Credit Offer",
    priceId: "price_credit",
    amountCents: 500,
    description: "Pay $5, get $100 in account credit",
    features: ["$100 account credit", "Use on any subscription tier", "Valid for 30 days", "No expiration on picks access"],
    badge: "Limited Offer",
    creditOffer: true,
    creditAmount: 10000,
  },
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
      tier: z.enum(["trial", "credit", "daily", "monthly", "yearly"]),
      origin: z.string(),
      promoCode: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const plan = PLANS[input.tier];
      if (!plan) throw new TRPCError({ code: "BAD_REQUEST" });

      // For trial tier, require payment method but charge $0
      const isTrial = input.tier === "trial";
      const isCredit = input.tier === "credit";
      const isRecurring = !isTrial && !isCredit && input.tier !== "daily";
      let finalAmount = plan.amountCents;
      let promoCodeId: string = "";

      // Validate and apply promo code if provided (not for trial or credit)
      if (input.promoCode && !isTrial && !isCredit) {
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
          mode: (isTrial || isCredit) ? "setup" : (isRecurring ? "subscription" : "payment"),
          payment_method_types: ["card"],
          customer_email: ctx.user.email ?? undefined,
          allow_promotion_codes: !isTrial && !isCredit,
          ...(isTrial || isCredit ? {
            // For trial/credit: setup mode to collect payment method
            success_url: `${input.origin}/payment/success?tier=${input.tier}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${input.origin}/pricing`,
          } : {
            // For paid tiers: payment/subscription mode
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
            success_url: `${input.origin}/payment/success?tier=${input.tier}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${input.origin}/pricing`,
          }),
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email ?? "",
            customer_name: ctx.user.name ?? "",
            tier: input.tier,
            promoCodeId: promoCodeId,
          },
        });

        return { url: session.url };
      } catch (err: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    }),

  mySubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { tier: "free", expiresAt: null, isActive: false, accountBalance: 0 };

    const user = await db.select({
      subscriptionTier: users.subscriptionTier,
      subscriptionExpiresAt: users.subscriptionExpiresAt,
      stripeSubscriptionId: users.stripeSubscriptionId,
      accountBalance: users.accountBalance,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    const u = user[0];
    if (!u) return { tier: "free", expiresAt: null, isActive: false, accountBalance: 0 };

    const isActive = u.subscriptionTier !== "free" && (
      !u.subscriptionExpiresAt || u.subscriptionExpiresAt > new Date()
    );

    return {
      tier: u.subscriptionTier,
      expiresAt: u.subscriptionExpiresAt,
      isActive,
      accountBalance: parseFloat(u.accountBalance.toString()),
    };
  }),

  // Called after successful payment
  activate: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      tier: z.enum(["trial", "credit", "daily", "monthly", "yearly"]),
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
      let subscriptionTier = input.tier;
      let accountBalanceToAdd = 0;

      if (input.tier === "trial") {
        expiresAt.setDate(expiresAt.getDate() + 5);
      } else if (input.tier === "credit") {
        // Credit offer: add $100 to account balance, keep existing subscription tier
        accountBalanceToAdd = 10000; // $100 in cents
        subscriptionTier = "free"; // Don't change subscription tier for credit offer
        expiresAt = null as any; // No expiration for credit
      } else if (input.tier === "daily") {
        expiresAt.setDate(expiresAt.getDate() + 1);
      } else if (input.tier === "monthly") {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      // Get current user to preserve existing balance if not credit offer
      const currentUser = await db.select({ accountBalance: users.accountBalance }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const currentBalance = currentUser[0] ? parseFloat(currentUser[0].accountBalance.toString()) : 0;
      const newBalance = currentBalance + accountBalanceToAdd;

      await db.update(users).set({
        ...(input.tier !== "credit" ? { subscriptionTier } : {}),
        ...(input.tier !== "credit" ? { subscriptionExpiresAt: expiresAt } : {}),
        accountBalance: newBalance,
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
        expiresAt: input.tier === "credit" ? null : expiresAt,
      });

      return { success: true, tier: input.tier, expiresAt, accountBalance: newBalance };
    }),
});
