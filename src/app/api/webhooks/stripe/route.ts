import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { env } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import {
  createWooCommerceOrder,
  findOrderByStripeEventId,
  findOrderByStripeSessionId,
} from "@/lib/orders";
import { stripe } from "@/lib/stripe";
import type { WebhookApiResponse, ErrorApiResponse } from "@/lib/types";

// Disable body parsing, we need the raw body for signature verification
export const runtime = "nodejs";

// Get raw body for signature verification
async function getRawBody(request: NextRequest): Promise<Buffer> {
  try {
    // For Next.js App Router, we need to read the body as text and convert to buffer
    const text = await request.text();
    return Buffer.from(text);
  } catch {
    throw new Error("Failed to read request body");
  }
}

/**
 * Verify webhook signature to ensure the request is from Stripe
 */
function verifyWebhookSignature(
  payload: Buffer,
  signature: string | null,
  secret: string
): Stripe.Event {
  if (!signature) {
    throw new Error("Missing Stripe-Signature header");
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return event;
  } catch (error: unknown) {
    const errorObj = error as { message?: string };
    logger.error("webhook_signature_verification_failed", {
      route: "/api/webhooks/stripe",
      message: errorObj.message,
    });
    throw new Error(
      `Webhook signature verification failed: ${errorObj.message || "Unknown error"}`
    );
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<void> {
  // Check if order already exists (idempotency)
  const existingOrder = await findOrderByStripeSessionId(session.id);
  if (existingOrder) {
    logger.warn("webhook_dedupe_hit", {
      route: "/api/webhooks/stripe",
      sessionId: session.id,
      existingOrderId: existingOrder.id,
    });
    return;
  }

  // Only create order if payment is successful
  if (session.payment_status === "paid") {
    const order = await createWooCommerceOrder(session, { stripeEventId: eventId });
    logger.info("order_created", {
      route: "/api/webhooks/stripe",
      sessionId: session.id,
      orderId: order.id,
    });
    return;
  }

  logger.warn("webhook_skipped_unpaid_session", {
    route: "/api/webhooks/stripe",
    sessionId: session.id,
    paymentStatus: session.payment_status,
  });
}

/**
 * Handle async payment succeeded event
 */
async function handleAsyncPaymentSucceeded(
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<void> {
  // Check if order exists
  const existingOrder = await findOrderByStripeSessionId(session.id);

  if (!existingOrder) {
    // Create order if it doesn't exist
    await handleCheckoutSessionCompleted(session, eventId);
    return;
  }

  logger.info("webhook_async_payment_succeeded_existing_order", {
    route: "/api/webhooks/stripe",
    sessionId: session.id,
    orderId: existingOrder.id,
  });
}

/**
 * Handle async payment failed event
 */
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session): Promise<void> {
  logger.warn("webhook_async_payment_failed", {
    route: "/api/webhooks/stripe",
    sessionId: session.id,
  });
}

/**
 * Main webhook handler
 */

export async function POST(request: NextRequest) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error("webhook_secret_missing", { route: "/api/webhooks/stripe" });
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  try {
    // Get the signature from headers
    const signature = request.headers.get("stripe-signature");

    // Get raw body for signature verification
    const rawBody = await getRawBody(request);

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(rawBody, signature, webhookSecret);
    } catch (error: unknown) {
      logger.error("webhook_signature_verification_failed", {
        route: "/api/webhooks/stripe",
        error: error instanceof Error ? error.message : "unknown",
      });
      const errorResponse: ErrorApiResponse = {
        error: "Invalid signature",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    logger.info("webhook_verified", { route: "/api/webhooks/stripe", eventId: event.id, type: event.type });
    await processEvent(event);
    const webhookResponse: WebhookApiResponse = { received: true };
    return NextResponse.json(webhookResponse, { status: 200 });
  } catch (error: unknown) {
    logger.error("webhook_processing_failed", {
      route: "/api/webhooks/stripe",
      error: error instanceof Error ? error.message : "unknown",
    });
    const errorResponse: ErrorApiResponse = {
      error: "Webhook processing failed",
    };
    return NextResponse.json(errorResponse, { status: 503 });
  }
}

/**
 * Process webhook event synchronously so non-2xx can trigger Stripe retries.
 */
async function processEvent(event: Stripe.Event): Promise<void> {
  try {
    const eventAlreadyProcessed = await findOrderByStripeEventId(event.id);
    if (eventAlreadyProcessed) {
      logger.warn("webhook_event_already_processed", {
        route: "/api/webhooks/stripe",
        eventId: event.id,
        existingOrderId: eventAlreadyProcessed.id,
      });
      return;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, event.id);
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleAsyncPaymentSucceeded(session, event.id);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleAsyncPaymentFailed(session);
        break;
      }

      default:
        logger.warn("webhook_unhandled_event_type", {
          route: "/api/webhooks/stripe",
          eventId: event.id,
          type: event.type,
        });
    }
  } catch (error: unknown) {
    logger.error("webhook_process_event_failed", {
      route: "/api/webhooks/stripe",
      eventId: event.id,
      type: event.type,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
