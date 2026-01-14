import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, getCheckoutSession } from "@/lib/stripe";
import { calculateShipping } from "@/lib/woocommerce";
import { sanitizeString, sanitizeObjectKeys, validateBodySize } from "@/lib/sanitize";
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
    const { checkoutSessionId, shippingDetails } = body;

    // Validate and sanitize checkout session ID
    if (!checkoutSessionId || typeof checkoutSessionId !== "string") {
      return NextResponse.json(
        { error: "checkoutSessionId is required and must be a string" },
        { status: 400 }
      );
    }

    const sanitizedSessionId = sanitizeString(checkoutSessionId);

    // Validate session ID format (Stripe session IDs start with cs_)
    if (
      !sanitizedSessionId.startsWith("cs_") ||
      sanitizedSessionId.length < 10 ||
      sanitizedSessionId.length > 200
    ) {
      return NextResponse.json({ error: "Invalid checkout session ID format" }, { status: 400 });
    }

    // Validate shipping details structure
    if (!shippingDetails || typeof shippingDetails !== "object") {
      return NextResponse.json(
        { error: "shippingDetails is required and must be an object" },
        { status: 400 }
      );
    }

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
        ? sanitizeString(String(address.postal_code)).substring(0, 20)
        : undefined,
      city: address.city ? sanitizeString(String(address.city)).substring(0, 100) : undefined,
      line1: address.line1 ? sanitizeString(String(address.line1)).substring(0, 200) : undefined,
      line2: address.line2 ? sanitizeString(String(address.line2)).substring(0, 200) : undefined,
    };

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
            const product = item.price.product as any;
            productId =
              product.metadata?.product_id ||
              product.metadata?.woocommerce_product_id ||
              product.metadata?.product_id;
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

    // Calculate shipping using WooCommerce
    console.log("Calculating shipping for:", {
      country: sanitizedAddress.country,
      state: sanitizedAddress.state,
      postcode: sanitizedAddress.postal_code,
      city: sanitizedAddress.city,
      products,
    });

    let shippingCalculation;
    try {
      shippingCalculation = await calculateShipping({
        country: sanitizedAddress.country,
        state: sanitizedAddress.state,
        postcode: sanitizedAddress.postal_code,
        city: sanitizedAddress.city,
        products,
      });

      console.log("Shipping calculation result:", shippingCalculation);
    } catch (shippingError: unknown) {
      const errorObj = shippingError as { message?: string };
      console.error("WooCommerce shipping calculation failed:", {
        error: errorObj?.message,
        stack: shippingError instanceof Error ? shippingError.stack : undefined,
        address: {
          country: sanitizedAddress.country,
          state: sanitizedAddress.state,
          postcode: sanitizedAddress.postal_code,
        },
      });

      // Provide fallback shipping options if WooCommerce calculation fails
      const fallbackRates = [
        {
          method_id: "fallback_standard",
          method_title: "Standard Shipping",
          cost: "10.00", // Default fallback cost
          estimated_delivery: "5-7 business days",
        },
      ];

      console.warn("Using fallback shipping rates due to calculation error");
      shippingCalculation = {
        zone_id: 0,
        zone_name: "Default",
        rates: fallbackRates,
        total_weight: "0.00",
        error: "WooCommerce calculation failed, using fallback rates",
      };
    }

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
    // Extract name if provided (sanitize it)
    const name = shippingDetails.name || address.name;
    const sanitizedName =
      name && typeof name === "string" ? sanitizeString(name).substring(0, 200) : "";

    const shippingDetailsUpdate: Stripe.Checkout.SessionUpdateParams.CollectedInformation.ShippingDetails =
      {
        name: sanitizedName,
        address: {
          line1: sanitizedAddress.line1 || "",
          line2: sanitizedAddress.line2,
          city: sanitizedAddress.city || "",
          state: sanitizedAddress.state || "",
          postal_code: sanitizedAddress.postal_code || "",
          country: sanitizedAddress.country,
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
