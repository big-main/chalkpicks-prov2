import express from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { users, subscriptionOrders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export function registerStripeWebhook(app: express.Application) {
  // MUST be registered BEFORE express.json() middleware
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;

      try {
        if (!sig || !webhookSecret) {
          console.warn("[Webhook] Missing signature or secret — skipping verification");
          event = JSON.parse(req.body.toString()) as Stripe.Event;
        } else {
          const sigHeader = Array.isArray(sig) ? sig[0] : sig;
          event = stripe.webhooks.constructEvent(req.body, sigHeader, webhookSecret);
        }
      } catch (err: any) {
        console.error("[Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Webhook] Received: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseInt(session.metadata?.user_id ?? "0");
            const tier = (session.metadata?.tier ?? "monthly") as "trial" | "credit" | "daily" | "monthly" | "yearly";

            if (!userId) break;

            const db = await getDb();
            if (!db) break;

            const now = new Date();
            let expiresAt = new Date(now);
            let subscriptionTier = tier;
            let accountBalanceToAdd = 0;

            if (tier === "trial") {
              expiresAt.setDate(expiresAt.getDate() + 5);
            } else if (tier === "credit") {
              // Credit offer: add $100 to account balance
              accountBalanceToAdd = 10000; // $100 in cents
              subscriptionTier = "trial";
              expiresAt = null as any;
            } else if (tier === "daily") {
              expiresAt.setDate(expiresAt.getDate() + 1);
            } else if (tier === "monthly") {
              expiresAt.setMonth(expiresAt.getMonth() + 1);
            } else {
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            }

            // Get current balance
            const currentUser = await db.select({ accountBalance: users.accountBalance }).from(users).where(eq(users.id, userId)).limit(1);
            const currentBalance = currentUser[0] ? parseFloat(currentUser[0].accountBalance.toString()) : 0;
            const newBalance = currentBalance + accountBalanceToAdd;

            await db.update(users).set({
              ...(tier !== "credit" ? { subscriptionTier } : {}),
              ...(tier !== "credit" ? { subscriptionExpiresAt: expiresAt } : {}),
              accountBalance: newBalance,
              stripeSubscriptionId: session.subscription?.toString() ?? null,
            }).where(eq(users.id, userId));

            // Record order if not already recorded
            await db.insert(subscriptionOrders).values({
              userId,
              stripeSessionId: session.id,
              stripeSubscriptionId: session.subscription?.toString() ?? null,
              tier,
              status: "active",
              amountCents: session.amount_total ?? 0,
              currency: session.currency ?? "usd",
              startsAt: now,
              expiresAt: tier === "credit" ? null : expiresAt,
            }).catch(() => {
              // Ignore duplicate key errors — already recorded by activate mutation
            });

            console.log(`[Webhook] Activated ${tier} for user ${userId}, new balance: $${(newBalance / 100).toFixed(2)}`);
            break;
          }

          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const db = await getDb();
            if (!db) break;

            // Find user by stripeSubscriptionId and downgrade to free
            const userResult = await db.select().from(users).where(eq(users.stripeSubscriptionId, sub.id)).limit(1);
            if (userResult[0]) {
              await db.update(users).set({
                subscriptionTier: "free",
                subscriptionExpiresAt: null,
                stripeSubscriptionId: null,
              }).where(eq(users.id, userResult[0].id));
              console.log(`[Webhook] Cancelled subscription for user ${userResult[0].id}`);
            }
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            console.warn(`[Webhook] Payment failed for invoice ${invoice.id}`);
            break;
          }

          default:
            console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Webhook] Error processing event:", err);
        return res.status(500).json({ error: "Internal error" });
      }

      return res.json({ received: true });
    }
  );
}
