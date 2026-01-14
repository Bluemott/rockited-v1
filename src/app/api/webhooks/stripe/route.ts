import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createWooCommerceOrder, findOrderByStripeSessionId } from "@/lib/orders";
import type Stripe from "stripe";
import type { WebhookApiResponse, ErrorApiResponse } from "@/lib/types";

// Disable body parsing, we need the raw body for signature verification
export const runtime = "nodejs";

// Get raw body for signature verification
async function getRawBody(request: NextRequest): Promise<Buffer> {
  try {
    // For Next.js App Router, we need to read the body as text and convert to buffer
    const text = await request.text();
    return Buffer.from(text);
  } catch (error) {
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
    console.error("Webhook signature verification failed:", errorObj.message);
    throw new Error(
      `Webhook signature verification failed: ${errorObj.message || "Unknown error"}`
    );
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  try {
    // Check if order already exists (idempotency)
    const existingOrder = await findOrderByStripeSessionId(session.id);

    if (existingOrder) {
      console.log(`Order already exists for session ${session.id}: ${existingOrder.id}`);
      return;
    }

    // Only create order if payment is successful
    if (session.payment_status === "paid") {
      const order = await createWooCommerceOrder(session);
      console.log(`✅ Order created successfully: ${order.id} for session ${session.id}`);
    } else {
      console.log(
        `⚠️ Payment not completed for session ${session.id}. Status: ${session.payment_status}`
      );
    }
  } catch (error: unknown) {
    console.error(`Error handling checkout.session.completed for session ${session.id}:`, error);
    // Don't throw - we've already returned 200, log for manual review
    throw error; // Re-throw to trigger retry mechanism
  }
}

/**
 * Handle async payment succeeded event
 */
async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session): Promise<void> {
  try {
    // Check if order exists
    const existingOrder = await findOrderByStripeSessionId(session.id);

    if (!existingOrder) {
      // Create order if it doesn't exist
      await handleCheckoutSessionCompleted(session);
    } else {
      // Update existing order status if needed
      console.log(`Async payment succeeded for session ${session.id}, order ${existingOrder.id}`);
      // You could update the order status here if needed
    }
  } catch (error: unknown) {
    console.error(`Error handling async payment succeeded for session ${session.id}:`, error);
    throw error;
  }
}

/**
 * Handle async payment failed event
 */
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session): Promise<void> {
  try {
    console.log(`⚠️ Async payment failed for session ${session.id}`);
    // You could update order status to failed or pending here
    // For now, just log the event
  } catch (error: unknown) {
    console.error(`Error handling async payment failed for session ${session.id}:`, error);
  }
}

/**
 * Main webhook handler
 */
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
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
      console.error("Webhook signature verification failed:", error);
      const errorResponse: ErrorApiResponse = {
        error: "Invalid signature",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check for replay attacks (timestamp validation)
    const eventAge = Date.now() / 1000 - event.created;
    const fiveMinutes = 5 * 60;

    if (eventAge > fiveMinutes) {
      console.warn(`⚠️ Event ${event.id} is too old (${eventAge}s), possible replay attack`);
      return NextResponse.json({ error: "Event too old" }, { status: 400 });
    }

    // Log the event for debugging
    console.log(`📥 Received webhook event: ${event.type} (ID: ${event.id})`);

    // Handle the event based on type
    // Return 200 quickly, then process asynchronously
    const webhookResponse: WebhookApiResponse = { received: true };
    const response = NextResponse.json(webhookResponse);

    // Process event asynchronously (don't await)
    processEventAsync(event).catch((error) => {
      console.error(`Error processing event ${event.id} asynchronously:`, error);
    });

    return response;
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorResponse: ErrorApiResponse = {
      error: "Webhook processing failed",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Process webhook event asynchronously
 */
async function processEventAsync(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleAsyncPaymentSucceeded(session);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleAsyncPaymentFailed(session);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error: unknown) {
    console.error(`Error processing event ${event.type}:`, error);
    // Re-throw to allow Stripe to retry
    throw error;
  }
}
