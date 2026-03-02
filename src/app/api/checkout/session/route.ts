import { NextRequest, NextResponse } from "next/server";

import { sanitizeString } from "@/lib/sanitize";
import { getCheckoutSession } from "@/lib/stripe";
import type { CheckoutSessionApiResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionIdParam = searchParams.get("session_id");

    if (!sessionIdParam) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Sanitize session ID (Stripe session IDs are alphanumeric with underscores and hyphens)
    const sessionId = sanitizeString(sessionIdParam);

    // Validate session ID format (Stripe session IDs start with cs_)
    if (!sessionId.startsWith("cs_") || sessionId.length < 10 || sessionId.length > 200) {
      return NextResponse.json({ error: "Invalid session ID format" }, { status: 400 });
    }

    // Retrieve session with expanded line items for order details
    const session = await getCheckoutSession(sessionId, [
      "line_items",
      "customer",
      "payment_intent",
    ]);

    // Extract payment intent ID if available
    let paymentIntentId = null;
    if (session.payment_intent) {
      paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent.id;
    }

    // Transform line_items to match our type
    const lineItems = session.line_items
      ? {
          data:
            session.line_items.data?.map((item) => ({
              id: item.id ?? "",
              description: item.description ?? null,
              amount_total: item.amount_total ?? 0,
              quantity: item.quantity ?? 1,
              price: item.price
                ? {
                    id: item.price.id ?? "",
                    unit_amount: item.price.unit_amount ?? 0,
                    currency: item.price.currency ?? "usd",
                  }
                : {
                    id: "",
                    unit_amount: 0,
                    currency: "usd",
                  },
            })) ?? [],
        }
      : null;

    // Return only necessary data (don't expose sensitive information)
    const response: CheckoutSessionApiResponse = {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status ?? null,
      amount_total: session.amount_total,
      amount_subtotal: session.amount_subtotal,
      currency: session.currency ?? null,
      customer_email: session.customer_email ?? null,
      customer_details: session.customer_details ?? null,
      line_items: lineItems,
      metadata: session.metadata ?? null,
      total_details: session.total_details ?? null,
      payment_intent: paymentIntentId,
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error("Session API error:", {
      message: errorMessage,
      type:
        error instanceof Error && "type" in error ? (error as { type?: string }).type : undefined,
    });

    if (
      errorMessage.includes("Invalid session ID") ||
      errorMessage.includes("No such checkout session")
    ) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
  }
}
