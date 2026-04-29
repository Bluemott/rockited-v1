import Stripe from "stripe";
import { logger } from "@/lib/logging/logger";

import { stripe } from "./client";

type StripeSessionCreateParams = NonNullable<
  Parameters<typeof stripe.checkout.sessions.create>[0]
>;
type StripeSessionLineItem = NonNullable<StripeSessionCreateParams["line_items"]>[number];
type StripeAllowedCountry = NonNullable<
  NonNullable<StripeSessionCreateParams["shipping_address_collection"]>["allowed_countries"]
>[number];

// Type definitions for better type safety
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  virtual?: boolean;
  categories?: Array<{ slug?: string }>;
}

/** Shipping option selected by user before creating the session (shipping-first flow). */
export interface PreselectedShippingOption {
  method_id: string;
  method_title: string;
  cost: string;
  estimated_delivery?: string;
}

/** Shipping address collected before creating the session (shipping-first flow). */
export interface PreselectedShippingAddress {
  country: string;
  postal_code: string;
  state?: string;
  city?: string;
  line1?: string;
  line2?: string;
  name?: string;
}

export interface PreselectedShipping {
  address: PreselectedShippingAddress;
  shippingOption: PreselectedShippingOption;
}

export interface CheckoutSessionOptions {
  customerEmail?: string;
  shippingAddressCollection?: boolean;
  /** When set, session is created with one shipping option and no address collection (caller must update session with collected_information.shipping_details). */
  preselectedShipping?: PreselectedShipping;
  allowPromotionCodes?: boolean;
  taxEnabled?: boolean;
  allowedCountries?: string[];
  brandingLogoUrl?: string;
  idempotencyKey?: string;
}

/**
 * Get tax code for a product
 * Uses general merchandise tax code by default
 * Reference: https://docs.stripe.com/tax/tax-codes
 * - txcd_99999999 = General merchandise (default for physical products)
 * - txcd_10101001 = Software as a service
 * - txcd_10101002 = Digital products transferred electronically
 */
export const getTaxCodeForProduct = (product?: {
  virtual?: boolean;
  categories?: Array<{ slug?: string }>;
}): string => {
  // If product info is provided and it's virtual, use digital product tax code
  if (product?.virtual) {
    return "txcd_10101002";
  }

  // Default to general merchandise for physical products
  return "txcd_99999999";
};

/**
 * Create Stripe Checkout Session (hosted page)
 */
export const createCheckoutSession = async (
  cartItems: CartItem[],
  successUrl: string,
  cancelUrl: string,
  options?: CheckoutSessionOptions
): Promise<Stripe.Checkout.Session> => {
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Cart items are required");
  }

  try {
    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: {
            product_id: item.id.toString(),
            sku: item.sku || "",
          },
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Omit payment_method_types to use Dynamic Payment Methods (cards, Apple Pay, Google Pay, Link via Dashboard)
    const sessionParams: StripeSessionCreateParams = {
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        cart_items: JSON.stringify(cartItems),
        source: "rockited_checkout",
      },
    };

    // Add optional parameters
    if (options?.customerEmail) {
      sessionParams.customer_email = options.customerEmail;
    }

    if (options?.shippingAddressCollection) {
      sessionParams.shipping_address_collection = {
        allowed_countries: ["US", "CA"], // Add more countries as needed
      };
    }

    if (options?.allowPromotionCodes) {
      sessionParams.allow_promotion_codes = true;
    }

    const requestOptions = options?.idempotencyKey
      ? { idempotencyKey: options.idempotencyKey }
      : undefined;
    const session = await stripe.checkout.sessions.create(sessionParams, requestOptions);

    return session;
  } catch (error: unknown) {
    const errorObj = error as {
      message?: string;
      type?: string;
      code?: string;
    };
    logger.error("stripe_checkout_session_create_failed", {
      message: errorObj.message,
      type: errorObj.type,
      code: errorObj.code,
    });

    // Provide user-friendly error messages
    if (errorObj.type === "StripeInvalidRequestError") {
      throw new Error("Invalid checkout request. Please try again.");
    } else if (errorObj.type === "StripeAPIError") {
      throw new Error("Payment service temporarily unavailable. Please try again later.");
    }

    throw error;
  }
};

/**
 * Create Stripe Checkout Session for Embedded Checkout.
 */
