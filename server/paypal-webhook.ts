import express, { Express } from "express";
import { getDb } from "./db";

/**
 * Register PayPal webhook endpoint
 * Handles subscription and payment events from PayPal
 */
export function registerPayPalWebhook(app: Express) {
  // PayPal webhook endpoint
  app.post("/api/paypal/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const event = JSON.parse(req.body.toString());

      console.log("[PayPal Webhook] Event received:", event.event_type);

      // Verify webhook signature (in production, verify with PayPal)
      // For now, accept all events
      if (!event.event_type) {
        return res.status(400).json({ error: "Missing event_type" });
      }

      // Handle different PayPal events
      switch (event.event_type) {
        case "BILLING.SUBSCRIPTION.CREATED":
          await handleSubscriptionCreated(event);
          break;
        case "BILLING.SUBSCRIPTION.UPDATED":
          await handleSubscriptionUpdated(event);
          break;
        case "BILLING.SUBSCRIPTION.CANCELLED":
          await handleSubscriptionCancelled(event);
          break;
        case "PAYMENT.CAPTURE.COMPLETED":
          await handlePaymentCompleted(event);
          break;
        default:
          console.log("[PayPal Webhook] Unhandled event type:", event.event_type);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[PayPal Webhook] Error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(event: any) {
  const db = await getDb();
  if (!db) return;

  const resource = event.resource;
  console.log("[PayPal] Subscription created:", resource.id);

  // In production, update user subscription in database
  // const subscription = {
  //   paypalSubscriptionId: resource.id,
  //   status: resource.status,
  //   planId: resource.plan_id,
  //   createdAt: new Date(),
  // };
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(event: any) {
  const db = await getDb();
  if (!db) return;

  const resource = event.resource;
  console.log("[PayPal] Subscription updated:", resource.id, "Status:", resource.status);

  // In production, update subscription status in database
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(event: any) {
  const db = await getDb();
  if (!db) return;

  const resource = event.resource;
  console.log("[PayPal] Subscription cancelled:", resource.id);

  // In production, mark subscription as cancelled in database
}

/**
 * Handle payment completed event
 */
async function handlePaymentCompleted(event: any) {
  const db = await getDb();
  if (!db) return;

  const resource = event.resource;
  console.log("[PayPal] Payment completed:", resource.id, "Amount:", resource.amount?.value);

  // In production, record payment in database
}
