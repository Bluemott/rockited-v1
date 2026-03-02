import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { isPoBoxAddress, isPoBoxLine } from "@/lib/address/poBox";
import { sanitizeString, sanitizeObjectKeys, validateBodySize } from "@/lib/sanitize";
import { checkoutShippingBodySchema } from "@/lib/schemas/checkout";
import { getShippingRates } from "@/lib/shipping";
import { standardizeAddress, isShippoConfigured } from "@/lib/shippo";
import { stripe, getCheckoutSession } from "@/lib/stripe";
import type { WooShippingRate } from "@/lib/types";

const MAX_BODY_SIZE = 1024 * 1024; // 1MB

/**
 * API endpoint to handle dynamic shipping updates for Stripe Checkout
 * Called by Stripe when customer enters shipping address
 */
export async function POST(request: NextRequest) {
  try {
    // Validate body size
    const bodyText = await request.text();
    validateBodySize(bodyText, MAX_BODY_SIZE);

    // Parse and sanitize body
    const body = sanitizeObjectKeys(JSON.parse(bodyText));
    const parsed = checkoutShippingBodySchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: String(message) }, { status: 400 });
    }
    const { checkoutSessionId: sanitizedSessionId, shippingDetails } = parsed.data;

    // Handle different possible structures from Stripe
    // Stripe may pass address directly or nested under shippingDetails
    let address = null;

    if (shippingDetails?.address) {
      // Address is nested: { shippingDetails: { address: {...} } }
      address = shippingDetails.address;
    } else if (shippingDetails && typeof shippingDetails === "object") {
      // Check if address fields are at the top level of shippingDetails
      if (shippingDetails.country || shippingDetails.postal_code || shippingDetails.line1) {
        address = shippingDetails;
      }
    }

    // Validate address fields
    if (!address) {
      console.error("No address found in shipping details:", {
        shippingDetails,
        hasAddress: !!shippingDetails?.address,
        hasCountry: !!shippingDetails?.country,
        hasPostalCode: !!shippingDetails?.postal_code,
      });
      return NextResponse.json(
        {
          error: "shippingDetails with valid address is required",
          received: shippingDetails,
          hint: "Expected structure: { shippingDetails: { address: { country, postal_code, ... } } }",
        },
        { status: 400 }
      );
    }

    // Validate required address fields
    if (!address.country) {
      console.error("Missing country in shipping address:", address);
      return NextResponse.json(
        {
          error: "Country is required for shipping calculation",
          received: address,
        },
        { status: 400 }
      );
    }

    // Sanitize and validate country code
    const sanitizedCountry = sanitizeString(String(address.country || "")).toUpperCase();

    // Validate country code format (should be 2-letter ISO code)
    if (sanitizedCountry.length !== 2 || !/^[A-Z]{2}$/.test(sanitizedCountry)) {
      return NextResponse.json(
        { error: "Invalid country code format. Must be a 2-letter ISO code." },
        { status: 400 }
      );
    }

    // Sanitize other address fields
    const sanitizedAddress = {
      country: sanitizedCountry,
      state: address.state ? sanitizeString(String(address.state)).substring(0, 100) : undefined,
      postal_code: address.postal_code
        ? sanitizeString(String(address.postal_code)).replace(/\D/g, "").slice(0, 5)
        : undefined,
      city: address.city ? sanitizeString(String(address.city)).substring(0, 100) : undefined,
      line1: address.line1 ? sanitizeString(String(address.line1)).substring(0, 200) : undefined,
      line2: address.line2 ? sanitizeString(String(address.line2)).substring(0, 200) : undefined,
    };

    // Address validation for US addresses (same policy as shipping-first)
    let effectiveAddress = {
      country: sanitizedAddress.country,
      state: sanitizedAddress.state ?? "",
      postal_code: sanitizedAddress.postal_code ?? "",
      city: sanitizedAddress.city ?? "",
      line1: sanitizedAddress.line1 ?? "",
      line2: sanitizedAddress.line2,
    };

    if (sanitizedCountry === "US" && isShippoConfigured()) {
      const line1 = (sanitizedAddress.line1 ?? "").trim();
      const city = (sanitizedAddress.city ?? "").trim();
      const state = (sanitizedAddress.state ?? "").trim().slice(0, 2).toUpperCase();
      const zip5 = (sanitizedAddress.postal_code ?? "").trim().replace(/\D/g, "").slice(0, 5);

      if (line1 && city && state && zip5.length === 5) {
        if (isPoBoxAddress(line1, sanitizedAddress.line2 ?? "")) {
          return NextResponse.json(
            { error: "We don't ship to PO boxes. Please use a street address." },
            { status: 200 }
          );
        }

        const result = await standardizeAddress({
          streetAddress: line1,
          secondaryAddress: (sanitizedAddress.line2 ?? "").trim() || undefined,
          city,
          state,
          ZIPCode: zip5,
        });

        if (result?.ok === false && "serviceUnavailable" in result && result.serviceUnavailable) {
          // Allow through with entered address when validation is temporarily unavailable
        } else if (result?.ok === false) {
          return NextResponse.json(
            { error: "Address could not be verified. Please correct and try again." },
            { status: 200 }
          );
        } else if (result?.ok === true && result.standardized) {
          if (isPoBoxLine(result.standardized.line1)) {
            return NextResponse.json(
              { error: "We don't ship to PO boxes. Please use a street address." },
              { status: 200 }
            );
          }
          effectiveAddress = {
            country: sanitizedCountry,
            state: result.standardized.state,
            postal_code: result.standardized.postal_code,
            city: result.standardized.city,
            line1: result.standardized.line1,
            line2: undefined,
          };
        }
      }
    }

    // Retrieve the checkout session to get line items with expanded products
    const session = await getCheckoutSession(sanitizedSessionId, ["line_items.data.price.product"]);

    if (!session.line_items?.data) {
      return NextResponse.json({ error: "Could not retrieve session line items" }, { status: 400 });
    }

    // Extract products from line items metadata
    const products = session.line_items.data
      .map((item) => {
        let productId: string | null = null;

        // Try to get product ID from expanded product metadata
        if (item.price?.product) {
          if (typeof item.price.product === "object" && "metadata" in item.price.product) {
            const product = item.price.product as { metadata?: Record<string, string> };
            productId =
              product.metadata?.product_id ||
              product.metadata?.woocommerce_product_id ||
              product.metadata?.product_id ||
              null;
          }
        }

        // Fallback: try to get from price metadata
        if (!productId && item.price?.metadata) {
          productId =
            item.price.metadata.product_id || item.price.metadata.woocommerce_product_id || null;
        }

        // Fallback: try to get from line item metadata
        if (!productId && item.description) {
          // Try to extract from description or other fields if needed
          // This is a last resort fallback
        }

        if (!productId) {
          console.warn("Could not find product ID for line item:", item.id);
          return null;
        }

        return {
          id: parseInt(productId, 10),
          quantity: item.quantity || 1,
        };
      })
      .filter((p): p is { id: number; quantity: number } => p !== null);

    if (products.length === 0) {
      return NextResponse.json({ error: "No products found in session" }, { status: 400 });
    }

    // Calculate shipping (Shippo for US + ZIP when configured)
    console.warn("Calculating shipping for:", {
      country: effectiveAddress.country,
      state: effectiveAddress.state,
      postcode: effectiveAddress.postal_code,
      city: effectiveAddress.city,
      products,
    });

    const shippingCalculation = await getShippingRates({
      country: effectiveAddress.country,
      state: effectiveAddress.state,
      postcode: effectiveAddress.postal_code,
      city: effectiveAddress.city,
      products,
    });

    // Validate shipping rates exist
    if (!shippingCalculation.rates || shippingCalculation.rates.length === 0) {
      console.warn("No shipping rates returned, using fallback");
      shippingCalculation.rates = [
        {
          method_id: "fallback_standard",
          method_title: "Standard Shipping",
          cost: "10.00",
          estimated_delivery: "5-7 business days",
        },
      ];
    }

    // Convert WooCommerce shipping rates to Stripe shipping options format
    // Define delivery estimate type inline since Stripe types may not expose it directly
    type DeliveryEstimate = {
      minimum: {
        unit: "business_day" | "day";
        value: number;
      };
      maximum: {
        unit: "business_day" | "day";
        value: number;
      };
    };

    const shippingOptions: Stripe.Checkout.SessionUpdateParams.ShippingOption[] =
      shippingCalculation.rates.map((rate: WooShippingRate) => {
        // Parse estimated delivery string (e.g., "3-5 business days" or "5-7 days")
        let deliveryEstimate: DeliveryEstimate | undefined;

        if (rate.estimated_delivery) {
          const deliveryMatch = rate.estimated_delivery.match(
            /(\d+)[-–](\d+)\s*(business\s*)?day/i
          );
          if (deliveryMatch && deliveryMatch[1] && deliveryMatch[2]) {
            const min = parseInt(deliveryMatch[1], 10);
            const max = parseInt(deliveryMatch[2], 10);
            const unit = deliveryMatch[3] ? "business_day" : "day";

            deliveryEstimate = {
              minimum: {
                unit: unit as "business_day" | "day",
                value: min,
              },
              maximum: {
                unit: unit as "business_day" | "day",
                value: max,
              },
            };
          } else {
            // Default fallback
            deliveryEstimate = {
              minimum: {
                unit: "business_day",
                value: 3,
              },
              maximum: {
                unit: "business_day",
                value: 5,
              },
            };
          }
        }

        // Validate cost is a valid number
        const costValue = parseFloat(rate.cost || "0");
        if (isNaN(costValue) || costValue < 0) {
          console.warn(`Invalid shipping cost for ${rate.method_title}, using 0:`, rate.cost);
        }

        return {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: Math.round(Math.max(0, costValue) * 100), // Convert to cents, ensure non-negative
              currency: "usd",
            },
            display_name: rate.method_title || "Standard Shipping",
            ...(deliveryEstimate && { delivery_estimate: deliveryEstimate }),
          },
        };
      });

    // Build shipping details update for Stripe
    // Extract name if provided (sanitize it); name is on shippingDetails or possibly on address when Stripe sends it
    const name =
      shippingDetails.name ??
      (address && "name" in address ? (address as { name?: string }).name : undefined);
    const sanitizedName =
      name && typeof name === "string" ? sanitizeString(name).substring(0, 200) : "";

    const shippingDetailsUpdate: Stripe.Checkout.SessionUpdateParams.CollectedInformation.ShippingDetails =
      {
        name: sanitizedName,
        address: {
          line1: effectiveAddress.line1 || "",
          line2: effectiveAddress.line2 ?? undefined,
          city: effectiveAddress.city || "",
          state: effectiveAddress.state || "",
          postal_code: effectiveAddress.postal_code || "",
          country: effectiveAddress.country,
        },
      };

    // Update the checkout session with shipping details and options
    const updatedSession = await stripe.checkout.sessions.update(sanitizedSessionId, {
      collected_information: {
        shipping_details: shippingDetailsUpdate,
      },
      shipping_options: shippingOptions,
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error("Shipping update API error:", errorMessage);

    // Validation errors should return 400
    if (
      errorMessage.includes("Invalid") ||
      errorMessage.includes("required") ||
      errorMessage.includes("format")
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Return error in format Stripe expects
    const errorResponse: { error: string; details?: unknown } = {
      error: "Failed to calculate shipping. Please try again.",
    };

    if (process.env.NODE_ENV === "development" && error instanceof Error) {
      errorResponse.details = {
        message: error.message,
        type: "type" in error ? (error as { type?: string }).type : undefined,
        code: "code" in error ? (error as { code?: string }).code : undefined,
        stack: error.stack,
      };
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
