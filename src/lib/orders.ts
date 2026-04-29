import type Stripe from "stripe";
import { logger } from "@/lib/logging/logger";

import { stripe } from "./stripe";
import { wooApi } from "./woocommerce";

export interface WooCommerceOrderItem {
  product_id: number;
  quantity: number;
  price?: string;
  name?: string;
  sku?: string;
}

export interface WooCommerceOrderData {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  line_items: WooCommerceOrderItem[];
  meta_data: Array<{
    key: string;
    value: string;
  }>;
  transaction_id?: string;
}

export interface WooOrderCreationOptions {
  stripeEventId?: string;
}

/**
 * Create a WooCommerce order from a Stripe checkout session
 */
export async function createWooCommerceOrder(
  session: Stripe.Checkout.Session,
  options: WooOrderCreationOptions = {}
): Promise<{ id: number; [key: string]: unknown }> {
  try {
    // Retrieve full session details with line items
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items", "customer", "payment_intent"],
    });

    // Extract customer information
    const customerEmail = session.customer_email || session.customer_details?.email || "";
    const customerName = session.customer_details?.name || "";
    const [firstName, ...lastNameParts] = customerName.split(" ") || ["", ""];
    const lastName = lastNameParts.join(" ") || "";

    // Extract billing address
    const billing =
      session.customer_details?.address ||
      ({} as {
        line1?: string | null;
        line2?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
        country?: string | null;
      });
    const shipping =
      ((fullSession as { shipping?: { address?: Record<string, string | null> } }).shipping?.address as {
        line1?: string | null;
        line2?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
        country?: string | null;
      }) ||
      ({} as {
        line1?: string | null;
        line2?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
        country?: string | null;
      });

    // Parse line items
    const lineItems: WooCommerceOrderItem[] = [];

    if (fullSession.line_items?.data) {
      for (const item of fullSession.line_items.data) {
        // Try to extract product ID from metadata or price metadata
        const productId =
          item.price?.metadata?.product_id || item.price?.metadata?.woocommerce_product_id || null;

        if (productId) {
          const numericProductId = parseInt(productId, 10);
          if (!Number.isInteger(numericProductId) || numericProductId <= 0) {
            throw new Error(`Invalid Woo product mapping for session ${session.id} and item ${item.id}`);
          }
          lineItems.push({
            product_id: numericProductId,
            quantity: item.quantity || 1,
            price: ((item.amount_total || 0) / 100).toFixed(2),
          });
        } else {
          throw new Error(
            `Missing Woo product mapping for Stripe line item ${item.id} in session ${session.id}`
          );
        }
      }
    }

    if (lineItems.length === 0) {
      throw new Error(`No valid line items found for session ${session.id}`);
    }

    // Build order data
    const orderData: WooCommerceOrderData = {
      payment_method: "stripe",
      payment_method_title: "Stripe",
      set_paid: session.payment_status === "paid",
      billing: {
        first_name: firstName || "",
        last_name: lastName || "",
        email: customerEmail || "",
        phone: session.customer_details?.phone ?? "",
        address_1: billing.line1 ?? "",
        address_2: billing.line2 ?? "",
        city: billing.city ?? "",
        state: billing.state ?? "",
        postcode: billing.postal_code ?? "",
        country: billing.country ?? "US",
      },
      line_items: lineItems,
      meta_data: [
        {
          key: "_stripe_session_id",
          value: session.id,
        },
        {
          key: "_stripe_payment_intent_id",
          value: (session.payment_intent as string) || "",
        },
        {
          key: "_stripe_customer_id",
          value: (session.customer as string) ?? "",
        },
        ...(options.stripeEventId
          ? [
              {
                key: "_stripe_event_id",
                value: options.stripeEventId,
              },
            ]
          : []),
      ],
      transaction_id: (session.payment_intent as string) ?? session.id,
    };

    // Add shipping address if available
    if (shipping?.line1) {
      orderData.shipping = {
        first_name: firstName || "",
        last_name: lastName || "",
        address_1: shipping.line1 ?? "",
        address_2: shipping.line2 ?? "",
        city: shipping.city ?? "",
        state: shipping.state ?? "",
        postcode: shipping.postal_code ?? "",
        country: shipping.country ?? "US",
      };
    }

    // Create order in WooCommerce
    const response = await wooApi.post("orders", orderData);

    if (response.status === 201) {
      logger.info("order_created", {
        action: "createWooCommerceOrder",
        orderId: response.data.id,
        sessionId: session.id,
      });
      return response.data;
    } else {
      throw new Error(`Failed to create WooCommerce order: ${response.status}`);
    }
  } catch (error: unknown) {
    logger.error("order_create_failed", {
      action: "createWooCommerceOrder",
      error: error instanceof Error ? error.message : "unknown",
    });

    // Log detailed error information
    const err = error as { response?: { status: number; statusText: string; data?: unknown } };
    if (err.response) {
      logger.error("woocommerce_api_error", {
        action: "createWooCommerceOrder",
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
      });
    }

    throw error;
  }
}

/**
 * Check if an order already exists for a given Stripe event ID.
 */
export async function findOrderByStripeEventId(
  eventId: string
): Promise<{ id: number; [key: string]: unknown } | null> {
  try {
    const response = await wooApi.get("orders", {
      meta_key: "_stripe_event_id",
      meta_value: eventId,
      per_page: 1,
    });

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  } catch (error) {
    logger.error("order_lookup_by_event_failed", {
      action: "findOrderByStripeEventId",
      eventId,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw new Error(`Failed to lookup existing Woo order for Stripe event ${eventId}`);
  }
}

/**
 * Check if an order already exists for a given Stripe session ID
 */
export async function findOrderByStripeSessionId(
  sessionId: string
): Promise<{ id: number; [key: string]: unknown } | null> {
  try {
    const response = await wooApi.get("orders", {
      meta_key: "_stripe_session_id",
      meta_value: sessionId,
      per_page: 1,
    });

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  } catch (error) {
    logger.error("order_lookup_by_session_failed", {
      action: "findOrderByStripeSessionId",
      sessionId,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw new Error(`Failed to lookup existing Woo order for Stripe session ${sessionId}`);
  }
}
