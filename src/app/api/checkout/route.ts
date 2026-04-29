import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { env } from "@/lib/env";
import { getRequestId, logger } from "@/lib/logging/logger";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import {
  sanitizeString,
  sanitizeEmail,
  sanitizeInteger,
  sanitizeNumber,
  sanitizeObjectKeys,
  validateBodySize,
} from "@/lib/sanitize";
import { checkoutBodySchema } from "@/lib/schemas/checkout";
import { getShippingRates } from "@/lib/shipping";
import { createEmbeddedCheckoutSession, stripe } from "@/lib/stripe";
import type { CheckoutApiResponse, ErrorApiResponse } from "@/lib/types";
import { getProduct } from "@/lib/woocommerce/products";

// Maximum request body size (1MB)
const MAX_BODY_SIZE = 1024 * 1024;

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP, "checkout");
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many checkout attempts. Please wait and try again.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.reset),
          },
        }
      );
    }

    // Get raw body text for size validation
    const bodyText = await request.text();
    validateBodySize(bodyText, MAX_BODY_SIZE);

    // Parse and sanitize body
    const body = sanitizeObjectKeys(JSON.parse(bodyText));
    const parsed = checkoutBodySchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid checkout request";
      return NextResponse.json({ error: String(message) }, { status: 400 });
    }
    const { items, customerEmail, shippingAddress, selectedShippingRate } = parsed.data;

    // Validate and sanitize items structure
    const sanitizedItems = items.map((item: unknown, index: number) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Invalid item at index ${index}: must be an object`);
      }

      const sanitizedItem = sanitizeObjectKeys(item as Record<string, unknown>);

      if (!sanitizedItem.id || !sanitizedItem.name) {
        throw new Error(`Invalid item at index ${index}: id and name are required`);
      }

      // Sanitize and validate fields
      const id = sanitizeInteger(sanitizedItem.id, 1);
      const name = sanitizeString(String(sanitizedItem.name));
      const price = sanitizeNumber(sanitizedItem.price, 0, 1000000); // Max $10,000 per item
      const quantity = sanitizeInteger(sanitizedItem.quantity, 1, 100); // Max 100 per item

      if (name.length === 0 || name.length > 500) {
        throw new Error(
          `Invalid item name at index ${index}: must be between 1 and 500 characters`
        );
      }

      const virtual =
        typeof sanitizedItem.virtual === "boolean"
          ? sanitizedItem.virtual
          : undefined;
      const categories = Array.isArray(sanitizedItem.categories)
        ? (sanitizedItem.categories as Array<{ slug?: unknown }>)
            .slice(0, 50)
            .map((c) => ({ slug: c?.slug != null ? sanitizeString(String(c.slug)) : undefined }))
        : undefined;

      return {
        id,
        name,
        price,
        quantity,
        image: sanitizedItem.image ? sanitizeString(String(sanitizedItem.image)) : undefined,
        sku: sanitizedItem.sku ? sanitizeString(String(sanitizedItem.sku)) : undefined,
        virtual,
        categories,
      };
    });

    // Sanitize customer email if provided
    let sanitizedEmail: string | undefined;
    if (customerEmail) {
      try {
        sanitizedEmail = sanitizeEmail(String(customerEmail));
      } catch {
        return NextResponse.json({ error: "Invalid email address format" }, { status: 400 });
      }
    }

    // Shipping-first flow: validate and sanitize shippingAddress + selectedShippingRate when both provided
    let preselectedShipping: { address: { country: string; postal_code: string; state?: string; city?: string; line1?: string; line2?: string; name?: string }; shippingOption: { method_id: string; method_title: string; cost: string; estimated_delivery?: string } } | undefined;
    if (shippingAddress && selectedShippingRate) {
      if (typeof shippingAddress !== "object" || typeof selectedShippingRate !== "object") {
        return NextResponse.json(
          { error: "shippingAddress and selectedShippingRate must be objects" },
          { status: 400 }
        );
      }
      const addr = sanitizeObjectKeys(shippingAddress as Record<string, unknown>);
      const country = sanitizeString(String(addr.country ?? "")).toUpperCase();
      const postal_code = sanitizeString(String(addr.postal_code ?? "")).trim().substring(0, 20);
      if (country.length !== 2 || !/^[A-Z]{2}$/.test(country)) {
        return NextResponse.json({ error: "Valid shipping country (2-letter code) is required" }, { status: 400 });
      }
      if (!postal_code) {
        return NextResponse.json({ error: "Shipping postal code is required" }, { status: 400 });
      }
      const rate = sanitizeObjectKeys(selectedShippingRate as Record<string, unknown>);
      const method_id = sanitizeString(String(rate.method_id ?? "")).substring(0, 100);
      const method_title = sanitizeString(String(rate.method_title ?? "Standard Shipping")).substring(0, 200);
      const cost = String(rate.cost ?? "0");
      if (!method_id) {
        return NextResponse.json({ error: "selectedShippingRate.method_id is required" }, { status: 400 });
      }
      preselectedShipping = {
        address: {
          country,
          postal_code,
          state: addr.state ? sanitizeString(String(addr.state)).substring(0, 100) : undefined,
          city: addr.city ? sanitizeString(String(addr.city)).substring(0, 100) : undefined,
          line1: addr.line1 ? sanitizeString(String(addr.line1)).substring(0, 200) : undefined,
          line2: addr.line2 ? sanitizeString(String(addr.line2)).substring(0, 200) : undefined,
          name: addr.name ? sanitizeString(String(addr.name)).substring(0, 200) : undefined,
        },
        shippingOption: {
          method_id,
          method_title,
          cost,
          estimated_delivery: rate.estimated_delivery ? sanitizeString(String(rate.estimated_delivery)).substring(0, 100) : undefined,
        },
      };
    }

    if (preselectedShipping) {
      const recalculatedShipping = await getShippingRates({
        country: preselectedShipping.address.country,
        state: preselectedShipping.address.state,
        postcode: preselectedShipping.address.postal_code,
        city: preselectedShipping.address.city,
        products: sanitizedItems.map((item) => ({ id: item.id, quantity: item.quantity })),
      });
      const selectedRate = recalculatedShipping.rates.find(
        (rate) => rate.method_id === preselectedShipping?.shippingOption.method_id
      );
      if (!selectedRate) {
        return NextResponse.json(
          { error: "Selected shipping method is no longer available. Please refresh shipping options." },
          { status: 400 }
        );
      }
      const selectedCost = Number.parseFloat(preselectedShipping.shippingOption.cost || "0");
      const verifiedCost = Number.parseFloat(selectedRate.cost || "0");
      if (!Number.isFinite(selectedCost) || !Number.isFinite(verifiedCost)) {
        return NextResponse.json(
          { error: "Shipping rate validation failed. Please refresh shipping options." },
          { status: 400 }
        );
      }
      if (Math.abs(selectedCost - verifiedCost) > 0.01) {
        return NextResponse.json(
          { error: "Shipping cost has changed. Please refresh shipping options and try again." },
          { status: 400 }
        );
      }
      preselectedShipping.shippingOption = {
        method_id: selectedRate.method_id,
        method_title: selectedRate.method_title,
        cost: selectedRate.cost,
        estimated_delivery: selectedRate.estimated_delivery,
      };
    }

    // Build return URL - use validated environment variable
    let baseUrl = env.NEXT_PUBLIC_SITE_URL;

    // In development, try to get the origin from the request headers if available
    if (process.env.NODE_ENV === "development" && !baseUrl.includes("localhost")) {
      // If NEXT_PUBLIC_SITE_URL is not set to localhost, try to infer from request
      const origin = request.headers.get("origin") || request.headers.get("referer");
      if (origin) {
        try {
          const url = new URL(origin);
          baseUrl = `${url.protocol}//${url.host}`;
        } catch {
          // Fall back to validated env var
        }
      }
    }

    const returnUrl = `${baseUrl}/checkout?session_id={CHECKOUT_SESSION_ID}`;

    // Validate cart against WooCommerce source-of-truth to prevent stale price/stock checkouts.
    await Promise.all(
      sanitizedItems.map(async (item) => {
        const liveProduct = await getProduct(item.id);
        const livePrice = Number.parseFloat(liveProduct.price);
        const requestedPrice = Number.parseFloat(item.price.toFixed(2));
        if (!Number.isFinite(livePrice)) {
          throw new Error(`Product ${item.id} has invalid live price data`);
        }
        if (Math.abs(livePrice - requestedPrice) > 0.01) {
          throw new Error(`Cart data is stale for product ${item.id}. Please refresh and try again.`);
        }
        if (liveProduct.stock_status === "outofstock") {
          throw new Error(`Product ${item.id} is out of stock. Please refresh your cart.`);
        }
        if (
          typeof liveProduct.stock_quantity === "number" &&
          liveProduct.stock_quantity >= 0 &&
          item.quantity > liveProduct.stock_quantity
        ) {
          throw new Error(`Product ${item.id} quantity is no longer available.`);
        }
      })
    );

    // Get logo URL from environment or use default
    const logoUrl = env.STRIPE_LOGO_URL || "/Rockited_Logo_For_Dark_BKGRND.png";

    // Check if Stripe Tax should be enabled
    // Set STRIPE_TAX_ENABLED=false in .env if you haven't enabled Stripe Tax in dashboard yet
    const taxEnabled = env.STRIPE_TAX_ENABLED !== false;

    // Create checkout session with options
    const computedIdempotencyKey = createHash("sha256")
      .update(
        JSON.stringify({
          items: sanitizedItems,
          customerEmail: sanitizedEmail ?? null,
          shippingAddress: shippingAddress ?? null,
          selectedShippingRate: selectedShippingRate ?? null,
        })
      )
      .digest("hex")
      .slice(0, 64);
    const providedIdempotencyKey = sanitizeString(
      request.headers.get("idempotency-key") || request.headers.get("x-idempotency-key") || ""
    ).slice(0, 128);

    const sessionOptions = {
      customerEmail: sanitizedEmail,
      ...(preselectedShipping ? { preselectedShipping } : {}),
      allowPromotionCodes: true,
      taxEnabled,
      allowedCountries: ["US"],
      brandingLogoUrl: logoUrl,
      idempotencyKey: providedIdempotencyKey || computedIdempotencyKey,
    };

    let session;
    try {
      session = await createEmbeddedCheckoutSession(sanitizedItems, returnUrl, sessionOptions);
    } catch (error: unknown) {
      const errorObj = error as { message?: string; type?: string; code?: string };
      if (errorObj.message?.includes("tax") || errorObj.type === "StripeInvalidRequestError") {
        logger.error("checkout_tax_error", {
          requestId,
          route: "/api/checkout",
          message: errorObj.message,
          type: errorObj.type,
          code: errorObj.code,
        });
        if (taxEnabled && errorObj.message?.includes("tax")) {
          logger.warn("checkout_tax_retry_without_tax", { requestId, route: "/api/checkout" });
          try {
            session = await createEmbeddedCheckoutSession(sanitizedItems, returnUrl, {
              ...sessionOptions,
              taxEnabled: false,
            });
          } catch (retryError: unknown) {
            throw retryError;
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // When shipping was preselected, update session with collected_information.shipping_details so Stripe has the address and correct total
    if (preselectedShipping && session) {
      const addr = preselectedShipping.address;
      await stripe.checkout.sessions.update(session.id, {
        collected_information: {
          shipping_details: {
            name: addr.name ?? "",
            address: {
              line1: addr.line1 ?? "",
              line2: addr.line2 ?? undefined,
              city: addr.city ?? "",
              state: addr.state ?? "",
              postal_code: addr.postal_code,
              country: addr.country,
            },
          },
        },
      });
    }

    // For custom mode Checkout Sessions, we use the session's client_secret directly
    // The PaymentIntent will be created when the payment is confirmed
    if (!session.client_secret) {
      throw new Error("Failed to get client secret from Checkout Session");
    }

    // Verify tax status if enabled
    const taxStatus = session.automatic_tax?.status;
    if (taxEnabled && taxStatus) {
      logger.info("checkout_tax_status", {
        requestId,
        route: "/api/checkout",
        taxStatus,
      });
    }

    const response: CheckoutApiResponse = {
      clientSecret: session.client_secret,
      sessionId: session.id,
      taxEnabled: taxEnabled && !!session.automatic_tax?.enabled,
      taxStatus: session.automatic_tax?.status ?? undefined,
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    // Don't leak internal error details
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error("checkout_failed", {
      requestId,
      route: "/api/checkout",
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return user-friendly error messages
    if (errorMessage.includes("STRIPE_SECRET_KEY")) {
      return NextResponse.json(
        { error: "Payment service not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Validation errors should return 400
    if (
      errorMessage.includes("Invalid") ||
      errorMessage.includes("must be") ||
      errorMessage.includes("stale") ||
      errorMessage.includes("out of stock") ||
      errorMessage.includes("no longer available")
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Include more details in development mode only
    const errorResponse: ErrorApiResponse = {
      error: "Failed to create checkout session. Please try again.",
    };

    if (process.env.NODE_ENV === "development" && error instanceof Error && error.stack) {
      errorResponse.details = error.stack;
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
