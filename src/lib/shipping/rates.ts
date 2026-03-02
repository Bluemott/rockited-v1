/**
 * Shipping rates orchestrator: Shippo for domestic US (no international, no WooCommerce fallback for US).
 * Same contract as WooCommerce calculateShipping for /api/shipping/calculate and /api/checkout/shipping.
 */

import { derivePackageFromProducts } from "@/lib/shipping/package";
import { isShippoConfigured, getShippoRates } from "@/lib/shippo";
import type { WooShippingCalculation } from "@/lib/types";
import { getProduct } from "@/lib/woocommerce/products";

/** Error message when US destination but Shippo not configured. */
export const SHIPPO_NOT_CONFIGURED_MESSAGE =
  "Shipping is not available at the moment. Please contact us.";

/** Error message when Shippo returns no rates or fails. */
export const SHIPPO_RATES_UNAVAILABLE_MESSAGE =
  "Unable to get shipping rates. Please try again or contact support.";

export interface GetShippingRatesParams {
  country: string;
  state?: string;
  postcode?: string;
  city?: string;
  products: Array<{ id: number; quantity: number }>;
}

/**
 * Get shipping rates: Shippo for domestic US. No international; no WooCommerce fallback for US.
 * Caller must reject non-US with "We only ship domestically within the United States." before calling.
 */
export async function getShippingRates(
  params: GetShippingRatesParams
): Promise<WooShippingCalculation> {
  const country = (params.country || "").toUpperCase().trim();
  const postcode = (params.postcode || "").trim().replace(/\s+/g, "");
  const zip5 = postcode.slice(0, 5);

  if (country === "US" && /^\d{5}$/.test(zip5)) {
    const productDetails = await Promise.all(
      params.products.map(async (item) => {
        const product = await getProduct(item.id);
        return { ...product, quantity: item.quantity };
      })
    );
    const pkg = derivePackageFromProducts(productDetails);

    if (!isShippoConfigured()) {
      // Return a single placeholder rate so ZIP estimator and checkout don't 400 before Shippo is configured
      return {
        zone_id: 0,
        zone_name: "Shippo",
        rates: [
          {
            method_id: "fallback_standard",
            method_title: "Standard Shipping (set SHIPPO_* in .env.local for real rates)",
            cost: "9.99",
            estimated_delivery: "5-7 business days",
          },
        ],
        total_weight: pkg.totalWeight.toFixed(2),
      };
    }

    try {
      const rates = await getShippoRates({
        country,
        state: params.state,
        postcode: zip5,
        city: params.city,
        weightLbs: pkg.weightLbs,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
      });

      if (rates.length > 0) {
        return {
          zone_id: 0,
          zone_name: "Shippo",
          rates,
          total_weight: pkg.totalWeight.toFixed(2),
        };
      }

      throw new Error(SHIPPO_RATES_UNAVAILABLE_MESSAGE);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === SHIPPO_NOT_CONFIGURED_MESSAGE ||
          err.message === SHIPPO_RATES_UNAVAILABLE_MESSAGE)
      ) {
        throw err;
      }
      console.warn("Shippo shipping rates failed:", err);
      throw new Error(SHIPPO_RATES_UNAVAILABLE_MESSAGE);
    }
  }

  if (country === "US") {
    throw new Error("Please enter a valid 5-digit US ZIP code.");
  }

  throw new Error("We only ship domestically within the United States.");
}
