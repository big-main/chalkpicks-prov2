import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * PayPal subscription plans
 */
const PAYPAL_PLANS = {
  daily: {
    id: "PLAN_DAILY_PICKS",
    name: "Daily Picks",
    price: 9.99,
    billing_cycle: "DAILY",
  },
  monthly: {
    id: "PLAN_MONTHLY_PICKS",
    name: "Monthly Picks",
    price: 29.99,
    billing_cycle: "MONTHLY",
  },
  yearly: {
    id: "PLAN_YEARLY_PICKS",
    name: "Yearly Picks",
    price: 199.99,
    billing_cycle: "YEARLY",
  },
};

export const paypalRouter = router({
  /**
   * Get available subscription plans
   */
  getPlans: publicProcedure.query(() => {
    return [
      {
        id: "daily",
        name: "Daily Picks",
        price: 9.99,
        billing_cycle: "Daily",
        features: [
          "Daily AI-generated picks",
          "Confidence scores",
          "Live stats",
          "Community leaderboard",
        ],
      },
      {
        id: "monthly",
        name: "Monthly Picks",
        price: 29.99,
        billing_cycle: "Monthly",
        features: [
          "Daily AI-generated picks",
          "Confidence + edge scores",
          "Live stats & player data",
          "Backtesting engine",
          "Community leaderboard",
          "Email alerts",
        ],
      },
      {
        id: "yearly",
        name: "Yearly Picks",
        price: 199.99,
        billing_cycle: "Yearly",
        features: [
          "Daily AI-generated picks",
          "Confidence + edge scores",
          "Live stats & player data",
          "Backtesting engine",
          "Community leaderboard",
          "Email alerts",
          "Priority support",
        ],
      },
    ];
  }),

  /**
   * Create PayPal subscription order
   */
  createOrder: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["daily", "monthly", "yearly"]),
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const plan = PAYPAL_PLANS[input.planId as keyof typeof PAYPAL_PLANS];
      if (!plan) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid plan" });
      }

      // In production, you would create a PayPal order here
      // For now, return a mock PayPal approval URL
      const paypalApprovalUrl = `https://www.paypal.com/checkoutnow?token=EC-MOCK${Date.now()}`;

      return {
        id: `ORDER_${Date.now()}`,
        status: "CREATED",
        links: [
          {
            rel: "approve",
            href: paypalApprovalUrl,
          },
        ],
      };
    }),

  /**
   * Capture PayPal subscription (called after user approves)
   */
  captureSubscription: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        planId: z.enum(["daily", "monthly", "yearly"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production, you would capture the PayPal subscription here
      // For now, return a mock success response

      return {
        success: true,
        subscriptionId: `SUB_${Date.now()}`,
        planId: input.planId,
        status: "ACTIVE",
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    }),

  /**
   * Get user's current subscription
   */
  getUserSubscription: protectedProcedure.query(async ({ ctx }) => {
    // In production, fetch from database
    return {
      planId: "monthly",
      status: "ACTIVE",
      nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      subscriptionId: "SUB_12345",
    };
  }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    // In production, cancel the PayPal subscription
    return {
      success: true,
      message: "Subscription cancelled",
    };
  }),

  /**
   * Handle PayPal webhook (for server-side)
   */
  handleWebhook: publicProcedure
    .input(
      z.object({
        event_type: z.string(),
        resource: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input }) => {
      // Handle different PayPal webhook events
      switch (input.event_type) {
        case "BILLING.SUBSCRIPTION.CREATED":
          console.log("[PayPal] Subscription created:", input.resource);
          break;
        case "BILLING.SUBSCRIPTION.UPDATED":
          console.log("[PayPal] Subscription updated:", input.resource);
          break;
        case "BILLING.SUBSCRIPTION.CANCELLED":
          console.log("[PayPal] Subscription cancelled:", input.resource);
          break;
        case "PAYMENT.CAPTURE.COMPLETED":
          console.log("[PayPal] Payment captured:", input.resource);
          break;
        default:
          console.log("[PayPal] Unhandled event:", input.event_type);
      }

      return { success: true };
    }),
});
