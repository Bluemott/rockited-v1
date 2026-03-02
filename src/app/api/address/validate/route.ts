import { NextRequest, NextResponse } from "next/server";

import { isPoBoxAddress, isPoBoxLine } from "@/lib/address/poBox";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { addressValidateBodySchema } from "@/lib/schemas/address";
import { standardizeAddress, isShippoConfigured } from "@/lib/shippo";

/**
 * POST /api/address/validate
 * Body: { line1: string, line2?: string, city: string, state: string, postal_code: string }
 * Validates address against Shippo Address Validation API. Returns standardized address if valid.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(getClientIP(request), "addressValidate");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    if (!isShippoConfigured()) {
      console.warn(
        "Address validation: Not configured (missing SHIPPO_API_KEY or Shippo origin address)"
      );
      return NextResponse.json(
        { valid: false, message: "Address validation not configured" },
        { status: 200 }
      );
    }

    const body = await request.json();
    const parsed = addressValidateBodySchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid address fields";
      return NextResponse.json(
        { valid: false, message: String(message) },
        { status: 400 }
      );
    }
    const line1 = parsed.data.line1.trim();
    const line2 = parsed.data.line2?.trim();
    const city = parsed.data.city.trim();
    const state = parsed.data.state.trim();
    const postal_code = parsed.data.postal_code.replace(/\D/g, "").slice(0, 5);

    if (isPoBoxAddress(line1, line2)) {
      return NextResponse.json(
        { valid: false, message: "We don't ship to PO boxes. Please use a street address." },
        { status: 200 }
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.warn("Address validation attempt:", { line1, line2, city, state, postal_code });
    }

    const result = await standardizeAddress({
      streetAddress: line1,
      secondaryAddress: line2 || undefined,
      city,
      state,
      ZIPCode: postal_code,
    });

    if (!result) {
      console.warn("Address validation: Could not verify address");
      return NextResponse.json({
        valid: false,
        message: "Address could not be verified; use as entered.",
      });
    }

    if (result.ok === false && "serviceUnavailable" in result && result.serviceUnavailable === true) {
      return NextResponse.json({
        valid: false,
        validationUnavailable: true,
        message:
          "We couldn't verify this address right now. You can still continue; shipping is calculated by ZIP code.",
      });
    }

    if (result.ok === false) {
      return NextResponse.json({
        valid: false,
        message: "Address could not be verified; use as entered.",
      });
    }

    const standardized = result.standardized;

    if (isPoBoxLine(standardized.line1)) {
      return NextResponse.json(
        { valid: false, message: "We don't ship to PO boxes. Please use a street address." },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      standardized: {
        line1: standardized.line1,
        city: standardized.city,
        state: standardized.state,
        postal_code: standardized.postal_code,
        zipPlus4: standardized.zipPlus4,
      },
    });
  } catch {
    return NextResponse.json(
      { valid: false, message: "Validation failed" },
      { status: 500 }
    );
  }
}