export const createEmbeddedCheckoutSession = async (
  cartItems: CartItem[],
  returnUrl: string,
  options?: CheckoutSessionOptions
): Promise<Stripe.Checkout.Session> => {
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Cart items are required");
  }

  try {
    const allowedCountries = options?.allowedCountries || ["US"];
    const taxEnabled = options?.taxEnabled ?? true; // Enable tax by default

    const lineItems = cartItems.map((item) => {
      const lineItem: StripeSessionLineItem = {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            metadata: {
              product_id: item.id.toString(),
              sku: item.sku || "",
              woocommerce_product_id: item.id.toString(),
            },
            // Tax code goes on product_data, not price_data
            ...(taxEnabled && { tax_code: getTaxCodeForProduct(item) }),
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
          // Tax behavior goes on price_data
          ...(taxEnabled && { tax_behavior: "exclusive" as const }), // Tax added separately for clear pricing
        },
        quantity: item.quantity,
      };

      return lineItem;
    });

    // Omit payment_method_types to use Dynamic Payment Methods (cards, Apple Pay, Google Pay, Link via Dashboard)
    const sessionParams: StripeSessionCreateParams = {
      ui_mode: "embedded" as unknown as StripeSessionCreateParams["ui_mode"],
      line_items: lineItems,
      mode: "payment",
      return_url: returnUrl,
      metadata: {
        cart_items: JSON.stringify(cartItems),
        source: "rockited_checkout",
      },
    };

    // Add optional parameters
    if (options?.customerEmail) {
      sessionParams.customer_email = options.customerEmail;
    }

    // Preselected shipping (shipping-first flow): one option, no address collection; caller updates session with shipping_details after create
    if (options?.preselectedShipping) {
      const opt = options.preselectedShipping.shippingOption;
      const costCents = Math.round(Math.max(0, parseFloat(opt.cost || "0")) * 100);
      const deliveryMatch = (opt.estimated_delivery || "").match(
        /(\d+)[-–](\d+)\s*(business\s*)?day/i
      );
      const deliveryEstimate =
        deliveryMatch && deliveryMatch[1] && deliveryMatch[2]
          ? {
              minimum: {
                unit: (deliveryMatch[3] ? "business_day" : "day") as "business_day" | "day",
                value: parseInt(deliveryMatch[1], 10),
              },
              maximum: {
                unit: (deliveryMatch[3] ? "business_day" : "day") as "business_day" | "day",
                value: parseInt(deliveryMatch[2], 10),
              },
            }
          : { minimum: { unit: "business_day" as const, value: 3 }, maximum: { unit: "business_day" as const, value: 7 } };

      sessionParams.shipping_options = [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: costCents, currency: "usd" },
            display_name: opt.method_title || "Standard Shipping",
            delivery_estimate: deliveryEstimate,
          },
        },
      ];
      // permissions.update_shipping_details=server_only requires shipping_address_collection to be set
      sessionParams.shipping_address_collection = {
        allowed_countries:
          allowedCountries as StripeAllowedCountry[],
      };
      sessionParams.permissions = {
        update_shipping_details: "server_only",
      };
      // Billing fields shown so we can prefill from shipping (use shipping for billing or fill manually)
      sessionParams.billing_address_collection = "required";
      // Caller updates session with collected_information.shipping_details so address is prefilled; we do not show ShippingAddressElement in UI
    }

    // Enable automatic tax calculation
    // Note: Stripe Tax must be enabled in your Stripe Dashboard for this to work
    if (taxEnabled) {
      sessionParams.automatic_tax = {
        enabled: true,
      };

      // Collect billing address for tax calculation if shipping is not collected
      if (!options?.preselectedShipping) {
        sessionParams.billing_address_collection = "required";
      }
    }

    if (options?.allowPromotionCodes) {
      sessionParams.allow_promotion_codes = true;
    }

    const requestOptions = options?.idempotencyKey
      ? { idempotencyKey: options.idempotencyKey }
      : undefined;
    const session = await stripe.checkout.sessions.create(sessionParams, requestOptions);

    return session;
  } catch (error: unknown) {
    const errorObj = error as {
      message?: string;
      type?: string;
      code?: string;
      param?: string;
      detail?: string;
      raw?: { message?: string };
    };
    logger.error("stripe_embedded_session_create_failed", {
      message: errorObj.message,
      type: errorObj.type,
      code: errorObj.code,
      param: errorObj.param,
      detail: errorObj.detail,
      raw: errorObj.raw,
    });

    // Provide user-friendly error messages with more detail in development
    if (errorObj.type === "StripeInvalidRequestError") {
      const detailedMessage =
        process.env.NODE_ENV === "development"
          ? `Invalid checkout request: ${errorObj.message || "Unknown error"}${errorObj.param ? ` (param: ${errorObj.param})` : ""}`
          : "Invalid checkout request. Please try again.";
      throw new Error(detailedMessage);
    } else if (errorObj.type === "StripeAPIError") {
      throw new Error("Payment service temporarily unavailable. Please try again later.");
    }

    throw error;
  }
};

/**
 * Retrieve Stripe Checkout Session with expanded line items
 */
export const getCheckoutSession = async (
  sessionId: string,
  expand?: string[]
): Promise<Stripe.Checkout.Session> => {
  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  try {
    const expandParams = expand || ["line_items", "customer", "payment_intent"];
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: expandParams,
    });

    return session;
  } catch (error: unknown) {
    const errorObj = error as {
      message?: string;
      type?: string;
      code?: string;
    };
    logger.error("stripe_checkout_session_retrieve_failed", {
      sessionId,
      message: errorObj.message,
      type: errorObj.type,
      code: errorObj.code,
    });

    if (errorObj.type === "StripeInvalidRequestError") {
      throw new Error("Invalid session ID");
    }

    throw error;
  }
};
