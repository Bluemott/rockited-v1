import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { getCityStateByZip } from "@/lib/zipcode/city-state";

/**
 * GET /api/shipping/city-state?zip=90210
 * Returns city/state for a 5-digit US ZIP (Zippopotam). Used for checkout and Shipping Estimator autofill.
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(getClientIP(request), "cityState");
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

    const zip = request.nextUrl.searchParams.get("zip")?.trim().slice(0, 5) ?? "";
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "Valid 5-digit ZIP required" }, { status: 400 });
    }
    const result = await getCityStateByZip(zip);
    if (!result) {
      return NextResponse.json({ city: null, state: null });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ city: null, state: null });
  }
}
