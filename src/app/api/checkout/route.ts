import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import {
  sanitizeString,
  sanitizeEmail,
  sanitizeInteger,
  sanitizeNumber,
  sanitizeObjectKeys,
  validateBodySize,
} from "@/lib/sanitize";
import { checkoutBodySchema } from "@/lib/schemas/checkout";
import { createEmbeddedCheckoutSession, stripe } from "@/lib/stripe";
import type { CheckoutApiResponse, ErrorApiResponse } from "@/lib/types";

// Maximum request body size (1MB)
const MAX_BODY_SIZE = 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
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
    const { items, customerEmail, shippingAddress, selectedShippingRate, standardizedAddress } = parsed.data;

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

    // Get logo URL from environment or use default
    const logoUrl = env.STRIPE_LOGO_URL || "/Rockited_Logo_For_Dark_BKGRND.png";

    // Check if Stripe Tax should be enabled
    // Set STRIPE_TAX_ENABLED=false in .env if you haven't enabled Stripe Tax in dashboard yet
    const taxEnabled = env.STRIPE_TAX_ENABLED !== false;

    // Create checkout session with options
    const sessionOptions = {
      customerEmail: sanitizedEmail,
      ...(preselectedShipping
        ? { preselectedShipping }
        : { shippingAddressCollection: true as const }),
      allowPromotionCodes: true,
      taxEnabled,
      allowedCountries: ["US"],
      brandingLogoUrl: logoUrl,
    };

    let session;
    try {
      session = await createEmbeddedCheckoutSession(sanitizedItems, returnUrl, sessionOptions);
    } catch (error: unknown) {
      const errorObj = error as { message?: string; type?: string; code?: string };
      if (errorObj.message?.includes("tax") || errorObj.type === "StripeInvalidRequestError") {
        console.error("Tax configuration error:", {
          message: errorObj.message,
          type: errorObj.type,
          code: errorObj.code,
        });
        if (taxEnabled && errorObj.message?.includes("tax")) {
          console.warn("Tax calculation failed, retrying without tax");
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
      const metadata: Record<string, string> = {
        ...session.metadata,
        shipping_address: JSON.stringify({
          country: addr.country,
          postal_code: addr.postal_code,
          state: addr.state,
          city: addr.city,
          line1: addr.line1,
          line2: addr.line2,
          name: addr.name,
        }),
      };
      if (standardizedAddress && typeof standardizedAddress === "object") {
        const std = sanitizeObjectKeys(standardizedAddress as Record<string, unknown>);
        if (std.line1 || std.city || std.state || std.postal_code) {
          metadata.shipping_address_standardized = JSON.stringify({
            line1: sanitizeString(String(std.line1 ?? "")).substring(0, 200),
            city: sanitizeString(String(std.city ?? "")).substring(0, 100),
            state: sanitizeString(String(std.state ?? "")).substring(0, 10),
            postal_code: sanitizeString(String(std.postal_code ?? "")).replace(/\D/g, "").slice(0, 10),
          });
        }
      }
      await stripe.checkout.sessions.update(session.id, {
        metadata,
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
      console.warn("Tax calculation status:", taxStatus);
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

    console.error("Checkout API error:", {
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
    if (errorMessage.includes("Invalid") || errorMessage.includes("must be")) {
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
